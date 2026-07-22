// Polished marble: two families of turbulence-driven veins over a mottled
// stone base, lit as a slightly glossy slab.
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
// Universal 0..1 morph axis. 0 is the resting form: thin calcite veins on a
// dark slab. 1 is the same stone cut the other way — the vein families open out
// and the turbulence that scattered them is eased off, so what is left is broad
// banded agate layering.
uniform float u_morph;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 grad2(vec2 p){ float a=h21(p)*6.2831853; return vec2(cos(a),sin(a)); }
float gn(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=dot(grad2(i),f);
  float b=dot(grad2(i+vec2(1,0)),f-vec2(1,0));
  float c=dot(grad2(i+vec2(0,1)),f-vec2(0,1));
  float d=dot(grad2(i+vec2(1,1)),f-vec2(1,1));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
const mat2 m2=mat2(0.80,-0.60,0.60,0.80);
float fbm(vec2 p){
  float f=0.5*gn(p); p=m2*p*2.03;
  f+=0.25*gn(p); p=m2*p*2.01;
  f+=0.125*gn(p); p=m2*p*2.02;
  f+=0.0625*gn(p);
  return f;
}
// low-passed version. The vein phase must come from a smooth field: feeding it
// the full fbm makes every vein wobble at pixel scale and the slab reads as
// water rather than stone.
float fbmL(vec2 p){
  float f=0.58*gn(p); p=m2*p*2.03;
  f+=0.29*gn(p);
  return f;
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, f*f*(3.0-2.0*f));
}
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}
vec3 finish(vec3 col){
  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float l=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(l),col,u_saturation),0.0,1.0);
  float lvl=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  return floor(col*lvl+0.5)/lvl;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  // u_rotation orients the slab; u_folds is the zoom. Written as 0.15*(81/folds)
  // so that at the component default (9) it is bit-for-bit the old 0.15*folds,
  // while the direction now matches every other pattern: larger = larger.
  vec2 p=rot(radians(u_rotation))*vec2((uv.x-0.5)*asp, uv.y-0.5)*(0.15*(81.0/max(u_folds,1.0)));

  float m=clamp(u_morph,0.0,1.0);
  float t=u_time*0.05;

  // domain warp: the slow drift makes the stone look like it is still setting
  vec2 q1=vec2(fbmL(p+vec2(0.0,t)), fbmL(p+vec2(5.2,1.3)-t*0.8));
  vec2 r1=vec2(fbmL(p+2.1*q1+vec2(1.7,9.2)+t*0.6), fbmL(p+2.1*q1+vec2(8.3,2.8)-t*0.4));
  float turb=fbm(p+1.7*r1);
  float turbL=fbmL(p+1.7*r1);

  // primary vein family — sinusoid folded by the turbulence. The morph does two
  // things at once, both continuous: it drains the turbulence out of the phase
  // (so the fold straightens into stratified layers) and drops the exponents
  // that pinch each fold into a hairline (so the layers open into bands).
  // Exponent interpolation is what keeps the sweep pop-free — there is no
  // threshold anywhere, a vein just fattens.
  float s1=sin((p.x*1.15+p.y*0.45+mix(5.4,1.50,m)*turbL+mix(2.2,0.55,m)*r1.x)*mix(1.15,3.20,m));
  float v1=1.0-abs(s1);
  float core=pow(v1,mix(13.0,3.20,m));
  float halo=pow(v1,mix(3.5,1.50,m));

  // secondary, finer, crossing family
  float s2=sin((p.x*0.55-p.y*1.75+mix(4.2,1.40,m)*fbmL(p*1.05+r1*1.8))*mix(1.9,3.10,m));
  float v2=1.0-abs(s2);
  float core2=pow(v2,mix(26.0,6.0,m));

  float veins=core+mix(0.75,0.50,m)*core2;

  // relief for the polish. Only the broad shape gets a normal — taking the
  // derivative of the full turbulence covers the slab in wet-looking ripples.
  float relief=0.55*r1.x+0.35*q1.y+0.30*halo+0.45*core;
  vec2 g=vec2(dFdx(relief),dFdy(relief))*u_resolution.xy*0.0022;
  vec3 N=normalize(vec3(-g,1.0));
  vec3 L=normalize(vec3(0.42,0.62,0.66));
  float diff=0.62+0.45*clamp(dot(N,L),0.0,1.0);
  float spec=pow(clamp(dot(N,normalize(L+vec3(0.0,0.0,1.0))),0.0,1.0),46.0);

  // stone: dark, faintly coloured mottling from the low palette
  // Eased with m*m, not m. The colour shift is by far the loudest part of this
  // morph, and on a linear ramp the slab had finished changing colour by the
  // halfway point while the veins were still only half-open. Squaring is still
  // smooth and still monotonic; it just moves the colour to the back half so
  // the two halves of the change land together.
  float mc=m*m;
  float mott=clamp(turb*1.9+0.5+mix(0.0,0.42,mc)*s1,0.0,1.0);
  vec3 stone=mix(u_back, u_shadow, 0.55);
  // At rest the base tone comes from the darkest palette stop only, so the slab
  // stays stone-coloured and the veins are the only saturated thing in frame.
  // The morph walks that lookup along the ramp in step with the vein phase,
  // which is what turns a veined slab into banded agate: the stone itself picks
  // up the layering instead of the veins being an overlay on a flat field.
  stone=mix(stone, palette(mix(0.0,0.27*(0.5+0.5*s1),mc))*(0.55+0.75*mott), 0.55);
  stone*=diff;

  // veins: bright, colour picked by which turbulence pocket they run through
  // calcite is never a pure hue — pulling the vein colour toward white is what
  // stops it reading as a neon line painted on the slab
  // banded agate takes its colour from which layer you are in, so the morph
  // feeds the fold phase itself into the ramp lookup and lets the bands hold
  // more chroma than a calcite vein would.
  vec3 vcol=mix(palette(clamp(0.42+0.55*r1.y+0.25*q1.x+mix(0.0,0.34,m)*s1,0.0,1.0)), vec3(0.55), mix(0.45,0.34,m));
  vec3 col=stone;
  col=mix(col, vcol*0.18, halo*halo*mix(0.70,0.55,m));
  // a band covers far more of the slab than a hairline vein did, so the gain
  // comes down to keep the dark stone between the layers
  col+=vcol*veins*mix(0.55,0.30,m);
  col+=vec3(1.0)*core*core*mix(0.12,0.06,m);
  col+=vec3(spec)*(0.05+0.16*veins);

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.28;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-marble',
	description: 'polished marble slab, two vein families over mottled stone',
	vertexShader,
	fragmentShader
});
