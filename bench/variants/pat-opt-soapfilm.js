// Soap film. Thin-film interference where the thickness is not random noise
// but *ordered*: gravity drains the film so it thins toward the top, and slow
// convection marbles that gradient into swirls. Because thickness is monotonic
// underneath the swirl, the interference orders come out as clean nested bands
// instead of the confetti a pure-noise thickness field produces — that failure
// mode is the whole reason this design is built around a drainage gradient.
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
// Universal 0..1 morph axis. 0 is the resting form: a flat film draining top to
// bottom, so the interference orders lie in horizontal-ish bands. 1 re-points
// the drainage outward from the centre, i.e. the same film blown into a dome,
// and the orders become nested rings closing on a black rim.
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

vec3 spectral(float x){
  x = clamp(x, 0.0, 1.0);
  return clamp(vec3(
    smoothstep(0.38, 0.66, x) - 0.5*smoothstep(0.92, 1.0, x) + 0.30*smoothstep(0.12, 0.0, x),
    smoothstep(0.20, 0.50, x)*smoothstep(1.0, 0.60, x)*1.4,
    smoothstep(0.46, 0.10, x)
  ), 0.0, 1.0);
}

float hash21(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}
const mat2 m2 = mat2(0.80,-0.60,0.60,0.80);
// Two octaves. Thickness detail finer than one band spacing is exactly what
// turns interference colour grey, so the field is kept deliberately smooth.
float fbm(vec2 p){
  float f = 0.62*vnoise(p); p = m2*p*2.05;
  f += 0.31*vnoise(p);
  return f/0.93;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 q = vec2((uv.x-0.5)*asp, uv.y-0.5);
  vec2 p = q*rot(radians(u_rotation)*0.25)*(1.7 + 21.0/max(u_folds,1.0));

  float t = u_time;

  // Convection: a domain warp that stirs the drainage gradient into marbling.
  // Two warp terms at different rates keep it from ever repeating visibly.
  vec2 w1 = vec2(fbm(p*0.42 + vec2(t*0.031, -t*0.019)),
                 fbm(p*0.42 + vec2(5.7 - t*0.024, 2.1 + t*0.017)));
  vec2 pw = p + (w1 - 0.5)*2.6;
  float swirl = fbm(pw*0.55 + vec2(-t*0.014, t*0.021));

  float m = clamp(u_morph, 0.0, 1.0);

  // Drainage: the film is thinnest at the top of frame and pools at the bottom.
  // The morph rotates that gradient from linear-in-y to radial-out-from-centre,
  // which is the same physics on a dome instead of a flat pane. Both fields are
  // monotonic, so their blend is monotonic too and the bands sweep round
  // continuously instead of re-sorting themselves.
  float drainFlat = 0.62 - 0.78*(uv.y - 0.5);
  float rr = length(vec2(q.x*0.86, q.y*1.30));
  float drainDome = 1.32 - 1.14*rr;
  float drain = mix(drainFlat, drainDome, m);
  // Swirl is eased back as the dome forms: the convective marbling is what
  // gives the flat film its character, but at ring scale it only smears the
  // orders together.
  float thick = clamp(drain + mix(1.05, 0.52, m)*(swirl - 0.45), 0.0, 2.4);

  // Slope -> viewing angle. Tilting shortens the path through the film, which
  // is what slides the bands as the surface moves.
  float e = 0.05;
  float hx = fbm((pw+vec2(e,0.0))*0.55) - fbm((pw-vec2(e,0.0))*0.55);
  float hy = fbm((pw+vec2(0.0,e))*0.55) - fbm((pw-vec2(0.0,e))*0.55);
  vec2 g = vec2(hx, hy)/(2.0*e);
  vec3 N = normalize(vec3(-g*0.30, 1.0));
  vec3 V = normalize(vec3(q*0.60, 1.0));
  float cosT = clamp(dot(N, V), 0.15, 1.0);

  // Optical path difference. Three-ish orders: enough for nested bands, few
  // enough that neighbouring orders never beat against each other.
  float opd = thick*(1.35 + 0.70*u_ribbonWidth)*cosT;

  // Colour by interference ORDER rather than by integrating wavelengths.
  // Averaging seven spectral samples is a desaturating operation, and with a
  // wide palette the averages land on muddy purples; mapping the order
  // directly onto the palette ramp keeps every band a clean palette colour
  // while still cycling with thickness exactly as a real film does.
  float order = opd*mix(0.85, 1.30, m);
  // Triangle wave, not fract: a sawtooth wraps 1->0 and leaves a hard seam
  // across the image at every order boundary.
  float hu = abs(fract(order)*2.0 - 1.0);
  // Restricted to a window of the ramp. Sweeping the full ramp puts its two
  // extremes side by side in every band pair, which reads as a heat map; a
  // narrow hue range is what makes iridescence look expensive.
  float hw = 0.14 + 0.50*hu;
  vec3 band = mix(palette(hw), spectral(hw), 0.20);

  // Antialias: where the bands are packed tighter than a pixel, fade to the
  // ramp's average instead of letting them alias into noise.
  float dens = fwidth(order);
  band = mix(palette(0.38)*0.9, band, smoothstep(0.55, 0.12, dens));

  // Visibility: contrast is highest at low order and washes out as the film
  // thickens, which is what gives a real film its pale, high-order centre.
  float vis = 0.45 + 0.55*exp(-order*0.30);
  vec3 film = band*vis;

  // The black film: below a quarter wavelength every colour cancels, so the
  // thinnest region goes genuinely black just before it would burst. This is
  // the detail that makes it read as a soap film rather than as a gradient.
  float black = smoothstep(0.0, 0.16, thick);
  film *= black;

  // Fresnel — the colour is a reflection, so it strengthens toward grazing.
  float fres = 0.45 + 0.75*pow(1.0 - cosT, 2.0);

  // A large-scale envelope: the film is only lit where the surrounding room
  // is reflected in it. Without this the frame is wall-to-wall colour and no
  // text will survive on top of it.
  // The floor lifts with the morph so the ring family reads as one continuous
  // dome rather than a few arcs picked out of the dark.
  float lit = mix(0.10, 0.40, m) + mix(0.90, 0.62, m)*smoothstep(0.20, 0.78, fbm(p*0.22 + vec2(t*0.012, 0.0)));

  vec3 col = mix(u_back*0.5, u_shadow*0.8, smoothstep(0.15, 0.85, swirl));
  col += film*fres*lit*0.70;

  // Specular: a broad soft source reflected in the film surface.
  vec3 L = normalize(vec3(-0.35, 0.62, 0.70));
  float spec = pow(clamp(dot(N, normalize(L+V)), 0.0, 1.0), 34.0/max(u_softness,0.3));
  col += mix(palette(0.55), vec3(1.0), 0.55)*spec*0.75*black*lit;

  col *= 1.0 - dot(q,q)*0.40;

  col = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14), 0.0, 1.0);
  col = pow(col, vec3(1.0/2.2));
  float luma = dot(col, vec3(0.2126,0.7152,0.0722));
  // Integrating seven wavelengths is inherently a desaturating operation, so
  // the film gets a little chroma back.
  col = clamp(mix(vec3(luma), col, u_saturation*0.95), 0.0, 1.0);
  float lvl = mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col += (bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col = floor(col*lvl+0.5)/lvl;
  fragColor = vec4(col, 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-opt-soapfilm',
	description: 'soap-film iridescence — drainage-ordered interference bands, marbled by convection',
	vertexShader,
	fragmentShader
});
