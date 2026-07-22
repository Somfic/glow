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
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=p-i; f=f*f*(3.0-2.0*f);
  float a=hash12(i), b=hash12(i+vec2(1,0)), c=hash12(i+vec2(0,1)), d=hash12(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
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
  vec2 pr=base*rot(radians(u_rotation));
  // Domain warp before the cell lookup: shards come out in a range of sizes and
  // stretched directions instead of one uniform crazy-paving.
  vec2 warp=vec2(vnoise(pr*0.85+vec2(3.0,0.0)), vnoise(pr*0.85+vec2(0.0,7.0)))-0.5;
  vec2 p=(pr+warp*0.55)*(u_folds*0.62);
  float t=u_time*0.16;

  vec2 g=floor(p), f=p-g;
  float md=8.0; vec2 mr=vec2(0.0), mid=vec2(0.0);
  for(int j=-1;j<=1;j++)
  for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j));
    vec2 h=hash22(g+o);
    vec2 pos=o+0.5+0.40*sin(t*(0.5+h.y)+6.2831*h.x+vec2(0.0,1.9));
    vec2 r=pos-f;
    float d=dot(r,r);
    if(d<md){ md=d; mr=r; mid=g+o; }
  }
  // Second pass: distance to the perpendicular bisector with each neighbour =
  // the crack lines. 3x3 is enough because the sites never leave their cell.
  float me=8.0;
  for(int j=-1;j<=1;j++)
  for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j));
    vec2 h=hash22(g+o);
    vec2 pos=o+0.5+0.40*sin(t*(0.5+h.y)+6.2831*h.x+vec2(0.0,1.9));
    vec2 r=pos-f;
    vec2 dv=r-mr;
    float l=dot(dv,dv);
    if(l>1e-4) me=min(me, dot(0.5*(mr+r), dv*inversesqrt(l)));
  }

  // Per-shard facet: a random plane tilt makes each piece catch the light
  // differently, so the field never reads as flat tiles.
  vec2 nd=normalize(hash22(mid+3.17)*2.0-1.0);
  float shade=dot(mr,nd)*1.25;

  float hc=hash12(mid+7.7);
  float lf=vnoise(mid*0.30+vec2(u_time*0.05,-u_time*0.03));
  float idx=clamp(lf*1.15+(hc-0.5)*0.42, 0.0, 1.0);

  float w=fwidth(me)+0.0015;
  float crack=1.0-smoothstep(0.0, 0.010+w*1.6, me);
  float halo =1.0-smoothstep(0.0, 0.16, me);
  float bev  =smoothstep(0.0, 0.24, me);

  // A slow travelling wave lights the seams in bands rather than all at once.
  float sweep=0.15+0.85*pow(0.5+0.5*sin(dot(base,vec2(1.5,0.85))*2.4-u_time*0.5), 3.0);
  // Broad drifting light field: the sheet of glass is lit unevenly, so whole
  // regions fall back towards the background instead of shouting at once.
  float lit=vnoise(pr*0.75+vec2(-u_time*0.045,u_time*0.03));
  lit=smoothstep(0.10,0.85,lit*0.75+0.42);
  float fill=step(0.18, hash12(mid+1.3));

  vec3 col=mix(u_back, u_shadow, 0.85);
  vec3 sc=palette(idx)*(0.10+0.85*clamp(0.5+shade,0.0,1.4))*(0.35+0.65*bev);
  col=mix(col, sc*(0.16+1.05*lit), fill*0.95);
  col+=palette(fract(idx+0.30))*halo*halo*sweep*lit*0.28;
  col+=mix(palette(fract(idx+0.45)), vec3(1.0), 0.20)*crack*(0.10+1.15*sweep)*(0.25+0.9*lit);

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.38;

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
	name: 'pat-geo-shatter',
	description: 'drifting voronoi shards with lit cracks and a travelling seam highlight',
	vertexShader,
	fragmentShader
});
