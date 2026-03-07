import { type Snippet } from 'svelte';
import { type IconName } from '../icon/Icon.svelte';
type BadgeVariant = 'default' | 'success' | 'warning';
type Action = {
    icon: IconName;
    label?: string;
    onclick: () => void;
};
type Tag = {
    label: string;
    color?: string;
    image?: string;
};
type MediaContentProps = {
    isHovering: boolean;
    showOverlay: boolean;
    fit: 'cover' | 'contain';
    shouldLoad: boolean;
};
type $$ComponentProps = {
    src?: string;
    hoverSrc?: string;
    type?: 'image' | 'video' | 'auto';
    fit?: 'cover' | 'contain';
    poster?: string;
    aspectRatio?: string;
    placeholder?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    lazy?: boolean;
    badge?: string;
    badgeVariant?: BadgeVariant;
    badgeContent?: Snippet;
    actions?: Action[];
    title?: string;
    subtitle?: string;
    tags?: Tag[];
    bottomContent?: Snippet;
    mediaContent?: Snippet<[MediaContentProps]>;
    selected?: boolean;
    loading?: boolean;
    onclick?: () => void;
    onclickWithProgress?: (progress: number, videoEl?: HTMLVideoElement) => void;
};
declare const Card: import("svelte").Component<$$ComponentProps, {}, "">;
type Card = ReturnType<typeof Card>;
export default Card;
