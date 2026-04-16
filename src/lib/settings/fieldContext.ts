/**
 * Context shared between <Field> and the <Input> (or any control) it wraps.
 *
 * When an Input renders inside a Field it:
 *   - calls `setControlType(type)` so Field can pick the right layout in `auto`
 *     mode (text-like → row, textarea/multiselect → stack, etc.);
 *   - reads `isInField` to suppress its own label, since Field owns labelling.
 */

export const FIELD_CONTEXT_KEY = Symbol('glow:field');

export type FieldLayout = 'auto' | 'row' | 'stack';
export type FieldTier = 'primary' | 'secondary' | 'advanced';

export interface FieldContext {
	isInField: true;
	setControlType: (type: string) => void;
}
