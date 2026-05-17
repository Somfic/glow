<script lang="ts">
	import { untrack } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { quartOut } from 'svelte/easing';
	import Icon, { type IconProp, type IconName, resolveIcon } from '../icon/Icon.svelte';
	import ImageCropper from '../input/ImageCropper.svelte';

	type Props = {
		/** Currently picked files. Bindable so the host can read or reset. */
		files?: File[];
		multiple?: boolean;
		/** HTML `accept` string, e.g. "image/*,video/*,application/pdf". */
		accept?: string;
		/** Hard cap on total file count. Excess files are rejected via `onError`. */
		maxFiles?: number;
		/** Per-file byte size cap. Files over the cap are rejected via `onError`. */
		maxSize?: number;
		/** Show preview thumbnails for image/video files below the drop zone. */
		showPreviews?: boolean;
		/** Replaces the default cloud icon if you want something domain-specific. */
		icon?: IconProp;
		/** Bold headline shown when no files are selected. */
		emptyTitle?: string;
		/** Muted line shown under the headline. */
		emptySubtitle?: string;
		/** One-liner shown at the bottom (e.g. "PNG, JPG up to 10MB"). */
		hint?: string;
		onChange?: (files: File[]) => void;
		onError?: (message: string) => void;
		/** When set, image rows can be re-cropped via a built-in cropper using
		 *  this aspect ratio (e.g. `1` for square avatars). `'free'` enables
		 *  crop with no fixed ratio. `false` (default) disables the feature. */
		crop?: false | 'free' | number;
		class?: string;
	};

	let {
		files = $bindable<File[]>([]),
		multiple = true,
		accept,
		maxFiles,
		maxSize,
		showPreviews = true,
		icon = 'CloudUpload',
		emptyTitle = 'Drop files here',
		emptySubtitle = 'or click to browse',
		hint,
		onChange,
		onError,
		crop = 'free',
		class: className
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let dragDepth = $state(0); // counts dragenter/leave to keep state stable while crossing children
	const isDragOver = $derived(dragDepth > 0);
	let cropTarget = $state<{ index: number; url: string } | null>(null);

	/** Each cropped File carries a hidden, non-enumerable reference to its
	 *  pre-crop source via `__original`. Re-cropping the same row reuses that
	 *  source, so successive crops don't compound quality loss or lock the
	 *  user out of widening a previous tight crop. */
	type WithOriginal = File & { __original?: File };

	function openCrop(index: number): void {
		const f = files[index] as WithOriginal | undefined;
		if (!f || !f.type.startsWith('image/')) return;
		const source = f.__original ?? f;
		cropTarget = { index, url: URL.createObjectURL(source) };
	}

	function closeCrop(): void {
		if (cropTarget?.url) URL.revokeObjectURL(cropTarget.url);
		cropTarget = null;
	}

	function onCropConfirm(blob: Blob): void {
		if (!cropTarget) return;
		const idx = cropTarget.index;
		const current = files[idx] as WithOriginal | undefined;
		if (!current) {
			closeCrop();
			return;
		}
		const original = current.__original ?? current;
		const cropped = new File(
			[blob],
			original.name.replace(/\.[^.]+$/, '') + '.jpg',
			{ type: 'image/jpeg' }
		) as WithOriginal;
		// Stash the original so the next crop on this row starts from it,
		// not from the (already-cropped) file. Hidden from enumeration so it
		// doesn't accidentally serialize anywhere.
		Object.defineProperty(cropped, '__original', {
			value: original,
			enumerable: false,
			writable: false,
			configurable: false
		});
		const next = files.slice();
		next[idx] = cropped;
		files = next;
		onChange?.(next);
		closeCrop();
	}

	// Object URLs are recreated whenever `files` changes; keep them in a parallel
	// array and revoke the old ones so we don't leak blobs.
	let previewUrls = $state<string[]>([]);
	$effect(() => {
		const next = files.map((f) => {
			if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
				return URL.createObjectURL(f);
			}
			return '';
		});
		// Revoke whatever we had, then swap in. Read the stale list via
		// `untrack` so we don't read-and-write the same state inside the
		// effect — that would trip Svelte's update-depth guard.
		const stale = untrack(() => previewUrls);
		previewUrls = next;
		queueMicrotask(() => {
			for (const url of stale) if (url) URL.revokeObjectURL(url);
		});
	});

	function fmtSize(bytes: number): string {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
	}

	function fileTypeIcon(f: File): string {
		if (f.type.startsWith('image/')) return 'Image';
		if (f.type.startsWith('video/')) return 'Video';
		if (f.type.startsWith('audio/')) return 'AudioLines';
		if (f.type.includes('pdf')) return 'FileText';
		if (f.type.includes('zip') || f.type.includes('compressed')) return 'FileArchive';
		if (f.type.startsWith('text/')) return 'FileText';
		return 'File';
	}

	function accept_(file: File): boolean {
		if (!accept) return true;
		const tokens = accept
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean);
		const name = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return tokens.some((tok) => {
			if (tok.startsWith('.')) return name.endsWith(tok);
			if (tok.endsWith('/*')) return type.startsWith(tok.slice(0, -1));
			return type === tok;
		});
	}

	function ingest(incoming: File[]): void {
		const accepted: File[] = [];
		const rejected: { file: File; reason: string }[] = [];
		for (const f of incoming) {
			if (!accept_(f)) {
				rejected.push({ file: f, reason: 'type' });
				continue;
			}
			if (maxSize !== undefined && f.size > maxSize) {
				rejected.push({ file: f, reason: 'size' });
				continue;
			}
			accepted.push(f);
		}
		let next = multiple ? [...files, ...accepted] : accepted.slice(-1);
		if (maxFiles !== undefined && next.length > maxFiles) {
			rejected.push(
				...next.slice(maxFiles).map((file) => ({ file, reason: 'count' as const }))
			);
			next = next.slice(0, maxFiles);
		}
		if (rejected.length > 0 && onError) {
			const reason = rejected[0].reason;
			const msg =
				reason === 'type'
					? `${rejected[0].file.name}: file type not accepted`
					: reason === 'size'
						? `${rejected[0].file.name}: exceeds maximum size`
						: `Too many files — only ${maxFiles} allowed`;
			onError(rejected.length === 1 ? msg : `${msg} (+${rejected.length - 1} more)`);
		}
		if (
			next.length !== files.length ||
			next.some((f, i) => f !== files[i])
		) {
			files = next;
			onChange?.(next);
		}
	}

	function onDrop(e: DragEvent): void {
		e.preventDefault();
		dragDepth = 0;
		const list = Array.from(e.dataTransfer?.files ?? []);
		if (list.length > 0) ingest(list);
	}

	function onDragOver(e: DragEvent): void {
		// Required to enable drop. Don't touch dragDepth here — enter/leave do.
		e.preventDefault();
	}

	function onDragEnter(e: DragEvent): void {
		e.preventDefault();
		dragDepth += 1;
	}

	function onDragLeave(e: DragEvent): void {
		e.preventDefault();
		dragDepth = Math.max(0, dragDepth - 1);
	}

	function onPick(e: Event): void {
		const target = e.currentTarget as HTMLInputElement;
		const list = Array.from(target.files ?? []);
		ingest(list);
		target.value = '';
	}

	function remove(idx: number): void {
		const next = files.filter((_, i) => i !== idx);
		files = next;
		onChange?.(next);
	}

	function open(): void {
		inputEl?.click();
	}

	const ic = $derived(resolveIcon(icon));
