export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipOptions = {
    content: string;
    position?: TooltipPosition;
    delay?: number;
    useCursor?: boolean;
};
export type TooltipParams = string | TooltipOptions;
export declare function tooltip(node: HTMLElement, params: TooltipParams): {
    update(newParams: TooltipParams): void;
    destroy(): void;
} | undefined;
