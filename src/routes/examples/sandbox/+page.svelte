<script lang="ts">
	// Example: a dense, two-column malware-sandbox "analysis config" screen,
	// modelled on ANY.RUN's Deep-analysis setup. Built to stress-test Glow with
	// a real, information-dense product surface and surface the gaps. Every
	// place we had to hand-roll a primitive is tagged `// GAP:` inline.
	import Flex from '$lib/layout/Flex.svelte';
	import Grid from '$lib/layout/Grid.svelte';
	import Spacer from '$lib/layout/Spacer.svelte';
	import Card from '$lib/card/Card.svelte';
	import Field from '$lib/settings/Field.svelte';
	import Section from '$lib/settings/SettingsSection.svelte';
	import Input from '$lib/input/Input.svelte';
	import Button from '$lib/button/Button.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Icon from '$lib/icon/Icon.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import Tabs from '$lib/tabs/Tabs.svelte';
	import PopoverMenu from '$lib/menu/PopoverMenu.svelte';
	import { toast } from '$lib/toast/toast.svelte.js';
	import type { ComboboxOption, SelectOption } from '$lib/input/types.js';

	// ── top-level mode ──────────────────────────────────────────────────────
	let headerTab = $state<'deep' | 'safe'>('deep');
	let mode = $state<'simple' | 'pro'>('pro');
	let vmStreaming = $state(true);

	// ── url / file ──────────────────────────────────────────────────────────
	let url = $state('https://studio-obs.net/');
	let openInBrowser = $state(true);
	let startObject = $state('temp');
	let browser = $state('edge');
	let changeExt = $state(true);
	let hideSource = $state(false);
	let commandLine = $state('');

	// ── duration ──────────────────────────────────────────────────────────────
	let duration = $state(60);

	// ── network ───────────────────────────────────────────────────────────────
	let connected = $state(true);
	let mitm = $state(false);
	let fakeNet = $state(false);
	let viaTor = $state(false);
	let residential = $state(false);
	let userVpn = $state(false);
	let geo = $state('');
	let vpnConf = $state('');

	// ── operating system ──────────────────────────────────────────────────────
	let os = $state('win11');
	let autoUac = $state(true);
	let softSet = $state('complete');
	let locale = $state('en-US');

	// ── privacy ───────────────────────────────────────────────────────────────
	let privacy = $state('link');
	let autoDelete = $state(false);

	// ── additional ────────────────────────────────────────────────────────────
	let automatedML = $state(false);

	// ── preset / submit ───────────────────────────────────────────────────────
	let preset = $state('default');
	let autosave = $state(false);
	let running = $state(false);

	const startObjectOptions: SelectOption[] = [
		{ value: 'temp', label: 'Temp directory' },
		{ value: 'desktop', label: 'Desktop' },
		{ value: 'downloads', label: 'Downloads' },
		{ value: 'root', label: 'Root of drive C:' }
	];
	const browserOptions: ComboboxOption[] = [
		{ value: 'edge', label: 'Microsoft Edge', icon: 'Globe' },
		{ value: 'chrome', label: 'Google Chrome', icon: 'Globe' },
		{ value: 'firefox', label: 'Mozilla Firefox', icon: 'Globe' },
		{ value: 'ie', label: 'Internet Explorer', icon: 'Globe' }
	];
	const presetOptions: ComboboxOption[] = [
		{ value: 'complete', label: 'Complete' },
		{ value: 'clean', label: 'Clean' },
		{ value: 'office', label: 'Office' }
	];
	const localeOptions: ComboboxOption[] = [
		{ value: 'en-US', label: 'United States (en-US)' },
		{ value: 'en-GB', label: 'United Kingdom (en-GB)' },
		{ value: 'de-DE', label: 'Germany (de-DE)' },
		{ value: 'ja-JP', label: 'Japan (ja-JP)' }
	];
	const osOptions: ComboboxOption[] = [
		{ value: 'win7', label: 'Windows 7 (32 bit)', icon: 'Monitor' },
		{ value: 'win10', label: 'Windows 10 (64 bit)', icon: 'Monitor' },
		{ value: 'win11', label: 'Windows 11 (64 bit)', icon: 'Monitor' },
		{ value: 'linux', label: 'Ubuntu 22.04 (64 bit)', icon: 'Monitor' }
	];
	const geoOptions: SelectOption[] = [
		{ value: 'fast', label: 'Fastest geo' },
		{ value: 'us', label: 'United States' },
		{ value: 'nl', label: 'Netherlands' }
	];
	const presetConfigOptions: ComboboxOption[] = [
		{ value: 'default', label: 'Default' },
		{ value: 'aggressive', label: 'Aggressive' },
		{ value: 'stealth', label: 'Stealth' }
	];

	// The privacy control is a classic single-select radio *list* with per-row
	// icons. Glow's <Input type="radio"> is a segmented pill control, which is
	// wrong here — so this is hand-rolled. // GAP: no vertical/inline radio-list.
	const privacyOptions = [
		{ value: 'me', label: 'Only me', icon: 'Lock' },
		{ value: 'team', label: 'Team', icon: 'Users' },
		{ value: 'link', label: 'Who has a link', icon: 'Link' },
		{ value: 'public', label: 'Public', icon: 'Globe' }
	] as const;

	// The soft-set inventory list under the tabbed panel. // GAP: no compact
	// key/value "spec table" primitive — Table is heavier than this needs.
	const applications = [
		{ name: 'Internet Explorer', version: '11.1.22000.0' },
		{ name: 'Adobe Acrobat (64-bit)', version: '22.003.20314' },
		{ name: 'Adobe Flash Player 32 NPAPI', version: '32.0.0.465' },
		{ name: 'Adobe Flash Player 32 PPAPI', version: '32.0.0.465' },
		{ name: '.NET Framework', version: '4.8.04084' },
		{ name: 'Java 8', version: '8.0.3410.10' }
	];
	const hotfixes = [
		{ name: 'KB5027231', version: '2023-06' },
		{ name: 'KB5028185', version: '2023-07' },
		{ name: 'KB5029263', version: '2023-08' }
	];
	const tools = [
		{ name: 'FakeNet-NG', version: '3.2' },
		{ name: 'Wireshark', version: '4.0.6' },
		{ name: 'Procmon', version: '3.96' }
	];

	async function run() {
		running = true;
		await new Promise((r) => setTimeout(r, 900));
		running = false;
		toast.success(`Private analysis started · Windows 11 · ${duration}s`);
	}
