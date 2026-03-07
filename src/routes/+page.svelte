<script lang="ts">
	import Banner from '$lib/banner/Banner.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Group from '$lib/group/Group.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Input from '$lib/input/Input.svelte';
	import Card from '$lib/media/Card.svelte';
	import Modal from '$lib/modal/Modal.svelte';
	import Page from '$lib/page/Page.svelte';
	import { tooltip } from '$lib/tooltip/tooltip.svelte.js';
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';

	let demoModal: any;
	let confirmModal: any;
	let largeModal: any;
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
	<Group label="Typography">
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<div>
				<Heading level={1}>Heading 1 - Main Title</Heading>
				<Heading level={2}>Heading 2 - Section Title</Heading>
				<Heading level={3}>Heading 3 - Subsection</Heading>
				<Heading level={4}>Heading 4 - Component Title</Heading>
				<Heading level={5}>Heading 5 - Small Heading</Heading>
				<Heading level={6}>Heading 6 - Minor Heading</Heading>
			</div>

			<div>
				<Heading level={3}>Text Sizes</Heading>
				<Text size="xl">Extra large text - For emphasis and introduction</Text>
				<Text size="lg">Large text - For secondary emphasis</Text>
				<Text size="base">Base text - Standard body text for most content</Text>
				<Text size="sm">Small text - For captions and secondary information</Text>
				<Text size="xs">Extra small text - For metadata and fine print</Text>
			</div>

			<div>
				<Heading level={3}>Text Variants</Heading>
				<Text variant="primary">Primary text - Standard readable text</Text>
				<Text variant="secondary">Secondary text - Less prominent information</Text>
				<Text variant="muted">Muted text - Subtle background information</Text>
			</div>

			<div>
				<Heading level={3}>Text Weights</Heading>
				<Text weight="normal">Normal weight - Regular text</Text>
				<Text weight="medium">Medium weight - Slightly emphasized</Text>
				<Text weight="semibold">Semibold weight - Emphasized text</Text>
				<Text weight="bold">Bold weight - Strong emphasis</Text>
			</div>

			<div>
				<Heading level={3}>Example Content</Heading>
				<Text size="lg" weight="semibold">Introduction Paragraph</Text>
				<Text>
					This is a standard paragraph with normal text. It demonstrates how body text appears in
					the design system with proper line height and spacing. The text should be easily readable
					and comfortable to scan.
				</Text>
				<Text variant="secondary">
					This is secondary text that provides additional context or supporting information. It's
					less prominent but still readable.
				</Text>
			</div>
		</div>
	</Group>

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

	<Group label="Modal">
		<Button label="Open Basic Modal" onclick={() => demoModal.open()} />
		<Button label="Open Confirm Dialog" onclick={() => confirmModal.open()} />
		<Button label="Open Large Modal" onclick={() => largeModal.open()} />

		<Modal
			bind:this={demoModal}
			title="Example Modal"
			size="medium"
			actions={[
				{ label: 'Close', onclick: () => demoModal.close() },
				{ label: 'Save', variant: 'primary', onclick: () => demoModal.close() }
			]}
		>
			<p>This is a modal dialog with default content.</p>
			<p>
				You can click outside the modal or press Escape to close it. The modal includes focus
				management and keyboard navigation.
			</p>
		</Modal>

		<Modal
			bind:this={confirmModal}
			title="Confirm Delete"
			icon="Trash"
			size="small"
			closeOnBackdropClick={false}
			actions={[
				{ label: 'Cancel', onclick: () => confirmModal.close() },
				{
					label: 'Delete',
					variant: 'primary',
					onclick: () => {
						alert('Item deleted!');
						confirmModal.close();
					}
				}
			]}
		>
			<p>Are you sure you want to delete this item? This action cannot be undone.</p>
		</Modal>

		<Modal
			bind:this={largeModal}
			title="Large Modal with Subtitle"
			subtitle="This demonstrates the subtitle feature"
			icon="Info"
			size="large"
			actions={[{ label: 'Close', onclick: () => largeModal.close() }]}
		>
			<p>This modal uses title, subtitle, and icon props for a clean header.</p>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</p>
			<p>
				Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
				pariatur.
			</p>
		</Modal>
	</Group>

	<Group label="Tooltip">
		<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
			<button class="demo-btn" use:tooltip={'This is a tooltip on top'}>Hover me (top)</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on bottom', position: 'bottom' }}
			>
				Hover me (bottom)
			</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on left', position: 'left' }}
			>
				Hover me (left)
			</button>
			<button
				class="demo-btn"
				use:tooltip={{ content: 'This is a tooltip on right', position: 'right' }}
			>
				Hover me (right)
			</button>
			<span
				class="demo-icon"
				use:tooltip={'Tooltips work on any element!'}
				role="img"
				aria-label="Info"
			>
				ℹ️
			</span>
		</div>
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

<style>
	.demo-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #30313c;
		border-radius: 8px;
		background: #1e1f29;
		color: #eee;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.15s;
	}

	.demo-btn:hover {
		background: #2a2b37;
	}

	.demo-icon {
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
	}
</style>
