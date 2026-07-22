import { makeSinglePassVariant } from '../lib/singlepass.js';

const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec4  u_colors[5];
uniform float u_ncols;
uniform vec3  u_back;
uniform vec3  u_shadow;
uniform float u_softness;
uniform float u_saturation;
uniform float u_noise;
uniform float u_rotation;
uniform float u_folds;
uniform float u_ribbon;
uniform float u_ribbonWidth;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=hash12(i), b=hash12(i+vec2(1,0)), c=hash12(i+vec2(0,1)), d=hash12(i+vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
const mat2 m2=mat2(0.80,-0.60,0.60,0.80);
float fbm2(vec2 p){
  return 0.667*vnoise(p)+0.333*vnoise(m2*p*2.11);
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  int j=min(i+1,int(u_ncols)-1);
  return mix(u_colors[i].rgb, u_colors[j].rgb, f*f*(3.0-2.0*f));
}

// Sand is one material: what varies across a dune is how much light it gets.
// So the palette is re-ordered into a shading ramp -- darkest stop for the
// shadowed slip faces, brightest for the sunlit crests, a saturated midtone
// stop as an accent -- rather than being walked in author order, which paints
// arbitrary hues onto a surface that should read as one substance.
vec3 gLo, gHi, gMid;
void buildRamp(){
  int n=int(u_ncols);
  gLo=u_colors[0].rgb; gHi=gLo; gMid=gLo;
  float loL=1e9, hiL=-1e9, midS=-1.0;
  for(int i=0;i<5;i++){
    if(i>=n) break;
    vec3 c=u_colors[i].rgb;
    float l=dot(c,vec3(0.2126,0.7152,0.0722));
    float mx=max(max(c.r,c.g),c.b), mn=min(min(c.r,c.g),c.b);
    float sat=(mx-mn)/(mx+1e-4);
    if(l<loL){ loL=l; gLo=c; }
    if(l>hiL){ hiL=l; gHi=c; }
    // The accent wants a saturated stop of *middling* lightness: picking the
    // most saturated stop outright tends to land on the darkest or brightest
    // one, which is already spoken for by gLo/gHi.
    float score=sat*(1.0-abs(l-0.40)*1.5);
    if(score>midS){ midS=score; gMid=c; }
  }
  gHi=mix(gHi, vec3(1.0), 0.22);
  // Pulled toward a neutral tied to the background: the darkest palette stop is
  // often a deep saturated colour, and left raw it stains every shadow.
  float lo=dot(gLo,vec3(0.2126,0.7152,0.0722));
  gLo=mix(mix(u_back, vec3(lo), 0.50), gLo, 0.20)*0.95;
}
// Mostly a clean dark->light ramp, with the accent laid over it as a narrow
// belt near the top. Putting the accent at the ramp's midpoint instead hands it
// the largest area of the frame.
vec3 ramp(float x){
  x=clamp(x,0.0,1.0);
  vec3 base=mix(gLo,gHi,x*x*(3.0-2.0*x));
  float belt=exp(-pow((x-0.70)/0.19,2.0));
  return mix(base, gMid, belt*0.50);
}

float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

// Asymmetric dune profile: long windward ramp, short steep slip face.
const float SLIP=0.74;
float prof(float u){
  // The windward ramp is close to linear on purpose: a smoothstep ramp has a
  // continuously varying slope, so the shading sweeps through the whole ramp
  // and the dune reads as a glossy ribbon instead of a flat sand face.
  float w=u/SLIP, sfc=(u-SLIP)/(1.0-SLIP);
  return u<SLIP ? 0.06+0.94*pow(w,1.15)
                : 1.0-smoothstep(0.0,1.0,sfc);
}

// The crest coordinate, in dune periods. Everything -- the profile, the
// ripples, the slip-face mask -- is driven off this one field, so the ripples
// automatically follow the meander of the crests instead of cutting across
// them. A dune field with an unwarped phase is just a set of diagonal stripes.
float phase(vec2 w, float t){
  float warp = 1.75*(fbm2(w*0.32+vec2(0.0,t*0.010))-0.5)
             + 0.70*(fbm2(w*0.85+vec2(3.1,0.0))-0.5);
  return w.y*1.05 + warp*0.50 + t*0.010;
}

// Dune field height, no ripples. The shadow march calls this five more times
// per pixel, so it is kept to five noise lookups.
float terr(vec2 w, float t){
  float mound = vnoise(w*0.19+vec2(t*0.006,0.0));
  float amp = 0.35+1.05*mound;
  return (amp*prof(fract(phase(w,t))) + 0.30*mound)*0.78;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 p=vec2((uv.x-0.5)*asp, uv.y-0.5);
  p=rot(radians(u_rotation))*p;
  p*=0.34*u_folds;

  buildRamp();

  float t=u_time;

  float h=terr(p,t);
  float ph=phase(p,t);

  // Wind ripples: fine corrugations riding the same phase field as the crests,
  // seven to a dune.
  float ripple=sin(ph*6.2831*5.0)*0.5+0.5;
  ripple=ripple*ripple*(3.0-2.0*ripple);
  float rippleAmp=0.026*(0.35+0.65*fbm2(p*0.6));
  // Analytic fade-out: where the phase field compresses, the ripple period
  // approaches a pixel and would alias into moire, so the amplitude is taken to
  // zero there rather than leaving the sampler to fight it.
  rippleAmp*=1.0-smoothstep(0.16,0.45,fwidth(ph)*5.0);
  float H=h+ripple*rippleAmp;

  // Surface normal from screen-space derivatives of the full height.
  vec2 g=vec2(dFdx(H),dFdy(H))*u_resolution.y*0.85;
  vec3 nrm=normalize(vec3(-g,1.0));

  // Low sun that slowly swings across the field.
  float az=2.35+0.42*sin(t*0.035);
  // A high-ish sun, not a grazing one. With a very low sun only the near-vertical
  // slip faces catch light, which puts a thin bright ribbon on every crest and
  // reads as glossy plastic; raising it lights the broad windward faces instead.
  vec3 L=normalize(vec3(cos(az),sin(az),0.85));
  vec2 sdir=normalize(L.xy);
  float tanE=L.z/length(L.xy);

  // Long cast shadows: march the smooth dune height toward the sun.
  float sh=1.0;
  float st=0.13;
  for(int i=1;i<=5;i++){
    float d=st*float(i)*float(i)*0.34+st*float(i);
    float sm=terr(p+sdir*d, t);
    sh=min(sh, 1.0-clamp((sm-(h+d*tanE))*3.2,0.0,1.0));
  }
  sh=mix(1.0,sh,0.95);

  float diff=clamp(dot(nrm,L),0.0,1.0);
  float sky=0.5+0.5*nrm.z;                      // ambient from the sky dome
  float back=clamp(dot(nrm,normalize(vec3(-L.x,-L.y,0.25))),0.0,1.0);

  float lit=diff*sh;

  // The slip face is the signature of a dune: it sits in its own shadow at any
  // sun angle from the windward side. The march alone left it too subtle, so
  // the phase of the profile darkens it directly.
  float uPh=fract(ph);
  float slipFace=smoothstep(SLIP-0.03,SLIP+0.05,uPh)*(1.0-smoothstep(0.93,1.0,uPh));
  float sunSide=clamp(-sdir.y,0.0,1.0);
  float slipShade=slipFace*(0.35+0.65*sunSide);

  float alt=clamp(h*0.75,0.0,1.0);
  // Plain Lambert on a single sand albedo. Running the illumination through the
  // three-stop ramp instead compressed all the tonal range into a narrow band
  // around the crest, which is what made earlier versions read as glossy ribbon
  // rather than as a broad, matte sand face.
  vec3 sand=mix(gMid, gHi, 0.30+0.35*alt);
  vec3 col = sand*(1.35*lit + 0.16*sky + 0.06*back)
           + gLo*(0.85-0.55*lit);
  col*=1.0-0.42*slipShade;

  // Ripple micro-glint: the crest of each ripple catches the low sun.
  float glint=pow(clamp(dot(nrm,normalize(L+vec3(0.0,0.0,1.0))),0.0,1.0),20.0);
  col+=mix(gHi,vec3(1.0),0.4)*glint*sh*0.16;
  // Deep shadow keeps the shadow colour rather than going to palette black.
  col=mix(col, mix(u_shadow*2.2,gLo,0.5), (1.0-sh)*0.40);

  // Windborne haze thickening toward the horizon-ish top of the frame.
  float haze=smoothstep(0.30,1.05,uv.y)*0.30;
  col=mix(col, mix(u_back,gMid,0.42)*1.1, haze);

  col=mix(u_back,col,0.97);

  vec2 vc=uv-0.5; vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.26;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation),0.0,1.0);

  float lvl=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;

  fragColor=vec4(col,1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-ter-dunes',
	description: 'sand dunes: asymmetric slip faces, wind ripples, marched cast shadows, drifting sun',
	vertexShader,
	fragmentShader
});
