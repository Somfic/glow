<script lang="ts">
	import Icon from '$lib/icon/Icon.svelte';
	import type { IconName } from '$lib/icon/types';

	type BaseInputProps<T> = {
		onChange?: (value: T) => void;
	};

	type TextInputProps = BaseInputProps<string> & {
		type: 'text';
		placeholder?: string;
		icon?: IconName;
	};

	let { type, onChange, placeholder, icon }: TextInputProps = $props();
</script>

{#if type === 'text'}
	<div class="input text-input">
		{#if icon}
			<Icon name={icon} size={16} />
		{/if}
		<input
			type="text"
			{placeholder}
			oninput={(e) => onChange?.((e.target as HTMLInputElement).value)}
		/>
	</div>
{/if}

<style lang="scss">
	@use '../style/theme.scss' as *;

	.input {
		font-size: 1rem;
		border: $border;
		border-radius: $radius;
		background-color: $bg-surface-element;
		padding: 0.5em 1em;

		&:focus {
			outline: none;
			border-color: $primary;
			box-shadow: 0 0 0 2px rgba($primary, 0.3);
		}

		input {
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			width: 100%;

			&:focus {
				outline: none;
			}
		}
	}

	.text-input {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;

		svg {
			color: $fg;
		}
	}
</style>
