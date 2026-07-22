// ALU variant 3 — hoist loop-invariants out of the 13-tap loop, and replace
// pow()/normalize() with multiply chains.
//
// Per tap the baseline recomputes: the three mix() weight blends (invariant in
// i), u_resolution*0.0022, two vec2 scale+mads for the tap offset, a full
// normalize(), pow(x,16) and pow(h,5).
//
// - off = wDir*(fi*sm) + wPerp*(fi*sm*0.11) == ((wDir + 0.11*wPerp)*sm)*fi, so
//   one vec2 constant + one vec2 scale per tap instead of two scales and a mad.
//   The *fscale is folded into that constant and into pBase.
// - exp(-fi*fi*2.5) with fi=(i+jit)/K becomes exp((i+jit)^2 * (-2.5/K^2)):
//   one mul saved per tap.
// - N = normalize(vec3(-g,0.5)) is only ever consumed by two dot products, so
//   the 3-component scale is skipped: dot(N,L) = (0.5*L.z - dot(g,L.xy))*rsqrt.
// - pow(c,16) -> 4 muls, pow(h,5) -> 3 muls (no log2/exp2 SFU round trip).
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

const OLD = `  for(int i=-K;i<=K;i++){
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
  }`;

const NEW = `  vec2  pb    = pBase*fscale;
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
  }`;

if (!base.includes(OLD)) throw new Error('alu-hoist: baseline tap loop not found');

export default makeSinglePassVariant({
	name: 'alu-hoist',
	description: 'tap loop: invariants hoisted, pow->mul chains, normalize folded into 2 dots',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
