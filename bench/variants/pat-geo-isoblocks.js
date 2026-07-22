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

// Voronoi cell of the triangular lattice = a pointy-top hexagon, which is
// exactly the silhouette of an isometric cube.
vec4 hexid(vec2 p){
  vec2 s=vec2(1.0,1.7320508);
  vec2 a=mod(p,s)-s*0.5;
  vec2 b=mod(p-s*0.5,s)-s*0.5;
  return dot(a,a)<dot(b,b) ? vec4(a, p-a) : vec4(b, p-b);
}
float rayDist(vec2 q, vec2 d){
  float h=dot(q,d);
  return h>0.0 ? abs(q.x*d.y-q.y*d.x) : length(q);
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 base=vec2((uv.x-0.5)*asp, uv.y-0.5);
  float t=u_time;
  vec2 p=base*rot(radians(u_rotation)*0.25)*(u_folds*0.62)+vec2(t*0.06, t*0.10);

  vec4 H=hexid(p);
  vec2 gv=H.xy, id=floor(H.zw*8.0+0.5)/8.0;
  float rnd=hash12(id*3.77);

  // Each block occasionally tumbles: a 120 degree twist of the face partition
  // reads as the cube rolling over. Staggered per cell, so a few are always in
  // motion while the rest sit still.
  float ph=fract(t*0.075+rnd);
  float fl=smoothstep(0.80,0.97,ph);
  float ang=atan(gv.y,gv.x)-fl*2.0943951;

  float fi=floor(mod((ang-1.5707963)/2.0943951+0.5, 3.0));
  float face=fi<0.5?1.00:(fi<1.5?0.34:0.16);

  // Seams: the three spokes to alternate vertices, plus the hexagon border.
  float sd=1e9;
  for(int i=0;i<3;i++){
    float sa=0.5235988+2.0943951*float(i)-fl*2.0943951;
    sd=min(sd, rayDist(gv, vec2(cos(sa),sin(sa))));
  }
  vec2 q=abs(gv);
  float hd=0.5-max(q.x, max(abs(dot(gv,vec2(0.5,0.8660254))), abs(dot(gv,vec2(-0.5,0.8660254)))));
  float wS=fwidth(sd)*1.2+0.004, wH=fwidth(hd)*1.2+0.004;
  float seam=max(smoothstep(0.020+wS,0.020-wS,sd), smoothstep(0.022+wH,0.022-wH,hd));

  // Height field: a slow wave sinks and lifts whole regions of the lattice,
  // dropping the lowest blocks out entirely into shadow.
  float hgt=vnoise(id*0.55+vec2(t*0.06,-t*0.04));
  float lift=0.5+0.5*sin(dot(id,vec2(0.55,0.32))-t*0.55);
  float solid=smoothstep(0.16,0.30, hgt*0.75+lift*0.35);

  // Hue is a smooth field with only a little per-block jitter, so the wall
  // reads as coloured regions rather than confetti.
  float idx=clamp(0.10+1.05*vnoise(id*0.30+vec2(t*0.04,-t*0.03))+(rnd-0.5)*0.14, 0.0, 1.0);
  vec3 c=palette(idx);
  vec3 hi=palette(fract(idx+0.30));

  // A broad band of light sweeps across the lattice and catches the top faces.
  float sw=0.5+0.5*sin(dot(id,vec2(0.62,0.40))*0.55-t*0.55);
  float shine=pow(sw, 3.0);

  vec3 col=mix(u_back, u_shadow, 0.92);
  vec3 blk=c*face*(0.35+0.95*lift)*(0.60+0.75*shine)+hi*shine*shine*face*face*0.7;
  col=mix(col, blk, solid*0.96);
  col=mix(col, mix(hi,vec3(1.0),0.25)*(0.10+1.5*shine)*(0.3+0.9*face), seam*solid*0.8);
  // Empty sockets keep their rim, so the lattice still reads where blocks are gone.
  col+=u_shadow*seam*(1.0-solid)*1.4;

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.40;

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
	name: 'pat-geo-isoblocks',
	description: 'isometric hex-cube lattice, blocks tumbling and a height wave rolling through',
	vertexShader,
	fragmentShader
});