</script>

<div class={['fu', className].filter(Boolean).join(' ')}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fu-zone"
		class:drag-over={isDragOver}
		role="button"
		tabindex="0"
		ondrop={onDrop}
		ondragover={onDragOver}
		ondragenter={onDragEnter}
		ondragleave={onDragLeave}
		onclick={open}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				open();
			}
		}}
	>
		<input
			bind:this={inputEl}
			type="file"
			class="fu-input"
			{multiple}
			{accept}
			onchange={onPick}
		/>

		<div class="fu-zone-inner">
			<div class="fu-icon-wrap">
				<Icon {...ic} size={ic.size ?? 22} />
			</div>
			<div class="fu-headline">{emptyTitle}</div>
			<div class="fu-sub">{emptySubtitle}</div>
			{#if hint}
				<div class="fu-hint">{hint}</div>
			{/if}
		</div>

		<div class="fu-grab" aria-hidden="true">
			<span></span>
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>

	{#if showPreviews && files.length > 0}
		<div class="fu-list" transition:slide={{ duration: 200, easing: quartOut }}>
			{#each files as f, i (f.name + i)}
				<div
					class="fu-item"
					in:fly={{ y: -4, duration: 180, easing: quartOut }}
					out:slide={{ duration: 160, easing: quartOut }}
				>
					<div class="fu-thumb">
						{#if f.type.startsWith('image/') && previewUrls[i]}
							<img src={previewUrls[i]} alt="" />
						{:else if f.type.startsWith('video/') && previewUrls[i]}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video src={previewUrls[i]} muted></video>
							<span class="fu-thumb-tag"><Icon name="Video" size={11} /></span>
						{:else}
							<span class="fu-thumb-icon">
								<Icon name={fileTypeIcon(f) as IconName} size={20} />
							</span>
						{/if}
					</div>
					<div class="fu-meta">
						<div class="fu-name" title={f.name}>{f.name}</div>
						<div class="fu-size">{fmtSize(f.size)}</div>
					</div>
					<div class="fu-row-actions">
						{#if crop !== false && f.type.startsWith('image/')}
							<button
								type="button"
								class="fu-row-btn"
								title="Crop"
								aria-label="Crop image"
								onclick={(e) => {
									e.stopPropagation();
									openCrop(i);
								}}
							>
								<Icon name="Crop" size={13} />
							</button>
						{/if}
						<button
							type="button"
							class="fu-row-btn"
							title="Remove"
							aria-label="Remove file"
							onclick={(e) => {
								e.stopPropagation();
								remove(i);
							}}
						>
							<Icon name="X" size={13} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if cropTarget}
	<ImageCropper
		src={cropTarget.url}
		aspectRatio={typeof crop === 'number' ? crop : undefined}
		onConfirm={onCropConfirm}
		onCancel={closeCrop}
	/>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.fu {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		width: 100%;
	}

	/* ----- Drop zone ---------------------------------------------------- */

	.fu-zone {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		border-radius: $radius;
		// A real dashed border so it follows `border-radius` cleanly at the
		// corners. Background tints separately so the dash + fill animate
		// independently on drag-over.
		border: 1.5px dashed rgba($fg, 0.18);
		background: color-mix(in oklab, var(--glow-bg-surface-element) 80%, transparent);
		cursor: pointer;
		text-align: center;
		transition:
			border-color var(--glow-dur-fast) $ease-out,
			background-color var(--glow-dur-fast) $ease-out;

		&:hover {
			border-color: var(--glow-primary);
		}

		&.drag-over {
			border-color: var(--glow-primary);
			background: var(--glow-primary-soft);
		}

		&:focus-visible {
			outline: 2px solid var(--glow-primary);
			outline-offset: 2px;
		}
	}

	.fu-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
		pointer-events: none;
	}

	.fu-zone-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		pointer-events: none;
	}

	.fu-icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-bottom: 0.4rem;
		border-radius: 12px;
		background: var(--glow-bg-surface);
		color: var(--glow-fg);
		transition: transform var(--glow-dur-base) $ease-out, color var(--glow-dur-fast) $ease-out;
	}

	.fu-zone.drag-over .fu-icon-wrap {
		color: var(--glow-primary);
		transform: scale(1.05);
	}

	.fu-headline {
		font-size: 0.95rem;
		font-weight: $weight-semibold;
		letter-spacing: -0.005em;
		color: var(--glow-fg);
	}

	.fu-sub {
		font-size: 0.825rem;
		color: rgba($fg, 0.6);
	}

	.fu-hint {
		margin-top: 0.45rem;
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: rgba($fg, 0.4);
	}

	/* ----- Decorative corner grabs -------------------------------------- */
	// Tiny tick marks at each corner, like crop handles. Pure decoration to
	// give the drop zone a touch of character on top of the dashed border.
	.fu-grab {
		position: absolute;
		inset: 0;
		pointer-events: none;

		span {
			position: absolute;
			width: 10px;
			height: 10px;
			border: 2px solid var(--glow-primary);
			opacity: 0;
			transition: opacity var(--glow-dur-fast) $ease-out;

			&:nth-child(1) {
				top: 6px;
				left: 6px;
				border-right: none;
				border-bottom: none;
			}
			&:nth-child(2) {
				top: 6px;
				right: 6px;
				border-left: none;
				border-bottom: none;
			}
			&:nth-child(3) {
				bottom: 6px;
				left: 6px;
				border-right: none;
				border-top: none;
			}
			&:nth-child(4) {
				bottom: 6px;
				right: 6px;
				border-left: none;
				border-top: none;
			}
		}
	}

	.fu-zone.drag-over .fu-grab span {
		opacity: 0.9;
	}

	/* ----- File list ---------------------------------------------------- */

	.fu-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.fu-item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.65rem;
		padding: 0.45rem 0.6rem 0.45rem 0.45rem;
		border-radius: 8px;
		background: var(--glow-bg-surface-element);
		border: 1px solid rgba($fg, 0.06);
		transition: border-color var(--glow-dur-fast) $ease-out, background var(--glow-dur-fast) $ease-out;

		&:hover {
			border-color: rgba($fg, 0.12);
		}
	}

	.fu-thumb {
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		background: rgba($fg, 0.06);
		display: inline-flex;
		align-items: center;
		justify-content: center;

		img,
		video {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.fu-thumb-icon {
		color: rgba($fg, 0.6);
	}

	.fu-thumb-tag {
		position: absolute;
		bottom: 2px;
		right: 2px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
	}

	.fu-meta {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}

	.fu-name {
		font-size: 0.825rem;
		font-weight: $weight-medium;
		color: var(--glow-fg);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.fu-size {
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		color: rgba($fg, 0.5);
	}

	.fu-row-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.fu-row-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		background: transparent;
		color: rgba($fg, 0.55);
		border: none;
		cursor: pointer;
		transition: background var(--glow-dur-fast) $ease-out, color var(--glow-dur-fast) $ease-out;

		&:hover {
			background: rgba($fg, 0.1);
			color: var(--glow-fg);
		}
	}
</style>
