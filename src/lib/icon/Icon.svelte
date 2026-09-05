<script lang="ts" module>
	export { type IconName } from './types.js';

	export type IconProps = { name: IconName; size?: number | string; color?: string; fill?: boolean };
	export type IconProp = IconName | IconProps;

	export function resolveIcon(icon: IconProp): IconProps {
		return typeof icon === 'string' ? { name: icon } : icon;
	}
</script>

<script lang="ts">
	import { icons, type IconName } from './types.js';
	import type { Component } from 'svelte';

	let {
		name,
		size = '1em',
		color,
		fill = false
	}: { name: IconName; size?: number | string; color?: string; fill?: boolean } = $props();

	const IconComponent = $derived(icons[name] as Component<{ size?: number | string; color?: string; fill?: string }>);
</script>

<span class="icon" style="--icon-color: {color ?? 'currentColor'}; --icon-fill: {fill ? color ?? 'currentColor' : 'none'}">
	<IconComponent {size} color="var(--icon-color)" fill="var(--icon-fill)" />
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
		transition: --icon-color var(--glow-dur-fast) var(--glow-ease-out), --icon-fill var(--glow-dur-fast) var(--glow-ease-out);
	}

	.icon :global(svg) {
		transition: stroke var(--glow-dur-fast) var(--glow-ease-out), fill var(--glow-dur-fast) var(--glow-ease-out);
	}
</style>
