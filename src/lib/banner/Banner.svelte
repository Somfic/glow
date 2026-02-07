<script lang="ts">
	import Button from '$lib/button/Button.svelte';
	import type { IconName } from '$lib/icon/Icon.svelte';
	import Icon from '$lib/icon/Icon.svelte';

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
		<Icon name={icons[variant]} />
	</div>
	<span class="label">
		{label}
	</span>
	<Button icon="X" variant="ternary" />
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	$error: hsl(355, 70%, 74%);
	$warning: hsl(45, 70%, 74%);
	$info: hsl(195, 70%, 74%);
	$success: hsl(120, 70%, 74%);

	.banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5em;
		font-weight: bold;
		flex-grow: 1;
		border-radius: $radius;
		padding: 0.5em;
		color: $bg-base;
		margin: 1em 0;

		&:first-child {
			margin-top: 0;
		}
		&:last-child {
			margin-bottom: 0;
		}

		.label {
			flex-grow: 1;
		}

		&.error {
			background-color: $error;
			border-color: darken($error, 10%);
		}

		&.warning {
			background-color: $warning;
			border-color: darken($warning, 10%);
		}

		&.info {
			background-color: $info;
			border-color: darken($info, 10%);
		}

		&.success {
			background-color: $success;
		}
	}
</style>
