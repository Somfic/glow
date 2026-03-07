import type { TooltipPosition } from './tooltip.svelte.js';
type $$ComponentProps = {
    content: string;
    x?: number;
    y?: number;
    position?: TooltipPosition;
};
declare const Tooltip: import("svelte").Component<$$ComponentProps, {}, "">;
type Tooltip = ReturnType<typeof Tooltip>;
export default Tooltip;
