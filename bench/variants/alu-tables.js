// ALU variant 5 — kill the two indexed-array lookups (bayer4's int[16] and
// palette()'s dynamic uniform-array index).
//
// bayer4 constructs a 16-element int[] literal PER PIXEL and then dynamically
// indexes it; ANGLE/Metal cannot keep a dynamically-indexed array in registers,
// so it either spills to thread-local memory or expands into a 16-way select.
// The standard 4x4 Bayer matrix has a closed form: with a = x^y and b = y,
// m = reverse4(b1 a1 b0 a0) = 8*(a&1) + 4*(b&1) + 2*(a&2)/2 + (b>>1)&1.
// Exact same 16 values, 6 integer ops, no array.
//
// palette() indexes u_colors[i] twice with a runtime i. Replaced with an
// unrolled 4-segment select over the 5 constant-count colors so the uniform
// reads are at compile-time offsets.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

let src = base;
const sub = (a, b) => {
	if (!src.includes(a)) throw new Error('alu-tables: pattern not found: ' + a.slice(0, 48));
	src = src.replace(a, b);
};

sub(
	`float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}`,
	`float bayer4(vec2 p){
  ivec2 q=ivec2(p)&3;
  int a=q.x^q.y, b=q.y;
  return float(((a&1)<<3)|((b&1)<<2)|(a&2)|((b>>1)&1))*0.0625;
}`
);

sub(
	`vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}`,
	`vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  float fi=floor(x); float f=smoothstep(0.0,1.0,x-fi);
  float last=u_ncols-1.0;
  // segment k spans colors[k]..colors[k+1]; picked branchlessly at fixed offsets
  vec3 c0=u_colors[0].rgb, c1=u_colors[1].rgb, c2=u_colors[2].rgb,
       c3=u_colors[3].rgb, c4=u_colors[4].rgb;
  vec3 lo=c0, hi=c1;
  if(fi>0.5){ lo=c1; hi=c2; }
  if(fi>1.5){ lo=c2; hi=c3; }
  if(fi>2.5){ lo=c3; hi=c4; }
  if(fi>=last){ lo=hi; }
  return mix(lo, hi, f);
}`
);

export default makeSinglePassVariant({
	name: 'alu-tables',
	description: 'bayer4 int[16] array -> closed-form bit ops; palette dynamic index unrolled',
	vertexShader,
	fragmentShader: src
});
