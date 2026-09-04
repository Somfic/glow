<script lang="ts">
	import Modal from '../modal/Modal.svelte';
	import Button from '../button/Button.svelte';
	import TextInput from '../input/TextInput.svelte';
	import Icon, { resolveIcon, type IconProp } from '../icon/Icon.svelte';
	import { dialogs, settleDialog } from './confirm.svelte.js';

	// The host is a singleton with no props: `<Root>` mounts one, and every
	// confirm()/alert()/prompt() call anywhere in the app queues onto it.
	const current = $derived(dialogs[0]);
	const options = $derived(current?.options ?? {});
	const isDanger = $derived(options.variant === 'danger');

	const icon = $derived<IconProp | undefined>(
		options.icon ?? (isDanger ? 'TriangleAlert' : undefined)
	);

	const title = $derived(
		options.title ?? (current?.kind === 'confirm' ? 'Are you sure?' : undefined)
	);
	const confirmLabel = $derived(options.confirmLabel ?? (current?.kind === 'alert' ? 'OK' : 'Confirm'));
	const cancelLabel = $derived(options.cancelLabel ?? 'Cancel');

	let open = $state(false);
	let value = $state('');
	let inputElement = $state<HTMLInputElement | null>(null);
	let footerElement = $state<HTMLElement | null>(null);
	let shownId = -1;

	const canAccept = $derived(
		current?.kind !== 'prompt' || !options.required || value.trim().length > 0
	);

	// One Modal instance serves the whole queue, so "a new dialog" is an id
	// change rather than a mount: reset the field and re-place focus on that,
	// not on `open` flipping.
	$effect(() => {
		if (!current) {
			open = false;
			shownId = -1;
			return;
		}
		if (current.id === shownId) return;

		shownId = current.id;
		value = current.options.value ?? '';
		// TextInput's `inputRef` only fires on mount, so a stale field from a
		// previous prompt would otherwise still look focusable to the block below.
		if (current.kind !== 'prompt') inputElement = null;
		open = true;

		// Modal autofocuses the first focusable in its container on open. That is
		// already the right target here — the prompt field, else the leading
		// (cancelling) footer button — but it only runs when Modal itself opens,
		// so place focus explicitly for the second and later dialogs in a queue.
		// Both use a 0ms timeout; this one is queued later and so wins.
		const id = setTimeout(() => {
			if (inputElement) inputElement.select();
			else footerElement?.querySelector('button')?.focus();
		}, 0);
		return () => clearTimeout(id);
	});

	function accept() {
		if (!current || !canAccept) return;
		if (current.kind === 'prompt') settleDialog(current.id, value);
		else settleDialog(current.id, current.kind === 'confirm' ? true : undefined);
	}

	function dismiss() {
		if (!current) return;
		settleDialog(current.id, current.dismissValue);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open || event.key !== 'Enter') return;
		// A focused button owns Enter — the browser activates it. Intercepting
		// would turn Enter-on-Cancel into a confirm, which is the one thing a
		// destructive dialog must never do. Escape is Modal's to handle.
		if ((event.target as HTMLElement | null)?.tagName === 'BUTTON') return;
		event.preventDefault();
		accept();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet footer()}
	<!-- The dismissing action comes first in the DOM as well as visually, so the
	     focus Modal places on open can never land on the destructive one. -->
	<div class="confirm-actions" bind:this={footerElement}>
		{#if current?.kind !== 'alert'}
			<Button label={cancelLabel} variant="secondary" onclick={dismiss} />
		{/if}
		<Button
			label={confirmLabel}
			variant={isDanger ? 'danger' : 'primary'}
			disabled={!canAccept}
			onclick={accept}
		/>
	</div>
{/snippet}

<Modal
	bind:open
	{title}
	size="small"
	showCloseButton={false}
	closeOnEscape
	closeOnBackdropClick
	onClose={dismiss}
	{footer}
>
	<div class="confirm-body" class:danger={isDanger}>
		{#if icon}
			<span class="confirm-icon"><Icon {...resolveIcon(icon)} size="1.25rem" /></span>
		{/if}
		<div class="confirm-content">
			{#if options.message}
				<p class="confirm-message">{options.message}</p>
			{/if}
			{#if current?.kind === 'prompt'}
				<TextInput
					bind:value
					placeholder={options.placeholder}
					inputRef={(el) => (inputElement = el)}
				/>
			{/if}
		</div>
	</div>
</Modal>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.confirm-body {
		display: flex;
		align-items: flex-start;
		gap: $space-md;
	}

	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: $space-md;
		min-width: 0;
		flex: 1 1 auto;
	}

	.confirm-message {
		margin: 0;
		color: $text-secondary;
		line-height: 1.55;
	}

	.confirm-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		color: var(--glow-fg);
		background: var(--glow-state-hover);
	}

	.danger .confirm-icon {
		color: var(--glow-color-danger);
		background: color-mix(in oklab, var(--glow-color-danger) 14%, transparent);
	}

	// Card only right-aligns its footer for `footerActions`, and this is a
	// `footer` snippet — so claim the row's width to line the buttons up with
	// every other dialog in the library.
	.confirm-actions {
		display: flex;
		flex: 1 1 auto;
		justify-content: flex-end;
		gap: $space-sm;
	}
</style>
