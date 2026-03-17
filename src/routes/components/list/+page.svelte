<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import List from '$lib/data/List.svelte';
	import VirtualList from '$lib/data/VirtualList.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	// List demo data
	const navItems = [
		{ id: '1', label: 'Dashboard', icon: 'Home' as const, badge: '5' },
		{ id: '2', label: 'Messages', icon: 'Mail' as const, badge: '12' },
		{ id: '3', label: 'Settings', icon: 'Settings' as const },
		{ id: '4', label: 'Profile', icon: 'User' as const },
		{ id: '5', label: 'Help', icon: 'HelpCircle' as const }
	];

	let selectedNav = $state('1');

	// Virtual list demo data
	let virtualItems = $state(
		Array.from({ length: 50 }, (_, i) => ({
			id: i + 1,
			title: `Item ${i + 1}`,
			description: `Description for item ${i + 1}`
		}))
	);
	let virtualLoading = $state(false);
	let virtualHasMore = $state(true);
	let virtualPage = $state(1);

	async function loadMoreVirtualItems() {
		if (virtualLoading || !virtualHasMore) return;

		virtualLoading = true;
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const newItems = Array.from({ length: 20 }, (_, i) => ({
			id: virtualItems.length + i + 1,
			title: `Item ${virtualItems.length + i + 1}`,
			description: `Description for item ${virtualItems.length + i + 1}`
		}));

		virtualItems = [...virtualItems, ...newItems];
		virtualPage++;

		// Stop at page 10
		if (virtualPage >= 10) {
			virtualHasMore = false;
		}

		virtualLoading = false;
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>List | Glow UI</title></svelte:head>

<Heading level={1}>List Components</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Simple list component with icons and badges, plus high-performance virtual scrolling for long
		lists.
	</Text>

	<Group label="Navigation List" id="basic-list">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Selectable list with icons and badges
		</Text>
		<div
			style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden; max-width: 400px;"
		>
			<List items={navItems} selectable divided hoverable bind:selectedId={selectedNav} />
		</div>
		{#if selectedNav}
			<Text size="sm" variant="muted" style="margin-top: 0.5rem;">
				Selected: {navItems.find((i) => i.id === selectedNav)?.label}
			</Text>
		{/if}
	</Group>

	<Group label="List Variants" id="list-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Different visual styles for various use cases
		</Text>
		<div
			style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;"
		>
			<div>
				<Text weight="semibold" size="sm" style="margin-bottom: 0.5rem;">Compact</Text>
				<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden;">
					<List items={navItems.slice(0, 3)} variant="compact" divided />
				</div>
			</div>
			<div>
				<Text weight="semibold" size="sm" style="margin-bottom: 0.5rem;">Detailed</Text>
				<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden;">
					<List
						items={navItems
							.slice(0, 3)
							.map((i) => ({ ...i, description: 'Additional details about this item' }))}
						variant="detailed"
						divided
					/>
				</div>
			</div>
		</div>
	</Group>

	<Group label="Virtual List & Infinite Scroll" id="virtual-list">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			High-performance virtual scrolling that renders only visible items. Perfect for long lists
			with thousands of items and infinite scroll patterns.
		</Text>
		<div>
			<Heading level={3} id="infinite-scroll-demo">Infinite Scroll Demo</Heading>
			<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
				Scroll to bottom to load more items (currently {virtualItems.length} items)
			</Text>
			<div style="border: 1px solid #30313C; border-radius: 12px; overflow: hidden;">
				<VirtualList
					items={virtualItems}
					itemHeight={80}
					height="400px"
					hasMore={virtualHasMore}
					loading={virtualLoading}
					onLoadMore={loadMoreVirtualItems}
					renderItem={(item: { id: number; title: string; description: string }) => {
						return `
							<div style="padding: 1rem; border-bottom: 1px solid rgba(48, 49, 60, 0.5); background: #1e1f29;">
								<div style="font-weight: 600; color: #eee;">${item.title}</div>
								<div style="font-size: 0.875rem; color: rgba(238, 238, 238, 0.7); margin-top: 0.25rem;">${item.description}</div>
							</div>
						`;
					}}
				/>
			</div>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<Heading level={3} id="list-usage">Basic List</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { List } from 'glow-ui';

  const items = [
    { id: '1', label: 'Dashboard', icon: 'Home', badge: '5' },
    { id: '2', label: 'Messages', icon: 'Mail', badge: '12' },
    { id: '3', label: 'Settings', icon: 'Settings' }
  ];

  let selectedId = $state('1');
</script>

<List
  {items}
  selectable
  divided
  hoverable
  bind:selectedId
/>`}
		/>

		<Heading level={3} id="virtual-list-usage">Virtual List</Heading>
		<CodeBlock
			language="svelte"
			code={`<script>
  import { VirtualList } from 'glow-ui';

  let items = $state([...]);
  let loading = $state(false);
  let hasMore = $state(true);

  async function loadMore() {
    loading = true;
    const newItems = await fetchItems();
    items = [...items, ...newItems];
    hasMore = newItems.length > 0;
    loading = false;
  }
</script>

<VirtualList
  {items}
  {loading}
  {hasMore}
  onLoadMore={loadMore}
  itemHeight={80}
  height="500px"
  renderItem={(item) => \`<div>\${item.title}</div>\`}
/>`}
		/>
	</Group>

	<Group label="List Props" id="list-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'items', type: 'ListItem[]', default: 'required', description: 'Array of list items' },
				{ prop: 'selectable', type: 'boolean', default: 'false', description: 'Enable item selection' },
				{ prop: 'selectedId', type: 'string', default: '-', description: 'Currently selected item ID (bindable)' },
				{ prop: 'variant', type: "'compact' | 'default' | 'detailed'", default: "'default'", description: 'Visual variant' },
				{ prop: 'divided', type: 'boolean', default: 'false', description: 'Show dividers between items' },
				{ prop: 'hoverable', type: 'boolean', default: 'false', description: 'Highlight on hover' }
			]}
		/>
	</Group>

	<Group label="Virtual List Props" id="virtual-list-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'items', type: 'T[]', default: 'required', description: 'Array of items to display' },
				{ prop: 'itemHeight', type: 'number', default: 'required', description: 'Height of each item in pixels' },
				{ prop: 'height', type: 'string', default: 'required', description: "Container height (e.g. '400px')" },
				{ prop: 'renderItem', type: '(item: T) => string', default: 'required', description: 'Function to render each item (returns HTML)' },
				{ prop: 'hasMore', type: 'boolean', default: 'false', description: 'Whether more items can be loaded' },
				{ prop: 'loading', type: 'boolean', default: 'false', description: 'Loading state' },
				{ prop: 'onLoadMore', type: '() => void | Promise&lt;void&gt;', default: '-', description: 'Callback when user scrolls to bottom' }
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<Heading level={3}>List Component</Heading>
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🎨 Icons and badges support</Text></li>
			<li><Text>✅ Selectable items with state management</Text></li>
			<li><Text>📐 Multiple variants (compact, default, detailed)</Text></li>
			<li><Text>🎯 Hover and focus states</Text></li>
			<li><Text>🔗 Optional dividers</Text></li>
			<li><Text>♿ Keyboard navigation and ARIA support</Text></li>
		</ul>

		<Heading level={3} style="margin-top: 1.5rem;">Virtual List Component</Heading>
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>⚡ Only renders visible items (10,000+ items without lag)</Text></li>
			<li><Text>📜 Infinite scroll with automatic loading</Text></li>
			<li><Text>📏 Fixed or dynamic item heights</Text></li>
			<li><Text>🎨 Custom loading and empty states</Text></li>
			<li><Text>⌨️ Keyboard navigation support</Text></li>
		</ul>
	</Group>
