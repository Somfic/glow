// Liquid chrome: analytic metaballs with a real surface normal, studio env
// reflection sampled from the palette, and a tight specular.
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
float h11(float n){ return fract(sin(n*127.1+11.7)*43758.5453); }
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
float fbm2(vec2 p){
  float f=0.5*gn(p); p*=2.03;
  f+=0.25*gn(p); p*=2.01;
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

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  float k=u_folds/9.0;
  vec2 q=vec2((uv.x-0.5)*asp, uv.y-0.5)*2.0*k;
  q=rot(radians(u_rotation)*0.15)*q;

  float t=u_time*0.32;

  float F=0.0; vec2 G=vec2(0.0);
  for(int i=0;i<14;i++){
    float fi=float(i);
    float s1=0.45+0.55*h11(fi+1.0);
    float s2=0.40+0.60*h11(fi+7.0);
    float p1=h11(fi+3.0)*6.2831853;
    float p2=h11(fi+11.0)*6.2831853;
    vec2 c=vec2(2.05*sin(t*s1+p1)+0.42*sin(t*s2*1.63+p2),
                0.88*cos(t*s2+p2)+0.22*cos(t*s1*1.31+p1));
    float r=0.026+0.044*h11(fi+5.0);
    vec2 d=q-c;
    float d2=dot(d,d)+2e-4;
    F+=r/d2;
    G+=(-2.0*r/(d2*d2))*d;
  }

  float hgt=F-1.0;
  float aa=fwidth(F)*0.9+1e-4;
  float m=smoothstep(-aa,aa,hgt);

  // the dome has to be tall enough that the reflected ray sweeps the whole
  // environment across a blob — a shallow dome reads as a flat pastel disc
  float zz=sqrt(max(hgt,0.0)+0.004);
  vec2 dz=G/(2.0*zz)*0.34;

  // faint surface tremor — enough to break the perfect analytic dome, not
  // enough to turn the reflection into blotches
  float e=0.16;
  vec2 nq=q*1.5+vec2(0.0,t*0.7);
  float n0=fbm2(nq);
  vec2 dn=vec2(fbm2(nq+vec2(e,0.0))-n0, fbm2(nq+vec2(0.0,e))-n0)/e;
  dz+=dn*0.10*m;

  vec3 N=normalize(vec3(-dz,1.0));

  vec3 V=vec3(0.0,0.0,1.0);
  vec3 R=reflect(-V,N);

  // studio environment: a hard horizon is what makes metal read as metal.
  float ey=R.y;
  float sky=smoothstep(-0.02,0.02,ey);
  float lum=mix(0.010+0.05*(1.0+ey), 0.14+1.60*pow(max(ey,0.0),1.6), sky);
  float strip=exp(-pow((ey-0.70)*5.5,2.0))*1.30
             +exp(-pow((ey-0.13)*30.0,2.0))*0.55
             +exp(-pow((ey+0.60)*10.0,2.0))*0.08;
  lum+=strip;
  vec3 tint=palette(clamp(0.10+0.80*(ey*0.5+0.5),0.0,1.0));
  vec3 env=mix(vec3(lum), tint*lum*2.1, 0.48);
  env+=palette(0.80)*exp(-pow((R.x-0.62)*3.2,2.0))*0.22;

  float fres=pow(1.0-clamp(N.z,0.0,1.0),4.0);
  env=mix(env, palette(0.92)*1.5+vec3(0.20), fres*0.50);

  vec3 L=normalize(vec3(-0.32,0.72,0.62));
  vec3 H=normalize(L+V);
  float spec=pow(max(dot(N,H),0.0),110.0)*2.6;
  float spec2=pow(max(dot(N,normalize(vec3(0.6,-0.4,0.7)+V)),0.0),24.0)*0.35;

  // background + soft contact shadow from the field spilling past the surface
  vec3 bg=mix(u_back, u_shadow, smoothstep(-1.0,1.1,q.y));
  bg+=palette(0.45)*0.035;
  float sh=smoothstep(0.18,1.0,F)*(1.0-m);
  bg=mix(bg, u_shadow*0.35, sh*0.85);
  bg+=palette(0.6)*sh*0.10;

  vec3 col=mix(bg, env+vec3(spec+spec2), m);

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.30;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-mercury',
	description: 'liquid chrome metaballs, palette-tinted studio reflection',
	vertexShader,
	fragmentShader
});
