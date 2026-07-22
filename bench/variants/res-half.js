// res-half — render the expensive field at 1/2 linear resolution into an FBO,
// then a trivial full-res pass bilinearly upsamples it and does the
// resolution-dependent dither/quantize at native pixel scale.
//
// This file also holds the shared building blocks for the other res-* variants
// (they import from here). It is a real variant with a real default export, so
// the harness treats it normally; the named exports are just so the GLSL and
// the multi-pass plumbing exist in exactly one place.

import { link, fullscreenTriangle, pushStandardUniforms } from '../lib/singlepass.js';

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const HEAD = /* glsl */ `#version 300 es
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
// Spatial frequency of the tap jitter. MUST stay <= 0.5 so that
// floor(gl_FragCoord.xy*u_jit) is constant across a 2x2 quad: the tap offsets
// depend on it, and dFdx/dFdy(h) inside the loop are only a spatial derivative
// if every lane of the quad sampled pat() at the same offset. Raising it to
// 0.5*scale (to keep the grain the same size in output pixels) makes the
// derivative measure the jitter instead of the surface — the normals blow up,
// crest highlights misfire and the image gets visibly brighter and grainier.
uniform float u_jit;

out vec4 fragColor;

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float vnoise(vec2 p){
  vec2 ip=floor(p), u=fract(p); u=u*u*(3.0-2.0*u);
  float r=mix(mix(hash12(ip),          hash12(ip+vec2(1,0)), u.x),
              mix(hash12(ip+vec2(0,1)), hash12(ip+vec2(1,1)), u.x), u.y);
  return r*r;
}

const mat2 m2=mat2(0.8,-0.6,0.6,0.8);

float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}

float pat(vec2 p, out float hue){
  vec2 q=vec2(fbm(p), fbm(p+vec2(5.2,1.3)));
  vec2 r=vec2(fbm(p+4.0*q+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(8.3,2.8)));
  hue=clamp(r.x*0.95+0.03, 0.0, 1.0);
  r+=u_time*0.045;
  return fbm(p+1.76*r);
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}

// Bit-exact closed form of the baseline's int[16] Bayer table. The dynamically
// indexed local array compiles to a scratch-memory load (or a 16-way select) on
// ANGLE/Metal, which is real money in a pass whose whole job is one texture
// fetch; the bit ops are free. Verified identical for all 16 (x,y).
float bayer4(vec2 p){
  ivec2 i=ivec2(mod(p,4.0));
  int a=i.x^i.y;
  int v=((a&1)<<3)|((i.y&1)<<2)|(a&2)|((i.y&2)>>1);
  return float(v)/16.0;
}
`;

// Everything up to and including the tap loop: this is the whole cost of the
// shader (13 taps x pat()). Produces lum / hue / bloom, pre-vignette.
const FIELD_BODY = /* glsl */ `
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 dir=normalize(vec2(0.66,0.75));
  vec2 perp=vec2(-dir.y,dir.x);
  float sm=0.045+(2.0-u_softness)*0.075;
  float jit=hash12(floor(gl_FragCoord.xy*u_jit))-0.5;

  float asp=u_resolution.x/u_resolution.y;
  mat2  R=rot(radians(u_rotation));
  float zsc=29.16/u_folds;
  vec2  pBase=vec2((uv.x-0.5)*asp, uv.y-0.5)*R*zsc;
  vec2  wDir =vec2(dir.x*asp,  dir.y )*R*zsc;
  vec2  wPerp=vec2(perp.x*asp, perp.y)*R*zsc;

  float bandGain=1.0;
  if(u_ribbon>0.001){
    float d=dot(pBase, normalize(vec2(wPerp)))/3.24;
    float t=d/(0.16*max(u_ribbonWidth,0.05));
    t+=0.35*sin(t*1.7+2.1);
    float band=floor(t), fb=fract(t);
    float k=smoothstep(0.0,0.16,fb);
    float bA=band-1.0, bB=band;
    float s=dot(pBase, normalize(vec2(wDir)))/3.24;
    float shear=mix(hash12(vec2(bA,7.7)), hash12(vec2(bB,7.7)), k);
    pBase+=normalize(wDir)*(shear-0.5)*4.5*u_ribbon;
    float c =mix(hash12(vec2(bA,9.1)), hash12(vec2(bB,9.1)), k)-0.5;
    float hl=0.42+0.40*mix(hash12(vec2(bA,11.3)), hash12(vec2(bB,11.3)), k);
    float cap=1.0-smoothstep(hl-0.24, hl+0.14, abs(s-c*0.8));
    float e=mix(hash12(vec2(bA,3.3)), hash12(vec2(bB,3.3)), k);
    bandGain=mix(1.0, (0.62+1.25*e*e)*cap*1.3, u_ribbon);
    float fo=mix(hash12(vec2(bA,5.5)), hash12(vec2(bB,5.5)), k);
    sm*=mix(1.0, 0.70+1.25*fo, u_ribbon);
  }

  vec3 L=normalize(vec3(0.55,0.35,0.55));
  vec3 HL=normalize(L+vec3(0.0,0.0,1.0));

  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;
  const int K=6;
  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));
  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    // NOTE: dFdx(h) is per-pass-pixel but is multiplied by u_resolution, so a
    // pass running at half resolution sees 2x the finite difference and 0.5x
    // the resolution factor — the surface normal is resolution-invariant.
    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
    lum+=lv*w; hue+=hh*w; wsum+=w;
    bloom+=smoothstep(0.55,1.0,lv)*w;
  }
  lum/=wsum; hue/=wsum; bloom/=wsum;
  lum*=bandGain;
`;

