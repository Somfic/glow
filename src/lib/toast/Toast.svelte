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
		<Button icon="X" variant="ghost" onclick={onDismiss} />
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	$error: hsl(355, 70%, 74%);
	$warning: hsl(45, 70%, 74%);
	$info: hsl(195, 70%, 74%);
	$success: hsl(120, 70%, 74%);

	.toast {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5em;
		font-weight: bold;
		border-radius: $radius;
		padding: 0.5em;
		color: $bg-base;
		animation: slideIn 0.2s ease-out;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

		.label {
			flex-grow: 1;
		}

		&.error {
			background-color: $error;
		}

		&.warning {
			background-color: $warning;
		}

		&.info {
			background-color: $info;
		}

		&.success {
			background-color: $success;
		}
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
	}
</style>
