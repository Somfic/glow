// Slime mould: a branching filament network built from level sets of warped
// gradient noise, with nutrient pulses travelling along the strands and bright
// nodes where strands meet.
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
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 grad2(vec2 p){ float a=h21(p)*6.2831853; return vec2(cos(a),sin(a)); }
float gn(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(dot(grad2(i),f),dot(grad2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(grad2(i+vec2(0,1)),f-vec2(0,1)),dot(grad2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
const mat2 m2=mat2(0.80,-0.60,0.60,0.80);
float fbm(vec2 p){
  float f=0.5*gn(p); p=m2*p*2.03;
  f+=0.25*gn(p); p=m2*p*2.01;
  f+=0.125*gn(p);
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

// one filament layer: the |n| = 0 contour of a gradient-noise field, thinned to
// a constant-width strand by dividing by the local gradient magnitude.
float strand(vec2 p, float width){
  float n=gn(p);
  float g=length(vec2(dFdx(n),dFdy(n)))+1e-5;
  float d=abs(n)/g;
  return 1.0-smoothstep(0.0,width,d);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 p0=rot(radians(u_rotation)*0.4)*vec2((uv.x-0.5)*asp, uv.y-0.5)*(u_folds*0.30);

  float t=u_time;

  // the colony creeps: a slow warp field, plus a growth term that pushes the
  // strands outward from the warp minima
  vec2 wv=vec2(fbm(p0*0.45+vec2(0.0,t*0.035)), fbm(p0*0.45+vec2(7.3,t*0.03)));
  vec2 p=p0+wv*1.9;

  // strand() returns a screen-space distance, so widths are in pixels
  float s1=strand(p,             3.4);
  float s2=strand(p*2.35+3.7,    2.6);
  float s3=strand(p*5.30-11.2,   1.9);

  float net=s1*1.00+s2*0.70+s3*0.40;

  // colony density: where the mould has actually reached
  float dens=fbm(p0*0.60+vec2(3.0,t*0.02))*2.9+0.42;
  dens=clamp(dens,0.0,1.0);
  net*=0.08+1.35*dens*dens;

  // nutrient pulses flowing along the strands
  float ph=fbm(p0*0.42+vec2(21.0,0.0))*11.0 - t*0.85;
  float pulse=0.5+0.5*sin(ph*6.2831853);
  pulse=pow(pulse,4.0);

  // junction nodes: where two strand families coincide
  float node=s1*s2*1.6+s2*s3*1.0;
  node=pow(clamp(node,0.0,1.0),1.4);

  // faint spores dusted over the substrate
  float spore=pow(clamp(fbm(p*7.0+vec2(t*0.05,0.0))*2.2+0.45,0.0,1.0),6.0);

  vec3 bg=mix(u_back,u_shadow,0.65);
  bg+=palette(0.03)*0.12*dens;

  vec3 cool=palette(clamp(0.30+0.30*dens,0.0,1.0));
  vec3 hot =palette(clamp(0.80+0.20*pulse,0.0,1.0));

  vec3 col=bg;
  col+=cool*net*(0.55+0.35*dens);
  col+=hot*net*pulse*1.15;
  col+=hot*node*(0.55+1.4*pulse);
  col+=cool*spore*0.55*dens;
  // halo so the network glows rather than sits flat on the plate
  col+=cool*clamp(net,0.0,1.0)*0.22;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.32;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-mycelium',
	description: 'branching slime-mould network with nutrient pulses',
	vertexShader,
	fragmentShader
});
