<script lang="ts">
	import { getContext } from 'svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Self from './TreeItem.svelte';
	import { TREE_VIEW_CONTEXT_KEY, type TreeItemContext, type TreeNode, type TreeViewContext } from './types.js';

	interface Props {
		node: TreeNode;
		/** 1-based; `aria-level` is this verbatim. */
		level: number;
	}

	let { node, level }: Props = $props();

	const ctx = getContext<TreeViewContext>(TREE_VIEW_CONTEXT_KEY);
	if (!ctx) throw new Error('<TreeItem> must be used inside a <TreeView>.');

	const hasChildren = $derived(node.expandable === true || (node.children?.length ?? 0) > 0);
	const isExpanded = $derived(hasChildren && ctx.expanded.includes(node.id));
	const isSelected = $derived(ctx.selected.includes(node.id));

	const item = $derived<TreeItemContext>({
		node,
		level,
		expanded: isExpanded,
		selected: isSelected,
		hasChildren
	});

	function onTwistyClick(e: MouseEvent) {
		// The row's own click selects; the twisty must only expand, or every
		// click on the chevron would also move the selection.
		e.stopPropagation();
		ctx.toggle(node);
	}

	// A treeitem is nested inside its ancestors' treeitems, so a click on a deep
	// row bubbles through every one of them. The innermost <li> claims it.
	function onRowClick(e: MouseEvent) {
		e.stopPropagation();
		ctx.select(node, e);
	}

	function onRowDblClick(e: MouseEvent) {
		e.stopPropagation();
		if (hasChildren) ctx.toggle(node);
		else ctx.activate(node);
	}
</script>

<!--
	Recursion by a component that renders itself, rather than by a recursive
	snippet. A snippet would have to be threaded down through every level (or
	stashed in context and re-rendered against a foreign scope), and it cannot
	hold the per-node derived state — `isExpanded`, `isSelected`, the item
	context object — that each row needs. A self-importing component gets that
	for free, and each level's `{#if}` is what keeps a collapsed subtree out of
	the DOM entirely.
-->
<!-- Keys are handled once, by delegation on the <ul role="tree">: it is the only
     place that knows the full set of visible nodes. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<li
	class="tree-item"
	class:selected={isSelected}
	class:expanded={isExpanded}
	role="treeitem"
	aria-level={level}
	aria-expanded={hasChildren ? isExpanded : undefined}
	aria-selected={ctx.selection === 'none' ? undefined : isSelected}
	aria-disabled={node.disabled || undefined}
	data-tree-id={node.id}
	data-tree-label={node.label}
	tabindex={ctx.activeId === node.id ? 0 : -1}
	onfocusin={() => ctx.focusEnter(node.id)}
	onclick={onRowClick}
	ondblclick={onRowDblClick}
