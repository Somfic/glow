<script lang="ts">
	import type { NavItem } from './Navigation.svelte';
	import Navigation from './Navigation.svelte';

	type Props = {
		title: string;
		navItems?: NavItem[];
		size?: 'normal' | 'full';
		children?: () => any;
	};

	let { title, navItems, size = 'normal', children }: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class={`page ${size}`}>
	<div class="header">
		<div class="navigation">
			<div class="left"><div class="title">{title}</div></div>
			<div class="center">
				<Navigation navItems={navItems ?? []} />
			</div>
			<div class="right"></div>
		</div>
	</div>
	<div class="content">
		<article>
			{@render children?.()}
		</article>
	</div>
</div>

<style lang="scss">
	@use '../style/theme.scss' as *;

	.page {
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		align-items: center;

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 2rem;
			width: 100%;
			max-width: 1200px;

			.navigation {
				display: flex;
				align-items: center;
				justify-content: space-between;
				background-color: $bg-surface;
				border-radius: 100px;
				padding: 0.5rem 2rem;
				width: 100%;
				max-width: 1200px;
				margin: 1rem;
			}
		}

		.header,
		.content {
			@media only screen and (max-width: 600px) {
				padding: 0 0.5rem;
			}

			@media only screen and (min-width: 600px) {
				padding: 0 2rem;
			}

			@media only screen and (min-width: 768px) {
				padding: 0 3rem;
			}

			@media only screen and (min-width: 768px) {
				padding: 0 4rem;
			}

			@media only screen and (min-width: 1200px) {
				padding: 0 5rem;
			}
		}

		&.normal .content {
			display: flex;
			flex-direction: column;
			width: 100%;
			max-width: 1111px;
		}

		&.full .content {
			width: 100%;
		}
	}
</style>
