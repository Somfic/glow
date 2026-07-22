// Bake an entire fbm() into one texture.
//
// What is bakeable: fbm(p) is a pure function of p, so the 3 octaves *and* the
// m2 rotation *and* the per-octave squaring can all be pre-evaluated. One fetch
// replaces 3 vnoise = 12 hash12, cutting 195 fetches/pixel down to 65.
//
// What is NOT bakeable into channels of one texture: the octaves are related by
// p -> m2*p*2.02, an irrational-angle rotation plus scale, so octave 2's lattice
// does not line up with octave 1's texel grid. You cannot put octave k in
// channel k and read them all with one fetch at one coordinate — the channels
// would need different coordinates. Baking the whole *sum* is the only packing
// that works, and that is what this does.
//
// The price is sampling rate. fbm's top octave has features of 1/(2.02*2.03)
// ~= 0.24 units, so the texture must resolve ~0.24 units. pat() only ever calls
// fbm with |p| <= ~18 (the 4.1x octave scaling happens *inside* fbm), so a
// 2048^2 texture over [-24,24] gives 42.7 texels/unit = ~10 texels per top-octave
// feature. Stored R16F because the shader takes dFdx() of the result and 8-bit
// quantization would staircase the surface normals. 8 MB of VRAM.
import { makeLutVariant, lutShader } from './lut-r8-256.js';

const N = 2048;
const RANGE = 24; // texture covers p in [-RANGE, RANGE)
const SPAN = 2 * RANGE;

// float64 hash12/fbm — this variant is inexact by construction (resampling),
// so matching the GPU's float32 rounding buys nothing and costs bake time.
const fr = (v) => v - Math.floor(v);
function hash12(x, y) {
	let a = fr(x * 0.1031);
	let b = fr(y * 0.1031);
	let c = a;
	const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
	a += d;
	b += d;
	c += d;
	return fr((a + b) * c);
}
function vnoise(x, y) {
	const ix = Math.floor(x),
		iy = Math.floor(y);
	let ux = x - ix,
		uy = y - iy;
	ux = ux * ux * (3 - 2 * ux);
	uy = uy * uy * (3 - 2 * uy);
	const a = hash12(ix, iy),
		b = hash12(ix + 1, iy),
		c = hash12(ix, iy + 1),
		d = hash12(ix + 1, iy + 1);
	const r = (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
	return r * r;
}
function fbm(x, y) {
	let f = 0.5 * vnoise(x, y);
	let nx = (0.8 * x - 0.6 * y) * 2.02,
		ny = (0.6 * x + 0.8 * y) * 2.02;
	f += 0.25 * vnoise(nx, ny);
	const mx = (0.8 * nx - 0.6 * ny) * 2.03,
		my = (0.6 * nx + 0.8 * ny) * 2.03;
	f += 0.125 * vnoise(mx, my);
	return f / 0.875;
}

function bake(n) {
	const data = new Float32Array(n * n);
	const s = SPAN / n;
	for (let j = 0; j < n; j++) {
		const y = (j + 0.5) * s - RANGE;
		for (let i = 0; i < n; i++) data[j * n + i] = fbm((i + 0.5) * s - RANGE, y);
	}
	return data;
}

// vnoise disappears entirely; fbm becomes one fetch.
const frag = lutShader(`float vnoise(vec2 p){ return p.x; }`).replace(
	`float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}`,
	`float fbm(vec2 p){
  return textureLod(u_lut, (p+${RANGE}.0)*${(1 / SPAN).toFixed(10)}, 0.0).r;
}`
);

export default makeLutVariant({
	name: 'lut-fbm-2048',
	description: '2048x2048 R16F: whole fbm() baked — 65 fetches/px instead of 195',
	n: N,
	half: true,
	lutData: () => bake(N),
	frag
});
