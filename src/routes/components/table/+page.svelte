<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Table from '$lib/data/Table.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import type { TableColumn } from '$lib/data/types.js';

	// Data Display Demo Data
	interface User {
		id: number;
		name: string;
		email: string;
		role: string;
		status: 'active' | 'inactive';
		lastSeen: string;
	}

	const users: User[] = [
		{
			id: 1,
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Admin',
			status: 'active',
			lastSeen: '2 mins ago'
		},
		{
			id: 2,
			name: 'Bob Smith',
			email: 'bob@example.com',
			role: 'Developer',
			status: 'active',
			lastSeen: '15 mins ago'
		},
		{
			id: 3,
			name: 'Charlie Brown',
			email: 'charlie@example.com',
			role: 'Designer',
			status: 'inactive',
			lastSeen: '2 hours ago'
		},
		{
			id: 4,
			name: 'Diana Prince',
			email: 'diana@example.com',
			role: 'Manager',
			status: 'active',
			lastSeen: '5 mins ago'
		},
		{
			id: 5,
			name: 'Ethan Hunt',
			email: 'ethan@example.com',
			role: 'Developer',
			status: 'active',
			lastSeen: '1 hour ago'
		}
	];

	const userColumns: TableColumn<User>[] = [
		{ key: 'id', label: 'ID', sortable: true, width: '80px' },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'email', label: 'Email', sortable: true },
		{ key: 'role', label: 'Role', sortable: true },
		{
			key: 'status',
			label: 'Status',
			sortable: true,
			render: (value: string) => {
				return `<span style="padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: ${value === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${value === 'active' ? '#22c55e' : '#ef4444'}">${value}</span>`;
			}
		},
		{ key: 'lastSeen', label: 'Last Seen' }
	];

	let selectedUsers = $state<User[]>([]);
	let tableSort = $state<{ column: string; direction: 'asc' | 'desc' } | undefined>(undefined);
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Table"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Table', href: '/components/table' }
	]}
>
	<Heading level={1}>Data Table</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A powerful data table component with sorting, selection, row actions, and virtual scrolling
		for large datasets.
	</Text>

	<Group label="Basic Data Table" id="basic-table">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Sortable columns, row selection, and action buttons
		</Text>
		<Table
			columns={userColumns}
			data={users}
			selectable="multiple"
			bind:selectedRows={selectedUsers}
			bind:sortBy={tableSort}
			rowActions={[
				{ icon: 'Edit', label: 'Edit', onClick: (row: User) => alert(`Edit ${row.name}`) },
				{
					icon: 'Trash',
					label: 'Delete',
					variant: 'danger',
					onClick: (row: User) => alert(`Delete ${row.name}`)
				}
			]}
		/>
		{#if selectedUsers.length > 0}
			<Text size="sm" variant="muted" style="margin-top: 0.5rem;">
				Selected: {selectedUsers.map((u) => u.name).join(', ')}
			</Text>
		{/if}
	</Group>

	<Group label="Card Layout (Horizontal Mode)" id="card-layout">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Perfect for mobile or when you want a vertical card layout instead of a table
		</Text>
		<Table
			columns={userColumns}
			data={users.slice(0, 3)}
			layout="cards"
			selectable="multiple"
			rowActions={[
				{ icon: 'Edit', label: 'Edit', onClick: (row: User) => alert(`Edit ${row.name}`) },
				{
					icon: 'Trash',
					label: 'Delete',
					variant: 'danger',
					onClick: (row: User) => alert(`Delete ${row.name}`)
				}
			]}
		/>
	</Group>

	<Group label="Custom Cell Rendering" id="custom-rendering">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Use the <code>render</code> function on columns to customize how cells are displayed. The
			status column above uses custom rendering to show colored badges.
		</Text>
		<CodeBlock
			language="typescript"
			code={`const columns: TableColumn<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: string) => {
      const color = value === 'active' ? '#22c55e' : '#ef4444';
      const bg = value === 'active'
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(239, 68, 68, 0.2)';

      return \`<span style="
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        background: \${bg};
        color: \${color}
      ">\${value}</span>\`;
    }
  }
];`}
		/>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Table } from 'glow-ui';
  import type { TableColumn } from 'glow-ui/types';

  interface User {
    id: number;
    name: string;
    email: string;
  }

  let selectedRows = $state<User[]>([]);
  let sortBy = $state(undefined);

  const columns: TableColumn<User>[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true }
  ];

  const data: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];
</script>

<Table
  {columns}
  {data}
  selectable="multiple"
  bind:selectedRows
  bind:sortBy
  rowActions={[
    {
      icon: 'Edit',
      label: 'Edit',
      onClick: (row) => console.log('Edit', row)
    },
    {
      icon: 'Trash',
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => console.log('Delete', row)
    }
  ]}
/>`}
		/>
	</Group>

	<Group label="Props" id="props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'columns', type: 'TableColumn[]', default: 'required', description: 'Column definitions' },
				{ prop: 'data', type: 'T[]', default: 'required', description: 'Table data array' },
				{ prop: 'selectable', type: "'single' | 'multiple'", default: '-', description: 'Enable row selection' },
				{ prop: 'selectedRows', type: 'T[]', default: '[]', description: 'Selected rows (bindable)' },
				{ prop: 'sortBy', type: 'SortConfig', default: 'undefined', description: 'Sort configuration (bindable)' },
				{ prop: 'rowActions', type: 'RowAction[]', default: '-', description: 'Actions for each row' },
				{ prop: 'layout', type: "'table' | 'cards'", default: "'table'", description: 'Layout mode' }
			]}
		/>
	</Group>

	<Group label="Column Configuration" id="column-config">
		<Table
			variant="simple"
			columns={[
				{ key: 'property', label: 'Property', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ property: 'key', type: 'string', description: 'Object key to display' },
				{ property: 'label', type: 'string', description: 'Column header label' },
				{ property: 'sortable', type: 'boolean', description: 'Enable sorting for this column' },
				{ property: 'width', type: 'string', description: 'Fixed column width (e.g. \'80px\')' },
				{ property: 'render', type: '(value: any) => string', description: 'Custom rendering function (returns HTML)' }
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🔄 Sortable columns with visual indicators</Text></li>
			<li><Text>✅ Row selection (single or multiple)</Text></li>
			<li><Text>🎨 Custom cell rendering with HTML</Text></li>
			<li><Text>⚡ Row actions with icons and variants</Text></li>
			<li><Text>📱 Card layout mode for mobile/responsive design</Text></li>
			<li><Text>📏 Fixed column widths support</Text></li>
			<li><Text>🎯 Virtual scrolling for large datasets</Text></li>
			<li><Text>♿ Fully accessible with ARIA attributes</Text></li>
		</ul>
	</Group>
</Page>
