/**
 * Context shared between <Field> and the <Input> (or any control) it wraps.
 *
 * Field owns layout (`row` or `stack`) — Inputs do not influence it. Field
 * also owns the label and the error state; nested Inputs read both to style
 * themselves and to hand the right element id to the browser's label
 * association.
 *
 * `setControlType` is informational: Field uses it to know whether the wrapped
 * control is non-native (select / multiselect / radio) so a label-click can
 * synthesise a click to open the popover. It does not drive layout.
 */

export const FIELD_CONTEXT_KEY = Symbol('glow:field');

export type FieldLayout = 'horizontal' | 'vertical';
export type FieldTier = 'primary' | 'secondary' | 'advanced';

export interface FieldContext {
	isInField: true;
	setControlType: (type: string) => void;
	/** Reactive error message owned by the parent Field. Inputs read this to style themselves invalid. */
	getError: () => string | undefined;
	/**
	 * The DOM id Field's <label for=...> points at. Inputs nested inside Field
	 * should apply this id to their underlying control element so clicking the
	 * label focuses the right element.
	 */
	getControlId: () => string;
}
