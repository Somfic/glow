import { link, fullscreenTriangle, pushStandardUniforms, PARAMS } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Chunky-pixel ordered dither. A slow sunrise field is snapped to a handful of
// palette steps on a fat pixel grid, with an 8x8 Bayer matrix doing the mixing
// — so every transition is a woven checker, never a gradient.
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
// 0 = drifting sunrise on an 8x8 Bayer checker (the resting form).
// 1 = the same shells folded back on themselves into topographic contour
//     rings, printed through a diagonal line screen instead of a checker.
uniform float u_morph;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

vec3 step_color(int i, int levels){
  // Lowest step is the background; the rest march through the palette.
  if(i<=0) return u_back*0.85 + u_shadow*0.35;
  float f = float(i-1)/max(1.0, float(levels-2));
  float x = clamp(f,0.0,1.0)*(u_ncols-1.0);
  int k = int(floor(x)); float fr = fract(x);
  return mix(u_colors[k].rgb, u_colors[min(k+1,int(u_ncols)-1)].rgb, fr);
}

// 8x8 Bayer via the classic recursive-fract trick — no 64-entry array.
float bayer2(vec2 a){ a = floor(a); return fract(a.x*0.5 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5*a)*0.25 + bayer2(a); }

// A line-screen ordered-dither threshold: same job and same [0,1) distribution
// as bayer8, but its level sets are diagonal stripes instead of a checker, so
// the mid-tones cluster into engraved lines. Because it is just another
// threshold *field*, morphing between the two is a plain mix of two floats —
// each fat pixel crosses its own threshold at its own moment and the weave
// unravels into lines with no frame where the whole image re-quantises.
float lineDither(vec2 a){
  float u = (a.x + a.y)*0.1666667;
  return abs(fract(u) - 0.5)*2.0;
}

void main(){
  // Fat pixels. u_folds sets how fat.
  float px = max(2.0, floor(u_resolution.y/(13.0*max(u_folds,2.0))+0.5));
  vec2 fc = floor(gl_FragCoord.xy/px);
  vec2 res = u_resolution/px;
  vec2 uv = (fc+0.5)/res;
  float asp = res.x/res.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  // Orientation. Measured from the component default (52) so the shipped look
  // is bit-for-bit what it always was, while the knob still swings the whole
  // composition — this pattern simply had no orientation before.
  p = rot(radians(u_rotation - 52.0))*p;

  float t = u_time*0.16;

  // A single light source low in frame, falling off in wide concentric shells.
  // Everything else only bends those shells — so the dithered transitions
  // always read as nested arcs, i.e. as a deliberate figure.
  vec2 sunp = vec2(0.20*sin(t*0.45), -0.30 + 0.05*sin(t*0.71));
  float rr = length((p - sunp)*vec2(0.80, 1.15));
  // A slow swell bends the shells without breaking them up.
  rr += 0.060*sin(p.x*3.1 - t*1.3) + 0.035*sin(p.x*6.3 + p.y*2.2 + t*0.9);
  // MORPH, part 1: fold the distance field back on itself. The amplitude ramps
  // from zero, so the shells first ripple, then (once the fold exceeds the band
  // spacing) each shell reflects into a pair of contour rings. The band *count*
  // is untouched — it is the field that folds, which is why nothing snaps.
  rr += u_morph*0.10*sin(rr*11.0 - t*1.6);
  // Wide enough that the outermost shell still reaches the top corners: no
  // dead flat black third at the top of the frame.
  float v = 1.0 - smoothstep(0.04, 1.35, rr);
  v = clamp(v*1.10 - 0.02, 0.0, 1.0);

  int levels = int(clamp(u_ncols+1.0, 3.0, 6.0));
  float L = float(levels-1);
  // MORPH, part 2: cross-fade the threshold field, checker -> line screen.
  float d = mix(bayer8(fc), lineDither(fc), u_morph) - 0.5;
  float q = v*L + d*(0.9+0.5*u_softness)*mix(1.0, 1.45, u_morph);
  int lo = int(clamp(floor(q), 0.0, L));
  vec3 col = step_color(lo, levels);

  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, u_saturation);
  fragColor = vec4(pow(clamp(col,0.0,1.0), vec3(1.0/2.2)), 1.0);
}
`;

// Same single pass as makeSinglePassVariant, except u_morph is re-pushed every
// frame instead of once at create(). The harness renders a whole morph sweep in
// one browser session and ES modules are cached, so `lib/singlepass.js` PARAMS
// is frozen at whatever the FIRST batch asked for — reading the live params
// object per frame is the only way a sweep actually sweeps.
function makeMorphVariant({ name, description, vertexShader, fragmentShader }) {
	return {
		name,
		description,
		vertexShader,
		fragmentShader,
		create(gl, w, h) {
			const program = link(gl, vertexShader, fragmentShader);
			gl.useProgram(program);
			const buf = fullscreenTriangle(gl, program);
			const uTime = gl.getUniformLocation(program, 'u_time');
			const uMorph = gl.getUniformLocation(program, 'u_morph');
			let W = w,
				H = h;
			pushStandardUniforms(gl, program, W, H);
			const morph = () => {
				const v = globalThis.__GLOW_PARAMS?.morph ?? PARAMS.morph ?? 0;
				return Number(v) || 0;
			};
			return {
				resize(nw, nh) {
					W = nw;
					H = nh;
					gl.useProgram(program);
					pushStandardUniforms(gl, program, W, H);
				},
				render(t) {
					gl.useProgram(program);
					gl.bindBuffer(gl.ARRAY_BUFFER, buf);
					const aPos = gl.getAttribLocation(program, 'a_pos');
					gl.enableVertexAttribArray(aPos);
					gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
					gl.viewport(0, 0, W, H);
					gl.uniform1f(uTime, t);
					gl.uniform1f(uMorph, morph());
					gl.drawArrays(gl.TRIANGLES, 0, 3);
				},
				dispose() {
					gl.deleteBuffer(buf);
					gl.deleteProgram(program);
				}
			};
		}
	};
}

export default makeMorphVariant({
	name: 'pat-gfx-dither',
	description: 'chunky 8x8 Bayer dither: a drifting sunrise posterised onto a few palette steps',
	vertexShader,
	fragmentShader
});
