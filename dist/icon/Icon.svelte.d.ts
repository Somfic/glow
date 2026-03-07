export { type IconName } from './types.js';
import { type IconName } from './types.js';
import type { Component } from 'svelte';
type $$ComponentProps = {
    name: IconName;
    size?: number;
};
declare const Icon: Component<$$ComponentProps, {}, "">;
type Icon = ReturnType<typeof Icon>;
export default Icon;
