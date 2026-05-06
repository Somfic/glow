import type { Snippet } from 'svelte';

export type SplitDirection = 'horizontal' | 'vertical';

export type SplitPane = {
	/** Stable identifier — used as the layout key and the onResize record key. */
	id: string;
	/** Initial size as a percentage of the container. Sum of all panes' default
	 *  sizes should equal 100. */
	defaultSize: number;
	/** Minimum percentage the pane will shrink to before clamping. Default 5. */
	minSize?: number;
	/** Maximum percentage the pane will grow to before clamping. Default 95. */
	maxSize?: number;
	/** Pane content. */
	content: Snippet;
	/** When true, double-clicking the trailing handle collapses the pane (snaps
	 *  to `minSize`); a second double-click restores it to its previous size. */
	collapsible?: boolean;
	/** Extra class on the pane container. */
	class?: string;
};
