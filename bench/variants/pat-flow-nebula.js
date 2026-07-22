import { makeSinglePassVariant } from '../lib/singlepass.js';
import { PRELUDE, vertexShader } from './pat-flow-aurora.js';

// Gas clouds with real depth: five parallax slabs composited front-to-back with
// absorption, each at its own scale, drift rate and point on the colour ramp.
// The occlusion between slabs is what stops it collapsing into one flat fbm.
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

  vec2 q = p*sc*0.70;

  vec3 col = mix(u_back, u_shadow, 0.55);
  float trans = 1.0;

  // Emission core: a soft, drifting bright region that the near slabs will
  // then partly occlude. Having a subject is what makes the depth legible.
  vec2 cc = vec2(0.40*sin(t*0.043), 0.20*cos(t*0.037));
  float core = exp(-length(p*2.2-cc)*2.2);
  col += palette(0.60)*core*0.40 + palette(0.92)*core*core*core*1.6;

  // One void field shared by every slab, so the empty regions line up through
  // the depth instead of each layer filling in the last one's gaps.
  float voidF = smoothstep(0.08, 0.80, 0.5+0.5*snoise(q*0.26 + vec2(t*0.020, -t*0.012)));

  // Back to front: the far slabs are laid down first and then occluded.
  for(int i=3;i>=0;i--){
    float fi = float(i);
    // i counts down from the back, so the far slab gets the coarsest features
    // and the near one the finest. Having it the other way round laid a big
    // soft blob over the whole frame and hazed everything out.
    float par = 1.95 - fi*0.42;
    vec2 s = q*par;
    s *= rot(fi*0.63);
    s += vec2(t*0.030*(0.4+fi*0.40), -t*0.018*(1.0+fi*0.5));

    // One warp step: enough for the ropy, curdled look of a gas cloud. No
    // thresholding — a smoothstep here cut hard-edged shards out of the gas.
    vec2 wv = vec2(snoise(s*0.85), snoise(s*0.85+vec2(4.1,2.7)));
    float d = 0.5+0.5*fbm3(s + 1.05*wv);
    // A hard gamma here is the whole difference between gas and milk: four
    // additive slabs at moderate density sum straight past white.
    // u_softness thins or thickens the gas by moving this gamma.
    d = pow(clamp(d,0.0,1.0), 3.6/clamp(u_softness,0.4,2.2));

    // Dust: a smooth, large-scale absorption field, not a ridged one.
    float dust = 0.5+0.5*snoise(s*0.40+vec2(9.1,3.3));
    dust *= dust;

    float dens = d*(0.30 + fi*0.11)*(0.10+1.15*dust)*(0.12+1.15*voidF);
    // Far slabs sit at the cool end, near slabs at the warm end, so depth and
    // colour temperature agree instead of striping.
    vec3 c = palette(clamp(0.08 + (3.0-fi)*0.21 + d*0.28, 0.0, 1.0));

    col += c*dens*trans*2.0;
    trans *= 1.0 - clamp(dens,0.0,1.0)*0.70;
  }

  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.30;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-nebula',
	description: 'layered gas clouds: four parallax slabs with absorption, dust voids and a drifting emission core',
	vertexShader,
	fragmentShader
});
