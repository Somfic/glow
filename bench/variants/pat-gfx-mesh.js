import { link, fullscreenTriangle, pushStandardUniforms, PARAMS } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// The marketing-page gradient mesh. One soft control point per palette colour
// drifting on its own lissajous, blended with a sharpened (soft-max) weight so
// overlaps stay saturated instead of averaging to mud. Domain-warped edges,
// dithered output so the wide flats never band.
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
// 0 = the soft gradient mesh (the resting form).
// 1 = the same control points as a cut-paper colour field: hard-edged cells
//     with topographic contour terraces stepping down from each centre.
uniform float u_morph;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float bayer4(vec2 p){
  int m[16] = int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);
  p = rot(radians(u_rotation)*0.25)*p;

  float t = u_time*0.13;
  float sc = 9.0/max(u_folds,3.0);
  // Zoom applied to the mesh itself, damped: this look is full-bleed by design,
  // so the control points may spread and tighten but must not shrink off the
  // frame at high zoom values. Written as 1 + (sc-1)*k, not mix(), so it is
  // exactly 1.0 at the component default (u_folds 9) with no rounding.
  float msc = 1.0 + (sc - 1.0)*0.6;

  // Two cheap sine layers as a domain warp: enough to make the blob edges
  // organic without any noise fetches.
  vec2 w = vec2(
    sin(p.y*2.7*sc + t*1.7) + 0.5*sin(p.x*4.1*sc - t*1.1),
    cos(p.x*2.3*sc - t*1.3) + 0.5*cos(p.y*3.7*sc + t*1.9)
  );
  vec2 q = p + w*0.085/sc;

  int N = int(clamp(u_ncols,1.0,5.0));
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float peak = 0.0;
  for(int i=0;i<5;i++){
    if(i>=N) break;
    float fi = float(i);
    float ph = fi*2.399;
    // msc is the zoom: it scales the control-point orbits and their radii
    // together, so u_folds dollies the whole mesh in and out instead of only
    // retuning the edge warp.
    vec2 c = vec2(
      0.62*asp*0.62*sin(t*(0.71+0.13*fi) + ph),
      0.34*cos(t*(0.53+0.17*fi) + ph*1.7)
    )*msc;
    float r = (0.58 + 0.10*sin(t*0.9+ph))*max(u_softness,0.3)*msc;
    float d = length((q-c)*vec2(0.80,1.05))/r;
    // Wide skirt, very sharp weighting: the nearest control point owns its
    // region outright (no five-way average, which is what turns a mesh muddy)
    // while the tails still overlap enough to hand over without a crease.
    float g = exp(-d*d*0.85);
    float g3 = g*g*g;
    float gw = g3*g3;
    // MORPH, part 1: raise the blend exponent. The weighting is already a
    // soft-max; pushing the exponent up narrows the hand-over zone between
    // control points until the mesh reads as cut paper. It is one continuous
    // parameter — the cell boundaries tighten, they never appear.
    // (pow() is skipped entirely at rest so morph=0 is bit-exact.)
    if(u_morph > 0.0) gw = pow(gw, 1.0 + 2.6*u_morph);
    gw += 1e-4;
    acc += u_colors[i].rgb*gw;
    wsum += gw;
    peak = max(peak, g);
  }
  vec3 mesh = acc/max(wsum, 1e-4);

  // Full-bleed: the mesh covers the frame, the background only tints the very
  // weakest corners. Wide flats of colour are the point of this look.
  float cover = smoothstep(0.03, 0.36, peak);
  vec3 bg = mix(u_back, u_shadow, 0.5);
  vec3 col = mix(bg, mesh, cover);

  // MORPH, part 2: topographic terraces. peak is a continuous height field,
  // so the contour count is FIXED and only the step edge sharpens: at low morph
  // the "steps" are a smooth ramp of zero amplitude, and they harden into
  // printed contour bands. No band is ever added or removed.
  if(u_morph > 0.0){
    float ph = pow(clamp(peak,0.0,1.0), 0.65)*6.0;
    float e = max(fwidth(ph)*0.9, mix(0.50, 0.05, u_morph));
    float terr = smoothstep(0.5-e, 0.5+e, fract(ph));
    col *= mix(1.0, 0.78+0.42*terr, u_morph);
  }

  // A broad sheen so the field has a light direction.
  col *= 0.90 + 0.22*smoothstep(-0.55,0.55, p.y*0.6 + p.x*0.4);

  // Corner falloff keeps text legible at the edges.
  col *= 1.0 - 0.34*dot(p*vec2(0.56,1.00), p*vec2(0.56,1.00));

  float l = dot(col, vec3(0.2126,0.7152,0.0722));
  col = mix(vec3(l), col, u_saturation);
  col = pow(clamp(col,0.0,1.0), vec3(1.0/2.2));
  col += (bayer4(gl_FragCoord.xy)-0.5)/160.0;
  fragColor = vec4(clamp(col,0.0,1.0), 1.0);
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
	name: 'pat-gfx-mesh',
	description: 'gradient-mesh blobs: soft-max blended palette control points, warped edges, dithered',
	vertexShader,
	fragmentShader
});
