// ALU variant 6 — 2-octave fbm (FIDELITY-CHANGING, reported as such).
//
// The third octave contributes 0.125/0.875 = 14.3% of fbm's amplitude at 4x
// frequency. Dropping it removes 1 of every 3 vnoise() calls, i.e. 260 of the
// 780 hash12 evaluations per pixel, for a theoretical ~33% cut of the dominant
// cost. Amplitudes are renormalised (/0.75) so the mean and range of fbm are
// unchanged; only the high-frequency detail is gone.
//
// This is the honest "how much does the third octave actually survive the
// downstream smoothsteps" experiment — see the PSNR number, not just the ms.
import { makeSinglePassVariant } from '../lib/singlepass.js';
import { fragmentShader as base, vertexShader } from '../lib/baselineShader.js';

const OLD = `float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}`;

const NEW = `float fbm(vec2 p){
  float f=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p);
  return f*(1.0/0.75);
}`;

if (!base.includes(OLD)) throw new Error('alu-fbm2: baseline fbm not found');

export default makeSinglePassVariant({
	name: 'alu-fbm2',
	description: '2-octave fbm (drops the 14%-amplitude 3rd octave) — changes the image',
	vertexShader,
	fragmentShader: base.replace(OLD, NEW)
});
