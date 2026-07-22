// Lens flare: bright sources with anamorphic streaks, aperture starburst
// spikes, chromatic ghost reflections down the optical axis and a halo ring.
// Restraint is the whole design here — long spikes across the frame read as a
// cheap starburst, so the spikes are short and the ghosts carry the interest.
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

// Soft polygonal aperture: |cos| lobes give a rounded n-gon without the
// branchiness of a real polygon SDF. Ghosts are hollow — bright edge, dim
// middle — because they are images of the iris, not of the light.
float aperture(vec2 d, float r, float blades, float rotOff){
  float ang = atan(d.y, d.x);
  float poly = 1.0 + 0.06*cos(ang*blades + rotOff);
  float t = length(d)/(r*poly);
  float body = smoothstep(1.0, 0.80, t);
  float edge = smoothstep(0.55, 0.95, t)*smoothstep(1.02, 0.90, t);
  return body*(0.30 + 0.9*edge);
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);

  float zoom = 0.75 + 2.2/max(u_folds,1.0);
  vec3 col = mix(u_back*0.85, u_shadow, smoothstep(0.6, -0.6, q.y));
  float rotOff = radians(u_rotation);

  for(int s=0; s<2; s++){
    float fs = float(s);
    float ph = u_time*0.10 + fs*2.3;
    // Sources drift on slow ellipses; the frame reads as a moving camera.
    vec2 src = vec2(0.40*asp*sin(ph*0.83 + fs), 0.26*cos(ph*0.61 + fs*2.0));
    src *= zoom*(1.0 - 0.25*fs);
    vec2 d = q - src;
    float r = length(d);
    float ang = atan(d.y, d.x);

    float bright = mix(1.0, 0.5, fs);
    vec3 hot = mix(palette(0.88 - 0.40*fs), vec3(1.0), 0.6);

    // Core, then two nested glows: the tight one gives the point, the wide one
    // gives the atmosphere the point is sitting in.
    col += hot * exp(-r*r*(900.0/zoom)) * 1.7 * bright;
    col += mix(hot, palette(0.55), 0.5) * exp(-r*(11.0/zoom)) * 0.45 * bright;
    col += palette(0.70 - 0.3*fs) * exp(-r*(3.4/zoom)) * 0.12 * bright;

    // Aperture starburst. Short: the exponent on r keeps the spikes local.
    float blades = 9.0;
    float wob = 0.30*sin(u_time*0.21 + fs*2.0);
    float spike = pow(abs(cos(ang*blades*0.5 + rotOff + wob)), 40.0);
    col += hot * spike * exp(-r*(15.0 - 4.0*u_softness)/zoom) * 0.85 * bright;

    // Anamorphic streak. Gaussian in x so it tapers to nothing instead of
    // running hard-edged off both sides of the frame.
    float sw = 62.0/(zoom*max(u_ribbonWidth,0.25));
    float streak = exp(-abs(d.y)*sw) * exp(-d.x*d.x*(5.5/zoom));
    col += mix(palette(0.38), vec3(0.6,0.78,1.0), 0.6) * streak * 0.55 * bright;
    // Faint wide companion, which is what sells it as a lens and not a line.
    col += vec3(0.35,0.5,0.9) * exp(-abs(d.y)*sw*0.16) * exp(-d.x*d.x*(3.0/zoom)) * 0.09 * bright;

    // Ghosts: internal reflections land on the line through frame centre,
    // scaled by fixed ratios, each slightly chromatically offset.
    for(int gi=0; gi<6; gi++){
      float f = float(gi);
      float k = -0.85 + f*0.42;
      vec2 gp = q + src*k;
      float gr = (0.045 + 0.075*fract(f*0.37 + 0.31))*(0.5 + abs(k))*zoom;
      float ca = 0.06;
      float a0 = aperture(gp*(1.0-ca), gr, blades, rotOff);
      float a1 = aperture(gp,          gr, blades, rotOff);
      float a2 = aperture(gp*(1.0+ca), gr, blades, rotOff);
      vec3 tint = palette(0.22 + 0.55*fract(0.10 + f*0.29 + fs*0.4));
      col += tint * vec3(a0, a1, a2) * (0.34 + 0.22*fract(f*0.71)) * bright;
    }

    // Chromatic halo ring around the source.
    float ring = smoothstep(0.085, 0.0, abs(r - 0.34*zoom));
    vec3 rc = mix(palette(0.28), palette(0.66), 0.5 + 0.5*sin(ang*2.0 + u_time*0.2));
    col += rc*ring*0.13*bright;
  }

  // Faint atmospheric wash so the black is never dead.
  col += palette(0.22)*0.04;
  col *= 1.0 - dot(q,q)*0.28;

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
	name: 'pat-opt-flare',
	description: 'lens flare — anamorphic streaks, blade starbursts and chromatic ghosts',
	vertexShader,
	fragmentShader
});
