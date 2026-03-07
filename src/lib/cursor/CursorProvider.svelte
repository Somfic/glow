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

	// Smooth trailing animation
	function animateCursor() {
		// Lerp (linear interpolation) with easing
		const ease = 0.45; // Lower = more trailing, higher = snappier

		currentX += (targetX - currentX) * ease;
		currentY += (targetY - currentY) * ease;

		// Update cursor position
		updateCursorPosition(currentX, currentY);

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

	// Automatic detection of interactive elements
	function handleMouseOver(e: MouseEvent) {
		const target = e.target as HTMLElement;

		// Check if element has use:cursor action (skip auto-detection)
		if (target.hasAttribute('data-cursor-controlled')) return;

		// Check if element is inside a controlled element
		if (target.closest('[data-cursor-controlled]')) return;

		// Check if inside a checkbox or switch (look up the DOM tree)
		const checkboxElement = target.closest('[role="checkbox"]');
		const switchElement = target.closest('[role="switch"]');

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

		// Check if inside a label that contains a checkbox or switch
		const labelElement = target.closest('label');
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
		const tagName = target.tagName.toLowerCase();

		if (tagName === 'button' || tagName === 'a') {
			setCursorState('pointer');
		} else if (tagName === 'input' || tagName === 'textarea') {
			const inputElement = target as HTMLInputElement;
			const inputType = inputElement.type;

			// Checkbox
			if (inputType === 'checkbox') {
				setCursorState(inputElement.checked ? 'checkbox-checked' : 'checkbox');
			}
			// Text-based inputs
			else if (
				!inputType ||
				inputType === 'text' ||
				inputType === 'email' ||
				inputType === 'password' ||
				inputType === 'search' ||
				inputType === 'tel' ||
				inputType === 'url' ||
				tagName === 'textarea'
			) {
				setCursorState('text');
			}
			// Other input types (number, range, etc.)
			else {
				setCursorState('pointer');
			}
		} else if (target.closest('[data-copyable]')) {
			setCursorState('copy');
		} else if (
			target.hasAttribute('role') &&
			['button', 'link', 'tab', 'menuitem'].includes(target.getAttribute('role') || '')
		) {
			setCursorState('pointer');
		} else {
			setCursorState('default');
		}
	}

	onMount(() => {
		// Don't enable custom cursor on touch devices
		if (hasTouch) return;

		mounted = true;

		// Start animation loop
		rafId = requestAnimationFrame(animateCursor);

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('mouseleave', handleMouseLeave);
		window.addEventListener('mouseenter', handleMouseEnter);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('blur', handleBlur);
		window.addEventListener('focus', handleFocus);
		document.addEventListener('mouseover', handleMouseOver);
		document.addEventListener('click', handleClick);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			// Stop animation loop
			if (rafId) cancelAnimationFrame(rafId);

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseleave', handleMouseLeave);
			window.removeEventListener('mouseenter', handleMouseEnter);
			window.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('blur', handleBlur);
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('mouseover', handleMouseOver);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});
</script>

{#if mounted && !hasTouch}
	<Cursor />
{/if}
