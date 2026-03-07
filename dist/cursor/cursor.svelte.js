// Global cursor state using Svelte 5 runes
let cursorState = $state({
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
export function cursor(node, config = {}) {
    const { state = 'pointer', content, icon, iconName, variant, onHover, onClick } = config;
    // Mark element as having explicit cursor control and store config in data attributes
    // CursorProvider will read these attributes and handle the cursor state
    node.setAttribute('data-cursor-controlled', 'true');
    if (state)
        node.setAttribute('data-cursor-state', state);
    if (iconName)
        node.setAttribute('data-cursor-icon', iconName);
    if (content)
        node.setAttribute('data-cursor-content', content);
    if (variant)
        node.setAttribute('data-cursor-variant', variant);
    // Store callbacks in a map for CursorProvider to access
    if (onHover || onClick) {
        const callbacks = { onHover, onClick };
        node.__cursorCallbacks = callbacks;
    }
    return {
        update(newConfig) {
            const { state: newState = 'pointer', content: newContent, icon: newIcon, iconName: newIconName, variant: newVariant, onHover: newOnHover, onClick: newOnClick } = newConfig;
            if (newState)
                node.setAttribute('data-cursor-state', newState);
            if (newIconName)
                node.setAttribute('data-cursor-icon', newIconName);
            else
                node.removeAttribute('data-cursor-icon');
            if (newContent)
                node.setAttribute('data-cursor-content', newContent);
            else
                node.removeAttribute('data-cursor-content');
            if (newVariant)
                node.setAttribute('data-cursor-variant', newVariant);
            else
                node.removeAttribute('data-cursor-variant');
            if (newOnHover || newOnClick) {
                node.__cursorCallbacks = { onHover: newOnHover, onClick: newOnClick };
            }
        },
        destroy() {
            node.removeAttribute('data-cursor-controlled');
            node.removeAttribute('data-cursor-state');
            node.removeAttribute('data-cursor-icon');
            node.removeAttribute('data-cursor-content');
            node.removeAttribute('data-cursor-variant');
            delete node.__cursorCallbacks;
        }
    };
}
// Getters for reactive access
export function getCursorState() {
    return cursorState;
}
export function updateCursorPosition(x, y) {
    cursorState.x = x;
    cursorState.y = y;
}
export function setCursorState(state, content, icon, iconName, variant, isLink, linkWidth) {
    cursorState.state = state;
    cursorState.content = content || null;
    cursorState.icon = icon || null;
    cursorState.iconName = iconName || null;
    cursorState.variant = variant || null;
    cursorState.isLink = isLink || false;
    cursorState.linkWidth = linkWidth || 0;
}
export function setCursorVisible(visible) {
    cursorState.visible = visible;
}
export function setCursorContent(content) {
    cursorState.content = content;
}
export function setCursorPressed(pressed) {
    cursorState.pressed = pressed;
}
export function setCursorLoading(loading) {
    cursorState.loading = loading;
}
export function setCursorSelecting(selecting, height) {
    cursorState.selecting = selecting;
    if (height !== undefined) {
        cursorState.selectionHeight = height;
    }
}
