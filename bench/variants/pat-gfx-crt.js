import { makeSinglePassVariant } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// A CRT that is showing something worth watching: soft colour-bar bands warped
// by a slow signal, drawn through phosphor stripes tinted from the palette,
// with NTSC chroma smear, a rolling refresh bar and glass curvature.
export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec4  u_colors[5];
uniform float u_ncols;
uniform vec3  u_back;
uniform vec3  u_shadow;
uniform float u_softness;
uniform float u_saturation;
uniform float u_rotation;
uniform float u_folds;
uniform float u_ribbon;
uniform float u_ribbonWidth;
uniform float u_noise;

out vec4 fragColor;

vec3 pal(float x){
  x = clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i = int(floor(x)); float f = fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx)*0.1031);
  p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

// The picture on the tube, sampled in curved screen space.
vec3 signal(vec2 s){
  float t = u_time;
  // Vertical colour bars that lean and breathe, plus a travelling luma sweep.
  float x = s.x*0.5 + 0.5;
  float y = s.y*0.5 + 0.5;
  // Test-card colour bars: hard-edged flat blocks, leaning with a slow signal
  // wobble so the whole card sways like a tape that has lost sync.
  float warp = 0.10*sin(y*2.3 - t*0.45) + 0.045*sin(y*5.7 + t*0.29);
  float bars = x*0.42 + warp + t*0.020;   // ~5 wide bars, not a fine curtain
  float nb = max(u_ncols, 2.0);
  float idx = floor(fract(bars)*nb)/max(nb-1.0, 1.0);
  // Sit the bars back into the tube's black so the picture is a lit image on a
  // dark screen, not a full-brightness swatch — text has to survive on top.
  vec3 c = mix(u_back*1.3, pal(idx), 0.62);
  // Lower third: a wide luma pedestal, like the greyscale strip under the bars.
  float pedestal = smoothstep(0.34, 0.10, y);
  c = mix(c, mix(u_back*2.2, pal(0.5)*0.55, floor(fract(bars*0.5)*3.0)/2.0), pedestal*0.9);
  // Gentle vertical brightness structure, nothing that fights the bars.
  float lum = 0.80 + 0.30*sin(y*2.1 - t*0.5);
  // A slow bright band travelling up, like a badly locked signal.
  float bandy = fract(y*0.7 - t*0.06);
  lum += 0.30*exp(-pow((bandy-0.5)*5.0, 2.0));
  return c*lum;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 s = uv*2.0-1.0;
  float asp = u_resolution.x/u_resolution.y;
  s.x *= asp;
  // Glass curvature.
  vec2 cs = s*(1.0 + 0.055*dot(s,s));

  // NTSC chroma smear: the three phosphors read the signal at slightly
  // different horizontal delays, which fringes every edge.
  float sm = 0.012*(0.5+u_softness);
  vec3 a = signal(cs - vec2(sm,0.0));
  vec3 b = signal(cs);
  vec3 c = signal(cs + vec2(sm*0.6,0.0));

  // Phosphor stripes, tinted from the palette rather than pure RGB.
  float sx = gl_FragCoord.x/max(1.0, u_resolution.x/900.0);
  float stripe = mod(floor(sx/3.0), 3.0);
  vec3 tintA = normalize(pal(0.08)+0.02);
  vec3 tintB = normalize(pal(0.52)+0.02);
  vec3 tintC = normalize(pal(0.94)+0.02);
  vec3 tint = stripe<0.5 ? tintA : (stripe<1.5 ? tintB : tintC);
  vec3 lit  = stripe<0.5 ? a : (stripe<1.5 ? b : c);
  float luma = dot(lit, vec3(0.34,0.5,0.16));

  // Aperture-grille mask, softened so it glows instead of just dimming.
  vec3 col = mix(lit, tint*luma*1.55, 0.34);
  col *= 0.95;

  // Scanlines: 4px pitch, deep enough to read as a designed stripe. The pitch
  // is locked to device pixels so it can never beat against the image.
  float scan = 0.5+0.5*cos(gl_FragCoord.y*(6.2831853/4.0));
  col *= 0.34 + 0.90*scan*scan;

  // Rolling refresh seam.
  float roll = fract(uv.y*0.5 + u_time*0.11);
  col += pal(0.7)*0.10*exp(-pow((roll-0.5)*22.0,2.0));

  // Phosphor bloom pulled from the un-masked signal.
  col += b*b*0.28;

  // Tube: dark surround, vignette, faint interlace flicker.
  // Full-bleed: the curved glass only rounds the corners off, it does not crop
  // the picture down to a little screen floating in a black frame.
  float mask = smoothstep(1.52*asp, 1.38*asp, abs(cs.x))*smoothstep(1.56, 1.38, abs(cs.y));
  float vig = 1.0 - 0.20*dot(s*vec2(0.55,0.80), s*vec2(0.55,0.80));
  col = mix(u_back*0.40, col*max(vig,0.0), mask);
  // Grain rides the picture, so the black surround stays clean.
  float lum2 = dot(col, vec3(0.33));
  col += (hash12(gl_FragCoord.xy + floor(u_time*24.0))-0.5)*0.030*smoothstep(0.0,0.10,lum2);

  col = col/(1.0+col*0.55);
  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, u_saturation);
  fragColor = vec4(pow(clamp(col,0.0,1.0), vec3(1.0/2.2)), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-gfx-crt',
	description: 'CRT tube: palette-tinted phosphor stripes, chroma smear, rolling bar, curved glass',
	vertexShader,
	fragmentShader
});
