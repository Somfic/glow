<script lang="ts">
	import Button from '../button/Button.svelte';
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
		<Icon name={icons[variant]} />
	</div>
	<span class="label">
		{label}
	</span>
	<Button icon="X" variant="ternary" />
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5em;
  font-weight: bold;
  flex-grow: 1;
  border-radius: 12px;
  padding: 0.5em;
  color: #090A13;
  margin: 1em 0;
}
.banner:first-child {
  margin-top: 0;
}
.banner:last-child {
  margin-bottom: 0;
}
.banner .label {
  flex-grow: 1;
}
.banner.error {
  background-color: hsl(355, 70%, 74%);
  border-color: hsl(355, 70%, 64%);
}
.banner.warning {
  background-color: hsl(45, 70%, 74%);
  border-color: hsl(45, 70%, 64%);
}
.banner.info {
  background-color: hsl(195, 70%, 74%);
  border-color: hsl(195, 70%, 64%);
}
.banner.success {
  background-color: hsl(120, 70%, 74%);
}</style>
