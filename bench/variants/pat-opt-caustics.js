// Water caustics: the sharp bright filament network cast on a pool floor, with
// a slow swell warping it and a touch of chromatic spread in the hot cores.
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
// Universal 0..1 morph axis. 0 is the resting form (unchanged from before this
// existed); 1 is the same water, seen differently: the fine dappled net drawn
// out into broad vertical light shafts with heavy chromatic fringing.
uniform float u_morph;

out vec4 fragColor;

const float TAU = 6.28318530718;

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

// The classic iterated-refraction caustic: five passes of a self-referential
// warp, each contributing an inverse-distance spike. The reciprocal is what
// makes the filaments thin and hot rather than blobby like fbm. A high final
// exponent is what keeps the network sparse instead of milky.
float caustic(vec2 uv, float t, float inten, float sharp){
  vec2 p = mod(uv*TAU, TAU) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for(int n=0; n<5; n++){
    float tt = t * (1.0 - 3.5/(float(n)+1.0));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0/length(vec2(p.x/(sin(i.x+tt)/inten), p.y/(cos(i.y+tt)/inten)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), sharp);
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);

  float m = clamp(u_morph, 0.0, 1.0);

  // u_folds is the zoom: bigger value -> bigger cells (same direction as the
  // fold shader's 29.16/u_folds), and u_rotation orients the net. Deliberately
  // low overall: at higher frequencies the network stops reading as separate
  // filaments and turns into a uniform milky texture.
  float zoom = 0.45 + 5.4/max(u_folds,1.0);
  vec2 p = q*rot(radians(u_rotation))*zoom;

  // Morph coefficients. They are declared with the values the shader has always
  // used and only rewritten when m>0, so morph=0 leaves the arithmetic below
  // byte-for-byte the expression that shipped — no reassociated multiply, no
  // 1-ulp drift through the reciprocal in caustic(), which is sharp enough to
  // turn one into a visible pixel. Every rewrite is a mix() anchored on that
  // same original value, so the branch's effect starts at exactly zero and
  // grows continuously; nothing here can pop.
  float swellAmp = 0.045;
  float sharp    = 15.0 + 3.0/max(u_softness, 0.25);
  // Dispersion: three slightly different refractive scales, so the hot cores
  // fringe apart into colour the way real caustic edges do.
  float disp     = 0.0045*(0.5 + u_ribbonWidth);
  float inten    = 0.0050;
  float deepI    = 0.0075;
  float deepS    = 7.0;
  if (m > 0.0) {
    // Squash the frame vertically, which draws the cells out into standing
    // columns; done before the rotation so the shafts stay aligned with the
    // surface overhead rather than with the pattern's orientation.
    // The frame is squashed hard in y and stretched slightly in x, so the cells
    // draw out into tall shafts without the whole field dropping in frequency —
    // dropping the frequency here was tried and it turns the net milky, which
    // is the one failure mode this pattern has.
    p = vec2(q.x, q.y*mix(1.0, 0.20, m))*rot(radians(u_rotation))*(zoom*mix(1.0, 1.30, m));
    swellAmp = mix(0.045, 0.13, m);
    // Only a slight softening: the filaments must stay filaments, or the dark
    // water between them fills in and there is nothing left to look at.
    sharp    = sharp*mix(1.0, 0.86, m);
    inten    = mix(0.0050, 0.0068, m);
    // Widening the dispersion is what keeps the drawn-out shafts chromatic
    // rather than three coincident white lines.
    disp     = disp*mix(1.0, 4.5, m);
    deepI    = mix(0.0075, 0.0092, m);
    deepS    = mix(7.0, 6.0, m);
  }

  // A long, slow swell so the whole net breathes instead of only shimmering;
  // at full morph it is the thing that bends the shafts.
  float swell = sin(p.x*2.1 - u_time*0.21) * cos(p.y*1.7 + u_time*0.17);
  p += vec2(swell, swell*0.6)*swellAmp;

  float t = u_time*0.40 + 12.0;
  float cr = caustic(p*(1.0+disp), t, inten, sharp);
  float cg = caustic(p,            t, inten, sharp);
  float cb = caustic(p*(1.0-disp), t, inten, sharp);

  vec3 net = vec3(cr, cg, cb);
  float lum = max(max(cr,cg),cb);

  // A second, much dimmer net further down: depth without a cost spike,
  // because it is the same field at a different scale and phase.
  float deep = caustic(p*0.55 + vec2(3.1,1.7), t*0.5, deepI, deepS);

  // Water body: near-black at the bottom of frame, opening up toward the light.
  float depth = smoothstep(-0.62, 0.55, q.y + 0.16*sin(q.x*1.6 + u_time*0.15));
  vec3 deepC = mix(u_shadow*0.35, u_colors[0].rgb*0.10, 0.5);
  vec3 nearC = mix(u_back*0.8, u_colors[1].rgb*0.20, 0.75);
  vec3 col = mix(deepC, nearC, depth);

  // Broad, very soft pool of scattered light so the dark half is not dead.
  float glow = 0.5 + 0.5*sin(p.x*1.1 + u_time*0.12)*cos(p.y*0.9 - u_time*0.10);
  col += mix(u_colors[1].rgb, u_colors[2].rgb, glow)*0.030*depth;

  col += palette(0.60)*deep*0.18;

  // Filaments. Core saturates to near-white, shoulder keeps the dispersed tint.
  vec3 fil = mix(palette(0.28), palette(0.50), clamp(lum*1.5, 0.0, 1.0));
  if (m > 0.0) {
    // A shaft covers more of the frame than a hairline did, so both additive
    // terms come down a little to hold the exposure and keep the water dark.
    // Same reasoning as above for the branch: at m=0 the original constants run.
    col += fil * net * mix(1.45, 1.20, m);
    col += vec3(1.0,0.98,0.94) * pow(clamp(lum,0.0,1.0), mix(2.6, 3.0, m)) * mix(0.85, 0.62, m);
  } else {
    col += fil * net * 1.45;
    col += vec3(1.0,0.98,0.94) * pow(clamp(lum,0.0,1.0), 2.6) * 0.85;
  }

  // Vignette keeps text legible in the corners.
  col *= 1.0 - dot(q,q)*0.50;

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
	name: 'pat-opt-caustics',
	description: 'water caustics — sharp dispersed filament net over a depth-graded pool',
	vertexShader,
	fragmentShader
});
