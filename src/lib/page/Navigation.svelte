<script lang="ts" module>
	export type NavItem = {
		label: string;
		href: string;
	};
</script>

<script lang="ts">
	type Props = {
		navItems: NavItem[];
	};

	let { navItems }: Props = $props();

	let activeIndex = $state(-1);

	$effect(() => {
		activeIndex = navItems.findIndex((item) => item.href === window.location.pathname);
	});
</script>

<nav>
	{#each navItems as item, index}
		<a href={item.href} class:is-active={index === activeIndex}>{item.label}</a>
	{/each}
</nav>

<style lang="scss">
	@use '../style/theme.scss' as *;

	nav {
		display: flex;
		align-items: center;
		background-color: $bg-surface-element;
		border-radius: 200px;

		a {
			padding: 0.5em 1.5em;
			color: $fg;
			text-decoration: none;
			border-radius: 100px;

			&:hover {
				background-color: $secondary-hover;
			}

			&:active {
				background-color: $secondary-active;
			}

			&.is-active {
				background-color: $primary;
				font-weight: 700;

				&:hover {
					background-color: $primary-hover;
				}

				&:active {
					background-color: $primary-active;
				}
			}
		}
	}
</style>
