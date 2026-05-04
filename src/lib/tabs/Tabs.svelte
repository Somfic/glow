<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';
	import Pill from '../pill/Pill.svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: IconProp;
		badge?: string | number | { icon: IconProp; label?: string };
		content: Snippet;
		disabled?: boolean;
	}

	let {
		tabs,
		activeTab = $bindable(tabs[0]?.id),
		onChange
	}: {
		tabs: Tab[];
		activeTab?: string;
		onChange?: (tabId: string) => void;
	} = $props();

	let headerElement: HTMLDivElement | undefined = $state();
	let panelHeight = $state(0);
	// Width of the content area — drives the fly distance so the slide
	// fully clears the visible area regardless of how wide the Tabs is.
	let contentWidth = $state(0);

	// Direction of the slide: +1 means moving forward (the new tab is to the
	// right of the old one) → outgoing slides left, incoming arrives from
	// right. -1 mirrors. `$effect.pre` runs before the DOM update that
	// triggers the keyed-block outro/intro, so the transitions see the
	// correct direction when they start.
	let direction = $state(1);
	let prevTabIndex = -1;
	$effect.pre(() => {
		const idx = tabs.findIndex((t) => t.id === activeTab);
		if (prevTabIndex !== -1 && idx !== prevTabIndex) {
			direction = idx > prevTabIndex ? 1 : -1;
		}
		prevTabIndex = idx;
	});

	// Active tab indicator — same RadioInput-style approach: a single
	// absolutely-positioned element whose left/width animate to match the
	// active button's box. Avoids per-button background animation.
	let indicatorLeft = $state(0);
	let indicatorWidth = $state(0);
	let indicatorReady = $state(false);

	$effect(() => {
		// Re-run when activeTab changes or layout changes (window resize).
		void activeTab;
		if (!headerElement) return;
		const buttons = headerElement.querySelectorAll<HTMLElement>('[role="tab"]');
		const idx = tabs.findIndex((t) => t.id === activeTab);
		const el = buttons[idx];
		if (!el) return;
		indicatorLeft = el.offsetLeft;
		indicatorWidth = el.offsetWidth;
		indicatorReady = true;
	});

	function selectTab(tabId: string) {
		const tab = tabs.find((t) => t.id === tabId);
		if (tab?.disabled) return;

		activeTab = tabId;
		onChange?.(tabId);
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		let newIndex = index;

		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				newIndex = index - 1;
				if (newIndex < 0) newIndex = tabs.length - 1;
				break;
			case 'ArrowRight':
				e.preventDefault();
				newIndex = index + 1;
				if (newIndex >= tabs.length) newIndex = 0;
				break;
			case 'Home':
				e.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				e.preventDefault();
				newIndex = tabs.length - 1;
				break;
			default:
				return;
		}

		// Skip disabled tabs
		while (tabs[newIndex]?.disabled) {
			if (e.key === 'ArrowLeft' || e.key === 'End') {
				newIndex--;
				if (newIndex < 0) newIndex = tabs.length - 1;
			} else {
				newIndex++;
				if (newIndex >= tabs.length) newIndex = 0;
			}
		}

		selectTab(tabs[newIndex].id);

		const tabElements = headerElement?.querySelectorAll('[role="tab"]');
		const el = tabElements?.[newIndex] as HTMLElement;
		el?.focus();
		el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
	}

	function scrollToActive(node: HTMLButtonElement) {
		if (node.getAttribute('aria-selected') === 'true') {
			node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	}

	const activeTabContent = $derived(tabs.find((tab) => tab.id === activeTab)?.content);
	const isFirstTabActive = $derived(activeTab === tabs[0]?.id);
</script>

<div class="tabs">
	<div class="tabs-header" role="tablist" bind:this={headerElement}>
		<div
			class="tab-indicator"
			class:first={tabs[0]?.id === activeTab}
			class:ready={indicatorReady}
			style:left="{indicatorLeft}px"
			style:width="{indicatorWidth}px"
			aria-hidden="true"
		></div>
		{#each tabs as tab, index (tab.id)}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				class:disabled={tab.disabled}
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-controls="tab-panel-{tab.id}"
				tabindex={activeTab === tab.id ? 0 : -1}
				disabled={tab.disabled}
				onclick={() => selectTab(tab.id)}
				onkeydown={(e) => handleKeyDown(e, index)}
				use:scrollToActive
			>
				{#if tab.icon}
					<Icon {...resolveIcon(tab.icon)} size={resolveIcon(tab.icon).size ?? 16} />
				{/if}
				<span class="tab-label" data-label={tab.label}>{tab.label}</span>
				{#if tab.badge != null}
					{#if typeof tab.badge === 'object'}
						<Pill icon={tab.badge.icon} label={tab.badge.label} />
					{:else}
						<Pill label={String(tab.badge)} />
					{/if}
				{/if}
			</button>
		{/each}
	</div>

	<div
		class="tabs-content"
		class:first-active={isFirstTabActive}
		role="tabpanel"
		id="tab-panel-{activeTab}"
		aria-labelledby="tab-{activeTab}"
		bind:clientWidth={contentWidth}
		style:height={panelHeight ? `${panelHeight}px` : undefined}
	>
		{#key activeTab}
			<div
				class="tabs-panel"
				bind:offsetHeight={panelHeight}
				in:fly={{ x: direction * contentWidth, duration: 320, opacity: 1, easing: cubicOut }}
				out:fly={{ x: -direction * contentWidth, duration: 320, opacity: 1, easing: cubicOut }}
			>
				{#if activeTabContent}
					{@render activeTabContent()}
				{/if}
			</div>
		{/key}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.tabs {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.tabs-header {
		display: flex;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 0 8px 0 0;
		position: relative;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	// Sliding active-tab indicator. Sits behind the tab buttons (z-index 0)
	// and animates `left` + `width` to match the active button's box.
	// `::before` and `::after` render the inverse-border curves that visually
	// merge the active tab into the content panel below — they slide along
	// with the indicator.
	.tab-indicator {
		position: absolute;
		bottom: 0;
		top: 0;
		background: var(--glow-bg-surface-element);
		border-radius: $radius $radius 0 0;
		z-index: 0;
		pointer-events: none;
		// Skip the entrance animation on first paint to avoid an awkward
		// slide-in from x=0; only animate on subsequent activeTab changes.
		opacity: 0;
		transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

		&.ready {
			opacity: 1;
		}

		// Right corner — concave curve down into the content panel.
		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			right: -8px;
			width: 8px;
			height: 8px;
			background: radial-gradient(circle at 100% 0, transparent 8px, var(--glow-bg-surface-element) 8px);
		}

		// Left corner — same trick, mirrored. Hidden when the indicator is
		// at the left edge (i.e. first tab is active) — that tab's bottom-left
		// is straight, matching the content panel's top-left corner.
		&::before {
			content: '';
			position: absolute;
			bottom: 0;
			left: -8px;
			width: 8px;
			height: 8px;
			background: radial-gradient(circle at 0 0, transparent 8px, var(--glow-bg-surface-element) 8px);
		}

		&.first::before {
			display: none;
		}
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: transparent;
		border: none;
		border-radius: $radius $radius 0 0;
		color: var(--glow-text-secondary);
		font-size: $text-sm;
		font-weight: 500;
		font-family: $font-family;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
		position: relative;

		&:hover:not(.disabled):not(.active) {
			color: var(--glow-fg);
		}

		// Reserve bold-width via a hidden duplicate of the label, so flipping
		// font-weight on .active doesn't reflow the row of tabs.
		.tab-label {
			display: inline-flex;
			flex-direction: column;
			align-items: center;

			&::after {
				content: attr(data-label) / '';
				font-weight: 700;
				height: 0;
				visibility: hidden;
				overflow: hidden;
				user-select: none;
				pointer-events: none;
			}
		}

		&.active {
			color: var(--glow-primary);
			font-weight: 700;
			z-index: 1;
		}

		&.disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&:focus-visible {
			outline: 2px solid $primary;
			outline-offset: -2px;
		}
	}

	.tabs-content {
		background: var(--glow-bg-surface-element);
		border-radius: $radius;
		// Padding lives on the panel (see below) so its measured offsetHeight
		// includes the gutter, and the wrapper's explicit `height` is exactly
		// what we want to display.
		position: relative;
		overflow: hidden;
		transition: border-radius 0.2s ease, height 0.32s cubic-bezier(0.4, 0, 0.2, 1);

		&.first-active {
			border-radius: 0 $radius $radius $radius;
		}
	}

	.tabs-panel {
		// Absolute positioning lets each panel's intrinsic content height be
		// measured independently of the wrapper — otherwise the wrapper's
		// height would constrain the panel and the height transition would
		// lock at whichever tab was tallest.
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 1.5rem;
		box-sizing: border-box;
		min-width: 0;
	}
</style>
