export type CursorState =
	| 'default'
	| 'pointer'
	| 'copy'
	| 'text'
	| 'tooltip'
	| 'checkbox'
	| 'checkbox-checked'
	| 'toggle'
	| 'toggle-checked'
	| 'selecting';

type CursorStore = {
	x: number;
	y: number;
	state: CursorState;
	visible: boolean;
	content: string | null;
	icon: string | null;
	iconName: string | null; // For Icon component
	pressed: boolean; // Mouse button pressed
	loading: boolean; // Loading state from buttons
	selecting: boolean; // User is selecting text
	selectionHeight: number; // Height for selection line
	variant: string | null; // Button variant (primary/secondary/ternary)
	isLink: boolean; // Is hovering a link (for horizontal line style)
	linkWidth: number; // Width of link text for horizontal line
};

// Global cursor state using Svelte 5 runes
let cursorState = $state<CursorStore>({
	x: 0,
	y: 0,
	state: 'default',
	visible: true,
	content: null,
	icon: null,
	iconName: null,
	pressed: false,
	loading: false,
	selecting: false,
	selectionHeight: 20,
	variant: null,
	isLink: false,
	linkWidth: 0
});

// Cursor action configuration
export type CursorConfig = {
	state?: CursorState;
	content?: string;
	icon?: string;
	iconName?: string; // Icon component name
	variant?: string; // Button variant (primary/secondary/ternary)
	onHover?: () => void;
	onClick?: () => void;
};

export function cursor(node: HTMLElement, config: CursorConfig = {}) {
	const { state = 'pointer', content, icon, iconName, variant, onHover, onClick } = config;

	// Mark element as having explicit cursor control and store config in data attributes
	// CursorProvider will read these attributes and handle the cursor state
	node.setAttribute('data-cursor-controlled', 'true');
	if (state) node.setAttribute('data-cursor-state', state);
	if (iconName) node.setAttribute('data-cursor-icon', iconName);
	if (content) node.setAttribute('data-cursor-content', content);
	if (variant) node.setAttribute('data-cursor-variant', variant);

	// Store callbacks in a map for CursorProvider to access
	if (onHover || onClick) {
		const callbacks = { onHover, onClick };
		(node as any).__cursorCallbacks = callbacks;
	}

	return {
		update(newConfig: CursorConfig) {
			const { state: newState = 'pointer', content: newContent, icon: newIcon, iconName: newIconName, variant: newVariant, onHover: newOnHover, onClick: newOnClick } = newConfig;
			if (newState) node.setAttribute('data-cursor-state', newState);
			if (newIconName) node.setAttribute('data-cursor-icon', newIconName);
			else node.removeAttribute('data-cursor-icon');
			if (newContent) node.setAttribute('data-cursor-content', newContent);
			else node.removeAttribute('data-cursor-content');
			if (newVariant) node.setAttribute('data-cursor-variant', newVariant);
			else node.removeAttribute('data-cursor-variant');

			if (newOnHover || newOnClick) {
				(node as any).__cursorCallbacks = { onHover: newOnHover, onClick: newOnClick };
			}
		},
		destroy() {
			node.removeAttribute('data-cursor-controlled');
			node.removeAttribute('data-cursor-state');
			node.removeAttribute('data-cursor-icon');
			node.removeAttribute('data-cursor-content');
			node.removeAttribute('data-cursor-variant');
			delete (node as any).__cursorCallbacks;
		}
	};
}

// Getters for reactive access
export function getCursorState() {
	return cursorState;
}

export function updateCursorPosition(x: number, y: number) {
	cursorState.x = x;
	cursorState.y = y;
}

export function setCursorState(
	state: CursorState,
	content?: string | null,
	icon?: string | null,
	iconName?: string | null,
	variant?: string | null,
	isLink?: boolean,
	linkWidth?: number
) {
	cursorState.state = state;
	cursorState.content = content || null;
	cursorState.icon = icon || null;
	cursorState.iconName = iconName || null;
	cursorState.variant = variant || null;
	cursorState.isLink = isLink || false;
	cursorState.linkWidth = linkWidth || 0;
}

export function setCursorVisible(visible: boolean) {
	cursorState.visible = visible;
}

export function setCursorContent(content: string | null) {
	cursorState.content = content;
}

export function setCursorPressed(pressed: boolean) {
	cursorState.pressed = pressed;
}

export function setCursorLoading(loading: boolean) {
	cursorState.loading = loading;
}

export function setCursorSelecting(selecting: boolean, height?: number) {
	cursorState.selecting = selecting;
	if (height !== undefined) {
		cursorState.selectionHeight = height;
	}
}
