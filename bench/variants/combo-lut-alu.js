// combo-lut-alu — does the ALU track add anything ON TOP of the LUT?
//
// alu-best was only 1.04x on its own and concluded the shader is bound by how
// MANY noise evaluations it does, not their cost. The LUT deletes the noise
// function outright, so alu-best's two biggest items (hash12 closed form,
// shared-lattice vnoise) are literally dead code here. What survives is the
// part of alu-best that is NOT about the hash:
//   * fbm: fold 2.02/2.03 into the rotation matrices, fold /0.875 into amps
//   * bayer4: int[16] array -> bit ops (scratch-memory load on ANGLE/Metal)
//   * palette: kill the dynamic uniform-array index
//   * tap loop: hoist invariants, pow() -> mul chains, normalize -> inversesqrt
// This variant answers whether those still pay once the LUT has changed the
// bottleneck from ALU to texture fetch. Prediction: mostly not, because a
// fetch-bound loop does not care about spare ALU slots.
import { makeLutVariant, lutShader } from './lut-r8-256.js';
import { bakePrewarp, prewarpBody } from './lut-prewarp-2048.js';
import { CELLS, OFF, S } from './combo-lut-tap.js';

// The non-hash half of alu-best, reusable by the other combos.
export function applyAlu(src) {
	let out = src;
	const sub = (a, b) => {
		if (!out.includes(a)) throw new Error('alu patch: pattern not found: ' + a.slice(0, 50));
		out = out.replace(a, b);
	};

	sub(
		`const mat2 m2=mat2(0.8,-0.6,0.6,0.8);

float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}`,
		`const mat2 m2=mat2(0.8,-0.6,0.6,0.8);
const mat2 m2a=mat2(0.8*2.02,-0.6*2.02,0.6*2.02,0.8*2.02);
const mat2 m2b=mat2(0.8*2.03,-0.6*2.03,0.6*2.03,0.8*2.03);

float fbm(vec2 p){
  float f=(0.5000/0.875)*vnoise(p); p=m2a*p;
  f+=(0.2500/0.875)*vnoise(p); p=m2b*p;
  f+=(0.1250/0.875)*vnoise(p);
  return f;
}`
	);

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

	sub(
		`  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);`,
		`  vec2  pb    = pBase*fscale;
  vec2  stepv = (wDir + wPerp*0.11)*(sm*fscale);
  vec2  gsc   = u_resolution.xy*0.0022;
  const float FI=1.0/float(K);
  const float WE=-2.5*FI*FI;
  for(int i=-K;i<=K;i++){
    float fn=float(i)+jit;
    float w=exp(fn*fn*WE);
    float hh; float h=pat(pb + stepv*(fn*FI), hh);`
	);
	sub(
		`    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;`,
		`    vec2 g=vec2(dFdx(h),dFdy(h))*gsc;
    float inv=inversesqrt(dot(g,g)+0.25);
    float diff=clamp((0.5*L.z -dot(g,L.xy ))*inv,0.0,1.0);
    float cd  =clamp((0.5*HL.z-dot(g,HL.xy))*inv,0.0,1.0);
    float c2=cd*cd, c4=c2*c2, c8=c4*c4; float crest=c8*c8;
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float h2=h*h; float sheen=h2*h2*h*0.45*u_ribbon;`
	);
	return out;
}

export default makeLutVariant({
	name: 'combo-lut-alu',
	description: 'LUT + the non-hash half of alu-best (fbm fold, bayer bits, palette, tap hoist)',
	n: CELLS * S,
	lutData: () => bakePrewarp(CELLS, OFF, S),
	frag: applyAlu(lutShader(prewarpBody(CELLS, OFF, S)))
});
