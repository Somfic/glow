// Agate geode: Voronoi nodules, each banded with its own concentric growth
// rings, a crystalline quartz core, and a wet polished sheen.
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

mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}
vec2 grad2(vec2 p){ float a=h21(p)*6.2831853; return vec2(cos(a),sin(a)); }
float gn(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(dot(grad2(i),f),dot(grad2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(grad2(i+vec2(0,1)),f-vec2(0,1)),dot(grad2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
const mat2 m2=mat2(0.80,-0.60,0.60,0.80);
float fbm(vec2 p){
  float f=0.5*gn(p); p=m2*p*2.03;
  f+=0.25*gn(p); p=m2*p*2.01;
  f+=0.125*gn(p);
  return f;
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, f*f*(3.0-2.0*f));
}
vec3 paletteC(float x){ x=fract(x); return palette(1.0-abs(2.0*x-1.0)); }
float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}
vec3 finish(vec3 col){
  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float l=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(l),col,u_saturation),0.0,1.0);
  float lvl=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  return floor(col*lvl+0.5)/lvl;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 p=rot(radians(u_rotation)*0.6)*vec2((uv.x-0.5)*asp, uv.y-0.5)*(u_folds*0.155);

  float t=u_time;

  // the silica keeps depositing: the warp evolves, so the bands creep outward
  vec2 wv=vec2(fbm(p*0.9+vec2(0.0,t*0.030)), fbm(p*0.9+vec2(5.7,t*0.026)));
  vec2 pw=p+wv*0.85;

  // nodules
  vec2 ip=floor(pw), fp=fract(pw);
  float d1=8.0, d2=8.0; vec2 id1=vec2(0.0), rel=vec2(0.0);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 o=vec2(float(i),float(j));
      vec2 id=ip+o;
      vec2 r=h22(id);
      vec2 c=o+0.5+0.40*(r-0.5)*2.0;
      vec2 dv=fp-c;
      // slightly elliptical nodules
      float sq=0.72+0.55*r.x;
      float d=length(vec2(dv.x*sq, dv.y/sq));
      if(d<d1){ d2=d1; d1=d; id1=id; rel=dv; }
      else if(d<d2){ d2=d; }
    }
  }

  vec2 rr=h22(id1+7.31);
  float seam=d2-d1;

  // banding: radius plus fine turbulence, banded at a per-nodule frequency
  float turb=fbm(pw*3.1+rr*13.0)*0.55 + fbm(pw*7.0-rr*4.0)*0.16;
  float freq=9.0+9.0*rr.x;
  float band=(d1*freq + turb*2.2 + rr.y*7.0 + t*0.05);

  float f=fract(band);
  // hard chalcedony edges, not a smooth sine
  float edge=smoothstep(0.0,0.10,f)*smoothstep(1.0,0.90,f);
  float ring=1.0-smoothstep(0.02,0.09,min(f,1.0-f));

  // real agate alternates translucent milky layers with saturated ones, and the
  // layer identity is constant across a band and jumps at the boundary
  float bi=floor(band);
  float bh=h21(vec2(bi, dot(id1,vec2(1.0,7.0))));
  vec3 base=paletteC(band*0.075+rr.y*0.4)*(0.35+0.70*bh);
  vec3 milky=mix(palette(0.40), vec3(0.55), 0.55)*(0.30+0.40*bh);
  vec3 bandCol=mix(base, milky, smoothstep(0.55,0.70,bh)*0.70);
  bandCol=mix(bandCol, mix(u_back,u_shadow,0.5), 0.35*(1.0-edge));

  // quartz core: radiating crystal facets in the middle of each nodule
  float coreR=0.07+0.07*rr.y;
  float core=smoothstep(coreR+0.06, coreR-0.02, d1);
  float ang=atan(rel.y,rel.x);
  float facet=abs(fract(ang*(2.5+3.0*rr.x)/6.2831853*8.0+rr.y)-0.5)*2.0;
  float sparkle=pow(1.0-facet,9.0);
  vec3 quartz=mix(palette(0.50), vec3(0.60), 0.35)*(0.45+0.40*facet)+vec3(sparkle)*0.18;

  // relief: bands stand slightly proud, seams cut in
  float relief=turb*0.6+edge*0.35-smoothstep(0.14,0.0,seam)*0.9;
  vec2 g=vec2(dFdx(relief),dFdy(relief))*u_resolution.xy*0.0035;
  vec3 N=normalize(vec3(-g,1.0));
  vec3 L=normalize(vec3(0.40,0.66,0.64));
  float diff=0.62+0.50*clamp(dot(N,L),0.0,1.0);
  float spec=pow(clamp(dot(N,normalize(L+vec3(0,0,1))),0.0,1.0),52.0);

  bandCol=mix(vec3(dot(bandCol,vec3(0.2126,0.7152,0.0722))), bandCol, 0.74)*0.62;
  vec3 col=bandCol*diff;
  col+=palette(0.98)*ring*0.12;
  col=mix(col, quartz, core);
  // dark matrix in the seams between nodules
  col=mix(col, mix(u_back,u_shadow,0.5)*0.70, smoothstep(0.055,0.0,seam));
  col+=vec3(spec)*0.35;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.30;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-agate',
	description: 'agate nodules: concentric growth bands with quartz cores',
	vertexShader,
	fragmentShader
});
