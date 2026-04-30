/**
 * Reactive controller for `<Modal>` and `<Drawer>`.
 *
 * Replaces the ref-based pattern:
 *   ```
 *   let m: Modal;
 *   <Button onclick={() => m.open()}>...</Button>
 *   <Modal bind:this={m}>...</Modal>
 *   ```
 * with a runed primitive:
 *   ```
 *   const m = useModal();
 *   <Button onclick={m.show}>...</Button>
 *   <Modal bind:open={m.open}>...</Modal>
 *   ```
 *
 * `<Drawer>` shares the same `open` shape, so `useDrawer` is an alias.
 */
export class ModalController {
	#open = $state(false);

	constructor(initial = false) {
		this.#open = initial;
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.toggle = this.toggle.bind(this);
	}

	get open(): boolean {
		return this.#open;
	}

	set open(value: boolean) {
		this.#open = value;
	}

	show(): void {
		this.#open = true;
	}

	hide(): void {
		this.#open = false;
	}

	toggle(): void {
		this.#open = !this.#open;
	}
}

export function useModal(initial = false): ModalController {
	return new ModalController(initial);
}

export const useDrawer = useModal;
