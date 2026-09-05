<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TreeItemContext, TreeNode, TreeSelectionMode } from './types.js';

	export interface TreeViewProps {
		/** The roots. Every node needs a unique `id`. */
		nodes: TreeNode[];
		/**
		 * Ids of the expanded nodes. Bindable — bind it to drive expansion from
		 * outside (an "expand all" button, a route, a search filter). Leave it
		 * unset to let the tree own the state and seed it with `defaultExpanded`.
		 */
		expanded?: string[];
		/** Initial expansion for the uncontrolled case. Ignored once `expanded` is bound. */
		defaultExpanded?: string[];
		/**
		 * Ids of the selected nodes. Bindable. An array in both modes — `single`
		 * simply never holds more than one, which keeps the type stable when a
		 * consumer flips the mode.
		 */
		selected?: string[];
		/** Initial selection for the uncontrolled case. */
		defaultSelected?: string[];
		selection?: TreeSelectionMode;
		/** Accessible name for the tree. */
		label?: string;
		/** Indent per level, in px. Also the width of the twisty column. */
		indent?: number;
		/** The vertical lines marking each ancestor level. */
		guides?: boolean;
		/** Type a few letters to jump to the next visible node starting with them. */
		typeahead?: boolean;
		onExpandedChange?: (ids: string[]) => void;
		/** Fires with the new selection and the node that caused it. */
		onSelectionChange?: (ids: string[], node: TreeNode) => void;
		/** Enter, or a double-click, on a node — "open this file". */
		onActivate?: (node: TreeNode) => void;
		/** Replaces the glyph. Default is folder-open / folder / file. */
		icon?: Snippet<[TreeItemContext]>;
		/** Replaces the row's label text. */
		children?: Snippet<[TreeItemContext]>;
		/** Right-aligned slot on every row — a count, a status, a size. */
		trailing?: Snippet<[TreeItemContext]>;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import { setContext, tick, untrack } from 'svelte';
	import TreeItem from './TreeItem.svelte';
	import { TREE_VIEW_CONTEXT_KEY, type TreeViewContext } from './types.js';

	let {
		nodes,
		expanded = $bindable(),
		defaultExpanded,
		selected = $bindable(),
		defaultSelected,
		selection = 'single',
		label,
		indent = 20,
		guides = true,
		typeahead = true,
		onExpandedChange,
		onSelectionChange,
		onActivate,
		icon,
		children,
		trailing,
		class: className,
		style
	}: TreeViewProps = $props();

	// `undefined` is the test for "nobody bound me" — an empty array is a
	// legitimate controlled value meaning nothing is open, and must not fall
	// through to the internal state. The defaults are read once and deliberately
	// untracked: they seed these, and a later change to them must not yank a
	// subtree shut under the user.
	let internalExpanded = $state(untrack(() => [...(defaultExpanded ?? [])]));
	let internalSelected = $state(untrack(() => [...(defaultSelected ?? [])]));

	const expandedIds = $derived(expanded ?? internalExpanded);
	const selectedIds = $derived(selection === 'none' ? [] : (selected ?? internalSelected));

	let root: HTMLUListElement | undefined = $state();
	/** The node holding the tree's single tab stop. */
	let activeId: string | undefined = $state();
	/** Where a shift-range starts, in `multiple`. */
	let anchorId: string | undefined = $state();

	/**
	 * The visible nodes, in the order a person sees them.
	 *
	 * Read off the DOM rather than by walking `nodes`, because a collapsed
	 * subtree is not rendered — so document order already *is* the visible list,
	 * and it crosses parent boundaries for free. Walking siblings instead is the
	 * classic bug: Down on the last child of a folder has to land on the folder's
	 * next sibling, not stop.
	 */
	function items(): HTMLElement[] {
		return root ? [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')] : [];
	}

	const idOf = (el: HTMLElement | null | undefined) => el?.dataset.treeId;

	function focusItem(el: HTMLElement | undefined) {
		if (!el) return;
		activeId = idOf(el);
		el.focus();
	}

	// Exactly one item may be tabbable. If the active one is gone — collapsed
	// away, filtered out, never set — the tab stop falls to the first visible
	// node so the tree never drops out of the tab order entirely.
	$effect(() => {
		void nodes;
		void expandedIds;
		const list = items();
		if (!list.length) return;
		if (!activeId || !list.some((el) => idOf(el) === activeId)) activeId = idOf(list[0]);
	});

	function commitExpanded(next: string[]) {
		if (expanded !== undefined) expanded = next;
		else internalExpanded = next;
		onExpandedChange?.(next);
	}

	function setExpanded(node: TreeNode, open: boolean) {
		const isOpen = expandedIds.includes(node.id);
		if (isOpen === open) return;
		if (!open) {
			// Focus is about to be inside a subtree that stops existing. Move it up
			// to the node being collapsed first, which is where a person expects to
			// land anyway.
			const el = root?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(node.id)}"]`);
			if (el && el !== document.activeElement && el.contains(document.activeElement)) {
				activeId = node.id;
				tick().then(() => el.focus());
			}
		}
		commitExpanded(open ? [...expandedIds, node.id] : expandedIds.filter((id) => id !== node.id));
	}

	function toggle(node: TreeNode) {
		if (node.disabled) return;
		setExpanded(node, !expandedIds.includes(node.id));
	}

	function commitSelected(next: string[], node: TreeNode) {
		if (selected !== undefined) selected = next;
		else internalSelected = next;
		onSelectionChange?.(next, node);
	}

	function select(node: TreeNode, event: MouseEvent | KeyboardEvent) {
		if (selection === 'none' || node.disabled) return;

		if (selection === 'multiple' && event.shiftKey && anchorId) {
			const list = items().map((el) => idOf(el)!);
			const from = list.indexOf(anchorId);
			const to = list.indexOf(node.id);
			if (from !== -1 && to !== -1) {
				const [lo, hi] = from < to ? [from, to] : [to, from];
				commitSelected(list.slice(lo, hi + 1), node);
				return;
			}
		}

		anchorId = node.id;

		const toggling =
			event.metaKey || event.ctrlKey || (event.type === 'keydown' && (event as KeyboardEvent).key === ' ');
		if (selection === 'multiple' && toggling) {
			// Space and ctrl/cmd-click both mean "add or remove this one"; a plain
			// click or Enter still replaces the selection.
			const next = selectedIds.includes(node.id)
				? selectedIds.filter((id) => id !== node.id)
				: [...selectedIds, node.id];
			commitSelected(next, node);
			return;
		}

		commitSelected([node.id], node);
	}

	function activate(node: TreeNode) {
		if (node.disabled) return;
		onActivate?.(node);
	}

	setContext<TreeViewContext>(TREE_VIEW_CONTEXT_KEY, {
		get expanded() {
			return expandedIds;
		},
		get selected() {
			return selectedIds;
		},
		get activeId() {
			return activeId;
		},
		get selection() {
			return selection;
		},
		get icon() {
			return icon;
		},
		get children() {
			return children;
		},
		get trailing() {
			return trailing;
		},
		toggle,
		select,
		activate,
		focusEnter: (id) => (activeId = id)
	});

	/** Find a node by id in the source data, for the handlers that need the object. */
	function findNode(id: string | undefined, list: TreeNode[] = nodes): TreeNode | undefined {
		if (!id) return undefined;
		for (const node of list) {
			if (node.id === id) return node;
			const hit = node.children && findNode(id, node.children);
			if (hit) return hit;
		}
		return undefined;
	}

	let typeBuffer = '';
	let typeTimer: ReturnType<typeof setTimeout> | undefined;

	function runTypeahead(list: HTMLElement[], from: number, key: string) {
		clearTimeout(typeTimer);
		typeBuffer += key.toLowerCase();
		typeTimer = setTimeout(() => (typeBuffer = ''), 600);

		// Start after the current node and wrap, so repeating a letter walks
		// through every node beginning with it.
		for (let step = 1; step <= list.length; step++) {
			const el = list[(from + step) % list.length];
			if (el.dataset.treeLabel?.toLowerCase().startsWith(typeBuffer)) {
				focusItem(el);
				return;
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="treeitem"]');
		if (!el || !root) return;

		const list = items();
		const i = list.indexOf(el);
		if (i === -1) return;

		const node = findNode(idOf(el));
		if (!node) return;
		const open = expandedIds.includes(node.id);
		const parent = (el.parentElement?.closest('[role="treeitem"]') as HTMLElement | null) ?? undefined;
		const canExpand = el.getAttribute('aria-expanded') !== null;

		switch (e.key) {
			case 'ArrowDown':
				focusItem(list[i + 1]);
				break;
			case 'ArrowUp':
				focusItem(list[i - 1]);
				break;
			case 'ArrowRight':
				// Expand first; only once it is already open does Right descend —
				// and the first child is simply the next node in document order.
				if (canExpand && !open) setExpanded(node, true);
				else if (canExpand && open) focusItem(list[i + 1]);
				break;
			case 'ArrowLeft':
				// The mirror image: collapse, then step out to the parent.
				if (canExpand && open) setExpanded(node, false);
				else focusItem(parent);
				break;
			case 'Home':
				focusItem(list[0]);
				break;
			case 'End':
				focusItem(list[list.length - 1]);
				break;
			case 'Enter':
				select(node, e);
				activate(node);
				break;
			case ' ':
				select(node, e);
				break;
			case '*': {
				// APG: expand every sibling of the focused node at once.
				const siblings = (parent ?? root).querySelectorAll<HTMLElement>(':scope > ul > [role="treeitem"], :scope > [role="treeitem"]');
				const ids = [...siblings].map((s) => idOf(s)!).filter((id) => !expandedIds.includes(id));
				const openable = ids.filter((id) => findNode(id) && (findNode(id)!.children?.length || findNode(id)!.expandable));
				if (openable.length) commitExpanded([...expandedIds, ...openable]);
				break;
			}
			default:
				if (typeahead && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && /\S/.test(e.key)) {
					runTypeahead(list, i, e.key);
					break;
				}
				return;
		}

		// Every branch that got here consumed the key — Down must not also scroll
		// the page, and Space must not either.
		e.preventDefault();
	}
</script>

<ul
	bind:this={root}
	class={['glow-tree', className].filter(Boolean).join(' ')}
	class:guides
	role="tree"
	aria-label={label}
	aria-multiselectable={selection === 'multiple' ? true : undefined}
	style="--glow-tree-indent: {indent}px; {style ?? ''}"
	onkeydown={handleKeyDown}
>
	{#each nodes as node (node.id)}
		<TreeItem {node} level={1} />
	{/each}
</ul>

<style lang="scss">
	.glow-tree {
		list-style: none;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
</style>
