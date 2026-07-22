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
float fbm(vec2 p){
  float f=0.0,a=0.5,s=0.0;
  for(int i=0;i<4;i++){ f+=a*vnoise(p); s+=a; a*=0.5; p=m2*p*2.05; }
  return f/s;
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  int j=min(i+1,int(u_ncols)-1);
  return mix(u_colors[i].rgb, u_colors[j].rgb, f*f*(3.0-2.0*f));
}
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

// The stack's height field. Smooth and low-frequency: this is a laser-cut
// model, not a landscape, so the outlines want to be clean curves.
float H(vec2 p, float t){
  vec2 q=vec2(fbm(p*0.9+vec2(0.0,t*0.020)), fbm(p*0.9+vec2(4.1,2.7)-t*0.014));
  float h=fbm(p+1.15*q);
  return h*1.30-0.12;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 p=vec2((uv.x-0.5)*asp, uv.y-0.5);
  p=rot(radians(u_rotation))*p;
  p*=0.30*u_folds;

  float t=u_time;

  const float N=9.0;
  // Tide: the whole model rises and falls, so islands grow, merge and split.
  float tide=0.055*sin(t*0.055);
  float h=H(p,t)+tide;
  float e=h*N;
  float lvl=floor(e);

  // Light from the upper left; the sheets are lit almost flat, the depth comes
  // entirely from the shadow each sheet drops onto the one below it.
  float az=2.35+0.10*sin(t*0.04);
  vec2 Ldir=vec2(cos(az),sin(az));

  // Two taps toward the light give a cheap penumbra: how many sheets stand
  // above this pixel a short way toward the light source.
  float d1=0.075, d2=0.190;
  float e1=(H(p+Ldir*d1,t)+tide)*N;
  float e2=(H(p+Ldir*d2,t)+tide)*N;
  float occ = 0.62*clamp(floor(e1)-lvl,0.0,3.0)
            + 0.38*clamp(floor(e2)-lvl,0.0,3.0);
  occ=clamp(occ*0.55,0.0,1.0);

  // Sheet colour: the palette walked once across the whole stack.
  float k=clamp(lvl/(N-1.0),0.0,1.0);
  vec3 sheet=palette(k);
  // Higher sheets sit closer to the light, so they read a touch brighter.
  sheet*=0.80+0.42*k;

  // Paper: a fine fibre grain plus a soft mottle, both fixed to the sheet.
  float fibre=vnoise(vec2(p.x*260.0, p.y*90.0+lvl*17.0));
  float mottle=fbm(p*3.4+lvl*7.0);
  sheet*=0.93+0.10*fibre+0.10*(mottle-0.5);

  vec3 col=sheet;

  // Drop shadow, tinted with the shadow colour rather than plain black. The
  // whole illusion of thickness lives here, so it is worth being generous.
  vec3 shC=mix(u_shadow, sheet*0.16, 0.30);
  col=mix(col, shC, occ*0.90);
  // Contact darkening right against the edge of the sheet above.
  col*=1.0-clamp(occ*1.6-0.55,0.0,1.0)*0.30;

  // Cut edge: a crisp bright line along the top rim of every sheet, width
  // taken from fwidth so it stays one pixel at any zoom.
  float w=max(fwidth(e),1e-4);
  float rim=1.0-smoothstep(0.0,1.6,fract(e)/w);
  // Only the rims facing the light catch it; the others get a thin dark cut.
  vec2 ge=vec2(dFdx(e),dFdy(e));
  float facing=dot(normalize(ge+1e-5), Ldir);
  col=mix(col, palette(clamp(k+0.25,0.0,1.0))*1.7+0.06, rim*clamp(facing,0.0,1.0)*0.75);
  col=mix(col, shC*0.7, rim*clamp(-facing,0.0,1.0)*0.45);

  // The lowest level is the base board, not paper.
  float base=1.0-step(0.5,e);
  col=mix(col, mix(u_back,u_shadow,0.5)*(1.0+0.3*(1.0-occ)), base*0.85);

  vec2 vc=uv-0.5; vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.28;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation),0.0,1.0);

  float lvlq=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvlq;
  col=floor(col*lvlq+0.5)/lvlq;

  fragColor=vec4(col,1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-ter-papercut',
	description: 'laser-cut topographic model: stacked paper sheets, drop shadows, lit cut edges',
	vertexShader,
	fragmentShader
});
