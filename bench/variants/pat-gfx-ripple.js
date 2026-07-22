import { makeSinglePassVariant } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Ripple tank. Four attenuating point sources interfere; the summed field is
// posterised into hard contour bands with a dark keyline, so the interference
// reads as a printed topographic separation rather than as water.
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

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);

  float t = u_time;
  float freq = max(u_folds,3.0)*0.95;

  float w = 0.0, amp = 0.0;
  for(int i=0;i<3;i++){
    float fi = float(i);
    float ph = fi*1.7;
    vec2 c = vec2(
      (0.34*asp)*sin(t*0.13 + ph*2.1) * (fi<2.0 ? 1.0 : -1.0),
      0.30*cos(t*0.11 + ph*1.3)
    );
    float d = length(p-c);
    float a = exp(-d*0.85)*(0.7+0.3*sin(t*0.27+ph));
    w += a*sin(d*freq - t*(1.5+0.22*fi) + ph);
    amp += a;
  }
  float v = 0.5 + 0.5*w/max(amp, 0.05);

  // Contour bands. Where the bands get finer than a pixel, fade the
  // posterisation back to the smooth field instead of aliasing.
  float bands = 3.0 + floor(u_ncols*0.6);
  float b = v*bands;
  float fw = fwidth(b);
  float crisp = 1.0 - smoothstep(0.30, 0.85, fw);

  float lo = floor(b);
  vec3 hard = pal(clamp(lo/(bands-1.0), 0.0, 1.0));
  vec3 soft = pal(clamp(v, 0.0, 1.0));
  vec3 col = mix(soft, hard, crisp);

  // Keyline between bands.
  float e = abs(fract(b)-0.5);
  float line = 1.0 - smoothstep(0.0, max(fw,1e-4)*1.1, 0.5-e);
  col = mix(col, u_shadow*0.6 + u_back*0.4, line*0.55*crisp);

  // Crest highlight so the travelling wavefronts have direction.
  col += pal(0.85)*0.20*smoothstep(0.86,1.0,v)*crisp;

  // Settle to the background at the frame edges.
  float vig = 1.0 - smoothstep(0.35, 1.05, length(p*vec2(0.66,1.05)));
  col = mix(u_back*0.9 + u_shadow*0.3, col, 0.30+0.70*vig);

  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, u_saturation);
  fragColor = vec4(pow(clamp(col,0.0,1.0), vec3(1.0/2.2)), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-gfx-ripple',
	description: 'wave interference posterised into hard contour bands with a printed keyline',
	vertexShader,
	fragmentShader
});
