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
	selectionHeight: 20
});

// Cursor action configuration
export type CursorConfig = {
	state?: CursorState;
	content?: string;
	icon?: string;
	iconName?: string; // Icon component name
	onHover?: () => void;
	onClick?: () => void;
};

export function cursor(node: HTMLElement, config: CursorConfig = {}) {
	const { state = 'pointer', content, icon, iconName, onHover, onClick } = config;

	// Mark element as having explicit cursor control
	node.setAttribute('data-cursor-controlled', 'true');

	function handleMouseEnter() {
		cursorState.state = state;
		cursorState.content = content || null;
		cursorState.icon = icon || null;
		cursorState.iconName = iconName || null;
		onHover?.();
	}

	function handleMouseLeave() {
		cursorState.state = 'default';
		cursorState.content = null;
		cursorState.icon = null;
		cursorState.iconName = null;
	}

	function handleClick() {
		onClick?.();
	}

	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseLeave);
	if (onClick) node.addEventListener('click', handleClick);

	return {
		update(newConfig: CursorConfig) {
			const { state: newState = 'pointer', onHover: newOnHover, onClick: newOnClick } = newConfig;
			// Update handlers if needed
		},
		destroy() {
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseLeave);
			if (onClick) node.removeEventListener('click', handleClick);
			node.removeAttribute('data-cursor-controlled');
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
	iconName?: string | null
) {
	cursorState.state = state;
	cursorState.content = content || null;
	cursorState.icon = icon || null;
	cursorState.iconName = iconName || null;
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
