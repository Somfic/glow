<script lang="ts">
	let {
		orientation = 'horizontal',
		spacing = 'md',
		style,
		class: className
	}: {
		orientation?: 'horizontal' | 'vertical';
		spacing?: 'none' | 'sm' | 'md' | 'lg';
		style?: string;
		class?: string;
	} = $props();

	const spaceMap = { none: '0', sm: '0.5rem', md: '1rem', lg: '1.5rem' } as const;
</script>

<div
	role="separator"
	aria-orientation={orientation}
	class={['divider', orientation, className].filter(Boolean).join(' ')}
	style:--space={spaceMap[spacing]}
	{style}
></div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.divider {
		background: rgba(255, 255, 255, 0.08);
		flex: 0 0 auto;
	}

	.horizontal {
		height: 1px;
		width: 100%;
		margin: var(--space) 0;
	}

	.vertical {
		width: 1px;
		align-self: stretch;
		margin: 0 var(--space);
	}
</style>
