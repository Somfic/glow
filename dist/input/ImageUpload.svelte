<script lang="ts">
	import Icon from '../icon/Icon.svelte';
	import ImageCropper from './ImageCropper.svelte';

	type Size = 'icon' | 'profile';

	let {
		src = null,
		size = 'icon',
		accept = 'image/*',
		crop = false,
		aspectRatio,
		onUpload,
		onRemove
	}: {
		src?: string | null;
		size?: Size;
		accept?: string;
		crop?: boolean;
		aspectRatio?: number;
		onUpload?: (file: File) => void | Promise<void>;
		onRemove?: () => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let uploading = $state(false);
	let showCropper = $state(false);
	let cropImageSrc = $state<string | null>(null);
	let originalFile = $state<File | null>(null);

	function handleClick() {
		if (crop && src) {
			// Open cropper with existing image
			cropImageSrc = src;
			originalFile = null;
			showCropper = true;
		} else {
			fileInput?.click();
		}
	}

	function handleChangeImage(event: MouseEvent) {
		event.stopPropagation();
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file || !onUpload) return;

		if (crop) {
			// Show cropper modal
			originalFile = file;
			cropImageSrc = URL.createObjectURL(file);
			showCropper = true;
		} else {
			// Direct upload without cropping
			await doUpload(file);
		}

		// Reset input so same file can be selected again
		target.value = '';
	}

	async function doUpload(file: File) {
		if (!onUpload) return;

		const result = onUpload(file);
		if (result instanceof Promise) {
			uploading = true;
			try {
				await result;
			} finally {
				uploading = false;
			}
		}
	}

	function handleCropConfirm(blob: Blob) {
		// Convert blob to file with original name
		const fileName = originalFile?.name || 'cropped-image.jpg';
		const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

		// Clean up - only revoke if we created the URL (from file input)
		if (cropImageSrc && originalFile) {
			URL.revokeObjectURL(cropImageSrc);
		}
		showCropper = false;
		cropImageSrc = null;
		originalFile = null;

		// Upload the cropped file
		doUpload(croppedFile);
	}

	function handleCropCancel() {
		// Only revoke if we created the URL (from file input)
		if (cropImageSrc && originalFile) {
			URL.revokeObjectURL(cropImageSrc);
		}
		showCropper = false;
		cropImageSrc = null;
		originalFile = null;
	}

	function handleRemove(event: MouseEvent) {
		event.stopPropagation();
		onRemove?.();
	}
</script>

<div class="image-upload {size}" class:has-image={!!src}>
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		onchange={handleFileChange}
		class="file-input"
	/>
	<div
		class="upload-btn"
		class:disabled={uploading}
		onclick={uploading ? undefined : handleClick}
		onkeydown={(e) => e.key === 'Enter' && !uploading && handleClick()}
		role="button"
		tabindex="0"
	>
		{#if uploading}
			<div class="spinner"></div>
		{:else if src}
			<img {src} alt="" />
			<div class="image-actions">
				{#if crop}
					<button type="button" class="action-btn change-btn" onclick={handleChangeImage} title="Change image">
						<Icon name="ImagePlus" size={12} />
					</button>
				{/if}
				{#if onRemove}
					<button type="button" class="action-btn remove-btn" onclick={handleRemove} title="Remove">
						<Icon name="X" size={12} />
					</button>
				{/if}
			</div>
		{:else}
			<Icon name="Camera" size={24} />
			<span class="upload-text">Upload</span>
		{/if}
	</div>
</div>

{#if showCropper && cropImageSrc}
	<ImageCropper
		src={cropImageSrc}
		{aspectRatio}
		onConfirm={handleCropConfirm}
		onCancel={handleCropCancel}
	/>
{/if}

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.image-upload {
  display: inline-block;
}
.image-upload.icon .upload-btn {
  width: 80px;
  height: 80px;
}
.image-upload.profile .upload-btn {
  width: 80px;
  height: 133px;
}
.file-input {
  display: none;
}
.upload-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: hsl(240, 11%, 9%);
  border: 2px dashed #30313C;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 150ms ease;
  color: rgba(238, 238, 238, 0.5);
}
.upload-btn:hover:not(.disabled) {
  border-color: #8B6DED;
}
.upload-btn.disabled {
  cursor: wait;
  pointer-events: none;
}
.upload-btn img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-btn .upload-text {
  font-size: 0.7rem;
}
.image-actions {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 150ms ease;
}
.upload-btn:hover .image-actions {
  opacity: 1;
}
.action-btn {
  width: 1.25rem;
  height: 1.25rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 150ms ease;
}
.action-btn:hover {
  background: #8B6DED;
}
.remove-btn:hover {
  background: #ef4444 !important;
}
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #30313C;
  border-top-color: #8B6DED;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}</style>
