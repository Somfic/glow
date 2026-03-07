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

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
.page {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}
.page .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 2rem;
  width: 100%;
  max-width: 1400px;
}
.page .header .navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: hsl(240, 11%, 9%);
  border-radius: 100px;
  padding: 0.5rem 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 1rem;
}
@media only screen and (max-width: 600px) {
  .page .header,
  .page .content {
    padding: 0 0.5rem;
  }
}
@media only screen and (min-width: 600px) {
  .page .header,
  .page .content {
    padding: 0 2rem;
  }
}
@media only screen and (min-width: 768px) {
  .page .header,
  .page .content {
    padding: 0 3rem;
  }
}
@media only screen and (min-width: 768px) {
  .page .header,
  .page .content {
    padding: 0 4rem;
  }
}
@media only screen and (min-width: 1200px) {
  .page .header,
  .page .content {
    padding: 0 5rem;
  }
}
.page.normal .content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1111px;
}
.page.full .content {
  width: 100%;
}</style>
