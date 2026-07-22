#!/usr/bin/env node
// Assembles every pattern into ONE self-contained, LIVE gallery page.
//
// The page embeds the actual GLSL and runs the real shaders in the browser
// rather than shipping screenshots — most of these designs only make sense in
// motion. Embedding source is also far smaller than embedding images.
//
// Two constraints shape the runtime design:
//   * Browsers cap WebGL contexts at roughly 16 per page, so one canvas per
//     card does not scale to 36 designs.
//   * 36 shaders animating at once would saturate the GPU regardless.
// So: a SINGLE shared WebGL2 context renders into one offscreen canvas, and
// each frame only the cards currently in the viewport are drawn and blitted
// into their own cheap 2D canvas.
//
//   node bench/run.mjs --gallery pat- --size 900x375   # for timings
//   node bench/build-gallery.mjs

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BENCH = dirname(fileURLToPath(import.meta.url));
const OUT = join(BENCH, 'gallery.html');

const FAMILIES = {
	'pat-flow': ['Flow & fluid', 'Aurora, curl-noise, ink, plasma, nebula, oil film'],
	'pat-geo': ['Geometric & crystalline', 'Voronoi shards, prisms, Truchet, moiré, mandala, iso-blocks'],
	'pat-org': ['Organic & cellular', 'Metaballs, marble, Turing patterns, foam, mycelium, agate'],
	'pat-opt': ['Light & optics', 'Caustics, bokeh, dispersion, god rays, iridescence'],
	'pat-ter': ['Terrain & structure', 'Contours, papercut relief, wireframe, strata, massif, dunes'],
	'pat-gfx': ['Graphic & retro', 'Halftone, CRT, dither, gradient mesh, ripple, vaporwave']
};

const esc = (s) =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

// Timings from the last full --gallery pass, if present.
let timings = new Map();
try {
	const idx = JSON.parse(await readFile(join(BENCH, 'gallery', 'index.json'), 'utf8'));
	timings = new Map(idx.map((e) => [e.name, e.ms]));
} catch {}

const files = (await readdir(join(BENCH, 'variants')))
	.filter((f) => f.startsWith('pat-') && f.endsWith('.js'))
	.sort();

const designs = [];
const problems = [];
for (const f of files) {
	const name = f.replace(/\.js$/, '');
	try {
		const mod = (await import(pathToFileURL(join(BENCH, 'variants', f)).href)).default;
		if (!mod?.fragmentShader) {
			problems.push({ name, note: 'not a single-pass variant — no GLSL to embed' });
			continue;
		}
		designs.push({
			name: mod.name || name,
			description: mod.description || '',
			ms: timings.get(mod.name || name) ?? null,
			vs: mod.vertexShader,
			fs: mod.fragmentShader
		});
	} catch (e) {
		problems.push({ name, note: String(e.message || e).split('\n')[0] });
	}
}

const groups = Object.entries(FAMILIES)
	.map(([prefix, [title, blurb]]) => ({
		prefix,
		title,
		blurb,
		items: designs.filter((d) => d.name.startsWith(prefix))
	}))
	.filter((g) => g.items.length);
const other = designs.filter((d) => !Object.keys(FAMILIES).some((p) => d.name.startsWith(p)));
if (other.length) groups.push({ prefix: 'other', title: 'Other', blurb: '', items: other });

const REFERENCE_MS = 1.9; // the shipping fold-gradient shader at this size
const maxMs = Math.max(...designs.map((d) => d.ms ?? 0), REFERENCE_MS);

const frame = (d) => `
				<figure class="frame" data-shader="${esc(d.name)}">
					<div class="stage">
						<canvas data-name="${esc(d.name)}"></canvas>
						<div class="legibility" aria-hidden="true">
							<span class="h">Sheets of light</span>
							<span class="b">Does body copy survive on top of this pattern?</span>
						</div>
						<button class="zoom" type="button" aria-label="Enlarge ${esc(d.name)}"></button>
					</div>
					<figcaption>
						<div class="row">
							<code>${esc(d.name.replace(/^pat-[a-z]+-/, ''))}</code>
							<span class="ms">${d.ms != null ? d.ms.toFixed(2) : '—'}<i>ms</i></span>
						</div>
						<div class="meter"><span style="width:${d.ms != null ? Math.max(2, (d.ms / maxMs) * 100).toFixed(1) : 0}%"></span></div>
						${d.description ? `<p class="desc">${esc(d.description)}</p>` : ''}
					</figcaption>
				</figure>`;

