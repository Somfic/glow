<script lang="ts">
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';

	type Props = {
		variant: 'info' | 'success' | 'warning' | 'error';
		label: string;
	};

	let { variant, label }: Props = $props();

	let icons = {
		info: 'Info',
		success: 'PartyPopper',
		warning: 'MessageCircleWarning',
		error: 'MessageCircleX'
	} as Record<Props['variant'], IconName>;
</script>

<div class="banner {variant}">
	<div class="icon">
		<Icon name={icons[variant]} size={18} />
	</div>
	<span class="label">{label}</span>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.banner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: $radius;
		border: 2px solid;
		background: $bg-surface-element;
		color: $fg;
		font-size: $text-sm;
		font-family: $font-family;
		margin: 0.5em 0;

		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}

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

</style>
