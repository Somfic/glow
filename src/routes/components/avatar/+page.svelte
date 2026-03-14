<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Group from '$lib/group/Group.svelte';
	import Avatar from '$lib/avatar/Avatar.svelte';
	import AvatarGroup from '$lib/avatar/AvatarGroup.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';

	const groupAvatars = [
		{ name: 'Alice Chen', src: 'https://i.pravatar.cc/100?img=1' },
		{ name: 'Bob Smith', src: 'https://i.pravatar.cc/100?img=2' },
		{ name: 'Carol Davis', src: 'https://i.pravatar.cc/100?img=3' },
		{ name: 'Dan Lee', src: 'https://i.pravatar.cc/100?img=4' },
		{ name: 'Eve Wang', src: 'https://i.pravatar.cc/100?img=5' },
		{ name: 'Frank Oz' },
		{ name: 'Grace Hopper' }
	];
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<Page
	title="Avatar"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Components', href: '/components' },
		{ label: 'Avatar', href: '/components/avatar' }
	]}
>
	<Heading level={1}>Avatar</Heading>
	<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
		User avatars with image and initials fallback. Hover to see names.
	</Text>

	<Group label="Basic" id="basic">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Avatars with images and initials fallback. Hover to see the name tooltip.
		</Text>
		<div style="display: flex; align-items: center; gap: 1rem;">
			<Avatar name="Alice Chen" src="https://i.pravatar.cc/100?img=1" />
			<Avatar name="Bob Smith" src="https://i.pravatar.cc/100?img=2" />
			<Avatar name="Carol Davis" />
			<Avatar name="Dan Lee" />
		</div>
	</Group>

	<Group label="Sizes" id="sizes">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Available in sm (28px), md (36px), lg (48px), and xl (64px).
		</Text>
		<div style="display: flex; align-items: center; gap: 1rem;">
			<Avatar name="Alice Chen" src="https://i.pravatar.cc/100?img=1" size="sm" />
			<Avatar name="Alice Chen" src="https://i.pravatar.cc/100?img=1" size="md" />
			<Avatar name="Alice Chen" src="https://i.pravatar.cc/100?img=1" size="lg" />
			<Avatar name="Alice Chen" src="https://i.pravatar.cc/100?img=1" size="xl" />
		</div>
		<div style="display: flex; align-items: center; gap: 1rem; margin-top: 1rem;">
			<Avatar name="Bob Smith" size="sm" />
			<Avatar name="Bob Smith" size="md" />
			<Avatar name="Bob Smith" size="lg" />
			<Avatar name="Bob Smith" size="xl" />
		</div>
	</Group>

	<Group label="Avatar Group" id="group">
		<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
			Stacked avatars with overflow indicator. Hover to smoothly expand.
		</Text>
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<div>
				<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">All visible</Text>
				<AvatarGroup avatars={groupAvatars.slice(0, 4)} size="md" />
			</div>
			<div>
				<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">With max (max=3)</Text>
				<AvatarGroup avatars={groupAvatars} max={3} size="md" />
			</div>
			<div>
				<Text variant="secondary" size="sm" style="margin-bottom: 0.5rem;">Large</Text>
				<AvatarGroup avatars={groupAvatars} max={5} size="lg" />
			</div>
		</div>
	</Group>

	<Group label="Usage" id="usage">
		<CodeBlock
			language="svelte"
			code={`<script>
  import { Avatar, AvatarGroup } from 'glow-ui';
</script>

<!-- Basic avatar -->
<Avatar name="Alice Chen" src="/avatar.jpg" />

<!-- Initials fallback -->
<Avatar name="Carol Davis" />

<!-- Grouped (hover to expand) -->
<AvatarGroup
  avatars={[
    { name: 'Alice', src: '/alice.jpg' },
    { name: 'Bob', src: '/bob.jpg' },
    { name: 'Carol' }
  ]}
  max={3}
  size="md"
/>`}
		/>
	</Group>

	<Group label="Avatar Props" id="avatar-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'name', type: 'string', default: '-', description: 'User name (used for initials, alt text, and tooltip)' },
				{ prop: 'src', type: 'string', default: '-', description: 'Image URL' },
				{ prop: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Avatar size' }
			]}
		/>
	</Group>

	<Group label="AvatarGroup Props" id="group-props">
		<Table
			variant="simple"
			columns={[
				{ key: 'prop', label: 'Prop', render: codeCell },
				{ key: 'type', label: 'Type', render: codeCell },
				{ key: 'default', label: 'Default' },
				{ key: 'description', label: 'Description' }
			]}
			data={[
				{ prop: 'avatars', type: '{ name, src? }[]', default: '-', description: 'Array of avatar data' },
				{ prop: 'max', type: 'number', default: '-', description: 'Max visible before "+N" overflow' },
				{ prop: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size applied to all avatars' }
			]}
		/>
	</Group>
</Page>