</script>

<svelte:head><title>Sandbox analysis | Glow UI</title></svelte:head>

<div class="sandbox">
	<!-- ── Chrome header: tab switcher + help/close ──────────────────────── -->
	<!-- GAP: no standalone "tab bar" that only switches a header without owning
	     the body. <Tabs> couples the strip to its own content panels, so this
	     top navigation is hand-rolled. -->
	<header class="topbar">
		<nav class="header-tabs">
			<button class="htab" class:active={headerTab === 'deep'} onclick={() => (headerTab = 'deep')}>
				<Icon name="ScanEye" size={18} />
				<span>Deep analysis</span>
			</button>
			<button class="htab" class:active={headerTab === 'safe'} onclick={() => (headerTab = 'safe')}>
				<Icon name="ShieldCheck" size={18} />
				<span>Safebrowsing</span>
				<Pill label="beta" variant="filled" />
			</button>
		</nav>
		<Spacer />
		<button class="chrome-btn"><Icon name="CircleQuestionMark" size={16} /><span>Help</span></button>
		<button class="chrome-btn icon" aria-label="Close"><Icon name="X" size={18} /></button>
	</header>

	<!-- ── Mode bar ──────────────────────────────────────────────────────── -->
	<div class="modebar">
		<div class="segmented">
			<Input
				type="radio"
				options={[
					{ value: 'simple', label: 'Simple mode' },
					{ value: 'pro', label: 'Pro mode' }
				]}
				value={mode}
				onChange={(v) => (mode = v as typeof mode)}
			/>
		</div>
		<label class="inline-toggle">
			<Input type="toggle" checked={vmStreaming} onChange={(v) => (vmStreaming = v)} />
			<span>New VM video streaming</span>
			<Pill label="beta" variant="filled" />
		</label>
		<Spacer />
		<Text size="sm" variant="muted">
			Analyses:&nbsp;
			<span class="quota">Private ∞</span>
			<span class="sep">|</span>
			<span class="quota">Public ∞</span>
		</Text>
	</div>

	<!-- ── Two-column body ───────────────────────────────────────────────── -->
	<Grid cols={2} gap="md" class="body-grid">
		<!-- LEFT COLUMN -->
		<Flex gap="md" class="col">
			<Card padding="md">
				<Section title="URL or file upload" variant="plain">
					<!-- The active/highlighted input group. // GAP: no "framed input
					     with header row + inline footer action" composite; hand-built. -->
					<div class="url-box">
						<div class="url-box-head">
							<span>Type or copy URL</span>
							<button class="clear" aria-label="Clear" onclick={() => (url = '')}>
								<Icon name="X" size={14} />
							</button>
						</div>
						<Input type="text" value={url} onChange={(v) => (url = v)} placeholder="https://…" />
						<div class="url-box-foot">
							<Input type="toggle" checked={openInBrowser} onChange={(v) => (openInBrowser = v)} />
							<span class:on={openInBrowser}>Open in browser</span>
							<span class:on={!openInBrowser}>Download file and start</span>
						</div>
					</div>

					<Grid cols={2} gap="sm" class="pair">
						<Field label="Start object from" layout="vertical">
							<Input type="select" options={startObjectOptions} value={startObject} searchable={false} onChange={(v) => (startObject = v)} />
						</Field>
						<Field label="Open in browser" layout="vertical">
							<Input type="select" options={browserOptions} value={browser} searchable={false} onChange={(v) => (browser = v)} />
						</Field>
					</Grid>

					<Grid cols={2} gap="sm" class="pair">
						<Field label="Change extension to valid">
							<Input type="toggle" checked={changeExt} toggleLabel={changeExt ? 'On' : 'Off'} onChange={(v) => (changeExt = v)} />
						</Field>
						<Field label="Hide source" disabled>
							<Input type="checkbox" checked={hideSource} onChange={(v) => (hideSource = v)} />
						</Field>
					</Grid>

					<Field label="Command line" layout="vertical">
						<Input type="text" value={commandLine} onChange={(v) => (commandLine = v)} placeholder="Type or choose a preset" />
					</Field>
				</Section>
			</Card>

			<Card padding="md">
				<Section title="Duration, sec" variant="plain">
					<!-- GAP: range has no tick labels / scale marks. The min/max/step
					     ruler under the ANY.RUN slider is drawn by hand here. -->
					<div class="duration">
						<Input type="range" value={duration} min={10} max={1200} step={10} showValue onChange={(v) => (duration = v)} />
						<div class="ruler">
							<span>10</span><span>300</span><span>600</span><span>900</span><span>1200</span>
						</div>
					</div>
				</Section>
			</Card>

			<Card padding="md">
				<Section title="Network" variant="plain">
					<Field label="Connected">
						<Input type="toggle" checked={connected} toggleLabel={connected ? 'Connected' : 'Offline'} onChange={(v) => (connected = v)} />
					</Field>
					<!-- GAP: Field horizontal layout justifies the control hard-right, so
					     a checkbox floats far from its label. `.checks` overrides that so
					     the box hugs the label — the pattern checkbox rows actually want. -->
					<Grid cols={2} gap="sm" class="pair checks">
						<Field label="HTTPS MITM PROXY" align="center"
							><Input type="checkbox" checked={mitm} onChange={(v) => (mitm = v)} /></Field
						>
						<Field label="Fake net" align="center"
							><Input type="checkbox" checked={fakeNet} onChange={(v) => (fakeNet = v)} /></Field
						>
					</Grid>
					<Text size="xs" variant="muted">Route internet traffic through (optional):</Text>
					<Grid cols={3} gap="sm" class="pair checks">
						<Field label="Route via TOR" align="center"><Input type="checkbox" checked={viaTor} onChange={(v) => (viaTor = v)} /></Field>
						<Field label="Residential proxy" align="center"><Input type="checkbox" checked={residential} onChange={(v) => (residential = v)} /></Field>
						<Field label="User VPN (0/100)" align="center"><Input type="checkbox" checked={userVpn} onChange={(v) => (userVpn = v)} /></Field>
					</Grid>
					<Flex direction="horizontal" gap="sm" align="center">
						<Input type="select" options={geoOptions} value={geo} placeholder="Fastest geo" searchable={false} onChange={(v) => (geo = v)} />
						<Input type="select" options={geoOptions} value={vpnConf} placeholder="Choose" searchable={false} onChange={(v) => (vpnConf = v)} />
						<PopoverMenu
							items={[
								{ kind: 'item', label: 'Add a config', icon: 'Plus', onclick: () => {} },
								{ kind: 'item', label: 'Import', icon: 'Upload', onclick: () => {} }
							]}
						>
							{#snippet trigger()}<Button icon="EllipsisVertical" variant="ghost" />{/snippet}
						</PopoverMenu>
					</Flex>
				</Section>
			</Card>
		</Flex>

		<!-- RIGHT COLUMN -->
		<Flex gap="md" class="col">
			<Card padding="md">
				<Section title="Operating system" variant="plain">
					<Input type="select" options={osOptions} value={os} searchable={false} onChange={(v) => (os = v)} />
					<Field label="Auto confirm UAC">
						<Input type="toggle" checked={autoUac} toggleLabel={autoUac ? 'On' : 'Off'} onChange={(v) => (autoUac = v)} />
					</Field>
					<Grid cols={2} gap="sm" class="pair">
						<Field label="Pre-installed soft set" layout="vertical">
							<Input type="select" options={presetOptions} value={softSet} searchable={false} onChange={(v) => (softSet = v)} />
						</Field>
						<Field label="Locale (OS Language)" layout="vertical">
							<Input type="select" options={localeOptions} value={locale} searchable={false} onChange={(v) => (locale = v)} />
						</Field>
					</Grid>

					<div class="soft-list">
						<Tabs
							tabs={[
								{ id: 'apps', label: 'Applications', content: appsPanel },
								{ id: 'hotfix', label: 'Hot fixes', content: hotfixPanel },
								{ id: 'tools', label: 'Tools collection', content: toolsPanel }
							]}
						/>
					</div>
				</Section>
			</Card>

			<Card padding="md">
				<Section title="Additional settings" variant="plain">
					<Field label="Automated Interactivity (ML)">
						<Input type="toggle" checked={automatedML} onChange={(v) => (automatedML = v)} />
					</Field>
				</Section>
			</Card>

			<Card padding="md">
				<Section title="Privacy" variant="plain">
					<div class="privacy-row">
						{#each privacyOptions as opt}
							<button class="privacy-opt" class:selected={privacy === opt.value} onclick={() => (privacy = opt.value)}>
								<span class="dot" class:on={privacy === opt.value}></span>
								<Icon name={opt.icon} size={14} />
								<span>{opt.label}</span>
							</button>
						{/each}
					</div>
					<label class="delete-row">
						<Input type="checkbox" checked={autoDelete} onChange={(v) => (autoDelete = v)} />
						<span>The report will be deleted in</span>
						<Pill label="2 weeks" variant="outlined" />
					</label>
				</Section>
			</Card>
		</Flex>
	</Grid>

	<!-- ── Footer action bar ─────────────────────────────────────────────── -->
	<footer class="actionbar">
		<div class="preset">
			<Text size="xs" variant="muted">Preset configuration (1/100)</Text>
			<Flex direction="horizontal" gap="xs" align="center">
				<Input type="select" options={presetConfigOptions} value={preset} searchable={false} onChange={(v) => (preset = v)} />
				<Button icon="EllipsisVertical" variant="ghost" />
				<label class="autosave"><Input type="checkbox" checked={autosave} onChange={(v) => (autosave = v)} /><span>Autosave changes</span></label>
			</Flex>
		</div>
		<Spacer />
		<!-- GAP: no success/green button variant — repainting via --glow-primary
		     on a wrapper. A `variant="success"` (or accent token) would be nicer. -->
		<div class="run-cta">
			<Button icon={running ? undefined : 'Shield'} label={running ? 'Starting…' : 'Run a private analysis'} loading={running} onclick={run} />
			<Button icon="WandSparkles" label="Auto" variant="secondary" />
		</div>
	</footer>
</div>

{#snippet appsPanel()}<div class="specs">{#each applications as a}<div class="spec"><span>{a.name}</span><span class="v">{a.version}</span></div>{/each}</div>{/snippet}
{#snippet hotfixPanel()}<div class="specs">{#each hotfixes as a}<div class="spec"><span>{a.name}</span><span class="v">{a.version}</span></div>{/each}</div>{/snippet}
{#snippet toolsPanel()}<div class="specs">{#each tools as a}<div class="spec"><span>{a.name}</span><span class="v">{a.version}</span></div>{/each}</div>{/snippet}

<style lang="scss">
	.sandbox {
		max-width: 1040px;
		margin: 1.5rem auto;
		padding: 0 1.25rem 3rem;
		// Dense product surface — tighten the field/section rhythm globally.
		--glow-field-padding-y: 0.3rem;
		--glow-field-padding-x: 0.4rem;
		--glow-field-row-gap: 0.5rem;
		--glow-field-stack-gap: 0.3rem;
		--glow-section-gap: 0.35rem;
		--glow-field-label-size: 0.8rem;
	}

	// ── header ──────────────────────────────────────────────────────────────
	.topbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid var(--glow-border-color);
	}
	.header-tabs { display: flex; gap: 1.5rem; }
	.htab {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0.25rem 0 0.6rem;
		margin: 0;
		color: var(--glow-text-muted);
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -0.85rem;
		transition: color 0.15s;
		&:hover { color: var(--glow-text-secondary); }
		&.active { color: var(--glow-text-primary); border-bottom-color: var(--glow-primary); }
	}
	.chrome-btn {
		display: inline-flex; align-items: center; gap: 0.4rem;
		background: none; border: none; cursor: pointer;
		color: var(--glow-text-secondary); font-size: 0.95rem; padding: 0.35rem;
		&:hover { color: var(--glow-text-primary); }
		&.icon { padding: 0.35rem; }
	}

	// ── mode bar ──────────────────────────────────────────────────────────────
	.modebar {
		display: flex; align-items: center; gap: 1rem;
		margin-bottom: 1rem;
	}
	.segmented { width: 15rem; }
	.inline-toggle {
		display: inline-flex; align-items: center; gap: 0.5rem;
		font-size: 0.9rem; color: var(--glow-text-secondary); cursor: pointer;
	}
	.quota { color: var(--glow-text-secondary); font-weight: 600; }
	.sep { margin: 0 0.4rem; opacity: 0.4; }

	// ── url box ─────────────────────────────────────────────────────────────
	.url-box {
		border: 1px solid var(--glow-primary);
		border-radius: 10px;
		padding: 0.6rem 0.7rem;
		background: color-mix(in oklab, var(--glow-primary) 6%, transparent);
		display: flex; flex-direction: column; gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.url-box-head {
		display: flex; align-items: center; justify-content: space-between;
		font-size: 0.8rem; color: var(--glow-text-muted);
		.clear { background: none; border: none; color: var(--glow-text-muted); cursor: pointer; padding: 0; }
	}
	.url-box-foot {
		display: flex; align-items: center; gap: 0.6rem;
		font-size: 0.85rem; color: var(--glow-text-muted);
		span.on { color: var(--glow-text-primary); font-weight: 600; }
	}

	// ── duration ──────────────────────────────────────────────────────────────
	.duration { padding-top: 0.25rem; }
	.ruler {
		display: flex; justify-content: space-between;
		font-size: 0.75rem; color: var(--glow-text-muted); margin-top: 0.35rem;
		span:first-child, span:last-child { color: var(--glow-text-secondary); font-weight: 700; }
	}

	// ── soft-set spec list ────────────────────────────────────────────────────
	.soft-list { margin-top: 0.5rem; }
	.specs { display: flex; flex-direction: column; }
	.spec {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.3rem 0.1rem; font-size: 0.85rem;
		border-bottom: 1px solid color-mix(in oklab, var(--glow-fg) 6%, transparent);
		color: var(--glow-text-secondary);
		.v { color: var(--glow-text-muted); font-variant-numeric: tabular-nums; }
	}

	// ── privacy ────────────────────────────────────────────────────────────────
	.privacy-row { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; padding: 0.25rem 0.1rem; }
	.privacy-opt {
		display: inline-flex; align-items: center; gap: 0.4rem;
		background: none; border: none; cursor: pointer;
		color: var(--glow-text-secondary); font-size: 0.85rem; padding: 0.2rem;
		&.selected { color: var(--glow-text-primary); }
		.dot {
			width: 14px; height: 14px; border-radius: 50%;
			border: 2px solid var(--glow-text-muted); box-sizing: border-box;
			&.on { border-color: var(--glow-primary); background:
				radial-gradient(circle, var(--glow-primary) 0 4px, transparent 4px); }
		}
	}
	.delete-row {
		display: inline-flex; align-items: center; gap: 0.5rem;
		font-size: 0.85rem; color: var(--glow-text-secondary);
		margin-top: 0.5rem; cursor: pointer;
	}

	// ── footer ────────────────────────────────────────────────────────────────
	.actionbar {
		display: flex; align-items: flex-end; gap: 1rem;
		margin-top: 1.25rem; padding-top: 1rem;
		border-top: 1px solid var(--glow-border-color);
	}
	.preset { display: flex; flex-direction: column; gap: 0.3rem; }
	.autosave { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--glow-text-secondary); cursor: pointer; }
	.run-cta {
		display: flex; gap: 0.5rem;
		// Repaint the primary CTA green without a dedicated success variant.
		--glow-primary: #2fd39b;
		--glow-primary-hover: #3ee0a9;
	}

	:global(.body-grid) { align-items: start; }
	:global(.col) { min-width: 0; }
	:global(.pair) { width: 100%; }
	// Make checkbox fields hug their labels instead of pinning the box hard-right.
	// Needs the extra `.field.horizontal` to outspecify Field's own flex-end rule
	// — which is itself the friction: Field has no left-hugging control layout.
	:global(.checks .field.horizontal .control) { justify-content: flex-start; }
</style>
