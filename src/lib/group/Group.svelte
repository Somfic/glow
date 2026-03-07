<script lang="ts">
	import Button from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';

	type ActionLabelProp = {
		label: string;
		icon?: IconName;
	};

	type ActionIconProp = {
		icon: IconName;
		label?: string;
	};

	type ActionProp = (ActionLabelProp | ActionIconProp) & {
		onClick: () => void;
	};

	type IconProps = {
		icon: IconName;
		label?: string;
	};

	type LabelProps = {
		label: string;
		icon?: IconName;
	};

	type Props = {
		actions?: ActionProp[];
		headerExtra?: import('svelte').Snippet;
		children?: () => any;
	} & (IconProps | LabelProps);

	let { label, icon, actions, headerExtra, children }: Props = $props();
</script>

<div class="group">
	<div class="header">
		<div class="label">
			{#if icon}
				<Icon name={icon} size={16} />
			{/if}
			{label}
		</div>
		<div class="actions">
			{#if headerExtra}
				{@render headerExtra()}
			{/if}
			<ButtonGroup noborder>
				{#each actions ?? [] as action}
					<Button label={action.label!} icon={action.icon!} onclick={action.onClick} />
				{/each}
			</ButtonGroup>
		</div>
	</div>
	<div class="content">
		{@render children?.()}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.group {
		display: flex;
		flex-direction: column;
		border-radius: $radius;
		margin: 1.5em 0;
		background-color: $bg-surface;
		border: 1px solid rgba($fg, 0.06);

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1em 1.25em;
			font-weight: 600;
			background: linear-gradient(to bottom, rgba($fg, 0.02), transparent);
			border-bottom: 1px solid rgba($fg, 0.06);
			border-radius: $radius $radius 0 0;

			.label {
				display: flex;
				align-items: center;
				gap: 0.625em;
				font-size: 0.9375rem;
				color: rgba($fg, 0.9);
			}
		}

		.content {
			padding: 1.25em;
			gap: 1em;
			display: flex;
			flex-direction: column;
		}
	}
</style>
