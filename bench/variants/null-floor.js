// Not an optimization — a control. Draws the same full-screen triangle with a
// trivial fragment shader, so its time is the harness's own per-frame overhead
// (draw call, FBO bind, timer query, uniform push) with no shader work in it.
//
// Any variant approaching this number is measuring the harness, not itself.
import { makeSinglePassVariant } from '../lib/singlepass.js';

export default makeSinglePassVariant({
	name: 'null-floor',
	description: 'CONTROL: trivial shader — measures harness overhead floor',
	vertexShader: /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`,
	// Reads u_resolution/u_time so the uniform pushes are not optimized away and
	// the output still depends on them, matching the real variants' setup cost.
	fragmentShader: /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;
void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  fragColor = vec4(uv, fract(u_time), 1.0);
}
`
});
