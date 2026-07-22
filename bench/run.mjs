#!/usr/bin/env node
// Runs the shader benchmark on the real GPU.
//
// Headless Chrome on macOS reaches the Apple GPU through ANGLE's Metal backend
// and exposes EXT_disjoint_timer_query_webgl2, so these are true GPU times for
// the draw call itself, not wall-clock guesses around a rAF loop.
//
//   node bench/run.mjs                      # all variants
//   node bench/run.mjs baseline halfres     # only these
//   node bench/run.mjs --json out.json
//   node bench/run.mjs --snapshot halfres   # write a PNG for eyeballing
//
// Runs are serialized through a lock file: two benchmarks sharing one GPU
// would measure each other's contention rather than their own cost.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BENCH = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOCK = process.env.BENCH_LOCK || join(BENCH, '.bench.lock');

const RESOLUTIONS = [
	[1280, 720], // 0.92 MP — typical laptop hero section
	[1600, 900], // 1.44 MP — the component's default maxPixelCount
	[2560, 1440] // 3.69 MP — uncapped retina, the worst realistic case
];
const COMPARE_AT = [640, 360];

const argv = process.argv.slice(2);
const flag = (n) => {
	const i = argv.indexOf(n);
	return i === -1 ? null : argv[i + 1];
};
const jsonOut = flag('--json');
const snapshot = flag('--snapshot');
// Batch snapshot every variant whose name starts with this prefix, in one
// browser session, writing JPEG thumbnails for gallery assembly.
const galleryArg = flag('--gallery');
// Measure how fast each pattern's image evolves, for normalising the speed prop.
const speedArg = flag('--speed-probe');
// Render each variant at several morph values, e.g. --morph 0,0.25,0.5,0.75,1
const morphArg = flag('--morph');
const framesArg = Number(flag('--frames') || 60);
const presetArg = flag('--preset') || 'default';
// Snapshot geometry matters for banding/grain judgement: artifacts are relative
// to pixel scale, so a square-ish 800x450 can hide what a wide short canvas shows.
const sizeArg = (flag('--size') || '800x450').split('x').map(Number);
// Fidelity is normally measured against `baseline`. When chasing grain we want
// to measure against a CONVERGED reference instead — the noise-free image the
// 13-tap loop is a noisy estimate of — so --ref promotes another variant to the
// comparison anchor.
const refArg = flag('--ref');
const only = argv.filter((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--json' && argv[argv.indexOf(a) - 1] !== '--snapshot' && argv[argv.indexOf(a) - 1] !== '--frames');

// ── lock ────────────────────────────────────────────────────────────────────
// Only one benchmark may touch the GPU at a time: two concurrent runs would
// measure each other's contention instead of their own cost. `mkdir` is the
// atomic primitive here — it either creates the directory or fails, with no
// window between check and create.
//
// The holder stamps its identity into the lock and refreshes a heartbeat, so a
// run that dies without releasing (crash, SIGKILL, closed terminal) can be
// detected and stolen instead of stalling everyone until the timeout.
const LOCK_META = join(LOCK, 'holder.json');
const HEARTBEAT_MS = 5000;
const STALE_AFTER_MS = 60000; // ~12 missed heartbeats
let heartbeatTimer = null;

function writeHolder() {
	writeFileSync(
		LOCK_META,
		JSON.stringify({
			pid: process.pid,
			cmd: process.argv.slice(2).join(' ') || '(all variants)',
			startedAt: Date.now(),
			beat: Date.now()
		})
	);
}

function readHolder() {
	try {
		return JSON.parse(readFileSync(LOCK_META, 'utf8'));
	} catch {
		return null; // lock exists but no metadata yet, or written by an older run
	}
}

function alive(pid) {
	try {
		process.kill(pid, 0); // signal 0 tests existence without delivering anything
		return true;
	} catch {
		return false;
	}
}

// A lock is stealable only when we can positively show the holder is gone: its
// process is dead, or it stopped heartbeating well past any plausible pause.
// Without metadata we never steal — waiting is always the safe failure.
function stealIfDead() {
	const h = readHolder();
	if (!h) return false;
	const stale = Date.now() - h.beat > STALE_AFTER_MS;
	if (alive(h.pid) && !stale) return false;
	console.error(
		`[bench] stealing lock from pid ${h.pid} (${alive(h.pid) ? 'no heartbeat for ' + Math.round((Date.now() - h.beat) / 1000) + 's' : 'process is gone'})`
	);
	rmSync(LOCK, { recursive: true, force: true });
	return true;
}

async function acquireLock() {
	for (let i = 0; i < 900; i++) {
		try {
			mkdirSync(LOCK);
			writeHolder();
			heartbeatTimer = setInterval(() => {
				try {
					const h = readHolder();
					if (h && h.pid === process.pid) writeFileSync(LOCK_META, JSON.stringify({ ...h, beat: Date.now() }));
				} catch {}
			}, HEARTBEAT_MS);
			heartbeatTimer.unref?.();
			return;
		} catch {
			if (stealIfDead()) continue;
			if (i === 0) {
				const h = readHolder();
				console.error(
					h
						? `[bench] GPU lock held by pid ${h.pid} (${h.cmd}), running ${Math.round((Date.now() - h.startedAt) / 1000)}s; waiting…`
						: '[bench] another run holds the GPU lock; waiting…'
				);
			}
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
	throw new Error('timed out waiting for bench lock after 15min (stale? rm -rf bench/.bench.lock)');
}

// Synchronous on purpose: an async unlink never completes inside an 'exit'
// handler, which is exactly the path a crashing run takes.
function releaseLock() {
	if (heartbeatTimer) clearInterval(heartbeatTimer);
	const h = readHolder();
	if (h && h.pid !== process.pid) return; // not ours; someone stole it after we stalled
	try {
		rmSync(LOCK, { recursive: true, force: true });
	} catch {}
}

// Arm cleanup for every path that can end the process. Must be called by
// anything that acquires the lock — a path that acquires without arming these
// leaks the lock on any signal.
let cleanupArmed = false;
function installCleanupHandlers() {
	if (cleanupArmed) return;
	cleanupArmed = true;
	process.on('exit', releaseLock);
	for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
		process.on(sig, () => {
			releaseLock();
			killChrome();
			process.exit(1);
		});
	}
	process.on('uncaughtException', (e) => {
		console.error(e);
		releaseLock();
		killChrome();
		process.exit(1);
	});
}

// ── static server ───────────────────────────────────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
function serve() {
	return new Promise((resolve) => {
		const server = createServer(async (req, res) => {
			const path = join(BENCH, decodeURIComponent(req.url.split('?')[0]));
			try {
				const body = await readFile(path);
				res.writeHead(200, { 'content-type': MIME[extname(path)] || 'text/plain' });
				res.end(body);
			} catch {
				res.writeHead(404);
				res.end('not found');
			}
		});
		server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
	});
}

// ── chrome + CDP ────────────────────────────────────────────────────────────
let chromeProc = null;
function killChrome() {
	try {
		chromeProc?.kill('SIGKILL');
	} catch {}
}
async function launchChrome(url) {
	const userDir = join(BENCH, `.chrome-profile-${process.pid}`);
	await rm(userDir, { recursive: true, force: true });
	const proc = spawn(
		CHROME,
		[
			'--headless=new',
			'--use-angle=metal',
			'--enable-gpu',
			'--disable-gpu-sandbox',
			'--enable-unsafe-webgpu',
			'--remote-debugging-port=0',
			`--user-data-dir=${userDir}`,
			'--no-first-run',
			'--disable-extensions',
			'--disable-background-timer-throttling',
			'--disable-renderer-backgrounding',
			'--window-size=1200,800',
			url
		],
		{ stdio: ['ignore', 'ignore', 'pipe'] }
	);

	// Chrome prints the DevTools endpoint on stderr once it is listening.
	const wsUrl = await new Promise((resolve, reject) => {
		let buf = '';
		const t = setTimeout(() => reject(new Error('chrome did not start')), 30000);
		proc.stderr.on('data', (d) => {
			buf += d;
			const m = buf.match(/ws:\/\/[^\s]+/);
			if (m) {
				clearTimeout(t);
				resolve(m[0]);
			}
		});
		proc.on('exit', (c) => reject(new Error('chrome exited: ' + c)));
	});
	return { proc, wsUrl };
}

async function cdp(browserWsUrl, url) {
	const base = browserWsUrl.match(/ws:\/\/([^/]+)/)[1];
	// Find the page target for our URL.
	let target = null;
	for (let i = 0; i < 60 && !target; i++) {
		const list = await (await fetch(`http://${base}/json/list`)).json();
		target = list.find((t) => t.type === 'page' && t.url.startsWith(url.split('?')[0]));
		if (!target) await new Promise((r) => setTimeout(r, 250));
	}
	if (!target) throw new Error('page target not found');

	const ws = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((r, j) => {
		ws.onopen = r;
		ws.onerror = j;
	});
	let id = 0;
	const pending = new Map();
	ws.onmessage = (e) => {
		const msg = JSON.parse(e.data);
		if (msg.id && pending.has(msg.id)) {
			const { resolve, reject } = pending.get(msg.id);
			pending.delete(msg.id);
			msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
		}
	};
	const send = (method, params = {}) =>
		new Promise((resolve, reject) => {
			const i = ++id;
			pending.set(i, { resolve, reject });
			ws.send(JSON.stringify({ id: i, method, params }));
		});

	const evaluate = async (expression) => {
		const r = await send('Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true
		});
		if (r.exceptionDetails) {
			throw new Error(
				r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)
			);
		}
		return r.result.value;
	};
	return { evaluate, close: () => ws.close() };
}

// ── report ──────────────────────────────────────────────────────────────────
function fmt(n, d = 3) {
	return n === null || n === undefined ? '   —  ' : n.toFixed(d);
}

// ── lock introspection / self-test (no GPU involved) ────────────────────────
if (argv.includes('--lock-status')) {
	const h = readHolder();
	if (!existsSync(LOCK)) console.log('lock: free');
	else if (!h) console.log('lock: HELD by an unidentified run (no metadata)');
	else
		console.log(
			`lock: HELD by pid ${h.pid} (${alive(h.pid) ? 'alive' : 'DEAD'})\n` +
				`  cmd:       ${h.cmd}\n` +
				`  running:   ${Math.round((Date.now() - h.startedAt) / 1000)}s\n` +
				`  heartbeat: ${Math.round((Date.now() - h.beat) / 1000)}s ago`
		);
	process.exit(0);
}

// Acquire, hold, release — the same code path a real run uses, minus Chrome.
// Two of these launched at once must not overlap in their held windows.
if (argv.includes('--lock-selftest')) {
	const holdMs = Number(flag('--lock-selftest') || 2000);
	const t0 = Date.now();
	await acquireLock();
	installCleanupHandlers();
	console.log(`${process.pid} ACQUIRED at +${Date.now() - t0}ms`);
	await new Promise((r) => setTimeout(r, holdMs));
	console.log(`${process.pid} RELEASING at +${Date.now() - t0}ms`);
	releaseLock();
	process.exit(0);
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
	await acquireLock();
	installCleanupHandlers();

	const files = (await readdir(join(BENCH, 'variants')))
		.filter((f) => f.endsWith('.js'))
		.sort((a, b) => (a.startsWith('baseline') ? -1 : b.startsWith('baseline') ? 1 : a.localeCompare(b)));
	const selected = only.length
		? files.filter((f) => only.includes(f.replace('.js', '')) || only.includes('baseline'))
		: files;
	let list = only.length
		? [...new Set(['baseline.js', ...files.filter((f) => only.includes(f.replace('.js', '')))])]
		: selected;
	// The harness anchors fidelity on whichever variant it measures first.
	if (refArg) {
		const refFile = `${refArg}.js`;
		if (!files.includes(refFile)) throw new Error(`unknown --ref '${refArg}'`);
		list = [refFile, ...list.filter((f) => f !== refFile)];
		console.log(`[bench] fidelity anchored on: ${refArg}`);
	}

	const { PRESETS } = await import('./lib/singlepass.js').catch(() => ({ PRESETS: { default: {} } }));
	const preset = PRESETS[presetArg];
	if (!preset) throw new Error(`unknown --preset '${presetArg}'; have: ${Object.keys(PRESETS).join(', ')}`);
	if (presetArg !== 'default') console.log(`[bench] preset: ${presetArg}`);

	const { server, port } = await serve();
	const url = `http://127.0.0.1:${port}/harness.html`;
	const { proc, wsUrl } = await launchChrome(url);
	chromeProc = proc;
	const client = await cdp(wsUrl, url);

	try {
		for (let i = 0; i < 120; i++) {
			if (await client.evaluate('window.__ready === true')) break;
			await new Promise((r) => setTimeout(r, 250));
		}

		if (speedArg) {
			const names = files.map((f) => f.replace('.js', '')).filter((n) => n.startsWith(speedArg)).sort();
			if (!names.length) throw new Error(`no variants match '${speedArg}'`);
			console.log(`[bench] probing ${names.length} variants`);
			const res = await client.evaluate(
				`window.__speedProbe(${JSON.stringify({
					variants: names.map((n) => './variants/' + n + '.js'),
					w: 256, h: 108,
					dts: [0.05, 0.1, 0.2, 0.35, 0.6, 1, 1.7, 2.8, 4.5, 7.5, 12, 20, 33],
					bases: [2, 17, 41, 73, 109],
					params: preset
				})})`
			);
			const ref = res.find((r) => r.name === 'baseline' || r.name === 'shipped');
			console.log('\nvariant'.padEnd(26) + 'half-life s'.padStart(12) + 'scale'.padStart(9));
			for (const e of res) {
				if (e.error) { console.log(e.name.padEnd(26) + '  ERROR ' + e.error.split('\n')[0]); continue; }
				const scale = ref?.halfLife && e.halfLife ? ref.halfLife / e.halfLife : null;
				console.log(
					e.name.padEnd(26) +
						(e.halfLife == null ? '   —' : e.halfLife.toFixed(2)).padStart(12) +
						(scale == null ? '   —' : scale.toFixed(3)).padStart(9)
				);
			}
			await writeFile(join(BENCH, 'speed-probe.json'), JSON.stringify(res, null, 2));
			return;
		}

		if (galleryArg) {
			const names = files
				.map((f) => f.replace('.js', ''))
				.filter((n) => n.startsWith(galleryArg))
				.sort();
			if (!names.length) throw new Error(`no variants match prefix '${galleryArg}'`);
			console.log(`[bench] rendering ${names.length} variants at ${sizeArg.join('x')}`);
			const morphs = morphArg ? morphArg.split(',').map(Number) : [null];
			const shots = [];
			for (const m of morphs) {
				const params = m === null ? preset : { ...preset, morph: m };
				const batch = await client.evaluate(
					`window.__gallery(${JSON.stringify({
						variants: names.map((n) => './variants/' + n + '.js'),
						w: sizeArg[0],
						h: sizeArg[1],
						params,
						format: 'image/jpeg',
						quality: 0.86
					})})`
				);
				for (const b of batch) shots.push(m === null ? b : { ...b, name: `${b.name}@m${m}` });
			}
			const dir = join(BENCH, 'gallery');
			await mkdir(dir, { recursive: true }).catch(() => {});
			const index = [];
			for (const s of shots) {
				if (s.error) {
					console.log(`  ✗ ${s.name}: ${s.error.split('\n')[0]}`);
					continue;
				}
				const file = join(dir, `${s.name}.jpg`);
				await writeFile(file, Buffer.from(s.url.split(',')[1], 'base64'));
				index.push({ name: s.name, description: s.description, ms: s.ms, file });
				console.log(`  ✓ ${s.name.padEnd(28)} ${s.ms == null ? '   —' : s.ms.toFixed(2)} ms/frame`);
			}
			await writeFile(join(dir, 'index.json'), JSON.stringify(index, null, 2));
			console.log(`\nwrote ${index.length} images to ${dir}`);
			return;
		}

		if (snapshot) {
			const url = await client.evaluate(
				`window.__snapshot(${JSON.stringify('./variants/' + snapshot + '.js')}, ${sizeArg[0]}, ${sizeArg[1]}, 3.0, ${JSON.stringify(preset)})`
			);
			const suffix = presetArg === 'default' ? '' : `-${presetArg}`;
			const out = join(BENCH, `snapshot-${snapshot}${suffix}.png`);
			await writeFile(out, Buffer.from(url.split(',')[1], 'base64'));
			console.log('wrote', out);
			return;
		}

		const opts = {
			variants: list.map((f) => './variants/' + f),
			resolutions: RESOLUTIONS,
			frames: framesArg,
			warmup: 15,
			compareAt: COMPARE_AT,
			params: preset
		};
		const results = await client.evaluate(`window.__runBench(${JSON.stringify(opts)})`);
		printTable(results);
		if (jsonOut) await writeFile(jsonOut, JSON.stringify(results, null, 2));
	} finally {
		client.close();
		killChrome();
		server.close();
		await rm(join(BENCH, `.chrome-profile-${process.pid}`), { recursive: true, force: true }).catch(() => {});
		releaseLock();
	}
}

function printTable(results) {
	const base = results.find((r) => r.name === 'baseline') ?? results[0];
	const resKeys = Object.keys(base?.res ?? {});

	for (const key of resKeys) {
		const [w, h] = key.split('x').map(Number);
		const mp = ((w * h) / 1e6).toFixed(2);
		console.log(`\n─── ${key} (${mp} MP) ${'─'.repeat(40)}`);
		console.log(
			'variant'.padEnd(22) +
				'gpu ms'.padStart(9) +
				'p95'.padStart(9) +
				'wall ms'.padStart(9) +
				'speedup'.padStart(9) +
				'  fps@1x'
		);
		const b = base?.res[key];
		for (const r of results) {
			if (r.error) {
				console.log(r.name.padEnd(22) + '  ERROR: ' + r.error.split('\n')[0]);
				continue;
			}
			const e = r.res[key];
			if (!e) continue;
			const speed = b && e.gpuMedian ? b.gpuMedian / e.gpuMedian : null;
			console.log(
				r.name.padEnd(22) +
					fmt(e.gpuMedian).padStart(9) +
					fmt(e.gpuP95).padStart(9) +
					fmt(e.wallMs).padStart(9) +
					(speed ? speed.toFixed(2) + '×' : '   —  ').padStart(9) +
					'  ' +
					(e.gpuMedian ? (1000 / e.gpuMedian).toFixed(0) : '—')
			);
		}
	}

	console.log(`\n─── fidelity vs ${refArg ?? 'baseline'} @ ${COMPARE_AT.join('x')} ${'─'.repeat(24)}`);
	console.log('variant'.padEnd(22) + 'RMSE'.padStart(8) + 'maxΔ'.padStart(8) + 'PSNR dB'.padStart(10));
	for (const r of results) {
		if (!r.fidelity) continue;
		console.log(
			r.name.padEnd(22) +
				r.fidelity.rmse.toFixed(2).padStart(8) +
				String(r.fidelity.maxDelta).padStart(8) +
				(r.fidelity.psnr === null || !isFinite(r.fidelity.psnr)
					? '  ∞ (identical)'
					: r.fidelity.psnr.toFixed(1).padStart(10))
		);
	}
	console.log('\ndescriptions:');
	for (const r of results) console.log(`  ${r.name.padEnd(20)} ${r.description ?? ''}`);
}

main().catch(async (e) => {
	console.error(e);
	killChrome();
	releaseLock();
	process.exit(1);
});
