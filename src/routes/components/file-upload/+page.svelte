<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Button from '$lib/button/Button.svelte';
	import FileUpload from '$lib/file-upload/FileUpload.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';

	let basicFiles = $state<File[]>([]);
	let imageFiles = $state<File[]>([]);
	let avatarFiles = $state<File[]>([]);
	let basicUploading = $state(false);
	let imageUploading = $state(false);
	let avatarUploading = $state(false);

	async function fakeUpload(label: string, count: number, ms = 800): Promise<void> {
		await new Promise((r) => setTimeout(r, ms));
		toast.success(`${label}: ${count} file${count === 1 ? '' : 's'} uploaded`);
	}
</script>

<svelte:head><title>File Upload | Glow UI</title></svelte:head>

<Heading level={1}>File Upload</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 0.6rem;">
	Drag-and-drop or click-to-pick file input with type / size / count validation, live previews
	for image and video files, removable rows, and built-in image cropping.
</Text>
<Text size="sm" variant="secondary" style="margin-bottom: 2rem;">
	The component is purely a <em>picker</em> — files appear in the staged list as soon as the user
	drops them. Your host code decides when to send them: either immediately on
	<Code>onChange</Code>, or via an explicit "Upload" button (as below). Each demo here uses the
	explicit pattern.
</Text>

<Card title="Default — any file, multi-file">
	<FileUpload
		bind:files={basicFiles}
		hint="Any file, any size"
		onError={(m) => toast.warning(m)}
	/>
	{#if basicFiles.length > 0}
		<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.85rem;">
			<Text size="sm" variant="secondary">
				Staged: <Code>{basicFiles.length} file{basicFiles.length === 1 ? '' : 's'}</Code>
			</Text>
			<div style="display: flex; gap: 0.4rem;">
				<Button
					label="Clear"
					variant="ghost"
					disabled={basicUploading}
					onclick={() => {
						basicFiles = [];
					}}
				/>
				<Button
					label={basicUploading ? 'Uploading…' : 'Upload'}
					variant="primary"
					disabled={basicUploading}
					onclick={async () => {
						basicUploading = true;
						await fakeUpload('Basic', basicFiles.length);
						basicFiles = [];
						basicUploading = false;
					}}
				/>
			</div>
		</div>
	{/if}
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Images & video — capped at 5 files / 10MB · free crop">
	<FileUpload
		bind:files={imageFiles}
		accept="image/*,video/*"
		maxFiles={5}
		maxSize={10 * 1024 * 1024}
		emptyTitle="Drop media files"
		emptySubtitle="or click to pick from your device"
		hint="Images & video · up to 5 files · 10MB each"
		icon="ImagePlay"
		onError={(m) => toast.warning(m)}
	/>
	{#if imageFiles.length > 0}
		<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.85rem;">
			<Text size="sm" variant="secondary">
				Staged: <Code>{imageFiles.length}</Code>
			</Text>
			<div style="display: flex; gap: 0.4rem;">
				<Button
					label="Clear"
					variant="ghost"
					disabled={imageUploading}
					onclick={() => {
						imageFiles = [];
					}}
				/>
				<Button
					label={imageUploading ? 'Uploading…' : 'Upload all'}
					variant="primary"
					disabled={imageUploading}
					onclick={async () => {
						imageUploading = true;
						await fakeUpload('Media', imageFiles.length);
						imageFiles = [];
						imageUploading = false;
					}}
				/>
			</div>
		</div>
	{/if}
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="Single file — avatar with 1:1 crop">
	<Text size="sm" variant="secondary" style="margin-bottom: 0.75rem;">
		Pass a number to <Code>crop</Code> to lock the aspect ratio. Click the crop icon on the
		row to re-crop.
	</Text>
	<FileUpload
		bind:files={avatarFiles}
		multiple={false}
		accept="image/*"
		crop={1}
		emptyTitle="Drop a photo"
		emptySubtitle="or click to choose"
		hint="Image · 1 file · square crop"
		icon="CircleUser"
		onError={(m) => toast.warning(m)}
	/>
	{#if avatarFiles.length > 0}
		<div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.85rem;">
			<Text size="sm" variant="secondary">Staged: <Code>1 avatar</Code></Text>
			<div style="display: flex; gap: 0.4rem;">
				<Button
					label="Clear"
					variant="ghost"
					disabled={avatarUploading}
					onclick={() => {
						avatarFiles = [];
					}}
				/>
				<Button
					label={avatarUploading ? 'Saving…' : 'Save avatar'}
					variant="primary"
					disabled={avatarUploading}
					onclick={async () => {
						avatarUploading = true;
						await fakeUpload('Avatar', 1);
						avatarFiles = [];
						avatarUploading = false;
					}}
				/>
			</div>
		</div>
	{/if}
</Card>

<div style="margin-top: 1.5rem;"></div>

<Card title="API">
	<CodeBlock
		language="svelte"
		code={`<script>
    import { FileUpload } from 'glow';
    let files = $state([]);
<\/script>

<FileUpload
    bind:files
    accept="image/*,video/*"
    maxFiles={5}
    maxSize={10 * 1024 * 1024}
    crop={1}                       // 1:1 crop · 'free' for unrestricted · false to disable
    hint="Images & video · up to 5 files · 10MB each"
    onChange={(files) => doSomething(files)}
    onError={(message) => toast.warning(message)}
/>

{#if files.length > 0}
    <Button label="Upload" onclick={() => uploadAll(files)} />
{/if}`}
	/>
</Card>
