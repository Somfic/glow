type Size = 'icon' | 'profile';
type $$ComponentProps = {
    src?: string | null;
    size?: Size;
    accept?: string;
    crop?: boolean;
    aspectRatio?: number;
    onUpload?: (file: File) => void | Promise<void>;
    onRemove?: () => void;
};
declare const ImageUpload: import("svelte").Component<$$ComponentProps, {}, "">;
type ImageUpload = ReturnType<typeof ImageUpload>;
export default ImageUpload;
