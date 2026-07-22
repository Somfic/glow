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

// Terrain used by the march: deliberately only two octaves. A raymarched
// heightfield pays for every octave 40+ times per pixel, so the third octave
// is added only once, at the hit point, as shading detail.
float terr(vec2 c){
  float h=0.62*vnoise(c*0.33)+0.30*vnoise(m2*c*0.83+3.1);
  h=(h-0.46)*2.35;
  // A trough down the middle of the flight path keeps the near field open.
  h-=0.55*exp(-c.x*c.x*0.045);
  return h;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  float asp=u_resolution.x/u_resolution.y;
  vec2 sp=vec2((uv.x-0.5)*asp, uv.y-0.5);

  float t=u_time;
  float fov=mix(1.35,0.70,clamp((u_folds-2.0)/16.0,0.0,1.0));

  vec3 ro=vec3(0.0, 1.35+0.10*sin(t*0.07), t*0.55);
  vec3 rd=normalize(vec3(sp.x, sp.y-0.055, fov));
  // u_rotation banks the camera.
  rd.xy=rot(radians(u_rotation-52.0)*0.25)*rd.xy;

  // Fixed-count march, no break: derivatives of the hit point stay valid and
  // the cost is constant across the frame.
  float dist=0.45, dt=0.155;
  float prevD=dist, prevDiff=ro.y+rd.y*dist-terr((ro+rd*dist).xz);
  float hitD=-1.0;
  for(int i=0;i<34;i++){
    dist+=dt; dt*=1.115;
    vec3 pos=ro+rd*dist;
    float diff=pos.y-terr(pos.xz);
    if(diff<0.0 && hitD<0.0){
      hitD=mix(prevD, dist, clamp(prevDiff/max(prevDiff-diff,1e-4),0.0,1.0));
    }
    prevD=dist; prevDiff=diff;
  }
  float far=dist;

  // ---- sky ---------------------------------------------------------------
  // Calm sky: mostly the background colour, with a single low band of palette
  // glow sitting on the horizon. A full-strength palette gradient up here
  // fights whatever text the hero section puts over it.
  float sky=clamp(rd.y*3.2,0.0,1.0);
  vec3 glow=palette(0.62);
  glow=mix(glow/(max(max(glow.r,glow.g),glow.b)+1e-4), vec3(1.0), 0.25);
  vec3 skyC=u_back*(0.85+0.55*(1.0-sky));
  skyC+=glow*pow(clamp(1.0-abs(rd.y)*5.0,0.0,1.0),3.0)*0.16;
  skyC+=glow*pow(clamp(1.0-abs(rd.y)*22.0,0.0,1.0),2.0)*0.14;

  vec3 col=skyC;

  // Everything below runs unconditionally: fwidth/dFdx must not sit inside a
  // branch that differs across the 2x2 quad, or the grid falls apart along the
  // silhouette. The sky/terrain choice is a mix at the very end instead.
  {
    float d=max(hitD,0.001);
    vec3 hp=ro+rd*d;

    float detail=vnoise(hp.xz*2.1);
    float hgt=clamp(hp.y*0.42+0.45,0.0,1.0);

    // Grid: unit cells in world space, antialiased with fwidth. Cells fade out
    // once they shrink below a pixel, so the far field never moires.
    vec2 gc=hp.xz;
    vec2 gw=max(fwidth(gc),1e-4);
    vec2 gf=abs(fract(gc-0.5)-0.5)/(gw*0.85);
    float line=1.0-clamp(min(gf.x,gf.y),0.0,1.0);
    float dense=clamp(1.0-(max(gw.x,gw.y)-0.16)/0.34,0.0,1.0);
    line*=dense;

    // Contour rings on the same surface: elevation isolines crossing the grid.
    float ec=hp.y*2.2;
    float ew=max(fwidth(ec),1e-4);
    float cline=(1.0-clamp((0.5-abs(fract(ec)-0.5))/(ew*0.9),0.0,1.0))
                *clamp(1.0-(ew-0.30)/0.60,0.0,1.0);

    // Surface normal from the hit point derivatives -> the fill is shaded, so
    // the wire does not float on a flat slab.
    vec3 nrm=normalize(vec3(-dFdx(hp.y)/max(abs(dFdx(hp.x))+abs(dFdx(hp.z)),1e-3),
                            1.0,
                            -dFdy(hp.y)/max(abs(dFdy(hp.x))+abs(dFdy(hp.z)),1e-3)));
    nrm=normalize(nrm);
    vec3 L=normalize(vec3(cos(t*0.03+1.2),0.55,sin(t*0.03+1.2)));
    float diff=clamp(dot(nrm,L)*0.5+0.5,0.0,1.0);

    vec3 fill=mix(u_shadow, palette(0.10+hgt*0.45), 0.42)*(0.28+0.55*diff);
    fill*=0.88+0.24*detail;

    // Wire colour stays in a narrow, bright part of the ramp: sampling the
    // whole palette per-cell made the mesh look like randomly coloured string.
    vec3 wireC=mix(palette(clamp(0.38+hgt*0.42,0.0,1.0)), vec3(1.0), 0.14);
    vec3 surf=fill;
    surf=mix(surf, wireC*0.55, cline*0.55);
    surf=mix(surf, wireC*1.35+0.05, line*0.85);
    // Wires glow a little into the fill.
    surf+=wireC*line*0.35;

    float fog=1.0-exp(-pow(d*0.030,1.7));
    surf=mix(surf, skyC, clamp(fog,0.0,1.0));
    col=mix(skyC, surf, step(0.0,hitD));
  }

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
	name: 'pat-ter-wire',
	description: 'raymarched wireframe landscape: world-space grid + isolines over lit terrain, slow flight',
	vertexShader,
	fragmentShader
});
