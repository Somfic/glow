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

<style>@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap");
nav {
  display: flex;
  align-items: center;
  background-color: #1e1f29;
  border-radius: 200px;
}
nav a {
  padding: 0.5em 1.5em;
  color: #eee;
  text-decoration: none;
  border-radius: 100px;
}
nav a:hover {
  background-color: rgb(29.054655, 26.354655, 41.964345);
}
nav a:active {
  background-color: rgb(25.82636, 23.42636, 37.30164);
}
nav a.is-active {
  background-color: #8B6DED;
  font-weight: 700;
}
nav a.is-active:hover {
  background-color: rgb(114.5268292683, 78.1975609756, 233.2024390244);
}
nav a.is-active:active {
  background-color: rgb(90.0536585366, 47.3951219512, 229.4048780488);
}</style>
