import { makeSinglePassVariant } from '../lib/singlepass.js';
import { PRELUDE, vertexShader } from './pat-flow-aurora.js';

// Iridescent liquid: a slowly flowing height field read as a thin film. Film
// thickness cycles the palette (ping-ponged so the ramp is seamless), and a
// real surface normal from the height derivatives gives it specular wetness.
export const fragmentShader =
	PRELUDE +
	/* glsl */ `
float height(vec2 p, float t){
  // Advected, self-warping surface. The warp offsets move at different rates
  // so the film keeps re-mixing instead of translating.
  vec2 w = p;
  w += 0.55*vec2(snoise(p*0.70 + vec2(t*0.055, 0.0)),
                 snoise(p*0.70 + vec2(2.7,8.3) + vec2(0.0, t*0.041)));
  w += 0.26*vec2(snoise(w*1.65 - vec2(0.0, t*0.09)),
                 snoise(w*1.65 + vec2(5.1,1.9)));
  return fbm3(w*0.85 + vec2(0.0, t*0.02));
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  p *= rot(radians(u_rotation));
  float sc = 9.0/max(u_folds,1.0);
  float t = u_time;
  // morph: a still, flowing film (0) -> the same film driven into a standing
  // wave, corrugated into iridescent rings that the surface topography warps (1).
  float mo = clamp(u_morph, 0.0, 1.0);

  vec2 q = p*sc*0.95;

  float h = height(q, t);
  // Phase carries the film's own height, so the rings are pulled about by the
  // topography instead of sitting on the frame as perfect circles.
  vec2  rc = vec2(0.34*sin(t*0.031), -0.20);
  float ripple = sin(6.2831*(length(q-rc)*3.4 + h*0.30) - t*0.30);
  // Corrugating the height itself (not just the colour) is what puts real
  // specular glints along the rings.
  h += mo*0.058*ripple;
  // Derivatives of the height give the surface normal for free.
  vec2 g = vec2(dFdx(h), dFdy(h))*u_resolution.xy*0.010;
  vec3 N = normalize(vec3(-g, 0.55));

  vec3 L = normalize(vec3(0.45, 0.55, 0.70));
  vec3 V = vec3(0.0,0.0,1.0);
  vec3 H = normalize(L+V);
  float diff = clamp(dot(N,L),0.0,1.0);
  // u_softness broadens the highlight: polished film -> satin.
  float spec = pow(clamp(dot(N,H),0.0,1.0), 42.0/clamp(u_softness,0.35,3.0));
  float fres = pow(1.0-clamp(N.z,0.0,1.0), 2.2);

  // Interference: optical path length depends on thickness and view angle, so
  // the bands crowd where the surface tilts away. That crowding is the whole
  // reason this reads as oil on water and not as a colour ramp.
  float thick = h*1.75 + fres*1.30 + 0.28*snoise(q*0.4 + vec2(t*0.03,0.0))
              + mo*0.55*ripple;   // rings crowd the ramp into visible fringes
  vec3 film = paletteLoop(thick);

  // The film is not everywhere. Where it thins out the liquid goes back to
  // near-black, which is what gives the frame somewhere to breathe.
  // The standing wave drives the film out over more of the dish.
  float cover = smoothstep(mix(0.18,0.09,mo), mix(0.86,0.78,mo), 0.5+0.5*snoise(q*0.42 + vec2(-t*0.045, t*0.028)));

  float lum = 0.14 + 0.86*diff;
  vec3 col = mix(u_shadow, u_back, clamp(h*1.4+0.35,0.0,1.0));
  col += film*lum*(0.10 + 0.50*fres)*(0.06+0.95*cover);
  col += film*spec*0.95*(0.20+0.90*cover);
  col += vec3(1.0)*spec*0.18;

  // Dark troughs keep contrast: the film thins to nothing in the low places.
  col *= 0.16 + 1.05*smoothstep(-0.65, 0.55, h);

  vec2 vc=(uv-0.5); vc.x*=asp;
  col *= 1.0 - dot(vc,vc)*0.28;

  fragColor = vec4(finish(col), 1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-flow-oilfilm',
	description: 'iridescent liquid light: thin-film interference bands over a flowing, specular surface',
	vertexShader,
	fragmentShader
});
