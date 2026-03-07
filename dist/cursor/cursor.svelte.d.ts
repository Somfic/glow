export type CursorState = 'default' | 'pointer' | 'copy' | 'text' | 'tooltip' | 'checkbox' | 'checkbox-checked' | 'toggle' | 'toggle-checked' | 'selecting';
type CursorStore = {
    x: number;
    y: number;
    state: CursorState;
    visible: boolean;
    content: string | null;
    icon: string | null;
    iconName: string | null;
    pressed: boolean;
    loading: boolean;
    selecting: boolean;
    selectionHeight: number;
    variant: string | null;
    isLink: boolean;
    linkWidth: number;
};
export type CursorConfig = {
    state?: CursorState;
    content?: string;
    icon?: string;
    iconName?: string;
    variant?: string;
    onHover?: () => void;
    onClick?: () => void;
};
export declare function cursor(node: HTMLElement, config?: CursorConfig): {
    update(newConfig: CursorConfig): void;
    destroy(): void;
};
export declare function getCursorState(): CursorStore;
export declare function updateCursorPosition(x: number, y: number): void;
export declare function setCursorState(state: CursorState, content?: string | null, icon?: string | null, iconName?: string | null, variant?: string | null, isLink?: boolean, linkWidth?: number): void;
export declare function setCursorVisible(visible: boolean): void;
export declare function setCursorContent(content: string | null): void;
export declare function setCursorPressed(pressed: boolean): void;
export declare function setCursorLoading(loading: boolean): void;
export declare function setCursorSelecting(selecting: boolean, height?: number): void;
export {};
