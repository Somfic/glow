import "./style/reset.scss";
import "./style/global.scss";

export { default as Banner } from "./banner/Banner.svelte";
export { default as Button, type ButtonAction, type ButtonVariant, type ButtonSize } from "./button/Button.svelte";
export { default as ButtonGroup } from "./button/ButtonGroup.svelte";
export { default as Icon, type IconName, type IconProp, type IconProps, resolveIcon } from "./icon/Icon.svelte";
export { default as Input } from "./input/Input.svelte";
export { default as TextInput } from "./input/TextInput.svelte";
export { default as PasswordInput } from "./input/PasswordInput.svelte";
export { default as NumberInput } from "./input/NumberInput.svelte";
export { default as TextareaInput } from "./input/TextareaInput.svelte";
export { default as MultiSelectInput } from "./input/MultiSelectInput.svelte";
export { default as RadioInput } from "./input/RadioInput.svelte";
export { default as CheckboxInput } from "./input/CheckboxInput.svelte";
export { default as ToggleInput } from "./input/ToggleInput.svelte";
export { default as RangeInput } from "./input/RangeInput.svelte";
export { default as ColorInput } from "./input/ColorInput.svelte";
export { default as DateInput } from "./input/DateInput.svelte";
export { default as TimeInput } from "./input/TimeInput.svelte";
export { default as ImageUpload } from "./input/ImageUpload.svelte";
export { default as ImageCropper } from "./input/ImageCropper.svelte";
export type {
	SelectOption,
	MultiSelectOption,
	ComboboxOption,
	ComboboxGroup,
	ComboboxEntry
} from "./input/types.js";
export { default as Page } from "./page/Page.svelte";
export { default as Pill } from "./pill/Pill.svelte";
export type { NavItem } from "./page/Navigation.svelte";
export { default as Media } from "./media/Media.svelte";
export { default as Card } from "./card/Card.svelte";
export { default as Lightbox, type RelatedMedia } from "./media/Lightbox.svelte";
export { default as Modal } from "./modal/Modal.svelte";
export { default as Drawer } from "./drawer/Drawer.svelte";
export { useModal, useDrawer, ModalController } from "./modal/modal.svelte.js";
export { default as CommandPalette } from "./command-palette/CommandPalette.svelte";
export { default as CommandPopover } from "./command-palette/CommandPopover.svelte";
export { default as CommandInput } from "./command-palette/CommandInput.svelte";
export type { Anchor as CommandPopoverAnchor, AnchorPoint as CommandPopoverAnchorPoint } from "./command-palette/CommandPopover.svelte";
export { commands, useCommandRegistry, CommandRegistry } from "./command-palette/registry.svelte.js";
export {
	useCommandList,
	CLOSE_MATCH_KEY,
	type ScoredCommand,
	type Section as CommandListSection,
	type UseCommandList,
	type UseCommandListOptions
} from "./command-palette/useCommandList.svelte.js";
export type { Command, CommandContext, CommandGroup } from "./command-palette/types.js";
export { default as Toast } from "./toast/Toast.svelte";
export { default as ToastContainer } from "./toast/ToastContainer.svelte";
export { toast, showToast, dismissToast, toasts } from "./toast/toast.svelte.js";
export type { Toast as ToastType, ToastVariant, ToastOptions } from "./toast/toast.svelte.js";
export { default as FileUpload } from "./file-upload/FileUpload.svelte";
export { default as Split } from "./split/Split.svelte";
export type { SplitDirection, SplitPane } from "./split/types.js";
export { default as NotificationCenter } from "./notification-center/NotificationCenter.svelte";
export {
	notifications,
	useNotifications,
	NotificationCenter as NotificationCenterRegistry
} from "./notification-center/notificationCenter.svelte.js";
export type {
	Notification,
	NotificationCategory,
	NotificationAction
} from "./notification-center/types.js";
export { tooltip } from "./tooltip/tooltip.svelte.js";
export type { TooltipOptions, TooltipParams, TooltipPosition } from "./tooltip/tooltip.svelte.js";
export { default as Heading } from "./typography/Heading.svelte";
export { default as Text } from "./typography/Text.svelte";
export { default as Link } from "./typography/Link.svelte";
export { default as Kbd } from "./typography/Kbd.svelte";
export { default as Section } from "./typography/Section.svelte";
export { default as Markdown } from "./typography/Markdown.svelte";
export { default as Flex } from "./layout/Flex.svelte";
export { default as Grid } from "./layout/Grid.svelte";
export { default as Spacer } from "./layout/Spacer.svelte";
export { default as Divider } from "./layout/Divider.svelte";
export { default as Code } from "./code/Code.svelte";
export { default as CodeBlock } from "./code/CodeBlock.svelte";
export { cursor } from "./cursor/cursor.svelte.js";
export type { CursorConfig, CursorState } from "./cursor/cursor.svelte.js";
export { default as CursorProvider } from "./cursor/CursorProvider.svelte";
export { default as Glow } from "./glow/Glow.svelte";
export { default as Popover } from "./popover/Popover.svelte";
export { default as PopoverMenu } from "./menu/PopoverMenu.svelte";
export { default as ContextMenu } from "./menu/ContextMenu.svelte";
export type {
	PopoverMenuEntry,
	PopoverMenuItem,
	PopoverMenuToggle,
	PopoverMenuSubmenu,
	PopoverMenuCustom,
	PopoverMenuHeader,
	PopoverMenuCommonItem
} from "./menu/PopoverMenu.svelte";

// Settings / config primitives
export { default as Field } from "./settings/Field.svelte";
export { default as FieldRow } from "./settings/FieldRow.svelte";
export { default as SettingsSection } from "./settings/SettingsSection.svelte";
export { default as SettingsShell } from "./settings/SettingsShell.svelte";
export type { FieldLayout, FieldTier, FieldContext } from "./settings/fieldContext.js";
export { default as Avatar } from "./avatar/Avatar.svelte";
export { default as AvatarGroup } from "./avatar/AvatarGroup.svelte";
export { default as Spinner } from "./spinner/Spinner.svelte";
export { default as Skeleton } from "./skeleton/Skeleton.svelte";

export { default as Pagination } from "./pagination/Pagination.svelte";
export { default as ListItem } from "./list/ListItem.svelte";

// Utilities — small, dependency-free primitives apps can reach for.
export { trapFocus } from "./util/focusTrap.js";
export { registerShortcut } from "./util/shortcut.svelte.js";
export { portal } from "./util/portal.js";
export { sortable, type SortableOptions } from "./sortable/sortable.js";

// Theming
export { default as ThemeProvider, type ThemeMode } from "./style/ThemeProvider.svelte";

// Data display components
export { default as Table } from "./data/Table.svelte";
export { default as VirtualList } from "./data/VirtualList.svelte";
export { default as Data } from "./data/Data.svelte";
export type {
	TableProps,
	TableColumn,
	TableSort,
	TableRowAction,
	VirtualListProps,
	DataProps,
	DataItem,
	DataGroup
} from "./data/types.js";
export { default as TableOfContents } from "./navigation/TableOfContents.svelte";
export { default as Tabs } from "./tabs/Tabs.svelte";
export { default as Sidebar } from "./sidebar/Sidebar.svelte";
export type { SidebarItem, SidebarGroup } from "./sidebar/Sidebar.svelte";
