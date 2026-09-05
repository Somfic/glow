<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { quartOut } from 'svelte/easing';
	import Drawer from '../drawer/Drawer.svelte';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Button from '../button/Button.svelte';
	import {
		notifications as defaultRegistry,
		NotificationCenter as Registry
	} from './notificationCenter.svelte.js';
	import type { Notification } from './types.js';
	import { reducedMotion } from '../util/reducedMotion.svelte.js';

	const motion = reducedMotion();

	type GroupBy = 'time' | 'source' | 'none';

	type Props = {
		open?: boolean;
		registry?: Registry;
		emptyText?: string;
		groupBy?: GroupBy;
		hotkey?: string | false;
	};

	let {
		open = $bindable(false),
		registry = defaultRegistry,
		emptyText = 'Inbox zero. Enjoy it.',
		groupBy = 'time',
		hotkey = 'n'
	}: Props = $props();

	type Section = { name: string; items: Notification[] };

	const sections = $derived.by<Section[]>(() => {
		const visible = registry.visible;
		if (visible.length === 0) return [];
		if (groupBy === 'none') return [{ name: '', items: visible }];
		if (groupBy === 'source') {
			const buckets = new Map<string, Notification[]>();
			for (const n of visible) {
				const key = n.source ?? 'Other';
				const list = buckets.get(key);
				if (list) list.push(n);
				else buckets.set(key, [n]);
			}
			return Array.from(buckets, ([name, items]) => ({ name, items }));
		}
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const startOfYesterday = startOfToday.getTime() - 24 * 60 * 60 * 1000;
		const startOfWeek = startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000;
		const groups: Record<string, Notification[]> = {
			Today: [],
			Yesterday: [],
			'This week': [],
			Earlier: []
		};
		for (const n of visible) {
			if (n.createdAt >= startOfToday.getTime()) groups.Today.push(n);
			else if (n.createdAt >= startOfYesterday) groups.Yesterday.push(n);
			else if (n.createdAt >= startOfWeek) groups['This week'].push(n);
			else groups.Earlier.push(n);
		}
		return Object.entries(groups)
			.filter(([, items]) => items.length > 0)
			.map(([name, items]) => ({ name, items }));
	});

	function relativeTime(ms: number): string {
		const diff = Date.now() - ms;
		if (diff < 60_000) return 'now';
		const m = Math.floor(diff / 60_000);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h`;
		const d = Math.floor(h / 24);
		if (d < 7) return `${d}d`;
		const w = Math.floor(d / 7);
		if (w < 5) return `${w}w`;
		return new Date(ms).toLocaleDateString();
	}

	function categoryColor(c: Notification['category']): string {
		switch (c) {
			case 'success':
				return 'var(--glow-color-success)';
			case 'warning':
				return 'var(--glow-color-warning)';
			case 'error':
				return 'var(--glow-color-danger)';
			case 'mention':
				return 'var(--glow-primary)';
			default:
				return 'var(--glow-color-info)';
		}
	}

	$effect(() => {
		if (typeof window === 'undefined' || hotkey === false || !hotkey) return;
		const wanted = hotkey.toLowerCase();
		const onKey = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey)) return;
			if (e.key.toLowerCase() !== wanted) return;
			e.preventDefault();
			open = !open;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	let listEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		if (!open || !listEl || groupBy === 'source') return;
		const dwellTimers = new Map<string, ReturnType<typeof setTimeout>>();
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = (entry.target as HTMLElement).dataset.notifId;
					if (!id) continue;
					if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
						if (dwellTimers.has(id)) continue;
						const handle = setTimeout(() => {
							registry.markRead(id);
							dwellTimers.delete(id);
						}, 600);
						dwellTimers.set(id, handle);
					} else {
						const handle = dwellTimers.get(id);
						if (handle) {
							clearTimeout(handle);
							dwellTimers.delete(id);
						}
					}
				}
			},
			{ root: listEl, threshold: [0, 0.5, 1] }
		);
		const refresh = () => {
			io.disconnect();
			const rows = listEl?.querySelectorAll<HTMLElement>('[data-notif-id]') ?? [];
			rows.forEach((r) => io.observe(r));
		};
		refresh();
		const mo = new MutationObserver(refresh);
		mo.observe(listEl, { childList: true, subtree: true });
		return () => {
			io.disconnect();
			mo.disconnect();
			for (const t of dwellTimers.values()) clearTimeout(t);
		};
	});

	const headerActions = $derived(
		registry.visible.length > 0
			? [
					{
						label: 'Mark all read',
						variant: 'ghost' as const,
						onclick: () => registry.markAllRead(),
						disabled: registry.unreadCount === 0
					},
					{
						label: 'Clear',
						variant: 'ghost' as const,
						onclick: () => registry.dismissAll()
					}
				]
			: []
	);
</script>

<Drawer
	bind:open
	title="Inbox"
	subtitle={registry.unreadCount > 0
		? `${registry.unreadCount} unread`
		: 'All caught up'}
	icon="Bell"
	size="medium"
	side="right"
	actions={headerActions}
>
	{#if registry.visible.length === 0}
		<div class="nc-empty" in:fly={{ y: 8, duration: motion.ms(220), easing: quartOut }}>
			<div class="nc-empty-mark" aria-hidden="true">
				<span></span><span></span><span></span>
			</div>
			<p class="nc-empty-headline">{emptyText}</p>
			<p class="nc-empty-sub">Anything new will appear right here.</p>
		</div>
	{:else}
		<div bind:this={listEl} class="nc-list">
			{#each sections as section, sIdx (section.name || sIdx)}
				{#if section.name}
					<div class="nc-section">
						<span class="nc-section-name">{section.name}</span>
						<span class="nc-section-rule"></span>
						<span class="nc-section-count">{section.items.length}</span>
					</div>
				{/if}
				{#each section.items as n, i (n.id)}
					<article
						class="nc-row"
						class:unread={!n.read}
						data-notif-id={n.id}
						style:--cat-color={categoryColor(n.category)}
						in:fly={{ y: -6, duration: motion.ms(220), delay: motion.ms(i * 22), easing: quartOut }}
						out:slide={{ duration: motion.ms(180), easing: quartOut }}
					>
						<div class="nc-leading">
							<div class="nc-halo">
								{#if n.image}
									<img src={n.image} alt="" class="nc-image" />
								{:else if n.icon}
									{@const ic = resolveIcon(n.icon)}
									<span class="nc-icon"><Icon {...ic} size={ic.size ?? 18} /></span>
								{:else}
									<span class="nc-icon nc-icon-blank"></span>
								{/if}
							</div>
						</div>

						<div class="nc-body">
							<div class="nc-title-row">
								<h3 class="nc-title">{n.title}</h3>
								<div class="nc-meta">
									{#if !n.read}
										<span class="nc-unread-dot" aria-label="unread"></span>
									{/if}
									<time class="nc-time">{relativeTime(n.createdAt)}</time>
								</div>
							</div>
							{#if n.source}
								<div class="nc-source">{n.source}</div>
							{/if}
							{#if n.body}
								<p class="nc-text">{n.body}</p>
							{/if}
							{#if n.actions && n.actions.length > 0}
								<div class="nc-actions">
									{#each n.actions.slice(0, 2) as a (a.label)}
										<Button
											label={a.label}
											variant={a.variant ?? 'secondary'}
											onclick={() => a.onclick(n)}
										/>
									{/each}
								</div>
							{/if}
							<div class="nc-toolbar">
								<button
									type="button"
									class="nc-tool"
									title="Snooze 5s"
									aria-label="Snooze"
									onclick={() => registry.snooze(n.id, 5000)}
								>
									<Icon name="Clock" size={13} />
								</button>
								<button
									type="button"
									class="nc-tool"
									title="Dismiss"
									aria-label="Dismiss"
									onclick={() => registry.dismiss(n.id)}
								>
									<Icon name="X" size={13} />
								</button>
							</div>
						</div>
					</article>
				{/each}
			{/each}
		</div>
	{/if}
</Drawer>

<style lang="scss">
	@use '../style/theme.scss' as *;

	/* ----- Empty state ------------------------------------------------- */

	.nc-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		padding: 4.5rem 1rem 3.5rem;
		text-align: center;
	}

	.nc-empty-mark {
		display: inline-flex;
		gap: 6px;
		margin-bottom: 0.85rem;
		opacity: 0.6;

		span {
			display: inline-block;
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: color-mix(in oklab, var(--glow-fg) 35%, transparent);
			animation: nc-pulse calc(var(--glow-dur-glacial) * 3.2) var(--glow-ease-in-out) infinite;

			&:nth-child(2) {
				animation-delay: calc(var(--glow-dur-glacial) * 0.4);
			}

			&:nth-child(3) {
				animation-delay: calc(var(--glow-dur-glacial) * 0.8);
			}
		}
	}

	@keyframes nc-pulse {
		0%, 100% {
			opacity: 0.4;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	// A 1ms collapse would strobe the three dots rather than stop them. The
	// mark is decorative, so it settles at the animation's mid-point instead.
	@media (prefers-reduced-motion: reduce) {
		.nc-empty-mark span {
			animation: none;
			opacity: 1;
		}
	}

	.nc-empty-headline {
		margin: 0;
		font-size: 1.05rem;
		font-weight: $weight-semibold;
		letter-spacing: -0.01em;
		color: var(--glow-fg);
	}

	.nc-empty-sub {
		margin: 0;
		font-size: 0.825rem;
		color: color-mix(in oklab, var(--glow-fg) 50%, transparent);
	}

	/* ----- List + sections -------------------------------------------- */

	.nc-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: $space-xs 0 $space-sm;
	}

	.nc-section {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 1rem 0.1rem 0.5rem;

		&:first-child {
			padding-top: 0.4rem;
		}
	}

	.nc-section-name {
		font-size: 0.65rem;
		font-weight: $weight-bold;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--glow-fg) 55%, transparent);
	}

	.nc-section-rule {
		flex: 1 1 auto;
		height: 1px;
		background: linear-gradient(to right, color-mix(in oklab, var(--glow-fg) 12%, transparent), color-mix(in oklab, var(--glow-fg) 2%, transparent));
	}

	.nc-section-count {
		font-size: 0.7rem;
		font-weight: $weight-semibold;
		font-variant-numeric: tabular-nums;
		padding: 0.1rem 0.45rem;
		border-radius: $radius-full;
		background: color-mix(in oklab, var(--glow-fg) 8%, transparent);
		color: color-mix(in oklab, var(--glow-fg) 65%, transparent);
		min-width: 1.4rem;
		text-align: center;
	}

	/* ----- Row --------------------------------------------------------- */

	.nc-row {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		padding: 0.75rem 0.85rem;
		border-radius: 10px;
		background: var(--glow-bg-surface-element);
		border: 1px solid color-mix(in oklab, var(--glow-fg) 6%, transparent);
		transition:
			background var(--glow-dur-fast) $ease-out,
			border-color var(--glow-dur-fast) $ease-out,
			transform var(--glow-dur-fast) $ease-out,
			box-shadow var(--glow-dur-fast) $ease-out;

		&:hover {
			transform: translateY(-1px);
			border-color: color-mix(in oklab, var(--glow-fg) 12%, transparent);
			box-shadow: $shadow-md;

			.nc-toolbar {
				opacity: 1;
				transform: translateY(0);
			}
		}

		&.unread {
			background: color-mix(in oklab, var(--cat-color) 7%, var(--glow-bg-surface-element));
			border-color: color-mix(in oklab, var(--cat-color) 20%, color-mix(in oklab, var(--glow-fg) 8%, transparent));
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--cat-color) 12%, transparent),
				0 6px 18px color-mix(in oklab, var(--cat-color) 8%, transparent);
		}
	}

	/* ----- Avatar / icon halo ----------------------------------------- */

	.nc-leading {
		display: flex;
		align-items: flex-start;
	}

	.nc-halo {
		position: relative;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 0 0 1px color-mix(in oklab, var(--glow-fg) 8%, transparent),
			0 0 0 0 transparent;
		transition: box-shadow var(--glow-dur-base) $ease-out;
	}

	.nc-row.unread .nc-halo {
		box-shadow:
			0 0 0 2px var(--cat-color),
			0 0 12px color-mix(in oklab, var(--cat-color) 35%, transparent);
	}

	.nc-image {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.nc-icon {
		width: 100%;
		height: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: color-mix(in oklab, var(--glow-fg) 6%, transparent);
		color: var(--cat-color);
	}

	.nc-icon-blank {
		background: color-mix(in oklab, var(--glow-fg) 4%, transparent);
	}

	/* ----- Body -------------------------------------------------------- */

	.nc-body {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		position: relative;
	}

	.nc-title-row {
		display: flex;
		align-items: baseline;
		gap: 0.65rem;
		min-width: 0;
	}

	.nc-title {
		flex: 1 1 auto;
		min-width: 0;
		margin: 0;
		font-size: 0.875rem;
		font-weight: $weight-semibold;
		line-height: 1.3;
		letter-spacing: -0.005em;
		color: var(--glow-fg);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nc-meta {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.nc-unread-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--cat-color);
		box-shadow: 0 0 6px color-mix(in oklab, var(--cat-color) 50%, transparent);
	}

	.nc-time {
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
		color: color-mix(in oklab, var(--glow-fg) 45%, transparent);
		letter-spacing: 0.02em;
	}

	.nc-source {
		font-size: 0.7rem;
		font-weight: $weight-medium;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: color-mix(in oklab, var(--cat-color) 80%, var(--glow-fg));
		opacity: 0.85;
	}

	.nc-text {
		margin: 0.2rem 0 0;
		font-size: 0.825rem;
		line-height: 1.45;
		color: color-mix(in oklab, var(--glow-fg) 72%, transparent);
	}

	.nc-actions {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.55rem;
	}

	/* ----- Per-row toolbar -------------------------------------------- */

	.nc-toolbar {
		position: absolute;
		top: -2px;
		right: 0;
		display: inline-flex;
		gap: 2px;
		opacity: 0;
		transform: translateY(-2px);
		transition:
			opacity var(--glow-dur-fast) $ease-out,
			transform var(--glow-dur-fast) $ease-out;
	}

	.nc-tool {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: $radius-sm;
		background: color-mix(in oklab, var(--glow-fg) 6%, transparent);
		color: color-mix(in oklab, var(--glow-fg) 65%, transparent);
		border: 1px solid color-mix(in oklab, var(--glow-fg) 4%, transparent);
		cursor: pointer;
		transition:
			background var(--glow-dur-fast) $ease-out,
			color var(--glow-dur-fast) $ease-out,
			border-color var(--glow-dur-fast) $ease-out;

		&:hover {
			background: color-mix(in oklab, var(--glow-fg) 14%, transparent);
			color: var(--glow-fg);
			border-color: color-mix(in oklab, var(--glow-fg) 10%, transparent);
		}
	}
</style>
