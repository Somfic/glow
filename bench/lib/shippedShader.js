// Ported from https://github.com/mattrothenberg/fold-gradient (MIT).
// The GLSL fragment shader is verbatim; only the surrounding WebGL host differs
// (Paper Design's ShaderMount → the small renderer in Glow.svelte).

export const vertexShader = /* glsl */ `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const fragmentShader = /* glsl */ `#version 300 es
// highp is required: the fbm/pat coordinate accumulation quantizes badly under
// mediump on GPUs that honor it (Intel/Mesa), producing banding and a seam at
// uv.x=0.5. Apple GPUs promote mediump→highp, which is why it only shows there.
// WebGL2 guarantees highp float in fragment shaders.
precision highp float;

// Baked value-noise lattice; see noiseLut.ts for what is in it and why.
uniform sampler2D u_lut;

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

// Bilinear interpolation of a random lattice — which is what a texture unit
// does for free. The lattice is baked with the smoothstep already applied and
// supersampled (see noiseLut.ts), so a plain bilinear fetch reproduces the
// original interpolation and this costs one fetch instead of four hash12 calls.
// The shader evaluates it ~195x per pixel, so it is the whole cost of the frame.
//
// The square stays here on purpose: vnoise squares the *interpolated* value,
// and squaring does not commute with mixing, so it cannot be baked.
// textureLod(..., 0.0) avoids implicit-derivative LOD selection, which is both
// pointless (no mipmaps) and illegal in the non-uniform flow this is called from.
float vnoise(vec2 p){
  float r=textureLod(u_lut, (p+128.0)*0.00390625+0.000244140625, 0.0).r;
  return r*r;
}

const mat2 m2=mat2(0.8,-0.6,0.6,0.8);

float fbm(vec2 p){
  float f=0.0;
  f+=0.5000*vnoise(p); p=m2*p*2.02;
  f+=0.2500*vnoise(p); p=m2*p*2.03;
  f+=0.1250*vnoise(p);
  return f/0.875;
}

