<script lang="ts">
	import Toast from './Toast.svelte';
	import { toasts, dismissToast } from './toast.svelte.js';

	type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

	type Props = {
		position?: Position;
	};

	let { position = 'top-right' }: Props = $props();
</script>

<div class="toast-container {position}">
	{#each toasts as toast (toast.id)}
		<Toast
			variant={toast.variant}
			label={toast.label}
			onDismiss={() => dismissToast(toast.id)}
		/>
	{/each}
</div>

<style>.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  max-width: 400px;
  pointer-events: none;
}
.toast-container > :global(*) {
  pointer-events: auto;
}
.toast-container.top-right {
  top: 1em;
  right: 1em;
}
.toast-container.top-left {
  top: 1em;
  left: 1em;
}
.toast-container.bottom-right {
  bottom: 1em;
  right: 1em;
}
.toast-container.bottom-left {
  bottom: 1em;
  left: 1em;
}
.toast-container.top-center {
  top: 1em;
  left: 50%;
  transform: translateX(-50%);
}
.toast-container.bottom-center {
  bottom: 1em;
  left: 50%;
  transform: translateX(-50%);
}</style>
