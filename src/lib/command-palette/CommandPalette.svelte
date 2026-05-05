<script lang="ts">
	import { tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quartOut } from 'svelte/easing';
	import Icon, { resolveIcon } from '../icon/Icon.svelte';
	import Kbd from '../typography/Kbd.svelte';
	import Spinner from '../spinner/Spinner.svelte';
	import Skeleton from '../skeleton/Skeleton.svelte';
	import Pill from '../pill/Pill.svelte';
	import Card from '../card/Card.svelte';
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
	let inputFocused = $state(false);
	/** Mirrors the real input's `selectionStart` so we can place the visible
	 *  caret at the right character offset in the chip display. */
	let inputCaret = $state(0);
	let displayEl = $state<HTMLDivElement | null>(null);
	let caretX = $state(0);
	let caretY = $state(0);
	let caretH = $state(0);
	let caretInsideChip = $state(false);
	let caretBusy = $state(false);
	let caretBusyTimer: ReturnType<typeof setTimeout> | null = null;
	function bumpCaret() {
		caretBusy = true;
		if (caretBusyTimer) clearTimeout(caretBusyTimer);
		caretBusyTimer = setTimeout(() => {
			caretBusy = false;
		}, 500);
	}
	let caretEl = $state<HTMLSpanElement | null>(null);
	function syncCaret() {
		if (inputEl) inputCaret = inputEl.selectionStart ?? query.length;
		bumpCaret();
	}
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
	/** Normalised query — collapses internal whitespace and trims edges so
	 *  scoring, chipize and the visible input display all see a clean form. */
	const cleanQuery = $derived(query.replace(/\s+/g, ' ').trim());
	/** True while async children for the current level are being fetched. */
	let loadingChildren = $state(false);
	/** Memoized async-children results keyed by parent command id. Persists
	 *  for the lifetime of one palette session and clears on (re)open. */
	let childrenCache = $state<Map<string, Command[]>>(new Map());
	/** Ids of async-children parents currently being resolved. */
	let loadingParents = $state<Set<string>>(new Set());

	type QuerySegment = { text: string; chipIdx: number; start: number };

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
		if (!query) return [];
		const active = flat[activeIndex];
		if (!active) return [{ text: query, chipIdx: -1, start: 0 }];
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
		let cursor = 0;
		const matched: {
			text: string;
			isWord: boolean;
			chipIdx: number;
			start: number;
		}[] = raw.map((text) => {
			const start = cursor;
			cursor += text.length;
			return { text, isWord: /\S/.test(text), chipIdx: -1, start };
		});
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
			out.push({ text: seg.text, chipIdx: seg.chipIdx, start: seg.start });
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
		// Measure the caret position relative to the display, so we can paint
		// it as an absolute element that doesn't displace any text.
		void inputCaret;
		void inputFocused;
		void querySegments;
		void cleanQuery;
		if (!displayEl || !inputFocused) {
			caretH = 0;
			return;
		}
		requestAnimationFrame(() => {
			const display = displayEl;
			if (!display) return;
			const wrapRect = display.getBoundingClientRect();
			// Empty query → caret at display origin.
			if (cleanQuery.length === 0) {
				caretX = 0;
				caretY = 0;
				caretH = display.clientHeight;
				caretInsideChip = false;
				return;
			}
			// Find the segment that owns the caret position. Whitespace-only
			// segments aren't rendered, so when the caret lands inside one
			// (e.g. just after deleting a trailing chip), step backwards to
			// the nearest *visible* segment so the caret snaps to its end
			// instead of getting stuck at the deleted location.
			let ownerIdx =
				inputCaret === 0
					? -1
					: querySegments.findIndex(
							(s) => s.start < inputCaret && inputCaret <= s.start + s.text.length
						);
			while (
				ownerIdx >= 0 &&
				querySegments[ownerIdx].chipIdx < 0 &&
				!querySegments[ownerIdx].text.trim()
			) {
				ownerIdx--;
			}
			if (ownerIdx === -1) {
				// Before any segment / nothing visible to anchor to.
				caretX = 0;
				caretY = 0;
				caretH = display.clientHeight;
				caretInsideChip = false;
				return;
			}
			const seg = querySegments[ownerIdx];
			const segEl = display.querySelector<HTMLElement>(`[data-cp-seg="${ownerIdx}"]`);
			if (!segEl) return;
			// Use the LAST text node inside the segment — chips have an icon
			// + text, plain segments are pure text. Either way the trailing
			// text node holds the rendered characters.
			let textNode: Text | null = null;
			const walker = document.createTreeWalker(segEl, NodeFilter.SHOW_TEXT);
			let n: Node | null;
			while ((n = walker.nextNode())) textNode = n as Text;
			if (!textNode) {
				// Empty seg (whitespace-only that we hide) — fall back to seg box.
				const r = segEl.getBoundingClientRect();
				caretX = r.left - wrapRect.left;
				caretY = r.top - wrapRect.top;
				caretH = r.height;
				caretInsideChip = seg.chipIdx >= 0;
				return;
			}
			const offsetInText = Math.min(
				inputCaret - seg.start,
				textNode.textContent?.length ?? 0
			);
			const range = document.createRange();
			range.setStart(textNode, offsetInText);
			range.setEnd(textNode, offsetInText);
			const r = range.getBoundingClientRect();
			caretX = r.left - wrapRect.left;
			caretY = r.top - wrapRect.top;
			caretH = r.height || segEl.getBoundingClientRect().height;
			caretInsideChip = seg.chipIdx >= 0;
		});
	});

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
		/** True when the query targets the leaf itself (rather than a parent
		 *  or a more general field). Bubbles these rows to a top "Close match"
		 *  group so multiple actions on the same target cluster together. */
		_closeMatch: boolean;
	};

	/**
	 * Walk the tree starting at `cmds`, emitting an entry for every leaf that
	 * lives at least one level deep. Async children get expanded only when
	 * their resolved value is cached — uncached async branches are skipped
	 * here and triggered separately by `prewarmAsyncChildren`.
	 */
	function flattenTree(
		cmds: Command[],
		pathSoFar: Command[] = []
	): { command: Command; path: Command[] }[] {
		const out: { command: Command; path: Command[] }[] = [];
		for (const c of cmds) {
			if (c.when && !c.when()) continue;
			if (c.children) {
				const kids = Array.isArray(c.children)
					? c.children
					: childrenCache.get(c.id);
				if (kids) {
					out.push(...flattenTree(kids, [...pathSoFar, c]));
				}
			} else if (pathSoFar.length > 0) {
				out.push({ command: c, path: pathSoFar });
			}
		}
		return out;
	}

	const STOP_WORDS_SET = new Set([
		'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
		'with', 'at', 'by', 'is', 'it'
	]);

	/** Walk the tree once the user starts typing at the root and prefetch
	 *  every async-children branch so their leaves can participate in the
	 *  search. Each branch is fetched at most once per palette session
	 *  (memoized in `childrenCache`). */
	$effect(() => {
		if (path.length !== 0) return;
		if (cleanQuery.length === 0) return;
		const cache = childrenCache;
		const loading = loadingParents;
		const walk = (cmds: Command[]) => {
			for (const c of cmds) {
				if (c.when && !c.when()) continue;
				if (!c.children) continue;
				if (Array.isArray(c.children)) {
					walk(c.children);
					continue;
				}
				if (cache.has(c.id) || loading.has(c.id)) continue;
				const id = c.id;
				const fn = c.children;
				const next = new Set(loadingParents);
				next.add(id);
				loadingParents = next;
				Promise.resolve(fn())
					.then((arr) => {
						const m = new Map(childrenCache);
						m.set(id, arr);
						childrenCache = m;
					})
					.catch((err) =>
						console.error('[CommandPalette] composed children failed:', err)
					)
					.finally(() => {
						const s = new Set(loadingParents);
						s.delete(id);
						loadingParents = s;
					});
			}
		};
		walk(registry.commands);
	});

	const scored = $derived.by<ScoredCommand[]>(() => {
		const base = levelCommands.map((c) => ({ command: c, path: [] as Command[] }));
		// Only fold in cross-level composed entries when at the root with an
		// active query — they'd be noisy otherwise.
		const composed =
			path.length === 0 && cleanQuery
				? flattenTree(registry.commands)
				: [];
		const all = [...base, ...composed];

		const decorate = (
			entry: { command: Command; path: Command[] },
			score: number,
			closeMatch = false
		): ScoredCommand => ({
			...entry.command,
			_score: score,
			_path: entry.path,
			_closeMatch: closeMatch,
			_keyId:
				entry.path.length > 0
					? entry.path.map((p) => p.id).join('/') + '/' + entry.command.id
					: entry.command.id
		});

		if (!cleanQuery) {
			return all.map((e) => decorate(e, 0));
		}
		const q = cleanQuery;
		// Drop common filler words from the *required* set so "set theme to
		// green" still requires set/theme/green to all match somewhere — but
		// "to" itself isn't required (and isn't enough on its own to pull a
		// row in either).
		const allTokens = q.split(/\s+/).filter(Boolean);
		const meaningful = allTokens.filter((t) => !STOP_WORDS_SET.has(t.toLowerCase()));
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
				// Detect "the user is targeting this leaf": every required
				// token's best fuzzy hit is on the leaf label itself, not on
				// any ancestor or general haystack. So typing "bob" surfaces
				// the 3 Bob Chen rows as a "Close match" cluster.
				let closeMatch = required.length > 0;
				for (const tok of required) {
					const leafHit = fuzzyScore(tok, c.label);
					const pathHit = Math.max(
						0,
						...e.path.map((p) => fuzzyScore(tok, p.label))
					);
					if (!(leafHit > 0 && leafHit >= pathHit)) {
						closeMatch = false;
						break;
					}
				}
				return decorate(e, total, closeMatch);
			})
			.filter((e) => e._score > 0)
			.sort((a, b) => b._score - a._score);
	});

	type Section = { name: string; items: ScoredCommand[]; startIndex: number };

	const CLOSE_MATCH_KEY = 'Close match';
	const sections = $derived.by<Section[]>(() => {
		const buckets = new Map<string, ScoredCommand[]>();
		for (const c of scored) {
			const key = c._closeMatch
				? CLOSE_MATCH_KEY
				: c.group ??
					(c._path.length > 0
						? c._path.map((p) => p.label).join(' ')
						: path.length > 0
							? path.map((p) => p.label).join(' ')
							: 'Other');
			const list = buckets.get(key);
			if (list) list.push(c);
			else buckets.set(key, [c]);
		}
		// Close-match section always renders first.
		const ordered: [string, ScoredCommand[]][] = [];
		const close = buckets.get(CLOSE_MATCH_KEY);
		if (close) ordered.push([CLOSE_MATCH_KEY, close]);
		for (const [name, items] of buckets) {
			if (name === CLOSE_MATCH_KEY) continue;
			ordered.push([name, items]);
		}
		const out: Section[] = [];
		let cursor = 0;
		for (const [name, items] of ordered) {
			out.push({ name, items, startIndex: cursor });
			cursor += items.length;
		}
		return out;
	});

	const flat = $derived(scored);

	$effect(() => {
		if (activeIndex > flat.length - 1) activeIndex = Math.max(0, flat.length - 1);
	});

	// As the user types (or clears) the query, snap the highlight back to
	// the top result — without this the previous activeIndex sticks even as
	// the result list reshuffles underneath it. Also scroll the results
	// container to the top so the new top result is in view.
	$effect(() => {
		void query;
		activeIndex = 0;
		if (resultsEl) resultsEl.scrollTo({ top: 0, behavior: 'smooth' });
	});

	$effect(() => {
		if (open) {
			query = '';
			activeIndex = 0;
			loadingId = null;
			indicatorReady = false;
			path = [];
			prevDepth = -1;
			childrenCache = new Map();
			loadingParents = new Set();
			lockScroll();
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			unlockScroll();
		}
	});

	function close() {
		open = false;
	}

	/** Jump to a crumb level (-1 = root, 0..path.length-1 = a path entry).
	 *  After the level resolves, snap selection back to the parent we
	 *  popped from so the row that sent us deeper stays visually in focus. */
	async function jumpToCrumb(level: number) {
		if (level >= path.length - 1) return;
		const fromId = path[level + 1].id;
		path = level < 0 ? [] : path.slice(0, level + 1);
		query = '';
		activeIndex = 0;
		inputEl?.focus();
		await tick();
		const idx = levelCommands.findIndex((c) => c.id === fromId);
		if (idx >= 0) {
			activeIndex = idx;
			scrollActiveIntoView();
		}
	}

	async function popLevel() {
		if (path.length === 0) {
			close();
			return;
		}
		const fromId = path[path.length - 1].id;
		path = path.slice(0, -1);
		query = '';
		activeIndex = 0;
		// After the level resolves, snap selection back to the parent we
		// just popped from.
		await tick();
		const idx = levelCommands.findIndex((c) => c.id === fromId);
		if (idx >= 0) {
			activeIndex = idx;
			scrollActiveIntoView();
		}
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
			class:has-preview={!!flat[activeIndex]?.preview}
			transition:fly={{ y: -8, duration: 160 }}
			onkeydown={onKeydown}
		>
			<div class="cp-main">
			<div class="cp-search">
				<span class="cp-search-icon"><Icon name="Search" size={16} /></span>
				{#if path.length > 0}
					<div class="cp-crumbs">
						<button type="button" class="cp-crumb cp-crumb-root" onclick={() => jumpToCrumb(-1)}>
							<Icon name="House" size={12} />
						</button>
						{#each path as crumb, i (crumb.id)}
							<span class="cp-crumb-sep"><Icon name="ChevronRight" size={12} /></span>
							<button
								type="button"
								class="cp-crumb"
								class:current={i === path.length - 1}
								onclick={() => jumpToCrumb(i)}
							>{crumb.label}</button>
						{/each}
					</div>
				{/if}
				<div
					class="cp-input-stage"
					onclick={() => inputEl?.focus()}
					role="presentation"
				>
					<div bind:this={displayEl} class="cp-input-display" aria-hidden="true">
						{#if cleanQuery.length === 0 && !inputFocused}
							<span class="cp-input-placeholder">{placeholder}</span>
						{:else}
							{#each querySegments as seg, i (i)}
								{#if seg.chipIdx >= 0}
									{@const chipCmd = chainCommands[seg.chipIdx]}
									<span class="cp-input-chip" data-cp-seg={i}>
										{#if chipCmd?.image}
											<img class="cp-input-chip-image" src={chipCmd.image} alt="" />
										{:else if chipCmd?.icon}
											{@const cic = resolveIcon(chipCmd.icon)}
											<Icon {...cic} size={12} />
										{/if}<span class="cp-input-chip-text">{seg.text}</span>
									</span>
								{:else}
									<span class="cp-input-text" data-cp-seg={i}>{seg.text}</span>
								{/if}
							{/each}
						{/if}
						{#if inputFocused && caretH > 0}
							<span
								class="cp-input-caret"
								class:in-chip={caretInsideChip}
								class:busy={caretBusy}
								style:transform="translate({caretX}px, {caretY}px)"
								style:height="{caretH}px"
							></span>
						{/if}
					</div>
					<input
						bind:this={inputEl}
						value={query}
						class="cp-input"
						type="text"
						autocomplete="off"
						spellcheck="false"
						onfocus={() => {
							inputFocused = true;
							syncCaret();
						}}
						onblur={() => (inputFocused = false)}
						oninput={(e) => {
							const raw = (e.currentTarget as HTMLInputElement).value;
							query = raw.replace(/\s+/g, ' ').replace(/^\s+/, '');
							syncCaret();
						}}
						onkeydown={(e) => {
							// Backspace at a chip-gap whitespace deletes both the
							// space and the char before it — one keystroke = one
							// visible deletion (whitespace is invisible between
							// chips, so a plain backspace would feel like a no-op).
							if (
								e.key === 'Backspace' &&
								inputEl &&
								inputEl.selectionStart === inputEl.selectionEnd &&
								(inputEl.selectionStart ?? 0) >= 2
							) {
								const pos = inputEl.selectionStart!;
								const prev = query[pos - 1];
								const beforePrev = query[pos - 2];
								const after = query[pos];
								if (
									/\s/.test(prev) &&
									beforePrev !== undefined &&
									!/\s/.test(beforePrev) &&
									(after === undefined || !/\s/.test(after))
								) {
									e.preventDefault();
									const next = query.slice(0, pos - 2) + query.slice(pos);
									query = next;
									requestAnimationFrame(() => {
										if (!inputEl) return;
										inputEl.setSelectionRange(pos - 2, pos - 2);
										syncCaret();
									});
									return;
								}
							}
							// Snap caret past whitespace runs so the gap between
							// two pills only costs one keystroke each direction.
							const dir =
								e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
							requestAnimationFrame(() => {
								if (!inputEl) return;
								let pos = inputEl.selectionStart ?? 0;
								if (dir === -1) {
									while (pos > 0 && /\s/.test(query[pos - 1])) pos--;
								} else if (dir === 1) {
									while (pos < query.length && /\s/.test(query[pos])) pos++;
								}
								if (pos !== inputEl.selectionStart) {
									inputEl.setSelectionRange(pos, pos);
								}
								syncCaret();
							});
						}}
						onclick={syncCaret}
						onselect={syncCaret}
					/>
				</div>
				{#if loadingParents.size > 0}
					<span class="cp-search-busy" title="Loading more matches…">
						<Spinner size={12} />
					</span>
				{/if}
				<Kbd size="sm">esc</Kbd>
			</div>

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
						{#if section.name !== CLOSE_MATCH_KEY && (sections.length > 1 || section.name !== 'Other')}
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
									<span class="cp-item-label">{cmd.label}</span>
									{#if cmd.description}
										<span class="cp-item-desc">{cmd.description}</span>
									{/if}
								</span>
								{#if cmd._path.length > 0}
									<span class="cp-item-path">
										{#each cmd._path as crumb, i (crumb.id)}
											{#if i > 0}
												<span class="cp-item-crumb-sep"><Icon name="ChevronRight" size={11} /></span>
											{/if}
											<span class="cp-item-crumb">
												{#if crumb.icon}
													{@const pic = resolveIcon(crumb.icon)}
													<Icon {...pic} size={11} />
												{/if}
												{crumb.label}
											</span>
										{/each}
									</span>
								{/if}
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
			{#if flat[activeIndex]?.preview}
				{@const activeCmd = flat[activeIndex]!}
				{@const previewSnippet = activeCmd.preview!}
				<div
					class="cp-preview"
					transition:fly={{ x: 24, duration: 220, opacity: 0, easing: quartOut }}
				>
					<Card
						title={activeCmd.label}
						icon={activeCmd.icon}
						class="cp-preview-card"
						footer={activeCmd.description ? previewFooter : undefined}
					>
						{#key activeCmd._keyId}
							<div class="cp-preview-content" in:fade={{ duration: 120 }}>
								{@render previewSnippet(activeCmd)}
							</div>
						{/key}
					</Card>
					{#snippet previewFooter()}
						<div class="cp-preview-desc">{activeCmd.description}</div>
					{/snippet}
				</div>
			{/if}
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
		color: var(--glow-fg, #fff);
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		transition: max-width var(--glow-dur-base) cubic-bezier(0.22, 1, 0.36, 1);

		&.has-preview {
			max-width: 1056px; // 640 + 0.75rem gap + 400 preview
		}
	}

	%cp-floating {
		background: var(--glow-bg-surface, #1a1a1a);
		border: 1px solid rgba($fg, 0.12);
		border-radius: $radius;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
		overflow: hidden;
	}

	.cp-main {
		@extend %cp-floating;
		flex: 0 0 640px;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.cp-preview {
		flex: 0 0 400px;
		min-width: 0;
		max-height: 60vh;
		display: flex;
		flex-direction: column;

		:global(.card.cp-preview-card) {
			flex: 1 1 auto;
			min-height: 0;
		}

		:global(.card.cp-preview-card > .card-header) {
			min-height: 3rem;
			box-sizing: border-box;
		}

		:global(.card.cp-preview-card > .card-body) {
			overflow-y: auto;
		}
	}

	.cp-preview-desc {
		font-size: 0.8rem;
		color: rgba($fg, 0.65);
		line-height: 1.4;
	}

	.cp-search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.85rem;
		min-height: 3rem;
		box-sizing: border-box;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid var(--glow-border-color);
	}

	.cp-search-icon {
		display: inline-flex;
		opacity: 0.6;
	}

	.cp-search-busy {
		display: inline-flex;
		align-items: center;
		opacity: 0.65;
	}

	.cp-input-stage {
		flex: 1 1 auto;
		min-width: 0;
		position: relative;
		display: flex;
		align-items: center;
		min-height: 1.5rem;
		cursor: text;
	}

	.cp-input-display {
		position: relative;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.95rem;
		min-width: 0;
		min-height: 1.5rem;
		white-space: pre;
	}

	.cp-input-chip-text {
		// Trim visual whitespace inside chips without changing the underlying
		// character count (we still need offsets for caret measurement).
		white-space: pre;
	}

	.cp-input-placeholder {
		color: rgba($fg, 0.45);
	}

	.cp-input-text {
		color: var(--glow-fg);
	}

	.cp-input-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
		font-size: 0.8rem;
		font-weight: 500;
		line-height: 1;
	}

	.cp-input-chip-image {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		object-fit: cover;
	}

	.cp-input-caret {
		position: absolute;
		top: 0;
		left: 0;
		width: 1.5px;
		background: var(--glow-fg);
		pointer-events: none;
		animation: cp-caret-blink 1s steps(1) infinite;
		will-change: transform;

		&.busy {
			animation: none;
			opacity: 1;
		}
	}

	.cp-input-caret.in-chip {
		background: var(--glow-primary);
	}

	@keyframes cp-caret-blink {
		50% {
			opacity: 0;
		}
	}

	.cp-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		background: transparent;
		border: none;
		outline: none;
		font: inherit;
		color: transparent;
		caret-color: transparent;
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
		gap: 0;
	}

	.cp-item-label {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.cp-item-path {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
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
		line-height: 1.2;
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
