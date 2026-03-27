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
	let tooltipInstance: any = null;
	let tooltipTarget: HTMLDivElement | null = null;
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let isShowing = false;
	let isHiding = false;

	const options: TooltipOptions =
		typeof params === 'string' ? { content: params, useCursor: true } : { useCursor: true, ...params };

	const { content, position = 'top', delay = 200, useCursor = true } = options;

	if (!content) return;

	if (useCursor) {
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

	function show() {
		if (isShowing) return;

		// Cancel any in-progress hide
		if (isHiding) {
			isHiding = false;
		}

		showTimeout = setTimeout(() => {
			if (useCursor) {
				setCursorState('tooltip', content);
				isShowing = true;
			} else {
				if (tooltipInstance) return;

				const rect = node.getBoundingClientRect();
				const { x, y, finalPosition } = getPosition(rect, position);

				tooltipTarget = document.createElement('div');
				document.body.appendChild(tooltipTarget);

				tooltipInstance = mount(TooltipComponent, {
					target: tooltipTarget,
					intro: true,
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

	async function hide() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}

		if (useCursor) {
			setCursorState('default');
			isShowing = false;
		} else {
			if (tooltipInstance && !isHiding) {
				isHiding = true;
				const instance = tooltipInstance;
				const target = tooltipTarget;

				// unmount with outro: true plays the Svelte transition before removing
				await unmount(instance, { outro: true });

				// Only clean up if this hide wasn't cancelled by a new show
				if (isHiding) {
					tooltipInstance = null;
					tooltipTarget = null;
					target?.remove();
					isShowing = false;
					isHiding = false;
				}
			}
		}
	}

	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focus', show);
	node.addEventListener('blur', hide);

	return {
		update(newParams: TooltipParams) {
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
