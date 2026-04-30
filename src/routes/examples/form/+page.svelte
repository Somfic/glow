<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Stack from '$lib/layout/Stack.svelte';
	import Row from '$lib/layout/Row.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Card from '$lib/card/Card.svelte';
	import Field from '$lib/settings/Field.svelte';
	import Section from '$lib/settings/SettingsSection.svelte';
	import Input from '$lib/input/Input.svelte';
	import Modal from '$lib/modal/Modal.svelte';
	import { useModal } from '$lib/modal/modal.svelte.js';
	import { toast } from '$lib/toast/toast.svelte.js';
	import type { ComboboxOption, SelectOption } from '$lib/input/types.js';

	type Priority = 'low' | 'medium' | 'high' | 'critical';

	let title = $state('');
	let description = $state('');
	let email = $state('');
	let priority = $state<Priority>('medium');
	let tags = $state<string[]>([]);
	let dueDate = $state('');
	let dueTime = $state('');
	let agreed = $state(false);
	let notify = $state(true);

	type Errors = Partial<Record<'title' | 'description' | 'email' | 'agreed', string>>;
	let errors = $state<Errors>({});
	let submitting = $state(false);

	const priorityOptions: ComboboxOption[] = [
		{ value: 'low',      label: 'Low',      icon: 'CircleDashed', description: 'Nice to have, no rush' },
		{ value: 'medium',   label: 'Medium',   icon: 'Circle',       description: 'Standard priority' },
		{ value: 'high',     label: 'High',     icon: 'CircleDot',    description: 'Should be addressed soon' },
		{ value: 'critical', label: 'Critical', icon: 'CircleAlert',  description: 'Blocks production' }
	];

	const tagOptions: SelectOption[] = [
		{ value: 'bug',         label: 'bug' },
		{ value: 'feature',     label: 'feature' },
		{ value: 'docs',        label: 'docs' },
		{ value: 'a11y',        label: 'a11y' },
		{ value: 'performance', label: 'performance' }
	];

	const confirm = useModal();

	function validate(): Errors {
		const next: Errors = {};
		if (title.trim().length < 5) next.title = 'Title must be at least 5 characters.';
		if (description.trim().length < 20)
			next.description = 'Add a bit more detail — at least 20 characters.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			next.email = 'Enter a valid email address.';
		if (!agreed) next.agreed = 'You must accept the terms to submit.';
		return next;
	}

	async function submit() {
		errors = validate();
		if (Object.keys(errors).length > 0) {
			toast.error('Please fix the highlighted fields.');
			return;
		}
		submitting = true;
		await new Promise((r) => setTimeout(r, 600));
		submitting = false;
		confirm.show();
	}

	function reset() {
		title = '';
		description = '';
		email = '';
		priority = 'medium';
		tags = [];
		dueDate = '';
		dueTime = '';
		agreed = false;
		notify = true;
		errors = {};
	}

	// Earliest selectable due date is today.
	const todayISO = new Date().toISOString().slice(0, 10);

	function dismiss() {
		confirm.hide();
		toast.success('Submitted — thanks for the feedback.');
		reset();
	}
</script>

<svelte:head><title>Form example | Glow UI</title></svelte:head>

