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

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 base=vec2((uv.x-0.5)*asp, uv.y-0.5);
  float t=u_time;
  float scale=u_folds*0.50;
  vec2 p=base*rot(radians(u_rotation))*scale+vec2(t*0.035,-t*0.02);

  vec2 id=floor(p), lp=p-id-0.5;
  // One screen pixel in cell units: p.y spans "scale" units over the full
  // height, so a pixel is scale/height. Getting this wrong by even 2x visibly
  // smears every arc into a haze.
  float px=scale/u_resolution.y;

  float flip=hash12(id+0.5);
  vec2 lq=lp; if(flip>0.5) lq.x=-lq.x;
  vec2 ca=vec2(0.5,0.5), cb=vec2(-0.5,-0.5);
  float da=length(lq-ca), db=length(lq-cb);
  bool useA=da<db;
  vec2 cc=useA?ca:cb;
  float arc=min(da,db)-0.5;

  // Four tile species, all of which meet the cell edges at their midpoints, so
  // the network stays connected however they are shuffled. Mixing them is what
  // stops a Truchet field from reading as printed wallpaper.
  float v=hash12(id+2.27);
  float d;
  if(v<0.42)      d=abs(arc);                                  // single ribbon
  else if(v<0.72) d=min(abs(arc-0.155), abs(arc+0.155));       // twin rails
  else if(v<0.90) d=min(abs(lq.x), abs(lq.y));                 // crossroads
  else            d=min(min(abs(lq.x),abs(lq.y)), abs(length(lq)-0.26)); // hub

  // Phase along the arc drives a pulse that runs around the weave.
  vec2 rel=lq-cc;
  float ang=atan(rel.y,rel.x);
  float flowdir=(flip>0.5)?-1.0:1.0;
  float ph=ang*flowdir*0.8+hash12(id+9.1)*6.2831+t*1.15;
  float pulse=0.35+0.65*pow(0.5+0.5*sin(ph*1.6), 4.0);

  // Half-width, in cell units. Keep it small: a crossroads tile inks a band on
  // both axes, so a fat setting floods half the cell and the tile reads as a
  // pale square rather than as a line.
  float wdt=0.048*mix(0.75,1.15,u_ribbonWidth);
  float band=smoothstep(wdt+px*1.2, wdt-px*1.2, d);
  float core=smoothstep(wdt*0.40+px, wdt*0.36-px, d);
  float glow=exp(-max(d-wdt,0.0)*30.0);

  float lf=vnoise(p*0.26+vec2(-t*0.04,t*0.03));
  // Colour comes almost entirely from the smooth field: per-cell jitter makes a
  // continuous tube change colour abruptly where it crosses a cell edge.
  float idx=clamp(lf*1.05+(hash12(id+5.5)-0.5)*0.06, 0.0, 1.0);
  vec3 c1=palette(idx);
  vec3 c2=palette(fract(idx+0.32));

  vec3 col=mix(u_back, u_shadow, 0.9);
  col+=c1*glow*0.16*(0.25+pulse);
  col=mix(col, c1*(0.22+1.15*pulse), band*0.95);
  col+=mix(c2, vec3(1.0), 0.12)*core*pulse*0.8;

  vec2 qc=base; col*=1.0-dot(qc,qc)*0.34;

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
	name: 'pat-geo-truchet',
	description: 'recursively subdivided truchet weave with light pulsing along the arcs',
	vertexShader,
	fragmentShader
});
