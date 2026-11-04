// The КАСТА logotype, extruded into a gold monument that rises letter by letter
// and turns toward the pointer. The emblem spins like a coin.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const LOGO_W = 372, LOGO_H = 42;
// x ranges of the glyphs in the source logo (К А С Т А + emblem)
const GLYPHS = [[0, 63], [64, 128], [129, 193], [194, 258], [259, 322], [335, 373]];

export async function initHero(host, { reduced, renderer: shared }) {
  const canvas = host.querySelector('canvas');
  const svgText = await fetch(host.dataset.svg).then(r => r.text());

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.03).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(18, 1, 10, 6000);

  // ---- geometry from the real logo ----
  const parsed = new SVGLoader().parse(svgText);
  const shapes = [];
  parsed.paths.forEach(p => SVGLoader.createShapes(p).forEach(s => shapes.push(s)));
  const buckets = GLYPHS.map(() => []);
  shapes.forEach(s => {
    const pts = s.getPoints();
    let minX = Infinity, maxX = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
    const cx = (minX + maxX) / 2;
    const k = GLYPHS.findIndex(([a, b]) => cx >= a && cx < b);
    buckets[k < 0 ? 0 : k].push(s);
  });

  const face = new THREE.MeshPhysicalMaterial({ color: 0xd8b66e, metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 1.15 });
  const side = new THREE.MeshPhysicalMaterial({ color: 0x9c7c3e, metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });
  const emblemFace = new THREE.MeshPhysicalMaterial({ color: 0xe6c47c, metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.4 });

  const tilt = new THREE.Group();        // pointer + scroll rotation
  const flip = new THREE.Group();        // svg is y-down
  flip.scale.set(1, -1, 1);
  flip.position.set(-LOGO_W / 2, LOGO_H / 2, 0);
  tilt.add(flip);
  scene.add(tilt);

  const letters = [];
  buckets.forEach((group, k) => {
    if (!group.length) return;
    const isEmblem = k === GLYPHS.length - 1;
    const geo = new THREE.ExtrudeGeometry(group, {
      depth: isEmblem ? 7 : 11,
      bevelEnabled: true, bevelThickness: 1.6, bevelSize: 0.75, bevelSegments: 5,
      curveSegments: 18,
    });
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geo, isEmblem ? [emblemFace, side] : [face, side]);
    mesh.position.copy(c);
    mesh.userData = { home: c.clone(), k, isEmblem };
    flip.add(mesh);
    letters.push(mesh);
  });

  // ---- light: a key that follows the pointer, a slow sweep, a cool rim ----
  const key = new THREE.PointLight(0xfff1d6, 2.2, 0, 0);
  key.position.set(0, 40, 260);
  scene.add(key);
  const sweep = new THREE.SpotLight(0xffffff, 0, 0, 0.35, 0.6, 0);
  sweep.position.set(-400, 120, 420);
  sweep.target.position.set(0, 0, 0);
  scene.add(sweep, sweep.target);
  const rim = new THREE.DirectionalLight(0x50adbe, 0.9);
  rim.position.set(260, -160, -120);
  scene.add(rim);

  // ---- layout: logo fills the content width of the box ----
  // On a tall box (a phone) the emblem leaves the line and stands large above the word.
  const emblem = letters.find(m => m.userData.isEmblem);
  const EMBLEM_STACK_SCALE = 5.2;
  let stacked = false;
  if (emblem) {
    const eh = emblem.geometry.boundingBox.max.y - emblem.geometry.boundingBox.min.y;
    emblem.userData.stackHome = new THREE.Vector3(LOGO_W / 2, -(20 + eh * EMBLEM_STACK_SCALE / 2), emblem.userData.home.z);
    emblem.userData.stackShift = -(20 + eh * EMBLEM_STACK_SCALE) / 2 + LOGO_H / 2;
  }
  let W = 1, H = 1;
  const resize = () => {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const m = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--m')) || 24;
    const frac = (W - m * 2) / W;               // share of width the logo should take
    const want = (LOGO_W + 2) / (frac * 0.985);   // world width visible at the front face
    const zFront = 12.6;                          // extrude depth + bevel
    const dist = zFront + want / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    stacked = !!emblem && W / H < 1.7;
    // world y = flip.y − svg y: centre the word, or the emblem-over-word stack
    flip.position.y = stacked ? emblem.userData.stackShift : LOGO_H / 2;
    camera.position.set(0, 0, dist);
    camera.near = dist / 10; camera.far = dist * 10;
    camera.updateProjectionMatrix();
    key.position.z = dist * 0.45;
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // ---- input ----
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduced) {
    addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }
  let scrollP = 0;
  const onScroll = () => {
    const r = host.closest('.hero').getBoundingClientRect();
    scrollP = THREE.MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- the rise ----
  const t0 = performance.now() + 150;
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const easeBack = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  let visible = true, running = false, last = performance.now();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;

    letters.forEach((m, i) => {
      const local = reduced ? 1 : THREE.MathUtils.clamp((t - i * 0.09) / 1.1, 0, 1);
      const e = easeOut(local);
      const h = (stacked && m.userData.isEmblem) ? m.userData.stackHome : m.userData.home;
      // stands up from lying flat, rising out of the floor
      m.position.set(h.x, h.y + (1 - e) * 46, h.z - (1 - e) * 30);
      m.rotation.x = (1 - easeBack(local)) * -1.25;
      if (m.userData.isEmblem) {
        m.rotation.y = reduced ? 0 : (t > 1.2 ? (t - 1.2) * 0.9 : 0);
        m.scale.setScalar((0.4 + 0.6 * e) * (stacked ? EMBLEM_STACK_SCALE : 1));
      }
    });

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    tilt.rotation.y = pointer.x * 0.22;
    tilt.rotation.x = pointer.y * 0.12 + scrollP * 0.55;
    tilt.position.z = -scrollP * 120;
    tilt.position.y = scrollP * 18;

    key.position.x = pointer.x * 220;
    key.position.y = -pointer.y * 80 + 30;

    // a light passes over the monument every few seconds
    const sw = reduced ? 0.5 : ((t * 0.12) % 1);
    sweep.position.x = -700 + sw * 1400;
    sweep.intensity = reduced ? 0 : Math.sin(sw * Math.PI) * 4.5;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  renderer.compile(scene, camera);
  start();
  requestAnimationFrame(() => host.classList.add('is-3d'));
  return { renderer };
}
