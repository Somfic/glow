<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import AnimatedText from '$lib/animated-text/AnimatedText.svelte';
	import Button from '$lib/button/Button.svelte';
	import Flex from '$lib/layout/Flex.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Table from '$lib/data/Table.svelte';
	import Code from '$lib/code/Code.svelte';
	import Link from '$lib/typography/Link.svelte';

	const answer =
		'A reveal is not the same thing as a loading state. It says the answer is arriving, which is worth showing when it genuinely is — and worth skipping when the text was already there.';

	let basic: AnimatedText | undefined = $state();
	let granular: AnimatedText | undefined = $state();
	let paced: AnimatedText | undefined = $state();
	let streaming: AnimatedText | undefined = $state();

	let grain = $state<'character' | 'word' | 'line'>('word');
	const grains = ['character', 'word', 'line'] as const;

	const poem = `Text arrives one unit at a time.
The units here are whole lines.
Nothing below this moves while they land.`;

	// The streaming demo: `text` grows under the reveal, exactly the way a
	// response from a model does. The reveal keeps its place because the new
	// string still starts with the old one.
	const chunks = [
		'Streaming works because ',
		'the component keeps whatever the old and new strings share. ',
		'Appending never restarts the reveal, ',
		'and replacing it outright rewinds only to where the two texts part company.'
	];
	let streamed = $state(chunks[0]);
	let sent = $state(1);
	let timer: ReturnType<typeof setInterval> | undefined;

	function stream() {
		clearInterval(timer);
		streamed = chunks[0];
		sent = 1;
		streaming?.restart();
		timer = setInterval(() => {
			if (sent >= chunks.length) return clearInterval(timer);
			streamed += chunks[sent++];
		}, 900);
	}

	let playing = $state(true);
	let done = $state(false);
</script>

