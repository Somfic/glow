<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Tabs from '$lib/tabs/Tabs.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	let activeTab = $state('profile');
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Tabs | Glow UI</title></svelte:head>

<Heading level={1}>Tabs</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		A tabs component with visual connection between the active tab and content area.
	</Text>

	<Group label="Basic Tabs" id="basic-tabs">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Simple tabs with text labels
		</Text>
		<Tabs
			bind:activeTab
			tabs={[
				{
					id: 'profile',
					label: 'Profile',
					content: () => `
						<div>
							<h4 style="margin: 0 0 0.5rem 0;">Profile Settings</h4>
							<p style="margin: 0; color: rgba(238, 238, 238, 0.7);">
								Manage your profile information, avatar, and bio.
							</p>
						</div>
					`
				},
				{
					id: 'account',
					label: 'Account',
					content: () => `
						<div>
							<h4 style="margin: 0 0 0.5rem 0;">Account Settings</h4>
							<p style="margin: 0; color: rgba(238, 238, 238, 0.7);">
								Update your email, password, and security settings.
							</p>
						</div>
					`
				},
				{
					id: 'notifications',
					label: 'Notifications',
					content: () => `
						<div>
							<h4 style="margin: 0 0 0.5rem 0;">Notification Preferences</h4>
							<p style="margin: 0; color: rgba(238, 238, 238, 0.7);">
								Control what notifications you receive and how.
							</p>
						</div>
					`
				}
			]}
		/>
	</Group>

	<Group label="Tabs with Icons" id="tabs-with-icons">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Add icons to tabs for better visual recognition
		</Text>
		<Tabs
			tabs={[
				{
					id: 'overview',
					label: 'Overview',
					icon: 'Home',
					content: () => `
						<div>
							<h4 style="margin: 0 0 1rem 0;">Dashboard Overview</h4>
							<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
								<div style="padding: 1rem; background: rgba(139, 109, 237, 0.1); border-radius: 8px;">
									<div style="font-size: 0.75rem; color: rgba(238, 238, 238, 0.7);">Total Users</div>
									<div style="font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem;">1,234</div>
								</div>
								<div style="padding: 1rem; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
									<div style="font-size: 0.75rem; color: rgba(238, 238, 238, 0.7);">Revenue</div>
									<div style="font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem;">$12.5k</div>
								</div>
								<div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
									<div style="font-size: 0.75rem; color: rgba(238, 238, 238, 0.7);">Active</div>
									<div style="font-size: 1.5rem; font-weight: 600; margin-top: 0.25rem;">842</div>
								</div>
							</div>
						</div>
					`
				},
				{
					id: 'analytics',
					label: 'Analytics',
					icon: 'BarChart',
					content: () => `
						<div>
							<h4 style="margin: 0 0 0.5rem 0;">Analytics & Insights</h4>
							<p style="margin: 0; color: rgba(238, 238, 238, 0.7);">
								View detailed analytics about your users and performance.
							</p>
						</div>
					`
				},
				{
					id: 'settings',
					label: 'Settings',
					icon: 'Settings',
					content: () => `
						<div>
							<h4 style="margin: 0 0 0.5rem 0;">Application Settings</h4>
							<p style="margin: 0; color: rgba(238, 238, 238, 0.7);">
								Configure your application preferences and integrations.
							</p>
						</div>
					`
				}
			]}
		/>
	</Group>

	<Group label="Disabled Tabs" id="disabled-tabs">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Some tabs can be disabled to prevent interaction
		</Text>
		<Tabs
			tabs={[
				{
					id: 'enabled1',
					label: 'Active',
					content: () => `<p style="margin: 0;">This tab is enabled and can be selected.</p>`
				},
				{
					id: 'disabled1',
					label: 'Disabled',
					disabled: true,
					content: () => `<p style="margin: 0;">This content won't be shown.</p>`
				},
				{
					id: 'enabled2',
					label: 'Also Active',
					content: () => `<p style="margin: 0;">This tab is also enabled.</p>`
				}
			]}
		/>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Tabs } from 'glow-ui';

  let activeTab = $state('profile');
</script>

<Tabs
  bind:activeTab
  tabs={[
    {
      id: 'profile',
      label: 'Profile',
      icon: 'User',
      content: () => \`<div>Profile content</div>\`
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      disabled: true,
      content: () => \`<div>Settings content</div>\`
    }
  ]}
  onChange={(tabId) => console.log('Changed to:', tabId)}
/>`}
		/>
	</Group>

	<Group label="Props" id="props">
		<Table
			variant="simple"
			columns={[
				{
					key: 'prop',
					label: 'Prop',
					render: codeCell
				},
				{
					key: 'type',
					label: 'Type',
					render: codeCell
				},
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{
					prop: 'tabs',
					type: 'Tab[]',
					default: 'required',
					description: 'Array of tab definitions'
				},
				{
					prop: 'activeTab',
					type: 'string',
					default: "first tab's id",
					description: 'Currently active tab ID (bindable)'
				},
				{
					prop: 'onChange',
					type: '(tabId: string) => void',
					default: '-',
					description: 'Callback when tab changes'
				}
			]}
		/>
	</Group>

	<Group label="Features" id="features">
		<ul style="margin-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
			<li><Text>✨ Visual connection between active tab and content</Text></li>
			<li><Text>⌨️ Keyboard navigation (Arrow keys, Home, End)</Text></li>
			<li><Text>🎨 Icons support</Text></li>
			<li><Text>🚫 Disabled tabs</Text></li>
			<li><Text>♿ Fully accessible with ARIA attributes</Text></li>
			<li><Text>🎯 Bindable active state</Text></li>
		</ul>
	</Group>
