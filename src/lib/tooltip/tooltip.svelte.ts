import { mount, unmount } from 'svelte';
import TooltipComponent from './Tooltip.svelte';
import { setCursorState } from '../cursor/cursor.svelte.js';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
	content: string;
	position?: TooltipPosition;
	delay?: number;
	useCursor?: boolean; // If true, show in cursor instead of separate tooltip
};

export type TooltipParams = string | TooltipOptions;

export function tooltip(node: HTMLElement, params: TooltipParams) {
	let tooltipInstance: any = null;
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShowing = false;

	const options: TooltipOptions =
		typeof params === 'string' ? { content: params, useCursor: true } : { useCursor: true, ...params };

	const { content, position = 'top', delay = 200, useCursor = true } = options;

	if (!content) return;

	// Mark element as having tooltip for cursor detection
	if (useCursor) {
		node.setAttribute('data-cursor-controlled', 'true');
	}

	function getPosition(
		triggerRect: DOMRect,
		pos: 'top' | 'bottom' | 'left' | 'right'
	): { x: number; y: number; finalPosition: 'top' | 'bottom' | 'left' | 'right' } {
		const margin = 8;
		let x = 0;
		let y = 0;
		let finalPosition = pos;

		// Calculate initial position
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

		// Basic viewport boundary checking
		const tooltipEstimatedWidth = 250; // max-width
		const tooltipEstimatedHeight = 50; // estimated

		// Check if tooltip would go off screen and flip if needed
		if (pos === 'top' && y - tooltipEstimatedHeight - margin < 0) {
			// Flip to bottom
			finalPosition = 'bottom';
			y = triggerRect.bottom;
		} else if (pos === 'bottom' && y + tooltipEstimatedHeight + margin > window.innerHeight) {
			// Flip to top
			finalPosition = 'top';
			y = triggerRect.top;
		} else if (pos === 'left' && x - tooltipEstimatedWidth - margin < 0) {
			// Flip to right
			finalPosition = 'right';
			x = triggerRect.right;
		} else if (pos === 'right' && x + tooltipEstimatedWidth + margin > window.innerWidth) {
			// Flip to left
			finalPosition = 'left';
			x = triggerRect.left;
		}

		return { x, y, finalPosition };
	}

	function show() {
		if (isShowing) return;

		showTimeout = setTimeout(() => {
			if (useCursor) {
				// Show tooltip in cursor
				setCursorState('tooltip', content);
				isShowing = true;
			} else {
				// Show traditional tooltip
				if (tooltipInstance) return;

				const rect = node.getBoundingClientRect();
				const { x, y, finalPosition } = getPosition(rect, position);

				// Mount tooltip to document body
				tooltipInstance = mount(TooltipComponent, {
					target: document.body,
					props: {
						content,
						x,
						y,
						position: finalPosition
					}
				});

				isShowing = true;
			}
		}, delay);
	}

	function hide() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}

		if (useCursor) {
			// Reset cursor to default
			setCursorState('default');
			isShowing = false;
		} else {
			// Hide traditional tooltip
			if (tooltipInstance) {
				unmount(tooltipInstance);
				tooltipInstance = null;
				isShowing = false;
			}
		}
	}

	// Event listeners
	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focus', show);
	node.addEventListener('blur', hide);

	return {
		update(newParams: TooltipParams) {
			// If params change, hide current and prepare for new
			hide();
			const newOptions: TooltipOptions =
				typeof newParams === 'string' ? { content: newParams } : newParams;
			Object.assign(options, newOptions);
		},
		destroy() {
			hide();
			node.removeEventListener('mouseenter', show);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focus', show);
			node.removeEventListener('blur', hide);
			if (useCursor) {
				node.removeAttribute('data-cursor-controlled');
			}
		}
	};
}
