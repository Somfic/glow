import { mount, unmount } from 'svelte';
import TooltipComponent from './Tooltip.svelte';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
	content: string;
	position?: TooltipPosition;
	delay?: number;
};

export type TooltipParams = string | TooltipOptions;

export function tooltip(node: HTMLElement, params: TooltipParams) {
	let tooltipInstance: any = null;
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShowing = false;

	const options: TooltipOptions =
		typeof params === 'string' ? { content: params } : params;

	const { content, position = 'top', delay = 200 } = options;

	if (!content) return;

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
		if (isShowing || tooltipInstance) return;

		showTimeout = setTimeout(() => {
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
		}, delay);
	}

	function hide() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}

		if (tooltipInstance) {
			unmount(tooltipInstance);
			tooltipInstance = null;
			isShowing = false;
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
		}
	};
}
