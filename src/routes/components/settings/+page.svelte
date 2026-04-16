<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Button from '$lib/button/Button.svelte';
	import ButtonGroup from '$lib/button/ButtonGroup.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Spinner from '$lib/spinner/Spinner.svelte';
	import Input from '$lib/input/Input.svelte';
	import Popover from '$lib/popover/Popover.svelte';
	import type { PopoverMenuEntry } from '$lib/menu/PopoverMenu.svelte';

	import SettingsShell from '$lib/settings/SettingsShell.svelte';
	import Section from '$lib/settings/Section.svelte';
	import Field from '$lib/settings/Field.svelte';
	import FieldRow from '$lib/settings/FieldRow.svelte';
	import Disclosure from '$lib/settings/Disclosure.svelte';

	// === Mock state — mirrors what tagger persists ===
	let checkpoint = $state('illustriousXL_v10.safetensors');
	let loras = $state([
		{ name: 'detail_slider.safetensors', strength: 0.7 },
		{ name: 'cineperspective.safetensors', strength: 0.5 }
	]);
	let loraToAdd = $state('');
	let positive = $state('1girl, blonde hair, school uniform, classroom, sunlight');
	let negative = $state(
		'lowres, bad anatomy, bad hands, extra digits, multiple views, text, watermark'
	);
	let bannedTags = $state(
		'expression chart, multiple views, character sheet, reference sheet'
	);
	let viewMode = $state<'original' | 'improved'>('original');
	let improvedPositive = $state('');
	let improving = $state(false);

	let steps = $state(24);
	let cfg = $state(6);
	let aiTagTarget = $state(22);
	let aiTemperature = $state(0.4);
	let aiTopP = $state(0.9);
	let aiVocabSize = $state(80);
	let aiNumCtx = $state(16384);

	let useThinking = $state(true);
	let aiModel = $state('qwen3-abliterated:4b-thinking');
	let aiAdaptive = $state(true);

	let seedMode = $state<'random' | 'fixed'>('random');
	let fixedSeed = $state(1);

	let resolution = $state('1:1');
	let megapixels = $state(2);
	let upscaler = $state('');

	let framing = $state<string | null>(null);
	let thinkingText = $state(
		'We are given a current prompt and need to generate a tag list of approximately 22 tags. Considering the existing tags...'
	);
	let responseText = $state('');

	// === Demo controls ===
	let density = $state<'compact' | 'comfortable' | 'spacious'>('comfortable');
	let useShell = $state(true);

	// === Static option lists ===
	const checkpointOptions = [
		{ value: 'illustriousXL_v10.safetensors', label: 'Illustrious XL v1.0' },
		{ value: 'noobAI_v0.7.safetensors', label: 'NoobAI v0.7' },
		{ value: 'unholyDesireMixSinister_v70.safetensors', label: 'UDM Sinister v7.0' }
	];

	const loraOptions = [
		{ value: 'zoom_slider.safetensors', label: 'Zoom Slider' },
		{ value: 'cineperspective.safetensors', label: 'CinePerspective' },
		{ value: 'detail_slider.safetensors', label: 'Detail Slider' },
		{ value: 'scenic.safetensors', label: 'Scenic Backgrounds' }
	];

	const compositionPresets = [
		{ label: 'Portrait',  icon: 'User',            tag: 'portrait' },
		{ label: 'Cowboy',    icon: 'UserRound',       tag: 'cowboy shot' },
		{ label: 'Full body', icon: 'PersonStanding',  tag: 'full body' },
		{ label: 'Wide',      icon: 'Maximize',        tag: '(wide shot:1.3)' },
		{ label: 'Very wide', icon: 'Mountain',        tag: '(very wide shot:1.4), (scenery:1.3)' },
		{ label: 'Scenery',   icon: 'Trees',           tag: '(scenery:1.4), grand scale' }
	] as const;

	const aspectRatios: Array<[string, [number, number]]> = [
		['1:1',  [1, 1]],
		['3:4',  [3, 4]],
		['4:3',  [4, 3]],
		['9:16', [9, 16]],
		['16:9', [16, 9]]
	];

	const upscalerOptions = [
		{ value: '',                        label: '(none)' },
		{ value: '4x_NMKD-Siax_200k.pth',   label: '4x NMKD-Siax (200k)' },
		{ value: '4x-UltraSharp.pth',       label: '4x UltraSharp' }
	];

	// === AI model picker (options + extras pattern) ===
	const aiModelOptions = [
		{ value: 'qwen3-abliterated:4b-thinking', label: 'Qwen 3 (4B, thinking)', description: 'Reasoning, abliterated, fast' },
		{ value: 'deepseek-r1:8b',                label: 'DeepSeek R1 (8B)',      description: 'Strong reasoning, slower' },
		{ value: 'llama3.1:8b',                   label: 'Llama 3.1 (8B)',        description: 'No reasoning, very fast' }
	];
	const moreModels = ['qwen2.5:14b', 'mistral-nemo:12b', 'phi-4:14b'];

	let aiModelExtras: PopoverMenuEntry[] = $derived([
		{
			kind: 'toggle',
			label: 'Adaptive thinking',
			description: 'Thinks only when needed',
			checked: aiAdaptive,
			onChange: (v) => (aiAdaptive = v)
		},
		{
			kind: 'submenu',
			label: 'More models',
			// Submenu uses `options` so picks auto-flow into the same bind:value
			// as the top-level options — no manual selected/onclick wiring.
			options: moreModels.map((name) => ({ value: name, label: name }))
		}
	]);

	function addLora(name: string) {
		if (!name || loras.some((l) => l.name === name)) return;
		loras = [...loras, { name, strength: 0.7 }];
		loraToAdd = '';
	}

	function removeLora(i: number) {
		loras = loras.filter((_, idx) => idx !== i);
	}

	function setLoraStrength(i: number, v: number) {
		loras = loras.map((l, idx) => (idx === i ? { ...l, strength: v } : l));
	}

	function fakeImprove() {
		improving = true;
		thinkingText = '';
		responseText = '';
		const trace = [
			'Reading the current prompt and the available vocabulary...',
			'\nThe user wants a school scene. Adding lighting and pose tags...',
			'\nFinal output will respect the target tag count of ~22.'
		];
		const final = '1girl, masterpiece, best quality, blonde hair, school uniform, classroom, soft lighting';
		let i = 0;
		const tickThink = setInterval(() => {
			thinkingText += trace[i] ?? '';
			i++;
			if (i >= trace.length) {
				clearInterval(tickThink);
				responseText = final;
				improvedPositive = final;
				viewMode = 'improved';
				improving = false;
			}
		}, 350);
	}
