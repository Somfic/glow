// pat() is smooth along the blur line, so reconstruct instead of re-evaluating.
//
// Evaluate pat() at 7 anchors spaced 2/6 apart across the same span (the even
// taps i=-6,-4,...,6 of the baseline, jitter included) and get the 6 odd taps by
// linear interpolation of (h, hue, gradient) between neighbouring anchors. The
// per-tap NONLINEAR lighting is still evaluated 13 times, so unlike a pure
// weight change this actually preserves the shape of the response curve -- only
// the height samples are reconstructed. 7 pat() calls instead of 13.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

const A = fragmentShader.indexOf('  float lum=0.0');
const B = fragmentShader.indexOf('  lum*=bandGain;');

const body = /* glsl */ `  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));
  float ha[7]; float hua[7]; vec2 ga[7];
  for(int j=0;j<7;j++){
    float fj=(float(j*2-6)+jit)/6.0;
    vec2 off=wDir*(fj*sm)+wPerp*(fj*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    ha[j]=h; hua[j]=hh;
    ga[j]=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
  }
  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;
  for(int t=0;t<13;t++){
    int j=t/2; int j1=min(j+1,6); float fr=float(t-j*2)*0.5;
    float h =mix(ha[j],  ha[j1],  fr);
    float hh=mix(hua[j], hua[j1], fr);
    vec2  g =mix(ga[j],  ga[j1],  fr);
    float fi=(float(t-6)+jit)/6.0;
    float w=exp(-fi*fi*2.5);
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
  }
  lum/=wsum; hue/=wsum; bloom/=wsum;
`;

export default makeSinglePassVariant({
	name: 'tap-interp',
	description: '7 pat() anchors, 13 taps reconstructed by lerp, lighting still per-tap',
	vertexShader,
	fragmentShader: fragmentShader.slice(0, A) + body + fragmentShader.slice(B)
});