>
	<div class="tree-row" style="--tree-level: {level}">
		<!-- Aria-hidden and unfocusable: the tree pattern puts every key on the
		     treeitem itself, so a second tab stop here would be a second thing to
		     escape from. preventDefault on mousedown keeps focus on the <li>. -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			class="twisty"
			class:open={isExpanded}
			aria-hidden="true"
			onclick={hasChildren ? onTwistyClick : undefined}
			onmousedown={(e) => e.preventDefault()}
		>
			{#if hasChildren}
				<Icon name="ChevronRight" size={14} />
			{/if}
		</span>

		<span class="node-icon" aria-hidden="true">
			{#if ctx.icon}
				{@render ctx.icon(item)}
			{:else if node.icon}
				<Icon {...resolveIcon(node.icon)} size={resolveIcon(node.icon).size ?? 14} />
			{:else if hasChildren}
				<Icon name={isExpanded ? 'FolderOpen' : 'Folder'} size={14} />
			{:else}
				<Icon name="File" size={14} />
			{/if}
		</span>

		<span class="label">
			{#if ctx.children}
				{@render ctx.children(item)}
			{:else}
				{node.label}
			{/if}
		</span>

		{#if ctx.trailing}
			<span class="trailing">{@render ctx.trailing(item)}</span>
		{/if}
	</div>

	{#if isExpanded && node.children?.length}
		<ul class="group" role="group">
			{#each node.children as child (child.id)}
				<Self node={child} level={level + 1} />
			{/each}
		</ul>
	{/if}
</li>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.tree-item {
		list-style: none;
		margin: 0;
		padding: 0;
		// The focus ring is drawn on the row, which is the visible thing; the
		// <li> is only the focus *target* because that is what the tree pattern
		// requires the treeitem role to sit on.
		outline: none;
	}

	.tree-row {
		// Every length here is a whole number of px on purpose. The indent guides
		// below are a gradient whose period is --glow-tree-indent, so an em- or
		// percentage-based indent would park each level's line on a different
		// subpixel and stop it lining up with the chevron it belongs to.
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 28px;
		padding: 4px 8px 4px
			calc(var(--glow-tree-pad, 8px) + (var(--tree-level) - 1) * var(--glow-tree-indent, 20px));
		border-radius: 6px;
		color: var(--glow-text-primary);
		font-family: $font-family;
		font-size: $text-sm;
		line-height: 20px;
		cursor: pointer;
		user-select: none;
		transition: background var(--glow-dur-fast) var(--glow-ease-out),
			color var(--glow-dur-fast) var(--glow-ease-out);

		// Indent guides: one vertical line per ancestor level, drawn as a gradient
		// with a period of exactly one indent and the line at its half-way point —
		// which is where .twisty centres the chevron, so the two agree by
		// construction rather than by a tuned offset.
		background-repeat: no-repeat;
		background-position: var(--glow-tree-pad, 8px) 0;
		background-size: calc((var(--tree-level) - 1) * var(--glow-tree-indent, 20px)) 100%;

		&:hover {
			background-color: var(--glow-state-hover);
		}
	}

	:global(.glow-tree.guides) .tree-row {
		background-image: repeating-linear-gradient(
			to right,
			transparent 0,
			transparent calc(var(--glow-tree-indent, 20px) / 2 - 0.5px),
			var(--glow-border-color) calc(var(--glow-tree-indent, 20px) / 2 - 0.5px),
			var(--glow-border-color) calc(var(--glow-tree-indent, 20px) / 2 + 0.5px),
			transparent calc(var(--glow-tree-indent, 20px) / 2 + 0.5px),
			transparent var(--glow-tree-indent, 20px)
		);
	}

	.selected > .tree-row {
		background-color: var(--glow-primary-soft);
		color: var(--glow-primary);
	}

	.tree-item:focus-visible > .tree-row {
		outline: 2px solid var(--glow-primary);
		outline-offset: -2px;
	}

	[aria-disabled='true'] > .tree-row {
		@include disabled-content;
		cursor: default;
	}

	.twisty {
		flex: 0 0 auto;
		// Exactly one indent wide, so the glyph's centre lands on the guide line
		// for this level and on the chevron of every sibling below it.
		width: var(--glow-tree-indent, 20px);
		height: 20px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--glow-text-secondary);
		transition: transform var(--glow-dur-base) var(--glow-ease-out);

		&.open {
			transform: rotate(90deg);
		}
	}

	.node-icon {
		flex: 0 0 auto;
		// A 14px icon box against a 20px line box: both are centred by the row's
		// `align-items: center` on an even height, so the two centre lines agree
		// instead of the icon riding high against the text.
		display: inline-flex;
		align-items: center;
		height: 20px;
		color: var(--glow-text-secondary);
	}

	.selected > .tree-row .node-icon,
	.selected > .tree-row .twisty {
		color: inherit;
	}

	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trailing {
		margin-left: auto;
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		height: 20px;
		color: var(--glow-text-secondary);
		font-size: $text-xs;
	}

	.group {
		list-style: none;
		margin: 0;
		padding: 0;
		// Collapsed subtrees are not in the DOM at all, so there is nothing left
		// to animate on the way out — only the reveal is animated. It is a CSS
		// `animation` off the duration token rather than a Svelte `transition:`
		// with a numeric duration, because the token is what collapses to 1ms
		// under prefers-reduced-motion and a number in the component does not.
		animation: tree-expand var(--glow-dur-base) var(--glow-ease-out);
	}

	@keyframes tree-expand {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
	}
</style>
