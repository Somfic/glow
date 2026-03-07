<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Banner from '$lib/banner/Banner.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Banner"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Banner', href: '/components/banner' }
	]}
>
	<Heading level={1}>Banners</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		Simple banner component for displaying notifications and alerts with different severity levels.
	</Text>

	<Group label="Banner Variants" id="banner-variants">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Four color variants for different message types
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Banner variant="info" label="Info banner" />
			<Banner variant="success" label="Success banner" />
			<Banner variant="warning" label="Warning banner" />
			<Banner variant="error" label="Error banner" />
		</div>
	</Group>

	<Group label="Banner Examples" id="banner-examples">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Real-world usage examples with descriptive messages
		</Text>
		<div style="display: flex; flex-direction: column; gap: 0.75rem;">
			<Banner variant="info" label="Your session will expire in 5 minutes. Please save your work." />
			<Banner
				variant="success"
				label="Your changes have been saved successfully. You can now close this window."
			/>
			<Banner
				variant="warning"
				label="Some features may be unavailable due to scheduled maintenance on Sunday."
			/>
			<Banner
				variant="error"
				label="Unable to connect to the server. Please check your internet connection and try again."
			/>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Banner } from 'glow-ui';
</script>

<Banner variant="info" label="Informational message" />
<Banner variant="success" label="Success message" />
<Banner variant="warning" label="Warning message" />
<Banner variant="error" label="Error message" />`}
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
				{ prop: 'variant', type: "'info' | 'success' | 'warning' | 'error'", default: 'required', description: 'Banner color and semantic meaning' },
				{ prop: 'label', type: 'string', default: 'required', description: 'Banner message text' }
			]}
		/>
	</Group>

	<Group label="When to Use Each Variant" id="variants-guide">
		<div style="display: flex; flex-direction: column; gap: 1rem;">
			<div>
				<Text weight="semibold" size="sm">Info (Blue)</Text>
				<Text variant="secondary" size="sm"
					>General information, tips, or neutral notifications that don't require immediate
					action.</Text
				>
			</div>
			<div>
				<Text weight="semibold" size="sm">Success (Green)</Text>
				<Text variant="secondary" size="sm"
					>Positive confirmations, successful operations, or completed actions.</Text
				>
			</div>
			<div>
				<Text weight="semibold" size="sm">Warning (Orange)</Text>
				<Text variant="secondary" size="sm"
					>Important notices, potential issues, or situations requiring attention but not
					critical.</Text
				>
			</div>
			<div>
				<Text weight="semibold" size="sm">Error (Red)</Text>
				<Text variant="secondary" size="sm"
					>Critical errors, failed operations, or situations requiring immediate attention.</Text
				>
			</div>
		</div>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>🎨 Four semantic color variants</Text></li>
			<li><Text>📱 Responsive and mobile-friendly</Text></li>
			<li><Text>🎯 Clear visual hierarchy</Text></li>
			<li><Text>♿ Accessible with proper ARIA roles</Text></li>
			<li><Text>🎭 Consistent styling across variants</Text></li>
		</ul>
	</Group>
</Page>
