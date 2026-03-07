export type NavItem = {
    label: string;
    href: string;
};
type Props = {
    navItems: NavItem[];
};
declare const Navigation: import("svelte").Component<Props, {}, "">;
type Navigation = ReturnType<typeof Navigation>;
export default Navigation;
