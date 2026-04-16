<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../button/Button.svelte';
	import ButtonGroup from '../button/ButtonGroup.svelte';

	type Density = 'compact' | 'comfortable' | 'spacious';

	interface Props {
		/** Spacing density used for everything inside. Bindable. */
		density?: Density;
		/** Render a built-in density toggle chip in the shell header. */
		densityToggle?: boolean;
		/** Optional title rendered at the top. */
		title?: string;
		/** Optional description under the title. */
		description?: string;
		/** Optional snippet rendered to the right of the title (e.g. global actions). */
		headerExtra?: Snippet;
		/** When true, skips the bordered container styling so the shell can be embedded inside another column. */
		embedded?: boolean;
		children: Snippet;
	}

	let {
		density = $bindable<Density>('comfortable'),
		densityToggle = false,
		title,
		description,
		headerExtra,
		embedded = false,
		children
	}: Props = $props();

	const densities: Density[] = ['compact', 'comfortable', 'spacious'];
</script>

<div class="settings-shell" class:embedded data-density={density}>
	{#if title || densityToggle || headerExtra}
		<header class="shell-header">
			<div class="title-cluster">
				{#if title}
					<h2 class="shell-title">{title}</h2>
				{/if}
				{#if description}
					<p class="shell-description">{description}</p>
				{/if}
			</div>
			<div class="header-trailing">
				{#if headerExtra}
					{@render headerExtra()}
				{/if}
				{#if densityToggle}
					<ButtonGroup>
						{#each densities as d}
							<Button
								label={d.charAt(0).toUpperCase() + d.slice(1)}
								variant={density === d ? 'primary' : 'ghost'}
								onclick={() => {
									density = d;
								}}
							/>
						{/each}
					</ButtonGroup>
				{/if}
			</div>
		</header>
	{/if}
	<div class="shell-body">
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.settings-shell {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}

	.shell-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba($fg, 0.06);
	}

	.title-cluster {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.shell-title {
		margin: 0;
		font-size: $text-lg;
		font-weight: 700;
		color: $text-primary;
		line-height: 1.2;
	}

	.shell-description {
		margin: 0;
		font-size: $text-sm;
		color: $text-muted;
		line-height: 1.5;
	}

	.header-trailing {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.shell-body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
</style>
