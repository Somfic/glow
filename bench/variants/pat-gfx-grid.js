import { makeSinglePassVariant } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Vaporwave: a perspective floor grid running to a hard horizon, a slitted sun
// disc above it, everything inked from the palette. The grid lines are drawn
// with a derivative-aware width so they stay one pixel wide at any depth and
// dissolve into a flat haze exactly where the cells get finer than a pixel —
// which is the whole moire problem with perspective grids, solved.
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

// One grid axis. Returns ink coverage: constant pixel width near the camera,
// fading to zero (not aliasing) once a cell is smaller than a pixel.
float axis(float c, float thick){
  float fw = max(fwidth(c), 1e-5);
  float d  = abs(fract(c) - 0.5);      // 0 at cell centre, 0.5 at the line
  float cov = 1.0 - smoothstep(0.0, 1.0, (0.5 - d)/fw - thick);
  return cov * smoothstep(0.62, 0.22, fw);
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);

  float t = u_time;
  float horizon = -0.045 + 0.010*sin(t*0.17);   // camera breathing
  float pan = (u_rotation/180.0 - 0.5)*0.55;

  vec3 col;

  if(p.y > horizon){
    // ---- sky ----
    float h = (p.y - horizon)/(0.5 - horizon);
    col = mix(pal(0.55), u_back*0.92 + pal(0.60)*0.10, smoothstep(0.0,1.0,h));
    col = mix(col, pal(0.30), 0.40*smoothstep(0.50,0.0,h));

    // Sun disc, sitting on the horizon.
    vec2 sp = vec2(p.x - pan*0.25, p.y - horizon - 0.045 + 0.012*sin(t*0.31));
    float r = length(sp*vec2(1.0,1.0));
    float R = 0.235;
    float edge = 1.0 - smoothstep(R-0.004, R+0.004, r);
    // Vertical ramp through the palette, top hot.
    float sy = clamp((sp.y + R)/(2.0*R), 0.0, 1.0);
    vec3 sun = pal(0.30 + 0.68*sy);
    // Retro slits: gaps that get taller toward the bottom of the disc.
    // Slits: gaps that open up toward the bottom of the disc. Pitch is fixed in
    // pixels-ish terms so they read as bands, never as aliasing.
    float slitCoord = (sp.y - t*0.010)*34.0;
    float duty = smoothstep(0.78, 0.02, sy);           // 0 at top, 1 at bottom
    float sl = abs(fract(slitCoord)-0.5)*2.0;
    float slitFw = max(fwidth(slitCoord)*2.2, 0.06);
    float cut = smoothstep(duty-slitFw, duty+slitFw, sl);
    sun = mix(sun, sun*0.06 + pal(0.05)*0.10, (1.0-cut)*smoothstep(0.0,0.10,duty));
    col = mix(col, sun*1.15, edge);

    // Glow around the disc and a bloom that hugs the horizon near the sun.
    col += pal(0.75)*0.30*exp(-max(r-R,0.0)*9.0)*(1.0-edge);
    float near = exp(-abs(p.x - pan*0.25)*1.9);
    col += pal(0.85)*0.34*exp(-abs(p.y-horizon)*70.0)*(0.20+0.80*near);

    // Sky scanlines, wide and soft: a designed texture, not screen dirt.
    float sc = 0.5+0.5*cos(gl_FragCoord.y*(6.2831853/4.0));
    col *= 0.94 + 0.06*sc;
  } else {
    // ---- floor ----
    float dy = horizon - p.y;                   // > 0 below the horizon
    float z  = 0.42/max(dy, 1e-4);              // depth
    float g  = max(u_folds, 3.0)*0.30;
    float fx = (p.x + pan*dy*2.0)*z*g;
    float fz = (z - t*0.85)*g*0.75;

    vec3 floorBase = mix(u_shadow, u_back, 0.35)*0.55;
    // Depth haze at the horizon, but only where the sun actually lights it —
    // a full-width bar of hot ink across the frame reads as a mistake.
    float depthFade = smoothstep(0.0, 0.07, dy);
    float lit = exp(-abs(p.x - pan*0.25)*1.9);
    col = mix(mix(floorBase, pal(0.80)*0.55, 0.18+0.82*lit), floorBase, depthFade);

    float lx = axis(fx, 1.1);
    float lz = axis(fz, 1.3);
    float ink = clamp(lx + lz, 0.0, 1.0);
    vec3 lineCol = mix(pal(0.92), pal(0.45), smoothstep(0.0,0.35,dy));
    col = mix(col, lineCol*1.25, ink*(0.35 + 0.65*(1.0-depthFade*0.55)));

    // Wet-floor reflection of the sun.
    float refl = exp(-abs(p.x - pan*0.25)*3.2) * exp(-dy*7.0);
    col += pal(0.72)*0.55*refl;
    col += pal(0.85)*0.34*exp(-dy*70.0)*(0.20+0.80*exp(-abs(p.x - pan*0.25)*1.9));
  }

  // Corner falloff so text at the edges keeps contrast.
  col *= 1.0 - 0.28*dot(p*vec2(0.50,0.92), p*vec2(0.50,0.92));
  // Haze: u_softness pulls the whole frame toward the sky colour.
  col = mix(col, col*0.85 + u_back*0.5, clamp((u_softness-1.0)*0.4, 0.0, 0.5));

  col = col/(1.0+col*0.30);
  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, u_saturation);
  fragColor = vec4(pow(clamp(col,0.0,1.0), vec3(1.0/2.2)), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-gfx-grid',
	description: 'vaporwave: perspective floor grid, slitted sun disc, horizon bloom, all palette-inked',
	vertexShader,
	fragmentShader
});
