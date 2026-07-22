import { makeSinglePassVariant } from '../lib/singlepass.js';
import { PRELUDE, vertexShader } from './pat-flow-aurora.js';

// Ink dropped into water: a smooth concentration field pushed through three
// successively finer domain warps, which is what turns a round blob into
// feathered tendrils. A slow vortex underneath keeps the whole mass turning.
export const fragmentShader =
	PRELUDE +
	/* glsl */ `
void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  p *= rot(radians(u_rotation));
  float sc = 9.0/max(u_folds,1.0);
  float t = u_time;
  // morph: one diffusion front (0) -> the same dye stratified into nested
  // concentration shells, ink read as agate banding (1).
  float mo = clamp(u_morph, 0.0, 1.0);

  vec2 q = p*sc*1.05;

  // Gentle vortex: rotation rate falls off with radius, so the middle of the
  // frame shears against its surroundings instead of spinning rigidly.
  // Winds and unwinds rather than accumulating: a monotonic t here would keep
  // twisting the middle of the frame forever and eventually alias into mush.
  float r = length(q);
  q *= rot(1.35*sin(t*0.055)/(0.55+r*r*0.55));

  // Turbulent warp, coarse to fine. Each level rides on the previous one.
  vec2 w = q;
  w += 0.50*vec2(snoise(q*0.80 + vec2(t*0.045,0.0)),
                 snoise(q*0.80 + vec2(5.2,1.3) - vec2(0.0,t*0.038)));
  w += 0.24*vec2(snoise(w*2.0 + vec2(0.0,t*0.085)),
                 snoise(w*2.0 + vec2(3.7,8.1)));
  // Morph gain multiplies the inner vector, not the 0.10 literal, so at mo=0 it
  // is a multiply by exactly 1.0 and the outer expression is unchanged.
  w += 0.10*(vec2(snoise(w*4.4 - vec2(t*0.12,0.0)),
                  snoise(w*4.4 + vec2(1.1,6.6)))*mix(1.0,1.70,mo));

  // Concentration. The threshold makes a diffusion front rather than a haze,
  // and sits high enough that most of the tank is still clear water.
  float raw = 0.5+0.5*snoise(w*0.55);
  // A wide front, not a hard edge: ink bleeds, it does not get cut out.
  // u_softness controls how far the dye has bled: the width of the front.
  float c   = smoothstep(0.46 - 0.12*(clamp(u_softness,0.3,2.5)-1.0), 0.95, raw);
  // Morph reshapes the transfer function applied to raw rather than blending
  // in a second field, so every contour of the dye stays exactly where it was
  // and the single front simply splits into a stack of shells. cos() keeps it
  // periodic without a fract()/floor() edge to pop on.
  float shells = smoothstep(0.30, 0.92, 0.5-0.5*cos(6.2831*(raw*3.1+0.12)))
               * smoothstep(0.16, 0.52, raw);
  // Written as an additive delta rather than mix(c,shells,mo): at mo=0 this is
  // an add of exactly 0.0 in a statement of its own, which leaves the code that
  // produced c untouched and keeps mo=0 bit-identical to the pre-morph shader.
  c += mo*(shells - c);
  // Finer secondary dye, only visible inside the main mass.
  float c2  = 0.5+0.5*snoise(w*1.45 + vec2(2.4,7.1));
  // Fine wisps. Without this the concentration contours come out as smooth
  // concentric bands and the whole thing reads as poured enamel, not dye.
  float wisp = 0.5+0.5*snoise(w*3.4 + vec2(0.0, t*0.06));
  float dens = clamp(c*(0.55+0.60*c2)*(0.70+0.55*wisp), 0.0, 1.0);

  // Filament edges: the gradient of the concentration lights up the fronts.
  float rim = length(vec2(dFdx(dens), dFdy(dens)))*u_resolution.y*0.035;
  rim = clamp(rim,0.0,1.0);

  // Depth: a faint, much larger and slower second cloud behind everything.
  float back = smoothstep(0.45,1.0, 0.5+0.5*snoise(w*0.24 - vec2(t*0.02,0.0)));

  // The diffuse halo: dye that has already spread out past the visible mass.
  float halo = smoothstep(0.26, 0.80, raw);

  vec3 col = mix(u_back, u_shadow, back*0.9);
  col += palette(0.08)*back*0.12;
  col += palette(clamp(0.16+halo*0.18,0.0,1.0))*halo*halo*0.075;
  col = mix(col, palette(clamp(0.20 + dens*0.44 + c2*0.12, 0.0, 1.0))*0.52, smoothstep(0.02,0.90,dens));
  // Fronts get a soft lift, not a specular rim; the glossy version read as
  // enamel rather than as dye.
  col += palette(clamp(0.45+dens*0.30,0.0,1.0))*rim*dens*0.22;
  col += palette(0.90)*pow(clamp(dens-0.72,0.0,1.0),1.3)*0.75;  // hot cores

  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.28;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-ink',
	description: 'ink diffusing in water: thresholded concentration fronts with feathered tendrils and a slow vortex',
	vertexShader,
	fragmentShader
});
