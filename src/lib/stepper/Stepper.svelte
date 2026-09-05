<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconProp } from '../icon/Icon.svelte';

	export type StepperOrientation = 'horizontal' | 'vertical';

	/**
	 * What a step is doing right now. Only `error` has to be set by hand — the
	 * other three fall out of the step's position relative to `current`.
	 */
	export type StepState = 'upcoming' | 'current' | 'complete' | 'error';

	/**
	 * Which steps can be clicked. `'none'` renders no buttons at all, so a
	 * read-only stepper is not a row of tab stops that do nothing.
	 */
	export type StepperNavigation = 'none' | 'complete' | 'all';

	export interface Step {
		/** Stable key for the `{#each}`; falls back to the index. */
		id?: string;
		label: string;
		/** Secondary line under the label. */
		description?: string;
		/**
		 * Marker glyph. Without one the marker is the step's number, and a
		 * completed step is a checkmark regardless.
		 */
		icon?: IconProp;
		/**
		 * Pin this step's state instead of deriving it from `current`. `'error'`
		 * is the reason this exists: a wizard that failed validation on step 2
		 * has to say so while step 2 is still the current one.
		 */
		state?: StepState;
		/** Excluded from navigation even when `navigation` would allow it. */
		disabled?: boolean;
	}

	export interface StepperProps {
		steps: Step[];
		/** Index of the current step. Bindable — clicking a step writes to it. */
		current?: number;
		orientation?: StepperOrientation;
		/**
		 * Defaults to `'none'`: a stepper is a progress indicator first, and most
		 * flows have validation between steps that clicking would skip.
		 */
		navigation?: StepperNavigation;
		/** Fires only for a navigation the user performed, not for a `current` written from outside. */
		onnavigate?: (index: number, step: Step) => void;
		/** Replaces the label/description column. Receives the step and its state. */
		content?: Snippet<[Step, StepState, number]>;
		/** Accessible name for the list. */
		label?: string;
		class?: string;
		style?: string;
	}
</script>

<script lang="ts">
	import Icon, { resolveIcon } from '../icon/Icon.svelte';

	let {
		steps,
		current = $bindable(0),
		orientation = 'horizontal',
		navigation = 'none',
		onnavigate,
		content,
		label,
		class: className,
		style
	}: StepperProps = $props();

	function stateOf(step: Step, index: number): StepState {
		if (step.state) return step.state;
		if (index < current) return 'complete';
		if (index === current) return 'current';
		return 'upcoming';
	}

	function isNavigable(step: Step, state: StepState): boolean {
		if (navigation === 'none' || step.disabled) return false;
		if (navigation === 'all') return true;
		// An errored step is one you are being sent back to fix, so it navigates
		// on the same terms a completed one does.
		return state === 'complete' || state === 'error';
	}

	function go(index: number, step: Step) {
		current = index;
		onnavigate?.(index, step);
	}

	/** Read out after the label, so a screen reader gets the state as well as the position. */
	const stateNames: Record<StepState, string> = {
		upcoming: 'Not started',
		current: 'Current step',
		complete: 'Completed',
		error: 'Error'
	};
</script>

