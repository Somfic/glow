// Soap foam: a jittered Voronoi of drifting bubbles, each shaded as a dome with
// thin-film interference. Film thickness drains with time and each bubble runs
// its own drain cycle, so the iridescent bands crawl and the foam re-forms.
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
vec2 h22(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec2 grad2(vec2 p){ float a=h21(p)*6.2831853; return vec2(cos(a),sin(a)); }
float gn(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(dot(grad2(i),f),dot(grad2(i+vec2(1,0)),f-vec2(1,0)),u.x),
             mix(dot(grad2(i+vec2(0,1)),f-vec2(0,1)),dot(grad2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  return mix(u_colors[i].rgb, u_colors[min(i+1,int(u_ncols)-1)].rgb, f*f*(3.0-2.0*f));
}
// seamless ramp for interference orders: ping-pong so order N ties to order N+1
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
  vec2 p=rot(radians(u_rotation)*0.25)*vec2((uv.x-0.5)*asp, uv.y-0.5)*(u_folds*0.22);

  float t=u_time;
  // the whole raft of foam slowly churns
  // warp the lattice so the Plateau borders curve instead of reading as the
  // straight edges of a Voronoi diagram
  p+=0.30*vec2(gn(p*0.4+vec2(0.0,t*0.05)), gn(p*0.4+vec2(11.0,t*0.045)))
    +0.13*vec2(gn(p*1.3+vec2(3.0,t*0.09)), gn(p*1.3+vec2(21.0,t*0.08)));

  vec2 ip=floor(p), fp=fract(p);

  float d1=8.0, d2=8.0;
  vec2  rel1=vec2(0.0), id1=vec2(0.0);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 o=vec2(float(i),float(j));
      vec2 id=ip+o;
      vec2 r=h22(id);
      // each bubble jostles on its own little orbit
      vec2 c=o+0.5+0.42*vec2(sin(t*(0.25+0.35*r.x)+r.y*6.283),
                             cos(t*(0.22+0.30*r.y)+r.x*6.283));
      vec2 dv=c-fp;
      float d=length(dv);
      if(d<d1){ d2=d1; d1=d; rel1=-dv; id1=id; }
      else if(d<d2){ d2=d; }
    }
  }

  vec2 rr=h22(id1);
  // Normalised cell coordinate: 0 at the bubble crown, 1 exactly on the film
  // between two bubbles. Using this instead of a fixed radius makes every dome
  // fill its own cell, so the foam packs with no polygonal gaps.
  float x=clamp(2.0*d1/(d1+d2+1e-5),0.0,1.0);
  x=pow(x,0.85);

  // dome normal for the bubble cap
  float ct=sqrt(max(1.0-x*x,0.0));
  vec2 dir = d1>1e-4 ? rel1/d1 : vec2(0.0);
  vec3 N=normalize(vec3(dir*x*1.25, ct+0.10));
  vec3 V=vec3(0.0,0.0,1.0);

  // film thickness: thinnest at the crown (drainage), each bubble on its own cycle
  float cyc=fract(t*(0.045+0.05*rr.y)+rr.x);
  float drain=0.35+1.25*(1.0-cyc);
  // the thickness field is dominated by irregular drainage swirls, not by the
  // radius — otherwise every bubble is a bullseye
  float th=drain*(0.30+0.55*x*x)
          +0.55*gn(p*1.35+rr*17.0+vec2(0.0,t*0.10))
          +0.20*gn(p*2.9-rr*5.0+vec2(t*0.07,0.0));
  // path length through the film grows at grazing angles
  float phase=th/max(ct,0.30)*0.34;

  vec3 iri=paletteC(phase)*0.80
          +paletteC(phase*0.5-0.17)*0.30
          +vec3(0.10);
  // real foam is only lightly tinted; full-gamut bands read as bubblegum
  iri=mix(vec3(dot(iri,vec3(0.2126,0.7152,0.0722))), iri, 0.72);

  // black film: fully drained crowns go transparent-dark, like real soap
  float black=smoothstep(0.60,0.15,drain)*smoothstep(0.70,0.05,x);
  iri*=1.0-black*0.90;

  vec3 L=normalize(vec3(-0.40,0.66,0.64));
  float spec=pow(clamp(dot(N,normalize(L+V)),0.0,1.0),140.0)*2.4;
  float fres=pow(1.0-clamp(N.z,0.0,1.0),2.4);

  // Plateau borders: the wet rims where three films meet
  float border=d2-d1;
  float rim=1.0-smoothstep(0.0,0.055,border);
  float rimCore=1.0-smoothstep(0.0,0.018,border);

  vec3 bg=mix(u_back,u_shadow,0.5);
  vec3 col=bg;
  // only the cap of each bubble carries film; the packing gaps stay dark
  float cap=smoothstep(1.04,0.86,x);
  col=mix(col, iri*(0.22+0.95*ct), cap);
  col+=iri*fres*cap*0.30;
  col+=vec3(spec)*cap;
  col=mix(col, bg*0.55, rim*0.85);
  col+=vec3(0.35)*rimCore*0.30;

  vec2 vc=(uv-0.5); vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.28;

  fragColor=vec4(finish(col),1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-org-soapfilm',
	description: 'soap foam, thin-film iridescence with draining black films',
	vertexShader,
	fragmentShader
});