{#snippet codeCell(value: string)}
	<Code>{value}</Code>
{/snippet}

<svelte:head><title>Animated Text | Glow UI</title></svelte:head>

<Heading level={1}>Animated Text</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Text that arrives rather than appears — the shape of a streamed answer, a terminal writing itself,
	a hero line that lands as you read it. It is a presentation of text you already have, not a
	loading state: for work whose size you know, reach for
	<Link href="/components/progress">Progress</Link>, and for content that has not arrived yet use
	<Link href="/components/skeleton">Skeleton</Link>.
</Text>

<Card title="Reveal" id="reveal">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		One word at a time, with a caret at the head. The whole paragraph is in the DOM from the first
		frame — the unrevealed part is transparent, not absent — so the line breaks are decided once and
		nothing on the page moves while the words land.
	</Text>
	<Text size="lg" style="margin-bottom: 1rem;">
		<AnimatedText bind:this={basic} text={answer} />
	</Text>
	<Button variant="secondary" label="Replay" onclick={() => basic?.restart()} />
</Card>

<Card title="Granularity" id="granularity">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>granularity</Code> picks what counts as a step. <Code>word</Code> is the default:
		<Code>character</Code> is one span per glyph, which on a long paragraph is a great deal of DOM for
		a difference few readers notice past the first line, and <Code>line</Code> suits anything already
		written in lines. Each mode has its own default speed, because 55 characters a second and 55 words
		a second are not the same experience.
	</Text>
	<Flex direction="horizontal" gap="sm" align="center" style="margin-bottom: 1rem;">
		{#each grains as g (g)}
			<Button
				variant={grain === g ? 'primary' : 'secondary'}
				label={g}
				onclick={() => {
					grain = g;
					granular?.restart();
				}}
			/>
		{/each}
	</Flex>
	<Text size="lg">
		<AnimatedText bind:this={granular} text={poem} granularity={grain} />
	</Text>
</Card>

<Card title="Speed and delay" id="speed">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>speed</Code> is units per second, not a total duration — a rate is what survives the text changing
		underneath it, and it is what makes two blocks of different lengths read as the same hand writing
		them. <Code>delay</Code> holds off the first unit, which staggers a stack without needing a timer
		outside the component.
	</Text>
	<div class="stagger">
		<AnimatedText bind:this={paced} text="Fast — 30 words a second." speed={30} />
		<AnimatedText text="Steady — the default 13." delay={400} />
		<AnimatedText text="Slow — 5, with a longer wait first." speed={5} delay={800} />
	</div>
	<Button
		variant="secondary"
		label="Replay"
		style="margin-top: 1rem;"
		onclick={() => paced?.restart()}
	/>
</Card>

<Card title="Text that changes mid-reveal" id="streaming">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		The case this component exists for. <Code>text</Code> grows while the reveal is still running, and
		the reveal carries on from where it stands rather than snapping back to the start or jumping to the
		end. It clamps to the units the old and new strings share, so an append keeps everything on screen
		and a replacement rewinds only as far as the two texts differ.
	</Text>
	<Text size="lg" style="margin-bottom: 1rem;">
		<AnimatedText bind:this={streaming} text={streamed} />
	</Text>
	<Button variant="secondary" label="Stream it" onclick={stream} />
</Card>

<Card title="Playback" id="playback">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>playing</Code> is bindable and pauses in place. <Code>loop</Code> replays after
		<Code>loopDelay</Code>, and <Code>oncomplete</Code> fires once per run — the flag below is set by
		it. <Code>restart()</Code> is an instance method, reached with <Code>bind:this</Code>, so a
		replay does not have to blank <Code>text</Code> and put it back.
	</Text>
	<Text size="lg" style="margin-bottom: 1rem;">
		<AnimatedText
			text="Looping, pausable, and it tells you when it lands."
			bind:playing
			loop
			loopDelay={1500}
			speed={6}
			oncomplete={() => (done = true)}
		/>
	</Text>
	<Flex direction="horizontal" gap="md" align="center">
		<Button
			variant="secondary"
			label={playing ? 'Pause' : 'Play'}
			onclick={() => (playing = !playing)}
		/>
		<Text size="sm" variant="secondary">oncomplete fired: {done ? 'yes' : 'not yet'}</Text>
	</Flex>
</Card>

<Card title="Without a caret" id="no-cursor">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		<Code>{'cursor={false}'}</Code> drops the blinking bar. Worth doing where several blocks reveal at once
		— three carets blinking out of step is a lot of movement for one paragraph of text — or anywhere the
		reveal is meant to be quiet rather than to look like something typing.
	</Text>
	<div class="quiet">
		<AnimatedText text="No caret, just the words." cursor={false} loop speed={6} />
		<AnimatedText
			text="Quieter where several run at once."
			cursor={false}
			loop
			speed={6}
			delay={300}
		/>
	</div>
</Card>

<Card title="Usage" id="usage">
	<CodeBlock
		language="svelte"
		code={`<script>
  import { AnimatedText } from 'glow';

  let reply = $state('');
  let text;
<\/script>

<!-- a word at a time, with a caret; the default -->
<AnimatedText text={reply} />

<!-- a character at a time, slower, no caret -->
<AnimatedText text={reply} granularity="character" speed={30} cursor={false} />

<!-- looping hero line -->
<AnimatedText text="Ships on Friday." loop loopDelay={2000} />

<!-- replay on demand -->
<AnimatedText bind:this={text} text={reply} oncomplete={() => console.log('done')} />
<button onclick={() => text.restart()}>Again</button>`}
	/>
</Card>

<Card title="Accessibility" id="a11y">
	<Text variant="secondary" size="sm">
		The fragments are <Code>aria-hidden</Code> and the whole string is exposed once, as visually hidden
		text that is complete from the first frame — so a screen reader reads one sentence rather than a pile
		of one-word nodes, and never has to wait for an animation to finish. Selection and copy come from
		the visible text, which is why the unrevealed part is transparent rather than absent: dragging across
		a half-revealed paragraph copies the real string.
		<Code>live</Code> adds <Code>aria-live="polite"</Code> for the case where the arrival is itself the
		news. Under <Code>prefers-reduced-motion: reduce</Code> the whole text is shown at once and the caret
		is not rendered at all — the animation is driven from JS, so it cannot ride the
		<Code>--glow-dur-*</Code> collapse the CSS-driven parts of the library use, and a blink collapsed
		to 1ms would be a strobe rather than a suppression. Colour is inherited, so the text carries whatever
		contrast its container has.
	</Text>
</Card>

<Card title="Props" id="props">
	<Table
		variant="simple"
		columns={[
			{ key: 'prop', label: 'Prop', render: codeCell },
			{ key: 'type', label: 'Type', render: codeCell },
			{ key: 'default', label: 'Default' },
			{ key: 'description', label: 'Description' }
		]}
		data={[
			{
				prop: 'text',
				type: 'string',
				default: '—',
				description: 'The text to reveal. Required. Changing it keeps the shared prefix.'
			},
			{
				prop: 'granularity',
				type: "'character' | 'word' | 'line'",
				default: 'word',
				description: 'What counts as one reveal step.'
			},
			{
				prop: 'speed',
				type: 'number',
				default: '55 / 13 / 3.5 per granularity',
				description: 'Units revealed per second.'
			},
			{
				prop: 'playing',
				type: 'boolean (bindable)',
				default: 'true',
				description: 'Pause and resume in place.'
			},
			{
				prop: 'loop',
				type: 'boolean',
				default: 'false',
				description: 'Replay once the text is complete.'
			},
			{
				prop: 'loopDelay',
				type: 'number',
				default: '1200',
				description: 'Milliseconds the full text is held before a loop replays.'
			},
			{
				prop: 'delay',
				type: 'number',
				default: '0',
				description:
					'Milliseconds before the first unit. Only applies to a run starting from nothing.'
			},
			{
				prop: 'cursor',
				type: 'boolean',
				default: 'true',
				description: 'A blinking caret at the reveal head. Never rendered under reduced motion.'
			},
			{
				prop: 'live',
				type: 'boolean',
				default: 'false',
				description: 'Announce the text with aria-live="polite".'
			},
			{
				prop: 'oncomplete',
				type: '() => void',
				default: '—',
				description: 'Fires once when the last unit lands.'
			},
			{
				prop: 'restart()',
				type: '() => void',
				default: '—',
				description: 'Instance method, via bind:this. Replays from nothing.'
			},
			{ prop: 'class', type: 'string', default: '—', description: 'Extra class on the wrapper.' },
			{ prop: 'style', type: 'string', default: '—', description: 'Inline style on the wrapper.' }
		]}
	/>
</Card>

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.stagger,
	.quiet {
		display: grid;
		gap: $space-xs;
		font-size: $text-lg;
	}
</style>
