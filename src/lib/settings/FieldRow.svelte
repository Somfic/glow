<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Children (typically multiple <Field> elements). */
		children: Snippet;
		/** Gap between cells. Defaults to the same row-gap token Field uses. */
		gap?: string;
		/** When true, fields take their natural width instead of equal-share. */
		shrink?: boolean;
	}

	let { children, gap, shrink = false }: Props = $props();
</script>

<div
	class="field-row"
	class:shrink
	style:gap={gap ?? undefined}
>
	{@render children()}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.field-row {
		display: flex;
		gap: var(--glow-field-row-gap);
		align-items: stretch;
		min-width: 0;

		// By default each child Field shares width evenly. `shrink` opts out so
		// fields keep their natural width (useful for a tight inline pair).
		:global(> *) {
			flex: 1 1 0;
			min-width: 0;
		}

		&.shrink :global(> *) {
			flex: 0 1 auto;
		}
	}
</style>
