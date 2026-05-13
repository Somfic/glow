<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onClickOutside } from '../util/clickOutside.js';
	import { commands as defaultRegistry, CommandRegistry } from './registry.svelte.js';
	import { useCommandList, CLOSE_MATCH_KEY, type ScoredCommand } from './useCommandList.svelte.js';
	import CommandRow from './CommandRow.svelte';

	export type AnchorPoint = { x: number; y: number; lineHeight?: number };
	export type Anchor = HTMLElement | AnchorPoint;

	type Props = {
		open?: boolean;
		registry?: CommandRegistry;
		/** Host-owned query. The popover reads this; it never writes. */
		query?: string;
		/** Where to anchor — an element, or absolute viewport coords (e.g. a caret position). */
		anchor: Anchor;
		/** Placement preference. `auto` flips above when there's no room below. */
		placement?: 'bottom-start' | 'top-start' | 'auto';
		width?: number;
		maxHeight?: number;
		emptyText?: string;
		/** Externally-controlled scope path. When set, the popover only shows the
		 *  children of `path[path.length - 1]` (or top-level when empty). Lets a
		 *  host-side parser scope the popover into a subtree as the user commits
		 *  tokens. */
		path?: import('./types.js').Command[];
		/** Called when a command is chosen. Host decides what to do — invoke
		 *  `cmd.perform`, rewrite its input buffer, drill, etc. */
		onSelect?: (cmd: ScoredCommand) => void;
		/** Called when the popover wants to close (Escape, outside-click, or programmatic). */
		onClose?: () => void;
		/** Called whenever the active (highlighted) command changes — useful for
		 *  rendering ghost-text completions in the host. */
		onActiveChange?: (cmd: ScoredCommand | undefined) => void;
	};

	let {
		open = $bindable(false),
		registry = defaultRegistry,
		query = '',
		anchor,
		placement = 'auto',
		width,
		maxHeight = 320,
		emptyText = 'No matches',
		path,
		onSelect,
		onClose,
		onActiveChange
	}: Props = $props();

	let popoverEl = $state<HTMLDivElement | null>(null);
	let resolvedPlacement = $state<'bottom-start' | 'top-start'>('bottom-start');
	let posStyle = $state('');

	function close() {
		open = false;
		onClose?.();
	}

	function handleSelect(cmd: ScoredCommand) {
		onSelect?.(cmd);
	}

	const engine = useCommandList({
		registry: () => registry,
		query: () => query,
		path: () => path ?? [],
		enableDrillIn: false,
		onSelect: handleSelect,
		onClose: close
	});

	$effect(() => {
		void open;
		void engine.activeIndex;
		void engine.flat.length;
		const active = open ? engine.flat[engine.activeIndex] : undefined;
		onActiveChange?.(active);
	});

	/** Forward a keyboard event into the engine. Returns true if the popover
	 *  consumed the key — the host can use this to decide whether to fall through
	 *  to its own handling (e.g. Tab inserting a literal tab into a text buffer). */
	export function handleKey(e: KeyboardEvent): boolean {
		if (!open) return false;
		return engine.handleKey(e);
	}

	function anchorRect(): { top: number; left: number; height: number; width: number } | null {
		if (!anchor) return null;
		if (anchor instanceof HTMLElement) {
			const r = anchor.getBoundingClientRect();
			return { top: r.top, left: r.left, height: r.height, width: r.width };
		}
		return {
			top: anchor.y,
			left: anchor.x,
			height: anchor.lineHeight ?? 0,
			width: 0
		};
	}

	function updatePosition() {
		if (!open) return;
		const r = anchorRect();
		if (!r) return;
		const popH = popoverEl?.offsetHeight ?? maxHeight;
		const offset = 4;
		const spaceBelow = window.innerHeight - (r.top + r.height);
		const spaceAbove = r.top;
		let place: 'bottom-start' | 'top-start';
		if (placement === 'auto') {
			place = spaceBelow < popH + offset && spaceAbove > spaceBelow ? 'top-start' : 'bottom-start';
		} else {
			place = placement;
		}
		resolvedPlacement = place;
		const top =
			place === 'bottom-start'
				? r.top + r.height + offset
				: r.top - offset - popH;
		const left = Math.min(r.left, window.innerWidth - (width ?? 360) - 8);
		posStyle = `position: fixed; top: ${Math.max(8, top)}px; left: ${Math.max(8, left)}px;`;
	}

	$effect(() => {
		// Re-position whenever open/anchor/query/results change.
		void open;
		void anchor;
		void query;
		void engine.flat.length;
		if (!open) return;
		updatePosition();
		requestAnimationFrame(updatePosition);
	});

	$effect(() => {
		if (!open) return;
		const onScroll = () => updatePosition();
		const onResize = () => updatePosition();
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		// Treat the anchor element as part of the popover for outside-click — the
		// host's input typically IS the anchor, and clicking into it shouldn't
		// dismiss us.
		const anchorEl = anchor instanceof HTMLElement ? anchor : null;
		const cleanupClickOutside = onClickOutside([popoverEl, anchorEl], () => close());
		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
			cleanupClickOutside();
		};
	});
</script>

{#if open}
	<div
		bind:this={popoverEl}
		class="cpp"
		class:above={resolvedPlacement === 'top-start'}
		style={posStyle}
		style:--cpp-width={width ? `${width}px` : 'min(360px, max-content)'}
		style:--cpp-max-height="{maxHeight}px"
		role="listbox"
		aria-label="Suggestions"
		transition:fly={{ y: resolvedPlacement === 'bottom-start' ? -4 : 4, duration: 120 }}
	>
		<div class="cpp-list">
			{#if engine.empty}
				<div class="cpp-empty">{emptyText}</div>
			{:else}
				{#each engine.sections as section (section.name)}
					{#if section.name !== CLOSE_MATCH_KEY && (engine.sections.length > 1 || section.name !== 'Other')}
						<div class="cpp-section-label">{section.name}</div>
					{/if}
					{#each section.items as cmd, i (cmd._keyId)}
						{@const idx = section.startIndex + i}
						<CommandRow
							{cmd}
							{idx}
							active={idx === engine.activeIndex}
							compact
							paintActive
							onSelect={() => handleSelect(cmd)}
							onHover={() => (engine.activeIndex = idx)}
						/>
					{/each}
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.cpp {
		z-index: 10000;
		width: var(--cpp-width);
		max-width: min(480px, calc(100vw - 16px));
		max-height: var(--cpp-max-height);
		background: var(--glow-bg-surface, #1a1a1a);
		border: 1px solid rgba($fg, 0.12);
		border-radius: $radius;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		color: var(--glow-fg, #fff);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.cpp-list {
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0.3rem;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.cpp-empty {
		padding: 0.75rem;
		text-align: center;
		color: rgba($fg, 0.55);
		font-size: 0.8rem;
	}

	.cpp-section-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba($fg, 0.5);
		padding: 0.4rem 0.55rem 0.2rem;
	}
</style>
