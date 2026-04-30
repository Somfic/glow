<script lang="ts">
	let {
		size,
		style,
		class: className
	}: {
		/**
		 * Fixed size (e.g. `1rem`, `24px`). When omitted, the spacer grows to
		 * fill remaining space (`flex: 1`).
		 */
		size?: string;
		style?: string;
		class?: string;
	} = $props();
</script>

<div
	class={['spacer', className].filter(Boolean).join(' ')}
	style:flex={size ? `0 0 ${size}` : '1 1 auto'}
	style:min-width={size}
	style:min-height={size}
	{style}
	aria-hidden="true"
></div>

<style>
	.spacer {
		align-self: stretch;
	}
</style>
