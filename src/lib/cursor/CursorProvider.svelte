<script lang="ts">
	import { onMount } from 'svelte';
	import {
		updateCursorPosition,
		setCursorState,
		setCursorVisible,
		setCursorPressed,
		setCursorSelecting
	} from './cursor.svelte.js';
	import Cursor from './Cursor.svelte';

	let mounted = $state(false);
	let isMouseDown = $state(false);
	let lastHoveredElement: HTMLElement | null = null;
	let isSnapped = $state(false);

	// Detect touch devices
	const hasTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

	// Trailing cursor effect
	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;
	let rafId: number;

	function handleMouseMove(e: MouseEvent) {
		// Update target position instead of directly updating cursor
		targetX = e.clientX;
		targetY = e.clientY;

		// Check if user is selecting text (mouse down + selection exists)
		if (isMouseDown) {
			const selection = window.getSelection();
			if (selection && selection.toString().length > 0) {
				// Get font size of element under cursor
				const target = e.target as HTMLElement;
				const computedStyle = window.getComputedStyle(target);
				const fontSize = parseFloat(computedStyle.fontSize);
				const lineHeight = parseFloat(computedStyle.lineHeight);

				// Use line height if available, otherwise use font size * 1.5
				const height = isNaN(lineHeight) ? fontSize * 1.5 : lineHeight;

				setCursorSelecting(true, height);
			}
		}
	}

	function handleMouseLeave() {
		setCursorVisible(false);
	}

	function handleMouseEnter() {
		setCursorVisible(true);
	}

	function handleBlur() {
		// Hide cursor when window loses focus (tab switch, etc)
		setCursorVisible(false);
	}

	function handleFocus() {
		// Show cursor when window gains focus
		setCursorVisible(true);
	}

	function handleVisibilityChange() {
		// Hide cursor when tab becomes hidden
		if (document.hidden) {
			setCursorVisible(false);
		}
	}

	// Check what element is under the visual cursor and update state
	function updateCursorStateForPosition(x: number, y: number) {
		// Use elementFromPoint to get element at visual cursor position
		const element = document.elementFromPoint(x, y) as HTMLElement;

		// Remove cursor-hover from previous element
		if (lastHoveredElement && lastHoveredElement !== element) {
			lastHoveredElement.classList.remove('cursor-hover');
		}

		if (!element) {
			setCursorState('default');
			lastHoveredElement = null;
			return;
		}

		// Check if element or any parent is a controlled element
		const controlled = element.closest('[data-cursor-controlled]');
		if (controlled) {
			// If controlled element contains an input, auto-focus it
			const input = controlled.querySelector('input, textarea');
			if (input && (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
				const inputType = input instanceof HTMLInputElement ? input.type : 'textarea';
				// Only auto-focus text-like inputs
				if (
					inputType === 'text' ||
					inputType === 'email' ||
					inputType === 'password' ||
					inputType === 'search' ||
					inputType === 'tel' ||
					inputType === 'url' ||
					inputType === 'number' ||
					inputType === 'textarea'
				) {
					if (document.activeElement !== input) {
						input.focus();
					}
				}
			}

			// Add cursor-hover class to simulate hover state
			(controlled as HTMLElement).classList.add('cursor-hover');
			lastHoveredElement = controlled as HTMLElement;
			setCursorForButton(controlled as HTMLElement);
			return;
		}

		// Check if inside a checkbox or switch
		const checkboxElement = element.closest('[role="checkbox"]');
		const switchElement = element.closest('[role="switch"]');

		if (checkboxElement) {
			const isChecked = checkboxElement.getAttribute('aria-checked') === 'true';
			setCursorState(isChecked ? 'checkbox-checked' : 'checkbox');
			return;
		}

		if (switchElement) {
			const isChecked = switchElement.getAttribute('aria-checked') === 'true';
			setCursorState(isChecked ? 'toggle-checked' : 'toggle');
			return;
		}

		// Check if inside a label with checkbox/switch
		const labelElement = element.closest('label');
		if (labelElement) {
			const labelCheckbox = labelElement.querySelector('[role="checkbox"]');
			const labelSwitch = labelElement.querySelector('[role="switch"]');

			if (labelCheckbox) {
				const isChecked = labelCheckbox.getAttribute('aria-checked') === 'true';
				setCursorState(isChecked ? 'checkbox-checked' : 'checkbox');
				return;
			}

			if (labelSwitch) {
				const isChecked = labelSwitch.getAttribute('aria-checked') === 'true';
				setCursorState(isChecked ? 'toggle-checked' : 'toggle');
				return;
			}
		}

		// Auto-detect based on element type
		const tagName = element.tagName.toLowerCase();

		if (tagName === 'a') {
			// Links: show as horizontal line matching text width
			// Use Range API to measure just the text content, not padding
			const range = document.createRange();
			range.selectNodeContents(element);
			const rect = range.getBoundingClientRect();
			setCursorState('pointer', null, null, null, null, true, rect.width);
		} else if (tagName === 'button') {
			setCursorState('pointer');
		} else if (tagName === 'input' || tagName === 'textarea') {
			const inputElement = element as HTMLInputElement;
			const inputType = inputElement.type;

			if (inputType === 'checkbox') {
				setCursorState(inputElement.checked ? 'checkbox-checked' : 'checkbox');
			} else if (inputType === 'number') {
				// Auto-focus number input
				if (document.activeElement !== inputElement) {
					inputElement.focus();
				}

				// Check if input wrapper has cursor icon data
				const wrapper = element.closest('[data-cursor-icon]');
				if (wrapper) {
					const iconName = wrapper.getAttribute('data-cursor-icon');
					setCursorState('pointer', null, null, iconName);
				} else {
					// Default to Hash icon for number inputs
					setCursorState('pointer', null, null, 'Hash');
				}
			} else if (
				!inputType ||
				inputType === 'text' ||
				inputType === 'email' ||
				inputType === 'password' ||
				inputType === 'search' ||
				inputType === 'tel' ||
				inputType === 'url' ||
				tagName === 'textarea'
			) {
				// Auto-focus text inputs
				if (document.activeElement !== inputElement) {
					inputElement.focus();
				}
				setCursorState('text');
			} else {
				setCursorState('pointer');
			}
		} else if (element.closest('[data-copyable]')) {
			setCursorState('copy');
		} else if (
			element.hasAttribute('role') &&
			['button', 'link', 'tab', 'menuitem'].includes(element.getAttribute('role') || '')
		) {
			setCursorState('pointer');
		} else {
			setCursorState('default');
		}

		// Clear lastHoveredElement if we didn't find a controlled element
		if (!controlled) {
			lastHoveredElement = null;
		}
	}

	// Magnetic snapping helper
	function findNearestInteractive(x: number, y: number): { x: number; y: number; distance: number } | null {
		const radius = 100; // Detection radius in pixels
		const elements = document.querySelectorAll('button:not(:disabled), a[href]');

		let nearest: { x: number; y: number; distance: number } | null = null;
		let minDistance = radius;

		elements.forEach((el) => {
			const rect = el.getBoundingClientRect();

			// Skip if element is not visible
			if (rect.width === 0 || rect.height === 0) return;

			// Check if cursor is within the button's bounds (including padding)
			const isInsideButton = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

			// Check if button has an icon - if so, snap to the icon position
			const icon = el.querySelector('svg');
			let targetX, targetY;

			if (icon) {
				const iconRect = icon.getBoundingClientRect();
				targetX = iconRect.left + iconRect.width / 2;
				targetY = iconRect.top + iconRect.height / 2;
			} else {
				// No icon, snap to center of element
				targetX = rect.left + rect.width / 2;
				targetY = rect.top + rect.height / 2;
			}

			// Calculate distance to the target position
			const distance = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));

			// If inside button bounds, treat distance as closer for stronger pull
			const effectiveDistance = isInsideButton ? distance * 0.5 : distance;

			if (effectiveDistance < minDistance) {
				minDistance = effectiveDistance;
				nearest = { x: targetX, y: targetY, distance: effectiveDistance };
			}
		});

		return nearest;
	}

	// Smooth trailing animation
	function animateCursor() {
		// Lerp (linear interpolation) with easing
		const ease = 0.45; // Lower = more trailing, higher = snappier

		// Check for magnetic snapping
		const magnetTarget = findNearestInteractive(targetX, targetY);
		let finalTargetX = targetX;
		let finalTargetY = targetY;

		if (magnetTarget) {
			// Check if VISUAL cursor is inside button (for initial snap detection)
			const elementAtCursor = document.elementFromPoint(currentX, currentY) as HTMLElement;
			const visualCursorInButton = elementAtCursor?.closest('button, a[href]');

			// Check if ACTUAL mouse is inside button (for maintaining snap and re-snap)
			const elementAtMouse = document.elementFromPoint(targetX, targetY) as HTMLElement;
			const actualMouseInButton = elementAtMouse?.closest('button, a[href]');

			if (isSnapped) {
				// Already snapped: unsnap as soon as actual mouse leaves
				if (actualMouseInButton) {
					// Actual mouse still inside: stay snapped
					finalTargetX = magnetTarget.x;
					finalTargetY = magnetTarget.y;
				} else {
					// Actual mouse left: unsnap immediately
					const magnetStrength = 1.5;
					const pullFactor = Math.pow(1 - magnetTarget.distance / 100, 2);

					const pullX = (magnetTarget.x - targetX) * magnetStrength * pullFactor;
					const pullY = (magnetTarget.y - targetY) * magnetStrength * pullFactor;

					finalTargetX += pullX;
					finalTargetY += pullY;
					isSnapped = false;
				}
			} else {
				// Not snapped: snap when VISUAL cursor enters AND actual mouse is close/inside
				// This allows the initial "snap in" when cursor gets pulled into button
				// But prevents re-snap from just visual cursor lag
				const shouldSnap = visualCursorInButton && actualMouseInButton;

				if (shouldSnap) {
					// Snap directly to icon position
					finalTargetX = magnetTarget.x;
					finalTargetY = magnetTarget.y;
					isSnapped = true;
				} else {
					// Apply gradual magnetic pull
					const magnetStrength = 1.5;
					const pullFactor = Math.pow(1 - magnetTarget.distance / 100, 2);

					const pullX = (magnetTarget.x - targetX) * magnetStrength * pullFactor;
					const pullY = (magnetTarget.y - targetY) * magnetStrength * pullFactor;

					finalTargetX += pullX;
					finalTargetY += pullY;
				}
			}
		} else {
			isSnapped = false;
		}

		currentX += (finalTargetX - currentX) * ease;
		currentY += (finalTargetY - currentY) * ease;

		// Update cursor position
		updateCursorPosition(currentX, currentY);

		// Check what element is under the VISUAL cursor position and update state
		updateCursorStateForPosition(currentX, currentY);

		// Continue animation
		rafId = requestAnimationFrame(animateCursor);
	}

	function handleMouseDown() {
		setCursorPressed(true);
		isMouseDown = true;
	}

	function handleMouseUp() {
		setCursorPressed(false);
		isMouseDown = false;
		setCursorSelecting(false);
	}

	// Update cursor state after clicks (for checkboxes/toggles that change state)
	function handleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// Re-check checkbox/toggle states after click
		let checkboxElement = target.closest('[role="checkbox"]');
		let switchElement = target.closest('[role="switch"]');

		// Also check if we clicked on a label containing a checkbox/switch
		if (!checkboxElement && !switchElement) {
			const labelElement = target.closest('label');
			if (labelElement) {
				checkboxElement = labelElement.querySelector('[role="checkbox"]');
				switchElement = labelElement.querySelector('[role="switch"]');
			}
		}

		if (checkboxElement) {
			// Small delay to let the state update
			setTimeout(() => {
				const isChecked = checkboxElement.getAttribute('aria-checked') === 'true';
				setCursorState(isChecked ? 'checkbox-checked' : 'checkbox');
			}, 10);
		} else if (switchElement) {
			setTimeout(() => {
				const isChecked = switchElement.getAttribute('aria-checked') === 'true';
				setCursorState(isChecked ? 'toggle-checked' : 'toggle');
			}, 10);
		}
	}

	// Helper to set cursor state for a controlled button
	function setCursorForButton(button: HTMLElement) {
		// Check if button is disabled
		if (button.hasAttribute('disabled') || button.classList.contains('loading')) {
			setCursorState('default');
			return;
		}

		// Read cursor config from data attributes
		const state = (button.getAttribute('data-cursor-state') || 'pointer') as any;
		const iconName = button.getAttribute('data-cursor-icon');
		const content = button.getAttribute('data-cursor-content');
		const variant = button.getAttribute('data-cursor-variant');

		// Apply the cursor state
		setCursorState(state, content, null, iconName, variant);
	}

	onMount(() => {
		// Don't enable custom cursor on touch devices
		if (hasTouch) return;

		mounted = true;

		// Hide default cursor by injecting global style
		const style = document.createElement('style');
		style.id = 'cursor-provider-hide';
		style.textContent = '* { cursor: none !important; }';
		document.head.appendChild(style);

		// Start animation loop
		rafId = requestAnimationFrame(animateCursor);

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('mouseleave', handleMouseLeave);
		window.addEventListener('mouseenter', handleMouseEnter);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('blur', handleBlur);
		window.addEventListener('focus', handleFocus);
		document.addEventListener('click', handleClick);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			// Stop animation loop
			if (rafId) cancelAnimationFrame(rafId);

			// Remove cursor hiding style
			const style = document.getElementById('cursor-provider-hide');
			if (style) style.remove();

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseleave', handleMouseLeave);
			window.removeEventListener('mouseenter', handleMouseEnter);
			window.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('blur', handleBlur);
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

{#if mounted && !hasTouch}
	<Cursor />
{/if}
