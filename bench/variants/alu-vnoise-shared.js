// ALU variant 2 — amortise the 4 corner hashes of vnoise.
//
// vnoise hashes ip, ip+(1,0), ip+(0,1), ip+(1,1). In hash12 the only thing that
// depends on the input is the pair (a,b) = fract(p*0.1031). Across the 4 corners
// there are only TWO distinct a values and TWO distinct b values, and the "+1"
// one is fract(a0 + 0.1031) — an add instead of a mul+fract on the full coord.
// The closed form of hash12 (see alu-hash-algebra) then splits into a per-a
// term (a*a + 66.66a), a per-b term (33.33b) and one cross term (2ab), so the
// per-a/per-b halves are computed twice instead of four times, and the four
// tails run as a single vec4 chain.
//
// Baseline: 4 x (2 mul + 3 fract + ~13 alu) + 4 corner vec2 adds  ~= 90 scalar ops.
// Here:     2 mul + 4 fract + 2 add + 6 setup + one 8-instruction vec4 tail ~= 55.
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
  vec2 c0=fract(ip*0.1031);        // (a0,b0)
  vec2 c1=fract(c0+0.1031);        // (a1,b1)  == fract((ip+1)*0.1031)
  vec2 Ax=vec2(c0.x,c1.x); Ax=Ax*Ax+66.66*Ax;   // per-a half, twice not 4x
  vec2 By=33.33*vec2(c0.y,c1.y);                // per-b half
  vec4 a=vec4(c0.x,c1.x,c0.x,c1.x);
  vec4 b=vec4(c0.y,c0.y,c1.y,c1.y);
  vec4 d=Ax.xyxy+By.xxyy+2.0*a*b;
  vec4 s=a+d;
  vec4 h=fract((s+b+d)*s);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`;

if (!base.includes(OLD)) throw new Error('alu-vnoise-shared: baseline vnoise not found');

export default makeSinglePassVariant({
	name: 'alu-vnoise-shared',
	description: 'vnoise: 4 corner hashes share floor(p); per-a/per-b halves amortised, vec4 tail',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
