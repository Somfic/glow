<script lang="ts">
	import Button from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';
	import type { IconName } from '../icon/Icon.svelte';
	import Icon from '../icon/Icon.svelte';

	type ActionLabelProp = {
		label: string;
		icon?: IconName;
		iconFilled?: boolean;
	};

	type ActionIconProp = {
		icon: IconName;
		iconFilled?: boolean;
		label?: string;
	};

	type ActionProp = (ActionLabelProp | ActionIconProp) & {
		onClick: () => void;
	};

	type IconProps = {
		icon: IconName;
		iconFilled?: boolean;
		label?: string;
	};

	type LabelProps = {
		label: string;
		icon?: IconName;
		iconFilled?: boolean;
	};

	type Props = {
		actions?: ActionProp[];
		headerExtra?: import('svelte').Snippet;
		children?: () => any;
		id?: string;
	} & (IconProps | LabelProps);

	let { label, icon, iconFilled = false, actions, headerExtra, children, id }: Props = $props();
</script>

<div class="group">
	<div class="header">
		<h2 class="label" {id}>
			{#if icon}
				<Icon name={icon} size={16} fill={iconFilled} />
			{/if}
			{label}
		</h2>
		<div class="actions">
			{#if headerExtra}
				{@render headerExtra()}
			{/if}
			<ButtonGroup noborder>
				{#each actions ?? [] as action}
					<Button label={action.label!} icon={action.icon!} iconFilled={action.iconFilled} onclick={action.onClick} />
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
				margin: 0;
				font-weight: 600;
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