{#snippet body(step: Step, state: StepState, index: number)}
	<span class="marker" aria-hidden="true">
		<span class="bubble">
			{#if state === 'complete' && !step.icon}
				<Icon name="Check" size={16} />
			{:else if state === 'error' && !step.icon}
				<Icon name="X" size={16} />
			{:else if step.icon}
				<Icon {...resolveIcon(step.icon)} size={resolveIcon(step.icon).size ?? 16} />
			{:else}
				<span class="number">{index + 1}</span>
			{/if}
		</span>
	</span>

	<span class="text">
		{#if content}
			{@render content(step, state, index)}
		{:else}
			<span class="label">{step.label}</span>
			{#if step.description}<span class="description">{step.description}</span>{/if}
		{/if}
		<span class="visually-hidden">{stateNames[state]}</span>
	</span>
{/snippet}

<ol
	class={['stepper', className].filter(Boolean).join(' ')}
	data-orientation={orientation}
	aria-label={label}
	{style}
>
	{#each steps as step, i (step.id ?? i)}
		{@const state = stateOf(step, i)}
		{@const navigable = isNavigable(step, state)}
		<li class="step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
			{#if navigable}
				<button type="button" class="step-inner" onclick={() => go(i, step)}>
					{@render body(step, state, i)}
				</button>
			{:else}
				<div class="step-inner">
					{@render body(step, state, i)}
				</div>
			{/if}

			{#if i < steps.length - 1}
				<span class="connector" aria-hidden="true"></span>
			{/if}
		</li>
	{/each}
</ol>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.stepper {
		// Every vertical measurement is against `--stepper-line`, the height of the
		// label's first line box — set as a *length*, not a ratio, so the marker's
		// centre lands on a whole pixel whatever the inherited font-size is. The
		// marker is centred in a box exactly one line tall and allowed to overflow
		// it, which is what keeps it on the first line of a label that wraps rather
		// than drifting to the middle of the block.
		--stepper-line: 1.5rem;
		--stepper-marker: 1.75rem;
		--stepper-rail: 2px;
		--stepper-gap: 0.75rem;
		--stepper-row-gap: 1.5rem;
		// How far the marker sticks out past its one-line box, at either end.
		--stepper-overhang: max(0px, calc((var(--stepper-marker) - var(--stepper-line)) / 2));
		// Clearance between the end of a connector and the marker it points at.
		--stepper-clearance: 0.25rem;
		--stepper-accent: var(--glow-border-strong);
		--stepper-ink: var(--glow-text-muted);

		list-style: none;
		margin: 0;
		// The markers stand proud of their one-line boxes at both ends, so the list
		// reserves that much or whatever it sits in clips the first and last one.
		padding: var(--stepper-overhang) 0;
		display: flex;
	}

	.stepper[data-orientation='horizontal'] {
		align-items: flex-start;
	}

	.stepper[data-orientation='vertical'] {
		flex-direction: column;
		width: 100%;
	}

	.step {
		position: relative;
		display: flex;
		align-items: flex-start;
	}

	// Steps share the row evenly so the connectors between them are equal; the
	// last one takes only what it needs, since nothing follows it to push against.
	// Equal shares of the row, the last step included — sizing it to its content
	// instead gives a long final label a basis the others don't get and lets it
	// eat the row. `min-width` is deliberately left at `auto`: a step that cannot
	// fit its own label pushes the row wider rather than shrinking to nothing and
	// overlapping its neighbour.
	.stepper[data-orientation='horizontal'] .step {
		flex: 1 1 0;
	}

	.stepper[data-orientation='vertical'] .step {
		min-width: 0;
		padding-bottom: var(--stepper-row-gap);

		&:last-child {
			padding-bottom: 0;
		}
	}

	.step-inner {
		display: flex;
		align-items: flex-start;
		gap: var(--stepper-gap);
		min-width: 0;
		text-align: left;
		// The button reset: a navigable step and a static one have to be the same
		// box, or the stepper reflows when `navigation` changes.
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
	}

	button.step-inner {
		cursor: pointer;
		border-radius: 8px;

		&:focus-visible {
			outline: none;
			box-shadow: $focus-ring;
		}

		&:hover .label {
			color: var(--glow-text-primary);
		}

		&:hover .bubble {
			border-color: var(--stepper-accent);
		}
	}

	.stepper[data-orientation='vertical'] .step-inner {
		width: 100%;
	}

	// One line tall, with the marker centred in it and free to overflow — the
	// same construction Timeline uses, and for the same reason.
	.marker {
		position: relative;
		z-index: 1;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--stepper-marker);
		height: var(--stepper-line);
	}

	.bubble {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--stepper-marker);
		height: var(--stepper-marker);
		border-radius: 999px;
		border: 1px solid var(--stepper-accent);
		background: var(--glow-bg-surface);
		color: var(--stepper-ink);
		transition:
			background var(--glow-dur-base) var(--glow-ease-out),
			border-color var(--glow-dur-base) var(--glow-ease-out),
			box-shadow var(--glow-dur-base) var(--glow-ease-out),
			color var(--glow-dur-base) var(--glow-ease-out);
	}

	.number {
		font-size: $text-xs;
		font-weight: $weight-semibold;
		// A length equal to the glyph box: `1` would centre the *line box*, which
		// carries the font's descender space and parks digits below the circle's
		// centre by a pixel or so.
		line-height: 1;
		font-variant-numeric: tabular-nums lining-nums;
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.label {
		font-size: $text-sm;
		// A length, not a ratio: this *is* `--stepper-line`, so the first line box
		// of the label and the marker's box are the same height and start together.
		line-height: var(--stepper-line);
		font-weight: $weight-semibold;
		color: var(--stepper-ink);
		transition: color var(--glow-dur-base) var(--glow-ease-out);
	}

	.description {
		font-size: $text-xs;
		line-height: 1.5;
		font-weight: $weight-medium;
		color: var(--glow-text-muted);
	}

	// Runs from this marker to the next one, drawn per step rather than as one
	// line behind the list, so it stops at the last marker instead of overshooting.
	.connector {
		background: var(--glow-border-color);
		border-radius: var(--stepper-rail);
		transition: background var(--glow-dur-base) var(--glow-ease-out);
	}

	.stepper[data-orientation='horizontal'] .connector {
		flex: 1 1 auto;
		min-width: 1.5rem;
		height: var(--stepper-rail);
		// Half a line down, less half the rail: the marker's centre line.
		margin-top: calc((var(--stepper-line) - var(--stepper-rail)) / 2);
		margin-inline: var(--stepper-gap);
	}

	.stepper[data-orientation='vertical'] .connector {
		position: absolute;
		left: calc((var(--stepper-marker) - var(--stepper-rail)) / 2);
		top: calc(
			(var(--stepper-line) + var(--stepper-marker)) / 2 + var(--stepper-clearance)
		);
		bottom: calc(var(--stepper-overhang) + var(--stepper-clearance));
		width: var(--stepper-rail);
	}

	.step[data-state='current'] {
		--stepper-accent: var(--glow-primary);
		--stepper-ink: var(--glow-text-primary);

		.bubble {
			background: var(--glow-primary-soft);
			color: var(--glow-primary);
			// A ring rather than a thicker border: a border change would resize the
			// content box and shift the glyph inside it as the step becomes current.
			box-shadow: 0 0 0 3px var(--glow-primary-soft);
		}
	}

	.step[data-state='complete'] {
		--stepper-accent: var(--glow-primary);
		--stepper-ink: var(--glow-text-secondary);

		.bubble {
			background: var(--stepper-accent);
			@include contrast-color(var(--glow-primary));
		}

		// The segment *after* a completed step is the distance already travelled.
		.connector {
			background: var(--glow-primary);
		}
	}

	.step[data-state='error'] {
		--stepper-accent: var(--glow-color-danger);
		--stepper-ink: var(--glow-color-danger);

		.bubble {
			background: var(--stepper-accent);
			@include contrast-color(var(--glow-color-danger));
		}
	}

	// Kept in the accessibility tree and out of the layout — `display: none`
	// would drop the state from both.
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
