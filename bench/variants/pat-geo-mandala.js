import { makeSinglePassVariant } from '../lib/singlepass.js';

const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `#version 300 es
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
out vec4 fragColor;

mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, smoothstep(0.0,1.0,f));
}
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 base=vec2((uv.x-0.5)*asp, uv.y-0.5);
  float t=u_time;
  vec2 p=(base-vec2(0.16,0.02))*rot(radians(u_rotation));

  float r=length(p);
  float a0=atan(p.y,p.x);

  // Concentric rings of tiles. The petal count grows with the ring index so
  // every tile keeps roughly the same size, which is what makes the whole
  // thing read as one woven mandala rather than a few big wedges.
  float rs=u_folds*1.15;
  float rr=r*rs+1.0-t*0.09;
  float ri=floor(rr), fr=rr-ri;

  float hr=hash12(vec2(ri,3.7));
  // Alternating rings turn opposite ways at their own rate: the ring stack
  // shears continuously and never resolves into a static doily.
  float spin=t*(0.04+0.16*hr)*(mod(ri,2.0)*2.0-1.0);
  float N=max(6.0, 6.0*floor(ri*0.5+1.0)+6.0*step(0.5,hash12(vec2(ri,5.1))));
  float sa=6.2831853/N;
  float a=a0+spin;
  float ci=floor(a/sa);
  float fa=(a-ci*sa)/sa;            // 0..1 across the petal
  float dx=abs(fa-0.5)*2.0;         // 0 at petal centre, 1 at its edge
  float dy=abs(fr-0.5)*2.0;

  float hc=hash12(vec2(ci*1.13+ri*7.7, ri*3.3));
  float shp=hash12(vec2(ri,19.1));
  // Rings take turns being diamonds, squares or round beads.
  float fld = shp<0.34 ? (dx+dy)*0.66 : (shp<0.70 ? max(dx,dy) : length(vec2(dx,dy))*0.80);
  // A few rings are continuous bands instead of tiles -- the connective tissue.
  float bandRing=step(0.80, hash12(vec2(ri,29.0)));
  fld=mix(fld, dy*0.85, bandRing);

  float sz=0.88+0.10*sin(t*0.4+hc*6.2831+ri);
  float pxw=fwidth(fld)+0.003;
  float tile=smoothstep(sz+pxw, sz-pxw, fld);
  // Thin inner highlight only: a wide light rim made the tiles look like
  // stickers rather than glass held in dark leading.
  float rim =smoothstep(sz*0.90+pxw, sz*0.90-pxw, fld)-smoothstep(sz*0.78+pxw, sz*0.78-pxw, fld);

  // Knock out a fraction of the tiles so the lattice breathes and the
  // background shows through as negative space.
  float present=mix(step(0.14, hash12(vec2(ci+ri*31.0, ri))), 1.0, bandRing);
  // The innermost rings are always drawn: the rings march inwards over time and
  // without this the centre of the design periodically empties out.
  float ringOn=max(step(0.13, hash12(vec2(ri,23.0))), 1.0-smoothstep(0.10,0.34,r));
  tile*=present*ringOn; rim*=present*ringOn;

  float idx=clamp(0.5+0.5*sin(ri*0.62+t*0.09)+(hc-0.5)*0.26, 0.0, 1.0);
  vec3 c=palette(idx);
  vec3 c2=palette(fract(idx+0.35));

  // Brightness ripples outward through the rings.
  float bright=0.30+0.70*pow(0.5+0.5*sin(ri*0.55-t*1.1+hc*2.0), 2.0);
  float halo=exp(-r*2.6);
  float fade=1.0-smoothstep(0.55,1.70,r);

  vec3 col=mix(u_back, u_shadow, 0.92);
  col=mix(col, c*(0.14+0.95*bright)*(0.45+0.70*fade), tile*0.96);
  col+=mix(c2, vec3(1.0), 0.10)*rim*bright*(0.35+0.7*fade)*0.7;
  col+=palette(fract(0.15+t*0.02))*halo*0.55;

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.30;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation), 0.0, 1.0);
  float lvl=mix(255.0, 14.0, clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;
  fragColor=vec4(col,1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-geo-mandala',
	description: 'counter-rotating rings of faceted tiles radiating from an off-centre core',
	vertexShader,
	fragmentShader
});