float pat(vec2 p, out float hue){
  vec2 q=vec2(fbm(p), fbm(p+vec2(5.2,1.3)));
  vec2 r=vec2(fbm(p+4.0*q+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(8.3,2.8)));
  hue=clamp(r.x*0.95+0.03, 0.0, 1.0);
  r+=u_time*0.045;
  return fbm(p+1.76*r);
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
  vec2 dir=normalize(vec2(0.66,0.75));
  vec2 perp=vec2(-dir.y,dir.x);
  float sm=0.045+(2.0-u_softness)*0.075;
  // Jitter decorrelates each pixel's tap positions so the discrete taps do not
  // show up as coherent comb/ripple banding.
  //
  // Keep this at FULL amplitude. It trades banding for noise, and for a fixed
  // tap count the total error is roughly constant — the jitter only decides
  // whether that error appears as incoherent speckle or as coherent ripples.
  // Partial amplitudes are the worst of both: 0.25 was tried and produced a
  // clearly visible diagonal moire. Reducing the error itself means raising K,
  // not turning the jitter down.
  //
  // Must stay uniform across the 2x2 derivative quad: the tap loop takes
  // dFdx/dFdy of the height field, and a per-lane jitter would make those
  // derivatives measure the jitter instead of the surface.
  float jit=hash12(floor(gl_FragCoord.xy*0.5))-0.5;

  float asp=u_resolution.x/u_resolution.y;
  mat2  R=rot(radians(u_rotation));
  float zsc=29.16/u_folds;
  vec2  pBase=vec2((uv.x-0.5)*asp, uv.y-0.5)*R*zsc;
  vec2  wDir =vec2(dir.x*asp,  dir.y )*R*zsc;
  vec2  wPerp=vec2(perp.x*asp, perp.y)*R*zsc;

  float bandGain=1.0;
  if(u_ribbon>0.001){
    float d=dot(pBase, normalize(vec2(wPerp)))/3.24;
    float t=d/(0.16*max(u_ribbonWidth,0.05));
    t+=0.35*sin(t*1.7+2.1);
    float band=floor(t), fb=fract(t);
    float k=smoothstep(0.0,0.16,fb);
    float bA=band-1.0, bB=band;
    float s=dot(pBase, normalize(vec2(wDir)))/3.24;
    float shear=mix(hash12(vec2(bA,7.7)), hash12(vec2(bB,7.7)), k);
    pBase+=normalize(wDir)*(shear-0.5)*4.5*u_ribbon;
    float c =mix(hash12(vec2(bA,9.1)), hash12(vec2(bB,9.1)), k)-0.5;
    float hl=0.42+0.40*mix(hash12(vec2(bA,11.3)), hash12(vec2(bB,11.3)), k);
    float cap=1.0-smoothstep(hl-0.24, hl+0.14, abs(s-c*0.8));
    float e=mix(hash12(vec2(bA,3.3)), hash12(vec2(bB,3.3)), k);
    bandGain=mix(1.0, (0.62+1.25*e*e)*cap*1.3, u_ribbon);
    float fo=mix(hash12(vec2(bA,5.5)), hash12(vec2(bB,5.5)), k);
    sm*=mix(1.0, 0.70+1.25*fo, u_ribbon);
  }

  vec3 L=normalize(vec3(0.55,0.35,0.55));
  vec3 HL=normalize(L+vec3(0.0,0.0,1.0));

  float lum=0.0, hue=0.0, wsum=0.0, bloom=0.0;
  // This loop is a Monte-Carlo estimate of a blur integral: it always spans
  // fi in [-1,1] and normalizes by wsum, so K changes only how finely the
  // integral is sampled, never the amount of blur.
  //
  // K=6 (13 taps) left enough residual sampling noise to read as speckle. How
  // visible that is depends strongly on the palette: across a wide ramp
  // (purple->pink->orange->yellow) a given error in the hue term swings the colour far
  // more than across a set of near-identical teals, so the same noise is ~3x
  // more visible. K was chosen against that worst case, not the default look.
  //
  // Measured against a converged K=48 render at that palette: K=6 scores RMSE
  // 4.77, K=10 -> 2.02, K=16 -> 1.00, K=24 -> 0.56. Judged on a wide, short
  // canvas (banding and grain are relative to pixel scale, and a square-ish
  // crop hides both), K=24 is the first count with no visible speckle and no
  // ripples. 49 taps only became affordable once vnoise became a texture fetch;
  // this is still ~1.45x faster than the pre-LUT shader was at 13 taps.
  const int K=24;
  float fscale=mix(1.0, 0.52, clamp(u_ribbon,0.0,1.0));
  for(int i=-K;i<=K;i++){
    float fi=(float(i)+jit)/float(K);
    float w=exp(-fi*fi*2.5);
    vec2 off=wDir*(fi*sm)+wPerp*(fi*sm*0.11);
    float hh; float h=pat((pBase+off)*fscale, hh);
    vec2 g=vec2(dFdx(h),dFdy(h))*u_resolution.xy*0.0022;
    vec3 N=normalize(vec3(-g, 0.5));
    float diff=clamp(dot(N,L),0.0,1.0);
    float crest=pow(clamp(dot(N,HL),0.0,1.0),16.0);
    float ribbon=smoothstep(0.14,0.92,h);
    float baseW =mix(0.34,0.72,u_ribbon);
    float diffW =mix(0.90,0.08,u_ribbon);
    float crestW=mix(0.60,0.0 ,u_ribbon);
    float sheen =pow(h,5.0)*0.45*u_ribbon;
    float lv=(ribbon*(baseW+diff*diffW)+crest*crestW+sheen)*smoothstep(0.02,0.45,h);
    lum+=lv*w; hue+=hh*w; wsum+=w;
    bloom+=smoothstep(0.55,1.0,lv)*w;
  }
  lum/=wsum; hue/=wsum; bloom/=wsum;
  lum*=bandGain;

  vec2 qc=(uv-0.5); qc.x*=asp; lum*=1.0-dot(qc,qc)*0.45;

  vec3 grad=palette(hue*0.62 + lum*0.42);
  vec3 col=mix(u_back, u_shadow, smoothstep(0.015,0.30,lum));
  col=mix(col, grad, smoothstep(0.22,0.72,lum));
  col+=grad*bloom*0.55;

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
