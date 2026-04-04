<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Toast from './Toast.svelte';
	import { toasts, dismissToast } from './toast.svelte.js';

	type Position =
		| 'top-right'
		| 'top-left'
		| 'bottom-right'
		| 'bottom-left'
		| 'top-center'
		| 'bottom-center';

	type Props = {
		position?: Position;
	};

	let { position = 'top-right' }: Props = $props();
</script>

<div class="toast-container {position}">
	{#each toasts as t (t.id)}
		<div
			class="toast-wrapper"
			in:fly={{ x: 80, duration: 300, easing: (t) => 1 - Math.pow(1 - t, 3) }}
			out:fade={{ duration: 150 }}
			animate:flip={{ duration: 200 }}
		>
			<Toast variant={t.variant} label={t.label} onDismiss={() => dismissToast(t.id)} />
		</div>
	{/each}
</div>

<style lang="scss">
	.toast-container {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 380px;
		min-width: 280px;
		pointer-events: none;

		> :global(*) {
			pointer-events: auto;
		}

		&.top-right {
			top: 1rem;
			right: 1rem;
		}

		&.top-left {
			top: 1rem;
			left: 1rem;
		}

		&.bottom-right {
			bottom: 1rem;
			right: 1rem;
		}

		&.bottom-left {
			bottom: 1rem;
			left: 1rem;
		}

		&.top-center {
			top: 1rem;
			left: 50%;
			transform: translateX(-50%);
		}

		&.bottom-center {
			bottom: 1rem;
			left: 50%;
			transform: translateX(-50%);
		}
	}
</style>
