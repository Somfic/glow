<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import ImageUpload from '$lib/input/ImageUpload.svelte';
	import ImageCropper from '$lib/input/ImageCropper.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import Field from '$lib/settings/Field.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';

	// Each demo keeps a blob URL for the picked file. In a real app you'd hand
	// the File to your uploader and store the URL it returns instead.
	let iconSrc = $state<string | null>(null);
	let profileSrc = $state<string | null>(null);
	let croppedSrc = $state<string | null>(null);
	let slowSrc = $state<string | null>(null);

	function accept(file: File, set: (url: string) => void) {
		set(URL.createObjectURL(file));
		toast.success(`Picked ${file.name}`);
	}

	// Demonstrates the built-in uploading state: returning a promise makes the
	// component show a spinner until it settles.
	async function slowUpload(file: File) {
		await new Promise((r) => setTimeout(r, 1500));
		slowSrc = URL.createObjectURL(file);
		toast.success('Uploaded');
	}

	// Standalone cropper demo — pick a file, then crop it in the modal.
	let cropperSrc = $state<string | null>(null);
	let cropperResult = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();

	function pickForCropper(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) cropperSrc = URL.createObjectURL(file);
		(e.target as HTMLInputElement).value = '';
	}
</script>

{#snippet codeCell(value)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Image Upload | Glow UI</title></svelte:head>

<Heading level={1}>Image Upload</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	A click-to-pick avatar or thumbnail control with a live preview, an optional crop step, and a
	built-in uploading state. For multi-file drag-and-drop, use
	<Link href="/components/file-upload">FileUpload</Link> instead.
</Text>

<Card title="Sizes" id="sizes">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Two presets. <Code>icon</Code> is the small square for app icons and thumbnails;
		<Code>profile</Code> is the larger circle for avatars. Pick a file to see the preview replace the
		placeholder — hover it for the remove button.
	</Text>
	<Flex direction="horizontal" gap="xl" align="start">
		<Flex gap="sm" align="center">
			<ImageUpload
				size="icon"
				src={iconSrc}
				onUpload={(f) => accept(f, (u) => (iconSrc = u))}
				onRemove={() => (iconSrc = null)}
			/>
			<Text size="sm" variant="secondary"><Code>icon</Code></Text>
		</Flex>
		<Flex gap="sm" align="center">
			<ImageUpload
				size="profile"
				src={profileSrc}
				onUpload={(f) => accept(f, (u) => (profileSrc = u))}
				onRemove={() => (profileSrc = null)}
			/>
			<Text size="sm" variant="secondary"><Code>profile</Code></Text>
		</Flex>
	</Flex>
</Card>

<Card title="With cropping" id="crop">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>crop</Code> routes the picked file through a full-screen cropper before
		<Code>onUpload</Code> fires — so what you receive is the cropped JPEG, not the original.
		<Code>aspectRatio</Code> locks the crop box; leave it off for a free crop. Once an image is set,
		clicking it re-opens the cropper on the existing image rather than the file picker; the small
		<Code>ImagePlus</Code> button swaps in a different file.
	</Text>
	<Flex direction="horizontal" gap="xl" align="start">
		<Flex gap="sm" align="center">
			<ImageUpload
				size="profile"
				crop
				aspectRatio={1}
				src={croppedSrc}
				onUpload={(f) => accept(f, (u) => (croppedSrc = u))}
				onRemove={() => (croppedSrc = null)}
			/>
			<Text size="sm" variant="secondary"><Code>{'aspectRatio={1}'}</Code></Text>
		</Flex>
	</Flex>
</Card>

<Card title="Uploading state" id="uploading">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		If <Code>onUpload</Code> returns a promise, the control shows a spinner and ignores further clicks
		until it settles — so you don't have to thread a <Code>loading</Code> prop through. This demo
		stalls for 1.5s.
	</Text>
	<ImageUpload
		size="icon"
		src={slowSrc}
		onUpload={slowUpload}
		onRemove={() => (slowSrc = null)}
	/>
</Card>

<Card title="Restricting file types" id="accept">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>accept</Code> is passed straight to the underlying file input. Note this is a hint to the
		picker, not a guarantee — validate on the server too.
	</Text>
	<CodeBlock
		language="svelte"
		code={`<ImageUpload accept="image/png,image/webp" {onUpload} />`}
	/>
</Card>

<Card title="Inside a form" id="field">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Wrap it in a <Link href="/components/settings">Field</Link> to pick up the standard label, hint,
		and row layout.
	</Text>
	<Field label="Workspace icon" hint="Square PNG or SVG, at least 256×256.">
		<ImageUpload
			size="icon"
			src={iconSrc}
			onUpload={(f) => accept(f, (u) => (iconSrc = u))}
			onRemove={() => (iconSrc = null)}
		/>
	</Field>
</Card>

<Card title="ImageCropper on its own" id="cropper">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>ImageCropper</Code> is the modal <Code>ImageUpload</Code> opens, and it's exported
		separately for when you already have an image and just need to crop it. Mount it conditionally —
		it locks page scroll on mount and cleans up on destroy. <Code>onConfirm</Code> hands you a
		<Code>Blob</Code>; Enter confirms and Escape cancels.
	</Text>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		onchange={pickForCropper}
		style="display: none;"
	/>
	<Flex direction="horizontal" gap="md" align="center">
		<Button variant="secondary" label="Pick an image to crop" icon="Crop" onclick={() => fileInput?.click()} />
		{#if cropperResult}
			<img class="result" src={cropperResult} alt="Cropped result" />
			<Button variant="ghost" icon="X" onclick={() => (cropperResult = null)} />
		{/if}
	</Flex>

	{#if cropperSrc}
		<ImageCropper
			src={cropperSrc}
			aspectRatio={16 / 9}
			onConfirm={(blob) => {
				cropperResult = URL.createObjectURL(blob);
				cropperSrc = null;
				toast.success('Cropped to 16:9');
			}}
			onCancel={() => (cropperSrc = null)}
		/>
	{/if}
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script lang="ts">
  import { ImageUpload } from 'glow';

  let avatar = $state<string | null>(user.avatarUrl);

  // Returning a promise puts the control into its uploading state.
  async function upload(file: File) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/avatar', { method: 'POST', body });
    avatar = (await res.json()).url;
  }
</script>

<ImageUpload
  size="profile"
  crop
  aspectRatio={1}
  src={avatar}
  onUpload={upload}
  onRemove={() => (avatar = null)}
/>`}
	/>
</Card>

<Card title="ImageUpload props" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'src', type: 'string | null', default: 'null', description: 'Current image URL. Show the preview by keeping this in sync with your upload result.' },
			{ prop: 'size', type: "'icon' | 'profile'", default: 'icon', description: 'Small square, or larger circle.' },
			{ prop: 'accept', type: 'string', default: 'image/*', description: 'File-input accept attribute.' },
			{ prop: 'crop', type: 'boolean', default: 'false', description: 'Route the picked file through ImageCropper before onUpload.' },
			{ prop: 'aspectRatio', type: 'number', default: '—', description: 'Locks the crop box ratio. Free crop when omitted.' },
			{ prop: 'onUpload', type: '(file: File) => void | Promise<void>', default: '—', description: 'Receives the picked (or cropped) file. Return a promise to show the uploading state.' },
			{ prop: 'onRemove', type: '() => void', default: '—', description: 'Renders the remove button when provided.' }
		]}
	/>
</Card>

<Card title="ImageCropper props" id="cropper-props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{ prop: 'src', type: 'string', default: '—', description: 'Required. Image to crop — an object URL or a remote URL.' },
			{ prop: 'aspectRatio', type: 'number', default: '—', description: 'Locks the crop box ratio. Free crop when omitted.' },
			{ prop: 'onConfirm', type: '(blob: Blob) => void', default: '—', description: 'Required. Fired with the cropped JPEG. Also bound to Enter.' },
			{ prop: 'onCancel', type: '() => void', default: '—', description: 'Required. Fired by the cancel button and Escape.' }
		]}
	/>
</Card>

<Card title="Notes" id="notes">
	<Flex gap="sm">
		<Text size="sm">
			<strong>Revoke your object URLs.</strong> The demos on this page create blob URLs with
			<Code>URL.createObjectURL</Code> and never release them, which is fine for a docs page and a
			leak in an app. Call <Code>URL.revokeObjectURL</Code> once the image is no longer displayed.
		</Text>
		<Text size="sm">
			<strong>Cropped output is JPEG.</strong> The cropper re-encodes to <Code>image/jpeg</Code>, so
			transparency is lost. Skip <Code>crop</Code> if you need to preserve a PNG's alpha channel.
		</Text>
	</Flex>
</Card>

<style lang="scss">
	.result {
		height: 72px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
