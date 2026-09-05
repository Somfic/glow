<script lang="ts" module>
	export { type IconName } from './types.js';

	export type IconProps = { name: IconName; size?: number | string; color?: string; fill?: boolean };
	export type IconProp = IconName | IconProps;

	export function resolveIcon(icon: IconProp): IconProps {
		return typeof icon === 'string' ? { name: icon } : icon;
	}

	// Module-level, so a name is reported once for the life of the page rather
	// than once per instance: the docs' icon grid alone would print ~100 copies
	// of the same line and bury everything else in the console.
	const warned = new Set<string>();
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

	// `name` is typed, but it routinely arrives as a plain `string` from data,
	// where the type system cannot help. `icons[name]` was then `undefined` and
	// the component rendered an empty span: no glyph, no warning, and the box it
	// was holding open collapsed. Lucide's deprecated aliases are the usual way
	// in — `FileJson` is one, and its canonical name here is `FileBraces`.
	const missing = $derived(!name || !(name in icons));

	// TriangleAlert rather than a hand-rolled shape: it is a lucide icon like any
	// other, so it renders the identical `width`/`height`/`viewBox` box at every
	// size and nothing around it reflows.
	const IconComponent = $derived(
		(missing ? icons.TriangleAlert : icons[name]) as Component<{ size?: number | string; color?: string; fill?: string }>
	);

	// `import.meta.env?.DEV` and not a bare `.DEV`: this ships to consumers, and
	// a bundler that doesn't define `import.meta.env` would otherwise throw
	// rather than warn.
	$effect(() => {
		if (!missing || !import.meta.env?.DEV || warned.has(name)) return;
		warned.add(name);
		console.warn(
			`[glow] <Icon name="${name}"> — not a Lucide icon name in this build. Rendering the missing-icon glyph instead.`
		);
	});
</script>

<!-- The fallback ignores `color`/`fill` on purpose: an unknown name inheriting
     the surrounding colour looks like a deliberate icon in a screenshot, which
     is the failure this replaced. Danger red reads as broken at a glance. -->
<span
	class="icon"
	style="--icon-color: {missing ? 'var(--glow-color-danger)' : (color ?? 'currentColor')}; --icon-fill: {!missing &&
	fill
		? (color ?? 'currentColor')
		: 'none'}"
>
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
