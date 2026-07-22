import { makeSinglePassVariant } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Shared GLSL prelude for the pat-flow-* family (uniform block, palette,
// simplex noise, fbm, house output chain). Re-exported so the sibling flow
// variants do not each carry a copy.
export const PRELUDE = /* glsl */ `#version 300 es
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
// Universal 0..1 morph axis. 0 is the pattern's resting form (bit-identical to
// the pre-morph shader), 1 is a distinctly different but same-family form.
// Every use of it must be a mix/lerp — no floor(), threshold or branch on it,
// or an animated sweep will pop.
uniform float u_morph;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}
// Seamless ping-pong version, for anything that cycles the ramp.
vec3 paletteLoop(float x){ return palette(abs(fract(x*0.5)*2.0-1.0)); }

vec3 mod289(vec3 x){ return x-floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x-floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

// Standard 2D simplex noise, range ~[-1,1]. Pure ALU: no hash texture, and
// cheaper per unit of visual detail than 4x hash12 value noise.
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

const mat2 M2=mat2(0.80,-0.60,0.60,0.80);
float fbm2(vec2 p){ float f=0.60*snoise(p); p=M2*p*2.03; f+=0.30*snoise(p); return f/0.90; }
float fbm3(vec2 p){ float f=0.55*snoise(p); p=M2*p*2.02; f+=0.27*snoise(p); p=M2*p*2.05; f+=0.13*snoise(p); return f/0.95; }

float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

// House-style output chain: ACES-ish tonemap, gamma, saturation, dither.
vec3 finish(vec3 col){
  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation),0.0,1.0);
  float lvl=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  return floor(col*lvl+0.5)/lvl;
}
`;

export const fragmentShader =
	PRELUDE +
	/* glsl */ `
void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  // Aurora wants to stay roughly upright, so rotation only leans the curtains.
  p *= rot(radians(u_rotation)*0.22);
  float sc = 9.0/max(u_folds,1.0);
  float t = u_time;
  // morph: hanging curtains (0) -> corona, the rays converging on a point above
  // the frame and the whole sky filling with them (1).
  float mo = clamp(u_morph, 0.0, 1.0);

  // Sky: dark at the top, faint shadow-tinted airglow toward the horizon.
  vec3 col = mix(u_shadow*1.05, u_back, smoothstep(-0.50, 0.60, p.y));

  float glowAcc = 0.0;
  for(int i=0;i<3;i++){
    float fi = float(i);
    float depth = 1.0 - fi*0.28;            // further curtains are dimmer/smaller
    vec2 q = p*sc/ (0.90 + fi*0.38);
    // Perspective fan. Stretching the lateral coordinate proportionally to
    // height turns the lines of constant curtain-coordinate from vertical into
    // a pencil of lines meeting at q.y = 1/(0.48*mo) — off the top of the frame
    // even at mo=1, so it reads as looking up toward the magnetic zenith rather
    // than as a pinched knot. Continuous in mo (mo=0 is a divide by exactly 1)
    // and the clamp keeps the denominator away from zero at any aspect.
    q.x *= 1.0/(1.0 - mo*0.48*clamp(q.y, -1.4, 1.4));
    q.x += fi*3.7 - t*0.030*(1.0+fi*0.6);   // lateral drift, each layer at its own rate

    // Sideways meander of the curtain sheet.
    float xw = q.x + 0.85*snoise(vec2(q.x*0.42, t*0.090 + fi*5.0))
                   + 0.28*snoise(vec2(q.x*1.30 + fi*2.0, t*0.150));

    // Curtain ribbons: thin bright bands on the zero-contours of a 1D field.
    float cur  = fbm2(vec2(xw*0.95 + fi*11.0, t*0.050));
    // u_softness widens the curtain from a hard blade to a broad wash.
    float band = exp(-abs(cur)*mix(8.0,11.5,mo)/clamp(u_softness,0.3,2.5));
    // Gate whole stretches of the sky to nothing. Without this the curtains
    // tile the full width and the frame has no rest. The corona opens the gate
    // up: a full-sky display leaves much less of the sky dark.
    band *= smoothstep(mix(0.10,-0.18,mo), mix(0.62,0.42,mo), 0.5+0.5*snoise(vec2(xw*0.26 - t*0.035, fi*7.0)));

    // Vertical rays, the fine striation that makes an aurora read as an aurora.
    float ray = 0.34 + 0.66*(0.5+0.5*snoise(vec2(xw*5.5, q.y*0.50 - t*0.24 + fi*3.0)));
    ray *= 0.62 + 0.38*(0.5+0.5*snoise(vec2(xw*15.0, q.y*0.26 - t*0.42)));

    // Height profile: crisp lower edge, long exponential fade upward. The
    // corona drops the foot below the frame and stretches the fade, so the rays
    // run the full height instead of hanging off a horizon line.
    float base = mix(-0.48,-0.95,mo) + 0.14*snoise(vec2(xw*0.6 + fi*2.0, t*0.075));
    float hh   = q.y - base;
    float prof = smoothstep(-0.02, mix(0.12,0.42,mo), hh) * exp(-max(hh,0.0)*mix(2.35,0.80,mo));

    // Longer rays over more of the sky is more total light; pull the gain back
    // so the corona is a different shape, not just a brighter frame.
    float inten = band*ray*prof*depth*mix(1.0,0.72,mo);
    // Colour walks up the ramp with altitude: cool at the foot, hot at the tips.
    col += palette(clamp(0.16 + hh*mix(0.80,0.40,mo) + fi*0.05, 0.0, 1.0)) * inten * 1.45;
    // A wide, ray-free halo so the curtains sit in their own light.
    glowAcc += band*prof*depth*0.25;
  }

  col += palette(0.40)*glowAcc*0.45;

  // Faint horizon bloom picking up the palette's low end.
  col += palette(0.06)*exp(-max(p.y+0.46,0.0)*5.0)*0.16;

  // Very slight vignette so text sits on a calmer frame edge.
  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.30;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-aurora',
	description: 'northern-lights curtains: meandering ribbons with vertical rays and a crisp lower edge',
	vertexShader,
	fragmentShader
});
