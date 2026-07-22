// ALU combined best-of — every fidelity-safe transform stacked:
//   1. hash12 closed form            (alu-hash-algebra)
//   2. vnoise shares floor(p) across its 4 corners, vec4 tail (alu-vnoise-shared)
//   3. tap-loop invariants hoisted, pow -> mul chains, normalize folded (alu-hoist)
//   4. bayer4 int[16] -> bit ops, palette dynamic index unrolled (alu-tables)
// No algorithm change: still 13 taps x 5 fbm x 3 octaves x 4 lattice corners.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

let src = base;
const sub = (a, b) => {
	if (!src.includes(a)) throw new Error('alu-best: pattern not found: ' + a.slice(0, 60));
	src = src.replace(a, b);
};

// 1. hash12 closed form
sub(
	`float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}`,
	`float hash12(vec2 p){
  vec2 ab=fract(p*0.1031);
  float d=ab.x*(ab.x+2.0*ab.y)+(66.66*ab.x+33.33*ab.y);
  float s=ab.x+d;
  return fract((s+ab.y+d)*s);
}`
);

// 2. vnoise: shared lattice setup + vec4 tail
sub(
	`float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}`,
	`float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  vec2 c0=fract(ip*0.1031);
  vec2 c1=fract(c0+0.1031);
  vec2 Ax=vec2(c0.x,c1.x); Ax=Ax*Ax+66.66*Ax;
  vec2 By=33.33*vec2(c0.y,c1.y);
  vec4 a=vec4(c0.x,c1.x,c0.x,c1.x);
  vec4 b=vec4(c0.y,c0.y,c1.y,c1.y);
  vec4 d=Ax.xyxy+By.xxyy+2.0*a*b;
  vec4 s=a+d;
  vec4 h=fract((s+b+d)*s);
  vec2 hx=mix(h.xz,h.yw,u.x);
  float r=mix(hx.x,hx.y,u.y);
  return r*r;
}`
);

// 2b. fbm: fold the 2.02/2.03 scale into the rotation matrix (2 muls per octave
//     transition saved) and fold the /0.875 renormalise into the amplitudes.
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

// 4. bayer4 closed form
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

// 4b. palette without a runtime uniform-array index
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

// 3. tap loop
sub(
	`  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
    lum+=lv*w; hue+=hh*w; wsum+=w;
    bloom+=smoothstep(0.55,1.0,lv)*w;
  }`,
	`  vec2  pb    = pBase*fscale;
  vec2  stepv = (wDir + wPerp*0.11)*(sm*fscale);
  vec2  gsc   = u_resolution.xy*0.0022;
  float baseW =mix(0.34,0.72,u_ribbon);
  float diffW =mix(0.90,0.08,u_ribbon);
  float crestW=mix(0.60,0.0 ,u_ribbon);
  float sheenW=0.45*u_ribbon;
  const float FI=1.0/float(K);
  const float WE=-2.5*FI*FI;
  for(int i=-K;i<=K;i++){
    float fn=float(i)+jit;
    float w=exp(fn*fn*WE);
    float hh; float h=pat(pb + stepv*(fn*FI), hh);
    vec2 g=vec2(dFdx(h),dFdy(h))*gsc;
    float inv=inversesqrt(dot(g,g)+0.25);
    float diff=clamp((0.5*L.z -dot(g,L.xy ))*inv,0.0,1.0);
    float cd  =clamp((0.5*HL.z-dot(g,HL.xy))*inv,0.0,1.0);
    float c2=cd*cd, c4=c2*c2, c8=c4*c4; float crest=c8*c8;
    float h2=h*h; float sheen=h2*h2*h*sheenW;
    float ribbon=smoothstep(0.14,0.92,h);
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
    lum+=lv*w; hue+=hh*w; wsum+=w;
    bloom+=smoothstep(0.55,1.0,lv)*w;
  }`
);

export default makeSinglePassVariant({
	name: 'alu-best',
	description: 'combined: hash closed form + shared-lattice vnoise + hoisted taps + no array indexing',
	vertexShader,
	fragmentShader: src
});
