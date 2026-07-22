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

float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=hash12(i), b=hash12(i+vec2(1,0)), c=hash12(i+vec2(0,1)), d=hash12(i+vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

const mat2 m2=mat2(0.80,-0.60,0.60,0.80);

float fbm(vec2 p){
  float f=0.0, a=0.5, s=0.0;
  for(int i=0;i<5;i++){ f+=a*vnoise(p); s+=a; a*=0.5; p=m2*p*2.03; }
  return f/s;
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  int j=min(i+1, int(u_ncols)-1);
  return mix(u_colors[i].rgb, u_colors[j].rgb, f*f*(3.0-2.0*f));
}

float bayer4(vec2 p){
  int m[16]=int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  return float(m[int(mod(p.y,4.0))*4 + int(mod(p.x,4.0))])/16.0;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 p=vec2((uv.x-0.5)*asp, uv.y-0.5);
  p=rot(radians(u_rotation))*p;
  p*=0.42*u_folds;

  float t=u_time*0.035;

  // Domain-warped elevation. The warp drifts, so contour rings slowly crawl
  // and merge instead of the whole field sliding sideways.
  vec2 q=vec2(fbm(p+vec2(0.0,t)), fbm(p+vec2(5.2,1.3)-t*0.7));
  float h=fbm(p+1.55*q+vec2(t*0.35,0.0));
  h=h*1.25-0.10;
  // Sea level breathes: every contour steps outward and back over ~70s.
  h+=0.035*sin(u_time*0.09);
  h=clamp(h,0.0,1.0);

  float N=15.0;
  float e=h*N;
  float w=max(fwidth(e), 1e-4);

  // Line coverage from the distance to the nearest integer isoline, measured
  // in screen pixels via fwidth -> constant apparent width at any zoom.
  float d=(0.5-abs(fract(e)-0.5))/w;
  float minor=1.0-smoothstep(0.35,1.25,d);
  float ie=e*0.2;
  float d5=(0.5-abs(fract(ie)-0.5))*5.0/w;
  float major=1.0-smoothstep(0.35,2.10,d5);

  // Flat map fill from the quantised band, with a touch of the continuous
  // value so big plateaus are not perfectly dead.
  float bandC=(floor(e)+0.5)/N;
  vec3 fill=mix(palette(bandC), palette(h), 0.22);
  // A palette is not required to be monotone in lightness (the default one
  // runs dark red -> blue -> cyan -> red), so elevation is also carried by a
  // tonal ramp. Without this, adjacent bands can swap hue with no sense of up.
  fill*=0.30+1.30*bandC;
  fill=mix(mix(u_back,u_shadow,0.45)*1.5, fill, 0.30+0.70*smoothstep(-0.05,0.5,bandC));

  // Cheap hillshade: gradient of the height field in screen space.
  vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.y*0.30;
  vec3 nrm=normalize(vec3(-g, 1.0));
  vec3 L=normalize(vec3(-0.55,0.62,0.60));
  float diff=clamp(dot(nrm,L),0.0,1.0);
  float shade=0.72+0.62*diff;

  // Paper: background tinted by the map, darkened in shadow, lifted on slopes.
  vec3 paper=mix(u_back, u_back*1.35+0.02, 0.5);
  vec3 col=mix(paper, fill*shade, 0.80);
  col=mix(col, u_shadow, (1.0-diff)*0.28);

  // Slope hatching: shading gets denser where the isolines crowd together.
  float crowd=clamp(length(vec2(dFdx(e),dFdy(e)))*0.55,0.0,1.0);
  col*=1.0-crowd*0.18;

  vec3 ink=mix(u_shadow, vec3(0.0), 0.35);
  vec3 hilite=palette(clamp(bandC+0.12,0.0,1.0))*1.6+0.05;

  // Minor lines are ink; major (every 5th) lines get an inner glow so the
  // index contours read first, like a real topo sheet.
  col=mix(col, ink, minor*0.45);
  col=mix(col, ink, major*0.80);
  col+=hilite*major*0.07*(0.5+0.5*diff);

  // Pull a little saturation out: a full-strength 5-stop ramp quantised into
  // 15 bands is a lot of colour to put behind body text.
  col=mix(vec3(dot(col,vec3(0.2126,0.7152,0.0722))), col, 0.74)*0.88;
  col=mix(col, u_back*1.4, 0.16);

  // Fine paper grain.
  float grain=hash12(gl_FragCoord.xy*0.7+floor(u_time*4.0));
  col*=0.97+0.06*grain;

  vec2 vc=uv-0.5; vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.30;

  col=clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14),0.0,1.0);
  col=pow(col, vec3(1.0/2.2));
  float luma=dot(col, vec3(0.2126,0.7152,0.0722));
  col=clamp(mix(vec3(luma), col, u_saturation),0.0,1.0);

  float lvl=mix(255.0,14.0,clamp(u_noise,0.0,1.0));
  col+=(bayer4(gl_FragCoord.xy)-0.5)/lvl;
  col=floor(col*lvl+0.5)/lvl;

  fragColor=vec4(col,1.0);
}
`;

export default makeSinglePassVariant({
	name: 'pat-ter-contour',
	description: 'topographic contour map: fwidth-crisp isolines, index contours, hillshaded bands',
	vertexShader,
	fragmentShader
});
