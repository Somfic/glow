// ALU CEILING PROBE — not a shippable variant.
//
// Everything else in this track is bounded by the question "how much of the
// frame is actually the hash arithmetic?". This variant answers it: it keeps
// the whole structure (13 taps x 5 fbm x 3 octaves x 4 lattice corners x
// smoothstep interpolation) but replaces the hash with the cheapest thing that
// still returns 4 per-cell values — a single fract of a linear form, ~10 scalar
// ops for all four corners instead of ~68. No transcendental, unlike
// alu-hash-sin4, so it isolates plain ALU cost.
//
// If this is only marginally faster than baseline, the shader is bound by the
// NUMBER of noise evaluations and their dependency chains, not by the
// instruction count inside hash12, and every exact-preserving ALU rewrite in
// this track is capped at that margin.
//
// FIDELITY: deliberately garbage (a linear hash has visible lattice structure).
// Do not ship. Read the number, not the picture.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

const OLD = `float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}`;

const NEW = `float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float n=dot(ip,vec2(0.1031,0.4177));
  vec4 h=fract(n+vec4(0.0,0.1031,0.4177,0.5208));
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-floor: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-hash-floor',
	description: 'PROBE (bad image): 4 corners from one dot + one fract, ~10 ops vs ~68 — the ALU ceiling',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
