import { makeSinglePassVariant } from '../lib/singlepass.js';
import { PRELUDE, vertexShader } from './pat-flow-aurora.js';

// Line-integral-convolution style streamlines: every pixel walks a short way
// forward and backward along a noise-driven direction field, averaging a fine
// "dye" texture as it goes. Smearing dye along the flow is what turns grain
// into silk.
export const fragmentShader =
	PRELUDE +
	/* glsl */ `
// Direction field. A single angle from noise rather than a true curl, which
// looks the same at this scale for a third of the cost.
// morph damps the angle field toward a single direction while stretching its
// wavelength: turbulence relaxing into laminar flow. Interpolating the *angle*
// (a plain continuous float field, never a wrapped one) rather than blending
// two direction vectors is what keeps this pop-free — blended vectors go
// degenerate wherever the two fields point opposite ways.
vec2 flowDir(vec2 p, float t, float mo){
  // Both knobs are applied as multiplies by exactly 1.0 at mo=0 — the frequency
  // onto p before the untouched literal, the damping onto the finished angle —
  // so the mo=0 arithmetic is the original expression unchanged.
  vec2 pf = p*mix(1.0,0.52,mo);
  float a = 3.14159*( snoise(pf*0.55 + vec2(0.0, t*0.045))
                    + 0.45*snoise(pf*1.45 - vec2(t*0.030, 0.0)) );
  a *= mix(1.0,0.38,mo);
  return vec2(cos(a), sin(a));
}

// Dye frequency has to stay low relative to the tap spacing of the walk below.
// At 7.5 the 13 taps aliased against the dye and produced a crosshatch moire
// instead of a smear; the whole look depends on oversampling the dye.
// A laminar walk is combed further per tap (see the walk step in main), so the
// dye has to coarsen with it or the taps undersample it and the silk turns into
// a blotchy moire — which is exactly what a longer step alone produced. Keeping
// (1/freq)/step at ~3.3 across the whole morph range is the constraint.
float dye(vec2 p, float t, float mo){
  return 0.5+0.5*snoise(p*mix(1.0,0.80,mo)*3.0 + vec2(t*0.22, -t*0.13));
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  p *= rot(radians(u_rotation));
  float sc = 9.0/max(u_folds,1.0);
  float t = u_time;
  // morph: turbulent curl (0) -> combed laminar satin, long parallel streaks
  // running along the u_rotation axis (1).
  float mo = clamp(u_morph, 0.0, 1.0);

  vec2 q = p*sc*1.15;

  const int N = 14;
  // u_softness sets how far the dye is smeared, i.e. how silky the streaks get.
  // Laminar flow can be combed much further before the walk curls back on
  // itself, and the long smear is most of what sells the change of state.
  float step = 0.100*clamp(u_softness,0.4,2.0)*mix(1.0,1.30,mo);
  vec2 f = q, b = q;
  float acc = 0.0, wsum = 0.0;
  vec2 dSum = vec2(0.0);
  for(int i=0;i<N;i++){
    float w = 1.0 - float(i)/float(N);
    vec2 df = flowDir(f,t,mo); vec2 db = flowDir(b,t,mo);
    dSum += df;
    f += df*step;
    b -= db*step;
    acc += (dye(f,t,mo)+dye(b,t,mo))*w;
    wsum += 2.0*w;
  }
  acc /= wsum;

  // The average along a streamline is low-variance; stretch it back out.
  // A straight walk averages more dye periods than a curled one, so the laminar
  // end comes back flatter; give it a little more stretch to compensate.
  float streak = clamp((acc-0.5)*3.0*mix(1.0,1.17,mo)+0.5, 0.0, 1.0);

  // Coherence: where the walk stayed straight the streak is a long clean line,
  // where it curled tightly it is a knot. That difference is the composition.
  float coh = length(dSum)/float(N);

  // Local flow orientation nudges hue, so the palette tracks direction. Kept to
  // a narrow slice of the ramp: a full sweep turns the frame into hard red/blue
  // patchwork rather than one flowing material.
  // NB: atan(y,x) is *not* usable here — its branch cut at +/-pi draws a hard
  // seam straight across the image. Project the direction onto a fixed axis
  // instead, which is continuous everywhere.
  vec2 d0 = flowDir(q,t,mo);
  float hue = clamp(0.5+0.5*dot(d0, vec2(0.60,0.80)), 0.0, 1.0);

  // Large-scale envelope: most of the frame is quiet water, and the streaks
  // only come up to full brightness in a few drifting regions. Laminar flow
  // covers the frame, so the envelope opens as morph rises.
  float envRaw = 0.5+0.5*snoise(q*0.34 + vec2(t*0.055, -t*0.030));
  float env = smoothstep(mix(0.20,0.06,mo), mix(0.92,0.80,mo), envRaw);

  // Once the flow is laminar every pixel points the same way, so a direction-
  // driven hue collapses to one flat colour. Replace it with a field sampled
  // 8x tighter across the flow than along it, which lays colour down as
  // striations parallel to the combing instead of as blobs.
  vec2 pd = vec2(-d0.y, d0.x);
  float hueLam = clamp(0.5+0.62*snoise(vec2(dot(q,pd)*0.85, dot(q,d0)*0.10)), 0.0, 1.0);
  hue = mix(hue, hueLam, mo*0.85);

  // Coherence is ~1 everywhere in laminar flow; trim the gain so the change
  // reads as shape rather than as exposure.
  float lum = streak*(0.30+0.70*coh)*(0.18+0.95*env)*mix(1.0,0.80,mo);
  vec3 tint = palette(clamp(0.16 + hue*0.34 + streak*0.48, 0.0, 1.0));

  vec3 col = mix(u_back, u_shadow, smoothstep(0.0,0.25,lum));
  col = mix(col, tint*0.85, smoothstep(0.05, 0.62, lum));
  // Filament highlights only where the flow is both bright and coherent.
  col += tint*pow(smoothstep(0.62,1.0,streak),2.0)*coh*env*0.75;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.35;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-curl',
	description: 'silky curl-noise streamlines: dye smeared along a flowing vector field, hue by direction',
	vertexShader,
	fragmentShader
});
