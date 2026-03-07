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

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.group {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  margin: 1.5em 0;
  background-color: hsl(240, 11%, 9%);
  border: 1px solid rgba(238, 238, 238, 0.06);
}
.group .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1em 1.25em;
  font-weight: 600;
  background: linear-gradient(to bottom, rgba(238, 238, 238, 0.02), transparent);
  border-bottom: 1px solid rgba(238, 238, 238, 0.06);
  border-radius: 12px 12px 0 0;
}
.group .header .label {
  display: flex;
  align-items: center;
  gap: 0.625em;
  font-size: 0.9375rem;
  color: rgba(238, 238, 238, 0.9);
}
.group .content {
  padding: 1.25em;
  gap: 1em;
  display: flex;
  flex-direction: column;
}</style>
