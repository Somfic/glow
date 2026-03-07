<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: IconName;
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

		// Focus the new tab
		const tabElements = document.querySelectorAll('[role="tab"]');
		(tabElements[newIndex] as HTMLElement)?.focus();
	}

	const activeTabContent = $derived(tabs.find((tab) => tab.id === activeTab)?.content);
</script>

<div class="tabs">
	<div class="tabs-header" role="tablist">
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
			>
				{#if tab.icon}
					<Icon name={tab.icon} size={18} />
				{/if}
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	<div class="tabs-content" role="tabpanel" id="tab-panel-{activeTab}" aria-labelledby="tab-{activeTab}">
		{#if activeTabContent}
			{@render activeTabContent()}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;
	@use 'sass:color';

	.tabs {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.tabs-header {
		display: flex;
		gap: 0.25rem;
		position: relative;

		// Bottom border that goes under inactive tabs
		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: $border-color;
			z-index: 0;
		}
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: $border;
		border-bottom: none;
		border-radius: $radius $radius 0 0;
		color: $text-secondary;
		font-size: $text-sm;
		font-weight: 500;
		cursor: pointer;
		position: relative;
		z-index: 1;
		transition: all 0.15s;
		white-space: nowrap;

		&:hover:not(.disabled):not(.active) {
			background: rgba($fg, 0.03);
			color: $fg;
		}

		&.active {
			background: $bg-surface-element;
			color: $primary;
			border-color: $border-color;
			z-index: 2;

			// Hide the bottom border to connect with content
			&::after {
				content: '';
				position: absolute;
				bottom: -1px;
				left: 0;
				right: 0;
				height: 2px;
				background: $bg-surface-element;
			}
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&:focus-visible {
			outline: 2px solid $primary;
			outline-offset: -2px;
		}
	}

	.tabs-content {
		background: $bg-surface-element;
		border: $border;
		border-radius: 0 $radius $radius $radius;
		padding: 1.5rem;
		position: relative;
		z-index: 1;
	}
</style>
