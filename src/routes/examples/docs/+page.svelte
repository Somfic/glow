<script lang="ts">
	import Banner from '$lib/banner/Banner.svelte';
	import Breadcrumb from '$lib/breadcrumb/Breadcrumb.svelte';
	import Code from '$lib/code/Code.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Link from '$lib/typography/Link.svelte';
	import Stepper from '$lib/stepper/Stepper.svelte';
	import TableOfContents from '$lib/navigation/TableOfContents.svelte';
	import type { BreadcrumbItem } from '$lib/breadcrumb/Breadcrumb.svelte';

	// Verbatim content from the EliteVA docs site (Somfic/docs), which is built
	// on Glow — this page is here so the prose surface gets exercised against
	// real writing rather than lorem ipsum: long headings, inline code mid
	// sentence, Windows paths full of backslashes, and a $ amount that a
	// naive markdown pass would eat.
	const crumbs: BreadcrumbItem[] = [
		{ label: 'docs', href: '/examples/docs', icon: 'House' },
		{ label: 'projects', href: '/examples/docs' },
		{ label: 'eliteva', href: '/examples/docs' },
		{ label: 'installation' }
	];

	// Nothing here validates, so every step navigates and the reader drives it
	// as they work through the list.
	let step = $state(0);
</script>

<svelte:head><title>Documentation page | Glow UI</title></svelte:head>

<div class="doc">
	<div class="body">
		<Breadcrumb items={crumbs} />

		<!-- The TOC scans this container with `querySelector`. A class would be
		     ambiguous — the shell and the sidebar both use `.content`, and the
		     sidebar's comes first in the document — so it gets an id. -->
		<div id="doc-content">
			<h1 id="installation">Installation</h1>

			<p>This guide walks you through installing the EliteVA plugin into your VoiceAttack setup.</p>

			<Banner
				variant="info"
				label="You should have Elite: Dangerous installed before starting. If you don't yet, do that first and come back."
			/>

			<h2 id="prerequisites">Prerequisites</h2>

			<p>A few things have to be in place before EliteVA can do anything useful.</p>

			<h3 id="eliteapi">EliteAPI</h3>

			<p>
				EliteAPI is the backbone EliteVA works through, so it has to be installed for the plugin to
				work properly. Download the <Code>setup.exe</Code> of the latest
				<Link href="https://github.com/Somfic/EliteAPI/releases/" external>EliteAPI release</Link>
				and run it before continuing.
			</p>

			<h3 id="voiceattack">VoiceAttack</h3>

			<p>
				EliteVA is a plugin for VoiceAttack. If you do not have it yet, download it from the
				<Link href="https://voiceattack.com/Default.aspx#download-1" external>
					VoiceAttack website
				</Link>.
			</p>

			<p>
				There is a free version, but making full use of EliteVA needs a licence, which costs $10.00
				— sales tax may apply on top.
			</p>

			<p>
				Once VoiceAttack is installed, tick <strong>Enable Plugin Support</strong> under the
				<strong>General</strong> tab of the VoiceAttack options menu.
			</p>

			<h3 id="zip-extractor">Zip file extractor</h3>

			<p>
				You also need something that opens <Code>.zip</Code> archives.
				<Link href="https://www.win-rar.com/start.html?&L=0" external>WinRAR</Link> is a good free choice,
				and the extractor built into Windows is sufficient too.
			</p>

			<h2 id="installing">Installing EliteVA</h2>

			<Stepper
				orientation="vertical"
				navigation="all"
				bind:current={step}
				steps={[
					{
						label: 'Download',
						description: 'Grab the latest release from the EliteVA GitHub releases page.'
					},
					{
						label: 'Find your VoiceAttack folder',
						description:
							'Usually C:\\Program Files (x86)\\VoiceAttack, or under Steam at C:\\Program Files (x86)\\Steam\\steamapps\\common\\VoiceAttack.'
					},
					{
						label: 'Create Apps\\EliteVA',
						description:
							'The VoiceAttack folder should contain an Apps directory — create it if it is missing — and inside it a new folder named EliteVA.'
					},
					{
						label: 'Extract there',
						description:
							'Move EliteVA.zip into that folder and extract it in place. EliteVA.dll and a Bindings folder should appear, along with a template profile called EliteVA.vap listing every command the plugin supports.'
					},
					{
						label: 'Restart VoiceAttack',
						description: 'The plugin is loaded on startup, so it needs a restart to be picked up.'
					}
				]}
			/>

			<p>
				The latest version can always be found on the
				<Link href="https://github.com/Somfic/EliteVA/releases/latest" external>
					EliteVA GitHub releases page
				</Link>.
			</p>

			<h3 id="double-check">Let's double check that</h3>

			<p>You should now have these in your VoiceAttack directory:</p>

			<CodeBlock
				language="text"
				code={`VoiceAttack\\Apps\\EliteVA\\EliteVA.dll
VoiceAttack\\Apps\\EliteVA\\Bindings`}
			/>

			<p>If the installation succeeded, VoiceAttack logs something along these lines on startup:</p>

			<CodeBlock
				language="text"
				code={`Plugin support enabled
Initializing EliteAPI v3.X.X.X
EliteAPI has started
Plugin 'EliteVA' initialized`}
			/>

			<h3 id="still-having-issues">Still having issues?</h3>

			<p>
				If those messages do not appear, or another error shows up, double check that you followed
				each step. If the problem persists, contact Somfic in the
				<Link href="https://www.discord.gg/jwpFUPZ" external>EliteAPI Discord</Link> for help.
			</p>

			<h2 id="best-practices">Best practices</h2>

			<p>
				Start VoiceAttack before loading up Elite: Dangerous. That way the API and any associated
				profiles track the game's events as accurately as possible.
			</p>

			<p>Fly dangerously, commander. <strong>o7</strong></p>
		</div>
	</div>

	<aside class="toc">
		<TableOfContents container="#doc-content" levels={[1, 2, 3]} />
	</aside>
</div>

<style lang="scss">
	.doc {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.body {
		flex: 1;
		// Without this a wide code block stretches the flex item instead of
		// scrolling inside it, and the rail gets pushed off-screen.
		min-width: 0;
	}

	.toc {
		flex: 0 0 auto;
		position: sticky;
		top: 0;
	}

	// The rail is a convenience, not content — below this width the prose needs
	// the space more than the reader needs the shortcut.
	@media (max-width: 1100px) {
		.toc {
			display: none;
		}
	}
</style>
