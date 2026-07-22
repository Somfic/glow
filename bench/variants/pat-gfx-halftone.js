import { link, fullscreenTriangle, pushStandardUniforms, PARAMS } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Screen-printed halftone. One ink per palette colour, each on its own screen
// angle, each pulling its dot area from a slightly displaced copy of the same
// blob field — which is exactly how a misregistered riso print gets its colour.
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
// 0 = round-dot screen, tight registration (the resting form).
// 1 = the same separations pulled through a coarser LINE screen with the
//     plates deliberately thrown further out of register.
uniform float u_morph;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// Three plates pulled from across the whole ramp, not off its front — with a
// 5-stop palette that picks stops 0/2/4, so the inks are actually different
// colours instead of three neighbours that print as one.
vec3 ink(int i, int N){
  int n = int(max(u_ncols, 1.0));
  int k = N<=1 ? 0 : int(floor(float(i)*float(n-1)/float(N-1) + 0.5));
  return u_colors[clamp(k, 0, n-1)].rgb;
}

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx)*0.1031);
  p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

// Blob field. k shifts the whole composition per ink so the separations do not
// sit on top of each other — that is where the colour mixing comes from.
float field(vec2 q, float k){
  float t = u_time*0.11;
  float s = 0.0;
  for(int i=0;i<3;i++){
    float fi = float(i);
    float ph = fi*2.399 + k*0.9;
    vec2 c = vec2(cos(t*1.10+ph)*0.62, sin(t*0.83+ph*1.7)*0.30);
    float r = 0.30 + 0.07*sin(t*1.7+ph);
    s += r*r/(dot(q-c,q-c)+0.020);
  }
  s *= 0.62;
  s += 0.34 + 0.34*sin(dot(q, vec2(1.35,0.95)) - t*1.6 + k*1.3);
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  float asp = u_resolution.x/u_resolution.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);

  // Paper: the background colour with a whisper of tooth.
  float tooth = hash12(floor(gl_FragCoord.xy*0.5));
  vec3 col = u_back*(0.94+0.12*tooth) + u_shadow*0.10;

  // u_folds is the screen ruling: bigger zoom = finer dot pitch. The morph
  // coarsens it continuously (the grid scales, it never re-tiles).
  float pitch = max(u_folds, 2.0)*2.3*mix(1.0, 0.68, u_morph);
  int N = int(clamp(u_ncols, 1.0, 3.0));

  for(int i=0;i<3;i++){
    if(i>=N) break;
    float fi = float(i);
    // Registration error: each plate drifts on its own slow ellipse.
    vec2 mis = vec2(cos(u_time*0.19+fi*2.1), sin(u_time*0.23+fi*1.3))*0.024*(0.4+fi*0.6)
               *mix(1.0, 2.4, u_morph);
    float a = field(p+mis, fi*1.7);
    a = smoothstep(0.78, 1.85, a);
    // Each ink keeps to its own region of the sheet, so the plates overlap in
    // narrow seams rather than everywhere: that is where the paper shows.
    a *= 1.0 - mix(0.85, 0.62, u_morph)*smoothstep(0.42, 1.15, length((p-vec2(0.0,0.0))*vec2(0.80,1.25)));
    a = clamp(a, 0.0, 1.0);

    // Classic separation angles, carried around by u_rotation.
    vec2 sp = rot(radians(u_rotation + 15.0 + fi*30.0))*(p+mis*0.5)*pitch;
    vec2 cell = fract(sp)-0.5;
    // MORPH: blend the DOT distance field into a LINE distance field. Both are
    // distances in the same cell, so the level set (which is what you actually
    // see) sweeps continuously: circle -> stadium -> ellipse stretched until
    // neighbouring cells touch and fuse into a continuous rule. Nothing about
    // the grid, the ink count or the tone mapping changes.
    float d = mix(length(cell), abs(cell.y), u_morph);
    // Capped below 0.5 so neighbouring dots never merge into a solid: the
    // screen stays legible as a screen even at full ink.
    float r = 0.455*sqrt(a);
    float aa = max(fwidth(d), 0.0015)*0.9;
    float cov = 1.0 - smoothstep(r-aa, r+aa, d);
    col = mix(col, ink(i, N)*1.02, cov*0.92);
  }

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
	name: 'pat-gfx-halftone',
	description: 'screen-printed halftone: one ink per colour, own screen angle, drifting misregistration',
	vertexShader,
	fragmentShader
});
