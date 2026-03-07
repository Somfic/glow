import type { NavItem } from './Navigation.svelte';
type Props = {
    title: string;
    navItems?: NavItem[];
    size?: 'normal' | 'full';
    children?: () => any;
};
declare const Page: import("svelte").Component<Props, {}, "">;
type Page = ReturnType<typeof Page>;
export default Page;