</script>

<svelte:head><title>Settings primitives | Glow UI</title></svelte:head>

<Heading level={1}>Settings primitives</Heading>
<p class="page-intro">
	A live port of the tagger app's controls column, built with only the new
	<code>Section</code>, <code>Field</code>, <code>FieldRow</code>,
	<code>Disclosure</code>, and <code>SettingsShell</code> primitives — plus the
	new rich <code>PopoverMenu</code>. Use the toggles below to flip density and
	see whether the shell layer is worth keeping.
</p>

<div class="demo-controls">
	<ButtonGroup>
		<Button label="With shell"    variant={useShell ? 'primary' : 'ghost'}  onclick={() => { useShell = true; }} />
		<Button label="Bare sections" variant={!useShell ? 'primary' : 'ghost'} onclick={() => { useShell = false; }} />
	</ButtonGroup>
</div>

{#snippet bareBody()}
	{@render content()}
{/snippet}

{#if useShell}
	<SettingsShell
		bind:density
		densityToggle
		title="Tagger settings"
		description="A 23-field config page rebuilt with Glow primitives."
	>
		{@render content()}
	</SettingsShell>
{:else}
	<div data-density={density} class="bare-wrap">
		{@render bareBody()}
	</div>
{/if}

{#snippet content()}
	<Section title="Checkpoint" icon="Box" id="checkpoint">
		<Field label="Model" hint="The diffusion checkpoint loaded into the sampler.">
			<Input
				type="select"
				options={checkpointOptions}
				value={checkpoint}
				onChange={(v) => (checkpoint = v)}
			/>
		</Field>
	</Section>

	<Section
		title="LoRAs"
		icon="Layers"
		id="loras"
		description="Stack additional fine-tunes on top of the base checkpoint."
	>
		<Field label="Add a LoRA">
			<Input
				type="select"
				options={loraOptions.filter((o) => !loras.some((l) => l.name === o.value))}
				value={loraToAdd}
				placeholder="Pick a LoRA to add..."
				onChange={(v) => addLora(v)}
			/>
		</Field>
		{#if loras.length > 0}
			<div class="lora-list">
				{#each loras as lora, i (lora.name)}
					<div class="lora-row">
						<span class="lora-name">{lora.name}</span>
						<Input
							type="range"
							value={lora.strength}
							min={-1.5}
							max={1.5}
							step={0.05}
							showValue
							onChange={(v) => setLoraStrength(i, v)}
						/>
						<Button label="" icon="X" variant="ghost" onclick={() => removeLora(i)} />
					</div>
				{/each}
			</div>
		{/if}
	</Section>

	<Section title="Positive prompt" icon="Sparkles" id="positive">
		<div class="prompt-tabs">
			<button
				class="prompt-tab"
				class:active={viewMode === 'original'}
				onclick={() => (viewMode = 'original')}
			>Original</button>
			{#if improvedPositive}
				<button
					class="prompt-tab"
					class:active={viewMode === 'improved'}
					onclick={() => (viewMode = 'improved')}
				>Improved</button>
			{/if}
			<div class="spacer"></div>
			<Pill label="{positive.split(',').filter(Boolean).length} tags" />
		</div>

		<div class="composition-row">
			<span class="composition-label">Shot</span>
			<ButtonGroup>
				{#each compositionPresets as preset (preset.label)}
					<Button
						label={preset.label}
						icon={preset.icon as never}
						variant={framing === preset.label ? 'primary' : 'ghost'}
						onclick={() => {
							framing = framing === preset.label ? null : preset.label;
						}}
					/>
				{/each}
			</ButtonGroup>
		</div>

		<Field label="Prompt" hint="Comma-separated Danbooru tags.">
			<Input
				type="textarea"
				rows={5}
				value={viewMode === 'improved' ? improvedPositive : positive}
				onChange={(v) => (viewMode === 'improved' ? (improvedPositive = v) : (positive = v))}
			/>
		</Field>

		<div class="improve-row">
			<Button
				label={improving ? (useThinking ? 'Thinking…' : 'Improving…') : 'Improve with AI'}
				icon="Sparkles"
				variant="primary"
				onclick={fakeImprove}
				disabled={improving}
			/>
			{#if improvedPositive}
				<Button
					label="Discard"
					icon="X"
					variant="ghost"
					onclick={() => {
						improvedPositive = '';
						viewMode = 'original';
					}}
				/>
			{/if}
		</div>

		{#if thinkingText}
			<Disclosure title="Reasoning" variant="boxed" active={improving}>
				{#snippet headerExtra()}
					{#if improving}<Spinner size={14} />{/if}
				{/snippet}
				<pre class="trace">{thinkingText}</pre>
			</Disclosure>
		{/if}
		{#if responseText}
			<Disclosure title="Raw response" variant="boxed">
				<pre class="trace">{responseText}</pre>
			</Disclosure>
		{/if}
	</Section>

	<Section title="Negative prompt" icon="Ban" id="negative">
		<Field label="Tags to avoid">
			<Input
				type="textarea"
				rows={3}
				value={negative}
				onChange={(v) => (negative = v)}
			/>
		</Field>
	</Section>

	<Section
		title="Banned tags (AI filter)"
		icon="Funnel"
		id="banned"
		collapsible
		defaultOpen={false}
		description="Stripped from any AI-generated prompt before it reaches the textarea."
	>
		<Field label="Tags">
			<Input
				type="textarea"
				rows={2}
				value={bannedTags}
				onChange={(v) => (bannedTags = v)}
			/>
		</Field>
	</Section>

	<Section title="Generation" icon="SlidersHorizontal" id="generation">
		<FieldRow>
			<Field label="Steps" hint="Number of denoising steps">
				<Input type="number" value={steps} min={1} max={150} onChange={(v) => (steps = v)} />
			</Field>
			<Field label="CFG" hint="Classifier-free guidance">
				<Input type="number" value={cfg} min={0} max={30} step={0.1} onChange={(v) => (cfg = v)} />
			</Field>
		</FieldRow>

		<Field label="AI assist model" hint={aiAdaptive ? 'Adaptive thinking on' : 'Always full reasoning'}>
			<Input
				type="select"
				options={aiModelOptions}
				items={aiModelExtras}
				value={aiModel}
				placeholder="Pick a model"
				onChange={(v) => (aiModel = v)}
			/>
		</Field>

		<Field label="Reasoning" hint="Slower, higher-quality prompts">
			<Input
				type="toggle"
				checked={useThinking}
				onChange={(v) => (useThinking = v)}
			/>
		</Field>

		<Field label="Target tag count" hint="The AI aims for ~this many tags">
			<Input
				type="range"
				value={aiTagTarget}
				min={8}
				max={50}
				step={1}
				showValue
				onChange={(v) => (aiTagTarget = v)}
			/>
		</Field>

		<Field
			label="Sampling"
			hint="Temperature, top-p, vocabulary size, context window."
			tier="advanced"
		>
			<Popover align="right" offset={8}>
				{#snippet trigger()}
					<Button label="" icon="SlidersHorizontal" variant="ghost" />
				{/snippet}
				<div class="advanced-popover">
					<Field label="Temperature">
						<Input
							type="range"
							value={aiTemperature}
							min={0}
							max={2}
							step={0.05}
							showValue
							onChange={(v) => (aiTemperature = v)}
						/>
					</Field>
					<Field label="Top-p">
						<Input
							type="range"
							value={aiTopP}
							min={0}
							max={1}
							step={0.01}
							showValue
							onChange={(v) => (aiTopP = v)}
						/>
					</Field>
					<Field label="Vocabulary size" hint="Tags per category sent to the LLM">
						<Input
							type="range"
							value={aiVocabSize}
							min={20}
							max={200}
							step={5}
							showValue
							onChange={(v) => (aiVocabSize = v)}
						/>
					</Field>
					<Field label="Context window" hint="Bump higher if responses come back empty">
						<Input
							type="range"
							value={aiNumCtx}
							min={2048}
							max={65536}
							step={2048}
							showValue
							onChange={(v) => (aiNumCtx = v)}
						/>
					</Field>
				</div>
			</Popover>
		</Field>

		<Field label="Seed mode" hint={seedMode === 'random' ? 'A new seed each generation' : 'Reproducible seed'}>
			<ButtonGroup>
				<Button
					label="Random"
					icon="Shuffle"
					variant={seedMode === 'random' ? 'primary' : 'ghost'}
					onclick={() => {
						seedMode = 'random';
					}}
				/>
				<Button
					label="Fixed"
					icon="Lock"
					variant={seedMode === 'fixed' ? 'primary' : 'ghost'}
					onclick={() => {
						seedMode = 'fixed';
					}}
				/>
			</ButtonGroup>
		</Field>

		{#if seedMode === 'fixed'}
			<Field label="Seed">
				<Input type="number" value={fixedSeed} min={0} onChange={(v) => (fixedSeed = v)} />
			</Field>
		{/if}
	</Section>

	<Section title="Resolution" icon="Frame" id="resolution">
		<Field label="Aspect ratio" layout="stack">
			<div class="aspect-grid">
				{#each aspectRatios as [key, _ratio] (key)}
					<button
						type="button"
						class="aspect-btn"
						class:selected={resolution === key}
						onclick={() => (resolution = key)}
					>
						{key}
					</button>
				{/each}
			</div>
		</Field>

		<Field label="Density" hint="Megapixels at the chosen aspect ratio">
			<Input
				type="range"
				value={megapixels}
				min={0.5}
				max={4}
				step={0.1}
				showValue
				onChange={(v) => (megapixels = v)}
			/>
		</Field>

		<Field label="Upscaler" hint="Optional model-based upscale after VAE decode">
			<Input
				type="select"
				options={upscalerOptions}
				value={upscaler}
				onChange={(v) => (upscaler = v)}
			/>
		</Field>
	</Section>
{/snippet}

<style lang="scss">
	@use '$lib/style/theme.scss' as *;

	.page-intro {
		font-size: $text-base;
		color: $text-secondary;
		margin: 0 0 2rem 0;
		line-height: 1.6;

		code {
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			font-size: 0.9em;
			padding: 0.1em 0.4em;
			background: rgba($fg, 0.06);
			border-radius: 0.25em;
		}
	}

	.demo-controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
	}

	.bare-wrap {
		display: flex;
		flex-direction: column;
	}

	// --- patterns that don't (yet) belong in a primitive ---

	.lora-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.lora-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba($fg, 0.03);
		border: 1px solid rgba($fg, 0.06);
		border-radius: 0.5rem;
	}

	.lora-name {
		flex: 1;
		min-width: 0;
		font-size: $text-xs;
		font-weight: 600;
		color: $text-secondary;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.prompt-tabs {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		.spacer {
			flex: 1;
		}
	}

	.prompt-tab {
		font-family: $font-family;
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.375rem 0.625rem;
		background: transparent;
		border: 0;
		border-radius: 0.4rem;
		color: $text-muted;
		cursor: pointer;
		transition: all 0.12s ease;

		&:hover {
			color: $text-primary;
			background: rgba($fg, 0.04);
		}

		&.active {
			color: $primary;
			background: rgba($primary, 0.12);
		}
	}

	.composition-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.composition-label {
		font-size: $text-xs;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: $text-muted;
	}

	.improve-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.trace {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: $text-xs;
		line-height: 1.5;
		color: $text-muted;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 220px;
		overflow-y: auto;
	}

	.advanced-popover {
		display: flex;
		flex-direction: column;
		min-width: 260px;
		padding: 0.5rem;
	}

	.aspect-grid {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.aspect-btn {
		font-family: $font-family;
		font-size: $text-xs;
		font-weight: 600;
		padding: 0.5rem 0.75rem;
		min-width: 3rem;
		background: rgba($fg, 0.04);
		border: 1px solid rgba($fg, 0.08);
		border-radius: 0.4rem;
		color: $text-secondary;
		cursor: pointer;
		transition: all 0.12s ease;

		&:hover {
			color: $text-primary;
			border-color: rgba($fg, 0.15);
		}

		&.selected {
			background: rgba($primary, 0.15);
			color: $primary;
			border-color: $primary;
		}
	}
</style>
