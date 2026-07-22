// ALU variant 7 — integer bit-mix hash for the 4 lattice corners.
//
// The ceiling probe (alu-hash-floor) says the hash arithmetic is worth ~47% of
// the frame, so a genuinely cheaper *high quality* hash is the only remaining
// ALU lever. This tries the 32-bit integer route (WebGL2 has full uint ops):
//
//   base = ix*C1 + iy*C2          (one imad pair, shared by all 4 corners)
//   n    = base + const4          (the +1 corners are a compile-time offset)
//   n ^= n>>15; n *= M; n ^= n>>13;   (one round of an xorshift-multiply)
//
// ~34 integer ops for all four corners vs ~68 float ops in the baseline's four
// hash12 calls, and no fract/transcendental at all. Whether that is faster
// depends entirely on whether 32-bit integer multiply is full rate on this GPU.
//
// FIDELITY: different hash function, so a different noise field with the same
// statistics — same visual character, not the same pixels.
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
  const uint C1=1597334677u, C2=3812015801u;
  uvec2 q=uvec2(ivec2(ip)+65536);
  uint b=q.x*C1 + q.y*C2;
  uvec4 n=b+uvec4(0u, C1, C2, C1+C2);
  n^=n>>15u; n*=2246822519u; n^=n>>13u;
  vec4 h=vec4(n>>9u)*(1.0/8388608.0);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-uint: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-hash-uint',
	description: 'uint xorshift-multiply hash, 4 corners from one imad — different noise field',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
