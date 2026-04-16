import "./style/reset.scss";
import "./style/global.scss";

export { default as Banner } from "./banner/Banner.svelte";
export { default as Button, type ButtonAction, type ButtonVariant } from "./button/Button.svelte";
export { default as ButtonGroup } from "./button/ButtonGroup.svelte";
export { default as Icon, type IconName, type IconProp, type IconProps, resolveIcon } from "./icon/Icon.svelte";
export { default as Input } from "./input/Input.svelte";
export { default as ImageUpload } from "./input/ImageUpload.svelte";
export { default as ImageCropper } from "./input/ImageCropper.svelte";
export type {
	SelectOption,
	MultiSelectOption,
	ComboboxOption,
	ComboboxGroup,
	ComboboxEntry
} from "./input/types.js";
export { default as Group } from "./group/Group.svelte";
export { default as Page } from "./page/Page.svelte";
export { default as Pill } from "./pill/Pill.svelte";
export type { NavItem } from "./page/Navigation.svelte";
export { default as Media } from "./media/Media.svelte";
export { default as MediaCard } from "./media/MediaCard.svelte";
export { default as Card } from "./card/Card.svelte";
export { default as Lightbox, type RelatedMedia } from "./media/Lightbox.svelte";
export { default as Modal } from "./modal/Modal.svelte";
export { default as Drawer } from "./drawer/Drawer.svelte";
export { default as Toast } from "./toast/Toast.svelte";
export { default as ToastContainer } from "./toast/ToastContainer.svelte";
export { toast, showToast, dismissToast, toasts } from "./toast/toast.svelte.js";
export type { Toast as ToastType, ToastVariant, ToastOptions } from "./toast/toast.svelte.js";
export { tooltip } from "./tooltip/tooltip.svelte.js";
export type { TooltipOptions, TooltipParams, TooltipPosition } from "./tooltip/tooltip.svelte.js";
export { default as Heading } from "./typography/Heading.svelte";
export { default as Text } from "./typography/Text.svelte";
export { default as Code } from "./code/Code.svelte";
export { default as CodeBlock } from "./code/CodeBlock.svelte";
export { cursor } from "./cursor/cursor.svelte.js";
export type { CursorConfig, CursorState } from "./cursor/cursor.svelte.js";
export { default as CursorProvider } from "./cursor/CursorProvider.svelte";
export { default as GradientMesh } from "./gradient/GradientMesh.svelte";
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
export { default as Section } from "./settings/Section.svelte";
export { default as Disclosure } from "./settings/Disclosure.svelte";
export { default as SettingsShell } from "./settings/SettingsShell.svelte";
export type { FieldLayout, FieldTier, FieldContext } from "./settings/fieldContext.js";
export { default as Avatar } from "./avatar/Avatar.svelte";
export { default as AvatarGroup } from "./avatar/AvatarGroup.svelte";
export { default as Spinner } from "./spinner/Spinner.svelte";

export { default as Pagination } from "./pagination/Pagination.svelte";

// Data display components
export { default as Table } from "./data/Table.svelte";
export { default as VirtualList } from "./data/VirtualList.svelte";
export { default as Data } from "./data/Data.svelte";
/** @deprecated Use Data instead */
export { default as PropertyList } from "./data/Data.svelte";
export type {
	TableProps,
	TableColumn,
	TableSort,
	TableRowAction,
	VirtualListProps,
	DataProps,
	DataItem,
	DataGroup,
	PropertyListProps,
	PropertyItem,
	PropertyGroup
} from "./data/types.js";
export { default as TableOfContents } from "./navigation/TableOfContents.svelte";
export { default as Tabs } from "./tabs/Tabs.svelte";
export { default as Sidebar } from "./sidebar/Sidebar.svelte";
export type { SidebarItem, SidebarGroup } from "./sidebar/Sidebar.svelte";
