// ALU variant 1 — algebraic collapse of hash12.
//
// hash12 builds vec3 p3 = fract(vec3(p.xyx)*0.1031). The .x and .z lanes are the
// SAME value (both fract(p.x*0.1031)), so a third of the setup is redundant, and
// the dot() against p3.yzx expands to a closed form in just two scalars:
//
//   a = fract(p.x*0.1031), b = fract(p.y*0.1031)
//   d = dot((a,b,a),(b,a,a)+33.33) = a*a + 2ab + 66.66a + 33.33b
//   result = fract((a + b + 2d) * (a + d))
//
// Same function, ~18 scalar ops -> ~11, and one fewer fract/mul lane.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

const OLD = `float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}`;

const NEW = `float hash12(vec2 p){
  vec2 ab=fract(p*0.1031);
  float d=ab.x*(ab.x+2.0*ab.y)+(66.66*ab.x+33.33*ab.y);
  float s=ab.x+d;
  return fract((s+ab.y+d)*s);
}`;

if (!base.includes(OLD)) throw new Error('alu-hash-algebra: baseline hash12 not found');

export default makeSinglePassVariant({
	name: 'alu-hash-algebra',
	description: 'hash12 closed-form: x/z lanes are equal, dot() folded to 2 scalars',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
