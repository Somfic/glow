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

mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

// Hard-edged grating with analytic anti-aliasing: dividing by the phase
// gradient turns the step into a one-pixel ramp, and any grating finer than a
// pixel collapses to its 0.5 average instead of aliasing into false patterns.
float grate(float a){
  float w=fwidth(a);
  return clamp(sin(a)/max(w,1e-4)*1.1+0.5, 0.0, 1.0);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 base=vec2((uv.x-0.5)*asp, uv.y-0.5);
  float t=u_time;
  vec2 p=base*rot(radians(u_rotation));

  float k=u_folds*7.0;
  vec2 c1=vec2(cos(t*0.107), sin(t*0.131))*0.42;
  vec2 c2=vec2(cos(t*0.083+2.1), sin(t*0.071+1.3))*0.55;

  // Two ring gratings of nearly equal pitch: their beat frequency is far lower
  // than either, which is the whole moire effect.
  float a1=length(p-c1)*k;
  float a2=length(p-c2)*k*(1.035+0.02*sin(t*0.06));
  float a3=dot(p, vec2(cos(t*0.043), sin(t*0.043)))*k*0.55;

  float g1=grate(a1), g2=grate(a2), g3=grate(a3);

  // XOR of the two ring sets: the interference bands, hard-edged.
  float x12=g1+g2-2.0*g1*g2;
  // Diamonds only survive inside the interference bands; everything else drops
  // to background, which is what gives the op-art its snap.
  float ink=x12*(0.20+0.80*g3);

  // Colour follows the low-frequency beat only, so the fine lines never
  // scramble the hue -- big smooth colour fields with hard black-and-colour
  // op-art structure drawn over them.
  float beat=(a1-a2)*0.5+a3*0.15;
  float idx=0.5+0.5*sin(beat*0.09+t*0.05);
  float idx2=0.5+0.5*sin(beat*0.09+t*0.05+2.2);
  vec3 c=palette(idx), cb=palette(idx2);

  float rad=1.0-smoothstep(0.05,1.25,length(p-c1*0.5)*0.95);

  vec3 col=mix(u_back, u_shadow, 0.9);
  col=mix(col, cb*(0.05+0.16*rad), 0.92);
  col=mix(col, c*(0.35+1.15*rad), ink);
  col+=c*pow(ink,4.0)*rad*0.7;

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.34;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation), 0.0, 1.0);
  float lvl=mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;
  fragColor=vec4(col,1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-geo-moire',
	description: 'two drifting ring gratings beating into hard-edged op-art interference',
	vertexShader,
	fragmentShader
});
