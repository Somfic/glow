import { fuzzyScore } from '../input/search-utils.js';
import type { CommandRegistry } from './registry.svelte.js';
import type { Command } from './types.js';

export type ScoredCommand = Command & {
	_score: number;
	/** Ancestor path for composed (cross-level) entries; empty for normal level rows. */
	_path: Command[];
	/** Stable key — embeds the path so the same leaf at different paths doesn't collide. */
	_keyId: string;
	/** True when the query targets the leaf itself (rather than a parent or a more
	 *  general field). Bubbles these rows to a top "Close match" group. */
	_closeMatch: boolean;
};

export type Section = { name: string; items: ScoredCommand[]; startIndex: number };

export type UseCommandListOptions = {
	/** Reactive getter for the registry — wrapped so the engine sees prop updates. */
	registry: () => CommandRegistry;
	/** Reactive getter for the current query string. The engine never writes it. */
	query: () => string;
	/** Optional reactive getter for an externally-controlled drill-in path. When
	 *  provided, the engine uses it instead of its internal path state, and
	 *  `pushLevel`/`popLevel`/`jumpToCrumb` become no-ops. Useful for popover hosts
	 *  that derive the current scope from their own input parsing (e.g. once the
	 *  user has typed `gh repo `, scope into [gh, repo] and only show its children). */
	path?: () => Command[];
	/** When false, drill-in is disabled. `pushLevel` is a no-op and `runActive` on a
	 *  command with `children` emits `onSelect` instead of drilling. Used by the
	 *  inline popover, where the host owns the input and orchestrates any drill. */
	enableDrillIn?: boolean;
	/** Fired when a leaf command (or any command in flat-mode) is chosen. The host
	 *  decides what to do — invoke `cmd.perform`, rewrite its input buffer, etc. */
	onSelect?: (cmd: ScoredCommand) => void;
	/** Fired when the engine wants to close — Escape at top level, or popLevel
	 *  when the path is already empty. */
	onClose?: () => void;
};

export type UseCommandList = {
	readonly flat: ScoredCommand[];
	readonly sections: Section[];
	readonly path: Command[];
	readonly levelCommands: Command[];
	readonly loadingChildren: boolean;
	readonly loadingParents: Set<string>;
	readonly empty: boolean;
	activeIndex: number;
	pushLevel(cmd: Command): void;
	popLevel(): Command | null;
	jumpToCrumb(level: number): Command | null;
	handleKey(e: KeyboardEvent): boolean;
	runActive(): void;
	reset(): void;
};

export const CLOSE_MATCH_KEY = 'Close match';

const STOP_WORDS_SET = new Set([
	'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
	'with', 'at', 'by', 'is', 'it'
]);

