// Data display barrel — Table, VirtualList, Data, and supporting types.
// Filename is `data-display.ts` to avoid colliding with `glow/data` if a
// consumer imports the source directly.
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
