// Starts each 3D scene when it is about to be seen. Without WebGL the flat logo,
// the cover image and the plain tour table stay in place.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const hasGL = (() => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
})();

const whenNear = (el, fn, margin = '400px') => {
  if (!el) return;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
};

const safe = p => p.catch(err => console.warn('[kasta 3d]', err));

if (hasGL) {
  const hero = document.querySelector('.monument');
  safe(import('./hero3d.js').then(m => m.initHero(hero, { reduced })));

  whenNear(document.getElementById('globe'), () => safe(import('./globe3d.js').then(m =>
    m.initGlobe(document.getElementById('globe'), {
      cities: window.__kastaGigs || [],
      reduced,
      getActive: () => (window.__kastaActiveGig ? window.__kastaActiveGig() : 0),
    }))));

  let relIndex = 0;
  addEventListener('kasta:release', e => { relIndex = e.detail.i; });
  whenNear(document.getElementById('vinyl'), () => safe(import('./vinyl3d.js').then(m =>
    m.initVinyl(document.getElementById('vinyl'), {
      releases: window.__kastaReleases || [],
      reduced,
      getIndex: () => relIndex,
    }))));
}
