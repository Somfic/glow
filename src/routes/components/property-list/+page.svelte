<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import PropertyList from '$lib/data/PropertyList.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import type { PropertyItem, PropertyGroup } from '$lib/data/types.js';

	const userProperties: PropertyItem[] = [
		{ label: 'Name', icon: 'User', value: 'Jane Cooper' },
		{ label: 'Email', icon: 'Mail', value: 'jane@example.com', href: 'mailto:jane@example.com' },
		{ label: 'Role', icon: 'Shield', pill: { label: 'Admin', color: '#8B6DED', icon: 'Shield' } },
		{ label: 'Status', pill: { label: 'Active', color: '#22c55e' } },
		{ label: 'Phone', icon: 'Phone', value: '+1 (555) 123-4567' },
		{ label: 'Bio', value: undefined, muted: true }
	];

	const groupedData: PropertyGroup[] = [
		{
			label: 'Personal Info',
			icon: 'User',
			properties: [
				{ label: 'Full Name', value: 'Jane Cooper' },
				{ label: 'Email', value: 'jane@example.com', href: 'mailto:jane@example.com' },
				{ label: 'Phone', value: '+1 (555) 123-4567' }
			]
		},
		{
			label: 'Work',
			icon: 'Briefcase',
			properties: [
				{ label: 'Company', value: 'Acme Inc.' },
				{ label: 'Department', pill: { label: 'Engineering', color: '#3b82f6' } },
				{ label: 'Title', value: 'Senior Developer' },
				{ label: 'Start Date', value: '2023-01-15' }
			]
		},
		{
			label: 'Settings',
			icon: 'Settings',
			properties: [
				{ label: 'Two-Factor Auth', value: true },
				{ label: 'Email Notifications', value: false },
				{ label: 'Theme', pill: { label: 'Dark', icon: 'Moon' } }
			]
		}
	];

	const serverProperties: PropertyItem[] = [
		{ label: 'Hostname', value: 'prod-web-01' },
		{ label: 'IP Address', value: '192.168.1.100' },
		{ label: 'Status', pill: { label: 'Running', color: '#22c55e' } },
		{ label: 'Uptime', value: '45 days' },
		{ label: 'CPU', value: '24%' },
		{ label: 'Memory', value: '8.2 / 16 GB' },
		{ label: 'OS', value: 'Ubuntu 24.04 LTS' },
		{ label: 'Region', pill: { label: 'US-East-1', color: '#f59e0b', icon: 'MapPin' } }
	];
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Property List | Glow UI</title></svelte:head>

<Heading level={1}>Property List</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Display key-value pairs for entity details, record inspectors, and sidebars.
	</Text>

	<Group label="Inline Variant" id="inline">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Side-by-side layout with labels and values. Good for detail panels and sidebars.
		</Text>
		<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden; max-width: 500px;">
			<PropertyList properties={userProperties} />
		</div>
	</Group>

	<Group label="Stacked Variant" id="stacked">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Labels appear above values. Better for narrow containers or long values.
		</Text>
		<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden; max-width: 400px;">
			<PropertyList properties={userProperties} variant="stacked" />
		</div>
	</Group>

	<Group label="Grouped Sections" id="grouped">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Organize properties into labeled groups with section headers.
		</Text>
		<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden; max-width: 500px;">
			<PropertyList groups={groupedData} />
		</div>
	</Group>

	<Group label="Divided Groups" id="divided-groups">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Dividers appear between groups to visually separate sections.
		</Text>
		<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden; max-width: 500px;">
			<PropertyList groups={groupedData} divided />
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="basic-usage">Basic Usage</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { PropertyList } from 'glow-ui';

  const properties = [
    { label: 'Name', icon: 'User', value: 'Jane Cooper' },
    { label: 'Email', value: 'jane@example.com', href: 'mailto:jane@example.com' },
    { label: 'Role', pill: { label: 'Admin', color: '#8B6DED' } },
    { label: 'Notes', value: undefined, muted: true }
  ];
</script>

<PropertyList {properties} />`}
		/>

		<Heading level={3} id="grouped-usage">Grouped Sections</Heading>
		<CodeBlock
			language="svelte"
			code={`<PropertyList
  groups={[
    {
      label: 'Personal Info',
      icon: 'User',
      properties: [
        { label: 'Name', value: 'Jane Cooper' },
        { label: 'Email', value: 'jane@example.com' }
      ]
    },
    {
      label: 'Work',
      icon: 'Briefcase',
      properties: [
        { label: 'Company', value: 'Acme Inc.' },
        { label: 'Department', pill: { label: 'Engineering', color: '#3b82f6' } }
      ]
    }
  ]}
/>`}
		/>
	</Group>

	<Group label="PropertyList Props" id="props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'properties', type: 'PropertyItem[]', default: '-', description: 'Flat list of property items' },
				{ prop: 'groups', type: 'PropertyGroup[]', default: '-', description: 'Grouped property sections' },
				{ prop: 'variant', type: "'inline' | 'stacked'", default: "'inline'", description: 'Layout variant' },
				{ prop: 'divided', type: 'boolean', default: 'true', description: 'Show dividers between groups' },
				{ prop: 'labelWidth', type: 'string', default: "'40%'", description: 'Label column width (inline variant only)' }
			]}
		/>
	</Group>

	<Group label="PropertyItem" id="property-item">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'label', type: 'string', default: 'required', description: 'Property label' },
				{ prop: 'icon', type: 'IconName', default: '-', description: 'Icon next to the label' },
				{ prop: 'value', type: 'string | number | boolean', default: '-', description: 'Plain value to display' },
				{ prop: 'href', type: 'string', default: '-', description: 'Renders value as a link' },
				{ prop: 'pill', type: '{ label, color?, icon? }', default: '-', description: 'Renders value as a Pill' },
				{ prop: 'render', type: 'Snippet', default: '-', description: 'Custom render snippet (overrides all above)' },
				{ prop: 'muted', type: 'boolean', default: 'false', description: 'Dims the value (for empty/null states)' }
			]}
		/>
	</Group>
