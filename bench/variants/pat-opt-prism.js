// Prismatic dispersion. A slit grating of thin bright lines seen through a
// wedge of glass: each wavelength is bent by a different amount, so every thin
// line is smeared out into its own spectrum. Nine wavelengths are integrated
// per pixel, which is what makes the fans continuous instead of banded.
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
// Universal 0..1 morph axis. 0 is the resting form (a linear grating fanned
// sideways); 1 curls the same grating into concentric rings and turns the
// dispersion radial, so the fans become a spectral diffraction halo.
uniform float u_morph;

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

// Rough spectral locus, x=0 violet .. x=1 red.
vec3 spectral(float x){
  x = clamp(x, 0.0, 1.0);
  return clamp(vec3(
    smoothstep(0.38, 0.66, x) - 0.5*smoothstep(0.92, 1.0, x) + 0.30*smoothstep(0.12, 0.0, x),
    smoothstep(0.20, 0.50, x)*smoothstep(1.0, 0.60, x)*1.4,
    smoothstep(0.46, 0.10, x)
  ), 0.0, 1.0);
}

// The grating: a family of thin, curved bright lines. They have to be THIN —
// a broad source just translates under dispersion instead of fanning out.
// The morph bends the grating's coordinate from a linear ramp in x to radial,
// so the straight slits close into rings. Interpolating the *argument* of the
// same sine keeps every intermediate a single coherent wavefront (curved
// slits) rather than a cross-fade of two gratings beating against each other.
// The two wobble terms are damped over the same range because a ring family
// modulated that hard just looks dented.
float slit(vec2 p, float m){
  // sqrt(r^2 + k) rather than length(): a true radius has a cone point at the
  // origin and it shows up as a hard black pinprick in the middle of the halo.
  // The offset rounds that tip off without changing anything further out.
  float ax = mix(p.x, sqrt(dot(p,p) + 0.30)*2.15, m);
  float w = ax*1.85
          + mix(1.35, 0.80, m)*sin(p.y*0.62 + u_time*0.09)
          + mix(0.55, 0.32, m)*sin(p.y*1.31 - u_time*0.13);
  float s = 0.5 + 0.5*sin(w + u_time*0.07);
  float line = pow(s, 34.0);
  // Every third line is brighter, which stops the grating looking mechanical.
  float env = 0.45 + 0.55*(0.5 + 0.5*sin(w*0.3333 - 0.7));
  return line*env;
}

// Glass wedge. Its gradient is the direction light gets bent in; two low
// frequencies keep the fans long and sweeping rather than chaotic.
float wedge(vec2 p){
  return sin(p.x*0.41 - p.y*0.33 + u_time*0.06)
       + 0.62*cos(p.x*0.27 + p.y*0.58 - u_time*0.05)
       + 0.30*sin(p.y*0.93 + u_time*0.08);
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);
  vec2 p = q*rot(radians(u_rotation))*(1.2 + 22.0/max(u_folds,1.0));

  float e = 0.06;
  float h = wedge(p);
  vec2  g = vec2(wedge(p+vec2(e,0.0)) - wedge(p-vec2(e,0.0)),
                 wedge(p+vec2(0.0,e)) - wedge(p-vec2(0.0,e)))/(2.0*e);
  float m = clamp(u_morph, 0.0, 1.0);
  // not normalised: steeper glass = wider fan. Morphing rotates the bend
  // direction toward the outward radial, which is what makes a ring disperse
  // into a halo instead of shearing sideways.
  // Same softened radius, so the bend direction fades out at the centre
  // instead of flipping across it.
  vec2 rd = p/sqrt(dot(p,p) + 0.30);
  vec2 bend = mix(g, rd*length(g)*1.25 + g*0.22, m);

  // How far apart the extreme wavelengths land, in the same units as p.
  float D = (2.1 + 1.6*u_ribbonWidth) * (0.55 + 0.45*u_softness) * mix(1.0, 1.30, m);

  vec3 col = vec3(0.0);
  const int N = 9;
  for(int i=0;i<N;i++){
    float x = float(i)/float(N-1);
    float bd = mix(1.0, -1.0, x)*0.5 + 0.5;   // 1 at violet, 0 at red
    float s = slit(p - bend*D*(0.25 + 0.75*bd), m);
    // Mostly the palette, lifted by a little true spectral colour. The fan is
    // meant to read as the brand ramp separating, not as a stock rainbow.
    vec3 tint = mix(palette(x), spectral(x), 0.38);
    col += tint * s;
  }
  col *= 2.5/float(N);

  // A dim, undispersed copy of the grating provides the white core of each
  // line, so the fans hang off something bright.
  float core = slit(p - bend*D*0.5, m);
  col += vec3(1.0,0.97,0.93)*pow(core, 2.0)*0.45;

  // Glass body: a faint sheen and a darkening where the wedge is steep.
  float steep = length(g);
  col += palette(0.5)*0.030*(0.4 + 0.6*(0.5+0.5*h));
  col *= 1.0 - 0.22*smoothstep(0.3, 1.8, steep);

  vec3 bg = mix(u_back, u_shadow, 0.5 + 0.5*h*0.6);
  col += bg;

  col *= 1.0 - dot(q,q)*0.40;

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
	name: 'pat-opt-prism',
	description: 'prismatic dispersion — a slit grating fanned into spectra by a glass wedge',
	vertexShader,
	fragmentShader
});
