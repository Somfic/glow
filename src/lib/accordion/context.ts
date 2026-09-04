/**
 * Context shared between <Accordion> and the <AccordionItem>s inside it.
 *
 * The parent owns *all* of the open/closed state — an item never holds its own,
 * which is what makes `type="single"` possible without items having to talk to
 * each other. Items only report their value and ask the parent to toggle it.
 *
 * Keyboard navigation is the parent's job too: it is the only place that knows
 * the full set of headers, and it finds them by querying its own DOM subtree
 * rather than by registration, so the order always matches what the user sees —
 * including items rendered from an `{#each}` that reorders.
 */

export const ACCORDION_CONTEXT_KEY = Symbol('glow:accordion');

/** `single` allows one open panel at a time; `multiple` allows any number. */
export type AccordionType = 'single' | 'multiple';

/**
 * `bordered` — one framed stack, items separated by a rule.
 * `separated` — each item its own framed block, with a gap between them.
 * `plain`     — no frame at all, for embedding in something that already has one.
 */
export type AccordionVariant = 'bordered' | 'separated' | 'plain';

export interface AccordionContext {
	/** Values of the currently open items. Reactive — read it, don't cache it. */
	readonly open: string[];
	/** True when the whole Accordion is disabled; items OR this with their own. */
	readonly disabled: boolean;
	/** Heading level the item wraps its trigger button in. */
	readonly headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
	readonly variant: AccordionVariant;
	toggle: (value: string) => void;
}
