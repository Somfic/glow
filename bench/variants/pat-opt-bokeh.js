// Defocused city lights: layered out-of-focus discs with bright rims, chromatic
// fringing at the edge of the aperture, drifting slowly through the frame.
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

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}

float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

vec2 hash22(vec2 p){
  vec3 p3 = fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}

// One out-of-focus point light. d is the normalised radius in the aperture.
// A defocused disc is not a flat circle: spherical aberration piles energy at
// the rim, the interior is slightly domed, and the whole thing sits in a soft
// veiling glow. Without the glow it reads as a polka dot.
float disc(float d, float soft){
  float body = smoothstep(1.0, 1.0-soft, d);
  float rim  = smoothstep(0.62, 1.0, d)*smoothstep(1.02, 0.92, d);
  return body*(0.20 + 0.12*(1.0-d*d)) + rim*1.05 + 0.50*exp(-d*d*1.7);
}

// A grid of jittered lights. One layer = 9 cell probes; radius stays under one
// cell so 3x3 is enough coverage for overlap.
vec3 layer(vec2 p, float rad, float soft, float seed, float bright, float density){
  vec3 acc = vec3(0.0);
  vec2 cell = floor(p);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 c = cell + vec2(float(i), float(j));
      vec2 h  = hash22(c + seed);
      vec2 h2 = hash22(c + seed + 17.3);
      if(h2.y < density || h.y < 0.14) continue;          // a sparse field reads far richer
      // slow lissajous drift, so lights never look pinned to a lattice
      vec2 ctr = c + 0.5 + (h-0.5)*0.9
               + 0.18*vec2(sin(u_time*0.19 + h2.x*6.28), cos(u_time*0.15 + h2.y*6.28));
      // Heavily skewed size distribution: mostly small, a few very large.
      float sz = h2.x*h2.x;
      float r = rad*(0.20 + 1.05*sz);
      vec2 dd = p - ctr;
      float d = length(dd)/r;
      if(d > 1.35) continue;
      // lateral chromatic aberration: the disc edge is slightly bigger in red
      float ca = 0.045*u_ribbonWidth;
      float ir = disc(d*(1.0-ca), soft);
      float ig = disc(d,          soft);
      float ib = disc(d*(1.0+ca), soft);
      // Narrow the hue window: a full sweep of the ramp turns into confetti.
      // Mostly the cool half of the ramp, with occasional warm accents; a
      // full sweep of a wide ramp turns the field into confetti.
      float hs = fract(h.x*1.7 + h2.y*0.41);
      vec3 tint = palette(hs > 0.86 ? 0.78 : 0.16 + 0.40*hs);
      // Long-tailed brightness so a handful of lights blow out to white.
      float e = h.y;
      // Larger discs spread the same flux over more area, so they are dimmer.
      float amp = bright*(0.22 + 3.0*pow(e, 4.0))*(0.42/(0.22 + 1.1*sz));
      tint = mix(tint, vec3(1.0), 0.45*smoothstep(0.75, 1.0, e));
      acc += tint * vec3(ir, ig, ib) * amp;
    }
  }
  return acc;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);
  vec2 p0 = q*rot(radians(u_rotation*0.35));

  float sc = max(u_folds,1.0)*0.34;
  float soft = clamp(0.40*u_softness, 0.12, 0.9);

  vec3 col = mix(u_back*0.7, mix(u_shadow, u_colors[0].rgb*0.25, 0.4),
                 smoothstep(-0.6, 0.6, q.y + q.x*0.3));

  // Far / mid / near planes of focus separation.
  col += layer(p0*(sc*2.3) + vec2(u_time*0.06, 0.0),          0.36, soft*0.75, 3.0,  0.40, 0.60);
  col += layer(p0*(sc*1.10) + vec2(u_time*0.04, u_time*0.010), 0.42, soft,      11.0, 1.05, 0.52);
  col += layer(p0*(sc*0.48) + vec2(u_time*0.022, 0.0),         0.50, soft*1.5,  29.0, 0.70, 0.68);

  // Ambient wash: the light that did not make it into a disc.
  float wash = 0.5 + 0.5*sin(p0.x*0.9 + u_time*0.11)*cos(p0.y*0.7 - u_time*0.09);
  col += palette(0.30 + 0.4*wash) * 0.05;

  col *= 1.0 - dot(q,q)*0.55;

  col = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14), 0.0, 1.0);
  col = pow(col, vec3(1.0/2.2));
  float luma = dot(col, vec3(0.2126,0.7152,0.0722));
  col = clamp(mix(vec3(luma), col, u_saturation), 0.0, 1.0);
  float lvl = mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col += (bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col = floor(col*lvl+0.5)/lvl;
  fragColor = vec4(col, 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-opt-bokeh',
	description: 'defocused lights — three planes of rim-bright bokeh discs drifting',
	vertexShader,
	fragmentShader
});
