# Navigation Components

Navigation and content organization components for the Glow UI library.

## TableOfContents

A sticky table of contents component that shows an overview of page headings with automatic scroll tracking and smooth navigation.

### Features

- 📍 **Sticky positioning** - Stays visible while scrolling
- 🎯 **Auto-detection** - Automatically finds headings in your content
- 📊 **Smart indentation** - Visual hierarchy based on heading levels (h1, h2, h3, etc.)
- ✨ **Active highlighting** - Shows which section is currently visible
- 🔗 **Smooth scrolling** - Animated scroll to sections on click
- ⚙️ **Configurable** - Choose which heading levels to include

### Basic Usage (Auto-detect)

```svelte
<script>
  import { TableOfContents } from 'glow-ui';
</script>

<div style="display: flex; gap: 2rem;">
  <main style="flex: 1;">
    <h1 id="introduction">Introduction</h1>
    <p>Content here...</p>

    <h2 id="getting-started">Getting Started</h2>
    <p>More content...</p>

    <h3 id="installation">Installation</h3>
    <p>Even more content...</p>
  </main>

  <aside style="width: 250px;">
    <TableOfContents />
  </aside>
</div>
```

The component will automatically:
1. Scan the `<main>` element for headings
2. Generate IDs for headings that don't have them
3. Track which heading is currently visible
4. Update the active state as you scroll

### Manual Headings

For more control, provide headings manually:

```svelte
<script>
  let headings = [
    { id: 'intro', text: 'Introduction', level: 1 },
    { id: 'features', text: 'Features', level: 2 },
    { id: 'api', text: 'API Reference', level: 2 },
    { id: 'props', text: 'Props', level: 3 },
    { id: 'events', text: 'Events', level: 3 }
  ];
</script>

<TableOfContents {headings} autoDetect={false} />
```

### Custom Container

By default, the component scans `<main>` for headings. Change this with the `container` prop:

```svelte
<div class="content">
  <h1>My Content</h1>
  <!-- ... -->
</div>

<TableOfContents container=".content" />
```

### Custom Heading Levels

Only include specific heading levels (default is [1, 2, 3, 4]):

```svelte
<!-- Only show h2 and h3 -->
<TableOfContents levels={[2, 3]} />

<!-- Show all heading levels -->
<TableOfContents levels={[1, 2, 3, 4, 5, 6]} />
```

### Tracking Active Section

Bind to `activeId` to track or control the active section:

```svelte
<script>
  let activeId = $state('');
</script>

<TableOfContents bind:activeId />

<p>Current section: {activeId}</p>
```

### Responsive Layout

Show/hide the table of contents on different screen sizes:

```svelte
<div class="layout">
  <main class="content">
    <!-- Your content -->
  </main>

  <aside class="toc-sidebar">
    <TableOfContents />
  </aside>
</div>

<style>
  .layout {
    display: flex;
    gap: 2rem;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .toc-sidebar {
    width: 250px;
    flex-shrink: 0;
  }

  /* Hide on mobile */
  @media (max-width: 1024px) {
    .toc-sidebar {
      display: none;
    }
  }
</style>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headings` | `Heading[]` | `[]` | Manual list of headings (bindable) |
| `activeId` | `string` | `''` | Currently active heading ID (bindable) |
| `autoDetect` | `boolean` | `true` | Auto-detect headings from the page |
| `container` | `string` | `'main'` | CSS selector for the container to scan |
| `levels` | `number[]` | `[1,2,3,4]` | Which heading levels to include |

### Types

```typescript
interface Heading {
  id: string;      // Heading ID (used for anchor links)
  text: string;    // Heading text content
  level: number;   // Heading level (1-6)
}
```

### Styling

The component uses sticky positioning and automatically handles:
- Indentation based on heading hierarchy
- Active state highlighting with your theme's primary color
- Smooth hover transitions
- Custom scrollbar styling

You can override styles using CSS custom properties or by targeting the component classes.

### Accessibility

- Uses semantic `<nav>` and `<ul>` elements
- Proper anchor links with `href="#id"`
- Keyboard navigable
- Smooth scroll behavior respects user's motion preferences

### Tips

1. **Ensure headings have IDs**: While the component auto-generates IDs, it's better to set them manually for stable URLs
   ```html
   <h2 id="getting-started">Getting Started</h2>
   ```

2. **Semantic heading structure**: Use headings in order (h1 → h2 → h3) for best results
   ```html
   <h1>Title</h1>
   <h2>Section</h2>
   <h3>Subsection</h3>
   <!-- Don't skip levels -->
   ```

3. **Position relative to content**: Place the TOC in a sidebar next to your main content
   ```svelte
   <div style="display: flex;">
     <main><!-- content --></main>
     <aside><TableOfContents /></aside>
   </div>
   ```

4. **Mobile considerations**: Hide the TOC on mobile or convert it to a dropdown/modal

### Example: Documentation Page

```svelte
<script>
  import { TableOfContents, Page } from 'glow-ui';
</script>

<Page title="API Documentation">
  <div class="docs-layout">
    <article class="docs-content">
      <h1 id="overview">Overview</h1>
      <p>Welcome to our API documentation...</p>

      <h2 id="authentication">Authentication</h2>
      <p>All API requests require authentication...</p>

      <h3 id="api-keys">API Keys</h3>
      <p>You can generate API keys from...</p>

      <h2 id="endpoints">Endpoints</h2>
      <p>Available API endpoints...</p>

      <h3 id="users">Users</h3>
      <p>User management endpoints...</p>

      <h3 id="posts">Posts</h3>
      <p>Post management endpoints...</p>
    </article>

    <aside class="docs-sidebar">
      <TableOfContents />
    </aside>
  </div>
</Page>

<style>
  .docs-layout {
    display: flex;
    gap: 3rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .docs-content {
    flex: 1;
    min-width: 0;
    max-width: 800px;
  }

  .docs-sidebar {
    width: 250px;
    flex-shrink: 0;
  }

  @media (max-width: 1024px) {
    .docs-sidebar {
      display: none;
    }
  }
</style>
```

This creates a professional documentation layout with a sticky table of contents that highlights the current section as users scroll through the page!
