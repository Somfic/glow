import type { IconName } from '$lib/icon/Icon.svelte';

export type SelectOption = {
	value: string;
	label: string;
};

/** @deprecated Use SelectOption instead */
export type MultiSelectOption = SelectOption;

export type ComboboxOption = {
	value: string;
	label: string;
	icon?: IconName;
	image?: string;
	description?: string;
	groupType?: string;
};
