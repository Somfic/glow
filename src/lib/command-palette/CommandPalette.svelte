<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quartOut } from 'svelte/easing';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import Spinner from '../spinner/Spinner.svelte';
	import Skeleton from '../skeleton/Skeleton.svelte';
	import Card from '../card/Card.svelte';
	import { portal } from '../util/portal.js';
	import { lockScroll, unlockScroll } from '../util/scrollLock.js';
	import { commands as defaultRegistry, CommandRegistry } from './registry.svelte.js';
	import { useCommandList, CLOSE_MATCH_KEY, type ScoredCommand } from './useCommandList.svelte.js';
	import CommandRow from './CommandRow.svelte';
	import type { Command, CommandContext } from './types.js';

	type Props = {
		open?: boolean;
		registry?: CommandRegistry;
		placeholder?: string;
		emptyText?: string;
		/** Modifier-aware hotkey letter that opens the palette. Pass `false` to disable. */
		hotkey?: string | false;
	};

	let {
		open = $bindable(false),
		registry = defaultRegistry,
		placeholder = 'Type a command or search…',
		emptyText = 'No matching commands',
		hotkey = ' '
	}: Props = $props();

	let query = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);
	let inputFocused = $state(false);
	/** Mirrors the real input's `selectionStart` so we can place the visible
	 *  caret at the right character offset in the chip display. */
	let inputCaret = $state(0);
	let displayEl = $state<HTMLDivElement | null>(null);
	let caretX = $state(0);
	let caretY = $state(0);
	let caretH = $state(0);
	let caretInsideChip = $state(false);
	let caretBusy = $state(false);
	let caretBusyTimer: ReturnType<typeof setTimeout> | null = null;
	function bumpCaret() {
		caretBusy = true;
		if (caretBusyTimer) clearTimeout(caretBusyTimer);
		caretBusyTimer = setTimeout(() => {
			caretBusy = false;
		}, 500);
	}
	function syncCaret() {
		if (inputEl) inputCaret = inputEl.selectionStart ?? query.length;
		bumpCaret();
	}
	let listEl = $state<HTMLDivElement | null>(null);
	let resultsEl = $state<HTMLDivElement | null>(null);
	let resultsInnerEl = $state<HTMLDivElement | null>(null);
	let levelEl = $state<HTMLDivElement | null>(null);
	let loadingId = $state<string | null>(null);
	let indicatorTop = $state(0);
	let indicatorHeight = $state(0);
	let indicatorReady = $state(false);
	/** Slide direction: +1 = drilling deeper, -1 = popping back. */
	let direction = $state(1);
	let prevDepth = -1;
	/** Width of the results panel — drives the fly distance. */
	let panelWidth = $state(0);
	/** Natural height of the current level's content. */
	let levelHeight = $state(0);
	/** Normalised query — collapses internal whitespace and trims edges so
	 *  scoring, chipize and the visible input display all see a clean form. */
	const cleanQuery = $derived(query.replace(/\s+/g, ' ').trim());

	function close() {
		open = false;
	}

	async function handleSelect(cmd: ScoredCommand) {
		if (!cmd.perform || loadingId) return;
		const ctx: CommandContext = { query, close };
		const result = cmd.perform(ctx);
		if (result instanceof Promise) {
			loadingId = cmd.id;
			try {
				await result;
				close();
			} catch (err) {
				console.error('[CommandPalette] command threw:', err);
			} finally {
				loadingId = null;
			}
		} else {
			close();
		}
	}

	const engine = useCommandList({
		registry: () => registry,
		query: () => query,
		enableDrillIn: true,
		onSelect: handleSelect,
		onClose: close
	});

	type QuerySegment = { text: string; chipIdx: number; start: number };

	/** Chain of commands aligned with the chipIdx values produced by querySegments.
	 *  Index 0 is the group (null — group is just a label, no command), then each
	 *  ancestor in `_path`, then the leaf. Recomputed when the active result changes. */
	const chainCommands = $derived.by<(Command | null)[]>(() => {
		const active = engine.flat[engine.activeIndex];
		if (!active) return [];
		const out: (Command | null)[] = [];
		if (active.group) out.push(null);
		for (const p of active._path) out.push(p);
		out.push(active);
		return out;
	});

	/**
	 * Group runs of the query that map to the same level of the active result's
	 * label chain into chips. Walking left-to-right, each non-space token gets
	 * assigned to the lowest chain entry (≥ the previous match) whose label
	 * contains the token. Whitespace between two same-chain tokens is folded
	 * into the same chip so adjacent words visually merge.
	 */
	const querySegments = $derived.by<QuerySegment[]>(() => {
		if (!query) return [];
		const active = engine.flat[engine.activeIndex];
		if (!active) return [{ text: query, chipIdx: -1, start: 0 }];
		const groupLabel = active.group ?? null;
		const groupIdx = groupLabel ? 0 : -1;
		const chain = [
			...(groupLabel ? [groupLabel] : []),
			...active._path.map((p) => p.label),
			active.label
		].map((l) => l.toLowerCase());
		const raw = query.split(/(\s+)/);
		let cursor = 0;
		const matched: {
			text: string;
			isWord: boolean;
			chipIdx: number;
			start: number;
		}[] = raw.map((text) => {
			const start = cursor;
			cursor += text.length;
			return { text, isWord: /\S/.test(text), chipIdx: -1, start };
		});
		for (const seg of matched) {
			if (!seg.isWord) continue;
			const needle = seg.text.toLowerCase();
			for (let i = 0; i < chain.length; i++) {
				if (chain[i].includes(needle)) {
					seg.chipIdx = i;
					break;
				}
			}
		}
		const canMerge = (a: number, b: number): boolean =>
			a === b || a === groupIdx || b === groupIdx;
		for (let i = 1; i < matched.length - 1; i++) {
			const prev = matched[i - 1];
			const next = matched[i + 1];
			if (
				!matched[i].isWord &&
				prev.chipIdx >= 0 &&
				next.chipIdx >= 0 &&
				canMerge(prev.chipIdx, next.chipIdx)
			) {
				matched[i].chipIdx = prev.chipIdx;
			}
		}
		const out: QuerySegment[] = [];
		for (const seg of matched) {
			const isChip = seg.chipIdx >= 0;
			const last = out[out.length - 1];
			const lastIsChip = !!last && last.chipIdx >= 0;
			if (last && !isChip && !lastIsChip) {
				last.text += seg.text;
				continue;
			}
			if (last && isChip && lastIsChip && canMerge(last.chipIdx, seg.chipIdx)) {
				last.text += seg.text;
				continue;
			}
			out.push({ text: seg.text, chipIdx: seg.chipIdx, start: seg.start });
		}
		return out;
	});

	// Slide direction + query reset + scroll top whenever drill depth changes.
	$effect.pre(() => {
		const depth = engine.path.length;
		if (prevDepth !== -1 && depth !== prevDepth) {
			direction = depth > prevDepth ? 1 : -1;
			query = '';
			if (resultsEl) resultsEl.scrollTop = 0;
			setTimeout(() => inputEl?.focus(), 0);
		}
		prevDepth = depth;
	});

	$effect(() => {
		// Measure caret position relative to the display, paint it as an absolute
		// element that doesn't displace any text.
		void inputCaret;
		void inputFocused;
		void querySegments;
		void cleanQuery;
		if (!displayEl || !inputFocused) {
			caretH = 0;
			return;
		}
		requestAnimationFrame(() => {
			const display = displayEl;
			if (!display) return;
			const wrapRect = display.getBoundingClientRect();
			if (cleanQuery.length === 0) {
				caretX = 0;
				caretY = 0;
				caretH = display.clientHeight;
				caretInsideChip = false;
				return;
			}
			let ownerIdx =
				inputCaret === 0
					? -1
					: querySegments.findIndex(
							(s) => s.start < inputCaret && inputCaret <= s.start + s.text.length
						);
			while (
				ownerIdx >= 0 &&
				querySegments[ownerIdx].chipIdx < 0 &&
				!querySegments[ownerIdx].text.trim()
			) {
				ownerIdx--;
			}
			if (ownerIdx === -1) {
				caretX = 0;
				caretY = 0;
				caretH = display.clientHeight;
				caretInsideChip = false;
				return;
			}
			const seg = querySegments[ownerIdx];
			const segEl = display.querySelector<HTMLElement>(`[data-cp-seg="${ownerIdx}"]`);
			if (!segEl) return;
			let textNode: Text | null = null;
			const walker = document.createTreeWalker(segEl, NodeFilter.SHOW_TEXT);
			let n: Node | null;
			while ((n = walker.nextNode())) textNode = n as Text;
			if (!textNode) {
				const r = segEl.getBoundingClientRect();
				caretX = r.left - wrapRect.left;
				caretY = r.top - wrapRect.top;
				caretH = r.height;
				caretInsideChip = seg.chipIdx >= 0;
				return;
			}
			const offsetInText = Math.min(
				inputCaret - seg.start,
				textNode.textContent?.length ?? 0
			);
			const range = document.createRange();
			range.setStart(textNode, offsetInText);
			range.setEnd(textNode, offsetInText);
			const r = range.getBoundingClientRect();
			caretX = r.left - wrapRect.left;
			caretY = r.top - wrapRect.top;
			caretH = r.height || segEl.getBoundingClientRect().height;
			caretInsideChip = seg.chipIdx >= 0;
		});
	});

	// Scroll results to top on every query change so the new top result is in view.
	$effect(() => {
		void query;
		if (resultsEl) resultsEl.scrollTo({ top: 0, behavior: 'smooth' });
	});

	$effect(() => {
		if (open) {
			query = '';
			loadingId = null;
			indicatorReady = false;
			engine.reset();
			prevDepth = -1;
			lockScroll();
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			unlockScroll();
		}
	});

	function jumpToCrumb(level: number) {
		engine.jumpToCrumb(level);
		query = '';
		inputEl?.focus();
		requestAnimationFrame(() => scrollActiveIntoView());
	}

	function onKeydown(e: KeyboardEvent) {
		if (loadingId) return;
		const handled = engine.handleKey(e);
		if (handled) requestAnimationFrame(() => scrollActiveIntoView());
	}

	function scrollActiveIntoView() {
		queueMicrotask(() => {
			if (!resultsEl) return;
			const idx = engine.activeIndex;
			const len = engine.flat.length;
			if (idx === 0) {
				resultsEl.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			if (idx === len - 1) {
				resultsEl.scrollTo({ top: resultsEl.scrollHeight, behavior: 'smooth' });
				return;
			}
			const activeEl = resultsEl.querySelector<HTMLElement>(`[data-cp-index="${idx}"]`);
			if (!activeEl) return;
			const wrapRect = resultsEl.getBoundingClientRect();
			const itemRect = activeEl.getBoundingClientRect();
			const buffer = itemRect.height;
			const overflowTop = wrapRect.top + buffer - itemRect.top;
			const overflowBottom = itemRect.bottom + buffer - wrapRect.bottom;
			if (overflowTop > 0) {
				resultsEl.scrollBy({ top: -overflowTop, behavior: 'smooth' });
			} else if (overflowBottom > 0) {
				resultsEl.scrollBy({ top: overflowBottom, behavior: 'smooth' });
			}
		});
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	$effect(() => {
		void engine.activeIndex;
		void engine.flat.length;
		void engine.path.length;
		void engine.loadingChildren;
		if (!levelEl) return;
		const lvl = levelEl;
		const idx = engine.activeIndex;
		requestAnimationFrame(() => {
			const el = lvl.querySelector<HTMLElement>(`[data-cp-index="${idx}"]`);
			if (!el) {
				indicatorReady = false;
				return;
			}
			indicatorTop = el.offsetTop;
			indicatorHeight = el.offsetHeight;
			indicatorReady = true;
		});
	});

	$effect(() => {
		if (!resultsEl) return;
		const max = window.innerHeight * 0.5;
		resultsEl.style.height = Math.min(levelHeight, max) + 'px';
	});

	$effect(() => {
		if (typeof window === 'undefined' || hotkey === false || !hotkey) return;
		const wanted = hotkey.toLowerCase();
		const isBareKey = wanted === ' ' || wanted === 'spacebar' || wanted === 'space';
		const onKey = (e: KeyboardEvent) => {
			if (isBareKey) {
				if (e.metaKey || e.ctrlKey || e.altKey) return;
				if (e.key !== ' ' && e.key.toLowerCase() !== wanted) return;
				const t = e.target as HTMLElement | null;
				if (
					t &&
					(t.isContentEditable ||
						t.tagName === 'INPUT' ||
						t.tagName === 'TEXTAREA' ||
						t.tagName === 'SELECT')
				)
					return;
			} else {
				if (!(e.metaKey || e.ctrlKey)) return;
				if (e.key.toLowerCase() !== wanted) return;
			}
			e.preventDefault();
			open = !open;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="cp-overlay"
		use:portal
		role="dialog"
		aria-modal="true"
		aria-label="Command palette"
		tabindex="-1"
		onclick={onBackdropClick}
		transition:fade={{ duration: 120 }}
	>
		<div
			bind:this={listEl}
			class="cp-panel"
			class:has-preview={!!engine.flat[engine.activeIndex]?.preview}
			transition:fly={{ y: -8, duration: 160 }}
			onkeydown={onKeydown}
		>
			<div class="cp-main">
			<div class="cp-search">
				<span class="cp-search-icon"><Icon name="Search" size={16} /></span>
				{#if engine.path.length > 0}
					<div class="cp-crumbs">
						<button type="button" class="cp-crumb cp-crumb-root" onclick={() => jumpToCrumb(-1)}>
							<Icon name="House" size={12} />
						</button>
						{#each engine.path as crumb, i (crumb.id)}
							<span class="cp-crumb-sep"><Icon name="ChevronRight" size={12} /></span>
							<button
								type="button"
								class="cp-crumb"
								class:current={i === engine.path.length - 1}
								onclick={() => jumpToCrumb(i)}
							>{crumb.label}</button>
						{/each}
					</div>
				{/if}
				<div
					class="cp-input-stage"
					onclick={() => inputEl?.focus()}
					role="presentation"
				>
					<div bind:this={displayEl} class="cp-input-display" aria-hidden="true">
						{#if cleanQuery.length === 0 && !inputFocused}
							<span class="cp-input-placeholder">{placeholder}</span>
						{:else}
							{#each querySegments as seg, i (i)}
								{#if seg.chipIdx >= 0}
									{@const chipCmd = chainCommands[seg.chipIdx]}
									<span class="cp-input-chip" data-cp-seg={i}>
										{#if chipCmd?.image}
											<img class="cp-input-chip-image" src={chipCmd.image} alt="" />
										{:else if chipCmd?.icon}
											{@const cic = resolveIcon(chipCmd.icon)}
											<Icon {...cic} size={12} />
										{/if}<span class="cp-input-chip-text">{seg.text}</span>
									</span>
								{:else}
									<span class="cp-input-text" data-cp-seg={i}>{seg.text}</span>
								{/if}
							{/each}
						{/if}
						{#if inputFocused && caretH > 0}
							<span
								class="cp-input-caret"
								class:in-chip={caretInsideChip}
								class:busy={caretBusy}
								style:transform="translate({caretX}px, {caretY}px)"
								style:height="{caretH}px"
							></span>
						{/if}
					</div>
					<input
						bind:this={inputEl}
						value={query}
						class="cp-input"
						type="text"
						autocomplete="off"
						spellcheck="false"
						onfocus={() => {
							inputFocused = true;
							syncCaret();
						}}
						onblur={() => (inputFocused = false)}
						oninput={(e) => {
							const raw = (e.currentTarget as HTMLInputElement).value;
							query = raw.replace(/\s+/g, ' ').replace(/^\s+/, '');
							syncCaret();
						}}
						onkeydown={(e) => {
							if (
								e.key === 'Backspace' &&
								inputEl &&
								inputEl.selectionStart === inputEl.selectionEnd &&
								(inputEl.selectionStart ?? 0) >= 2
							) {
								const pos = inputEl.selectionStart!;
								const prev = query[pos - 1];
								const beforePrev = query[pos - 2];
								const after = query[pos];
								if (
									/\s/.test(prev) &&
									beforePrev !== undefined &&
									!/\s/.test(beforePrev) &&
									(after === undefined || !/\s/.test(after))
								) {
									e.preventDefault();
									const next = query.slice(0, pos - 2) + query.slice(pos);
									query = next;
									requestAnimationFrame(() => {
										if (!inputEl) return;
										inputEl.setSelectionRange(pos - 2, pos - 2);
										syncCaret();
									});
									return;
								}
							}
							const dir =
								e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
							requestAnimationFrame(() => {
								if (!inputEl) return;
								let pos = inputEl.selectionStart ?? 0;
								if (dir === -1) {
									while (pos > 0 && /\s/.test(query[pos - 1])) pos--;
								} else if (dir === 1) {
									while (pos < query.length && /\s/.test(query[pos])) pos++;
								}
								if (pos !== inputEl.selectionStart) {
									inputEl.setSelectionRange(pos, pos);
								}
								syncCaret();
							});
						}}
						onclick={syncCaret}
						onselect={syncCaret}
					/>
				</div>
				{#if engine.loadingParents.size > 0}
					<span class="cp-search-busy" title="Loading more matches…">
						<Spinner size={12} />
					</span>
				{/if}
				<Kbd size="sm">esc</Kbd>
			</div>

			<div bind:this={resultsEl} class="cp-results">
				<div
					bind:this={resultsInnerEl}
					class="cp-results-inner"
					bind:clientWidth={panelWidth}
					style:height="{levelHeight}px"
				>
				{#if engine.flat.length > 0}
					<div
						class="cp-indicator"
						class:ready={indicatorReady}
						style:top="{indicatorTop}px"
						style:height="{indicatorHeight}px"
					></div>
				{/if}
				{#key engine.path.length}
					<div
						class="cp-level"
						bind:this={levelEl}
						bind:offsetHeight={levelHeight}
						in:fly={{ x: direction * (panelWidth || 320), duration: 220, opacity: 1, easing: quartOut }}
						out:fly={{ x: -direction * (panelWidth || 320), duration: 220, opacity: 1, easing: quartOut }}
					>
				{#if engine.loadingChildren}
					{#each Array(4) as _, i (i)}
						<div class="cp-item cp-item-skeleton">
							<span class="cp-item-icon"><Skeleton shape="circle" width={16} /></span>
							<span class="cp-item-text">
								<Skeleton shape="text" width={`${50 + ((i * 17) % 35)}%`} />
							</span>
						</div>
					{/each}
				{:else if engine.flat.length === 0}
					<div class="cp-empty">{emptyText}</div>
				{:else}
					{#each engine.sections as section (section.name)}
						{#if section.name !== CLOSE_MATCH_KEY && (engine.sections.length > 1 || section.name !== 'Other')}
							<div class="cp-section-label">{section.name}</div>
						{/if}
						{#each section.items as cmd, i (cmd._keyId)}
							{@const idx = section.startIndex + i}
							<CommandRow
								{cmd}
								{idx}
								active={idx === engine.activeIndex}
								loading={loadingId === cmd.id}
								busy={loadingId !== null && loadingId !== cmd.id}
								paintActive={false}
								onSelect={() => {
									if (cmd.children) {
										engine.pushLevel(cmd);
									} else {
										handleSelect(cmd);
									}
								}}
								onHover={() => {
									if (!loadingId) engine.activeIndex = idx;
								}}
							/>
						{/each}
					{/each}
				{/if}
					</div>
				{/key}
				</div>
			</div>
			</div>
			{#if engine.flat[engine.activeIndex]?.preview}
				{@const activeCmd = engine.flat[engine.activeIndex]!}
				{@const previewSnippet = activeCmd.preview!}
				<div
					class="cp-preview"
					transition:fly={{ x: 24, duration: 220, opacity: 0, easing: quartOut }}
				>
					<Card
						title={activeCmd.label}
						icon={activeCmd.icon}
						class="cp-preview-card"
						footer={activeCmd.description ? previewFooter : undefined}
					>
						{#key activeCmd._keyId}
							<div class="cp-preview-content" in:fade={{ duration: 120 }}>
								{@render previewSnippet(activeCmd)}
							</div>
						{/key}
					</Card>
					{#snippet previewFooter()}
						<div class="cp-preview-desc">{activeCmd.description}</div>
					{/snippet}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.cp-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 12vh $space-md $space-md;
	}

	.cp-panel {
		width: 100%;
		max-width: 640px;
		color: var(--glow-fg, #fff);
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		transition: max-width var(--glow-dur-base) cubic-bezier(0.22, 1, 0.36, 1);

		&.has-preview {
			max-width: 1056px; // 640 + 0.75rem gap + 400 preview
		}
	}

	%cp-floating {
		background: var(--glow-bg-surface, #1a1a1a);
		border: 1px solid rgba($fg, 0.12);
		border-radius: $radius;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
		overflow: hidden;
	}

	.cp-main {
		@extend %cp-floating;
		flex: 0 0 640px;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.cp-preview {
		flex: 0 0 400px;
		min-width: 0;
		max-height: 60vh;
		display: flex;
		flex-direction: column;

		:global(.card.cp-preview-card) {
			flex: 1 1 auto;
			min-height: 0;
		}

		:global(.card.cp-preview-card > .card-header) {
			min-height: 3rem;
			box-sizing: border-box;
		}

		:global(.card.cp-preview-card > .card-body) {
			overflow-y: auto;
		}
	}

	.cp-preview-desc {
		font-size: 0.8rem;
		color: rgba($fg, 0.65);
		line-height: 1.4;
	}

	.cp-search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.85rem;
		min-height: 3rem;
		box-sizing: border-box;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid var(--glow-border-color);
	}

	.cp-search-icon {
		display: inline-flex;
		opacity: 0.6;
	}

	.cp-search-busy {
		display: inline-flex;
		align-items: center;
		opacity: 0.65;
	}

	.cp-input-stage {
		flex: 1 1 auto;
		min-width: 0;
		position: relative;
		display: flex;
		align-items: center;
		min-height: 1.5rem;
		cursor: text;
	}

	.cp-input-display {
		position: relative;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.95rem;
		min-width: 0;
		min-height: 1.5rem;
		white-space: pre;
	}

	.cp-input-chip-text {
		white-space: pre;
	}

	.cp-input-placeholder {
		color: rgba($fg, 0.45);
	}

	.cp-input-text {
		color: var(--glow-fg);
	}

	.cp-input-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
		font-size: 0.8rem;
		font-weight: 500;
		line-height: 1;
	}

	.cp-input-chip-image {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		object-fit: cover;
	}

	.cp-input-caret {
		position: absolute;
		top: 0;
		left: 0;
		width: 1.5px;
		background: var(--glow-fg);
		pointer-events: none;
		animation: cp-caret-blink 1s steps(1) infinite;
		will-change: transform;

		&.busy {
			animation: none;
			opacity: 1;
		}
	}

	.cp-input-caret.in-chip {
		background: var(--glow-primary);
	}

	@keyframes cp-caret-blink {
		50% {
			opacity: 0;
		}
	}

	.cp-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		background: transparent;
		border: none;
		outline: none;
		font: inherit;
		color: transparent;
		caret-color: transparent;
	}

	.cp-results {
		overflow-y: auto;
		overflow-x: hidden;
		transition: height var(--glow-dur-fast) $ease-out;
	}

	.cp-results-inner {
		position: relative;
		transition: height var(--glow-dur-fast) $ease-out;
	}

	.cp-level {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 0.4rem;
		box-sizing: border-box;
	}

	.cp-indicator {
		position: absolute;
		left: 0.4rem;
		right: 0.4rem;
		background: var(--glow-primary-soft);
		border-radius: 6px;
		z-index: 0;
		pointer-events: none;
		opacity: 0;
		transition: top var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1),
			height var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1),
			opacity var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1);

		&.ready {
			opacity: 1;
		}
	}

	.cp-empty {
		padding: 1.5rem;
		text-align: center;
		color: rgba($fg, 0.55);
		font-size: 0.875rem;
	}

	.cp-section-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba($fg, 0.5);
		padding: 0.55rem 0.6rem 0.3rem;
	}

	// Skeleton row used during async children loading. Keeps the `.cp-item-*`
	// class names so existing skeleton CSS still applies — these aren't real
	// CommandRow instances.
	.cp-item {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border-radius: 6px;
	}

	.cp-item-skeleton {
		cursor: default;
		pointer-events: none;
	}

	.cp-item-icon {
		display: inline-flex;
		flex: 0 0 auto;
		width: 18px;
		justify-content: center;
		opacity: 0.85;
	}

	.cp-item-text {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.cp-crumbs {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex: 0 0 auto;
		max-width: 50%;
		overflow: hidden;
	}

	.cp-crumb {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba($fg, 0.08);
		color: rgba($fg, 0.7);
		border: none;
		border-radius: 4px;
		padding: 0.15rem 0.4rem;
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
		transition: background var(--glow-dur-instant) $ease-out, color var(--glow-dur-instant) $ease-out;

		&:hover {
			background: rgba($fg, 0.14);
			color: var(--glow-fg);
		}

		&.current {
			background: var(--glow-primary-soft);
			color: var(--glow-primary);
		}
	}

	.cp-crumb-root {
		padding: 0.15rem 0.3rem;
	}

	.cp-crumb-sep {
		display: inline-flex;
		opacity: 0.4;
	}
</style>