export function useCommandList(opts: UseCommandListOptions): UseCommandList {
	const enableDrillIn = opts.enableDrillIn ?? true;

	let activeIndex = $state(0);
	let internalPath = $state<Command[]>([]);
	const path = $derived<Command[]>(opts.path ? opts.path() : internalPath);
	let levelCommands = $state<Command[]>([]);
	let loadingChildren = $state(false);
	/** Memoized async-children results keyed by parent id, for cross-level search. */
	let childrenCache = $state<Map<string, Command[]>>(new Map());
	/** Ids of async-children parents currently being resolved. */
	let loadingParents = $state<Set<string>>(new Set());
	/** When set, the next levelCommands resolution snaps activeIndex to this id —
	 *  used to keep selection on the parent we just popped out of. */
	let pendingSnapToId: string | null = null;

	const cleanQuery = $derived(opts.query().replace(/\s+/g, ' ').trim());

	function visibleAt(level: Command[]): Command[] {
		return level.filter((c) => !c.when || c.when());
	}

	// Resolve the current level whenever path or registry contents change.
	// Note: this runs even when `enableDrillIn` is false — the path may be
	// host-controlled (via `opts.path`), in which case we still need to surface
	// the deepest scope's children.
	$effect(() => {
		const parent = path[path.length - 1];
		if (!parent) {
			levelCommands = visibleAt(opts.registry().commands);
			loadingChildren = false;
			return;
		}
		const kids = parent.children;
		if (!kids) {
			levelCommands = [];
			loadingChildren = false;
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
				.catch((err) => console.error('[useCommandList] children failed:', err))
				.finally(() => {
					loadingChildren = false;
				});
		}
	});

	// After the level resolves, snap active selection to the popped parent (if any).
	$effect(() => {
		void levelCommands;
		if (!pendingSnapToId) return;
		const idx = levelCommands.findIndex((c) => c.id === pendingSnapToId);
		if (idx >= 0) {
			activeIndex = idx;
			pendingSnapToId = null;
		}
	});

	function flattenTree(
		cmds: Command[],
		pathSoFar: Command[] = []
	): { command: Command; path: Command[] }[] {
		const out: { command: Command; path: Command[] }[] = [];
		for (const c of cmds) {
			if (c.when && !c.when()) continue;
			// Emit the command itself if it lives below the root — both leaves and
			// intermediate parents get a composed entry. Lets `gh rep` surface
			// `gh > repo` as a selectable result (popover host inserts `gh repo `;
			// modal drills into it). Top-level commands are already in `base`, so
			// we don't double-emit them here.
			if (pathSoFar.length > 0) {
				out.push({ command: c, path: pathSoFar });
			}
			if (c.children) {
				const kids = Array.isArray(c.children)
					? c.children
					: childrenCache.get(c.id);
				if (kids) out.push(...flattenTree(kids, [...pathSoFar, c]));
			}
		}
		return out;
	}

	// Prefetch every async-children branch once the user starts typing at the root,
	// so their leaves can participate in the cross-level fuzzy search. Each branch
	// is fetched at most once per session (memoized in childrenCache).
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
						console.error('[useCommandList] composed children failed:', err)
					)
					.finally(() => {
						const s = new Set(loadingParents);
						s.delete(id);
						loadingParents = s;
					});
			}
		};
		walk(opts.registry().commands);
	});

	const scored = $derived.by<ScoredCommand[]>(() => {
		// Base entries inherit the engine's path as their `_path` — for the modal
		// at root this is `[]`; for a scoped popover it's the host-supplied path,
		// so consumers can reconstruct the full canonical chain on select.
		const basePath = path.slice();
		const base = levelCommands.map((c) => ({ command: c, path: basePath }));
		// Cross-level composed entries only at the root with an active query.
		// Independent of `enableDrillIn` — drill-in is about navigation, composed
		// search is about discovery, and the popover wants the latter without the former.
		const composed =
			path.length === 0 && cleanQuery
				? flattenTree(opts.registry().commands)
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
		const allTokens = q.split(/\s+/).filter(Boolean);
		const meaningful = allTokens.filter((t) => !STOP_WORDS_SET.has(t.toLowerCase()));
		const required = meaningful.length > 0 ? meaningful : allTokens;
		return all
			.map((e) => {
				const c = e.command;
				// Honor a per-command custom score function — lets external
				// completion sources (carapace, language servers, …) override the
				// engine's fuzzy ranking. closeMatch is skipped here since the
				// signal is custom-defined.
				if (typeof c.score === 'function') {
					return decorate(e, c.score(cleanQuery), false);
				}
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
				for (const tok of allTokens) {
					if (required.includes(tok)) continue;
					total += scoreToken(tok) * 0.2;
				}
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
	const empty = $derived(flat.length === 0);

	// Clamp activeIndex to the current result set.
	$effect(() => {
		if (activeIndex > flat.length - 1) activeIndex = Math.max(0, flat.length - 1);
	});

	// Snap selection to the top result whenever the query changes — without this
	// the previous activeIndex sticks even as the result list reshuffles.
	$effect(() => {
		void opts.query();
		activeIndex = 0;
	});

	function pushLevel(cmd: Command): void {
		if (opts.path) return;
		if (!enableDrillIn || !cmd.children) return;
		internalPath = [...internalPath, cmd];
		activeIndex = 0;
	}

	function popLevel(): Command | null {
		if (opts.path) return null;
		if (internalPath.length === 0) {
			opts.onClose?.();
			return null;
		}
		const popped = internalPath[internalPath.length - 1];
		pendingSnapToId = popped.id;
		internalPath = internalPath.slice(0, -1);
		activeIndex = 0;
		return popped;
	}

	function jumpToCrumb(level: number): Command | null {
		if (opts.path) return null;
		if (level >= internalPath.length - 1) return null;
		const fromCmd = internalPath[level + 1];
		pendingSnapToId = fromCmd.id;
		internalPath = level < 0 ? [] : internalPath.slice(0, level + 1);
		activeIndex = 0;
		return fromCmd;
	}

	function runActive(): void {
		const cmd = flat[activeIndex];
		if (!cmd) return;
		if (cmd.children && enableDrillIn) {
			pushLevel(cmd);
			return;
		}
		opts.onSelect?.(cmd);
	}

	function handleKey(e: KeyboardEvent): boolean {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (flat.length === 0) return true;
			activeIndex = (activeIndex + 1) % flat.length;
			return true;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (flat.length === 0) return true;
			activeIndex = (activeIndex - 1 + flat.length) % flat.length;
			return true;
		}
		if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();
			runActive();
			return true;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			if (path.length > 0 && enableDrillIn) {
				popLevel();
			} else {
				opts.onClose?.();
			}
			return true;
		}
		if (
			e.key === 'Backspace' &&
			opts.query() === '' &&
			path.length > 0 &&
			enableDrillIn
		) {
			e.preventDefault();
			popLevel();
			return true;
		}
		if (e.key === 'Home') {
			e.preventDefault();
			activeIndex = 0;
			return true;
		}
		if (e.key === 'End') {
			e.preventDefault();
			activeIndex = flat.length - 1;
			return true;
		}
		return false;
	}

	function reset(): void {
		activeIndex = 0;
		internalPath = [];
		childrenCache = new Map();
		loadingParents = new Set();
		pendingSnapToId = null;
	}

	return {
		get flat() {
			return flat;
		},
		get sections() {
			return sections;
		},
		get path() {
			return path;
		},
		get levelCommands() {
			return levelCommands;
		},
		get loadingChildren() {
			return loadingChildren;
		},
		get loadingParents() {
			return loadingParents;
		},
		get empty() {
			return empty;
		},
		get activeIndex() {
			return activeIndex;
		},
		set activeIndex(v: number) {
			activeIndex = v;
		},
		pushLevel,
		popLevel,
		jumpToCrumb,
		handleKey,
		runActive,
		reset
	};
}
