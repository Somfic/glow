<script lang="ts">
	interface Props {
		size?: number | string;
		color?: string;
	}

	let { size = 16, color }: Props = $props();

	const sizeValue = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<span
	class="spinner"
	style="width: {sizeValue}; height: {sizeValue};{color ? ` --spinner-color: ${color};` : ''}"
	role="status"
	aria-label="Loading"
></span>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid rgba($fg, 0.2);
		border-top-color: var(--spinner-color, #{$primary});
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
