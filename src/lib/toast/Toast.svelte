<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import type { IconName } from '../icon/Icon.svelte';
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

<div class="toast {variant}" role="alert">
	<div class="icon">
		<Icon name={icons[variant]} size={18} />
	</div>
	<span class="label">{label}</span>
	{#if onDismiss}
		<button class="dismiss" onclick={onDismiss}>
			<Icon name="X" size={14} />
		</button>
	{/if}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: $radius;
		border: 1px solid;
		background: var(--glow-bg-surface-element);
		color: var(--glow-fg);
		font-size: $text-sm;
		font-family: $font-family;
		box-shadow: $shadow-lg;
		backdrop-filter: blur(12px);

		&.info {
			border-color: rgba(#6bb8e8, 0.3);

			.icon {
				color: #6bb8e8;
			}
		}

		&.success {
			border-color: rgba(#6be88b, 0.3);

			.icon {
				color: #6be88b;
			}
		}

		&.warning {
			border-color: rgba(#e8c86b, 0.3);

			.icon {
				color: #e8c86b;
			}
		}

		&.error {
			border-color: rgba(#e86b6b, 0.3);

			.icon {
				color: #e86b6b;
			}
		}
	}

	.icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.label {
		flex: 1;
		line-height: 1.4;
	}

	.dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: $radius-sm;
		background: none;
		color: var(--glow-text-muted);
		cursor: pointer;
		transition: background var(--glow-dur-fast) var(--glow-ease-out), color var(--glow-dur-fast) var(--glow-ease-out);

		&:hover {
			background: color-mix(in oklab, var(--glow-fg) 8%, transparent);
			color: var(--glow-fg);
		}
	}
</style>
