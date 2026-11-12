// Speed Master concept: the motorcycle parked on top of the name.
// three.js 0.160.0 via the import map in index.html. The page works without this file.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BASE_ANGLE = -0.45;   // three-quarter view, front wheel towards the reader
const FOV = 22;

// Viewport y of the cap line (top of the capitals) of the first line of `el`.
function capTop(el) {
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  const m = ctx.measureText('SPEED MASTER');
  const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
  const fa = m.fontBoundingBoxAscent ?? fs * 0.9, fd = m.fontBoundingBoxDescent ?? fs * 0.25;
  const top = el.getBoundingClientRect().top;
  return top + (lh - (fa + fd)) / 2 + fa - (m.actualBoundingBoxAscent ?? fs * 0.7);
}

export async function initHero({ stage, plinth, src, reduced, paint }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'hero-gl';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 200);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.5, 7, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 20 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x6b6200, 0.55));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    .setDRACOLoader(new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/'));
  const gltf = await loader.loadAsync(src);
  const model = gltf.scene;
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;
      m.envMapIntensity = 1.15;
      if (paint && paint.match.test(m.name || '')) {
        m.color = new THREE.Color(paint.color);
        if ('metalness' in m) { m.metalness = paint.metalness ?? 0.35; m.roughness = paint.roughness ?? 0.32; }
        if (m.map && paint.dropMap) m.map = null;
        m.needsUpdate = true;
      }
    });
  });

  // Normalise: length along x, 2 units long, wheels on y = 0, centred.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) model.rotation.y = Math.PI / 2;
  box.setFromObject(model); box.getSize(size);
  model.scale.multiplyScalar(2 / size.x);
  box.setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  model.position.x -= c.x; model.position.z -= c.z; model.position.y -= box.min.y;
  box.setFromObject(model); box.getSize(size);
  const aspect = size.y / size.x;          // height / length

  const turn = new THREE.Group();
  const lift = new THREE.Group();
  lift.add(model); turn.add(lift); scene.add(turn);
  turn.rotation.y = BASE_ANGLE;

  stage.appendChild(canvas);

  let W = 1, H = 1;
  function frame() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    const floorY = capTop(plinth) - r.top + Math.max(2, W * 0.002); // tyres press into the cap line a hair
    const room = Math.max(80, floorY - (W < 700 ? 8 : 20));
    const lenPx = Math.min(W * (W < 700 ? 0.95 : 0.6), (room * 0.94) / (aspect * 1.08));
    const ppu = lenPx / 2;
    const d = H / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * ppu);
    const midY = size.y * 0.5;
    const elev = THREE.MathUtils.degToRad(3);
    camera.aspect = W / H;
    camera.position.set(0, midY + d * Math.sin(elev), d * Math.cos(elev));
    camera.lookAt(0, midY, 0);
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // put the lower of the two tyre contact points on the cap line
    const up = new THREE.Vector3(0, 1, 0);
    const row = Math.max(...[0.41, -0.41].map((f) => {
      const q = new THREE.Vector3(f * size.x, 0, 0).applyAxisAngle(up, BASE_ANGLE).project(camera);
      return ((1 - q.y) / 2) * H;
    }));
    const shiftX = W < 700 ? 0 : -W * 0.04;
    camera.setViewOffset(W, H, shiftX, row - floorY, W, H);
    camera.updateProjectionMatrix();
  }

  // Motion: settle onto the name, slow sway, scroll turns it, drag spins it.
  let visible = true, dragging = false, dragX = 0, spin = 0, spinV = 0, scrollP = 0;
  const t0 = performance.now();
  const settle = reduced ? 1 : 0;
  let settleT = settle;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; dragX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragX; dragX = e.clientX;
    spinV = dx * 0.006; spin += spinV;
    if (reduced) { turn.rotation.y = BASE_ANGLE + spin; render(); }
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const hero = stage.closest('section') || stage;
  const onScroll = () => {
    const r = hero.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  };
  addEventListener('scroll', onScroll, { passive: true });

  function render() {
    renderer.render(scene, camera);
  }
  function tick(now) {
    if (!visible || document.hidden) { raf = 0; return; }
    const t = (now - t0) / 1000;
    if (!dragging) { spinV *= 0.94; spin += spinV; }
    settleT = Math.min(1, settleT + 1 / 55);
    const e = 1 - Math.pow(1 - settleT, 3);
    lift.position.y = (1 - e) * 0.35;
    lift.rotation.z = (1 - e) * 0.04;
    turn.rotation.y = BASE_ANGLE + (reduced ? 0 : 0.22 * Math.sin(t * 0.32) + scrollP * 1.1) + spin;
    render();
    raf = requestAnimationFrame(tick);
  }
  let raf = 0;
  const start = () => { if (!raf && !reduced) raf = requestAnimationFrame(tick); };

  frame();
  if (reduced) { lift.position.y = 0; render(); }
  new ResizeObserver(() => { frame(); render(); }).observe(stage);
  if (document.fonts) document.fonts.ready.then(() => { frame(); render(); });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  start();
  return { canvas };
}
