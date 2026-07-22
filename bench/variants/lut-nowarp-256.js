// Drop the smoothstep pre-warp: sample the lattice LUT directly at p and let
// the sampler's *linear* weights stand in for vnoise's smoothstep weights.
//
// This removes the last ALU in vnoise — no floor, no fract, no u*u*(3-2u), no
// address reconstruction — leaving literally one texture fetch and one
// multiply per noise evaluation (~14 ops saved per call x 195 calls). The cost
// is a different interpolant: linear value noise has C0 creases along the
// lattice, smoothstep is C1. Look for grid-aligned diamond structure.
import { makeLutVariant } from './lut-r8-256.js';

const N = 256;
const OFF = 128;

export default makeLutVariant({
	name: 'lut-nowarp-256',
	description: '256x256 R8 LUT, raw hardware bilinear (no smoothstep) — 1 fetch, 0 ALU',
	n: N,
	off: OFF,
	body: `float vnoise(vec2 p){
  float r=textureLod(u_lut, (p+${OFF}.5)*${(1 / N).toFixed(10)}, 0.0).r;
  return r*r;
}`
});
