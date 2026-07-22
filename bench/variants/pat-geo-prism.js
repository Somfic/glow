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

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 base=vec2((uv.x-0.5)*asp, uv.y-0.5);
  float t=u_time;

  // Iterated mirror-fold: each abs() is a reflecting plane, so the field is
  // piecewise linear -> hard flat facets with straight seams, like a cut gem.
  vec2 z=base*rot(radians(u_rotation))*(u_folds*0.115)+vec2(0.30,-0.14);
  float id=0.0, edge=1e9, sc=1.0;
  for(int i=0;i<5;i++){
    vec2 sg=sign(z);
    z=abs(z);
    edge=min(edge, min(z.x,z.y)/sc);
    id+=(sg.x*0.5+0.5)*0.317*float(i+1)+(sg.y*0.5+0.5)*0.213*float(i+1);
    z-=vec2(0.66,0.47);
    z*=rot(0.58+0.16*sin(t*0.045+float(i)*0.8));
    z*=1.30; sc*=1.30;
  }

  float fid=fract(id*0.29+t*0.012);
  // Linear ramp in the folded coordinate = a smooth gradient inside each facet,
  // reset at every seam. That is what makes it read as thick glass.
  float ramp=0.5+0.5*sin(dot(z,vec2(0.55,0.42))*0.9+t*0.25);
  float ramp2=0.5+0.5*cos(dot(z,vec2(-0.36,0.61))*1.2-t*0.18);
  // Depth: light falls off away from one corner, so the stone has a lit face
  // and a shadowed one rather than glowing uniformly.
  float lit=smoothstep(-0.9, 0.7, dot(base, normalize(vec2(-0.75,0.65)))+0.25*ramp2);

  float w=fwidth(edge);
  float seam=1.0-smoothstep(0.0, 0.0022+w*1.3, edge);
  float glow=exp(-edge*22.0);

  // id only changes when a fold flips, so it is constant across a facet:
  // every face gets one flat brightness, which is what separates a cut stone
  // from a smooth blob. The ramp then adds only a slight internal gradient.
  float fshade=fract(id*0.61+0.17);
  fshade=0.06+1.05*fshade*fshade;

  // Chromatic dispersion: the three channels read the ramp at slightly
  // different points, so seams fringe like a prism splitting light.
  float d=0.024*(0.35+ramp2);
  float k=fid*0.72+ramp*0.28;
  vec3 disp=vec3(palette(k-d).r, palette(k).g, palette(k+d).b);

  vec3 col=mix(u_back, u_shadow, 0.9);
  col=mix(col, disp*fshade*(0.18+1.0*lit)*(0.65+0.5*ramp2), 0.96);
  col+=disp*glow*fshade*lit*0.5;
  col+=mix(disp, vec3(1.0), 0.40)*seam*(0.10+1.3*ramp*lit*fshade);

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.42;

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
	name: 'pat-geo-prism',
	description: 'mirror-folded gemstone facets with dispersive seams',
	vertexShader,
	fragmentShader
});
