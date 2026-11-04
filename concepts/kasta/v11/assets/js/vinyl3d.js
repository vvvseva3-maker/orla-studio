// The release as an object: the sleeve with its real cover, the record sliding out onto a platter,
// and a tonearm that drops when the music plays and tracks inward over the preview, as on a real deck.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function grooveTexture(coverImg) {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const cx = S / 2, R = S / 2;
  g.fillStyle = '#060606'; g.beginPath(); g.arc(cx, cx, R, 0, Math.PI * 2); g.fill();
  // grooves, with the gaps between tracks
  const gaps = [0.52, 0.61, 0.69, 0.78, 0.86];
  for (let r = R * 0.36; r < R * 0.97; r += 1.6) {
    const f = r / R;
    const gap = gaps.some(x => Math.abs(f - x) < 0.006);
    const l = gap ? 4 : 22 + Math.floor(Math.random() * 16);
    g.strokeStyle = `rgb(${l},${l},${l})`;
    g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke();
  }
  // run-out and lead-in
  g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(cx, cx, R * 0.36, 0, Math.PI * 2); g.fill();
  // label: the cover itself
  g.save(); g.beginPath(); g.arc(cx, cx, R * 0.33, 0, Math.PI * 2); g.clip();
  g.drawImage(coverImg, cx - R * 0.33, cx - R * 0.33, R * 0.66, R * 0.66);
  g.restore();
  g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cx, R * 0.018, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function initVinyl(host, { releases, reduced, getIndex }) {
  const canvas = host.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.02).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0.15, 0.04, 4.05);
  camera.lookAt(0.15, 0, 0);

  const imgs = await Promise.all(releases.map(r => loadImg(r.img)));
  const covers = imgs.map(i => { const t = new THREE.Texture(i); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; });
  const grooves = imgs.map(grooveTexture);

  const startIdx = getIndex();   // a record may already be chosen before the scene starts
  const rig = new THREE.Group();
  scene.add(rig);

  // sleeve
  const coverMat = new THREE.MeshStandardMaterial({ map: covers[startIdx], roughness: 0.55, metalness: 0 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.014), [edge, edge, edge, edge, coverMat, edge]);
  sleeve.position.x = -0.22;
  rig.add(sleeve);

  // record
  const discTop = new THREE.MeshPhysicalMaterial({ map: grooves[startIdx], roughness: 0.32, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.18 });
  const discSide = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.008, 160), [discSide, discTop, discTop]);
  disc.rotation.x = Math.PI / 2;
  const discPivot = new THREE.Group();
  discPivot.position.set(-0.22, 0, -0.02);
  discPivot.add(disc);
  rig.add(discPivot);

  // platter the record slides onto
  const OUT_X = 0.36;
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.018, 128),
    new THREE.MeshStandardMaterial({ color: 0x121212, metalness: 0.7, roughness: 0.38 }));
  platter.rotation.x = Math.PI / 2;
  platter.position.set(OUT_X, 0, -0.04);
  rig.add(platter);

  // tonearm: pivot at the top right of the platter, arm along local +x, swung by rotation.z
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.22 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xc4a664, metalness: 1, roughness: 0.3 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.4, roughness: 0.5 });
  const PIVOT = new THREE.Vector2(OUT_X + 0.56, 0.36), ARM_L = 0.62;
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.03, 48), goldM);
  armBase.rotation.x = Math.PI / 2; armBase.position.set(PIVOT.x, PIVOT.y, -0.02);
  rig.add(armBase);
  const arm = new THREE.Group();
  arm.position.set(PIVOT.x, PIVOT.y, 0.06);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 32), chrome);
  cap.rotation.x = Math.PI / 2;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, ARM_L, 16), chrome);
  tube.rotation.z = -Math.PI / 2; tube.position.x = ARM_L / 2;
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.075, 32), darkM);
  weight.rotation.z = -Math.PI / 2; weight.position.x = -0.085;
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.036, 0.014), darkM);
  shell.position.x = ARM_L + 0.02; shell.rotation.z = 0.38;
  const shellEdge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.016), goldM);
  shellEdge.position.set(ARM_L + 0.05, 0.014, 0); shellEdge.rotation.z = 0.38;
  arm.add(cap, tube, weight, shell, shellEdge);
  rig.add(arm);
  // the angles that put the needle on the outer and inner groove, found once
  const needleR = th => Math.hypot(PIVOT.x + Math.cos(th) * ARM_L - OUT_X, PIVOT.y + Math.sin(th) * ARM_L);
  const REST = -Math.PI / 2 + 0.12;
  const angleFor = r => { for (let th = REST; th > -Math.PI; th -= 0.002) if (needleR(th) <= r) return th; return -2.4; };
  const TH_OUT = angleFor(0.445), TH_IN = angleFor(0.2);
  let armTh = REST, armZ = 0.1, spinV = 0;
  arm.rotation.z = REST;

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-1.5, 2, 3); scene.add(key);
  const rimV = new THREE.DirectionalLight(0x50adbe, 1.2); rimV.position.set(2.5, 1.2, -1.5); scene.add(rimV);
  const warm = new THREE.PointLight(0xc4a664, 5, 0, 0); warm.position.set(1.4, 0.4, 1.6); scene.add(warm);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // scroll: the record slides out as the section arrives
  let out = 0;
  const section = host.closest('section');
  const onScroll = () => {
    const r = section.getBoundingClientRect();
    const p = 1 - (r.top + r.height * 0.25) / innerHeight;
    out = THREE.MathUtils.clamp(p * 1.6, 0, 1);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // switching releases: record goes back in, cover changes, record comes out
  let shown = startIdx, swapT = -1, pendingIdx = shown;
  addEventListener('kasta:release', e => { pendingIdx = e.detail.i; swapT = performance.now(); });

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  host.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; });

  let visible = false, running = false, last = performance.now(), spin = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(host);

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    let slide = out;
    if (swapT > 0) {
      const s = (now - swapT) / (reduced ? 1 : 700);
      if (s < 0.5) slide = out * (1 - s * 2);
      else {
        if (shown !== pendingIdx) {
          shown = pendingIdx;
          coverMat.map = covers[shown]; coverMat.needsUpdate = true;
          discTop.map = grooves[shown]; discTop.needsUpdate = true;
        }
        slide = out * Math.min(1, (s - 0.5) * 2);
        if (s >= 1) swapT = -1;
      }
    }
    const e = slide < 0.5 ? 4 * slide ** 3 : 1 - Math.pow(-2 * slide + 2, 3) / 2;
    discPivot.position.x = -0.22 + e * (OUT_X + 0.22);

    // the deck follows the player: 33⅓ rpm while playing, a slow drift when idle
    const au = window.__kastaAudio || { playing: false, progress: 0, level: 0, r: -1 };
    const onDeck = au.playing && au.r === shown && swapT < 0 && e > 0.97;
    const targetV = reduced ? 0 : onDeck ? 3.49 : 0.3 * e;
    spinV += (targetV - spinV) * Math.min(1, dt * (onDeck ? 2.4 : 1.2));
    spin += dt * spinV;
    disc.rotation.y = -spin;
    const thT = onDeck ? TH_OUT + (TH_IN - TH_OUT) * Math.min(1, au.progress) : REST;
    armTh += (thT - armTh) * Math.min(1, dt * (onDeck ? 3 : 4));
    armZ += ((onDeck && Math.abs(armTh - thT) < 0.03 ? 0.03 : 0.1) - armZ) * Math.min(1, dt * 6);
    arm.rotation.z = armTh;
    arm.position.z = armZ;
    warm.intensity = 5 + au.level * 10;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    rig.rotation.y = -0.16 + pointer.x * 0.2;
    rig.rotation.x = 0.08 + pointer.y * 0.1;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });

  host.classList.add('is-3d');
}
