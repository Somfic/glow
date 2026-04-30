<script lang="ts">
	import type { DataProps, DataGroup } from './types.js';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Pill from '../pill/Pill.svelte';

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
</script>

<div
	class="property-list"
	data-variant={variant}
	class:divided
	class:padded
	style:--label-width={variant === 'inline' ? labelWidth : undefined}
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
			<dl>
				{#each group.properties as prop}
					{@const hasValue = prop.value != null || prop.render || prop.pill}
					{@const labelOnlyLink = !hasValue && prop.href}
					<div class="property-row" class:label-only={!hasValue}>
						<svelte:element
							this={labelOnlyLink ? 'a' : 'dt'}
							class="dt"
							href={labelOnlyLink ? prop.href : undefined}
						>
							{#if prop.icon}
								<Icon {...resolveIcon(prop.icon)} size={resolveIcon(prop.icon).size ?? 14} />
							{/if}
							<span>{prop.label}</span>
						</svelte:element>
						{#if hasValue}
							<dd class:muted={prop.muted}>
								{#if prop.render}
									{@render prop.render()}
								{:else if prop.pill}
									{#if prop.pill.icon}
										<Pill label={prop.pill.label} color={prop.pill.color} icon={prop.pill.icon} />
									{:else}
										<Pill label={prop.pill.label} color={prop.pill.color} />
									{/if}
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
						{/if}
					</div>
				{/each}
			</dl>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.property-list {
		--pl-padding: 0;

		display: flex;
		flex-direction: column;

		&.padded {
			--pl-padding: 1rem;
			padding: 0.75rem var(--pl-padding);
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


	.dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: $text-sm;
		color: $text-secondary;
		font-weight: 600;
		flex-shrink: 0;
		text-decoration: none;

		[data-variant='inline'] & {
			width: var(--label-width);
		}

		[data-variant='stacked'] & {
			margin-bottom: 0.25rem;
		}

		.label-only & {
			width: 100%;
		}
	}

	a.dt {
		color: inherit;
		cursor: pointer;
		text-decoration: none;

		&:hover {
			color: $primary;
			text-decoration: none;
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
