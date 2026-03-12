# Glow UI

A modern, flexible UI component library for Svelte 5.

## Installation

```bash
npm install glow
```

## Usage

### Importing Components

```svelte
<script>
  import { Button, Input, Card, Modal } from 'glow';
</script>

<Button variant="primary">Click me</Button>
<Input type="text" label="Username" />
```

### Importing Styles

Glow provides global stylesheets that you can import in your app. The styles include:

- CSS reset
- Global typography and base styles
- Theme variables (colors, spacing, etc.)

#### Import all styles (recommended)

```typescript
// In your root layout or +layout.svelte or main entry point
import 'glow/styles';
```

This imports the full Glow stylesheet including reset, global styles, and theme variables.

#### Import individual stylesheets

```typescript
// Import only what you need
import 'glow/styles/reset';   // CSS reset
import 'glow/styles/global';  // Global typography and base styles
import 'glow/styles/theme';   // Theme variables only
```

**Note:** The `global` stylesheet depends on `theme` for CSS variables, and the main `glow/styles` includes both `reset` and `global`.

## Components

### Input Component

The Input component supports multiple types with advanced features:

#### Select Input with Search

```svelte
<Input
  type="select"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  value={selectedValue}
  onChange={(v) => selectedValue = v}
/>
```

#### Multi-Select with Client-Side Search

```svelte
<Input
  type="multiselect"
  options={allOptions}
  value={selectedValues}
  onChange={(v) => selectedValues = v}
/>
```

#### Server-Side Search

Both `select` and `multiselect` support server-side search:

```svelte
<Input
  type="select"
  options={[]}
  value={selected}
  onSearch={async (query) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  }}
  searchDebounce={300}
  minSearchLength={2}
  onChange={(v) => selected = v}
/>
```

**Search Props:**
- `onSearch` - Async callback for server-side search
- `searchDebounce` - Debounce delay in ms (default: 300)
- `maxResults` - Max results to display (default: 10 for select, unlimited for multiselect)
- `minSearchLength` - Minimum characters before triggering search (default: 0)

### Other Components

- `Button` - Versatile button with variants
- `Card` - Content container
- `Modal` - Dialog overlay
- `Toast` - Notification system
- `Table` - Data table with sorting
- `Tabs` - Tabbed navigation
- And many more...

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Package for distribution
npm run package
```

## License

MIT
