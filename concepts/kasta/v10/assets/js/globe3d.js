// The Greatest Hits route on a dotted globe. Picking a date turns the globe to that city.
import * as THREE from 'three';
import { LAND } from './land.js';

const R = 1;
const toVec = (lat, lon, r = R) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
};

const slerp = (a, b, ang, t) => {
  if (ang < 1e-4) return a.clone();
  const s = Math.sin(ang);
  return a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(b.clone().multiplyScalar(Math.sin(t * ang) / s));
};

export function initGlobe(host, { cities, reduced, getActive }) {
  const canvas = host.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 5.0);

  const globe = new THREE.Group();
  scene.add(globe);

  // body
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 48), new THREE.MeshBasicMaterial({ color: 0x0b0b0b })));

  // land as dots
  const dotGeo = new THREE.CircleGeometry(0.0072, 6);
  const dots = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x6f6f6f }), LAND.length / 2);
  const o = new THREE.Object3D();
  for (let i = 0, k = 0; i < LAND.length; i += 2, k++) {
    const v = toVec(LAND[i], LAND[i + 1], R * 1.001);
    o.position.copy(v);
    o.lookAt(v.clone().multiplyScalar(2));
    o.updateMatrix();
    dots.setMatrixAt(k, o.matrix);
  }
  globe.add(dots);

  // the route, in tour order
  const gold = new THREE.MeshBasicMaterial({ color: 0xc4a664 });
  const arcs = [];
  for (let i = 0; i < cities.length - 1; i++) {
    const a = toVec(cities[i].lat, cities[i].lon), b = toVec(cities[i + 1].lat, cities[i + 1].lon);
    const ang = a.angleTo(b);
    const lift = Math.min(0.085, 0.015 + ang * 0.06);
    const pts = [];
    for (let s = 0; s <= 48; s++) {
      const t = s / 48;
      // great-circle slerp, lifted in the middle
      const p = slerp(a, b, ang, t);
      p.multiplyScalar(R * (1.004 + Math.sin(Math.PI * t) * lift));
      pts.push(p);
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, ang > 0.3 ? 0.0042 : 0.0034, 6, false);
    const mesh = new THREE.Mesh(geo, gold);
    geo.setDrawRange(0, 0);
    mesh.userData.count = geo.index.count;
    globe.add(mesh);
    arcs.push(mesh);
  }

  // cities
  const teal = new THREE.MeshBasicMaterial({ color: 0x50adbe });
  const pins = cities.map(c => {
    const v = toVec(c.lat, c.lon, R * 1.003);
    const pin = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), teal);
    pin.position.copy(v); pin.lookAt(v.clone().multiplyScalar(2));
    globe.add(pin);
    return pin;
  });
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x50adbe, transparent: true, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 40), ringMat);
  globe.add(ring);
  const activeDot = new THREE.Mesh(new THREE.CircleGeometry(0.026, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  globe.add(activeDot);

  // ---- orientation ----
  const target = { x: 0, y: 0 };
  const cur = { x: 0.5, y: -0.8 };
  let idleSince = performance.now(), active = getActive();
  const aim = i => {
    const c = cities[i];
    target.x = THREE.MathUtils.degToRad(c.lat) - 0.12;
    // shortest way round
    let ty = -THREE.MathUtils.degToRad(c.lon);
    while (ty - cur.y > Math.PI) ty -= Math.PI * 2;
    while (ty - cur.y < -Math.PI) ty += Math.PI * 2;
    target.y = ty;
    const v = toVec(c.lat, c.lon, R * 1.006);
    ring.position.copy(v); ring.lookAt(v.clone().multiplyScalar(2));
    activeDot.position.copy(toVec(c.lat, c.lon, R * 1.005)); activeDot.lookAt(v.clone().multiplyScalar(2));
  };
  aim(active);
  addEventListener('kasta:gig', e => { active = e.detail.i; aim(active); idleSince = performance.now(); dragV = 0; });

  // drag to spin; tap a city to pick it
  let drag = null, dragV = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  host.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, cx: cur.x, cy: cur.y, moved: 0 };
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved < 4) return;
    const k = 2.6 / host.clientWidth;
    const ny = drag.cy + dx * k;
    dragV = ny - cur.y;
    cur.y = target.y = ny;
    cur.x = target.x = THREE.MathUtils.clamp(drag.cx + dy * k, -1.1, 1.1);
    idleSince = performance.now();
  });
  const up = e => {
    if (!drag) return;
    if (drag.moved < 4) {
      const r = host.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let best = -1, bestD = 0.09;
      const hitBody = ray.intersectObject(globe.children[0])[0];
      if (hitBody) {
        pins.forEach((p, i) => {
          const d = p.getWorldPosition(new THREE.Vector3()).distanceTo(hitBody.point);
          if (d < bestD) { bestD = d; best = i; }
        });
      }
      if (best >= 0) dispatchEvent(new CustomEvent('kasta:globe-pick', { detail: { i: best } }));
    }
    drag = null;
  };
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', () => { drag = null; });

  // ---- size ----
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // ---- loop ----
  let visible = false, running = false, drawStart = -1, last = performance.now();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && drawStart < 0) drawStart = performance.now();
    if (visible) start();
  }, { threshold: 0.15 });
  io.observe(host);

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    // draw the route leg by leg
    const t = reduced ? 99 : (now - drawStart) / 1000;
    arcs.forEach((m, i) => {
      const p = THREE.MathUtils.clamp((t - i * 0.12) / 0.5, 0, 1);
      m.geometry.setDrawRange(0, Math.floor(m.userData.count * p / 6) * 6);
    });

    if (!drag) {
      if (Math.abs(dragV) > 0.0005) { target.y += dragV; dragV *= 0.92; }
      else if (!reduced && now - idleSince > 7000) target.y += dt * 0.12; // drift when left alone
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
    }
    globe.rotation.set(cur.x, cur.y, 0, 'XYZ');

    const pulse = reduced ? 0.5 : (now / 1400) % 1;
    ring.scale.setScalar(1 + pulse * 1.6);
    ringMat.opacity = 1 - pulse;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });

  host.classList.add('is-3d');
}
