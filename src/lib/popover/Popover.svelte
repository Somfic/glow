<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { portal } from '../util/portal.js';
	import { onEscape } from '../util/escapeKey.js';
	import { onClickOutside } from '../util/clickOutside.js';
	import { lockScroll, unlockScroll } from '../util/scrollLock.js';

	interface Props {
		open?: boolean;
		disabled?: boolean;
		trigger: Snippet;
		children: Snippet;
		align?: 'left' | 'right' | 'stretch';
		offset?: number;
		manual?: boolean;
		class?: string;
		/**
		 * On phones the popover presents as a bottom sheet (full-width, anchored to
		 * the bottom of the viewport) instead of floating next to the trigger, so it
		 * stays tappable. Set `false` to always anchor regardless of viewport.
		 */
		sheet?: boolean;
	}

	let {
		open = $bindable(false),
		disabled = false,
		trigger,
		children,
		align = 'stretch',
		offset = 4,
		manual = false,
		class: className = '',
		sheet = true
	}: Props = $props();

	// Below this width the popover presents as a bottom sheet. Tracks the viewport
	// live so rotating / resizing swaps presentation.
	let isMobile = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(max-width: 640px)');
		const sync = () => (isMobile = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	let asSheet = $derived(sheet && isMobile);

	let containerElement: HTMLDivElement;
	let contentElement = $state<HTMLDivElement>(undefined!);
	let placement: 'below' | 'above' = $state('below');
	let popoverStyle = $state('');

	function updatePosition() {
		if (!containerElement) return;
		const rect = containerElement.getBoundingClientRect();
		const margin = 8;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const contentWidth = contentElement?.offsetWidth ?? rect.width;
		// Use scrollHeight (the natural, unclamped height) so the max-height we
		// apply below doesn't feed back into the flip decision and oscillate.
		const naturalHeight = contentElement?.scrollHeight ?? 200;
		const spaceBelow = vh - rect.bottom;
		const spaceAbove = rect.top;

		if (spaceBelow < naturalHeight + offset && spaceAbove > spaceBelow) {
			placement = 'above';
		} else {
			placement = 'below';
		}

		// Cap the popover to the space available on the chosen side; when its
		// content is taller it scrolls (see overflow on .popover-content) instead
		// of spilling off-screen.
		const available = Math.max(0, (placement === 'below' ? spaceBelow : spaceAbove) - offset - margin);
		const usedHeight = Math.min(naturalHeight, available);

		let top: number;
		if (placement === 'below') {
			top = rect.bottom + offset;
		} else {
			top = rect.top - offset - usedHeight;
		}
		top = Math.max(margin, Math.min(top, vh - usedHeight - margin));

		// Anchor horizontally per `align`, then clamp into the viewport so the
		// popover never draws off-screen (the bug: a left-aligned popover near
		// the right edge would overflow). 'right' anchors its right edge to the
		// trigger's right; everything else anchors to the trigger's left.
		let left = align === 'right' ? rect.right - contentWidth : rect.left;
		left = Math.max(margin, Math.min(left, vw - contentWidth - margin));

		let style = `position: fixed; top: ${top}px; left: ${left}px; max-height: ${available}px; z-index: 10000;`;

		if (align === 'stretch') {
			// Match trigger width as a floor, but let the popover grow to fit its
			// content (e.g. dense option labels in a narrow Field row). Cap at the
			// viewport width so wide content stays clamped above.
			style += ` min-width: ${rect.width}px; max-width: ${vw - 2 * margin}px;`;
		}

		popoverStyle = style;
	}

	$effect(() => {
		if (!open) return;

		// Sheet mode: lock background scroll and close on Escape. The backdrop
		// handles click-outside, so no positioning / scroll listeners are needed.
		if (asSheet) {
			lockScroll();
			const cleanupEscape = onEscape(() => { open = false; });
			return () => {
				unlockScroll();
				cleanupEscape();
			};
		}

		// Anchored mode: keep the popover glued to its trigger and dismiss on
		// outside click. A rAF loop tracks the trigger so the popover follows it
		// through scrolling, layout shifts, drag, or animation — not just window
		// scroll/resize. We only re-layout when the trigger rect or content size
		// actually changed, so the loop is cheap when nothing is moving.
		updatePosition();

		let frame = 0;
		let lastKey = '';
		const track = () => {
			if (containerElement) {
				const r = containerElement.getBoundingClientRect();
				const key = `${r.top},${r.left},${r.width},${r.height},${contentElement?.scrollHeight ?? 0},${contentElement?.offsetWidth ?? 0}`;
				if (key !== lastKey) {
					lastKey = key;
					updatePosition();
				}
			}
			frame = requestAnimationFrame(track);
		};
		frame = requestAnimationFrame(track);

		// Viewport resize can change the clamps without moving the trigger rect,
		// so handle it explicitly rather than relying on the rect diff above.
		window.addEventListener('resize', updatePosition);

		const cleanupEscape = onEscape(() => { open = false; });
		const cleanupClickOutside = onClickOutside(
			[containerElement, contentElement],
			() => { open = false; }
		);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', updatePosition);
			cleanupEscape();
			cleanupClickOutside();
		};
	});
</script>

<div
	class="popover {className}"
	class:disabled
	class:open
	bind:this={containerElement}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="popover-trigger" onclick={() => !disabled && !manual && (open = !open)}>
		{@render trigger()}
	</div>

	{#if open && asSheet}
		<div class="popover-sheet-root" use:portal>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="popover-sheet-backdrop"
				transition:fade={{ duration: 150 }}
				onclick={() => (open = false)}
			></div>
			<div class="popover-sheet" transition:fly={{ duration: 260, y: 480 }}>
				<div class="popover-sheet-handle" aria-hidden="true"></div>
				<div class="popover-sheet-scroll">
					{@render children()}
				</div>
			</div>
		</div>
	{:else if open}
		<div
			bind:this={contentElement}
			class="popover-content"
			style={popoverStyle}
			use:portal
			transition:fly={{ duration: 150, y: placement === 'below' ? -8 : 8 }}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.popover {
		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
	}

	.popover-trigger {
		cursor: pointer;
	}

	:global(.popover-content) {
		background-color: var(--glow-bg-surface-element);
		border: $border;
		border-radius: $radius;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		// When the content is taller than the space the popover was clamped to
		// (max-height set inline), scroll instead of overflowing the viewport.
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	// ── Mobile bottom sheet ──
	// On small screens the popover opens as a sheet anchored to the bottom of the
	// viewport rather than floating next to the trigger.
	.popover-sheet-root {
		position: fixed;
		inset: 0;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.popover-sheet-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.popover-sheet {
		position: relative;
		display: flex;
		flex-direction: column;
		max-height: 80vh;
		// Float off the window edges like the drawer (0.75rem inset) rather than
		// sitting flush against them.
		margin: 0 0.75rem 0.75rem;
		background: var(--glow-bg-surface-element);
		border-radius: 18px;
		box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.45);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.popover-sheet-handle {
		width: 36px;
		height: 4px;
		flex-shrink: 0;
		margin: 10px auto 6px;
		border-radius: 999px;
		background: var(--glow-text-muted);
		opacity: 0.4;
	}

	.popover-sheet-scroll {
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 0 6px 6px;

		// Roomier, touch-friendly menu rows in sheet mode.
		:global(.menu-item) {
			padding: 12px 14px;
			font-size: $text-base;
			border-radius: 10px;
		}

		:global(.group-header) {
			padding: 10px 14px 6px;
			font-size: $text-sm;
		}
	}
</style>
