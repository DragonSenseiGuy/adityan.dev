/* ============================================================
   shader-bg.js — animated WebGL hero background
   Uses the "prism" variant: prismatic glass shards + glow.
   Other variants remain in VARIANTS for reference and can be
   previewed via ?shader=<name>. Theme-aware, toned down so
   foreground text stays readable, reduced-motion safe.
   ============================================================ */

(() => {
  const GLSL_HEAD = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dark;

float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
float noise(vec2 p){
  vec2 ip=floor(p),u=fract(p);
  u=u*u*(3.0-2.0*u);
  float r=mix(mix(rand(ip),rand(ip+vec2(1.,0.)),u.x),
              mix(rand(ip+vec2(0.,1.)),rand(ip+vec2(1.,1.)),u.x),u.y);
  return r*r;
}
float fbm(vec2 x){
  float v=0.,a=.3;
  mat2 rot=mat2(.8776,.4794,-.4794,.8776);
  for(int i=0;i<3;i++){v+=a*noise(x);x=rot*x*2.+vec2(100.);a*=.4;}
  return v;
}
`;

  const VARIANTS = {
    aurora: GLSL_HEAD + `
float th(float x){float e=exp(2.*clamp(x,-8.,8.));return (e-1.)/(e+1.);}
void main(){
  vec2 p=(gl_FragCoord.xy-u_res*.5)/u_res.y*mat2(6.,-4.,4.,6.);
  float f=2.+fbm(p+vec2(u_time*3.,0.))*.5;
  float sum=0.,hue=0.;
  for(float i=0.;i<24.;i++){
    vec2 v=p+cos(i*i+(u_time+p.x*.08)*.025+i*vec2(13.,11.))*3.5;
    float tail=fbm(v+vec2(u_time*.5,i))*.3*(1.-i/24.);
    float c=exp(sin(i*i+u_time*.8))/length(max(v,vec2(v.x*f*.015,v.y*1.5)));
    c*=(1.+tail*.8)*smoothstep(0.,1.,i/24.)*.6;
    sum+=c;
    hue+=c*sin(i*.35+u_time*.3);
  }
  float a=th(pow(sum/55.,1.6));
  hue=clamp(hue/max(sum,1e-4)*.5+.5,0.,1.);
  vec3 accentD=mix(vec3(.24,.46,.98),vec3(.45,.75,1.),hue);
  vec3 accentL=mix(vec3(.14,.35,.85),vec3(.38,.6,.98),hue);
  vec3 bgD=vec3(.047,.047,.055);
  vec3 bgL=vec3(.98,.98,.985);
  vec3 col=mix(mix(bgL,accentL,a*.45),mix(bgD,accentD,a*.9),u_dark);
  gl_FragColor=vec4(col,1.);
}`,

    silk: GLSL_HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  vec2 q=uv*2.-1.;
  q.x*=u_res.x/u_res.y;
  float t=u_time*.35;
  float w1=sin(q.x*2.2+t*1.2)*.35+cos(q.y*1.8-t*.7)*.25;
  float w2=sin(q.x*3.4-t*.9+2.)*.28+cos(q.y*2.6+t*.6+1.)*.22;
  float w3=sin((q.x+q.y)*1.6+t*1.5+4.)*.3;
  float band=.5+.5*sin((w1+w2+w3)*3.14159+t*.4);
  band=smoothstep(.1,.95,band);
  vec3 tintD=mix(vec3(.055,.08,.16),vec3(.2,.4,.85),band);
  vec3 colD=mix(vec3(.047,.047,.055),tintD,.4);
  vec3 tintL=mix(vec3(.9,.93,1.),vec3(.7,.8,.99),band);
  vec3 colL=mix(vec3(.98,.98,.985),tintL,.65);
  gl_FragColor=vec4(mix(colL,colD,u_dark),1.);
}`,

    orbs: GLSL_HEAD + `
float blob(vec2 uv,vec2 c,float r){return smoothstep(r,0.,length(uv-c));}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 q=vec2(uv.x*aspect,uv.y);
  float t=u_time*.25;
  vec2 c1=vec2(aspect*(.74+.06*sin(t*.9)),.7+.08*cos(t*.7));
  vec2 c2=vec2(aspect*(.22+.08*cos(t*.6+2.)),.42+.07*sin(t*.8+1.));
  vec2 c3=vec2(aspect*(.55+.1*sin(t*.5+4.)),.12+.06*cos(t*.9+3.));
  float b1=blob(q,c1,.6),b2=blob(q,c2,.5),b3=blob(q,c3,.45);
  vec3 colL=vec3(.98,.98,.985);
  colL=mix(colL,vec3(.64,.76,1.),b1*.65);
  colL=mix(colL,vec3(.8,.87,1.),b2*.6);
  colL=mix(colL,vec3(.86,.82,.98),b3*.5);
  vec3 colD=vec3(.047,.047,.055);
  colD=mix(colD,vec3(.12,.29,.72),b1*.8);
  colD=mix(colD,vec3(.09,.18,.45),b2*.7);
  colD=mix(colD,vec3(.24,.19,.52),b3*.5);
  vec3 col=mix(colL,colD,u_dark);
  col+=(rand(gl_FragCoord.xy)-.5)*.03;
  gl_FragColor=vec4(col,1.);
}`,

    // ---- Orbs variation 1: metaball fusion (orbs merge & split) ----
    fusion: GLSL_HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 q=vec2(uv.x*aspect,uv.y);
  float t=u_time*.28;
  float f=0.;
  for(int i=0;i<6;i++){
    float fi=float(i);
    vec2 c=vec2(
      aspect*(.5+.34*sin(t*(.5+fi*.12)+fi*1.7)),
      .5+.34*cos(t*(.42+fi*.1)+fi*2.3));
    float r=.12+.03*sin(fi*2.1+t);
    vec2 d=q-c;
    f+=r*r/dot(d,d);
  }
  float body=smoothstep(.85,1.15,f);
  float rim=smoothstep(.9,1.05,f)*(1.-smoothstep(1.05,1.3,f));
  vec3 accD=mix(vec3(.16,.4,.95),vec3(.42,.28,.9),uv.y);
  vec3 colD=mix(vec3(.047,.047,.055),accD,body*.85);
  colD+=rim*vec3(.4,.6,1.)*.55;
  vec3 accL=mix(vec3(.55,.68,1.),vec3(.72,.62,.98),uv.y);
  vec3 colL=mix(vec3(.98,.98,.985),accL,body*.7);
  colL=mix(colL,vec3(.3,.45,.95),rim*.3);
  vec3 col=mix(colL,colD,u_dark);
  col+=(rand(gl_FragCoord.xy)-.5)*.02;
  gl_FragColor=vec4(col,1.);
}`,

    // ---- Orbs variation 2: additive bokeh glow ----
    glow: GLSL_HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 q=vec2(uv.x*aspect,uv.y);
  float t=u_time*.22;
  vec3 glow=vec3(0.);
  for(int i=0;i<9;i++){
    float fi=float(i);
    vec2 c=vec2(
      aspect*(.5+.4*sin(t*(.3+fi*.06)+fi*2.4)),
      .5+.4*cos(t*(.26+fi*.05)+fi*1.3));
    float d=length(q-c)+.001;
    float halo=exp(-d*d*6.5);
    float core=.02/(d*d+.02);
    vec3 tint=mix(vec3(.22,.52,1.),vec3(.55,.34,1.),fract(fi*.137));
    glow+=tint*(halo*.5+core*.12);
  }
  vec3 colD=vec3(.04,.04,.05)+glow;
  vec3 colL=vec3(.98,.98,.985)-clamp(glow,0.,1.)*vec3(.34,.27,.11);
  vec3 col=mix(colL,colD,u_dark);
  col+=(rand(gl_FragCoord.xy)-.5)*.02;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`,

    // ---- Orbs variation 3: depth-of-field parallax field ----
    depth: GLSL_HEAD + `
float orb(vec2 q,vec2 c,float r,float soft){
  return 1.-smoothstep(r*(1.-soft),r,length(q-c));
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 q=vec2(uv.x*aspect,uv.y);
  float t=u_time;
  vec3 colD=vec3(.047,.047,.055);
  vec3 colL=vec3(.98,.98,.985);
  for(int i=0;i<10;i++){
    float fi=float(i);
    float depth=fract(fi*.31+.15);        // 0 = far, 1 = near
    float r=mix(.28,.06,depth);           // far orbs large, near small
    float speed=mix(.02,.09,depth);       // near drifts faster (parallax)
    float soft=mix(1.,.4,depth);          // far very blurry, near crisper
    float x=fract(fi*.618+t*speed);
    vec2 c=vec2(x*aspect*1.2-.1,.5+.4*sin(fi*2.4+t*speed*.5));
    float m=orb(q,c,r,soft);
    float hue=fract(fi*.19);
    vec3 tD=mix(vec3(.13,.3,.7),vec3(.28,.2,.55),hue);
    vec3 tL=mix(vec3(.6,.72,1.),vec3(.78,.7,.98),hue);
    colD=mix(colD,tD,m*mix(.22,.7,depth));
    colL=mix(colL,tL,m*mix(.18,.5,depth));
  }
  vec3 col=mix(colL,colD,u_dark);
  col+=(rand(gl_FragCoord.xy)-.5)*.02;
  gl_FragColor=vec4(col,1.);
}`,

    // ---- Orbs variation 4: prismatic glass shards + glow + sparkle curve ----
    prism: GLSL_HEAD + `
float rot_h(float s){return fract(sin(s*12.9898)*43758.5453);}
vec2 rot2(vec2 p,float a){float s=sin(a),c=cos(a);return vec2(p.x*c-p.y*s,p.x*s+p.y*c);}
float sdTri(vec2 p,vec2 p0,vec2 p1,vec2 p2){
  vec2 e0=p1-p0,e1=p2-p1,e2=p0-p2;
  vec2 v0=p-p0,v1=p-p1,v2=p-p2;
  vec2 q0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.);
  vec2 q1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.);
  vec2 q2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
  float s=sign(e0.x*e2.y-e0.y*e2.x);
  vec2 d=min(min(vec2(dot(q0,q0),s*(v0.x*e0.y-v0.y*e0.x)),
                 vec2(dot(q1,q1),s*(v1.x*e1.y-v1.y*e1.x))),
                 vec2(dot(q2,q2),s*(v2.x*e2.y-v2.y*e2.x)));
  return -sqrt(d.x)*sign(d.y);
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  vec2 q=vec2(uv.x*aspect,uv.y);
  float t=u_time*.15;
  float aa=1.6/u_res.y;

  // --- build the rich blue composition once, map to theme at the end ---
  vec3 col=mix(vec3(.05,.10,.42),vec3(.12,.32,.88),uv.y);

  // soft light blooms (the Glow layer)
  vec3 bloom=vec3(0.);
  for(int i=0;i<4;i++){
    float fi=float(i);
    vec2 c=vec2(aspect*(.5+.36*sin(t*(.5+fi*.2)+fi*2.)),
               .5+.36*cos(t*(.4+fi*.15)+fi*1.5));
    float d=length(q-c);
    vec3 tint=mix(vec3(.35,.6,1.),vec3(.7,.9,1.),fract(fi*.31));
    bloom+=tint*exp(-d*d*4.5);
  }
  col+=bloom*.5;

  // translucent angular shards
  for(int i=0;i<5;i++){
    float seed=float(i)*3.14+1.;
    float h1=rot_h(seed),h2=rot_h(seed+7.),h3=rot_h(seed+13.);
    vec2 o=vec2(aspect*(.14+.72*h1),.1+.8*h2)+.06*vec2(sin(t+seed),cos(t*1.1+seed));
    float sc=.26+.34*h3;
    float a0=t*(.15+.22*h1)+seed;
    vec2 v0=o+rot2(vec2(sc,0.),a0);
    vec2 v1=o+rot2(vec2(-sc*.5,sc*(.7+.6*h2)),a0);
    vec2 v2=o+rot2(vec2(-sc*(.4+.4*h3),-sc*.9),a0);
    float sd=sdTri(q,v0,v1,v2);
    float fill=1.-smoothstep(0.,aa,sd);
    float edge=smoothstep(.011,0.,abs(sd));
    vec3 sTint=mix(vec3(.45,.6,1.),vec3(.72,.84,1.),h2);
    col=mix(col,sTint,fill*.16);
    col=mix(col,vec3(.9,.96,1.),edge*.55);
  }

  // thin glowing curve
  float cy=.52+.06*sin(q.x*1.8+t*.6)+.03*sin(q.x*4.+t);
  float cd=abs(q.y-cy);
  col=mix(col,vec3(.9,.97,1.),smoothstep(.0035,0.,cd)*.6);

  // sparkle diamond nodes riding the curve
  for(int i=0;i<2;i++){
    float fi=float(i);
    float sx=aspect*(.28+.42*fi)+.05*sin(t*.7+fi*2.);
    float sy=.52+.06*sin(sx*1.8+t*.6)+.03*sin(sx*4.+t);
    float dd=abs(q.x-sx)+abs(q.y-sy);
    col=mix(col,vec3(1.),smoothstep(.016,0.,dd));
    col+=vec3(.6,.8,1.)*exp(-dd*40.)*.5;
  }

  col+=(rand(gl_FragCoord.xy)-.5)*.02;
  col=clamp(col,0.,1.);

  // light mode: wash heavily toward near-white so dark ink stays readable
  vec3 light=mix(vec3(.97,.98,1.),col,.13);
  // dark mode: dim & desaturate hard so light text stays readable
  vec3 dark=mix(vec3(.03,.04,.09),col,.42);
  col=mix(light,dark,u_dark);
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`
  };

  const DEFAULT_VARIANT = 'prism';
  const container = document.querySelector('.shader-bg');
  if (!container) return;
  const canvas = container.querySelector('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { container.remove(); return; }

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function pickVariant() {
    const fromUrl = new URLSearchParams(location.search).get('shader');
    if (fromUrl && VARIANTS[fromUrl]) return fromUrl;
    return DEFAULT_VARIANT;
  }

  let program = null;
  let uniforms = {};

  function compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function useVariant(name) {
    const vs = compile(gl.VERTEX_SHADER,
      'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    const fs = compile(gl.FRAGMENT_SHADER, VARIANTS[name]);
    if (!vs || !fs) return false;
    if (program) gl.deleteProgram(program);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);
    const loc = gl.getAttribLocation(program, 'p');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uniforms = {
      res: gl.getUniformLocation(program, 'u_res'),
      time: gl.getUniformLocation(program, 'u_time'),
      dark: gl.getUniformLocation(program, 'u_dark')
    };
    return true;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(container.clientWidth * dpr);
    const h = Math.round(container.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  const start = performance.now();
  let rafId = 0;
  let visible = true;

  function drawFrame() {
    resize();
    gl.uniform2f(uniforms.res, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, (performance.now() - start) / 1000);
    gl.uniform1f(uniforms.dark, darkQuery.matches ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop() {
    drawFrame();
    rafId = requestAnimationFrame(loop);
  }

  function play() {
    cancelAnimationFrame(rafId);
    if (motionQuery.matches) { drawFrame(); return; }
    if (visible && !document.hidden) loop();
  }

  function pause() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  let current = pickVariant();
  if (!useVariant(current)) { container.remove(); return; }

  window.addEventListener('resize', () => { if (!rafId) drawFrame(); });
  darkQuery.addEventListener('change', () => { if (!rafId) drawFrame(); });
  motionQuery.addEventListener('change', play);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? play() : pause();
  }).observe(container);

  play();
})();
