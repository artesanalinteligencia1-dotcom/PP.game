/* Paulet video kit — motion helpers shared by every video (inlined into index.html by tools/build.py).
   Everything is seek-safe: tweens on a paused GSAP timeline, no timers, seeded randomness. */
(function () {
  const K = (window.K = {});
  K.col = { bg: "#0b0d10", cream: "#e8e0cc", gold: "#d9b46a", orange: "#f08a3c", cyan: "#36d1ff", grey: "#8a8f98", alarm: "#e0457b", green: "#7fd17a" };
  K.OVERLAP = 0.5;

  K.rng = function (seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  /* Voice cues: c("vo2") = local start of that line in the scene, c.end("vo2"), c.dur = scene length */
  K.cues = function (scene) {
    const s = (window.CUES || {})[scene] || { dur: 10, lines: {} };
    const f = (id, off) => ((s.lines[id] || [0, 0])[0]) + (off || 0);
    f.end = (id, off) => ((s.lines[id] || [0, 0])[1]) + (off || 0);
    f.dur = s.dur;
    return f;
  };

  const $ = (t) => (typeof t === "string" ? Array.from(document.querySelectorAll(t)) : t.length !== undefined && !t.tagName ? Array.from(t) : [t]);

  /* Stroke draw-on for SVG paths/lines/circles */
  K.draw = function (tl, target, at, dur, ease) {
    $(target).forEach((el) => {
      const len = el.getTotalLength ? el.getTotalLength() : 1000;
      tl.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur || 1, ease: ease || "power2.inOut" }, at);
      tl.set(el, { opacity: 0 }, 0); tl.set(el, { opacity: 1 }, Math.max(0.001, at));
    });
  };
  K.fade = function (tl, target, at, dur, y, x) { tl.fromTo(target, { opacity: 0, y: y === undefined ? 16 : y, x: x || 0 }, { opacity: 1, y: 0, x: 0, duration: dur || 0.55, ease: "power3.out" }, at); };
  K.out = function (tl, target, at, dur, y) { tl.to(target, { opacity: 0, y: y === undefined ? -14 : y, duration: dur || 0.4, ease: "power2.in" }, at); };
  K.pop = function (tl, target, at, dur) { tl.fromTo(target, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: dur || 0.5, ease: "back.out(2)" }, at); };
  K.blurIn = function (tl, target, at, dur) { tl.fromTo(target, { opacity: 0, y: 36, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: dur || 0.8, ease: "power4.out" }, at); };
  K.wipe = function (tl, target, at, dur, dir) {
    const from = { right: "inset(0 100% 0 0)", left: "inset(0 0 0 100%)", down: "inset(0 0 100% 0)", up: "inset(100% 0 0 0)" }[dir || "right"];
    tl.fromTo(target, { clipPath: from }, { clipPath: "inset(0 0% 0 0)", duration: dur || 0.8, ease: "power3.inOut" }, at);
  };
  K.grow = function (tl, target, at, dur, origin) { tl.fromTo(target, { scaleX: 0, transformOrigin: origin || "0% 50%" }, { scaleX: 1, duration: dur || 1.1, ease: "power3.out" }, at); };
  K.growY = function (tl, target, at, dur, origin) { tl.fromTo(target, { scaleY: 0, transformOrigin: origin || "50% 100%" }, { scaleY: 1, duration: dur || 1.1, ease: "power3.out" }, at); };
  K.count = function (tl, target, from, to, at, dur, fmt) {
    const el = $(target)[0]; const o = { v: from }; const f = fmt || ((v) => Math.round(v).toLocaleString("en-US"));
    Object.defineProperty(o, "x", { get() { return this.v; }, set(v) { this.v = v; el.textContent = f(v); } });
    tl.fromTo(o, { x: from }, { x: to, duration: dur || 1.4, ease: "power2.out" }, at);
  };
  /* Ken Burns on an <img> (or any element): from/to = {s, x, y} */
  K.kb = function (tl, target, at, dur, from, to) {
    tl.fromTo(target, { scale: from.s || 1, x: from.x || 0, y: from.y || 0, transformOrigin: "50% 50%" }, { scale: to.s || 1, x: to.x || 0, y: to.y || 0, duration: dur, ease: "none" }, at);
  };
  /* Photo frame reveal: wipe + settle; the frame holds an <img> */
  K.photo = function (tl, frame, at, dir) {
    K.wipe(tl, frame, at, 0.9, dir || "right");
    const img = $(frame)[0].querySelector("img"); if (img) tl.fromTo(img, { filter: "brightness(1.6) saturate(.3)" }, { filter: "brightness(1) saturate(1)", duration: 1.2, ease: "power2.out" }, at);
  };
  K.stamp = function (tl, target, at) { tl.fromTo(target, { opacity: 0, scale: 2.4, rotation: -14 }, { opacity: 1, scale: 1, rotation: -8, duration: 0.28, ease: "power4.in" }, at); };
  K.stars = function (svgSel, n, seed, w, h) {
    const svg = $(svgSel)[0]; const r = K.rng(seed || 7); let s = "";
    for (let i = 0; i < (n || 90); i++) s += `<circle cx="${(r() * (w || 1920)).toFixed(0)}" cy="${(r() * (h || 1080)).toFixed(0)}" r="${(0.6 + r() * 1.5).toFixed(1)}" fill="#e8e0cc" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`;
    svg.innerHTML = s;
  };

  /* Scene transitions. Scenes overlap by K.OVERLAP seconds: the incoming scene (higher z-index) enters during
     its first half second while the outgoing one runs its exit across the same window. */
  K.enter = function (tl, stage, kind, o) {
    o = o || {}; const d = o.dur || K.OVERLAP; const el = $(stage)[0];
    if (kind === "whip") tl.fromTo(el, { x: (o.dir || 1) * 1920, filter: "blur(22px)" }, { x: 0, filter: "blur(0px)", duration: d, ease: "power4.out" }, 0);
    else if (kind === "rise") tl.fromTo(el, { y: 1080, filter: "blur(16px)" }, { y: 0, filter: "blur(0px)", duration: d, ease: "power4.out" }, 0);
    else if (kind === "zoom") tl.fromTo(el, { scale: 0.55, opacity: 0, filter: "blur(18px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: d, ease: "power3.out" }, 0);
    else if (kind === "iris") tl.fromTo(el, { clipPath: `circle(0% at ${o.x || 960}px ${o.y || 540}px)` }, { clipPath: `circle(130% at ${o.x || 960}px ${o.y || 540}px)`, duration: d + 0.25, ease: "power2.inOut" }, 0);
    else if (kind === "wipe") {
      tl.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: d, ease: "power3.inOut" }, 0);
      const edge = document.createElement("div"); edge.className = "k-edge"; el.parentNode.appendChild(edge);
      tl.fromTo(edge, { x: 0, opacity: 1 }, { x: 1920, duration: d, ease: "power3.inOut" }, 0); tl.set(edge, { opacity: 0 }, d);
    } else if (kind === "cut") { /* hard cut */ }
    else tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d, ease: "sine.inOut" }, 0);
  };
  K.exit = function (tl, stage, kind, dur, o) {
    o = o || {}; const el = $(stage)[0]; const d = K.OVERLAP;
    if (kind === "whip") tl.to(el, { x: -(o.dir || 1) * 1920, filter: "blur(22px)", duration: d, ease: "power4.in" }, dur - 0.12);
    else if (kind === "rise") tl.to(el, { y: -1080, filter: "blur(16px)", duration: d, ease: "power4.in" }, dur - 0.12);
    else if (kind === "zoom") tl.to(el, { scale: 2.4, filter: "blur(20px) brightness(.6)", duration: d + 0.3, ease: "power3.in", transformOrigin: `${o.x || 960}px ${o.y || 540}px` }, dur - 0.3);
    else if (kind === "dim") tl.to(el, { filter: "brightness(.35)", duration: d, ease: "none" }, dur);
    else if (kind === "fade") tl.to(el, { opacity: 0, duration: d + 0.3, ease: "power2.in" }, dur - 0.3);
  };

  /* ---------- 3D globe (Three.js, NASA Blue Marble / Black Marble) ---------- */
  K.ll = function (lat, lon, r) {
    const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; r = r || 1;
    return new THREE.Vector3(r * Math.cos(a) * Math.cos(b), r * Math.sin(a), -r * Math.cos(a) * Math.sin(b));
  };
  K.globe = function (sel, o) {
    o = o || {};
    THREE.ColorManagement.enabled = false;
    const canvas = $(sel)[0]; const W = canvas.width, H = canvas.height;
    const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(W, H, false); R.setClearColor(0x000000, 0); R.outputColorSpace = THREE.LinearSRGBColorSpace;
    const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(o.fov || 28, W / H, 0.01, 2000);
    const earth = new THREE.Group(), space = new THREE.Group(); scene.add(earth); scene.add(space);
    const uni = { day: { value: null }, night: { value: null }, sun: { value: new THREE.Vector3(1, 0, 0) }, nightAmt: { value: o.nightAmt === undefined ? 1 : o.nightAmt }, dayAmt: { value: 1 } };
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 80), new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.); vP=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }",
      fragmentShader: "uniform sampler2D day; uniform sampler2D night; uniform vec3 sun; uniform float nightAmt; uniform float dayAmt; varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){ vec3 n=normalize(vN); float d=dot(n,normalize(sun)); float k=smoothstep(-0.12,0.22,d)*dayAmt; vec3 dc=texture2D(day,vUv).rgb; vec3 nc=texture2D(night,vUv).rgb*1.7*nightAmt; vec3 col=mix(nc+dc*0.05, dc*(0.38+0.78*max(d,0.)), k); vec3 v=normalize(cameraPosition-vP); float f=pow(clamp(1.-dot(n,v),0.,1.),3.2); col+=vec3(.28,.52,1.)*f*(0.22+0.8*k); gl_FragColor=vec4(col,1.); }",
    }));
    earth.add(body);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 64), new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: "varying vec3 vN; void main(){ float i=pow(max(0.72-dot(vN,vec3(0.,0.,1.)),0.),3.5); gl_FragColor=vec4(.35,.6,1.,1.)*i*1.6; }",
    }));
    scene.add(atm);
    const st = { rot: o.rot || 0, camLat: o.camLat || 0, camLon: o.camLon || 0, dist: o.dist || 4, sunLat: o.sunLat === undefined ? 10 : o.sunLat, sunLon: o.sunLon === undefined ? 40 : o.sunLon, lookX: 0, lookY: 0, roll: 0, nightAmt: uni.nightAmt.value, dayAmt: 1, spaceRot: 0 };
    const g = { scene, cam, earth, space, renderer: R, items: [], batch: false };
    g.draw = function () {
      if (g.batch) return;
      earth.rotation.y = (st.rot * Math.PI) / 180; space.rotation.y = (st.spaceRot * Math.PI) / 180;
      const p = K.ll(st.camLat, st.camLon, st.dist); cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0);
      if (st.roll) cam.rotateZ((st.roll * Math.PI) / 180);
      if (st.lookX || st.lookY) { cam.rotateY((-st.lookX * Math.PI) / 180); cam.rotateX((st.lookY * Math.PI) / 180); }
      cam.updateMatrixWorld();
      uni.sun.value.copy(K.ll(st.sunLat, st.sunLon, 1)); uni.nightAmt.value = st.nightAmt; uni.dayAmt.value = st.dayAmt;
      R.render(scene, cam);
    };
    Object.keys(st).forEach((k) => Object.defineProperty(g, k, { get() { return st[k]; }, set(v) { st[k] = v; g.draw(); } }));
    g.set = function (v) { g.batch = true; Object.assign(g, v); g.batch = false; Object.assign(st, v); g.draw(); };
    const prop = (obj, name, init, apply) => { let val = init; Object.defineProperty(obj, name, { get() { return val; }, set(v) { val = v; apply(v); g.draw(); } }); apply(init); };
    const tube = (pts, closed, width, color, parent, opacity) => {
      const seg = Math.min(1400, pts.length * 2); const rad = 6;
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), seg, width, rad, closed);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity !== undefined, opacity: opacity === undefined ? 1 : opacity }));
      parent.add(m); const h = { mesh: m };
      prop(h, "reveal", 1, (v) => geo.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, v)) * seg) * rad * 6));
      prop(h, "opacity", opacity === undefined ? 1 : opacity, (v) => { m.material.transparent = true; m.material.opacity = v; m.visible = v > 0.001; });
      return h;
    };
    const orbitPos = (u, inc, raan, r) => {
      const a = (u * Math.PI) / 180, i = (inc * Math.PI) / 180, O = (raan * Math.PI) / 180;
      const x = Math.cos(a), y = Math.sin(a) * Math.sin(i), z = -Math.sin(a) * Math.cos(i);
      return new THREE.Vector3(r * (x * Math.cos(O) + z * Math.sin(O)), r * y, r * (-x * Math.sin(O) + z * Math.cos(O)));
    };
    /* Circular orbit in the inertial frame. alt in km. */
    g.orbit = function (q) {
      const r = 1 + q.alt / 6371; const pts = []; const n = q.seg || 180;
      for (let k = 0; k < n; k++) pts.push(orbitPos((k / n) * 360 + (q.from || 0), q.inc || 0, q.raan || 0, r));
      const h = tube(pts, true, q.width || 0.006, q.color || K.col.orange, space, q.opacity);
      h.pos = (u) => orbitPos(u, q.inc || 0, q.raan || 0, r); h.r = r; return h;
    };
    /* Satellite marker riding an orbit: sat.u in degrees */
    g.sat = function (orb, q) {
      q = q || {}; const m = new THREE.Mesh(new THREE.SphereGeometry(q.size || 0.022, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(q.color || "#fff4dc") }));
      space.add(m); const h = { mesh: m }; prop(h, "u", q.u || 0, (v) => m.position.copy(orb.pos(v)));
      prop(h, "scale", 1, (v) => m.scale.setScalar(v)); return h;
    };
    /* Ground track painted on the rotating Earth: orbits = how many revolutions, period in minutes */
    g.track = function (q) {
      const r = 1.004, pts = []; const n = Math.round((q.orbits || 3) * 120); const period = q.period || 99; const rotv = new THREE.Vector3(0, 1, 0);
      for (let k = 0; k <= n; k++) {
        const u = (k / 120) * 360; const t = (u / 360) * period; const p = orbitPos(u + (q.from || 0), q.inc || 98, q.raan || 0, r);
        p.applyAxisAngle(rotv, -(((q.rot0 || 0) * Math.PI) / 180 + (t / 1436) * 2 * Math.PI)); pts.push(p);
      }
      return tube(pts, false, q.width || 0.012, q.color || K.col.orange, earth, q.opacity);
    };
    /* Arc on the surface between two lat/lon points (great circle), lifted by `lift` Earth radii at the middle */
    g.arc = function (a, b, q) {
      q = q || {}; const va = K.ll(a[0], a[1], 1), vb = K.ll(b[0], b[1], 1), pts = []; const n = 60;
      for (let k = 0; k <= n; k++) { const f = k / n; const v = va.clone().lerp(vb, f).normalize().multiplyScalar(1.004 + (q.lift || 0) * Math.sin(Math.PI * f)); pts.push(v); }
      return tube(pts, false, q.width || 0.006, q.color || K.col.orange, earth, q.opacity);
    };
    g.marker = function (lat, lon, q) {
      q = q || {}; const m = new THREE.Mesh(new THREE.SphereGeometry(q.size || 0.016, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(q.color || K.col.gold) }));
      m.position.copy(K.ll(lat, lon, 1.006)); earth.add(m); const h = { mesh: m }; prop(h, "scale", q.scale === undefined ? 1 : q.scale, (v) => { m.scale.setScalar(Math.max(v, 0.0001)); m.visible = v > 0.001; }); return h;
    };
    /* Translucent belt (torus around the equator), radii in Earth radii */
    g.belt = function (q) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(q.R, q.r, 32, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(q.color || "#b06cf0"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = Math.PI / 2; m.scale.z = q.flat || 0.55; space.add(m); const h = { mesh: m };
      prop(h, "opacity", 0, (v) => { m.material.opacity = v; m.visible = v > 0.001; }); return h;
    };
    /* Screen position (px in the canvas) of an Earth-fixed lat/lon at the current state */
    g.screen = function (lat, lon, r) { g.draw(); const v = K.ll(lat, lon, r || 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), (st.rot * Math.PI) / 180).project(cam); return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H]; };
    const loader = new THREE.TextureLoader();
    const load = (u) => new Promise((res) => loader.load(u, (t) => { t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; res(t); }, undefined, () => res(null)));
    g.ready = Promise.all([load(o.day || "assets/kit/earth-day.jpg"), load(o.night || "assets/kit/earth-night.jpg")]).then((t) => { uni.day.value = t[0]; uni.night.value = t[1] || t[0]; g.draw(); });
    window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {}; window.__hf.buildReady["globe-" + (canvas.id || sel)] = g.ready;
    window.addEventListener("hf-seek", () => g.draw());
    g.draw();
    return g;
  };
})();
