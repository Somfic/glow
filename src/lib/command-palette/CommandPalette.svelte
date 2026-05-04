<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quartOut } from 'svelte/easing';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import Spinner from '../spinner/Spinner.svelte';
	import Skeleton from '../skeleton/Skeleton.svelte';
	import Pill from '../pill/Pill.svelte';
	import { fuzzyScore } from '../input/search-utils.js';
	import { portal } from '../util/portal.js';
	import { lockScroll, unlockScroll } from '../util/scrollLock.js';
	import { commands as defaultRegistry, CommandRegistry } from './registry.svelte.js';
	import type { Command } from './types.js';

	type Props = {
		open?: boolean;
		registry?: CommandRegistry;
		placeholder?: string;
		emptyText?: string;
		/** Modifier-aware hotkey letter that opens the palette. Pass `false` to disable. */
		hotkey?: string | false;
	};

	let {
		open = $bindable(false),
		registry = defaultRegistry,
		placeholder = 'Type a command or search…',
		emptyText = 'No matching commands',
		hotkey = 'k'
	}: Props = $props();

	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);
	let resultsEl = $state<HTMLDivElement | null>(null);
	let resultsInnerEl = $state<HTMLDivElement | null>(null);
	let levelEl = $state<HTMLDivElement | null>(null);
	let loadingId = $state<string | null>(null);
	let indicatorTop = $state(0);
	let indicatorHeight = $state(0);
	let indicatorReady = $state(false);
	/** Drill-in stack: each entry is the parent command we drilled into. */
	let path = $state<Command[]>([]);
	/** Resolved children for the current level. */
	let levelCommands = $state<Command[]>([]);
	/** Slide direction: +1 = drilling deeper, -1 = popping back. */
	let direction = $state(1);
	let prevDepth = -1;
	/** Width of the results panel — drives the fly distance. */
	let panelWidth = $state(0);
	/** Natural height of the current level's content. */
	let levelHeight = $state(0);
	/** True while async children for the current level are being fetched. */
	let loadingChildren = $state(false);

	type QuerySegment = { text: string; chipIdx: number };

	/** Chain of commands aligned with the chipIdx values produced by querySegments.
	 *  Index 0 is the group (null — group is just a label, no command), then each
	 *  ancestor in `_path`, then the leaf. Recomputed when the active result changes. */
	const chainCommands = $derived.by<(Command | null)[]>(() => {
		const active = flat[activeIndex];
		if (!active) return [];
		const out: (Command | null)[] = [];
		if (active.group) out.push(null);
		for (const p of active._path) out.push(p);
		out.push(active);
		return out;
	});

	/**
	 * Group runs of the query that map to the same level of the active result's
	 * label chain into chips. Walking left-to-right, each non-space token gets
	 * assigned to the lowest chain entry (≥ the previous match) whose label
	 * contains the token. Whitespace between two same-chain tokens is folded
	 * into the same chip so adjacent words visually merge.
	 */
	const querySegments = $derived.by<QuerySegment[]>(() => {
		if (!query.trim()) return [];
		const active = flat[activeIndex];
		if (!active) return [{ text: query, chipIdx: -1 }];
		// Chain layout: [group?, ...path, leaf]. The group entry is special —
		// it qualifies the action but isn't its own "level", so it's allowed
		// to fold into adjacent chips. Path/leaf entries are real levels and
		// each gets its own chip.
		const groupLabel = active.group ?? null;
		const groupIdx = groupLabel ? 0 : -1;
		const chain = [
			...(groupLabel ? [groupLabel] : []),
			...active._path.map((p) => p.label),
			active.label
		].map((l) => l.toLowerCase());
		const raw = query.split(/(\s+)/);
		const matched: { text: string; isWord: boolean; chipIdx: number }[] = raw.map(
			(text) => ({ text, isWord: /\S/.test(text), chipIdx: -1 })
		);
		for (const seg of matched) {
			if (!seg.isWord) continue;
			const needle = seg.text.toLowerCase();
			for (let i = 0; i < chain.length; i++) {
				if (chain[i].includes(needle)) {
					seg.chipIdx = i;
					break;
				}
			}
		}
		// Two chipped segments merge only when they share a chain index OR
		// when one of them is the group qualifier. Different real levels
		// ("Invite teammate" vs "Bob Chen") stay as separate chips.
		const canMerge = (a: number, b: number): boolean =>
			a === b || a === groupIdx || b === groupIdx;
		// Bridge whitespace between two mergeable chipped neighbours.
		for (let i = 1; i < matched.length - 1; i++) {
			const prev = matched[i - 1];
			const next = matched[i + 1];
			if (
				!matched[i].isWord &&
				prev.chipIdx >= 0 &&
				next.chipIdx >= 0 &&
				canMerge(prev.chipIdx, next.chipIdx)
			) {
				matched[i].chipIdx = prev.chipIdx;
			}
		}
		const out: QuerySegment[] = [];
		for (const seg of matched) {
			const isChip = seg.chipIdx >= 0;
			const last = out[out.length - 1];
			const lastIsChip = !!last && last.chipIdx >= 0;
			if (last && !isChip && !lastIsChip) {
				last.text += seg.text;
				continue;
			}
			if (last && isChip && lastIsChip && canMerge(last.chipIdx, seg.chipIdx)) {
				last.text += seg.text;
				continue;
			}
			out.push({ text: seg.text, chipIdx: seg.chipIdx });
		}
		return out;
	});

	$effect.pre(() => {
		const depth = path.length;
		if (prevDepth !== -1 && depth !== prevDepth) {
			direction = depth > prevDepth ? 1 : -1;
			// Reset scroll on level change so the new level doesn't render
			// scrolled to the previous level's position. Done in `pre` so the
			// scrollTop reset lands before the slide-in transition starts.
			if (resultsEl) resultsEl.scrollTop = 0;
		}
		prevDepth = depth;
	});

	function visibleAt(level: Command[]): Command[] {
		return level.filter((c) => !c.when || c.when());
	}

	$effect(() => {
		// Re-resolve the current level whenever the path or registry changes.
		const parent = path[path.length - 1];
		if (!parent) {
			levelCommands = visibleAt(registry.commands);
			return;
		}
		const kids = parent.children;
		if (!kids) {
			levelCommands = [];
			return;
		}
		if (Array.isArray(kids)) {
			levelCommands = visibleAt(kids);
			loadingChildren = false;
		} else {
			levelCommands = [];
			loadingChildren = true;
			Promise.resolve(kids())
				.then((arr) => {
					levelCommands = visibleAt(arr);
				})
				.catch((err) => console.error('[CommandPalette] children failed:', err))
				.finally(() => {
					loadingChildren = false;
				});
		}
	});

	type ScoredCommand = Command & {
		_score: number;
		/** Ancestor path for composed (cross-level) entries; empty for normal level rows. */
		_path: Command[];
		/** Stable key — embeds the path so the same leaf at different paths doesn't collide. */
		_keyId: string;
	};

	/**
	 * Walk the tree starting at `cmds`, emitting an entry for every leaf that
	 * lives at least one level deep (i.e. has at least one ancestor). Async
	 * children can't be flattened eagerly, so those branches are skipped.
	 */
	function flattenTree(
		cmds: Command[],
		pathSoFar: Command[] = []
	): { command: Command; path: Command[] }[] {
		const out: { command: Command; path: Command[] }[] = [];
		for (const c of cmds) {
			if (c.when && !c.when()) continue;
			if (c.children) {
				if (Array.isArray(c.children)) {
					out.push(...flattenTree(c.children, [...pathSoFar, c]));
				}
				// async children → skip; they'd require a fetch to compose.
			} else if (pathSoFar.length > 0) {
				out.push({ command: c, path: pathSoFar });
			}
		}
		return out;
	}

	const scored = $derived.by<ScoredCommand[]>(() => {
		const base = levelCommands.map((c) => ({ command: c, path: [] as Command[] }));
		// Only fold in cross-level composed entries when at the root with an
		// active query — they'd be noisy otherwise.
		const composed =
			path.length === 0 && query.trim()
				? flattenTree(registry.commands)
				: [];
		const all = [...base, ...composed];

		const decorate = (entry: { command: Command; path: Command[] }, score: number): ScoredCommand => ({
			...entry.command,
			_score: score,
			_path: entry.path,
			_keyId:
				entry.path.length > 0
					? entry.path.map((p) => p.id).join('/') + '/' + entry.command.id
					: entry.command.id
		});

		if (!query.trim()) {
			return all.map((e) => decorate(e, 0));
		}
		const q = query.trim();
		// Drop common filler words from the *required* set so "set theme to
		// green" still requires set/theme/green to all match somewhere — but
		// "to" itself isn't required (and isn't enough on its own to pull a
		// row in either).
		const STOP_WORDS = new Set([
			'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
			'with', 'at', 'by', 'is', 'it'
		]);
		const allTokens = q.split(/\s+/).filter(Boolean);
		const meaningful = allTokens.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
		const required = meaningful.length > 0 ? meaningful : allTokens;
		return all
			.map((e) => {
				const c = e.command;
				const labelChain = [...e.path.map((p) => p.label), c.label].join(' ');
				const ancestorMeta = e.path
					.flatMap((p) => [p.description ?? '', ...(p.keywords ?? [])])
					.filter(Boolean)
					.join(' ');
				const haystack = [
					labelChain,
					c.group ?? '',
					ancestorMeta,
					c.description ?? '',
					...(c.keywords ?? [])
				].join(' ');
				const scoreToken = (tok: string) =>
					Math.max(
						fuzzyScore(tok, c.label),
						fuzzyScore(tok, labelChain) * 0.95,
						fuzzyScore(tok, haystack) * 0.6
					);
				// Every meaningful token must hit somewhere — no half-matches.
				let matched = 0;
				let total = 0;
				for (const tok of required) {
					const s = scoreToken(tok);
					if (s > 0) {
						matched++;
						total += s;
					}
				}
				if (matched < required.length) return decorate(e, 0);
				// Stop-words don't gate the result but do contribute small
				// score nudges if they happen to match (so "in" ranks higher
				// for results that contain it).
				for (const tok of allTokens) {
					if (required.includes(tok)) continue;
					total += scoreToken(tok) * 0.2;
				}
				return decorate(e, total);
			})
			.filter((e) => e._score > 0)
			.sort((a, b) => b._score - a._score);
	});

	type Section = { name: string; items: ScoredCommand[]; startIndex: number };

	const sections = $derived.by<Section[]>(() => {
		const buckets = new Map<string, ScoredCommand[]>();
		for (const c of scored) {
			const key = c.group ?? 'Other';
			const list = buckets.get(key);
			if (list) list.push(c);
			else buckets.set(key, [c]);
		}
		const out: Section[] = [];
		let cursor = 0;
		for (const [name, items] of buckets) {
			out.push({ name, items, startIndex: cursor });
			cursor += items.length;
		}
		return out;
	});

	const flat = $derived(scored);

	$effect(() => {
		if (activeIndex > flat.length - 1) activeIndex = Math.max(0, flat.length - 1);
	});

	$effect(() => {
		if (open) {
			query = '';
			activeIndex = 0;
			loadingId = null;
			indicatorReady = false;
			path = [];
			prevDepth = -1;
			lockScroll();
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			unlockScroll();
		}
	});

	function close() {
		open = false;
	}

	function popLevel() {
		if (path.length === 0) {
			close();
			return;
		}
		path = path.slice(0, -1);
		query = '';
		activeIndex = 0;
	}

	async function run(cmd: Command | undefined) {
		if (!cmd || loadingId) return;
		// Drill-in: command is a tree node.
		if (cmd.children) {
			path = [...path, cmd];
			query = '';
			activeIndex = 0;
			setTimeout(() => inputEl?.focus(), 0);
			return;
		}
		if (!cmd.perform) return;
		const result = cmd.perform({ query, close });
		if (result instanceof Promise) {
			loadingId = cmd.id;
			try {
				await result;
				close();
			} catch (err) {
				console.error('[CommandPalette] command threw:', err);
			} finally {
				loadingId = null;
			}
		} else {
			close();
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (flat.length === 0) return;
			activeIndex = (activeIndex + 1) % flat.length;
			scrollActiveIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (flat.length === 0) return;
			activeIndex = (activeIndex - 1 + flat.length) % flat.length;
			scrollActiveIntoView();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			run(flat[activeIndex]);
		} else if (e.key === 'ArrowRight' && flat[activeIndex]?.children) {
			e.preventDefault();
			run(flat[activeIndex]);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			popLevel();
		} else if (e.key === 'Backspace' && query === '' && path.length > 0) {
			e.preventDefault();
			popLevel();
		} else if (e.key === 'Home') {
			e.preventDefault();
			activeIndex = 0;
			scrollActiveIntoView();
		} else if (e.key === 'End') {
			e.preventDefault();
			activeIndex = flat.length - 1;
			scrollActiveIntoView();
		}
	}

	function scrollActiveIntoView() {
		queueMicrotask(() => {
			if (!resultsEl) return;
			// Edges: scroll all the way so the container's own padding is
			// visible above/below the first/last row.
			if (activeIndex === 0) {
				resultsEl.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			if (activeIndex === flat.length - 1) {
				resultsEl.scrollTo({ top: resultsEl.scrollHeight, behavior: 'smooth' });
				return;
			}
			const activeEl = resultsEl.querySelector<HTMLElement>(`[data-cp-index="${activeIndex}"]`);
			if (!activeEl) return;
			// Keep one row of breathing room above AND below the active item.
			// Scroll only when the buffer would be eaten — symmetric in both
			// directions.
			const wrapRect = resultsEl.getBoundingClientRect();
			const itemRect = activeEl.getBoundingClientRect();
			const buffer = itemRect.height;
			const overflowTop = wrapRect.top + buffer - itemRect.top;
			const overflowBottom = itemRect.bottom + buffer - wrapRect.bottom;
			if (overflowTop > 0) {
				resultsEl.scrollBy({ top: -overflowTop, behavior: 'smooth' });
			} else if (overflowBottom > 0) {
				resultsEl.scrollBy({ top: overflowBottom, behavior: 'smooth' });
			}
		});
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	$effect(() => {
		// Re-run when activeIndex / flat / level change.
		void activeIndex;
		void flat.length;
		void path.length;
		void loadingChildren;
		if (!levelEl) return;
		// Defer the DOM read by a frame so freshly-rendered items (e.g. just
		// after async children resolve) are laid out before we measure them.
		const lvl = levelEl;
		const idx = activeIndex;
		requestAnimationFrame(() => {
			const el = lvl.querySelector<HTMLElement>(`[data-cp-index="${idx}"]`);
			if (!el) {
				indicatorReady = false;
				return;
			}
			indicatorTop = el.offsetTop;
			indicatorHeight = el.offsetHeight;
			indicatorReady = true;
		});
	});

	$effect(() => {
		// Sync results-wrap height to the natural level height (clamped).
		if (!resultsEl) return;
		const max = window.innerHeight * 0.5;
		resultsEl.style.height = Math.min(levelHeight, max) + 'px';
	});

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
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="cp-overlay"
		use:portal
		role="dialog"
		aria-modal="true"
		aria-label="Command palette"
		tabindex="-1"
		onclick={onBackdropClick}
		transition:fade={{ duration: 120 }}
	>
		<div
			bind:this={listEl}
			class="cp-panel"
			transition:fly={{ y: -8, duration: 160 }}
			onkeydown={onKeydown}
		>
			<div class="cp-search">
				<span class="cp-search-icon"><Icon name="Search" size={16} /></span>
				{#if path.length > 0}
					<div class="cp-crumbs">
						<button type="button" class="cp-crumb cp-crumb-root" onclick={() => { path = []; query = ''; activeIndex = 0; inputEl?.focus(); }}>
							<Icon name="House" size={12} />
						</button>
						{#each path as crumb, i (crumb.id)}
							<span class="cp-crumb-sep"><Icon name="ChevronRight" size={12} /></span>
							<button
								type="button"
								class="cp-crumb"
								class:current={i === path.length - 1}
								onclick={() => { path = path.slice(0, i + 1); query = ''; activeIndex = 0; inputEl?.focus(); }}
							>{crumb.label}</button>
						{/each}
					</div>
				{/if}
				<input
					bind:this={inputEl}
					bind:value={query}
					{placeholder}
					class="cp-input"
					type="text"
					autocomplete="off"
					spellcheck="false"
				/>
				<Kbd size="sm">esc</Kbd>
			</div>

			{#if querySegments.some((s) => s.chipIdx >= 0)}
				<div class="cp-parsed" aria-hidden="true">
					{#each querySegments as seg, i (i)}
						{#if seg.chipIdx >= 0}
							{@const chipCmd = chainCommands[seg.chipIdx]}
							<span class="cp-parsed-chip">
								{#if chipCmd?.image}
									<img class="cp-parsed-chip-image" src={chipCmd.image} alt="" />
								{:else if chipCmd?.icon}
									{@const cic = resolveIcon(chipCmd.icon)}
									<Icon {...cic} size={12} />
								{/if}
								{seg.text.trim()}
							</span>
						{:else if seg.text.trim()}
							<span class="cp-parsed-fill">{seg.text.trim()}</span>
						{/if}
					{/each}
				</div>
			{/if}

			<div bind:this={resultsEl} class="cp-results">
				<div
					bind:this={resultsInnerEl}
					class="cp-results-inner"
					bind:clientWidth={panelWidth}
					style:height="{levelHeight}px"
				>
				{#if flat.length > 0}
					<div
						class="cp-indicator"
						class:ready={indicatorReady}
						style:top="{indicatorTop}px"
						style:height="{indicatorHeight}px"
					></div>
				{/if}
				{#key path.length}
					<div
						class="cp-level"
						bind:this={levelEl}
						bind:offsetHeight={levelHeight}
						in:fly={{ x: direction * (panelWidth || 320), duration: 220, opacity: 1, easing: quartOut }}
						out:fly={{ x: -direction * (panelWidth || 320), duration: 220, opacity: 1, easing: quartOut }}
					>
				{#if loadingChildren}
					{#each Array(4) as _, i (i)}
						<div class="cp-item cp-item-skeleton">
							<span class="cp-item-icon"><Skeleton shape="circle" width={16} /></span>
							<span class="cp-item-text">
								<Skeleton shape="text" width={`${50 + ((i * 17) % 35)}%`} />
							</span>
						</div>
					{/each}
				{:else if flat.length === 0}
					<div class="cp-empty">{emptyText}</div>
				{:else}
					{#each sections as section (section.name)}
						{#if sections.length > 1 || section.name !== 'Other'}
							<div class="cp-section-label">{section.name}</div>
						{/if}
						{#each section.items as cmd, i (cmd._keyId)}
							{@const idx = section.startIndex + i}
							{@const active = idx === activeIndex}
							<!-- svelte-ignore a11y_mouse_events_have_key_events -->
							{@const loading = loadingId === cmd.id}
							<button
								type="button"
								class="cp-item"
								class:active
								class:loading
								data-cp-index={idx}
								disabled={loadingId !== null && !loading}
								onclick={() => run(cmd)}
								onmousemove={() => {
									if (!loadingId) activeIndex = idx;
								}}
							>
								{#if loading}
									<span class="cp-item-icon"><Spinner size={14} /></span>
								{:else if cmd.image}
									<img class="cp-item-image" src={cmd.image} alt="" />
								{:else if cmd.icon}
									{@const ic = resolveIcon(cmd.icon)}
									<span class="cp-item-icon"><Icon {...ic} size={ic.size ?? 16} /></span>
								{:else}
									<span class="cp-item-icon cp-item-icon-empty"></span>
								{/if}
								<span class="cp-item-text">
									<span class="cp-item-label">
										{#if cmd._path.length > 0}
											{#each cmd._path as crumb (crumb.id)}
												<span class="cp-item-crumb">
													{#if crumb.icon}
														{@const pic = resolveIcon(crumb.icon)}
														<Icon {...pic} size={11} />
													{/if}
													{crumb.label}
												</span>
												<span class="cp-item-crumb-sep"><Icon name="ChevronRight" size={11} /></span>
											{/each}
										{/if}
										{cmd.label}
									</span>
									{#if cmd.description}
										<span class="cp-item-desc">{cmd.description}</span>
									{/if}
								</span>
								{#if cmd.badge != null && !loading}
									<span class="cp-item-badge">
										{#if typeof cmd.badge === 'object'}
											<Pill icon={cmd.badge.icon} label={cmd.badge.label} />
										{:else}
											<Pill label={String(cmd.badge)} />
										{/if}
									</span>
								{/if}
								{#if cmd.shortcut && !loading}
									<span class="cp-item-shortcut"><Kbd size="sm">{cmd.shortcut}</Kbd></span>
								{/if}
								{#if cmd.children}
									<span class="cp-item-chevron"><Icon name="ChevronRight" size={14} /></span>
								{/if}
							</button>
						{/each}
					{/each}
				{/if}
					</div>
				{/key}
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.cp-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 12vh $space-md $space-md;
	}

	.cp-panel {
		width: 100%;
		max-width: 640px;
		background: var(--glow-bg-surface, #1a1a1a);
		color: var(--glow-fg, #fff);
		border: 1px solid rgba($fg, 0.12);
		border-radius: $radius;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.cp-search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.85rem;
		border-bottom: 1px solid rgba($fg, 0.08);
	}

	.cp-search-icon {
		display: inline-flex;
		opacity: 0.6;
	}

	.cp-input {
		flex: 1 1 auto;
		min-width: 0;
		background: transparent;
		border: none;
		outline: none;
		color: var(--glow-fg);
		font: inherit;
		font-size: 0.95rem;

		&::placeholder {
			color: rgba($fg, 0.45);
		}
	}

	.cp-parsed {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.85rem;
		border-bottom: 1px solid rgba($fg, 0.08);
		font-size: 0.75rem;
	}

	.cp-parsed-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
		font-weight: 500;
	}

	.cp-parsed-chip-image {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		object-fit: cover;
	}

	.cp-parsed-fill {
		color: rgba($fg, 0.45);
		font-style: italic;
	}

	.cp-results {
		overflow-y: auto;
		overflow-x: hidden;
		transition: height var(--glow-dur-fast) $ease-out;
	}

	.cp-results-inner {
		position: relative;
		transition: height var(--glow-dur-fast) $ease-out;
	}

	.cp-level {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 0.4rem;
		box-sizing: border-box;
	}

	.cp-indicator {
		position: absolute;
		left: 0.4rem;
		right: 0.4rem;
		background: var(--glow-primary-soft);
		border-radius: 6px;
		z-index: 0;
		pointer-events: none;
		opacity: 0;
		transition: top var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1),
			height var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1),
			opacity var(--glow-dur-instant) cubic-bezier(0.22, 1, 0.36, 1);

		&.ready {
			opacity: 1;
		}
	}

	.cp-empty {
		padding: 1.5rem;
		text-align: center;
		color: rgba($fg, 0.55);
		font-size: 0.875rem;
	}

	.cp-section-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba($fg, 0.5);
		padding: 0.55rem 0.6rem 0.3rem;
	}

	.cp-item {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		border-radius: 6px;
		cursor: pointer;
		transition: color var(--glow-dur-instant) $ease-out;

		&.active {
			color: var(--glow-primary);

			.cp-item-icon {
				opacity: 1;
			}
		}

		&:disabled {
			cursor: progress;
		}
	}

	.cp-item-skeleton {
		cursor: default;
		pointer-events: none;
	}

	.cp-item-icon {
		display: inline-flex;
		flex: 0 0 auto;
		width: 18px;
		justify-content: center;
		opacity: 0.85;
	}

	.cp-item-icon-empty {
		visibility: hidden;
	}

	.cp-item-image {
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
	}



	.cp-item-text {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.cp-item-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.cp-item-crumb {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
		background: rgba($fg, 0.08);
		color: rgba($fg, 0.65);
		font-weight: 500;
	}

	.cp-item-crumb-sep {
		display: inline-flex;
		opacity: 0.4;
	}

	.cp-item.active .cp-item-crumb {
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
	}

	.cp-item-desc {
		font-size: 0.75rem;
		color: rgba($fg, 0.55);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cp-item-shortcut {
		flex: 0 0 auto;
	}

	.cp-item-badge {
		flex: 0 0 auto;
		display: inline-flex;
	}

	.cp-item-chevron {
		flex: 0 0 auto;
		display: inline-flex;
		opacity: 0.45;
	}

	.cp-crumbs {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex: 0 0 auto;
		max-width: 50%;
		overflow: hidden;
	}

	.cp-crumb {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: rgba($fg, 0.08);
		color: rgba($fg, 0.7);
		border: none;
		border-radius: 4px;
		padding: 0.15rem 0.4rem;
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
		transition: background var(--glow-dur-instant) $ease-out, color var(--glow-dur-instant) $ease-out;

		&:hover {
			background: rgba($fg, 0.14);
			color: var(--glow-fg);
		}

		&.current {
			background: var(--glow-primary-soft);
			color: var(--glow-primary);
		}
	}

	.cp-crumb-root {
		padding: 0.15rem 0.3rem;
	}

	.cp-crumb-sep {
		display: inline-flex;
		opacity: 0.4;
	}
</style>
