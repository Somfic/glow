// Layout barrel — page chrome, sidebar, and the small flex/spacing helpers.
export { default as Page } from "./page/Page.svelte";
export { default as Sidebar } from "./sidebar/Sidebar.svelte";
export { default as Flex } from "./layout/Flex.svelte";
export { default as Grid } from "./layout/Grid.svelte";
export { default as Spacer } from "./layout/Spacer.svelte";
export { default as Divider } from "./layout/Divider.svelte";
export { default as ScrollArea } from "./scroll-area/ScrollArea.svelte";
export { default as Card } from "./card/Card.svelte";
export { default as Accordion } from "./accordion/Accordion.svelte";
export { default as AccordionItem } from "./accordion/AccordionItem.svelte";
export type { AccordionType, AccordionVariant } from "./accordion/context.js";
export type { NavItem } from "./page/Navigation.svelte";
export type { ScrollAreaOrientation, ScrollAreaScrollbar, ScrollAreaEdges } from "./scroll-area/ScrollArea.svelte";
export type { SidebarItem, SidebarGroup, SidebarTheme } from "./sidebar/Sidebar.svelte";
