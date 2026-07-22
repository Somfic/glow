// Importance / adaptive sampling.
//
// The blur span is large (sm=0.12 in uv => ~300 px wide at 1280), so a 1-pixel
// dFdx tells you nothing about how h varies across it: the decision needs real
// probes. Three pat() probes are taken along the blur line and, crucially, at
// the QUAD CENTRE (floor(fragCoord*0.5)*2+0.5) so the resulting branch is
// quad-uniform and the dFdx() calls inside the branch stay in uniform control
// flow -- a per-pixel predicate would corrupt the normals of every quad that
// straddles the decision boundary.
//
// Smooth along the line (small second difference) or uniformly dark  -> 3 taps.
// Near a fold crest                                                  -> 13 taps.
//
// Cost: 3 probes + (3 | 13). It only wins if the smooth fraction is high enough
// to pay back the probes, which is the thing being measured.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader, vertexShader } from '../lib/baselineShader.js';

const A = fragmentShader.indexOf('  float lum=0.0');
const B = fragmentShader.indexOf('  lum*=bandGain;');

const body = /* glsl */ `  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;
  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));

  // quad-uniform probe origin (ribbon shear deliberately omitted: this only
  // steers the tap count, it never feeds the output)
  vec2 uvq=(floor(gl_FragCoord.xy*0.5)*2.0+0.5)/u_resolution.xy;
  vec2 pQ=vec2((uvq.x-0.5)*asp, uvq.y-0.5)*R*zsc;
  float pd;
  float q0=pat((pQ - wDir*(0.72*sm) - wPerp*(0.72*sm*0.11))*fscale, pd);
  float q1=pat( pQ*fscale, pd);
  float q2=pat((pQ + wDir*(0.72*sm) + wPerp*(0.72*sm*0.11))*fscale, pd);
  float curv=abs(q0-2.0*q1+q2)+0.5*abs(q2-q0);
  float qmax=max(q1,max(q0,q2));
  bool cheap = (curv < 0.045) || (qmax < 0.02);

  int KK = cheap ? 1 : 6;
  float step = cheap ? 4.0 : 1.0;   // cheap: fi = +/-0.667, 0 ; else fi=i/6
  for(int i=-6;i<=6;i++){
    if(i<-KK || i>KK) continue;
    float fi=(float(i)*step+jit)/6.0;
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
  }
  lum/=wsum; hue/=wsum; bloom/=wsum;
`;

export default makeSinglePassVariant({
	name: 'tap-adaptive',
	description: '3 quad-uniform probes pick 3 or 13 taps per quad (crest-aware)',
	vertexShader,
	fragmentShader: fragmentShader.slice(0, A) + body + fragmentShader.slice(B)
});
