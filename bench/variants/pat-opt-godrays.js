// Volumetric shafts: light through a broken occluder, thickening into haze,
// with dust drifting through the beams. The source stays off-canvas — a
// visible sun blows the frame out and kills any text sitting on top.
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

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}

float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

float hash11(float p){
  p = fract(p*0.1031); p += p*(p+33.33); return fract((p+p)*p);
}
float vn(float x){
  float i = floor(x), f = fract(x);
  f = f*f*(3.0-2.0*f);
  return mix(hash11(i), hash11(i+1.0), f);
}
float hash21(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
float vn2(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}

// Irregular gaps in the occluder, as a function of angle from the source.
float slats(float a, float t){
  float s = 0.0;
  s += 0.60*vn(a*5.0 + t*0.11);
  s += 0.26*vn(a*11.0 - t*0.07);
  s += 0.14*vn(a*23.0 + t*0.15);
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);

  // Source sits well outside the frame; u_rotation swings it round the rim.
  float ra = radians(u_rotation) + 2.35;
  vec2 sun = vec2(cos(ra), sin(ra))*1.95;
  vec2 d = q - sun;
  float r = length(d);
  float a = atan(d.y, d.x);

  float zoom = 0.5 + 4.0/max(u_folds,1.0);
  float t = u_time;

  // Smoke in the air deflects the shaft edges — without it the rays are
  // perfectly straight and read as a cheap starburst.
  float smoke = vn2(q*2.1 + vec2(t*0.05, -t*0.03));
  // Deflection is divided by radius: a fixed angular wobble far from the
  // source displaces the beam enormously, which is what turns shafts into
  // wavy silk. Keeping the *positional* wobble constant keeps them straight.
  float aa = a*(2.0 + 5.0*zoom) + (smoke-0.5)*0.16/max(r, 0.7);

  // Sharpening the slat noise into a high-contrast mask is what turns it into
  // beams rather than a smear.
  float sl = slats(aa, t);
  float beam = smoothstep(0.48, 0.545, sl);
  beam = pow(beam, 1.0 + 1.2/max(u_softness, 0.2));

  // Falloff with distance travelled, plus break-up along the length.
  float breakup = 0.82 + 0.18*vn(r*1.8 - t*0.28);
  float shafts = beam*exp(-(r-0.9)*2.6)*breakup;

  // Wider, softer envelope underneath: the light that scattered out of the
  // beams and filled the room.
  float wide = smoothstep(0.34, 0.80, slats(a*(1.4+2.0*zoom) + 5.0, t*0.55));
  shafts += wide*exp(-(r-0.9)*1.7)*0.055;
  shafts = max(shafts, 0.0);

  float halo = exp(-(r-0.9)*2.2)*0.16;

  // Haze fills the room; denser low in frame where the dust settles.
  float hz = exp(-(r-0.9)*0.7)*(0.30 + 0.45*smoothstep(0.6, -0.55, q.y))*(0.6+0.5*smoke);

  vec3 warm = mix(palette(0.95), vec3(1.0,0.90,0.74), 0.55);
  vec3 mid  = mix(palette(0.60), vec3(0.9,0.7,0.55), 0.30);
  vec3 cool = palette(0.22);

  vec3 col = mix(u_back*0.55, u_shadow*0.8, smoothstep(0.55, -0.55, q.y));
  col += cool*hz*0.22;
  col += mix(mid, warm, clamp(shafts*1.6, 0.0, 1.0)) * shafts * 0.95;
  col += warm*halo*0.75;

  // Dust motes: fine, sparse, and only visible where a beam passes through.
  vec2 dp = q*95.0 + vec2(t*0.9, -t*0.5 + sin(q.x*3.0+t*0.5)*0.6);
  vec2 dc = floor(dp);
  float dh = hash21(dc);
  vec2 dcen = dc + 0.5 + (vec2(hash21(dc+3.1), hash21(dc+7.7))-0.5)*0.85;
  float dm = smoothstep(0.26, 0.0, length(dp-dcen))*step(0.988, dh);
  col += vec3(1.0,0.95,0.88)*dm*(0.05 + 1.5*shafts)*0.6;

  col *= 1.0 - dot(q,q)*0.32;

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
	name: 'pat-opt-godrays',
	description: 'volumetric god rays — broken shafts through haze with lit dust motes',
	vertexShader,
	fragmentShader
});
