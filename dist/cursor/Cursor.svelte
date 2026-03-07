<script lang="ts">
	import { getCursorState } from './cursor.svelte.js';
	import Icon from '../icon/Icon.svelte';

	let cursorState = getCursorState();

	// Check if we have an icon to show
	let hasIcon = $derived(
		cursorState.iconName !== null ||
			cursorState.state === 'copy' ||
			cursorState.state === 'text' ||
			cursorState.state === 'checkbox' ||
			cursorState.state === 'checkbox-checked' ||
			cursorState.state === 'toggle' ||
			cursorState.state === 'toggle-checked' ||
			cursorState.selecting
	);

	// Only expand for content when there's no icon
	let isExpanded = $derived(cursorState.content !== null && !hasIcon);
</script>

<div
	class="cursor-container"
	class:visible={cursorState.visible}
	class:expanded={isExpanded}
	class:pressed={cursorState.pressed}
	class:selecting={cursorState.selecting}
	class:is-link={cursorState.isLink}
	class:state-default={cursorState.state === 'default'}
	class:state-pointer={cursorState.state === 'pointer'}
	class:state-copy={cursorState.state === 'copy'}
	class:state-text={cursorState.state === 'text'}
	class:state-tooltip={cursorState.state === 'tooltip'}
	class:variant-primary={cursorState.variant === 'primary'}
	class:variant-secondary={cursorState.variant === 'secondary'}
	class:variant-ternary={cursorState.variant === 'ternary'}
	style:left="{cursorState.x}px"
	style:top="{cursorState.y}px"
>
	<div
		class="cursor-dot"
		style:height={cursorState.selecting ? `${cursorState.selectionHeight}px` : undefined}
		style:width={cursorState.isLink ? `${cursorState.linkWidth}px` : undefined}
	>
		{#if cursorState.loading}
			<div class="cursor-spinner"></div>
		{:else if cursorState.selecting}
			<!-- Vertical line, styled by CSS -->
		{:else if hasIcon}
			<div class="cursor-icon">
				{#if cursorState.iconName}
					<Icon name={cursorState.iconName} size={14} />
				{:else if cursorState.state === 'copy'}
					<Icon name="Copy" size={14} />
				{:else if cursorState.state === 'text'}
					<Icon name="Type" size={14} />
				{:else if cursorState.state === 'checkbox'}
					<Icon name="Square" size={14} />
				{:else if cursorState.state === 'checkbox-checked'}
					<Icon name="CheckSquare" size={14} />
				{:else if cursorState.state === 'toggle'}
					<Icon name="ToggleLeft" size={14} />
				{:else if cursorState.state === 'toggle-checked'}
					<Icon name="ToggleRight" size={14} />
				{/if}
			</div>
		{:else if cursorState.content}
			<div class="cursor-content">
				{cursorState.content}
			</div>
		{/if}
	</div>
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.cursor-container {
  position: fixed;
  pointer-events: none;
  z-index: 10001;
  will-change: left, top, transform;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.cursor-container:not(.visible) {
  opacity: 0;
}
.cursor-dot {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), padding 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
}
.variant-primary .cursor-dot, .variant-secondary .cursor-dot, .variant-ternary .cursor-dot {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.9);
  transition: width 0.25s ease-out, height 0.25s ease-out, border-radius 0.25s ease-out, padding 0.25s ease-out, transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
}
.variant-primary.expanded .cursor-dot, .variant-secondary.expanded .cursor-dot, .variant-ternary.expanded .cursor-dot {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.cursor-dot {
  width: 8px;
  height: 8px;
}
.state-pointer .cursor-dot {
  width: 32px;
  height: 32px;
}
.state-copy .cursor-dot, .state-text .cursor-dot, .cursor-container:has(.cursor-icon) .cursor-dot, .cursor-container:has(.cursor-spinner) .cursor-dot {
  width: 32px;
  height: 32px;
}
.expanded .cursor-dot {
  width: auto;
  min-width: 60px;
  max-width: 200px;
  height: auto;
  min-height: 32px;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
}
.pressed .cursor-dot {
  transform: translate(-50%, -50%) scale(0.85);
}
.selecting .cursor-dot {
  width: 3px !important;
  height: 20px;
  border-radius: 2px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 0 8px rgba(139, 109, 237, 0.6), 0 0 4px rgba(255, 255, 255, 0.8) !important;
  padding: 0 !important;
}
.is-link .cursor-dot {
  height: 3px !important;
  border-radius: 2px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 0 8px rgba(139, 109, 237, 0.6), 0 0 4px rgba(255, 255, 255, 0.8) !important;
  padding: 0 !important;
}
.cursor-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e1f29;
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
  transition: color 0.2s ease;
}
.cursor-icon.selecting {
  color: #eab308;
}
.variant-primary .cursor-icon, .variant-secondary .cursor-icon, .variant-ternary .cursor-icon, .is-link .cursor-icon {
  opacity: 0 !important;
}
.cursor-icon :global(svg) {
  display: block;
}
.cursor-content {
  color: #1e1f29;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards;
  line-height: 1.2;
  transition: color 0.2s ease;
}
.variant-primary .cursor-content, .variant-secondary .cursor-content, .variant-ternary .cursor-content {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.variant-primary .cursor-content, .variant-secondary .cursor-content, .variant-ternary .cursor-content, .is-link .cursor-content {
  opacity: 0 !important;
}
.cursor-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #1e1f29;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(2px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cursor-container,
  .cursor-dot,
  .cursor-icon,
  .cursor-content {
    transition: none !important;
    animation: none !important;
  }
}</style>