// Vignette + palette + tonemap + gamma + saturation. `uv` and `asp` must be in
// scope. Leaves the result in `col`, pre-dither.
const SHADE_BODY = /* glsl */ `
  vec2 qc=(uv-0.5); qc.x*=asp; lum*=1.0-dot(qc,qc)*0.45;
  vec3 grad=palette(hue*0.62 + lum*0.42);
  vec3 col=mix(u_back, u_shadow, smoothstep(0.015,0.30,lum));
  col=mix(col, grad, smoothstep(0.22,0.72,lum));
  col+=grad*bloom*0.55;
  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation), 0.0, 1.0);
`;

// Ordered dither + quantize, verbatim from the baseline. Resolution dependent:
// only ever run in the full-res pass so the dither stays at native pixel scale.
const DITHER_BODY = /* glsl */ `
  float lvl=mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;
`;

// Low-res pass, "color" mode: the whole shader except the dither. Output is the
// final sRGB-encoded colour, which is exactly what an RGBA8 target stores.
export const passColor = HEAD + `void main(){` + FIELD_BODY + SHADE_BODY + `fragColor=vec4(col,1.0); }`;

// Low-res pass, "fields" mode: stop after the tap loop and write the raw
// signal. lum can reach ~1.25, so it is stored scaled by 1/1.5.
export const passFields =
	HEAD + `void main(){` + FIELD_BODY + `fragColor=vec4(lum*(1.0/1.5), hue, bloom, 1.0); }`;

// Full-res pass over a "color" low-res target: bilinear fetch + dither.
export const upsampleColor =
	HEAD +
	/* glsl */ `uniform sampler2D u_src;
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec3 col=texture(u_src, uv).rgb;
` +
	DITHER_BODY +
	`  fragColor=vec4(col,1.0);
}`;

// Full-res pass over a "fields" low-res target: bilinear fetch of the signal,
// then vignette / palette / tonemap / saturation / dither at native resolution.
export const upsampleFields =
	HEAD +
	/* glsl */ `uniform sampler2D u_src;
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec4 f=texture(u_src, uv);
  float lum=f.r*1.5, hue=f.g, bloom=f.b;
` +
	SHADE_BODY +
	DITHER_BODY +
	`  fragColor=vec4(col,1.0);
}`;

function makeTarget(gl, w, h, half) {
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	if (half) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
	} else {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	const fbo = gl.createFramebuffer();
	const prev = gl.getParameter(gl.FRAMEBUFFER_BINDING);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
	gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
	if (!ok) {
		gl.deleteFramebuffer(fbo);
		gl.deleteTexture(tex);
		return null;
	}
	return { tex, fbo };
}

