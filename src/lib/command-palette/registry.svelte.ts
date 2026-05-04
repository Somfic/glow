import { untrack } from 'svelte';
import type { Command } from './types.js';

/**
 * Reactive registry for command-palette entries. Mirrors the controller
 * pattern used by Modal/Drawer (a class with `$state` + a default singleton).
 *
 * Modules can register commands at any time; `register` returns an
 * unregister thunk so it composes cleanly inside `$effect`:
 *
 * ```ts
 * $effect(() => commands.register({ id: 'app.save', label: 'Save', perform: save }));
 * ```
 */
export class CommandRegistry {
	#commands = $state<Command[]>([]);

	get commands(): Command[] {
		return this.#commands;
	}

	/** Register a command. Returns an unregister thunk. */
	register = (cmd: Command): (() => void) => {
		// Reads of `#commands` here must not subscribe the caller's effect —
		// otherwise a `$effect` that calls `register` would read-and-write the
		// same state and Svelte would flag effect_update_depth_exceeded.
		untrack(() => {
			const current = this.#commands;
			const i = current.findIndex((c) => c?.id === cmd.id);
			if (i >= 0) {
				const next = current.slice();
				next[i] = cmd;
				this.#commands = next;
			} else {
				this.#commands = [...current, cmd];
			}
		});
		return () => this.unregister(cmd.id);
	};

	/** Register many commands. Returns a single unregister thunk for all of them. */
	registerMany = (cmds: Command[]): (() => void) => {
		for (const c of cmds) this.register(c);
		const ids = cmds.map((c) => c.id);
		return () => {
			untrack(() => {
				this.#commands = this.#commands.filter((c) => c && !ids.includes(c.id));
			});
		};
	};

	unregister = (id: string): void => {
		untrack(() => {
			this.#commands = this.#commands.filter((c) => c?.id !== id);
		});
	};

	/** Commands currently passing their `when()` predicate (or with none set). */
	visible = (): Command[] =>
		this.#commands.filter((c) => c && (!c.when || c.when()));
}

export function useCommandRegistry(): CommandRegistry {
	return new CommandRegistry();
}

/** App-wide default registry. Most consumers should just import this. */
export const commands = new CommandRegistry();