const html = `<title>Glow UI — shader pattern contact sheet</title>
<style>
	:root {
		color-scheme: dark light;
		--bg: #080b0c;
		--panel: #0d1113;
		--ink: #e4eae9;
		--dim: #7c8a89;
		--line: #1b2225;
		--signal: #6fb4c9;
		--mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
		--sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, sans-serif;
	}
	@media (prefers-color-scheme: light) {
		:root {
			--bg: #f6f8f8; --panel: #fff; --ink: #0e1413; --dim: #5d6a69; --line: #dde3e3;
			--signal: #1f6b83;
		}
	}
	:root[data-theme='dark'] {
		--bg: #080b0c; --panel: #0d1113; --ink: #e4eae9; --dim: #7c8a89; --line: #1b2225;
		--signal: #6fb4c9;
	}
	:root[data-theme='light'] {
		--bg: #f6f8f8; --panel: #fff; --ink: #0e1413; --dim: #5d6a69; --line: #dde3e3;
		--signal: #1f6b83;
	}
	* { box-sizing: border-box; }
	body {
		margin: 0; background: var(--bg); color: var(--ink);
		font: 14px/1.6 var(--sans); padding: 0 20px 96px;
	}
	.wrap { max-width: 1240px; margin: 0 auto; }
	header { padding: 52px 0 22px; }
	.eyebrow {
		font: 11px/1 var(--mono); letter-spacing: .16em; text-transform: uppercase;
		color: var(--dim); margin-bottom: 14px;
	}
	h1 {
		font: 600 27px/1.15 var(--mono); letter-spacing: -0.02em; margin: 0 0 12px;
		text-wrap: balance;
	}
	.lede { color: var(--dim); margin: 0; max-width: 68ch; font-size: 14.5px; }
	.lede code { font: 12.5px var(--mono); color: var(--ink); }

	.bar {
		position: sticky; top: 0; z-index: 20;
		display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center;
		padding: 12px 0; margin: 20px 0 8px;
		background: color-mix(in oklab, var(--bg) 92%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--line);
		font: 11px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase;
	}
	.bar .grp { display: flex; gap: 6px; align-items: center; }
	.bar label { color: var(--dim); }
	select, .btn {
		font: 11px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase;
		background: var(--panel); color: var(--ink);
		border: 1px solid var(--line); border-radius: 2px;
		padding: 7px 10px; cursor: pointer;
	}
	.btn[aria-pressed='true'] { border-color: var(--signal); color: var(--signal); }
	.btn:focus-visible, select:focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }
	.stat { color: var(--dim); margin-left: auto; font-variant-numeric: tabular-nums; text-transform: none; letter-spacing: 0; }

	section { margin: 38px 0 0; }
	section h2 {
		font: 600 13px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase;
		margin: 0 0 4px;
	}
	section h2 .n { color: var(--dim); font-weight: 400; }
	.blurb { color: var(--dim); font-size: 12.5px; margin: 0 0 14px; }

	.sheet { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
	.frame {
		margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 2px;
		overflow: hidden; display: flex; flex-direction: column;
	}
	.stage { position: relative; aspect-ratio: 1000/420; background: #000; }
	.stage canvas { display: block; width: 100%; height: 100%; }
	.zoom {
		position: absolute; inset: 0; width: 100%; height: 100%;
		background: none; border: 0; cursor: zoom-in; padding: 0;
	}
	.zoom:focus-visible { outline: 2px solid var(--signal); outline-offset: -3px; }
	.legibility {
		position: absolute; inset: 0; display: none; flex-direction: column; justify-content: center;
		padding: 0 22px; pointer-events: none; color: #fff;
	}
	body.legible .legibility { display: flex; }
	.legibility .h { font: 600 22px/1.2 var(--sans); letter-spacing: -0.01em; }
	.legibility .b { font: 13px/1.45 var(--sans); opacity: .92; margin-top: 5px; max-width: 34ch; }

	figcaption { padding: 9px 11px 11px; display: flex; flex-direction: column; gap: 6px; }
	.row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
	.row code { font: 600 13px var(--mono); color: var(--ink); }
	.ms { font: 11px var(--mono); color: var(--dim); font-variant-numeric: tabular-nums; }
	.ms i { font-style: normal; opacity: .55; margin-left: 2px; }
	.meter { height: 2px; background: var(--line); border-radius: 1px; overflow: hidden; }
	.meter span { display: block; height: 100%; background: var(--signal); opacity: .55; }
	.desc { margin: 0; font-size: 12px; line-height: 1.45; color: var(--dim); }

	.frame.open { grid-column: 1 / -1; }
	.frame.open .zoom { cursor: zoom-out; }

	details { margin-top: 34px; border: 1px solid var(--line); border-radius: 2px; padding: 12px 14px; }
	summary { cursor: pointer; color: var(--dim); font: 11px var(--mono); letter-spacing: .08em; text-transform: uppercase; }
	details ul { margin: 10px 0 0; padding-left: 18px; }
	details li { font: 12px var(--mono); color: #e0736a; }
	.err {
		position: absolute; inset: 0; display: grid; place-items: center; padding: 10px;
		font: 10px/1.4 var(--mono); color: #e0736a; text-align: center; overflow: auto;
	}
	@media (max-width: 560px) {
		.sheet { grid-template-columns: 1fr; }
		body { padding: 0 14px 64px; }
	}
</style>
<div class="wrap">
	<header>
		<div class="eyebrow">Glow UI · pattern exploration · ${designs.length} designs</div>
		<h1>Shader contact sheet</h1>
		<p class="lede">
			Every pattern generated for <code>&lt;Glow pattern="…" /&gt;</code>, unfiltered — the weak
			ones are here too. These are <strong>live WebGL2 shaders, not recordings</strong>: switch the
			palette and all of them re-colour, because each drives its colour from the same
			<code>colors</code> prop the component already exposes. Only frames on screen are rendered.
			Timings are GPU-measured per frame at 900×375 on an M1; the shipping fold-gradient shader is
			<strong>${REFERENCE_MS.toFixed(1)} ms</strong> there for comparison.
		</p>
	</header>

	<div class="bar">
		<div class="grp">
			<label for="pal">Palette</label>
			<select id="pal"></select>
		</div>
		<div class="grp" id="fams">
			<label>Family</label>
			<button class="btn" data-fam="all" aria-pressed="true">All</button>
${groups.map((g) => `			<button class="btn" data-fam="${esc(g.prefix)}" aria-pressed="false">${esc(g.title.split(' ')[0])}</button>`).join('\n')}
		</div>
		<div class="grp">
			<button class="btn" id="legible" aria-pressed="false">Text test</button>
			<button class="btn" id="toggle" aria-pressed="true">Pause</button>
		</div>
		<span class="stat" id="stat"></span>
	</div>

${groups
	.map(
		(g) => `	<section data-fam="${esc(g.prefix)}">
		<h2>${esc(g.title)} <span class="n">· ${g.items.length}</span></h2>
		<p class="blurb">${esc(g.blurb)}</p>
		<div class="sheet">${g.items.map(frame).join('')}
		</div>
	</section>`
	)
	.join('\n')}
${
	problems.length
		? `	<details open><summary>${problems.length} could not be embedded</summary>
		<ul>${problems.map((p) => `<li>${esc(p.name)} — ${esc(p.note)}</li>`).join('')}</ul></details>`
		: ''
}
</div>
<script type="module">
const SHADERS = ${JSON.stringify(Object.fromEntries(designs.map((d) => [d.name, { vs: d.vs, fs: d.fs }])))};

const PALETTES = {
	'Glow default':    { colors:['#700000','#008cff','#75daff','#ff0026','#ff3626'], back:'#121212', shadow:'#0a1c2a' },
	'Violet / pink':   { colors:['#1a0033','#7c3aed','#ec4899','#f97316','#fde047'], back:'#0a0612', shadow:'#1a0b2e' },
	'Teal / deep sea': { colors:['#001b2e','#006d77','#83c5be','#00d2ff'],           back:'#04121a', shadow:'#012a38' },
	'Mono slate':      { colors:['#0b0f17','#3b4a63','#8ea3c4','#dbe6f5'],           back:'#080a0f', shadow:'#141a26' },
	'Ember':           { colors:['#1a0500','#7c2d12','#ea580c','#fbbf24','#fff7ed'], back:'#0d0603', shadow:'#2a0f06' },
	'Acid':            { colors:['#04110a','#065f46','#22c55e','#a3e635','#f0fdf4'], back:'#030d07', shadow:'#08301f' }
};

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function hexLin(hex) {
	const h = hex.replace('#', '');
	const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
	const n = parseInt(f.slice(0, 6), 16);
	return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)];
}

const stat = document.getElementById('stat');
const off = document.createElement('canvas');
const gl = off.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });

if (!gl) {
	stat.textContent = 'WebGL2 unavailable — cannot render live';
} else {
	const GRID = [660, 277];
	const BIG = [1280, 538];
	let res = [0, 0];
	function setRes(w, h) {
		if (res[0] === w && res[1] === h) return;
		off.width = w; off.height = h; res = [w, h];
	}
	setRes(GRID[0], GRID[1]);

	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

	const progs = new Map();
	function build(name) {
		if (progs.has(name)) return progs.get(name);
		let entry;
		try {
			const src = SHADERS[name];
			const sh = (type, s) => {
				const o = gl.createShader(type);
				gl.shaderSource(o, s);
				gl.compileShader(o);
				if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
				return o;
			};
			const p = gl.createProgram();
			gl.attachShader(p, sh(gl.VERTEX_SHADER, src.vs));
			gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src.fs));
			gl.linkProgram(p);
			if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
			const cache = new Map();
			entry = { program: p, u: (n) => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n)); return cache.get(n); } };
		} catch (e) {
			entry = { error: String((e && e.message) || e).slice(0, 400) };
		}
		progs.set(name, entry);
		return entry;
	}

	let palette = PALETTES['Glow default'];
	const cbuf = new Float32Array(20);
	function pushUniforms(e) {
		gl.useProgram(e.program);
		const cols = palette.colors.slice(0, 5);
		for (let i = 0; i < 5; i++) {
			const [r, g, b] = hexLin(cols[i] ?? cols[cols.length - 1]);
			cbuf.set([r, g, b, 1], i * 4);
		}
		gl.uniform4fv(e.u('u_colors'), cbuf);
		gl.uniform1f(e.u('u_ncols'), Math.min(5, cols.length));
		gl.uniform3fv(e.u('u_back'), hexLin(palette.back));
		gl.uniform3fv(e.u('u_shadow'), hexLin(palette.shadow));
		gl.uniform1f(e.u('u_softness'), 1);
		gl.uniform1f(e.u('u_saturation'), 1);
		gl.uniform1f(e.u('u_noise'), 0);
		gl.uniform1f(e.u('u_rotation'), 52);
		gl.uniform1f(e.u('u_folds'), 9);
		gl.uniform1f(e.u('u_ribbon'), 0);
		gl.uniform1f(e.u('u_ribbonWidth'), 1);
		gl.uniform2f(e.u('u_resolution'), off.width, off.height);
	}

	const frames = [...document.querySelectorAll('.frame')];
	const ctxs = new Map();
	for (const f of frames) {
		const cv = f.querySelector('canvas');
		cv.width = GRID[0]; cv.height = GRID[1];
		ctxs.set(f, cv.getContext('2d'));
	}

	const visible = new Set();
	const io = new IntersectionObserver(
		(entries) => { for (const en of entries) en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); },
		{ rootMargin: '150px' }
	);
	frames.forEach((f) => io.observe(f));

	function drawOne(f, w, h) {
		const name = f.dataset.shader;
		const e = build(name);
		if (e.error) {
			if (!f.querySelector('.err')) {
				const d = document.createElement('div');
				d.className = 'err';
				d.textContent = e.error;
				f.querySelector('.stage').appendChild(d);
			}
			return false;
		}
		setRes(w, h);
		pushUniforms(e);
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		const a = gl.getAttribLocation(e.program, 'a_pos');
		gl.enableVertexAttribArray(a);
		gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
		gl.viewport(0, 0, off.width, off.height);
		gl.uniform1f(e.u('u_time'), elapsed);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		const cv = f.querySelector('canvas');
		if (cv.width !== off.width) { cv.width = off.width; cv.height = off.height; }
		ctxs.get(f).drawImage(off, 0, 0);
		return true;
	}

	// Enlarging one frame pauses the rest: a single high-res render is the whole
	// budget, and the point of enlarging is to judge one design properly.
	let open = null;
	for (const f of frames) {
		f.querySelector('.zoom').addEventListener('click', () => {
			if (open === f) {
				open = null;
				f.classList.remove('open');
				const cv = f.querySelector('canvas');
				cv.width = GRID[0]; cv.height = GRID[1];
			} else {
				if (open) {
					open.classList.remove('open');
					const pc = open.querySelector('canvas');
					pc.width = GRID[0]; pc.height = GRID[1];
				}
				open = f;
				f.classList.add('open');
				f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		});
	}
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && open) open.querySelector('.zoom').click();
	});

	const sel = document.getElementById('pal');
	for (const k of Object.keys(PALETTES)) {
		const o = document.createElement('option');
		o.value = k; o.textContent = k;
		sel.appendChild(o);
	}
	sel.addEventListener('change', () => { palette = PALETTES[sel.value]; });

	document.getElementById('fams').addEventListener('click', (ev) => {
		const b = ev.target.closest('.btn');
		if (!b) return;
		const fam = b.dataset.fam;
		for (const other of document.querySelectorAll('#fams .btn')) other.setAttribute('aria-pressed', String(other === b));
		for (const s of document.querySelectorAll('section[data-fam]')) {
			s.style.display = fam === 'all' || s.dataset.fam === fam ? '' : 'none';
		}
	});

	const legBtn = document.getElementById('legible');
	legBtn.addEventListener('click', () => {
		const on = document.body.classList.toggle('legible');
		legBtn.setAttribute('aria-pressed', String(on));
	});

	// Honour reduced-motion: start paused rather than animating unasked.
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let running = !reduce;
	const toggle = document.getElementById('toggle');
	function setRunning(v) {
		running = v;
		toggle.textContent = running ? 'Pause' : 'Play';
		toggle.setAttribute('aria-pressed', String(running));
		if (running) { last = performance.now(); requestAnimationFrame(loop); }
	}
	toggle.addEventListener('click', () => setRunning(!running));

	let elapsed = 3, last = performance.now(), drawn = 0, since = last;
	function loop(now) {
		if (!running) return;
		elapsed += Math.min(0.05, (now - last) / 1000);
		last = now;
		let n = 0;
		if (open) {
			if (drawOne(open, BIG[0], BIG[1])) n++;
		} else {
			for (const f of visible) if (drawOne(f, GRID[0], GRID[1])) n++;
		}
		drawn += n;
		if (now - since > 900) {
			stat.textContent = open
				? '1 enlarged · others paused'
				: n + ' of ${designs.length} live · ' + Math.round((drawn * 1000) / (now - since)) + ' draws/s';
			drawn = 0; since = now;
		}
		requestAnimationFrame(loop);
	}
	setRunning(running);
	if (!running) {
		// Paint one frame each so a reduced-motion viewer still sees the designs.
		requestAnimationFrame(() => { for (const f of frames) drawOne(f, GRID[0], GRID[1]); stat.textContent = 'paused (reduced motion)'; });
	}
}
</script>
`;

await writeFile(OUT, html);
console.log(
	`wrote ${OUT}\n${designs.length} live designs across ${groups.length} families` +
		(problems.length ? `, ${problems.length} could not be embedded` : '') +
		`\n${(html.length / 1024).toFixed(0)} KB`
);
