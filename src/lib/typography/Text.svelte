<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		as = 'p',
		size = 'base',
		variant = 'primary',
		weight = 'normal',
		align,
		children
	}: {
		as?: 'p' | 'span' | 'div';
		size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
		variant?: 'primary' | 'secondary' | 'muted';
		weight?: 'normal' | 'medium' | 'semibold' | 'bold';
		align?: 'left' | 'center' | 'right';
		children: Snippet;
	} = $props();
</script>

{#if as === 'p'}
	<p
		class="text size-{size} variant-{variant} weight-{weight}"
		class:align-left={align === 'left'}
		class:align-center={align === 'center'}
		class:align-right={align === 'right'}
	>
		{@render children()}
	</p>
{:else if as === 'span'}
	<span
		class="text size-{size} variant-{variant} weight-{weight}"
		class:align-left={align === 'left'}
		class:align-center={align === 'center'}
		class:align-right={align === 'right'}
	>
		{@render children()}
	</span>
{:else}
	<div
		class="text size-{size} variant-{variant} weight-{weight}"
		class:align-left={align === 'left'}
		class:align-center={align === 'center'}
		class:align-right={align === 'right'}
	>
		{@render children()}
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.text {
		margin: 0;
		line-height: 1.6;

		&.size-xs {
			font-size: $text-xs;
		}

		&.size-sm {
			font-size: $text-sm;
		}

		&.size-base {
			font-size: $text-base;
		}

		&.size-lg {
			font-size: $text-lg;
		}

		&.size-xl {
			font-size: $text-xl;
		}

		&.variant-primary {
			color: $text-primary;
		}

		&.variant-secondary {
			color: $text-secondary;
		}

		&.variant-muted {
			color: $text-muted;
		}

		&.weight-normal {
			font-weight: 400;
		}

		&.weight-medium {
			font-weight: 500;
		}

		&.weight-semibold {
			font-weight: 600;
		}

		&.weight-bold {
			font-weight: 700;
		}

		&.align-left {
			text-align: left;
		}

		&.align-center {
			text-align: center;
		}

		&.align-right {
			text-align: right;
		}
	}
</style>
