# Glow shader benchmark harness

Measures **real GPU time** for the Glow fold-gradient shader. Headless Chrome on
macOS reaches the Apple GPU through ANGLE's Metal backend and exposes
`EXT_disjoint_timer_query_webgl2`, so each number is the GPU's own timing of the
draw call — not a wall-clock guess around a rAF loop.

## Running

```sh
node bench/run.mjs                     # every variant, vs baseline
node bench/run.mjs myvariant           # baseline + myvariant only
node bench/run.mjs --frames 60         # samples per resolution (default 60)
node bench/run.mjs --json out.json     # machine-readable results
node bench/run.mjs --snapshot myvariant  # writes bench/snapshot-myvariant.png
```

## One run at a time

Two benchmarks sharing one GPU measure each other's contention rather than their
own cost, so runs are mutually exclusive. `mkdir` on `bench/.bench.lock` is the
atomic primitive — it either creates the directory or fails, with no window
between checking and creating. Everything else is bookkeeping on top:

- The holder stamps `holder.json` (pid, command, start time) into the lock and
  refreshes a heartbeat every 5s.
- A waiting run steals the lock only when it can positively prove the holder is
  gone: the pid no longer exists, or the heartbeat is over 60s stale. Without
  metadata it never steals — waiting is always the safe failure.
- The holder releases on normal exit, `SIGINT`, `SIGTERM`, `SIGHUP` and uncaught
  exceptions, using a *synchronous* unlink (an async one never completes inside
  an `exit` handler — which is exactly the path a crashing run takes).
- `SIGKILL` can't be handled at all, so that case is covered by the steal path.
- Each run gets its own Chrome profile dir, so even a lock failure can't have two
  runs corrupting each other's browser state.

```sh
node bench/run.mjs --lock-status        # who holds it, and are they alive
node bench/run.mjs --lock-selftest 2000 # acquire, hold 2s, release (no GPU)
```

Launching several `--lock-selftest` at once shows non-overlapping hold windows;
that plus `BENCH_LOCK=/tmp/somewhere` (which redirects the lock path) is how to
test the locking without disturbing a real run. Manual recovery, if ever needed:
`rm -rf bench/.bench.lock`.

## Baseline

M1, ANGLE/Metal, GPU ms per frame (median of 60):

| resolution | MP   | GPU ms | implied fps |
| ---------- | ---- | ------ | ----------- |
| 1280x720   | 0.92 | 13.5   | 74          |
| 1600x900   | 1.44 | 21.2   | 47          |
| 2560x1440  | 3.69 | 51.0   | 20          |

Cost is linear in pixel count (~14 ms/MP), i.e. entirely fragment-shader bound.
Per pixel the baseline runs 13 tap iterations x `pat()`, each `pat()` is 5
`fbm()` calls, each `fbm()` is 3 `vnoise()`, each `vnoise()` is 4 `hash12()` —
**780 hash12 evaluations per pixel**, plus the lighting math per tap.

Note: the `wall ms` column is unreliable under ANGLE/Metal (neither `finish()`
nor `readPixels` fully syncs). **Judge by the `gpu ms` column.**

## Writing a variant

Drop a file in `bench/variants/<name>.js` with a default export:

```js
export default {
	name: 'myvariant',
	description: 'one line, shown in the results table',
	// Called once per resolution. Return an object with render/resize/dispose.
	create(gl, w, h) {
		return {
			// Draw one frame for animation time `t` in seconds into the currently
			// bound framebuffer. The harness binds its own FBO — do not assume the
			// default framebuffer, and restore any FBO binding you change.
			render(t) {},
			resize(w, h) {},
			dispose() {}
		};
	}
};
```

For the common "same single pass, different GLSL" case, use the helper:

```js
import { makeSinglePassVariant } from '../lib/singlepass.js';
export default makeSinglePassVariant({ name, description, vertexShader, fragmentShader });
```

Multi-pass variants (render-to-texture, temporal reuse, noise LUTs) implement
`create()` directly; `lib/singlepass.js` exports `link`, `compile`,
`fullscreenTriangle` and `pushStandardUniforms` for reuse.

`lib/baselineShader.js` holds the unmodified shader source to fork from.

## Fidelity

Every variant is compared pixel-for-pixel against the baseline at a fixed
animation time and the table reports RMSE / max channel delta / PSNR. A speedup
only counts if the image still holds up:

- **PSNR > 40 dB** — visually indistinguishable
- **30–40 dB** — differences findable in an A/B flip, defensible
- **< 30 dB** — a different-looking image; must be justified deliberately, not
  reported as a free win

Always also write a snapshot PNG and **look at it**. RMSE cannot tell you that
the gradient lost its folds or that the animation stopped moving. A variant that
renders a flat color scores brilliantly on speed.

## Rules

- Never edit `baseline.js`, `harness.html`, `run.mjs`, or `lib/` — shared, and
  changing them invalidates comparisons between variants.
- Keep the parameter set in `lib/singlepass.js` `PARAMS` (the component
  defaults). If a variant only wins at particular parameter values, say so.
- The shader is a shipping component's default look. Optimizations that change
  the visual identity are interesting but must be labelled as such.
