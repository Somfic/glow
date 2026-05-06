<script lang="ts">
	import type { SplitDirection, SplitPane } from './types.js';

	type Props = {
		direction?: SplitDirection;
		panes: SplitPane[];
		/** Fired after every drag/keyboard resize with the new sizes (id → %). */
		onResize?: (sizes: Record<string, number>) => void;
		/** Pixels-per-arrow-key step for keyboard resizing. Default 12. */
		keyboardStep?: number;
		class?: string;
	};

	let {
		direction = 'horizontal',
		panes,
		onResize,
		keyboardStep = 12,
		class: className
	}: Props = $props();

	let containerEl = $state<HTMLDivElement | null>(null);

	// `sizes[id]` is the live percentage. Initialised from `defaultSize` and
	// updated on drag / keyboard / programmatic collapse.
	let sizes = $state<Record<string, number>>(initialSizes());
	// When a pane is collapsed via double-click, remember its prior size so
	// a second double-click can restore it.
	let collapsedFrom = $state<Record<string, number | undefined>>({});
	// Active drag context — non-null while pointer is held on a handle.
	let drag = $state<{
		handleIdx: number;
		startPointer: number;
		startA: number;
		startB: number;
		paneSpan: number;
	} | null>(null);

	function initialSizes(): Record<string, number> {
		const out: Record<string, number> = {};
		for (const p of panes) out[p.id] = p.defaultSize;
		return out;
	}

	// Keep `sizes` in sync if panes prop changes shape (added / removed pane).
	$effect(() => {
		const next = { ...sizes };
		let dirty = false;
		const knownIds = new Set(panes.map((p) => p.id));
		for (const p of panes) {
			if (next[p.id] === undefined) {
				next[p.id] = p.defaultSize;
				dirty = true;
			}
		}
		for (const id of Object.keys(next)) {
			if (!knownIds.has(id)) {
				delete next[id];
				dirty = true;
			}
		}
		if (dirty) sizes = next;
	});

	function clamp(p: SplitPane, value: number): number {
		const min = p.minSize ?? 5;
		const max = p.maxSize ?? 95;
		return Math.max(min, Math.min(max, value));
	}

	/** Redistribute `delta` percentage points from pane B to pane A (positive
	 *  delta moves the handle toward B, growing A). Clamps to each pane's
	 *  min/max so the handle gracefully stops at the boundary. */
	function applyDelta(handleIdx: number, deltaPct: number): void {
		const a = panes[handleIdx];
		const b = panes[handleIdx + 1];
		if (!a || !b) return;
		const aStart = drag ? drag.startA : sizes[a.id];
		const bStart = drag ? drag.startB : sizes[b.id];
		let aNext = clamp(a, aStart + deltaPct);
		let bNext = bStart + (aStart - aNext);
		// If B clamped, push the difference back into A.
		const bClamped = clamp(b, bNext);
		if (bClamped !== bNext) {
			aNext = aStart + (bStart - bClamped);
			bNext = bClamped;
		}
		sizes = { ...sizes, [a.id]: aNext, [b.id]: bNext };
		onResize?.(sizes);
	}

	function onHandlePointerDown(e: PointerEvent, handleIdx: number): void {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const span = direction === 'horizontal' ? rect.width : rect.height;
		const pointer = direction === 'horizontal' ? e.clientX : e.clientY;
		const a = panes[handleIdx];
		const b = panes[handleIdx + 1];
		drag = {
			handleIdx,
			startPointer: pointer,
			startA: sizes[a.id],
			startB: sizes[b.id],
			paneSpan: span
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function onHandlePointerMove(e: PointerEvent): void {
		if (!drag) return;
		const pointer = direction === 'horizontal' ? e.clientX : e.clientY;
		const deltaPx = pointer - drag.startPointer;
		const deltaPct = (deltaPx / drag.paneSpan) * 100;
		applyDelta(drag.handleIdx, deltaPct);
	}

	function onHandlePointerUp(e: PointerEvent): void {
		if (!drag) return;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		drag = null;
	}

	function onHandleKeydown(e: KeyboardEvent, handleIdx: number): void {
		if (!containerEl) return;
		const isHorz = direction === 'horizontal';
		const decKey = isHorz ? 'ArrowLeft' : 'ArrowUp';
		const incKey = isHorz ? 'ArrowRight' : 'ArrowDown';
		if (e.key !== decKey && e.key !== incKey) return;
		e.preventDefault();
		const rect = containerEl.getBoundingClientRect();
		const span = isHorz ? rect.width : rect.height;
		const stepPx = e.shiftKey ? keyboardStep * 4 : keyboardStep;
		const dirSign = e.key === incKey ? 1 : -1;
		const deltaPct = ((stepPx * dirSign) / span) * 100;
		// Keyboard nudges aren't drag-anchored; reset start refs each press.
		drag = null;
		const a = panes[handleIdx];
		const b = panes[handleIdx + 1];
		const aStart = sizes[a.id];
		const bStart = sizes[b.id];
		let aNext = clamp(a, aStart + deltaPct);
		let bNext = bStart + (aStart - aNext);
		const bClamped = clamp(b, bNext);
		if (bClamped !== bNext) {
			aNext = aStart + (bStart - bClamped);
			bNext = bClamped;
		}
		sizes = { ...sizes, [a.id]: aNext, [b.id]: bNext };
		onResize?.(sizes);
	}

	function onHandleDoubleClick(handleIdx: number): void {
		const a = panes[handleIdx];
		if (!a?.collapsible) return;
		if (collapsedFrom[a.id] !== undefined) {
			// Restore.
			const restored = collapsedFrom[a.id]!;
			const delta = restored - sizes[a.id];
			collapsedFrom = { ...collapsedFrom, [a.id]: undefined };
			applyDeltaTo(handleIdx, delta);
		} else {
			// Collapse to minSize.
			const min = a.minSize ?? 5;
			collapsedFrom = { ...collapsedFrom, [a.id]: sizes[a.id] };
			const delta = min - sizes[a.id];
			applyDeltaTo(handleIdx, delta);
		}
	}

	function applyDeltaTo(handleIdx: number, deltaPct: number): void {
		drag = null;
		const a = panes[handleIdx];
		const b = panes[handleIdx + 1];
		const aStart = sizes[a.id];
		const bStart = sizes[b.id];
		let aNext = clamp(a, aStart + deltaPct);
		let bNext = bStart + (aStart - aNext);
		const bClamped = clamp(b, bNext);
		if (bClamped !== bNext) {
			aNext = aStart + (bStart - bClamped);
			bNext = bClamped;
		}
		sizes = { ...sizes, [a.id]: aNext, [b.id]: bNext };
		onResize?.(sizes);
	}
</script>

<div
	bind:this={containerEl}
	class={['split', `split-${direction}`, className].filter(Boolean).join(' ')}
	class:dragging={!!drag}
>
	{#each panes as pane, i (pane.id)}
		<div
			class={['split-pane', pane.class].filter(Boolean).join(' ')}
			style:flex-basis="{sizes[pane.id]}%"
			data-pane-id={pane.id}
		>
			{@render pane.content()}
		</div>
		{#if i < panes.length - 1}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="split-handle"
				role="separator"
				tabindex="0"
				aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
				aria-valuenow={Math.round(sizes[pane.id])}
				aria-valuemin={pane.minSize ?? 5}
				aria-valuemax={pane.maxSize ?? 95}
				onpointerdown={(e) => onHandlePointerDown(e, i)}
				onpointermove={onHandlePointerMove}
				onpointerup={onHandlePointerUp}
				onpointercancel={onHandlePointerUp}
				onkeydown={(e) => onHandleKeydown(e, i)}
				ondblclick={() => onHandleDoubleClick(i)}
			></div>
		{/if}
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.split {
		display: flex;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}

	.split-horizontal {
		flex-direction: row;
	}

	.split-vertical {
		flex-direction: column;
	}

	.split-pane {
		flex-grow: 0;
		flex-shrink: 0;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		// While dragging, suppress per-pane transitions to avoid lag.
		transition: flex-basis var(--glow-dur-fast) cubic-bezier(0.22, 1, 0.36, 1);
	}

	.split.dragging .split-pane {
		transition: none;
	}

	/* ----- Handle ------------------------------------------------------ */

	// Handle is a 1px-wide flex item — adjacent panes sit flush against it,
	// so their backgrounds meet at a clean 1px seam (no transparent gutter).
	// The pseudo-element `::before` extends the click/drag hit area ±4px
	// without affecting flex layout — panes still touch the seam visually.
	.split-handle {
		position: relative;
		flex: 0 0 auto;
		background: rgba($fg, 0.08);
		border: none;
		padding: 0;
		z-index: 1;
		touch-action: none;
		transition: background var(--glow-dur-fast) $ease-out;

		&:focus-visible {
			outline: 2px solid var(--glow-primary);
			outline-offset: 2px;
		}
	}

	.split-horizontal > .split-handle {
		flex-basis: 1px;
		cursor: col-resize;
	}

	.split-vertical > .split-handle {
		flex-basis: 1px;
		cursor: row-resize;
	}

	.split-handle::before {
		content: '';
		position: absolute;
		inset: 0;
	}

	.split-horizontal > .split-handle::before {
		left: -4px;
		right: -4px;
	}

	.split-vertical > .split-handle::before {
		top: -4px;
		bottom: -4px;
	}

	.split-handle:hover,
	.split.dragging .split-handle {
		background: var(--glow-primary);
	}

	// Tactile grip pill — a small primary-coloured pill centred on the seam,
	// fades in on hover/drag.
	.split-handle::after {
		content: '';
		position: absolute;
		background: var(--glow-primary);
		border-radius: 999px;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--glow-dur-fast) $ease-out;
	}

	.split-horizontal > .split-handle::after {
		width: 3px;
		height: 26px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.split-vertical > .split-handle::after {
		width: 26px;
		height: 3px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.split-handle:hover::after,
	.split.dragging .split-handle::after {
		opacity: 1;
	}
</style>
