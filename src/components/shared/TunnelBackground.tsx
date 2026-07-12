/**
 * TunnelBackground — Three.js wormhole tunnel as animated page background.
 *
 * Adapted from the "Recreate this Three.js scene: Tunnel" spec with
 * user-requested modifications:
 *   - Slower overall motion (all speed values reduced ~40%)
 *   - More static/ambient flow (gentler swirl, subtler noise)
 *   - Soft rendering (reduced bloom strengths, lower brightness)
 *
 * Integrates with the settings store for intensity (0–100) and theme.
 * Respects prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSettingsStore } from "../../store/useSettingsStore";

// ─── GLSL: 3D Simplex Noise (injected into tunnel vertex shader) ─────────
const SNOISE_GLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// ─── Tunnel vertex shader ─────────────────────────────────────────────────
const TUNNEL_VERTEX = `
uniform float uTime; uniform float uSize; uniform float uSwirl; uniform float uScale;
uniform vec3 uColLow; uniform vec3 uColHigh;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
varying float vFade; varying vec3 vColor;
${SNOISE_GLSL}
void main() {
  vec3 wp = vec3(position.x * 7.0, 0.0, position.z * 25.0);
  wp.x += position.y * 6.0;
  float wn = snoise(vec3(wp.x * 0.08, wp.z * 0.08, uTime * 0.15)) * 2.0;
  wn += snoise(vec3(wp.x * 0.16, wp.z * 0.16, uTime * 0.3)) * 0.8;

  float tunnelR = 12.0;
  float currentSliceRadius = sqrt(max(0.0, 17.64 - position.z * position.z));
  float maxSliceWidth = 9.2195 * currentSliceRadius;
  float normalizedX = wp.x / (maxSliceWidth + 0.001);
  float tunnelAngle = normalizedX * 3.14159265;

  float jitterAngle = snoise(vec3(position.x * 15.0, position.y * 15.0, uTime * 0.1)) * 0.35;
  float jitterZ = snoise(vec3(position.y * 15.0, position.z * 15.0, uTime * 0.1)) * 4.0;
  float ambientSwirl = snoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.2)) * 3.0;
  tunnelAngle += jitterAngle + ambientSwirl * uSwirl;

  float dynamicR = tunnelR - wn;
  vec3 tunnelPos = vec3(dynamicR * sin(tunnelAngle), -dynamicR * cos(tunnelAngle), wp.z + jitterZ);

  vec3 finalPos = tunnelPos * uScale;
  vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
  vec3 toP = modelPosition.xyz - uCursor;
  float cd = length(toP);
  float fall = smoothstep(uRepelRadius, 0.0, cd);
  modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
  vec4 mvPosition = viewMatrix * modelPosition;

  float colMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
  vColor = mix(uColLow, uColHigh, clamp(colMix, 0.0, 1.0));
  vFade = 1.0;

  gl_PointSize = uSize * (10.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// ─── Tunnel fragment shader ───────────────────────────────────────────────
const TUNNEL_FRAGMENT = `
uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
varying float vFade; varying vec3 vColor;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float ll = length(xy);
  if (ll > 0.5) discard;
  float a = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
}
`;

// ─── Atmosphere mote vertex shader ────────────────────────────────────────
const ATMO_VERTEX = `
attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
varying float vA;
vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
  p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
  p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
  return cos(p+vec3(1,2,4)); }
void main(){
  vec3 v = position*4.0 + warp(position, uTime)*1.2;
  vec4 mv = modelViewMatrix * vec4(v, 1.0);
  float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
  vA = farF * nearF;
  gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

// ─── Atmosphere mote fragment shader ──────────────────────────────────────
const ATMO_FRAGMENT = `
uniform vec3 uColor; varying float vA;
void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
  float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.6); }
`;

// ─── Final composite pass fragment shader ─────────────────────────────────
const FINAL_FRAGMENT = `
uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
varying vec2 vUv;
vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
  pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
  pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
  pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
  return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
void main(){
  vec2 uv = 2.*vUv - 1.;
  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
  vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
  flame *= smoothstep(0.25, 1., abs(uv.y));
  float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
  vec3 bg = uBg * (1.0 - 0.4 * length(uv));
  vec3 halo = texture2D(haloTexture, vUv).xyz;
  gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────
const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function hexToVec3(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

// ─── Component ────────────────────────────────────────────────────────────
export function TunnelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const intensity = useSettingsStore((s) => s.backgroundIntensity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanupFns: (() => void)[] = [];

    // ─── Slower / Softer Modifications ────────────────────────────────────
    const SPEED_MULT = 0.6;
    const SWIRL_BASE = 0.25;
    const SPIN_BASE = 0.04;
    const BLOOM_TORUS_STR = 0.15;
    const BLOOM_MAIN_STR = 0.4;
    const ATMO_SPEED = 0.6;
    const BRIGHTNESS = 0.35;
    const OPACITY = 1.2;
    const POINT_SIZE = 4.5;
    const PARALLAX = 0.08;
    const STEER = 0.4;

    // ─── 1. Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    cleanupFns.push(() => renderer.dispose());

    // ─── 2. Scene ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05080A");
    scene.fog = new THREE.Fog(0x05080A, 0, 15);

    // ─── 3. Camera ────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      400,
    );
    camera.position.set(0, 0, 20);
    const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);

    // ─── 4. Import addons ─────────────────────────────────────────────────
    let EffectComposer: any, RenderPass: any, UnrealBloomPass: any, ShaderPass: any;
    let GammaCorrectionShader: any, CopyShader: any;

    Promise.all([
      import("three/addons/postprocessing/EffectComposer.js").then(m => EffectComposer = m.EffectComposer),
      import("three/addons/postprocessing/RenderPass.js").then(m => RenderPass = m.RenderPass),
      import("three/addons/postprocessing/UnrealBloomPass.js").then(m => UnrealBloomPass = m.UnrealBloomPass),
      import("three/addons/postprocessing/ShaderPass.js").then(m => ShaderPass = m.ShaderPass),
      import("three/addons/shaders/GammaCorrectionShader.js").then(m => GammaCorrectionShader = m.GammaCorrectionShader),
      import("three/addons/shaders/CopyShader.js").then(m => CopyShader = m.CopyShader),
    ]).catch(() =>
      // Fallback: try three/examples/jsm/
      Promise.all([
        import("three/examples/jsm/postprocessing/EffectComposer.js").then(m => EffectComposer = m.EffectComposer),
        import("three/examples/jsm/postprocessing/RenderPass.js").then(m => RenderPass = m.RenderPass),
        import("three/examples/jsm/postprocessing/UnrealBloomPass.js").then(m => UnrealBloomPass = m.UnrealBloomPass),
        import("three/examples/jsm/postprocessing/ShaderPass.js").then(m => ShaderPass = m.ShaderPass),
        import("three/examples/jsm/shaders/GammaCorrectionShader.js").then(m => GammaCorrectionShader = m.GammaCorrectionShader),
        import("three/examples/jsm/shaders/CopyShader.js").then(m => CopyShader = m.CopyShader),
      ]),
    ).then(() => {
      if (disposed) return;

      // ─── 5. Tunnel points ───────────────────────────────────────────────
      const tunnelGeo = new THREE.SphereGeometry(4.2, 200, 600);
      const tunnelUniforms = {
        uTime: { value: 0 },
        uAppear: { value: 0 },
        uColLow: { value: hexToVec3("#10151A") },
        uColHigh: { value: hexToVec3("#4C8DFF") },
        uOpacity: { value: OPACITY },
        uSize: { value: POINT_SIZE },
        uBrightness: { value: BRIGHTNESS },
        uSwirl: { value: SWIRL_BASE },
        uScale: { value: 0.17 },
        uCursor: { value: new THREE.Vector3() },
        uRepelRadius: { value: 2.4 },
        uRepelStrength: { value: 0.8 },
        uActivity: { value: 0 },
      };

      const tunnelMat = new THREE.ShaderMaterial({
        uniforms: tunnelUniforms,
        vertexShader: TUNNEL_VERTEX,
        fragmentShader: TUNNEL_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const tunnelPoints = new THREE.Points(tunnelGeo, tunnelMat);
      tunnelPoints.frustumCulled = false;
      tunnelPoints.layers.set(LAYERS.ENTIRE_SCENE);

      const group = new THREE.Group();
      group.add(tunnelPoints);
      scene.add(group);

      // ─── 6. Atmosphere motes ─────────────────────────────────────────────
      const N = 300;
      const positions = new Float32Array(N * 3);
      const sizes = new Float32Array(N);
      const seeds = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        positions[i * 3] = 2 * Math.random() - 1;
        positions[i * 3 + 1] = 2 * Math.random() - 1;
        positions[i * 3 + 2] = 2 * Math.random() - 1;
        sizes[i] = 24 * (0.4 + Math.random());
        seeds[i] = Math.random();
      }

      const atmoGeo = new THREE.BufferGeometry();
      atmoGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      atmoGeo.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
      atmoGeo.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));

      const atmoColor = hexToVec3("#4C8DFF");
      const atmoUniforms = {
        uTime: { value: 0 },
        uColor: { value: atmoColor },
        uRes: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
      };

      const atmoMat = new THREE.ShaderMaterial({
        uniforms: atmoUniforms,
        vertexShader: ATMO_VERTEX,
        fragmentShader: ATMO_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });

      const atmoPoints = new THREE.Points(atmoGeo, atmoMat);
      atmoPoints.frustumCulled = false;
      atmoPoints.layers.set(LAYERS.ENTIRE_SCENE);
      scene.add(atmoPoints);

      // ─── 7. Post-processing ─────────────────────────────────────────────
      // Separate RenderPass per composer to avoid render target conflicts
      const renderSceneA = new RenderPass(scene, camera);
      const renderSceneB = new RenderPass(scene, camera);
      const renderSceneC = new RenderPass(scene, camera);

      // Torus composer (tunnel points + subtle bloom)
      let torusComposer = new EffectComposer(renderer);
      torusComposer.renderToScreen = false;
      torusComposer.addPass(renderSceneA);
      torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
      torusComposer.addPass(new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        BLOOM_TORUS_STR,
        0.2,
        0,
      ));
      torusComposer.addPass(new ShaderPass(CopyShader));

      // Bloom composer (stronger bloom for glow)
      let bloomComposer = new EffectComposer(renderer);
      bloomComposer.renderToScreen = false;
      bloomComposer.addPass(renderSceneB);
      bloomComposer.addPass(new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        BLOOM_MAIN_STR,
        0.6,
        0,
      ));
      bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

      // Final composite pass
      const finalPassUniforms = {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        torusTexture: { value: null },
        bloomTexture: { value: null },
        haloTexture: { value: null },
        uBg: { value: hexToVec3("#05080A") },
        uFlameA: { value: hexToVec3("#4C8DFF") },
        uFlameB: { value: hexToVec3("#2563EB") },
        uFlameAmt: { value: 0.2 },
      };

      const finalPass = new ShaderPass({
        uniforms: finalPassUniforms,
        vertexShader: `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: FINAL_FRAGMENT,
      });

      let finalComposer = new EffectComposer(renderer);
      finalComposer.addPass(renderSceneC);
      finalComposer.addPass(finalPass);

      // ─── 8. State ───────────────────────────────────────────────────────
      const appearStart = performance.now();
      const pointerWorld = new THREE.Vector3();
      let mouseTarget = new THREE.Vector2();
      let mouse = new THREE.Vector2();
      let scrollTarget = 0;
      let scrollSmooth = 0;
      let scrollCurrent = 0;
      let rollPhase = 0;
      let t0 = performance.now() / 1000;
      let pointerActive = false;
      let pointerLastMove = 0;
      let pointerActivity = 0;
      let animateId = 0;
      let currentIntensity = intensity;

      // ─── 9. Mouse handlers ──────────────────────────────────────────────
      const onMouseMove = (e: MouseEvent) => {
        mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseTarget.y = -(e.clientY / window.innerHeight) * 2 - 1;
        pointerActive = true;
        pointerLastMove = performance.now();
      };
      const onMouseOut = () => { pointerActive = false; };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseout", onMouseOut);
      cleanupFns.push(() => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseout", onMouseOut);
      });

      // ─── 10. Pointer → world void ───────────────────────────────────────
      const _ndc = new THREE.Vector3();
      const _dir = new THREE.Vector3();
      const _tgt = new THREE.Vector3();

      function updatePointerWorld() {
        _tgt.set(0, 0, 0);
        if (pointerActive) {
          _ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
          _dir.copy(_ndc).sub(camera.position).normalize();
          const dn = _dir.z;
          if (Math.abs(dn) > 1e-4) {
            const tt = -camera.position.z / dn;
            if (tt > 0 && Number.isFinite(tt)) {
              _tgt.copy(camera.position).addScaledVector(_dir, tt);
            }
          }
        }
        pointerWorld.lerp(_tgt, 0.12);
        const idle = (performance.now() - pointerLastMove) / 1000;
        pointerActivity +=
          (((pointerActive && idle < 3) ? 1 : 0) - pointerActivity) * 0.06;
      }

      // ─── 11. Per-frame scene update ─────────────────────────────────────
      function updateScene(scroll: number, m: THREE.Vector2) {
        const t = performance.now() / 1000;
        const dt = Math.min(0.05, t - t0);
        t0 = t;
        const st = t * SPEED_MULT;

        tunnelUniforms.uTime.value = st;

        camera.position.set(m.x * PARALLAX, m.y * PARALLAX, 20 - scroll * 0.5);
        camera.lookAt(m.x * STEER, m.y * STEER, camera.position.z - 12);

        updatePointerWorld();

        const swirlTarget = SWIRL_BASE + scroll * 0.5;
        tunnelUniforms.uSwirl.value = Lerp(
          tunnelUniforms.uSwirl.value as number,
          swirlTarget,
          0.02,
        );

        rollPhase += dt * (SPIN_BASE + scroll * 0.01);
        group.rotation.z = rollPhase;

        tunnelUniforms.uCursor.value.copy(pointerWorld);
        tunnelUniforms.uActivity.value = pointerActivity;

        const elapsed = (performance.now() - appearStart) / 1000;
        tunnelUniforms.uAppear.value = Math.max(
          0,
          Math.min(1, (elapsed - 0.2) / 1.4),
        );

        atmoUniforms.uTime.value = st * ATMO_SPEED * 8.0;
        atmoPoints.position.copy(camera.position);

        finalPassUniforms.iTime.value = st;

        atmoUniforms.uRes.value.set(
          window.innerWidth * renderer.getPixelRatio(),
          window.innerHeight * renderer.getPixelRatio(),
        );
      }

      // ─── 12. Render loop ────────────────────────────────────────────────
      function render() {
        if (disposed) return;
        animateId = requestAnimationFrame(render);

        scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.10);
        scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.06);

        const ambientScroll = Math.sin(performance.now() / 1000 * 0.08) * 0.05;
        mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06);
        mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06);

        // When intensity is 0, just clear and skip
        if (currentIntensity < 1) {
          renderer.clear();
          return;
        }

        updateScene(scrollCurrent + ambientScroll, mouse);

        // Multi-composer rendering — each with its own RenderPass, safe to share camera
        camera.layers.set(LAYERS.TORUS_SCENE);
        torusComposer.render();

        camera.layers.set(LAYERS.BLOOM_SCENE);
        bloomComposer.render();

        // Pass textures to final composite
        finalPassUniforms.torusTexture.value =
          torusComposer.renderTarget1.texture;
        finalPassUniforms.bloomTexture.value =
          bloomComposer.renderTarget1.texture;

        camera.layers.set(LAYERS.ENTIRE_SCENE);
        finalComposer.render();
      }

      render();

      // ─── 13. Resize handler ─────────────────────────────────────────────
      const onResize = () => {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const ndpr = Math.min(window.devicePixelRatio, 2);

        renderer.setPixelRatio(ndpr);
        renderer.setSize(ww, wh, false);

        camera.aspect = ww / wh;
        camera.updateProjectionMatrix();

        torusComposer.setPixelRatio(ndpr);
        torusComposer.setSize(ww, wh);
        bloomComposer.setPixelRatio(ndpr);
        bloomComposer.setSize(ww, wh);
        finalComposer.setPixelRatio(ndpr);
        finalComposer.setSize(ww, wh);

        atmoUniforms.uRes.value.set(ww * ndpr, wh * ndpr);
      };

      window.addEventListener("resize", onResize);
      cleanupFns.push(() => window.removeEventListener("resize", onResize));

      // ─── 14. Reduced motion ─────────────────────────────────────────────
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handleMotionChange = (e: MediaQueryListEvent) => {
        if (e.matches) cancelAnimationFrame(animateId);
        else render();
      };
      motionQuery.addEventListener("change", handleMotionChange);
      cleanupFns.push(() =>
        motionQuery.removeEventListener("change", handleMotionChange),
      );

      if (motionQuery.matches) {
        updateScene(0, mouse);
        renderer.render(scene, camera);
      }

      // ─── 15. Settings subscriptions ────────────────────────────────────
      const unsubIntensity = useSettingsStore.subscribe((state) => {
        currentIntensity = state.backgroundIntensity;
        const newTheme = state.theme;
        const isLight = newTheme === "light";
        const bgColor = isLight ? "#F2EFE8" : "#05080A";
        scene.background = new THREE.Color(bgColor);
        (scene.fog as THREE.Fog).color.set(bgColor);
        finalPassUniforms.uBg.value = hexToVec3(
          isLight ? "#EFEBE3" : "#05080A",
        );
        // Update tunnel colors — warm volcanic palette
        tunnelUniforms.uColLow.value = hexToVec3(isLight ? "#D7CDC4" : "#10151A");
        tunnelUniforms.uColHigh.value = hexToVec3(isLight ? "#C98A68" : "#4C8DFF");
        // Update flame colors — warm ember glow
        finalPassUniforms.uFlameA.value = hexToVec3(isLight ? "#9F4C2F" : "#4C8DFF");
        finalPassUniforms.uFlameB.value = hexToVec3(isLight ? "#C98A68" : "#2563EB");
        // Update atmosphere motes — warm copper
        atmoUniforms.uColor.value = hexToVec3(isLight ? "#C98A68" : "#4C8DFF");
      });

      cleanupFns.push(unsubIntensity);

      // ─── Store cleanup for dispose ──────────────────────────────────────
      cleanupFns.push(() => {
        cancelAnimationFrame(animateId);
      });
    }).catch((err) => {
      console.warn("[TunnelBackground] Failed to initialize:", err);
    });

    return () => {
      disposed = true;
      // Run all cleanup functions in reverse order
      for (let i = cleanupFns.length - 1; i >= 0; i--) {
        try { cleanupFns[i](); } catch { /* ignore cleanup errors */ }
      }
      cleanupFns = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
