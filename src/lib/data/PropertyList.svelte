<script lang="ts">
	import type { PropertyListProps, PropertyGroup } from './types.js';
	import Icon from '../icon/Icon.svelte';
	import Pill from '../pill/Pill.svelte';

	let {
		properties,
		groups,
		variant = 'inline',
		divided = true,
		labelWidth = '40%'
	}: PropertyListProps = $props();

	let normalizedGroups: PropertyGroup[] = $derived(
		groups ?? (properties ? [{ properties }] : [])
	);
</script>

<div
	class="property-list"
	data-variant={variant}
	class:divided
	style:--label-width={variant === 'inline' ? labelWidth : undefined}
>
	{#each normalizedGroups as group}
		<div class="property-group">
			{#if group.label}
				<div class="group-header">
					{#if group.icon}
						<Icon name={group.icon} size={14} fill={group.iconFilled} />
					{/if}
					<span>{group.label}</span>
				</div>
			{/if}
			<dl>
				{#each group.properties as prop}
					<div class="property-row">
						<dt>
							{#if prop.icon}
								<Icon name={prop.icon} size={14} fill={prop.iconFilled} />
							{/if}
							<span>{prop.label}</span>
						</dt>
						<dd class:muted={prop.muted}>
							{#if prop.render}
								{@render prop.render()}
							{:else if prop.pill}
								<Pill label={prop.pill.label} color={prop.pill.color} icon={prop.pill.icon} iconFilled={prop.pill.iconFilled} />
							{:else if prop.href && prop.value != null}
								<a href={prop.href}>{prop.value}</a>
							{:else if prop.value != null}
								{#if typeof prop.value === 'boolean'}
									{prop.value ? 'Yes' : 'No'}
								{:else}
									{prop.value}
								{/if}
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.property-list {
		--pl-padding: 1rem;

		display: flex;
		flex-direction: column;
		padding: 0.75rem var(--pl-padding);
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
		color: $text-secondary;
		padding: 0.5rem 0;
	}

	dl {
		margin: 0;
	}

	.property-row {
		display: flex;
		flex-direction: column;
		padding: 0.25rem var(--pl-padding);
		margin-left: calc(-1 * var(--pl-padding));
		margin-right: calc(-1 * var(--pl-padding));

		[data-variant='inline'] & {
			flex-direction: row;
			align-items: center;
		}
	}

	.property-row:hover {
		background: rgba($fg, 0.03);
	}

	dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: $text-sm;
		color: $text-secondary;
		font-weight: 600;
		flex-shrink: 0;

		[data-variant='inline'] & {
			width: var(--label-width);
		}

		[data-variant='stacked'] & {
			margin-bottom: 0.25rem;
		}
	}

	dd {
		margin: 0;
		font-size: $text-sm;
		color: $text-primary;

		[data-variant='inline'] & {
			flex: 1;
			min-width: 0;
		}

		&.muted {
			color: $text-muted;
		}
	}

	a {
		color: $primary;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

</style>
