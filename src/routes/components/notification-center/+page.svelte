<script lang="ts">
	import Heading from '$lib/typography/Heading.svelte';
	import Text from '$lib/typography/Text.svelte';
	import Card from '$lib/card/Card.svelte';
	import Button from '$lib/button/Button.svelte';
	import Kbd from '$lib/typography/Kbd.svelte';
	import CodeBlock from '$lib/code/CodeBlock.svelte';
	import Code from '$lib/code/Code.svelte';
	import Pill from '$lib/pill/Pill.svelte';
	import NotificationCenter from '$lib/notification-center/NotificationCenter.svelte';
	import { notifications } from '$lib/notification-center/notificationCenter.svelte.js';
	import { toast } from '$lib/toast/toast.svelte.js';

	let open = $state(false);
	let groupBy = $state<'time' | 'source' | 'none'>('time');

	const teammates = [
		{ name: 'Alice Becker', avatar: 'https://i.pravatar.cc/40?img=47' },
		{ name: 'Bob Chen', avatar: 'https://i.pravatar.cc/40?img=12' },
		{ name: 'Cleo Diaz', avatar: 'https://i.pravatar.cc/40?img=32' }
	];

	function pickPerson() {
		return teammates[Math.floor(Math.random() * teammates.length)];
	}

	function pushInfo() {
		notifications.push({
			category: 'info',
			title: 'Build #482 finished',
			body: 'main · 3m 22s · 0 warnings',
			source: 'Builds',
			icon: 'CircleCheckBig',
			actions: [
				{
					label: 'View',
					variant: 'secondary',
					onclick: () => toast.info('Opened build')
				}
			]
		});
	}

	function pushSuccess() {
		notifications.push({
			category: 'success',
			title: 'Deploy successful',
			body: 'release/v0.4 promoted to production',
			source: 'Deploys',
			icon: 'Rocket'
		});
	}

	function pushWarning() {
		notifications.push({
			category: 'warning',
			title: 'Quota nearing limit',
			body: '92% of monthly Edge function invocations used',
			source: 'Billing',
			icon: 'Gauge',
			actions: [
				{
					label: 'Upgrade',
					variant: 'primary',
					onclick: () => toast.info('Upgrade flow')
				}
			]
		});
	}

	function pushError() {
		notifications.push({
			category: 'error',
			title: 'Deploy failed',
			body: 'feat/billing-revamp · webpack: 2 errors',
			source: 'Deploys',
			icon: 'CircleX',
			actions: [
				{
					label: 'Retry',
					variant: 'secondary',
					onclick: () => toast.info('Retrying…')
				},
				{
					label: 'Logs',
					variant: 'ghost',
					onclick: () => toast.info('Opened logs')
				}
			]
		});
	}

	function pushMention() {
		const p = pickPerson();
		notifications.push({
			category: 'mention',
			title: `${p.name} mentioned you`,
			body: '“@you any chance you can review the palette PR before EOD?”',
			source: p.name,
			image: p.avatar,
			actions: [
				{
					label: 'Reply',
					variant: 'primary',
					onclick: () => toast.info('Reply opened')
				}
			]
		});
	}

	function spam() {
		const fns = [pushInfo, pushSuccess, pushWarning, pushError, pushMention];
		fns.forEach((fn, i) => setTimeout(fn, i * 90));
	}
</script>

<svelte:head><title>Notification Center | Glow UI</title></svelte:head>

<Heading level={1}>Notification Center</Heading>
<Text size="lg" variant="secondary" style="margin-bottom: 2rem;">
	Persistent, browsable counterpart to <Code>Toast</Code>. Any module can push a
	notification into the singleton registry — the panel surfaces them grouped, with inline
	actions, snooze, and auto-mark-read on dwell.
</Text>

<Card title="Try it">
	<Text variant="secondary" size="sm" style="margin-bottom: 1rem;">
		Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">N</Kbd> (or <Kbd size="sm">Ctrl</Kbd>
		<Kbd size="sm">N</Kbd>) anywhere on this page to open the panel.
	</Text>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem;">
		<Button label="Open panel" onclick={() => { open = true; }} />
		<Pill label={`${notifications.unreadCount} unread`} />
	</div>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<Button label="Info — build" variant="secondary" onclick={pushInfo} />
		<Button label="Success — deploy" variant="secondary" onclick={pushSuccess} />
		<Button label="Warning — quota" variant="secondary" onclick={pushWarning} />
		<Button label="Error — deploy fail" variant="secondary" onclick={pushError} />
		<Button label="Mention" variant="secondary" onclick={pushMention} />
		<Button label="Spam 5" variant="ghost" onclick={spam} />
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Grouping">
	<Text variant="secondary" size="sm" style="margin-bottom: 0.75rem;">
		The panel buckets entries by time (default) or by source.
	</Text>
	<div style="display: flex; gap: 0.5rem;">
		<Button
			label="By time"
			variant={groupBy === 'time' ? 'primary' : 'secondary'}
			onclick={() => {
				groupBy = 'time';
			}}
		/>
		<Button
			label="By source"
			variant={groupBy === 'source' ? 'primary' : 'secondary'}
			onclick={() => {
				groupBy = 'source';
			}}
		/>
		<Button
			label="No grouping"
			variant={groupBy === 'none' ? 'primary' : 'secondary'}
			onclick={() => {
				groupBy = 'none';
			}}
		/>
	</div>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Pushing notifications">
	<CodeBlock
		language="ts"
		code={`import { notifications } from 'glow';

notifications.push({
    category: 'mention',
    title: 'Alice mentioned you',
    body: 'In the palette PR thread',
    source: 'Alice Becker',
    image: aliceAvatarUrl,
    actions: [
        { label: 'Reply', variant: 'primary', onclick: openReply },
        { label: 'Mute thread', variant: 'ghost', onclick: muteThread }
    ],
    mirror: true   // also fires a Toast for ephemeral feedback
});`}
	/>
</Card>

<div style="margin-top: 1.5rem;"></div>
<Card title="Mounting">
	<CodeBlock
		language="svelte"
		code={`<script>
    import { NotificationCenter } from 'glow';
    let open = $state(false);
<\/script>

<NotificationCenter bind:open groupBy="time" />`}
	/>
</Card>

<NotificationCenter bind:open {groupBy} />
