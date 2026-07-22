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

// Value noise that also returns its analytic gradient. This is what lets the
// terrain be lit from a real surface normal instead of from dFdx of the height:
// screen-space derivatives are constant across each 2x2 quad, which on a
// high-frequency ridged field shows up as blocky, crawling shading.
vec3 vnoised(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  vec2 du=6.0*f*(1.0-f);
  float a=hash12(i), b=hash12(i+vec2(1,0)), c=hash12(i+vec2(0,1)), d=hash12(i+vec2(1,1));
  float k1=b-a, k2=c-a, k3=a-b-c+d;
  return vec3(a+k1*u.x+k2*u.y+k3*u.x*u.y,
              du.x*(k1+k3*u.y),
              du.y*(k2+k3*u.x));
}
float vnoise(vec2 p){ return vnoised(p).x; }

const mat2 m2=mat2(0.80,-0.60,0.60,0.80);

// Ridged multifractal with an analytic gradient. Each octave is folded to a
// ridge and weighted by the previous one, which puts sharp crests on the highs
// and leaves the basins smooth instead of uniformly noisy.
vec3 ridgedD(vec2 p){
  float f=0.0, a=0.5, s=0.0, prev=1.0;
  vec2 g=vec2(0.0);
  mat2 T=mat2(1.0,0.0,0.0,1.0);
  for(int i=0;i<5;i++){
    vec3 v=vnoised(p);
    float x=v.x*2.0-1.0;
    float n=1.0-abs(x);
    vec2 dn=-sign(x)*2.0*v.yz;
    f+=a*n*n*prev;
    g+=a*prev*(T*(2.0*n*dn));
    prev=clamp(n*n*1.35,0.0,1.0);
    s+=a; a*=0.52;
    p=m2*p*2.08;
    T=T*(2.08*transpose(m2));
  }
  return vec3(f/s, g/s);
}
float fbm2(vec2 p){ return 0.667*vnoise(p)+0.333*vnoise(m2*p*2.11); }

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  int j=min(i+1,int(u_ncols)-1);
  return mix(u_colors[i].rgb, u_colors[j].rgb, f*f*(3.0-2.0*f));
}

// A palette is an arbitrary set of stops, not a luminance ramp: the default one
// ends on bright red, so "brighter = further along the ramp" paints lava on
// every sunlit face. Instead the stops are re-ordered into a proper shading
// ramp -- darkest stop for shadow, brightest for highlight, the most saturated
// one as the midtone accent -- which behaves for any palette the user passes.
vec3 gLo, gHi, gMid;
void buildRamp(){
  int n=int(u_ncols);
  gLo=u_colors[0].rgb; gHi=gLo; gMid=gLo;
  float loL=1e9, hiL=-1e9, midS=-1.0;
  for(int i=0;i<5;i++){
    if(i>=n) break;
    vec3 c=u_colors[i].rgb;
    float l=dot(c,vec3(0.2126,0.7152,0.0722));
    float mx=max(max(c.r,c.g),c.b), mn=min(min(c.r,c.g),c.b);
    float sat=(mx-mn)/(mx+1e-4);
    if(l<loL){ loL=l; gLo=c; }
    if(l>hiL){ hiL=l; gHi=c; }
    // The accent wants a saturated stop of *middling* lightness: picking the
    // most saturated stop outright tends to land on the darkest or brightest
    // one, which is already spoken for by gLo/gHi.
    float score=sat*(1.0-abs(l-0.40)*1.5);
    if(score>midS){ midS=score; gMid=c; }
  }
  gHi=mix(gHi, vec3(1.0), 0.18);
  // The darkest stop of a palette is often a deep saturated colour (the default
  // set starts on maroon). Left as-is it stains every shadow and low basin with
  // that hue; pulled toward a neutral tied to the background it reads as depth.
  float lo=dot(gLo,vec3(0.2126,0.7152,0.0722));
  gLo=mix(mix(u_back, vec3(lo), 0.50), gLo, 0.20)*0.95;
}
// Mostly a clean dark->light ramp, with the accent colour laid over it as a
// narrow belt near the top. Putting the accent at the ramp's midpoint instead
// hands it the largest area of the frame, which is how a mountain ends up
// looking like a flat slab of one saturated colour.
vec3 ramp(float x){
  x=clamp(x,0.0,1.0);
  vec3 base=mix(gLo,gHi,x*x*(3.0-2.0*x));
  float belt=exp(-pow((x-0.70)/0.19,2.0));
  return mix(base, gMid, belt*0.50);
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
  p*=0.32*u_folds;

  buildRamp();

  float t=u_time;
  // The massif itself creeps: a very slow continental drift of the field.
  p+=vec2(t*0.010, t*0.004);

  vec3 hd=ridgedD(p);
  float h=hd.x;
  vec2 grad=hd.yz;

  vec3 nrm=normalize(vec3(-grad*0.42, 1.0));

  // Raking sun that swings slowly through the day.
  float az=1.05+0.55*sin(t*0.028);
  float el=0.34+0.10*sin(t*0.019);
  vec3 L=normalize(vec3(cos(az),sin(az),el));
  float diff=clamp(dot(nrm,L),0.0,1.0);
  float sky=0.5+0.5*nrm.z;
  float slope=clamp(length(grad)*0.30,0.0,1.0);

  // Basins see less sky than crests.
  float ao=0.40+0.60*smoothstep(0.02,0.55,h);

  // Hypsometric tint: the ramp is walked by *elevation*, so it always runs dark
  // low ground -> light high ground, and the sun is applied on top as a
  // multiply. Driving the ramp with the light instead flips that ordering and
  // paints every flat basin with the highlight colour.
  float key=clamp(h*1.30-0.06+0.10*(diff-0.5), 0.0, 1.0);
  vec3 col=ramp(key)*(0.34+0.92*diff+0.26*sky)*ao;

  // Snowline: high, and only where the ground is not too steep to hold snow.
  float snow=smoothstep(0.66,0.90,h)*(1.0-smoothstep(0.30,0.70,slope));
  vec3 snowC=mix(gHi, vec3(1.0), 0.55);
  col=mix(col, snowC*(0.42+0.80*diff+0.20*sky), smoothstep(0.1,0.9,snow)*0.9);

  // Crest sheen: a thin specular line right along the ridges.
  vec3 HL=normalize(L+vec3(0.0,0.0,1.0));
  float crest=pow(clamp(dot(nrm,HL),0.0,1.0),24.0)*smoothstep(0.30,0.70,h);
  col+=mix(gHi,vec3(1.0),0.5)*crest*0.30;

  // Valley fog: an fbm-modulated layer pooling below a slowly rising level,
  // washing the low ground out and giving the frame somewhere quiet.
  float fogLevel=0.235+0.040*sin(t*0.045);
  float fogN=fbm2(p*0.55+vec2(t*0.03,-t*0.02));
  float fog=smoothstep(fogLevel+0.09, fogLevel-0.15, h+0.10*(fogN-0.5));
  vec3 fogC=mix(u_back, gMid, 0.30)*1.25+0.02;
  col=mix(col, fogC, fog*0.85);

  // Aerial haze rising up the frame.
  col=mix(col, mix(u_back,fogC,0.5), smoothstep(0.45,1.05,uv.y)*0.22);

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
	name: 'pat-ter-massif',
	description:
		'ridged-multifractal massif with analytic normals: raking sun, snowline, pooling valley fog',
	vertexShader,
	fragmentShader
});
