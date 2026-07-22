// ALU probe / aggressive variant — all four lattice corners from ONE dot product.
//
// Purpose: establish the ALU ceiling. If cutting the hash cost by ~4x does not
// move the clock, the shader is not ALU-throughput bound and every other ALU
// idea in this track is capped.
//
// The 4 corners are ip, ip+(1,0), ip+(0,1), ip+(1,1). For a hash of the form
// fract(sin(dot(ip,K))*C) the dot products of the four corners differ from the
// base by the CONSTANTS K.x, K.y, K.x+K.y — so one dot() plus a vec4 add gives
// all four arguments, and the tail is a single vec4 sin/mul/fract.
//
//   baseline vnoise: 4 x hash12 (~18 ops) + 4 corner adds  ~= 90 scalar ops
//   here:            dot(2) + vec4 add(4) + vec4 sin(4) + mul(4) + fract(4) = 18
//
// FIDELITY: this is a DIFFERENT hash function, so the noise field is different.
// The statistics (uniform [0,1), decorrelated per lattice cell) and hence the
// visual character of the folds match, but not pixel-for-pixel.
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
  const vec2 K=vec2(12.9898,78.233);
  float n=dot(ip,K);
  vec4 h=fract(sin(n+vec4(0.0,K.x,K.y,K.x+K.y))*43758.5453);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-sin4: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-hash-sin4',
	description: 'all 4 lattice hashes from one dot + vec4 sin (18 ops vs 90) — different noise field',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
