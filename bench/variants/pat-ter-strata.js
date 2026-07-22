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

float hash11(float x){
  return fract(sin(x*127.1+11.7)*43758.5453);
}
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
  float f=0.0,a=0.5,s=0.0;
  for(int i=0;i<4;i++){ f+=a*vnoise(p); s+=a; a*=0.5; p=m2*p*2.07; }
  return f/s;
}

vec3 palette(float x){
  x=clamp(x,0.0,1.0)*(u_ncols-1.0);
  int i=int(floor(x)); float f=fract(x);
  int j=min(i+1,int(u_ncols)-1);
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
  // Only a gentle tilt of the whole section, so the beds stay readable.
  p=rot(radians(u_rotation)*0.22)*p;
  p*=0.30*u_folds;

  float t=u_time;

  // --- structure -----------------------------------------------------------
  // Broad anticline/syncline folding of the bed surfaces, breathing slowly.
  float fold = 0.55*sin(p.x*0.55+0.4+0.06*t)
             + 0.26*sin(p.x*1.23-1.7-0.04*t)
             + 0.80*(fbm(vec2(p.x*0.30, 3.7))-0.5);
  float y = p.y + fold*(0.55+0.25*sin(0.05*t));

  // Two normal faults: everything right of the (slightly leaning) fault plane
  // is thrown down by a fixed amount. fwidth blows up on the seam, which is
  // exactly the dark fault trace we want -- but it is clamped so it stays a
  // line and not a slab.
  // The trace is roughened, otherwise the offset reads as a straight cut
  // through the image rather than as a fault plane.
  float f1x=-1.55+0.09*y+0.16*sin(y*0.7)+0.20*(fbm(vec2(1.7,y*1.9))-0.5);
  float f2x= 1.35-0.11*y+0.22*(fbm(vec2(8.3,y*1.6))-0.5);
  float faultD=min(abs(p.x-f1x), abs(p.x-f2x));
  y += step(f1x,p.x)*0.62;
  y -= step(f2x,p.x)*0.44;

  // Very slow subsidence: new beds creep in from below.
  y += t*0.012;

  // Non-uniform bed thickness: a monotone warp of the layer coordinate, so some
  // beds are thin laminae and others are metre-scale units.
  // (Kept moderate: pushing it further makes the thin beds compress until the
  // bedding planes and the lamination texture alias into moire.)
  float lp = y + 0.22*sin(y*1.7+0.9) + 0.11*sin(y*4.1-2.2);
  float dens=2.6;
  float s=lp*dens;
  float id=floor(s);
  float f=fract(s);

  // --- per-bed material ----------------------------------------------------
  float r1=hash11(id*1.7+3.1);
  float r2=hash11(id*3.3-7.9);
  float r3=hash11(id*0.9+21.4);

  // Palette runs across the full depth of the section, with per-bed jitter so
  // neighbouring beds never land on the same colour.
  // Small hue jitter, large tonal jitter: neighbouring beds in a real section
  // are related rocks at different brightness, not unrelated colours. A big
  // hue jitter across a 5-stop ramp puts red next to cyan and reads as fabric.
  float depth=clamp(0.5-y*0.215,0.0,1.0);
  float pc=clamp(depth+(r1-0.5)*0.13,0.0,1.0);
  vec3 bed=palette(pc);

  // Three rock types, so the section has hard/soft rhythm rather than a smooth
  // ramp: dark mudstone, mid sandstone, pale coarse conglomerate.
  float coarse=step(0.68,r2);
  float dark=step(r2,0.26);
  bed=mix(bed, bed*1.45+0.05, coarse);
  bed=mix(bed, bed*0.42, dark);
  bed*=0.62+0.68*r3;

  // Laminations, stretched hard along bedding. fbm rather than a single
  // anisotropic vnoise: one octave of stretched value noise shows its lattice
  // as visible rectangles.
  float lam=fbm(vec2(p.x*1.6+id*4.0, s*6.0));
  float fine=fbm(vec2(p.x*9.0, s*13.0+id*9.0));
  float grit=vnoise(vec2(p.x*70.0+id*31.0, s*55.0));
  float tex = mix(lam*0.6+fine*0.4, grit, coarse*0.6);
  bed *= 0.74+0.52*tex;

  // Clasts in the coarse beds: little pale pebbles.
  float cl=fbm(vec2(p.x*28.0+id*13.0, s*26.0));
  bed += coarse*smoothstep(0.60,0.82,cl)*0.28*(bed+0.06);

  // --- bedding planes ------------------------------------------------------
  float w=min(fwidth(s),0.08);
  float dl=(0.5-abs(f-0.5))/max(w,1e-4);
  float plane=1.0-smoothstep(0.0,1.4,dl);
  // Every 5th plane is a sequence boundary: heavier.
  float ds=(0.5-abs(fract(s*0.2)-0.5))*5.0/max(w,1e-4);
  float major=1.0-smoothstep(0.0,2.6,ds);

  vec3 ink=mix(u_shadow,vec3(0.0),0.30);
  vec3 col=bed;

  // --- relief --------------------------------------------------------------
  // Hard beds stand proud of the face and throw a shadow onto the softer bed
  // beneath them. Without this the section is a stack of flat stripes.
  float r2u=hash11((id+1.0)*3.3-7.9);
  float hardU=step(0.68,r2u)*1.0 + (1.0-step(0.68,r2u))*(1.0-step(r2u,0.26))*0.35;
  float hard=coarse*1.0 + (1.0-coarse)*(1.0-dark)*0.35;
  // Bright ledge lip just under a plane, deep shade under an overhanging bed.
  col*=0.80+0.34*smoothstep(0.0,0.30,f)*(1.0-smoothstep(0.55,0.95,f));
  col*=1.0-0.50*hardU*smoothstep(0.62,0.99,f);
  col*=0.90+0.22*hard;

  col=mix(col, ink, clamp(plane*0.75+major*0.45,0.0,1.0));

  // --- jointing ------------------------------------------------------------
  // Near-vertical cracks cut across the beds. They are the single strongest
  // cue that this is a rock face and not a striped textile.
  float jx=p.x*1.35+0.28*sin(y*1.3)+0.9*(fbm(vec2(p.x*0.35,y*0.22))-0.5);
  float jw=max(fwidth(jx),1e-4);
  float jseg=floor(jx);
  float jr=hash11(jseg*5.1+2.3);
  float jd=(0.5-abs(fract(jx)-0.5))/jw;
  // Each joint only exists over a band of the section, and its own strength.
  float jband=smoothstep(0.0,0.5,sin(y*0.55+jr*6.28)+0.25);
  float joint=(1.0-smoothstep(0.0,2.2,jd))*step(0.42,jr)*jband;
  col=mix(col, ink*1.1, joint*0.80);
  // A thin lit lip on one side of every crack, so it reads as an open fissure.
  float jlip=(1.0-smoothstep(1.5,4.0,jd))*step(0.42,jr)*jband*(1.0-joint);
  col+=bed*jlip*0.22;

  // --- fault zone ----------------------------------------------------------
  // Crushed rock along the fault plane: bleached, brecciated, no bedding.
  float fz=1.0-smoothstep(0.0,0.09,faultD);
  vec3 brec=mix(bed, palette(clamp(pc+0.06,0.0,1.0))*0.85, 0.5);
  brec*=0.62+0.50*vnoise(vec2(p.x*90.0,y*90.0));
  col=mix(col, brec, fz*0.65);
  col=mix(col, ink, (1.0-smoothstep(0.0,0.014,faultD))*0.7);
  // Thin bright rim on the sequence boundaries: broken rock catching light.
  col+=palette(clamp(pc+0.2,0.0,1.0))*major*0.14;

  // Weathering: broad dark/light staining across the whole face, plus streaks
  // running down the cliff from the harder ledges.
  float stain=fbm(p*0.45+vec2(0.0,0.3));
  col*=0.72+0.52*stain;
  float streak=fbm(vec2(p.x*7.0, p.y*0.5));
  col*=0.90+0.18*streak;

  // Cliff relief: harder beds stand proud, so the face has soft vertical shade.
  float relief=0.5+0.5*sin(s*6.2831);
  col*=0.94+0.12*relief*(0.3+0.7*coarse);

  col=mix(u_back, col, 0.94);

  vec2 vc=uv-0.5; vc.x*=asp;
  col*=1.0-dot(vc,vc)*0.34;

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
	name: 'pat-ter-strata',
	description: 'geological cross-section: folded sediment beds, faults, laminations and clasts',
	vertexShader,
	fragmentShader
});
