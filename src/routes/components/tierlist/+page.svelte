<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import { sortable } from '$lib/sortable/sortable.js';

	type Item = { id: string; label: string; emoji: string };

	const tiers = [
		{ key: 'S', color: '#ff7676' },
		{ key: 'A', color: '#ffa766' },
		{ key: 'B', color: '#ffd166' },
		{ key: 'C', color: '#9bd166' },
		{ key: 'D', color: '#66c6d1' }
	] as const;

	// One reactive array per row plus the unranked pool. Every container below
	// is `use:sortable` with the same `group`, so a card dragged from any row
	// into another moves between these arrays live, mid-drag.
	let lists = $state<Record<string, Item[]>>({
		S: [],
		A: [],
		B: [],
		C: [],
		D: [],
		pool: [
			{ id: 'ts', label: 'TypeScript', emoji: '🟦' },
			{ id: 'rs', label: 'Rust', emoji: '🦀' },
			{ id: 'go', label: 'Go', emoji: '🐹' },
			{ id: 'py', label: 'Python', emoji: '🐍' },
			{ id: 'sv', label: 'Svelte', emoji: '🧡' },
			{ id: 'el', label: 'Elixir', emoji: '💧' },
			{ id: 'hs', label: 'Haskell', emoji: '🔣' },
			{ id: 'zg', label: 'Zig', emoji: '⚡' },
			{ id: 'rb', label: 'Ruby', emoji: '💎' },
			{ id: 'cl', label: 'Clojure', emoji: '🌀' }
		]
	});

	function reset(): void {
		const all = [...tiers.map((t) => t.key), 'pool'].flatMap((k) => lists[k]);
		for (const t of tiers) lists[t.key] = [];
		lists.pool = all.sort((a, b) => a.label.localeCompare(b.label));
	}
</script>

<svelte:head><title>Tier List | Glow UI</title></svelte:head>

<Heading level={1}>Tier List</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A tier list is just several <Code>use:sortable</Code> containers that share a
	<Code>group</Code>. Drag a card out of any row and over another — it moves between the rows'
	backing arrays live, mid-drag, and settles with the same FLIP animation. The
	<Code>group</Code> option is the only addition to the sortable action; nothing here is tier-list
	specific.
</Text>

<Card title="Rank the languages">
	<div class="tl-toolbar">
		<Text variant="secondary" size="sm">
			Drag cards from the pool into a tier, between tiers, or reorder within one.
		</Text>
		<button class="tl-reset" onclick={reset}>Reset</button>
	</div>

	<div class="tl">
		{#each tiers as tier (tier.key)}
			<div class="tl-row">
				<div class="tl-label" style="--tl-c: {tier.color}">{tier.key}</div>
				<div
					class="tl-drop"
					use:sortable={{ items: lists[tier.key], direction: 'horizontal', group: 'tl' }}
				>
					{#each lists[tier.key] as item (item.id)}
						<div class="tl-card"><span class="tl-emoji">{item.emoji}</span>{item.label}</div>
					{/each}
					{#if lists[tier.key].length === 0}
						<span class="tl-empty">drop here</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<Text size="sm" variant="secondary" style="margin: 1.25rem 0 0.5rem;">Unranked</Text>
	<div class="tl-pool" use:sortable={{ items: lists.pool, direction: 'horizontal', group: 'tl' }}>
		{#each lists.pool as item (item.id)}
			<div class="tl-card"><span class="tl-emoji">{item.emoji}</span>{item.label}</div>
		{/each}
		{#if lists.pool.length === 0}
			<span class="tl-empty">everything ranked 🎉</span>
		{/if}
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="How it works">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		Give every container the same <Code>group</Code> string. Each keeps its own reactive
		<Code>items</Code> array; the action moves the dragged item from one array to another as the
		pointer crosses container bounds, so keyed <Code>{'{#each}'}</Code> blocks just re-render.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { sortable } from '@somfic/glow';

  let s = $state([]);
  let a = $state([]);
  let pool = $state([
    { id: 'ts', label: 'TypeScript' },
    { id: 'rs', label: 'Rust' }
  ]);
<\/script>

{#each [['S', s], ['A', a]] as [name, items]}
  <div use:sortable={{ items, direction: 'horizontal', group: 'tl' }}>
    {#each items as it (it.id)}<Card>{it.label}</Card>{/each}
  </div>
{/each}

<div use:sortable={{ items: pool, direction: 'horizontal', group: 'tl' }}>
  {#each pool as it (it.id)}<Card>{it.label}</Card>{/each}
</div>`}
	/>
	<Text size="sm" variant="secondary" style="margin-top: 0.75rem;">
		Containers in one group may mix axes — horizontal tier rows feeding a vertical pool work the
		same. Without <Code>group</Code> the action behaves exactly as before: reorder within a single
		container only.
	</Text>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.tl-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $space-md;
		margin-bottom: 1rem;
	}
	.tl-reset {
		flex: none;
		padding: $space-xs $space-md;
		border-radius: $radius;
		border: $border;
		background: var(--glow-bg-surface-element);
		color: var(--glow-fg);
		font-size: $text-sm;
		cursor: pointer;
		transition: background-color $dur-fast ease;

		&:hover {
			background-color: $tertiary-hover;
		}
	}
	.tl {
		display: flex;
		flex-direction: column;
		gap: $space-xs;
	}
	.tl-row {
		display: flex;
		align-items: stretch;
		gap: $space-xs;
		min-height: 56px;
	}
	.tl-label {
		flex: none;
		width: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: $radius;
		background: var(--tl-c);
		color: #1a1a1a;
		font-weight: 700;
		font-size: 1.25rem;
	}
	.tl-drop,
	.tl-pool {
		flex: 1;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: $space-xs;
		padding: $space-xs;
		border-radius: $radius;
		border: 1px dashed var(--glow-border);
		background: var(--glow-bg-surface);
	}
	.tl-pool {
		min-height: 56px;
	}
	.tl-card {
		display: inline-flex;
		align-items: center;
		gap: $space-xs;
		padding: $space-xs $space-md;
		border-radius: $radius;
		background: var(--glow-bg-surface-element);
		border: $border;
		font-size: $text-sm;
		white-space: nowrap;
		cursor: grab;
		user-select: none;
		transition: background-color $dur-fast ease;

		&:hover {
			background-color: $tertiary-hover;
		}
	}
	.tl-emoji {
		font-size: 1rem;
		line-height: 1;
	}
	.tl-empty {
		align-self: center;
		padding: 0 $space-sm;
		font-size: $text-sm;
		color: var(--glow-text-muted);
		pointer-events: none;
	}
</style>
