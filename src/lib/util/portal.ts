/**
 * Where a portaled node lived in the component tree before it was moved.
 * Portaling breaks DOM ancestry: a nested popover's content ends up as a
 * sibling of its logical parent's content under <body>, so `.contains()`
 * reports "outside" for clicks that are logically inside. Recording the
 * origin lets `containsThrough` stitch the tree back together.
 */
const portalOrigins = new WeakMap<Node, Node>();

export function portal(node: HTMLElement, target: HTMLElement = document.body) {
	if (node.parentNode) portalOrigins.set(node, node.parentNode);
	target.appendChild(node);
	return {
		destroy() {
			portalOrigins.delete(node);
			node.remove();
		}
	};
}

/** `node`'s parent in the logical (pre-portal) tree. */
function logicalParent(node: Node): Node | null {
	return portalOrigins.get(node) ?? node.parentNode;
}

/**
 * Like `container.contains(target)`, but follows portal origins — so a node
 * rendered inside `container` and then portaled to <body> still counts as
 * contained, however deeply the portals nest.
 */
export function containsThrough(container: Node, target: Node | null): boolean {
	for (let node = target; node; node = logicalParent(node)) {
		if (node === container) return true;
	}
	return false;
}