<Stack gap="lg" class="form-page">
	<Stack gap="xs">
		<Heading level={1}>Submit a feature request</Heading>
		<Text size="lg" variant="secondary">
			Demonstrates <code>&lt;Field&gt;</code> with the <code>error</code> prop, the
			<code>useModal()</code> rune, and the toast helper.
		</Text>
	</Stack>

	<Card padding="md">
		<Section title="Request" description="Tell us what you'd like to see." variant="plain">
			<Field
				label="Title"
				hint="A short, scannable summary."
				required
				error={errors.title}
			>
				<Input
					type="text"
					value={title}
					onChange={(v) => (title = v)}
					placeholder="e.g. Add a date range picker"
				/>
			</Field>

			<Field
				label="Description"
				hint="What problem are you trying to solve, and why?"
				layout="vertical"
				required
				error={errors.description}
			>
				<Input
					type="textarea"
					value={description}
					onChange={(v) => (description = v)}
					rows={5}
					placeholder="The current ImageUpload only accepts images. We need to upload PDFs in the support form…"
				/>
			</Field>

			<Field label="Priority" hint="How urgent is this for you?">
				<Input
					type="select"
					options={priorityOptions}
					value={priority}
					onChange={(v) => (priority = v as Priority)}
					placeholder="Select priority"
				/>
			</Field>

			<Field label="Target date" hint="Optional — when would you like to see this?">
				<Input
					type="date"
					value={dueDate}
					onChange={(v) => (dueDate = v)}
					min={todayISO}
					clearable
					placeholder="Pick a date"
				/>
			</Field>

			<Field label="Target time" hint="Optional — preferred time of day.">
				<Input
					type="time"
					value={dueTime}
					onChange={(v) => (dueTime = v)}
					step={15}
					clearable
					placeholder="Pick a time"
				/>
			</Field>

			<Field label="Tags" hint="Pick any that apply." layout="vertical">
				<Input
					type="multiselect"
					options={tagOptions}
					value={tags}
					onChange={(v) => (tags = v)}
					placeholder="Pick tags"
				/>
			</Field>
		</Section>

		<Section title="Contact" description="Where should we reply?" variant="plain">
			<Field
				label="Email"
				hint="We'll only use this to follow up on your request."
				required
				error={errors.email}
			>
				<Input
					type="text"
					value={email}
					onChange={(v) => (email = v)}
					placeholder="you@example.com"
					autocomplete="email"
				/>
			</Field>

			<Field label="Notifications" hint="Send me updates as the request progresses.">
				<Input
					type="toggle"
					checked={notify}
					onChange={(v) => (notify = v)}
					toggleLabel={notify ? 'On' : 'Off'}
				/>
			</Field>
		</Section>

		<Section title="Confirm" variant="plain">
			<Field
				label="I've read the contribution guidelines"
				required
				error={errors.agreed}
			>
				<Input
					type="checkbox"
					checked={agreed}
					onChange={(v) => (agreed = v)}
					checkboxLabel="Yes, I agree"
				/>
			</Field>
		</Section>

		<Row class="form-actions">
			<Button label="Reset" variant="ghost" onclick={reset} disabled={submitting} />
			<Spacer />
			<ButtonGroup>
				<Button label="Cancel" variant="ghost" disabled={submitting} />
				<Button
					label={submitting ? 'Submitting…' : 'Submit'}
					variant="primary"
					icon="Send"
					loading={submitting}
					onclick={submit}
				/>
			</ButtonGroup>
		</Row>
	</Card>
</Stack>

<Modal
	bind:open={confirm.open}
	title="Request submitted"
	subtitle="We'll triage and reply within a few days."
	icon="CircleCheck"
	size="small"
	footer={confirmFooter}
>
	<Stack gap="sm">
		<Text>Thanks for taking the time to write this up.</Text>
		<Card padding="sm" variant="secondary">
			<Stack gap="xs">
				<Text size="sm" variant="secondary">Title</Text>
				<Text weight="semibold">{title}</Text>
				<Text size="sm" variant="secondary">Priority</Text>
				<Text>{priorityOptions.find((o) => o.value === priority)?.label}</Text>
				{#if tags.length}
					<Text size="sm" variant="secondary">Tags</Text>
					<Text>{tags.join(', ')}</Text>
				{/if}
			</Stack>
		</Card>
	</Stack>
</Modal>

{#snippet confirmFooter()}
	<Spacer />
	<Button label="Close" variant="primary" onclick={dismiss} />
{/snippet}

<style lang="scss">
	:global(.form-page) {
		max-width: 720px;
		margin: 2rem auto;
		padding: 0 1.5rem;

		// The form is a focused, single-task surface — the default Section
		// spacing tokens (sized for sprawling settings panels) feel too airy
		// here. Tighten just the Section knobs without touching field density.
		--glow-section-spacing: 0.75rem;
		--glow-section-header-gap: 0.375rem;
		--glow-section-gap: 0.125rem;
	}

	:global(.form-actions) {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}
</style>
