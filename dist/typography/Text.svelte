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
	<p class="text size-{size} variant-{variant} weight-{weight}" class:align-left={align === 'left'} class:align-center={align === 'center'} class:align-right={align === 'right'}>
		{@render children()}
	</p>
{:else if as === 'span'}
	<span class="text size-{size} variant-{variant} weight-{weight}" class:align-left={align === 'left'} class:align-center={align === 'center'} class:align-right={align === 'right'}>
		{@render children()}
	</span>
{:else}
	<div class="text size-{size} variant-{variant} weight-{weight}" class:align-left={align === 'left'} class:align-center={align === 'center'} class:align-right={align === 'right'}>
		{@render children()}
	</div>
{/if}

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.text {
  margin: 0;
  line-height: 1.6;
}
.text.size-xs {
  font-size: 0.75rem;
}
.text.size-sm {
  font-size: 0.875rem;
}
.text.size-base {
  font-size: 1rem;
}
.text.size-lg {
  font-size: 1.125rem;
}
.text.size-xl {
  font-size: 1.25rem;
}
.text.variant-primary {
  color: #eee;
}
.text.variant-secondary {
  color: rgba(238, 238, 238, 0.7);
}
.text.variant-muted {
  color: rgba(238, 238, 238, 0.5);
}
.text.weight-normal {
  font-weight: 400;
}
.text.weight-medium {
  font-weight: 500;
}
.text.weight-semibold {
  font-weight: 600;
}
.text.weight-bold {
  font-weight: 700;
}
.text.align-left {
  text-align: left;
}
.text.align-center {
  text-align: center;
}
.text.align-right {
  text-align: right;
}</style>
