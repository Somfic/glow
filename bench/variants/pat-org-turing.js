// Faked reaction-diffusion. A single octave of 3D gradient noise thresholded
// against a slowly varying level gives constant-width labyrinth worms; drifting
// the level from region to region turns worms into isolated spots the way a real
// Gray-Scott system does. The z axis of the noise is time, so the pattern
// reorganises in place instead of sliding.
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

vec3 h33(vec3 p){
  p=vec3(dot(p,vec3(127.1,311.7,74.7)),
         dot(p,vec3(269.5,183.3,246.1)),
         dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453)*2.0-1.0;
}
float gn3(vec3 p){
  vec3 i=floor(p), f=fract(p);
  vec3 u=f*f*(3.0-2.0*f);
  return mix(mix(mix(dot(h33(i+vec3(0,0,0)),f-vec3(0,0,0)),
                     dot(h33(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                 mix(dot(h33(i+vec3(0,1,0)),f-vec3(0,1,0)),
                     dot(h33(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
             mix(mix(dot(h33(i+vec3(0,0,1)),f-vec3(0,0,1)),
                     dot(h33(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                 mix(dot(h33(i+vec3(0,1,1)),f-vec3(0,1,1)),
                     dot(h33(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
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
  vec2 p=rot(radians(u_rotation)*0.5)*vec2((uv.x-0.5)*asp, uv.y-0.5)*(u_folds*0.42);

  float t=u_time;

  // slow curl-ish drift: the medium creeps, it does not translate
  vec3 W=vec3(p*0.35, t*0.045);
  p+=1.05*vec2(gn3(W), gn3(W+vec3(19.3,7.1,4.4)));

  // the reaction field. one octave = one characteristic wavelength
  vec3 P=vec3(p, t*0.085);
  float n=gn3(P)*1.9;
  float fine=gn3(P*2.9+vec3(31.0,5.0,0.0))*0.32;
  n+=fine;

  // level set that wanders -> stripes here, spots there
  float lvlF=gn3(vec3(p*0.24, t*0.03)+vec3(51.0,3.0,17.0));
  float level=lvlF*0.78;

  float d=n-level;
  float w=fwidth(d)*1.1+0.008;

  // phase A: filled worms.  band: the reaction front between the two species
  float A=smoothstep(-w, w, -abs(d)+0.30);
  float front=exp(-pow(abs(abs(d)-0.30)/(0.045+w),2.0));

  // fine granular texture inside phase A only
  float grain=gn3(P*6.5+vec3(0.0,0.0,t*0.25))*0.5+0.5;

  // emboss: phase A sits proud of the substrate
  vec2 g=vec2(dFdx(A),dFdy(A))*u_resolution.xy*0.0030;
  vec3 N=normalize(vec3(-g,1.0));
  vec3 L=normalize(vec3(-0.45,0.60,0.66));
  float diff=clamp(dot(N,L),0.0,1.0);
  float spec=pow(clamp(dot(N,normalize(L+vec3(0,0,1))),0.0,1.0),30.0);

  // substrate
  float mott=gn3(vec3(p*0.5,t*0.02))*0.5+0.5;
  vec3 sub=mix(u_back, u_shadow, 0.6+0.4*mott);
  sub+=palette(0.10)*0.16*mott;

  // colonies: colour keyed on which pocket of the level field they grow in
  vec3 ca=palette(clamp(0.26+0.60*(lvlF*0.5+0.5)+0.08*grain,0.0,1.0));
  vec3 col=mix(sub, ca*(0.34+0.58*diff)*(0.86+0.24*grain), A*0.95);
  col+=mix(palette(0.72),vec3(1.0),0.35)*front*(0.35+0.45*A)*0.85;
  col+=vec3(spec)*A*0.30;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.30;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-turing',
	description: 'reaction-diffusion labyrinth, worms melting into spots',
	vertexShader,
	fragmentShader
});
