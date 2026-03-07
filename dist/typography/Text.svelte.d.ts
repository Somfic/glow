import type { Snippet } from 'svelte';
type $$ComponentProps = {
    as?: 'p' | 'span' | 'div';
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    variant?: 'primary' | 'secondary' | 'muted';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
    align?: 'left' | 'center' | 'right';
    children: Snippet;
};
declare const Text: import("svelte").Component<$$ComponentProps, {}, "">;
type Text = ReturnType<typeof Text>;
export default Text;
