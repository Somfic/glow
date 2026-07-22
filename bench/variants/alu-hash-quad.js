// ALU variant 8 — quadratic (Weyl-square) hash for all 4 corners.
//
// Follow-up to the ceiling probe. sin() and uint-multiply both turned out to be
// SLOWER than the baseline's fract/mad chain on this GPU, so the only way to
// spend the ~47% headroom the probe exposed is a hash built from the ops the
// GPU is actually fast at: mad, mul, fract.
//
//   n = dot(ip, K)                      shared by all 4 corners  (2 ops)
//   t = n + vec4(0, Kx, Ky, Kx+Ky)      the +1 corners are constants (4)
//   h = fract(t*t*c)                    quadratic residue mix    (12)
//
// ~18 scalar ops for four corner values vs ~68 for the baseline's four hash12
// calls, with zero transcendentals and no integer pipeline.
//
// FIDELITY: different hash -> different noise field. Same statistics and the
// same fold character, but not the same pixels; a quadratic hash also has
// weaker high-frequency decorrelation than the baseline's double-fract mix.
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
  const vec2 K=vec2(127.1,311.7);
  float n=dot(ip,K);
  vec4 t=n+vec4(0.0,K.x,K.y,K.x+K.y);
  vec4 h=fract(t*t*0.0000971);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-quad: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-hash-quad',
	description: 'quadratic hash: 4 corners from one dot + fract(t*t*c), ~18 ops vs ~68 — different field',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
