// Speed Master concept: header, footer, language, opening hours and request forms shared by every page.
(() => {
  document.documentElement.classList.add('js');
  const R = document.documentElement.dataset.root || '';
  const PAGE = document.body.dataset.page || 'home';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SITE = window.SITE = {
    phone: '+351214444116', phoneTxt: '214 444 116', mobileTxt: '926 894 041',
    shop: '+351962892362', shopTxt: '962 892 362',
    whatsapp: '',            // concept: empty. Live site: '351926894041'
    email: 'geral@speedmaster.pt', tz: 'Europe/Lisbon',
    // [open, close] in minutes, Sunday first
    hours: [[], [[540, 780], [870, 1140]], [[540, 780], [870, 1140]], [[540, 780], [870, 1140]], [[540, 780], [870, 1140]], [[540, 780], [870, 1140]], [[540, 780]]],
    model: R + 'assets/moto.glb'
  };

  const T = {
    pt: {
      menu: 'Menu', close: 'Fechar',
      cats: { scooter: 'Scooter', naked: 'Naked', trail: 'Trail', scrambler: 'Scrambler', custom: 'Custom', sport: 'Desportiva' },
      catsP: { all: 'Todos os tipos', scooter: 'Scooters', naked: 'Naked', trail: 'Trail', scrambler: 'Scrambler', custom: 'Custom', sport: 'Desportivas' },
      colors: { white: 'Branco', grey: 'Cinzento', black: 'Preto', blue: 'Azul', red: 'Vermelho', green: 'Verde', yellow: 'Amarelo', orange: 'Laranja', tricolour: 'Tricolor' },
      lic: { all: 'Todas', AM: 'AM', B: 'B', A2: 'A2', A: 'A' },
      licTxt: { AM: 'AM ou B', B: 'B (25+) ou A1', A2: 'A2', A: 'A' },
      licDesc: { AM: 'Scooters até 50 cc', B: 'Até 125 cc com a carta do carro, a partir dos 25 anos', A2: 'Até 35 kW', A: 'Todas, sem limite' },
      onReq: 'Sob consulta', reserved: 'Reservada', sold: 'Vendida',
      year: 'Ano', km: 'Quilómetros', cc: 'Cilindrada', kw: 'Potência', color: 'Cor', licL: 'Carta', type: 'Tipo',
      bikes: (n) => (n === 1 ? '1 mota' : `${n} motas`),
      lede: (n, lo, hi) => `${n} motas usadas em stock, de ${lo} a ${hi} cc. Escolha pela sua carta.`,
      readAll: (n, lo, hi) => `<b>${n} motas</b> em stock, de ${lo} a ${hi} cc.`,
      readLic: (l, n, tot) => (n ? `Com carta ${l} pode conduzir <b>${n} das ${tot}</b> motas.` : `Ainda não há motas para a carta ${l}.`),
      upTo: (p) => `até ${p}`,
      empty: 'Nada neste filtro. Diga-nos o que procura e avisamos quando chegar.',
      sort: { new: 'Mais recentes', cheap: 'Mais baratas', dear: 'Mais caras', km: 'Menos quilómetros' },
      seeAll: (n) => `Ver as ${n} motas`, seeUpTo: (p) => `Ver motas até ${p}`,
      fin: (m) => `ou desde <b>${m}/mês</b>*`,
      finNote: '*Exemplo: entrada de 20%, 48 meses, TAN 9,9%. Não é uma proposta de crédito.',
      ride: 'Marcar test-ride', reserve: 'Reservar', call: 'Ligar',
      photo: (i, n) => `Fotografia ${i} de ${n}`, prev: 'Foto anterior', next: 'Foto seguinte',
      gone: 'Esta mota já não está no stock.', similar: 'Também pode gostar',
      days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      closedDay: 'Fechado', open: (t) => `Aberto agora · fecha às ${t}`, opensAt: (d, t) => `Fechado · abre ${d} às ${t}`,
      today: 'hoje', tomorrow: 'amanhã',
      kinds: { ride: 'Test-ride', reserve: 'Reservar mota', trade: 'Avaliar a minha mota', service: 'Marcar oficina', other: 'Outro' },
      bikeL: { ride: 'Mota para o test-ride', reserve: 'Mota a reservar', trade: 'A sua mota (marca, modelo, ano, km)', service: 'A sua mota', other: 'Mota' },
      msgBike: 'Mota', msgName: 'Nome', msgPhone: 'Telefone', msgDate: 'Dia',
      need: 'Preencha o nome e o telefone.', done: 'Pedido registado',
      concept: 'Conceito: nada foi enviado ao stand. O pedido ficou no painel de demonstração, só neste navegador.',
      seePanel: 'Ver no painel do stand', photos: 'Fotos: speedmaster.pt'
    },
    en: {
      menu: 'Menu', close: 'Close',
      cats: { scooter: 'Scooter', naked: 'Naked', trail: 'Adventure', scrambler: 'Scrambler', custom: 'Custom', sport: 'Sport' },
      catsP: { all: 'All types', scooter: 'Scooters', naked: 'Naked', trail: 'Adventure', scrambler: 'Scrambler', custom: 'Custom', sport: 'Sport' },
      colors: { white: 'White', grey: 'Grey', black: 'Black', blue: 'Blue', red: 'Red', green: 'Green', yellow: 'Yellow', orange: 'Orange', tricolour: 'Tricolour' },
      lic: { all: 'All', AM: 'AM', B: 'B', A2: 'A2', A: 'A' },
      licTxt: { AM: 'AM or B', B: 'B (25+) or A1', A2: 'A2', A: 'A' },
      licDesc: { AM: 'Mopeds up to 50 cc', B: 'Up to 125 cc on a car licence, from age 25', A2: 'Up to 35 kW', A: 'Everything, no limit' },
      onReq: 'Price on request', reserved: 'Reserved', sold: 'Sold',
      year: 'Year', km: 'Mileage', cc: 'Engine', kw: 'Power', color: 'Colour', licL: 'Licence', type: 'Type',
      bikes: (n) => (n === 1 ? '1 bike' : `${n} bikes`),
      lede: (n, lo, hi) => `${n} used bikes in stock, from ${lo} to ${hi} cc. Pick by your licence.`,
      readAll: (n, lo, hi) => `<b>${n} bikes</b> in stock, from ${lo} to ${hi} cc.`,
      readLic: (l, n, tot) => { const a = l[0] === 'A' ? 'an' : 'a'; return n ? `On ${a} ${l} licence you can ride <b>${n} of the ${tot}</b> bikes.` : `No bikes for ${a} ${l} licence yet.`; },
      upTo: (p) => `up to ${p}`,
      empty: 'Nothing in this filter. Tell us what you are after and we will call when it comes in.',
      sort: { new: 'Newest', cheap: 'Cheapest', dear: 'Most expensive', km: 'Lowest mileage' },
      seeAll: (n) => `See all ${n} bikes`, seeUpTo: (p) => `See bikes up to ${p}`,
      fin: (m) => `or from <b>${m}/month</b>*`,
      finNote: '*Example: 20% deposit, 48 months, 9.9% nominal rate. Not a credit offer.',
      ride: 'Book a test ride', reserve: 'Reserve', call: 'Call',
      photo: (i, n) => `Photo ${i} of ${n}`, prev: 'Previous photo', next: 'Next photo',
      gone: 'This bike is no longer in stock.', similar: 'You may also like',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      closedDay: 'Closed', open: (t) => `Open now · closes at ${t}`, opensAt: (d, t) => `Closed · opens ${d} at ${t}`,
      today: 'today', tomorrow: 'tomorrow',
      kinds: { ride: 'Test ride', reserve: 'Reserve a bike', trade: 'Value my bike', service: 'Book the workshop', other: 'Other' },
      bikeL: { ride: 'Bike to test', reserve: 'Bike to reserve', trade: 'Your bike (make, model, year, km)', service: 'Your bike', other: 'Bike' },
      msgBike: 'Bike', msgName: 'Name', msgPhone: 'Phone', msgDate: 'Day',
      need: 'Please fill in your name and phone.', done: 'Request saved',
      concept: 'Concept: nothing was sent to the dealer. The request is in the demo panel, in this browser only.',
      seePanel: 'See it in the dealer panel', photos: 'Photos: speedmaster.pt'
    }
  };
  let lang = 'pt';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && T[q]) localStorage.setItem('sm-lang', q);
    lang = q || localStorage.getItem('sm-lang') || ((navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en');
  } catch (e) {}
  if (!T[lang]) lang = 'pt';
  const t = () => T[lang];
  const loc = () => (lang === 'pt' ? 'pt-PT' : 'en-GB');
  const eur = (v) => new Intl.NumberFormat(loc(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const num = (v) => new Intl.NumberFormat(loc()).format(v);
  const pmt = (price, dep = 0.2, n = 48, tan = 0.099) => { const P = price * (1 - dep), r = tan / 12; return Math.round(P * r / (1 - Math.pow(1 + r, -n))); };

  /* header, phone menu, footer, dock */
  const NAV = ['motas', 'comprar', 'oficina', 'faq', 'contactos'];
  const PT = { '': 'Início', motas: 'Motas', comprar: 'Como comprar', oficina: 'Oficina', faq: 'Perguntas', contactos: 'Contactos' };
  const EN = { '': 'Home', motas: 'Bikes', comprar: 'How to buy', oficina: 'Workshop', faq: 'Questions', contactos: 'Contact' };
  const cur = (k) => k === PAGE || (k === 'motas' && PAGE === 'mota');
  const link = (k, cls = '') => `<a ${cls}href="${R}${k ? k + '/' : ''}" data-en="${EN[k]}"${cur(k) ? ' aria-current="page"' : ''}>${PT[k]}</a>`;
  document.body.insertAdjacentHTML('afterbegin', `
<a class="skip" href="#main" data-en="Skip to content">Saltar para o conteúdo</a>
<div class="rib" role="note"><div class="wrap"><b data-en="Concept">Conceito</b><span data-en="A website proposal for Speed Master by Orla web studio. Not the official site.">Proposta de site para a Speed Master, feita pelo estúdio Orla. Não é o site oficial.</span></div></div>
<header class="bar" id="bar"><div class="wrap">
  <a class="mark" href="${R}">Speed Master</a>
  <nav class="nav" aria-label="Páginas" data-en-aria-label="Pages">${NAV.map((k) => link(k)).join('')}</nav>
  <div class="lang" role="group" aria-label="Idioma" data-en-aria-label="Language"><button type="button" data-lang="pt">PT</button><button type="button" data-lang="en">EN</button></div>
  <a class="btn bar-cta" href="${R}motas/" data-en="See bikes">Ver motas</a>
  <button type="button" class="menu-btn" aria-expanded="false" aria-controls="menu">Menu</button>
</div></header>
<div class="menu" id="menu" hidden>
  <nav class="menu-nav" aria-label="Menu">${['', ...NAV].map((k) => link(k)).join('')}</nav>
  <a class="menu-phone nums" href="tel:${SITE.phone}">${SITE.phoneTxt}</a>
</div>`);
  document.body.insertAdjacentHTML('beforeend', `
<footer class="foot">
  <div class="wrap grid cols">
    <div class="c"><b data-en="Showroom">Stand</b><span>EN 249-4, km 6,6</span><span>2785-033 São Domingos de Rana</span><a class="link" href="tel:${SITE.phone}">${SITE.phoneTxt}</a></div>
    <div class="c"><b data-en="Workshop">Oficina</b><span>Largo do Lavadouro 30</span><span>2785-029 São Domingos de Rana</span><a class="link" href="tel:${SITE.shop}">${SITE.shopTxt}</a></div>
    <div class="c"><b data-en="Hours">Horário</b><span data-en="Mon–Fri 9:00–13:00, 14:30–19:00">Seg–Sex 9:00–13:00, 14:30–19:00</span><span data-en="Sat 9:00–13:00">Sáb 9:00–13:00</span><span data-en="Sundays and holidays closed">Domingos e feriados fechado</span></div>
    <div class="c"><b data-en="Pages">Páginas</b>${NAV.map((k) => link(k, 'class="link" ')).join('')}<a class="link" href="${R}admin/" data-en="Dealer panel (demo)">Painel do stand (demo)</a></div>
  </div>
  <p class="foot-word" data-fit aria-hidden="true">SPEED<br class="m-br"> MASTER</p>
  <div class="wrap legal">
    <span data-en="Website concept by Orla, not the official Speed Master site.">Conceito de site da Orla, não é o site oficial da Speed Master.</span>
    <span id="credits"></span>
    <a class="link" href="${R}../../" data-en="Site: Orla web studio">Site: Orla, estúdio web</a>
  </div>
</footer>
<nav class="dock" id="dock" aria-label="Ações rápidas" data-en-aria-label="Quick actions">
  <a href="tel:${SITE.phone}" data-en="Call">Ligar</a><a href="${R}motas/" data-en="Bikes">Motas</a><a href="${R}contactos/#pedido" data-en="Request">Pedido</a>
</nav>`);

  const menuBtn = $('.menu-btn'), menu = $('#menu');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? t().close : t().menu;
    document.body.classList.toggle('menu-open', open);
    if (open) $('a', menu).focus();
  }
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* odometer digits */
  const roll = (value, from0) => {
    const s = num(value);
    return `<span class="roll" aria-hidden="true">${[...s].map((ch, i) => (/\d/.test(ch)
      ? `<span class="col"><span class="strip" data-d="${ch}" style="--d:${from0 && !reduced ? 0 : ch};--i:${i}">${'0123456789'.split('').map((n) => `<span>${n}</span>`).join('')}</span></span>`
      : `<span>${ch}</span>`)).join('')}</span><span class="sr-only">${s}</span>`;
  };
  const spin = (host) => { if (reduced) return; requestAnimationFrame(() => requestAnimationFrame(() => $$('.strip', host).forEach((st) => st.style.setProperty('--d', st.dataset.d)))); };

  /* a bike in the grid: photo, price tag, name, licence */
  function card(b) {
    const L = t(), ph = b.cover || (b.photos || [])[0];
    const sub = [b.year, b.km != null ? `${num(b.km)} km` : '', b.cc ? `${num(b.cc)} cc` : ''].filter(Boolean).join(' · ');
    const stamp = b.status === 'reserved' ? `<span class="stamp">${L.reserved}</span>` : b.status === 'sold' ? `<span class="stamp">${L.sold}</span>` : '';
    return `<a class="card" href="${R}mota/?id=${encodeURIComponent(b.id)}">
      <span class="card-ph">${ph ? `<img ${SM.img(ph)} alt="" loading="lazy" decoding="async" width="600" height="450">` : `<span class="noph">${esc(b.brand)}</span>`}<span class="tag nums">${b.price ? eur(b.price) : L.onReq}</span>${stamp}</span>
      <span class="card-tx"><span class="card-nm">${esc(b.brand)} <b>${esc(b.model)}</b></span><span class="card-sub nums">${sub}</span><span class="lic" title="${L.licL} ${b.lic}">${b.lic}</span></span></a>`;
  }

  /* opening hours and live status, Europe/Lisbon */
  function lisbonNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: SITE.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: +p.hour * 60 + +p.minute };
  }
  const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  function renderHours() {
    const L = t(), now = lisbonNow();
    $$('[data-hours]').forEach((el) => {
      el.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = SITE.hours[d], c = d === now.wd ? ' class="today"' : '';
        return `<span${c}>${L.days[d]}</span><span${c}>${h.length ? h.map(([a, b]) => `${hm(a)}–${hm(b)}`).join(', ') : L.closedDay}</span>`;
      }).join('');
    });
    let txt = '', open = false;
    const on = SITE.hours[now.wd].find(([a, b]) => now.min >= a && now.min < b);
    if (on) { open = true; txt = L.open(hm(on[1])); } else {
      for (let k = 0; k < 7 && !txt; k++) {
        const d = (now.wd + k) % 7, next = SITE.hours[d].find(([a]) => k > 0 || a > now.min);
        if (next) txt = L.opensAt(k === 0 ? L.today : k === 1 ? L.tomorrow : lang === 'pt' ? L.days[d].toLowerCase() : L.days[d], hm(next[0]));
      }
    }
    $$('[data-status]').forEach((el) => { el.classList.toggle('closed', !open); el.innerHTML = `<span class="dot" aria-hidden="true"></span>${txt}`; });
  }
  setInterval(renderHours, 60000);

  /* request forms: <form data-req data-kind data-kinds data-date> is filled in here */
  const KINDS = ['ride', 'reserve', 'trade', 'service', 'other'];
  function buildForm(f) {
    f._kinds = (f.dataset.kinds || KINDS.join(',')).split(',');
    f._kind = f.dataset.kind || f._kinds[0];
    f.noValidate = true;
    f.innerHTML = `
      <h2 class="form-h" data-en="${f.dataset.titleEn || 'Send a request'}">${f.dataset.title || 'Fazer um pedido'}</h2>
      <div class="chips kinds" role="group" aria-label="Tipo de pedido" data-en-aria-label="Request type"${f._kinds.length < 2 ? ' hidden' : ''}></div>
      <div class="f-row">
        <label><span data-en="Name">Nome</span><input name="name" autocomplete="name" required></label>
        <label><span data-en="Phone">Telefone</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required></label>
      </div>
      <label><span class="bike-l">Mota</span><input name="bike" placeholder="Ex.: Kawasaki Z 900, 2021" data-en-placeholder="E.g. Kawasaki Z 900, 2021"></label>
      ${f.hasAttribute('data-date') ? '<label><span data-en="Preferred day">Dia preferido</span><input name="date" type="date"></label>' : ''}
      <label><span data-en="Message (optional)">Mensagem (opcional)</span><textarea name="msg"></textarea></label>
      <button class="btn" type="submit" data-en="Send request">Enviar pedido</button>
      <div class="result" role="status" hidden></div>`;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const L = t(), v = (n) => (f.elements[n] ? f.elements[n].value.trim() : ''), out = $('.result', f);
      out.hidden = false;
      if (!v('name') || !v('phone')) { out.innerHTML = `<p>${L.need}</p>`; (v('name') ? f.elements.phone : f.elements.name).focus(); return; }
      SM.addRequest({ kind: f._kind, name: v('name'), phone: v('phone'), bike: v('bike'), bikeId: f._bikeId || null, date: v('date'), msg: v('msg'), lang });
      const lines = [L.kinds[f._kind], v('bike') && `${L.msgBike}: ${v('bike')}`, v('date') && `${L.msgDate}: ${v('date')}`, `${L.msgName}: ${v('name')}`, `${L.msgPhone}: ${v('phone')}`, v('msg')];
      out.innerHTML = `<b>${L.done}</b><pre></pre><p class="note">${L.concept}</p><a class="btn" href="${R}admin/#pedidos">${L.seePanel}</a>`;
      $('pre', out).textContent = lines.filter(Boolean).join('\n');
      f.elements.msg.value = '';
    });
  }
  function renderKinds(f) {
    const L = t(), host = $('.kinds', f);
    host.innerHTML = f._kinds.map((k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === f._kind}">${L.kinds[k]}</button>`).join('');
    $$('.chip', host).forEach((b) => b.addEventListener('click', () => { f._kind = b.dataset.k; renderKinds(f); }));
    $('.bike-l', f).textContent = L.bikeL[f._kind];
  }
  function setReq(f, { kind, bike, bikeId } = {}) {
    if (kind) f._kind = kind;
    if (bike != null) f.elements.bike.value = bike;
    if (bikeId !== undefined) f._bikeId = bikeId;
    renderKinds(f);
  }
  $$('form[data-req]').forEach(buildForm);

  /* a word that fills the width (desktop) */
  function fit(el) {
    if (innerWidth <= 700) { el.style.fontSize = ''; return; }
    el.style.fontSize = '100px';
    const cs = getComputedStyle(el), avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const r = document.createRange(); r.selectNodeContents(el.querySelector('[aria-hidden]') || el);
    let size = 100 * avail / (r.getBoundingClientRect().width || avail) * 0.995;
    if (el.dataset.fitMax) size = Math.min(size, innerWidth * +el.dataset.fitMax);
    el.style.fontSize = Math.floor(size) + 'px';
  }
  const fitAll = () => $$('[data-fit]').forEach(fit);
  addEventListener('resize', fitAll);
  if (document.fonts) document.fonts.ready.then(fitAll);

  /* language: PT in the markup, EN in data-en attributes */
  const hooks = [];
  function applyLang() {
    document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
    $$('[data-en]').forEach((el) => { if (el._pt === undefined) el._pt = el.innerHTML; el.innerHTML = lang === 'en' ? el.dataset.en : el._pt; });
    ['aria-label', 'placeholder', 'alt'].forEach((a) => $$(`[data-en-${a}]`).forEach((el) => {
      const k = '_pt_' + a; if (el[k] === undefined) el[k] = el.getAttribute(a);
      el.setAttribute(a, lang === 'en' ? el.getAttribute(`data-en-${a}`) : el[k]);
    }));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    menuBtn.textContent = menu.hidden ? t().menu : t().close;
    $('#credits').innerHTML = `3D: <a class="link" href="https://sketchfab.com/3d-models/kawasaki-ninja-zx-6r-4af2b6840b8045a5af5e8df8a85f04fa" target="_blank" rel="noopener">“Kawasaki ninja ZX-6R” · valvetin</a>, CC BY 4.0 · ${t().photos}`;
    $$('form[data-req]').forEach(renderKinds);
    renderHours();
    hooks.forEach((fn) => fn());
    fitAll();
  }
  $$('.lang button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('sm-lang', lang); } catch (e) {} applyLang(); }));

  /* header turns solid below the yellow head; phone dock steps aside for forms */
  const bar = $('#bar'), top = $('#top'), dock = $('#dock');
  if (top) new IntersectionObserver(([en]) => bar.classList.toggle('is-solid', !en.isIntersecting), { rootMargin: '-68px 0px 0px 0px' }).observe(top);
  else bar.classList.add('is-solid');
  const seen = new Set();
  const dio = new IntersectionObserver((es) => { es.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target))); dock.classList.toggle('is-off', seen.size > 0); }, { threshold: 0.15 });
  $$('form[data-req]').forEach((f) => dio.observe(f));

  /* entrances, once */
  $$('[data-rv]').forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('[data-rv]').forEach((el) => io.observe(el));
  } else $$('[data-rv]').forEach((el) => el.classList.add('in'));

  window.SMI = {
    R, PAGE, $, $$, esc, reduced, t, eur, num, pmt, card, roll, spin, setReq, fitAll,
    lang: () => lang,
    LIC_MAX: { all: 3, AM: 0, B: 1, A2: 2, A: 3 },
    onLang(fn) { hooks.push(fn); fn(); fitAll(); }
  };
  applyLang();
})();
