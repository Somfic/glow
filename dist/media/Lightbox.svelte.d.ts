export type RelatedMedia = {
    src: string;
    type?: 'image' | 'video';
    alt?: string;
    active?: boolean;
    onClick: () => void;
};
type $$ComponentProps = {
    open: boolean;
    src: string;
    type?: 'image' | 'video';
    alt?: string;
    poster?: string;
    related?: RelatedMedia[];
    startPosition?: number;
    preloadedVideo?: HTMLVideoElement;
    onClose: () => void;
    children?: import('svelte').Snippet;
};
declare const Lightbox: import("svelte").Component<$$ComponentProps, {}, "">;
type Lightbox = ReturnType<typeof Lightbox>;
export default Lightbox;
