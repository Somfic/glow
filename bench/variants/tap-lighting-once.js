// Separate the height-field blur from the lighting.
//
// Baseline evaluates diff/crest/ribbon/sheen per tap and averages the RESULT.
// This variant averages the height field h (and the hue) over the taps and runs
// the lighting exactly ONCE on the averaged h -- 1/13th of the lighting math and
// 1/13th of the dFdx/normalize/pow work. pat() is still called 13 times, so this
// isolates "what does the per-tap lighting actually cost" from "what do the taps
// cost". mean(f(h)) != f(mean(h)) for the smoothstep/pow nonlinearities, so this
// is deliberately not pixel-identical.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

const A = fragmentShader.indexOf('  float lum=0.0');
const B = fragmentShader.indexOf('  lum*=bandGain;');

const body = /* glsl */ `  float hsum=0.0, hue=0.0, wsum=0.0;
  const int K=6;
  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));
  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    hsum+=h*w; hue+=hh*w; wsum+=w;
  }
  float h=hsum/wsum; hue/=wsum;
  vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
  vec3 N=normalize(vec3(-g, 0.5));
  float diff=clamp(dot(N,L),0.0,1.0);
  float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
  float ribbon=smoothstep(0.14,0.92,h);
  float baseW =mix(0.34,0.72,u_ribbon);
  float diffW =mix(0.90,0.08,u_ribbon);
  float crestW=mix(0.60,0.0 ,u_ribbon);
  float sheen =pow(h,5.0)*0.45*u_ribbon;
  float lum=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
  float bloom=smoothstep(0.55,1.0,lum);
`;

export default makeSinglePassVariant({
	name: 'tap-lighting-once',
	description: 'K=6 taps, but average h first and light once (13x less lighting)',
	vertexShader,
	fragmentShader: fragmentShader.slice(0, A) + body + fragmentShader.slice(B)
});