/**
 * Two-pass variant factory.
 *  scale     linear downscale of the expensive pass (2 → quarter the pixels)
 *  fields    true → low-res pass emits lum/hue/bloom and the full-res pass does
 *            the palette/tonemap/dither; false → low-res pass emits final colour
 *  temporal  null | { every: N }  update the low-res pass every N-th frame
 *            | { bands: B }       update 1/2 of the low-res rows per frame in
 *                                 B interleaved stripes (constant per-frame cost)
 */
export function makeResVariant({
	name,
	description,
	scale,
	fields = false,
	temporal = null,
	jit = null
}) {
	return {
		name,
		description,
		create(gl, w, h) {
			// RGBA16F for the field target: 8 bits of lum through a palette lookup
			// and a tonemap bands visibly.
			const wantHalf = fields && !!gl.getExtension('EXT_color_buffer_float');
			const fieldProg = link(gl, vertexShader, fields ? passFields : passColor);
			const upProg = link(gl, vertexShader, fields ? upsampleFields : upsampleColor);

			let W = w,
				H = h,
				lw = 0,
				lh = 0,
				target = null;
			let frame = 0;

			const buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

			const uTimeField = gl.getUniformLocation(fieldProg, 'u_time');

			function setup(nw, nh) {
				W = nw;
				H = nh;
				lw = Math.max(1, Math.round(W / scale));
				lh = Math.max(1, Math.round(H / scale));
				if (target) {
					gl.deleteFramebuffer(target.fbo);
					gl.deleteTexture(target.tex);
				}
				target = makeTarget(gl, lw, lh, wantHalf);
				if (!target) target = makeTarget(gl, lw, lh, false);

				gl.useProgram(fieldProg);
				pushStandardUniforms(gl, fieldProg, lw, lh);
				gl.uniform1f(gl.getUniformLocation(fieldProg, 'u_jit'), jit === null ? 0.5 : jit);

				gl.useProgram(upProg);
				pushStandardUniforms(gl, upProg, W, H);
				gl.uniform1i(gl.getUniformLocation(upProg, 'u_src'), 0);
				frame = 0;
			}
			setup(w, h);

			function bindQuad(prog) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				const a = gl.getAttribLocation(prog, 'a_pos');
				gl.enableVertexAttribArray(a);
				gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
			}

			return {
				resize: setup,
				render(t) {
					const prevFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);

					const every = temporal && temporal.every ? temporal.every : 1;
					const doField = frame % every === 0;

					if (doField) {
						gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
						gl.viewport(0, 0, lw, lh);
						gl.useProgram(fieldProg);
						bindQuad(fieldProg);
						gl.uniform1f(uTimeField, t);
						if (temporal && temporal.bands && frame > 0) {
							// Interleaved stripe update: half the rows this frame, the
							// other half next frame. Per-frame cost is constant (no
							// spike, no stutter) and no pixel is ever more than one
							// frame stale.
							const B = temporal.bands;
							gl.enable(gl.SCISSOR_TEST);
							for (let i = frame & 1; i < B; i += 2) {
								const y0 = Math.floor((i * lh) / B);
								const y1 = Math.floor(((i + 1) * lh) / B);
								if (y1 <= y0) continue;
								gl.scissor(0, y0, lw, y1 - y0);
								gl.drawArrays(gl.TRIANGLES, 0, 3);
							}
							gl.disable(gl.SCISSOR_TEST);
						} else {
							gl.drawArrays(gl.TRIANGLES, 0, 3);
						}
					}

					gl.bindFramebuffer(gl.FRAMEBUFFER, prevFBO);
					gl.viewport(0, 0, W, H);
					gl.useProgram(upProg);
					bindQuad(upProg);
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, target.tex);
					gl.drawArrays(gl.TRIANGLES, 0, 3);

					frame++;
				},
				dispose() {
					gl.deleteBuffer(buf);
					gl.deleteProgram(fieldProg);
					gl.deleteProgram(upProg);
					if (target) {
						gl.deleteFramebuffer(target.fbo);
						gl.deleteTexture(target.tex);
					}
				}
			};
		}
	};
}

export default makeResVariant({
	name: 'res-half',
	description: 'Full shader at 1/2 linear res (1/4 pixels) + bilinear upsample, dither at full res',
	scale: 2
});
