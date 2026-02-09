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
		children?: () => any;
	} & (IconProps | LabelProps);

	let { label, icon, actions, children }: Props = $props();
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
		margin: 1em 0;

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5em 1em;
			padding-right: 0.5em;
			font-weight: 700;
			background-color: $border-color;
			border-radius: $radius-small $radius-small 0 0;
			min-height: 3.5rem;

			.label {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 0.5em;
			}
		}

		.content {
			gap: 0.5em;
			padding: 0.5em;
			border: $border;
			border-top: none;
			border-radius: 0 0 $radius-small $radius-small;
		}
	}
</style>
