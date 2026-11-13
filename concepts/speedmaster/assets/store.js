// Speed Master concept: the stock and the requests live in this browser.
// Seed = assets/stock-seed.js (the dealer's used list). Edits made in /admin go to localStorage,
// uploaded photos to IndexedDB. A live site swaps this file for an API; the pages stay the same.
(() => {
  const KEY = 'sm-stock-v2', REQ = 'sm-requests-v1';
  const ROOT = document.documentElement.dataset.root || '';
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // Lowest licence that can ride it: AM (50 cc, 4 kW), B (125 cc, 11 kW: car licence at 25+, or A1), A2 (35 kW), A.
  // 35.4 rather than 35: listings round 48 cv up to 35.3 kW for bikes sold as A2.
  function lic(b) {
    const cc = +b.cc || 0, kw = +b.kw || 0;
    if (!cc && !kw) return 'A';
    if (cc <= 50 && kw <= 4) return 'AM';
    if (cc <= 125 && kw <= 11) return 'B';
    if (kw && kw <= 35.4) return 'A2';
    return 'A';
  }
  const LIC = { AM: 0, B: 1, A2: 2, A: 3 };

  const seed = () => clone(window.SM_SEED || []);
  const list = () => read(KEY, null) || seed();
  const full = (b) => ({ ...b, lic: lic(b), name: `${b.brand} ${b.model}` });
  const all = () => list().map(full);
  const get = (id) => { const b = list().find((x) => x.id === id); return b ? full(b) : null; };
  const emit = () => dispatchEvent(new CustomEvent('sm:change'));
  const strip = ({ lic: _l, name: _n, ...b }) => b;
  function save(arr) { if (!write(KEY, arr.map(strip))) throw new Error('storage-full'); emit(); }
  function upsert(b) {
    const arr = list(), i = arr.findIndex((x) => x.id === b.id);
    if (i >= 0) arr[i] = { ...arr[i], ...strip(b) }; else arr.unshift(strip(b));
    save(arr);
    return b.id;
  }
  const remove = (id) => save(list().filter((b) => b.id !== id));
  const slug = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function newId(b) {
    const base = slug(`${b.brand} ${b.model} ${b.year || ''}`) || 'mota', ids = new Set(list().map((x) => x.id));
    let id = base, n = 2;
    while (ids.has(id)) id = `${base}-${n++}`;
    return id;
  }

  // Photos: seed photos are files; uploads are "idb:<key>" blobs in IndexedDB.
  let dbp;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('sm-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => db().then((d) => new Promise((res, rej) => {
    const t = d.transaction('p', mode), q = fn(t.objectStore('p'));
    t.oncomplete = () => res(q && q.result);
    t.onerror = () => rej(t.error);
  }));
  const src = (ref) => (!ref || ref.startsWith('idb:') ? '' : /^(https?:|data:|blob:)/.test(ref) ? ref : ROOT + ref);
  const urls = new Map();
  async function photoURL(ref) {
    if (!ref || !ref.startsWith('idb:')) return src(ref);
    if (!urls.has(ref)) {
      const blob = await tx('readonly', (s) => s.get(ref.slice(4))).catch(() => null);
      urls.set(ref, blob ? URL.createObjectURL(blob) : '');
    }
    return urls.get(ref);
  }
  // attributes for an <img>: uploads get a placeholder and are filled in by hydrate()
  const img = (ref) => (ref && ref.startsWith('idb:') ? `src="${BLANK}" data-ph="${ref}"` : `src="${src(ref)}"`);
  function hydrate(root = document) {
    root.querySelectorAll('img[data-ph]').forEach(async (el) => {
      const ref = el.dataset.ph;
      el.removeAttribute('data-ph');
      const u = await photoURL(ref);
      if (u) el.src = u;
    });
  }
  async function addPhoto(file) {
    let blob = file;
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      blob = (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82))) || file;
    } catch (e) { /* keep the original file */ }
    const key = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await tx('readwrite', (s) => s.put(blob, key));
    return 'idb:' + key;
  }

  // Requests sent from the site's forms
  const requests = () => read(REQ, []);
  function addRequest(r) {
    const item = { id: 'r' + Date.now().toString(36), at: new Date().toISOString(), status: 'new', ...r };
    write(REQ, [item, ...requests()]);
    emit();
    return item;
  }
  function setRequest(id, patch) { write(REQ, requests().map((r) => (r.id === id ? { ...r, ...patch } : r))); emit(); }

  function reset() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(REQ); } catch (e) {}
    tx('readwrite', (s) => s.clear()).catch(() => {});
    emit();
  }
  addEventListener('storage', (e) => { if (e.key === KEY || e.key === REQ) emit(); });

  window.SM = { ROOT, all, get, upsert, remove, newId, lic, LIC, src, img, photoURL, hydrate, addPhoto, requests, addRequest, setRequest, reset };
})();
