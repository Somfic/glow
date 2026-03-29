# Data Display Components

High-performance data display components for the Glow UI library.

## Components

### 📊 Table

A powerful data table with sorting, selection, and row actions.

**Features:**
- ✅ Sortable columns with visual indicators
- ✅ Row selection (single or multiple)
- ✅ Custom cell rendering with snippets
- ✅ Row action buttons (edit, delete, etc.)
- ✅ Sticky header
- ✅ Loading and empty states
- ✅ Clean, compact bordered design
- ✅ **Card layout mode** for mobile/horizontal display
- ✅ Virtual scrolling for large datasets (100+ rows)

**Basic Usage:**
```svelte
<script>
  import { Table } from 'glow-ui';

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ];

  const data = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];
</script>

<Table {columns} {data} />
```

**Card Layout (Horizontal Mode):**
```svelte
<Table {columns} {data} layout="cards" />
```
Perfect for mobile or when you want a vertical card layout instead of a table.

**With Selection and Actions:**
```svelte
<script>
  let selectedRows = $state([]);
</script>

<Table
  {columns}
  {data}
  selectable="multiple"
  bind:selectedRows
  rowActions={[
    { icon: 'Edit', label: 'Edit', onClick: (row) => console.log('Edit', row) },
    { icon: 'Trash', label: 'Delete', variant: 'danger', onClick: (row) => console.log('Delete', row) }
  ]}
/>
```

---

### 📜 VirtualList

High-performance virtual scrolling for long lists with infinite scroll support.

**Features:**
- ⚡ Only renders visible items (handles 10,000+ items)
- 📜 Infinite scroll with automatic loading
- 📏 Fixed or dynamic item heights
- 🎨 Custom loading, empty, and end states
- ⌨️ Keyboard navigation support

**Basic Usage:**
```svelte
<script>
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
  renderItem={(item) => `
    <div style="padding: 1rem;">
      <div>${item.title}</div>
      <div>${item.description}</div>
    </div>
  `}
/>
```

**With Custom States:**
```svelte
<VirtualList
  {items}
  itemHeight={80}
  height="400px"
>
  {#snippet emptyState()}
    <div>No items found</div>
  {/snippet}

  {#snippet loadingState()}
    <div>Loading more...</div>
  {/snippet}

  {#snippet endState()}
    <div>You've reached the end!</div>
  {/snippet}
</VirtualList>
```

---

## Props Reference

### Table Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn[]` | required | Column definitions |
| `data` | `T[]` | required | Table data |
| `selectable` | `boolean \| 'single' \| 'multiple'` | `false` | Enable row selection |
| `selectedRows` | `T[]` | `[]` | Selected rows (bindable) |
| `sortBy` | `TableSort` | `undefined` | Current sort (bindable) |
| `onSort` | `(column, direction) => void` | - | Sort callback |
| `rowActions` | `TableRowAction[]` | `[]` | Row action buttons |
| `loading` | `boolean` | `false` | Show loading state |
| `sticky` | `boolean` | `false` | Sticky header |
| `hoverable` | `boolean` | `true` | Hover effects |
| `layout` | `'table' \| 'cards'` | `'table'` | Layout mode |
| `virtual` | `boolean` | `false` | Use virtual scrolling |
| `onRowClick` | `(row, index) => void` | - | Row click handler |

### VirtualList Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | List items |
| `itemHeight` | `number \| (item, i) => number` | required | Item height(s) |
| `renderItem` | `(item, i) => string` | required | Render function |
| `hasMore` | `boolean` | `false` | More items available |
| `loading` | `boolean` | `false` | Loading state |
| `onLoadMore` | `() => void` | - | Load more callback |
| `threshold` | `number` | `200` | Load trigger distance (px) |
| `overscan` | `number` | `3` | Buffer items to render |
| `height` | `string \| number` | `'100%'` | Container height |

---

## Performance Tips

1. **Use virtual scrolling for large datasets** (100+ rows)
   ```svelte
   <Table {columns} {data} virtual virtualHeight="500px" />
   ```

2. **For very large lists, use VirtualList directly**
   ```svelte
   <VirtualList items={10000items} ... />
   ```

3. **Enable infinite scroll instead of pagination**
   ```svelte
   <VirtualList hasMore={true} onLoadMore={loadMore} />
   ```

4. **Use card layout on mobile**
   ```svelte
   <Table layout="cards" /> <!-- Better UX on small screens -->
   ```

---

## Accessibility

All components follow WCAG 2.1 guidelines:
- ✅ Keyboard navigation (Arrow keys, Tab, Enter, Space)
- ✅ Screen reader support (ARIA labels, roles)
- ✅ Focus management
- ✅ Semantic HTML where possible
