<script lang="ts">
	import Banner from '$lib/banner/Banner.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Group from '$lib/group/Group.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Page from '$lib/page/Page.svelte';
</script>

<Page
	title="Home"
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'About', href: '/about' },
		{ label: 'Contact', href: '/contact' },
		{ label: 'More', href: '/more' }
	]}
>
	<h1>Buttons</h1>

	<Group
		label="Regular"
		icon="Regex"
		actions={[
			{ label: 'Action', onClick: () => alert('Action clicked!') },
			{ icon: 'Volleyball', onClick: () => alert('Icon action clicked!') }
		]}
	>
		<Button label="Primary" variant="primary" />
		<Button label="Secondary" variant="secondary" />
		<Button label="Ternary" variant="ternary" />
	</Group>

	<Group label="Button group">
		<ButtonGroup>
			<Button label="First" />
			<Button icon="Volleyball" />
			<Button label="Third" />
		</ButtonGroup>
	</Group>

	<Group label="Banners">
		<Banner variant="info" label="Info banner" />
		<Banner variant="success" label="Success banner" />
		<Banner variant="warning" label="Warning banner" />
		<Banner variant="error" label="Error banner" />
	</Group>

	<h1>Icons</h1>
	<Icon name="Volleyball" />

	<h1>Inputs</h1>
	<h2>Text</h2>
	<Input type="text" placeholder="Placeholder" icon="Volleyball" />
</Page>
