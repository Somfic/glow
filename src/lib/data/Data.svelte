<script lang="ts">
	import type { DataProps, DataGroup } from './types.js';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Pill from '../pill/Pill.svelte';
	import Field from '../settings/Field.svelte';

	let {
		properties,
		groups,
		variant = 'inline',
		divided = true,
		labelWidth = '40%',
		padded = true
	}: DataProps = $props();

	let normalizedGroups: DataGroup[] = $derived(
		groups ?? (properties ? [{ properties }] : [])
	);

	// Map Data's old vocabulary to Field's. `inline` → label-on-left,
	// `stacked` → label-above. Same shape, consistent naming.
	const fieldLayout = $derived(variant === 'inline' ? 'horizontal' : 'vertical');
</script>

<div
	class="property-list"
	data-variant={variant}
	class:divided
	class:padded
	style:--glow-field-label-width={variant === 'inline' ? labelWidth : undefined}
>
	{#each normalizedGroups as group}
		<div class="property-group">
			{#if group.label}
				<div class="group-header">
					{#if group.icon}
						<Icon {...resolveIcon(group.icon)} size={resolveIcon(group.icon).size ?? 14} />
					{/if}
					<span>{group.label}</span>
				</div>
			{/if}
			{#each group.properties as prop}
				{@const hasValue = prop.value != null || prop.render || prop.pill}
				{#if !hasValue && prop.href}
					<!-- Label-only link row: the entire label is the affordance, so
					     skip Field and render a single anchor. -->
					<a class="label-link" href={prop.href}>
						{#if prop.icon}
							<Icon {...resolveIcon(prop.icon)} size={resolveIcon(prop.icon).size ?? 14} />
						{/if}
						<span>{prop.label}</span>
					</a>
				{:else}
					<Field label={prop.label} leading={prop.icon} layout={fieldLayout} align="center">
						{#if prop.render}
							{@render prop.render()}
						{:else if prop.pill}
							{#if prop.pill.icon}
								<Pill label={prop.pill.label} color={prop.pill.color} icon={prop.pill.icon} />
							{:else}
								<Pill label={prop.pill.label} color={prop.pill.color} />
							{/if}
						{:else if prop.href && prop.value != null}
							<a class="value-link" href={prop.href}>{prop.value}</a>
						{:else if prop.value != null}
							<span class="value" class:muted={prop.muted}>
								{#if typeof prop.value === 'boolean'}
									{prop.value ? 'Yes' : 'No'}
								{:else}
									{prop.value}
								{/if}
							</span>
						{/if}
					</Field>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.property-list {
		--pl-padding: 0;

		// Field's per-row padding is sized for forms — way too generous for
		// detail-panel key/value rows. Tighten it within Data's scope.
		--glow-field-padding-y: 0.25rem;
		--glow-field-padding-x: 0;
		--glow-field-row-gap: 0.5rem;

		display: flex;
		flex-direction: column;

		&.padded {
			--pl-padding: 1rem;
			padding: 0.5rem var(--pl-padding);
		}

		// Detail rows are read-only — drop Field's hover tint and the
		// click-to-focus pointer cursor on labels.
		:global(.field:hover) {
			background: transparent;
		}
		:global(.field .label) {
			cursor: default;
		}
	}

	.property-group {
		& + .property-group {
			margin-top: 1rem;
		}
	}

	.divided .property-group + .property-group {
		padding-top: 1rem;
		border-top: 1px solid rgba($border-color, 0.5);
		margin-left: calc(-1 * var(--pl-padding));
		margin-right: calc(-1 * var(--pl-padding));
		padding-left: var(--pl-padding);
		padding-right: var(--pl-padding);
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--glow-text-secondary);
		padding: 0.5rem 0;
	}

	.label-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: $text-sm;
		color: var(--glow-text-secondary);
		font-weight: 600;
		padding: var(--glow-field-padding-y) var(--glow-field-padding-x);
		text-decoration: none;

		&:hover {
			color: var(--glow-primary);
		}
	}

	.value {
		font-size: $text-sm;
		color: var(--glow-text-primary);

		&.muted {
			color: var(--glow-text-muted);
		}
	}

	.value-link {
		font-size: $text-sm;
		color: var(--glow-primary);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
