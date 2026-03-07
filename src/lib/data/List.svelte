<script lang="ts">
	import type { ListProps } from './types.js';
	import ListItem from './ListItem.svelte';

	let {
		items = [],
		variant = 'default',
		divided = false,
		hoverable = true,
		selectable = false,
		selectedId = $bindable(undefined),
		onSelect
	}: ListProps = $props();

	function handleSelect(id: string) {
		if (!selectable) return;

		selectedId = selectedId === id ? undefined : id;
		onSelect?.(id);
	}
</script>

<div class="list" class:divided>
	{#each items as item (item.id)}
		<ListItem
			{item}
			{variant}
			{hoverable}
			selected={selectable && selectedId === item.id}
			onSelect={selectable ? () => handleSelect(item.id) : undefined}
		/>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.list {
		display: flex;
		flex-direction: column;

		&.divided {
			:global(.list-item:not(:last-child)) {
				border-bottom: 1px solid rgba($border-color, 0.5);
			}
		}
	}
</style>
