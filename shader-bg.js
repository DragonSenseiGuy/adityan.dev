/* ============================================================
   shader-bg.js — animated WebGL hero background
   Prismatic glass shards + glow. Theme-aware, toned down so
   foreground text stays readable, and reduced-motion safe.
   ============================================================ */

(() => {
  const SHADER_SOURCE = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dark;

float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
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

  const container = document.querySelector('.shader-bg');
  if (!container) return;
  const canvas = container.querySelector('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { container.remove(); return; }

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  function createProgram() {
    const vs = compile(gl.VERTEX_SHADER,
      'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    const fs = compile(gl.FRAGMENT_SHADER, SHADER_SOURCE);
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

  if (!createProgram()) { container.remove(); return; }

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
