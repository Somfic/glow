<script lang="ts">
	import Button from '../button/Button.svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';
	import type { ToastVariant } from './toast.svelte.js';

	type Props = {
		variant: ToastVariant;
		label: string;
		onDismiss?: () => void;
	};

	let { variant, label, onDismiss }: Props = $props();

	const icons: Record<ToastVariant, IconName> = {
		info: 'Info',
		success: 'PartyPopper',
		warning: 'MessageCircleWarning',
		error: 'MessageCircleX'
	};
</script>

<div class="toast {variant}">
	<div class="icon">
		<Icon name={icons[variant]} />
	</div>
	<span class="label">
		{label}
	</span>
	{#if onDismiss}
		<Button icon="X" variant="ternary" onclick={onDismiss} />
	{/if}
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.toast {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5em;
  font-weight: bold;
  border-radius: 12px;
  padding: 0.5em;
  color: #090A13;
  animation: slideIn 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.toast .label {
  flex-grow: 1;
}
.toast.error {
  background-color: hsl(355, 70%, 74%);
}
.toast.warning {
  background-color: hsl(45, 70%, 74%);
}
.toast.info {
  background-color: hsl(195, 70%, 74%);
}
.toast.success {
  background-color: hsl(120, 70%, 74%);
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}</style>
