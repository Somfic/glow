<script lang="ts" module>
	export { type IconName } from './types.js';
</script>

<script lang="ts">
	import { icons, type IconName } from './types.js';
	import type { Component } from 'svelte';

	let { name, size = 16 }: { name: IconName; size?: number } = $props();

	const IconComponent = $derived(icons[name] as Component<{ size?: number }>);
</script>

<IconComponent {size} />
