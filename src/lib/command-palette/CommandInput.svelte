<script lang="ts">
	import { fuzzyScore } from '../input/search-utils.js';
	import { commands as defaultRegistry, CommandRegistry } from './registry.svelte.js';
	import CommandPopover from './CommandPopover.svelte';
	import type { Command } from './types.js';
	import type { ScoredCommand } from './useCommandList.svelte.js';

	type Props = {
		/** Bindable input value. */
		value?: string;
		/** Tree-shaped registry the input completes against. Defaults to the global one. */
		registry?: CommandRegistry;
		placeholder?: string;
		/** Called on Enter when the input is committable (no missing required arg slots). */
		onSubmit?: (value: string) => void;
		/** Called on Enter when a required arg slot is empty — host typically toasts/warns. */
		onArgMissing?: (cmd: Command, slot: { type: string; name?: string }) => void;
		/** How to render an arg's display value. Default strips URL protocols/trailing slashes. */
		formatArg?: (text: string, type: string) => string;
	};

	let {
		value = $bindable(''),
		registry = defaultRegistry,
		placeholder,
		onSubmit,
		onArgMissing,
		formatArg = defaultFormatArg
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let focused = $state(false);
	let popoverRef = $state<{ handleKey: (e: KeyboardEvent) => boolean } | null>(null);
	let active = $state<ScoredCommand | undefined>(undefined);

	function defaultFormatArg(text: string, type: string): string {
		if (type === 'url') return text.replace(/^https?:\/\//, '').replace(/\/$/, '');
		return text;
	}

	/** Strict prefix match for resolving committed tokens to a scope path —
	 *  unambiguous matches only, so a stray token doesn't accidentally drill in. */
	function scopeMatch(token: string, c: Command): boolean {
		const tl = token.toLowerCase();
		const ll = c.label.toLowerCase();
		if (ll === tl) return true;
		if (ll.startsWith(tl)) return true;
		if (tl.startsWith(ll) && ll.length >= 2) return true;
		if (
			c.keywords?.some((k) => {
				const kl = k.toLowerCase();
				return kl === tl || kl.startsWith(tl) || (tl.startsWith(kl) && kl.length >= 2);
			})
		)
			return true;
		return false;
	}

	/** Walk committed tokens left-to-right, drilling into the registry tree. */
	function resolveScope(
		top: Command[],
		committed: string[]
	): { scope: Command[]; args: string[] } {
		let level = top;
		const scope: Command[] = [];
		for (let i = 0; i < committed.length; i++) {
			const tok = committed[i];
			const match = level.find((c) => scopeMatch(tok, c));
			if (!match) return { scope, args: committed.slice(i) };
			scope.push(match);
			if (!Array.isArray(match.children)) {
				return { scope, args: committed.slice(i + 1) };
			}
			level = match.children;
		}
		return { scope, args: [] };
	}

	/** Lenient bidirectional fuzzy match used when canonicalising the input on
	 *  select — handles `b → build`, `github → gh`, keyword aliases, etc. */
	function partMatches(token: string, part: Command): boolean {
		const tl = token.toLowerCase();
		const ll = part.label.toLowerCase();
		if (fuzzyScore(tl, ll) > 0 || fuzzyScore(ll, tl) > 0) return true;
		if (
			part.keywords?.some((k) => {
				const kl = k.toLowerCase();
				return fuzzyScore(tl, kl) > 0 || fuzzyScore(kl, tl) > 0;
			})
		)
			return true;
		return false;
	}

	type ParseInfo = {
		committed: string[];
		current: string;
		scope: Command[];
		args: string[];
	};

	function applyPickedPath(p: ParseInfo, picked: ScoredCommand): string {
		const fullPath = [...picked._path, picked as Command];
		const consumed: Command[] = [];
		const args: string[] = [];
		let pathIdx = 0;
		for (const tok of p.committed) {
			let matchedAt = -1;
			for (let j = pathIdx; j < fullPath.length; j++) {
				if (partMatches(tok, fullPath[j])) {
					matchedAt = j;
					break;
				}
			}
			if (matchedAt >= 0) {
				for (let k = pathIdx; k <= matchedAt; k++) consumed.push(fullPath[k]);
				pathIdx = matchedAt + 1;
			} else {
				args.push(tok);
			}
		}
		const remaining = fullPath.slice(pathIdx);
		const currentReplaced = remaining.length > 0;
		for (const r of remaining) consumed.push(r);
		const head = consumed.map((c) => c.label).join(' ');
		const argsStr = args.length ? ' ' + args.join(' ') : '';
		const currentStr = currentReplaced || !p.current ? '' : ' ' + p.current;
		return head + argsStr + currentStr + ' ';
	}

	const parse = $derived.by<ParseInfo>(() => {
		const trailingSpace = /\s$/.test(value);
		const all = value.trim().split(/\s+/).filter(Boolean);
		const committed = trailingSpace ? all : all.slice(0, -1);
		const current = trailingSpace ? '' : (all[all.length - 1] ?? '');
		const { scope, args } = resolveScope(registry.commands, committed);
		return { committed, current, scope, args };
	});

	/** Flat haystack of every label + keyword in the tree. Used to decide whether
	 *  a token "looks like" something the user is searching for vs. a positional
	 *  arg (URL, filename) when no scope has been resolved. */
	const haystack = $derived.by<string[]>(() => {
		const out: string[] = [];
		const walk = (cmds: Command[]) => {
			for (const c of cmds) {
				out.push(c.label.toLowerCase());
				if (c.keywords) for (const k of c.keywords) out.push(k.toLowerCase());
				if (Array.isArray(c.children)) walk(c.children);
			}
		};
		walk(registry.commands);
		return out;
	});

	function tokenHits(token: string): boolean {
		const t = token.toLowerCase();
		for (const h of haystack) if (fuzzyScore(t, h) > 0) return true;
		return false;
	}

	const query = $derived.by<string>(() => {
		if (parse.scope.length > 0) return parse.current;
		const tokens = value.trim().split(/\s+/).filter(Boolean);
		let start = 0;
		while (start < tokens.length && !tokenHits(tokens[start])) start++;
		let end = tokens.length;
		while (end > start && !tokenHits(tokens[end - 1])) end--;
		return tokens.slice(start, end).join(' ');
	});

	/** Open while focused with content AND the deepest scoped command still has
	 *  children to suggest. Once the user has bottomed out (e.g. typed a leaf
	 *  and hit space), nothing more to autocomplete — close. */
	const popoverOpen = $derived.by(() => {
		if (!focused) return false;
		if (value.trim().length === 0) return false;
		const deepest = parse.scope[parse.scope.length - 1];
		if (deepest && !Array.isArray(deepest.children)) return false;
		return true;
	});

	/** Ghost-text suffix shown in gray when the active suggestion's canonical
	 *  form is a clean prefix-extension of what the user typed. */
	const ghost = $derived.by<string>(() => {
		if (!popoverOpen || !active) return '';
		const canonical = applyPickedPath(parse, active);
		if (canonical === value) return '';
		if (canonical.toLowerCase().startsWith(value.toLowerCase())) {
			return canonical.slice(value.length);
		}
		return '';
	});

	type Seg =
		| { kind: 'text'; text: string }
		| { kind: 'arg'; text: string; type: string }
		| { kind: 'placeholder'; type: string; name?: string };

	const segments = $derived.by<Seg[]>(() => {
		let leaf: Command | undefined;
		let leafPath: Command[] = [];
		if (active) {
			leaf = active;
			leafPath = active._path;
		} else if (parse.scope.length > 0) {
			leaf = parse.scope[parse.scope.length - 1];
			leafPath = parse.scope.slice(0, -1);
		}
		if (!leaf) return [{ kind: 'text', text: value }];
		const argType = leaf.arg?.type;
		const fullPath = [...leafPath, leaf];
		const parts = value.match(/\S+|\s+/g) ?? [];
		const segs: Seg[] = [];
		let pathIdx = 0;
		let pathPartsMatched = 0;
		let argSeen = false;
		for (const part of parts) {
			if (/^\s+$/.test(part)) {
				segs.push({ kind: 'text', text: part });
				continue;
			}
			let matched = false;
			while (pathIdx < fullPath.length) {
				const isMatch = partMatches(part, fullPath[pathIdx]);
				pathIdx++;
				if (isMatch) {
					matched = true;
					pathPartsMatched++;
					break;
				}
			}
			if (!matched && argType) {
				segs.push({ kind: 'arg', text: part, type: argType });
				argSeen = true;
			} else {
				segs.push({ kind: 'text', text: part });
			}
		}
		if (
			!popoverOpen &&
			argType &&
			leaf.arg &&
			!leaf.arg.optional &&
			pathPartsMatched === fullPath.length &&
			!argSeen
		) {
			const endsInSpace = /\s$/.test(value);
			if (!endsInSpace) segs.push({ kind: 'text', text: ' ' });
			segs.push({ kind: 'placeholder', type: argType, name: leaf.arg.name });
		}
		return segs;
	});

	const needsArg = $derived(segments.some((s) => s.kind === 'placeholder'));

	/** Replace each token that resolved into the scope with its canonical label —
	 *  e.g. `gh rep clone abc` → `gh repo clone abc`. Args (tokens past the
	 *  resolved scope) are preserved verbatim. */
	function canonicalize(input: string, p: ParseInfo): string {
		if (p.scope.length === 0) return input;
		const tokens = input.match(/\S+|\s+/g) ?? [];
		const out: string[] = [];
		let scopeIdx = 0;
		for (const t of tokens) {
			if (/^\s+$/.test(t)) {
				out.push(t);
				continue;
			}
			if (scopeIdx < p.scope.length) {
				out.push(p.scope[scopeIdx].label);
				scopeIdx++;
			} else {
				out.push(t);
			}
		}
		return out.join('');
	}

	function onKeydown(e: KeyboardEvent) {
		if (popoverOpen && popoverRef?.handleKey(e)) return;
		if (e.key === 'Enter' && !popoverOpen) {
			// Tidy up the typed text into canonical labels first — let the user
			// see what they're committing before validation/submit.
			const canonical = canonicalize(value, parse);
			if (canonical !== value) value = canonical;
			if (needsArg) {
				const leaf = parse.scope[parse.scope.length - 1];
				if (leaf?.arg) onArgMissing?.(leaf, leaf.arg);
				return;
			}
			onSubmit?.(value);
		}
	}

	function onSelect(cmd: ScoredCommand) {
		value = applyPickedPath(parse, cmd);
		queueMicrotask(() => {
			if (!inputEl) return;
			inputEl.focus();
			const pos = value.length;
			inputEl.setSelectionRange(pos, pos);
		});
	}
</script>

<div class="ci-wrap">
	<input
		bind:this={inputEl}
		bind:value
		onkeydown={onKeydown}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
		placeholder={value ? undefined : placeholder}
		autocomplete="off"
		spellcheck="false"
		class="ci-input"
	/>
	<div class="ci-overlay" aria-hidden="true">
		{#each segments as seg, i (i)}
			{#if seg.kind === 'arg'}
				<span class="ci-arg-pill"
					><span class="ci-arg-type">{seg.type}</span>{formatArg(seg.text, seg.type)}</span
				>
			{:else if seg.kind === 'placeholder'}
				<span class="ci-arg-placeholder"
					><span class="ci-arg-type">{seg.type}</span>{seg.name ?? seg.type}</span
				>
			{:else}
				<span class="ci-text">{seg.text}</span>
			{/if}
		{/each}
		{#if ghost}<span class="ci-ghost">{ghost}</span>{/if}
	</div>
</div>

<CommandPopover
	bind:this={popoverRef}
	open={popoverOpen}
	{registry}
	{query}
	path={parse.scope}
	anchor={inputEl!}
	placement="bottom-start"
	emptyText="No matching completions"
	{onSelect}
	onClose={() => (focused = false)}
	onActiveChange={(cmd) => (active = cmd)}
/>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.ci-wrap {
		position: relative;
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.ci-input {
		position: relative;
		z-index: 2;
		width: 100%;
		border: none;
		background: transparent;
		color: transparent;
		caret-color: var(--glow-fg);
		font: inherit;
		letter-spacing: 0;
		text-indent: 0;
		padding: 0.25rem 0;
		outline: none;
	}

	.ci-input::selection {
		background: var(--glow-primary-soft);
		color: transparent;
	}

	.ci-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		pointer-events: none;
		font-family: inherit;
		font-size: inherit;
		white-space: pre;
		padding: 0.25rem 0;
		box-sizing: border-box;
		overflow: hidden;
		min-width: 0;
	}

	.ci-text {
		color: var(--glow-fg);
		white-space: pre;
	}

	.ci-arg-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.05rem 0.45rem 0.05rem 0.4rem;
		border-radius: 999px;
		background: var(--glow-primary-soft);
		color: var(--glow-primary);
		font-size: 0.85em;
		font-family: inherit;
		line-height: 1.4;
		white-space: nowrap;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ci-arg-type {
		font-size: 0.78em;
		font-weight: 600;
		opacity: 0.7;
		letter-spacing: 0.02em;
	}

	.ci-arg-type::after {
		content: ':';
		margin-right: 0.05rem;
	}

	.ci-arg-placeholder {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.05rem 0.45rem 0.05rem 0.4rem;
		border-radius: 999px;
		border: 1px dashed var(--glow-border-color);
		color: var(--glow-fg);
		opacity: 0.45;
		font-size: 0.85em;
		font-style: italic;
		font-family: inherit;
	}

	.ci-arg-placeholder .ci-arg-type {
		font-style: normal;
	}

	.ci-ghost {
		color: var(--glow-fg);
		opacity: 0.4;
		white-space: pre;
	}
</style>
