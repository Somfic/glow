/**
 * Shared shape between <TreeView> and the <TreeItem>s inside it.
 *
 * The root owns *all* of the state — expansion, selection, and which node holds
 * the tab stop. An item never holds its own, which is what makes single-select,
 * "collapse an ancestor of the focused node", and a roving tabindex possible
 * without items having to talk to each other.
 *
 * Keyboard navigation is the root's job for the same reason, and it finds the
 * items by querying its own DOM subtree rather than by registration. Collapsed
 * subtrees are not rendered at all, so document order through
 * `[role="treeitem"]` *is* the list of visible nodes, in the order a person
 * sees them — including across parent boundaries, which is the part hand-rolled
 * trees usually get wrong by walking siblings instead.
 */

import type { Snippet } from 'svelte';
import type { IconProp } from '../icon/Icon.svelte';

/**
 * One node. Deliberately structural rather than generic: extra fields survive
 * on the objects you pass in, and every snippet is handed the node back, so a
 * consumer can widen this interface (`interface FileNode extends TreeNode { size: number }`)
 * and read their own fields in the row without the component knowing about them.
 */
export interface TreeNode {
	/** Unique within the tree. Expansion and selection are reported as these. */
	id: string;
	/** Row text, and what typeahead matches against. */
	label: string;
	/** Omit (or leave empty) for a leaf. */
	children?: TreeNode[];
	/** Overrides the default folder/file glyph for this node only. */
	icon?: IconProp;
	/** Focusable and readable, but not selectable and not expandable. */
	disabled?: boolean;
	/**
	 * Forces the twisty on a node whose `children` haven't arrived yet, for a
	 * tree that loads a level at a time. Expanding it fires `onExpandedChange`
	 * with nothing to show until the data lands.
	 */
	expandable?: boolean;
	/** Whatever the row needs and this interface doesn't name. */
	data?: unknown;
}

/** `single` keeps one node selected; `multiple` adds ctrl/cmd and shift; `none` disables it. */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/** What every snippet on a TreeView receives. */
export interface TreeItemContext {
	node: TreeNode;
	/** 1-based, and the value of `aria-level`. */
	level: number;
	expanded: boolean;
	selected: boolean;
	/** True for anything that draws a twisty, including an empty `expandable` node. */
	hasChildren: boolean;
}

export const TREE_VIEW_CONTEXT_KEY = Symbol('glow:tree-view');

export interface TreeViewContext {
	/** Reactive — read it, don't cache it. */
	readonly expanded: string[];
	readonly selected: string[];
	/** The node holding the single tab stop. */
	readonly activeId: string | undefined;
	readonly selection: TreeSelectionMode;
	readonly icon: Snippet<[TreeItemContext]> | undefined;
	readonly children: Snippet<[TreeItemContext]> | undefined;
	readonly trailing: Snippet<[TreeItemContext]> | undefined;
	toggle: (node: TreeNode) => void;
	select: (node: TreeNode, event: MouseEvent | KeyboardEvent) => void;
	activate: (node: TreeNode) => void;
	focusEnter: (id: string) => void;
}
