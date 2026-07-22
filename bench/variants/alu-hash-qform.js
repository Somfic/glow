// ALU variant 9 — precision-safe quadratic-form hash, sharing per-axis terms.
//
// alu-hash-quad proved the concept is fast (1.69x) but broke the image: with
// K=(127.1,311.7) the argument t reaches ~1e5, so t*t ~1e10 has no fractional
// bits left in float32 and fract() returns quantised garbage — the folds went
// dark and flat.
//
// This keeps the arguments small by never squaring the combined index. It
// evaluates the quadratic form directly on the two lattice axes:
//
//   h(a,b) = fract(a*(0.3183a + 0.7113) + b*(0.6180b + 0.2718) + 0.4433ab)
//
// a takes only 2 values across the 4 corners (ip.x, ip.x+1) and so does b, so
// the two square terms are computed twice, not four times, and only the cross
// term is a full vec4. |a|,|b| stay under ~64 for this shader's domain, so
// every product is exactly representable and fract() keeps ~12 good bits.
//
//   baseline: 4 x hash12 (2 mul + 3 fract + ~13 alu) + corner adds  ~= 68 ops
//   here:     2 adds + 2 vec2 mads + 2 vec2 muls + vec4 mul/add/fract ~= 28 ops
//
// FIDELITY: a different hash function -> a different noise field, and ~12 bits
// of hash entropy instead of ~24. Same statistics and fold character, not the
// same pixels.
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
  vec2 a=vec2(ip.x, ip.x+1.0);
  vec2 b=vec2(ip.y, ip.y+1.0);
  vec2 A=a*(a*0.3183+0.7113);
  vec2 B=b*(b*0.6180+0.2718);
  vec2 ac=a*0.4433;
  vec4 h=fract(A.xyxy + B.xxyy + ac.xyxy*b.xxyy);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-qform: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-hash-qform',
	description: 'quadratic-form hash, per-axis squares shared across corners, ~28 ops vs ~68',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
