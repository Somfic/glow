<script lang="ts">
	import { setContext } from 'svelte';

	setContext('button-group', { defaultVariant: 'ternary' });

	type Props = {
		noborder?: boolean;
		children?: () => any;
	};

	let { noborder, children }: Props = $props();
</script>

<div class="button-group" class:noborder>
	{@render children?.()}
</div>

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.button-group {
  display: inline-flex;
  border-radius: 12px;
}
.button-group :global(button) {
  border-radius: 0px;
}
.button-group :global(button):not(.no-border) {
  border: 1px solid #30313C;
}
.button-group :global(button):not(:first-child) {
  margin-left: -1px;
}
.button-group :global(button:first-child) {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}
.button-group :global(button:last-child) {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}
.button-group :global(button:only-child) {
  border-radius: 12px;
}</style>
