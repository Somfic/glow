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

<style lang="scss">
	@use '../style/theme.scss' as *;

	.button-group {
		display: inline-flex;

		:global(button) {
			border-radius: 0px;

			&:not(.no-border) {
				border: $border;
			}

			// negative margin to collapse borders between buttons
			&:not(:first-child) {
				margin-left: -$border-width;
			}
		}

		:global(button:first-child) {
			border-top-left-radius: $radius;
			border-bottom-left-radius: $radius;
		}

		:global(button:last-child) {
			border-top-right-radius: $radius;
			border-bottom-right-radius: $radius;
		}

		:global(button:only-child) {
			border-radius: $radius;
		}
	}
</style>
