import 'cropperjs/dist/cropper.css';
type $$ComponentProps = {
    src: string;
    aspectRatio?: number;
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
};
declare const ImageCropper: import("svelte").Component<$$ComponentProps, {}, "">;
type ImageCropper = ReturnType<typeof ImageCropper>;
export default ImageCropper;
