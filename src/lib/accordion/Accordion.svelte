<script lang="ts">
	import { setContext, untrack, type Snippet } from 'svelte';
	import {
		ACCORDION_CONTEXT_KEY,
		type AccordionContext,
		type AccordionType,
		type AccordionVariant
	} from './context.js';

	interface Props {
		/** `single` closes the previous panel when another opens; `multiple` leaves them all open. */
		type?: AccordionType;
		/**
		 * Open item(s). Bindable — a `string` in `single` mode (empty string means
		 * nothing is open), a `string[]` in `multiple`. Leave it unset to let the
		 * Accordion own its state and seed it with `defaultValue`.
		 */
		value?: string | string[];
		/** Initial open item(s) for the uncontrolled case. Ignored once `value` is bound. */
		defaultValue?: string | string[];
		/** `single` only: whether clicking the open header closes it. */
		collapsible?: boolean;
		/** Disables every header in the group. Individual items can also disable themselves. */
		disabled?: boolean;
		variant?: AccordionVariant;
		/**
		 * Heading level each trigger is wrapped in. Defaults to 3 because an
		 * accordion is nearly always inside a section that already owns h1/h2 —
		 * pick the one that keeps the page's outline honest.
		 */
		headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
		/** Fires after a header toggles, with the new open value(s). */
		onValueChange?: (value: string | string[]) => void;
		/** The `<AccordionItem>`s. */
		children?: Snippet;
		class?: string;
		style?: string;
	}

	let {
		type = 'single',
		value = $bindable(),
		defaultValue,
		collapsible = true,
		disabled = false,
		variant = 'bordered',
		headingLevel = 3,
		onValueChange,
		children,
		class: className,
		style
	}: Props = $props();

	function toArray(v: string | string[] | undefined): string[] {
		if (v === undefined) return [];
		return Array.isArray(v) ? v : v === '' ? [] : [v];
	}

	// Uncontrolled state. `value === undefined` is the test for "nobody bound
	// me" — an empty string or empty array is a legitimate controlled value
	// meaning everything is closed, so it must not fall through to this.
	// `defaultValue` is read once and deliberately not tracked: it seeds this
	// state, and a later change to it must not yank open panels shut.
	let internal = $state(untrack(() => toArray(defaultValue)));
	const open = $derived(value !== undefined ? toArray(value) : internal);

	function toggle(item: string) {
		if (disabled) return;
		const isOpen = open.includes(item);

		let next: string[];
		if (type === 'multiple') {
			next = isOpen ? open.filter((v) => v !== item) : [...open, item];
		} else if (isOpen) {
			// In `single` mode with `collapsible: false` the open panel is sticky:
			// clicking its own header is a no-op rather than leaving the group empty.
			if (!collapsible) return;
			next = [];
		} else {
			next = [item];
		}

		const emitted = type === 'multiple' ? next : (next[0] ?? '');
		if (value !== undefined) value = emitted;
		else internal = next;
		onValueChange?.(emitted);
	}

	setContext<AccordionContext>(ACCORDION_CONTEXT_KEY, {
		get open() {
			return open;
		},
		get disabled() {
			return disabled;
		},
		get headingLevel() {
			return headingLevel;
		},
		get variant() {
			return variant;
		},
		toggle
	});

	let root: HTMLDivElement | undefined = $state();

	// APG's accordion pattern: Up/Down move between headers, Home/End jump to
	// the ends. Wrapping matches Tabs, which wraps on Left/Right.
	function handleKeyDown(e: KeyboardEvent) {
		const trigger = (e.target as HTMLElement | null)?.closest('[data-accordion-trigger]');
		// Only headers navigate — arrow keys inside an open panel (a text field,
		// a listbox) have to keep meaning what they normally mean.
		if (!trigger || !root) return;

		const triggers = [
			...root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]:not(:disabled)')
		];
		const index = triggers.indexOf(trigger as HTMLButtonElement);
		if (index === -1) return;

		let next: number;
		switch (e.key) {
			case 'ArrowDown':
				next = (index + 1) % triggers.length;
				break;
			case 'ArrowUp':
				next = (index - 1 + triggers.length) % triggers.length;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = triggers.length - 1;
				break;
			default:
				return;
		}

		e.preventDefault();
		triggers[next]?.focus();
	}
</script>

<!-- The keydown handler is delegation, not interaction: it only ever acts on
     events that bubbled up from the real <button> headers inside, so the
     wrapper needs no role of its own. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={root}
	class={['glow-accordion', `variant-${variant}`, className].filter(Boolean).join(' ')}
	class:disabled
	{style}
	onkeydown={handleKeyDown}
>
	{@render children?.()}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.glow-accordion {
		display: flex;
		flex-direction: column;
		min-width: 0;
		width: 100%;
	}

	.variant-bordered {
		border: 1px solid var(--glow-border-color);
		border-radius: $radius;
		// The items draw square corners; clipping here rounds the first and last
		// one without either of them needing to know where it sits in the list.
		overflow: hidden;
		background: var(--glow-bg-surface-element);
	}

	.variant-separated {
		gap: 0.5rem;
	}

	.disabled {
		// The headers are really `disabled`, so this is purely the group-level
		// visual cue; pointer-events stay on so a tooltip on top still works.
		opacity: 0.6;
	}
</style>
