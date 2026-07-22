import { makeSinglePassVariant } from '../lib/singlepass.js';
import { PRELUDE, vertexShader } from './pat-flow-aurora.js';

// Liquid-light plasma. An iterated inversion fold (abs(z)/dot(z,z) - c) draws
// glowing filaments; feeding it a noise-warped coordinate and drifting `c`
// keeps them organic and slowly writhing instead of crystalline.
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

  vec2 q = p*sc*1.25;
  // Pre-warp: without this the fold is too regular to read as fluid.
  q += 0.52*vec2(fbm2(q*0.65 + vec2(t*0.05,0.0)),
                 fbm2(q*0.65 + vec2(4.7,2.1) - vec2(0.0,t*0.04)));

  vec2 c = vec2(0.86 + 0.10*sin(t*0.13), 0.60 + 0.10*cos(t*0.107));
  mat2 spin = rot(0.21 + 0.05*sin(t*0.09));

  vec2 z = q*0.9;
  float glow = 0.0;
  float shell = 0.0;
  float minD = 1e5;
  for(int i=0;i<5;i++){
    float fi = float(i);
    z = abs(z)/clamp(dot(z,z), 0.06, 12.0) - c;
    z *= spin;
    float d = length(z);
    minD = min(minD, d);
    // Late folds carry the fine fractal speckle; weighting them down keeps the
    // arcs smooth instead of crusty.
    float wt = 1.0 - fi/5.0;
    // Thin bright surfaces at a fixed radius in each fold's frame. Narrow on
    // purpose: a wide falloff fills the frame with milk.
    shell += exp(-abs(d-0.80)*13.0/clamp(u_softness,0.3,2.5))*wt;
    glow  += exp(-d*2.6)*wt;
  }
  shell /= 2.8;
  glow  /= 2.8;

  float core = exp(-minD*3.2);

  // Slow large-scale brightness field. The arcs only fire in a few drifting
  // regions; everywhere else stays near-black.
  float mask = smoothstep(0.12, 0.86, 0.5+0.5*snoise(q*0.30 + vec2(t*0.045, -t*0.03)));
  mask = 0.30 + 0.80*mask;

  float lum = (shell*0.95 + glow*0.30)*mask;

  // Walk a wide span of the ramp: driven only by the (small) glow term the
  // whole frame sat in one colour and the palette never showed.
  vec3 tint = palette(clamp(0.12 + glow*1.60 + shell*0.55, 0.0, 1.0));
  vec3 col = mix(u_back, u_shadow, smoothstep(0.0,0.14,lum));
  col = mix(col, tint*0.95, smoothstep(0.03,0.42,lum));
  // Arc cores burn out to the hot end of the ramp.
  col += palette(clamp(0.72+core*0.28,0.0,1.0))*pow(clamp(shell*mask,0.0,1.0),1.5)*0.85;
  col += palette(0.10)*glow*mask*0.30;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.32;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-veins',
	description: 'liquid-light plasma: iterated inversion folds drawing glowing writhing filaments',
	vertexShader,
	fragmentShader
});
