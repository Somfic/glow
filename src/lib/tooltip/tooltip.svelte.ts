import { mount, unmount } from 'svelte';
import TooltipComponent from './Tooltip.svelte';
import { setCursorState } from '../cursor/cursor.svelte.js';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
	content: string;
	position?: TooltipPosition;
	delay?: number;
	useCursor?: boolean;
};

export type TooltipParams = string | TooltipOptions;

export function tooltip(node: HTMLElement, params: TooltipParams) {
	let tooltipInstance: Record<string, unknown> | null = null;
	let tooltipTarget: HTMLDivElement | null = null;
	let showTimeout: ReturnType<typeof setTimeout> | null = null;

	// Reactive props handed to the mounted Tooltip. Because this is a `$state`
	// proxy, mutating its fields live-updates the rendered tooltip — that's how
	// it follows the trigger on scroll/resize without remounting.
	const props = $state<{ content: string; x: number; y: number; position: TooltipPosition }>({
		content: '',
		x: 0,
		y: 0,
		position: 'top'
	});

	const options: TooltipOptions =
		typeof params === 'string' ? { content: params } : params;

	// Note: we don't early-return when content is empty. Listeners always
	// attach so that consumers can flip content on/off via `update` (e.g. a
	// sidebar that adds a tooltip only when collapsed). `show` bails on empty
	// content instead.
	if (options.useCursor) {
		node.setAttribute('data-cursor-controlled', 'true');
	}

	function getPosition(
		triggerRect: DOMRect,
		pos: TooltipPosition
	): { x: number; y: number; finalPosition: TooltipPosition } {
		let x = 0;
		let y = 0;
		let finalPosition = pos;

		switch (pos) {
			case 'top':
				x = triggerRect.left + triggerRect.width / 2;
				y = triggerRect.top;
				break;
			case 'bottom':
				x = triggerRect.left + triggerRect.width / 2;
				y = triggerRect.bottom;
				break;
			case 'left':
				x = triggerRect.left;
				y = triggerRect.top + triggerRect.height / 2;
				break;
			case 'right':
				x = triggerRect.right;
				y = triggerRect.top + triggerRect.height / 2;
				break;
		}

		const tooltipEstimatedWidth = 250;
		const tooltipEstimatedHeight = 50;
		const margin = 8;

		if (pos === 'top' && y - tooltipEstimatedHeight - margin < 0) {
			finalPosition = 'bottom';
			y = triggerRect.bottom;
		} else if (pos === 'bottom' && y + tooltipEstimatedHeight + margin > window.innerHeight) {
			finalPosition = 'top';
			y = triggerRect.top;
		} else if (pos === 'left' && x - tooltipEstimatedWidth - margin < 0) {
			finalPosition = 'right';
			x = triggerRect.right;
		} else if (pos === 'right' && x + tooltipEstimatedWidth + margin > window.innerWidth) {
			finalPosition = 'left';
			x = triggerRect.left;
		}

		return { x, y, finalPosition };
	}

	// Recompute the tooltip's anchor from the trigger's current rect and push it
	// into the reactive props so the tooltip tracks the element as the page
	// scrolls or resizes. If the trigger has left the DOM, tear the tooltip down
	// rather than leaving it floating.
	function reposition() {
		if (!tooltipInstance) return;
		if (!node.isConnected) {
			teardown();
			return;
		}
		const rect = node.getBoundingClientRect();
		const { x, y, finalPosition } = getPosition(rect, options.position ?? 'top');
		props.x = x;
		props.y = y;
		props.position = finalPosition;
	}

	// Synchronous, race-free removal of a mounted tooltip. Used on hide and on
	// destroy so a tooltip can never be orphaned (e.g. the trigger unmounts while
	// hovered, so no mouseleave ever fires).
	function teardown(outro = false) {
		window.removeEventListener('scroll', reposition, true);
		window.removeEventListener('resize', reposition);
		if (!tooltipInstance) return;
		const instance = tooltipInstance;
		const target = tooltipTarget;
		tooltipInstance = null;
		tooltipTarget = null;
		if (outro) {
			unmount(instance, { outro: true }).then(() => target?.remove());
		} else {
			unmount(instance);
			target?.remove();
		}
	}

	function show() {
		// Bail when there's nothing to show — handles the dynamic case where
		// a parent sets `content` to '' to disable the tooltip without
		// destroying/recreating the action.
		if (!options.content) return;
		if (tooltipInstance || showTimeout) return;

		const currentDelay = options.delay ?? 200;

		showTimeout = setTimeout(() => {
			showTimeout = null;
			if (!options.content) return;

			if (options.useCursor) {
				setCursorState('tooltip', options.content);
				return;
			}

			const rect = node.getBoundingClientRect();
			const { x, y, finalPosition } = getPosition(rect, options.position ?? 'top');

			props.content = options.content;
			props.x = x;
			props.y = y;
			props.position = finalPosition;

			tooltipTarget = document.createElement('div');
			document.body.appendChild(tooltipTarget);

			tooltipInstance = mount(TooltipComponent, {
				target: tooltipTarget,
				intro: true,
				props
			});

			// Follow the trigger while visible. Capture phase so scrolls inside
			// any nested scroll container are caught, not just window scroll.
			window.addEventListener('scroll', reposition, true);
			window.addEventListener('resize', reposition);
		}, currentDelay);
	}

	function hide() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}

		if (options.useCursor) {
			setCursorState('default');
			return;
		}

		// Play the fade-out on a normal hide.
		teardown(true);
	}

	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focus', show);
	node.addEventListener('blur', hide);

	return {
		update(newParams: TooltipParams) {
			const newOptions: TooltipOptions =
				typeof newParams === 'string' ? { content: newParams } : newParams;
			Object.assign(options, newOptions);
			// Reflect content/position changes on an open tooltip; drop it if the
			// content was cleared.
			if (tooltipInstance) {
				if (!options.content) teardown();
				else reposition();
			}
		},
		destroy() {
			if (showTimeout) {
				clearTimeout(showTimeout);
				showTimeout = null;
			}
			if (options.useCursor) {
				setCursorState('default');
				node.removeAttribute('data-cursor-controlled');
			}
			// Hard, immediate removal — the trigger is going away.
			teardown();
			node.removeEventListener('mouseenter', show);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focus', show);
			node.removeEventListener('blur', hide);
		}
	};
}
