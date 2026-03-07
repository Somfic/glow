<script lang="ts">
	import Banner from '$lib/banner/Banner.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Group from '$lib/group/Group.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Card from '$lib/media/Card.svelte';
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
	<Group label="Card">
		<Card
			src="https://placekitten.com/400/300"
			badge="#1"
			badgeVariant="success"
			title={'Card Title'}
			tags={[{ label: 'person', color: '#ec4899' }]}
			actions={[
				{ icon: 'Heart', label: '5', onclick: () => alert('Liked!') },
				{ icon: 'Trash', onclick: () => alert('Deleted!') }
			]}
		/>
	</Group>

	<Group
		label="Buttons"
		actions={[
			{ label: 'Action', onClick: () => alert('Action clicked!') },
			{ icon: 'Volleyball', onClick: () => alert('Icon action clicked!') }
		]}
	>
		<Button label="Primary" variant="primary" />
		<Button label="Secondary" variant="secondary" />
		<Button label="Ternary" variant="ternary" />
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

	<Group label="Inputs">
		<Input
			type="text"
			label="Text Input"
			placeholder="Enter text..."
			icon="Volleyball"
			clearable={true}
			required={true}
		/>

		<Input
			type="number"
			label="Number Input"
			placeholder="Enter number..."
			min={0}
			max={100}
			step={5}
			clearable={true}
		/>

		<Input
			type="textarea"
			label="Textarea Input"
			placeholder="Enter multiple lines..."
			rows={3}
			clearable={true}
		/>

		<Input type="checkbox" label="Checkbox Input" checkboxLabel="I agree to the terms" />

		<Input type="toggle" label="Toggle Input" toggleLabel="Enable notifications" />

		<Input type="range" label="Range Input" min={0} max={100} step={5} showValue={true} />

		<Input type="color" label="Color Input (OKLAB)" value="#3b82f6" />

		<Input
			type="multiselect"
			label="Multi-Select Input"
			placeholder="Choose multiple options..."
			clearable={true}
			options={[
				{ label: 'Red', value: 'red' },
				{ label: 'Green', value: 'green' },
				{ label: 'Blue', value: 'blue' },
				{ label: 'Yellow', value: 'yellow' }
			]}
		/>

		<Input
			type="radio"
			label="Radio Input"
			clearable={true}
			options={[
				{ label: 'Daily', value: 'daily' },
				{ label: 'Weekly', value: 'weekly' },
				{ label: 'Monthly', value: 'monthly' }
			]}
		/>

		<Input
			type="select"
			label="Select Input"
			placeholder="Search and select..."
			clearable={true}
			options={[
				{ label: 'Apple', value: 'apple' },
				{ label: 'Banana', value: 'banana' },
				{ label: 'Cherry', value: 'cherry' },
				{ label: 'Date', value: 'date' }
			]}
		/>
	</Group>
</Page>
