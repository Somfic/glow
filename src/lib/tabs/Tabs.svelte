<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconProp, resolveIcon } from '../icon/Icon.svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: IconProp;
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

	let headerElement: HTMLDivElement;

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
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	<div class="tabs-content" class:first-active={isFirstTabActive} role="tabpanel" id="tab-panel-{activeTab}" aria-labelledby="tab-{activeTab}">
		{#if activeTabContent}
			{@render activeTabContent()}
		{/if}
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

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: transparent;
		border: none;
		border-radius: $radius $radius 0 0;
		color: $text-secondary;
		font-size: $text-sm;
		font-weight: 500;
		font-family: $font-family;
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
		position: relative;

		&:hover:not(.disabled):not(.active) {
			color: $fg;
		}

		&.active {
			background: $bg-surface-element;
			color: $primary;
			z-index: 1;

			// Inverse border radius - right
			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				right: -8px;
				width: 8px;
				height: 8px;
				background: radial-gradient(circle at 100% 0, transparent 8px, $bg-surface-element 8px);
			}

			// First tab: no left curve, straight bottom-left matching content
			&:first-child {
				border-radius: $radius $radius 0 0;
			}

			// Non-first tabs: inverse border radius on left
			&:not(:first-child)::before {
				content: '';
				position: absolute;
				bottom: 0;
				left: -8px;
				width: 8px;
				height: 8px;
				background: radial-gradient(circle at 0 0, transparent 8px, $bg-surface-element 8px);
			}
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
		background: $bg-surface-element;
		border-radius: $radius;
		padding: 1.5rem;
		transition: border-radius 0.2s ease;

		&.first-active {
			border-radius: 0 $radius $radius $radius;
		}
	}
</style>
