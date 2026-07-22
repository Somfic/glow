// ALU variant 4 — per-variable mediump for the lighting/tonemap math only.
//
// The file-level `precision highp float` comment says highp is required for the
// fbm/pat COORDINATE accumulation (banding + a seam at uv.x=0.5 under mediump).
// That argument does not cover the lighting math downstream of pat(): h, its
// screen-space derivative, the two dot products, the smoothsteps, the tonemap
// and the palette all live in [0,1]-ish ranges where fp16's 10-bit mantissa is
// still finer than the 8-bit output. So pat/fbm/vnoise stay highp and only the
// consumers are demoted, which on a GPU with native fp16 halves register
// pressure and lets two lanes issue per ALU slot.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

let src = base;
const sub = (a, b) => {
	if (!src.includes(a)) throw new Error('alu-mediump: pattern not found: ' + a.slice(0, 48));
	src = src.replace(a, b);
};

sub(
	`  vec3 L=normalize(vec3(0.55,0.35,0.55));
  vec3 HL=normalize(L+vec3(0.0,0.0,1.0));

  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;`,
	`  mediump vec3 L=normalize(vec3(0.55,0.35,0.55));
  mediump vec3 HL=normalize(L+vec3(0.0,0.0,1.0));

  mediump float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;`
);

sub(
	`    float w=exp(-fi*fi*2.5);`,
	`    mediump float w=exp(-fi*fi*2.5);`
);

sub(
	`    float hh; float h=pat((pBase+off)*fscale, hh);
    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);`,
	`    float hh; float hHi=pat((pBase+off)*fscale, hh);
    mediump float h=hHi;
    mediump vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    mediump vec3 N=normalize(vec3(-g, 0.5));
    mediump float diff=clamp(dot(N,L),0.0,1.0);
    mediump float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    mediump float ribbon=smoothstep(0.14,0.92,h);
    mediump float baseW =mix(0.34,0.72,u_ribbon);
    mediump float diffW =mix(0.90,0.08,u_ribbon);
    mediump float crestW=mix(0.60,0.0 ,u_ribbon);
    mediump float sheen =pow(h,5.0)*0.45*u_ribbon;
    mediump float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);`
);

sub(
	`  vec3 grad=palette(hue*0.62 + lum*0.42);
  vec3 col=mix(u_back, u_shadow, smoothstep(0.015,0.30,lum));
  col=mix(col, grad, smoothstep(0.22,0.72,lum));
  col+=grad*bloom*0.55;`,
	`  mediump vec3 grad=palette(hue*0.62 + lum*0.42);
  mediump vec3 col=mix(u_back, u_shadow, smoothstep(0.015,0.30,lum));
  col=mix(col, grad, smoothstep(0.22,0.72,lum));
  col+=grad*bloom*0.55;`
);

sub(
	`  float luma=dot(col, vec3(0.2126,0.7152,0.0722));`,
	`  mediump float luma=dot(col, vec3(0.2126,0.7152,0.0722));`
);

export default makeSinglePassVariant({
	name: 'alu-mediump',
	description: 'lighting/tonemap demoted to mediump; pat/fbm/vnoise coords stay highp',
	vertexShader,
	fragmentShader: src
});
