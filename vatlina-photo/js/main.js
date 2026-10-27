/* =========================================================================
   ИНТЕРФЕЙС САЙТА
   1. Тексты из настроек         5. Просмотр фото (lightbox)
   2. Шапка и меню               6. Виджет «Золотой час и погода»
   3. Появление при прокрутке    7. Форма записи и контакты
   4. Портфолио и фильтры
   Зависит от: config.js (SITE_CONFIG), sun.js (Sun), weather.js (Weather).
   ========================================================================= */

(function () {
  'use strict';

  const C = window.SITE_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Даты и время в часовом поясе локации ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const fmtTime = (d, tz) => (d ? new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).format(d) : '—');
  const fmtRange = (pair, tz) => (pair && pair[0] && pair[1] ? `${fmtTime(pair[0], tz)}–${fmtTime(pair[1], tz)}` : '—');
  const isoIn = (d, tz) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(d);
  const minutesIn = (d, tz) => {
    const p = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).formatToParts(d);
    return (Number(p.find((x) => x.type === 'hour').value) % 24) * 60 + Number(p.find((x) => x.type === 'minute').value);
  };
  const addDays = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  };
  const longDate = (iso) => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const duration = (min) => {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} ч ${pad(m)} мин` : `${m} мин`;
  };
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /* =====================================================================
     1. ТЕКСТЫ ИЗ НАСТРОЕК
     ===================================================================== */
  $$('[data-cfg]').forEach((el) => { if (C[el.dataset.cfg]) el.textContent = C[el.dataset.cfg]; });
  $('#year').textContent = new Date().getFullYear();

  /** Адрес фото: свой файл или Unsplash нужного размера */
  function photoSrc(p, width, cropRatio) {
    if (!p.unsplash) return p.src;
    let url = `https://images.unsplash.com/photo-${p.unsplash}?auto=format&q=72&w=${width}`;
    if (cropRatio) url += `&h=${Math.round(width / cropRatio)}&fit=crop`;
    else url += '&fit=max';
    return url;
  }
  const thumbSrcset = (p) => (p.unsplash ? [450, 900, 1300].map((w) => `${photoSrc(p, w, p.ratio)} ${w}w`).join(', ') : '');

  /* Фото первого экрана */
  const heroImg = $('#heroImg');
  const hp = C.heroPhoto || {};
  heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
  heroImg.addEventListener('error', () => heroImg.remove()); // останется градиент-закат
  if (hp.unsplash) {
    heroImg.srcset = [1200, 2000, 2800].map((w) => `${photoSrc(hp, w)} ${w}w`).join(', ');
    heroImg.sizes = '100vw';
  }
  heroImg.src = hp.unsplash ? photoSrc(hp, 2000) : hp.src;

  /* =====================================================================
     2. ШАПКА И МОБИЛЬНОЕ МЕНЮ
     ===================================================================== */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const setMenu = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* =====================================================================
     3. ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
     ===================================================================== */
  const io = 'IntersectionObserver' in window && !reducedMotion
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  const reveal = (el) => (io ? io.observe(el) : el.classList.add('in'));
  $$('.reveal').forEach(reveal);
  // первый экран показываем сразу, по очереди
  $$('.hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 120 + i * 140));

  /* =====================================================================
     4. ПОРТФОЛИО: СЕТКА И ФИЛЬТРЫ
     ===================================================================== */
  const catLabel = Object.fromEntries(C.categories.map((c) => [c.key, c.label]));
  const gallery = $('#gallery');

  C.photos.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ph';
    btn.dataset.cat = p.category;
    btn.dataset.index = i;
    btn.dataset.label = catLabel[p.category] || '';
    btn.style.setProperty('--ratio', p.ratio || 0.8);
    btn.setAttribute('aria-label', `Открыть фото: ${p.title}`);
    const alt = `${catLabel[p.category] || 'Фото'}: ${p.title}${p.place ? ', ' + p.place : ''}`;
    const set = thumbSrcset(p);
    const srcsetAttr = set ? ` srcset="${esc(set)}" sizes="(max-width: 1000px) 50vw, 33vw"` : '';
    btn.innerHTML = `<img src="${esc(photoSrc(p, 900, p.ratio))}"${srcsetAttr} alt="${esc(alt)}" loading="lazy" decoding="async">
      <span class="ph-cap"><b>${esc(p.title)}</b><span>${esc(catLabel[p.category] || '')}</span></span>`;
    const img = btn.querySelector('img');
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => btn.classList.add('noimg'));
    if (img.complete && img.naturalWidth) img.classList.add('loaded');
    btn.addEventListener('click', () => !btn.classList.contains('noimg') && openLightbox(btn));
    btn.style.viewTransitionName = `ph-${i}`;
    gallery.append(btn);
  });

  const filters = $('#filters');
  const filterList = [{ key: 'all', label: 'Все' }, ...C.categories];
  filterList.forEach((f) => {
    const n = f.key === 'all' ? C.photos.length : C.photos.filter((p) => p.category === f.key).length;
    if (!n) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.filter = f.key;
    b.setAttribute('aria-pressed', String(f.key === 'all'));
    b.innerHTML = `${esc(f.label)} <small>${n}</small>`;
    b.addEventListener('click', () => applyFilter(f.key));
    filters.append(b);
  });

  function applyFilter(key) {
    $$('.chip', filters).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
    const run = () => $$('.ph', gallery).forEach((ph) => { ph.hidden = !(key === 'all' || ph.dataset.cat === key); });
    // View Transitions — плавная перестановка там, где браузер умеет
    if (document.startViewTransition && !reducedMotion) document.startViewTransition(run);
    else run();
  }

  /* =====================================================================
     5. ПРОСМОТР ФОТО (LIGHTBOX)
     ===================================================================== */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  let lbList = [], lbPos = 0, lbOpener = null;

  function openLightbox(btn) {
    lbList = $$('.ph', gallery).filter((ph) => !ph.hidden && !ph.classList.contains('noimg'));
    lbPos = lbList.indexOf(btn);
    lbOpener = btn;
    showPhoto(0);
    lb.showModal();
    document.documentElement.style.overflow = 'hidden';
  }
  function showPhoto(step) {
    lbPos = (lbPos + step + lbList.length) % lbList.length;
    const p = C.photos[lbList[lbPos].dataset.index];
    const full = p.unsplash ? photoSrc(p, Math.min(2400, Math.round(innerWidth * devicePixelRatio))) : (p.full || p.src);
    lbImg.classList.add('swap');
    const next = new Image();
    next.onload = next.onerror = () => { lbImg.src = full; lbImg.alt = `${catLabel[p.category] || ''}: ${p.title}`; lbImg.classList.remove('swap'); };
    next.src = full;
    $('#lbCap').textContent = [p.title, p.place].filter(Boolean).join(' · ');
    $('#lbCount').textContent = `${lbPos + 1} / ${lbList.length}`;
    // заранее грузим следующее фото
    const np = C.photos[lbList[(lbPos + 1) % lbList.length].dataset.index];
    new Image().src = np.unsplash ? photoSrc(np, Math.min(2400, Math.round(innerWidth * devicePixelRatio))) : (np.full || np.src);
  }
  $('#lbPrev').addEventListener('click', () => showPhoto(-1));
  $('#lbNext').addEventListener('click', () => showPhoto(1));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-fig')) lb.close(); });
  lb.addEventListener('close', () => { document.documentElement.style.overflow = ''; lbOpener && lbOpener.focus(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') showPhoto(1);
    if (e.key === 'ArrowLeft') showPhoto(-1);
  });
  // свайп на телефоне
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* =====================================================================
     6. ВИДЖЕТ «ЗОЛОТОЙ ЧАС И ПОГОДА»
     ===================================================================== */
  const state = { loc: { ...C.locations[0] }, custom: null, date: null };
  const tz = () => state.loc.tz || browserTz;
  const today = () => isoIn(new Date(), tz());

  /* --- Выбор места --- */
  const locChips = $('#locChips');
  function renderLocChips() {
    const all = [...C.locations, ...(state.custom ? [state.custom] : [])];
    locChips.innerHTML = '';
    all.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'radio');
      const active = l.lat === state.loc.lat && l.lng === state.loc.lng;
      b.setAttribute('aria-checked', String(active));
      b.textContent = l.name;
      b.addEventListener('click', () => setLocation(l));
      locChips.append(b);
    });
  }
  function setLocation(l, isCustom) {
    if (isCustom) state.custom = l;
    state.loc = { ...l };
    if (!state.date || state.date < today()) state.date = today();
    renderLocChips();
    renderDateControls();
    renderLight();
    loadWeather();
    updateBookingHint();
  }

  // поиск другого города
  const results = $('#placeResults');
  $('#placeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#placeInput').value.trim();
    if (q.length < 2) return;
    results.hidden = false;
    results.innerHTML = '<li class="empty">Ищу…</li>';
    try {
      const found = await Weather.searchPlace(q);
      results.innerHTML = found.length ? '' : '<li class="empty">Ничего не нашлось. Попробуйте написать по-другому.</li>';
      found.forEach((r) => {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button">${esc(r.name)}<small>${esc(r.detail)}</small></button>`;
        li.querySelector('button').addEventListener('click', () => {
          results.hidden = true;
          $('#placeInput').value = '';
          setLocation({ name: r.name, lat: r.lat, lng: r.lng, tz: r.tz }, true);
        });
        results.append(li);
      });
    } catch (err) {
      results.innerHTML = '<li class="empty">Поиск не ответил. Проверьте интернет или выберите город из списка.</li>';
    }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.place-search')) results.hidden = true; });

  // моё местоположение
  const geoBtn = $('#geoBtn');
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return geoMsg('Браузер не умеет определять место');
    const label = geoBtn.lastChild;
    label.textContent = ' Определяю…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        label.textContent = ' Моё местоположение';
        setLocation({ name: 'Рядом со мной', lat: +pos.coords.latitude.toFixed(4), lng: +pos.coords.longitude.toFixed(4), tz: browserTz }, true);
      },
      () => geoMsg('Не удалось определить место'),
      { timeout: 10000, maximumAge: 600000 }
    );
  });
  function geoMsg(text) {
    const label = geoBtn.lastChild;
    label.textContent = ' ' + text;
    setTimeout(() => { label.textContent = ' Моё местоположение'; }, 3500);
  }

  /* --- Выбор даты --- */
  const dateInput = $('#lightDate');
  const dateChips = $('#dateChips');
  function renderDateControls() {
    const t = today();
    dateInput.min = t;
    dateInput.max = addDays(t, 365);
    dateInput.value = state.date;
    const dow = new Date(t + 'T12:00:00Z').getUTCDay(); // 0 — воскресенье
    const toSat = (6 - dow + 7) % 7 || 7;
    const quick = [
      { label: 'Сегодня', iso: t },
      { label: 'Завтра', iso: addDays(t, 1) },
      { label: 'Суббота', iso: addDays(t, toSat) },
      { label: 'Через неделю', iso: addDays(t, 7) }
    ];
    dateChips.innerHTML = '';
    quick.forEach((q) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = q.label;
      b.setAttribute('aria-pressed', String(q.iso === state.date));
      b.addEventListener('click', () => setDate(q.iso));
      dateChips.append(b);
    });
  }
  function setDate(iso) {
    if (!iso) return;
    state.date = iso < today() ? today() : iso;
    renderDateControls();
    renderLight();
    renderWeather();
  }
  dateInput.addEventListener('change', () => setDate(dateInput.value));

  /* --- Шкала дня и время --- */
  const COLORS = { night: '#141a2e', blue: '#3c5c97', gold: '#e3a65a', day: '#a9c9e6' };

  function renderLight() {
    const { lat, lng, name } = state.loc;
    const zone = tz();
    const day = Sun.getDay(state.date, lat, lng);
    state.day = day;
    const isToday = state.date === today();

    $('#dayTitle').textContent = `${isToday ? 'Сегодня, ' : ''}${longDate(state.date)} · ${name}`;
    $('#tBlueM').textContent = fmtRange(day.blueMorning, zone);
    $('#tSunrise').textContent = fmtTime(day.sunrise, zone);
    $('#tGoldM').textContent = fmtRange(day.goldenMorning, zone);
    $('#tGoldE').textContent = fmtRange(day.goldenEvening, zone);
    $('#tSunset').textContent = fmtTime(day.sunset, zone);
    $('#tBlueE').textContent = fmtRange(day.blueEvening, zone);

    // градиент шкалы: ночь → синий → золотой → день → золотой → синий → ночь
    const pct = (d) => (minutesIn(d, zone) / 1440) * 100;
    const bar = $('#daybar');
    if (day.blueMorning[0] && day.goldenMorning[1] && day.goldenEvening[0] && day.blueEvening[1]) {
      const p = [pct(day.blueMorning[0]), pct(day.goldenMorning[0]), pct(day.goldenMorning[1]), pct(day.goldenEvening[0]), pct(day.goldenEvening[1]), pct(day.blueEvening[1])];
      const s = (c, a, b) => `${c} ${a.toFixed(2)}% ${b.toFixed(2)}%`;
      bar.style.background = `linear-gradient(90deg, ${[
        s(COLORS.night, 0, p[0]), s(COLORS.blue, p[0], p[1]), s(COLORS.gold, p[1], p[2]),
        s(COLORS.day, p[2], p[3]), s(COLORS.gold, p[3], p[4]), s(COLORS.blue, p[4], p[5]), s(COLORS.night, p[5], 100)
      ].join(', ')})`;
    } else {
      // полярный день или ночь — без привычных границ
      bar.style.background = day.polar ? COLORS.night : COLORS.day;
    }
    bar.setAttribute('aria-label', `Золотой час утром ${fmtRange(day.goldenMorning, zone)}, вечером ${fmtRange(day.goldenEvening, zone)}`);
    renderNow();
  }

  /* Отметка «сейчас» и обратный отсчёт (только для сегодняшнего дня) */
  function renderNow() {
    const day = state.day;
    const zone = tz();
    const mark = $('#nowMark');
    const cd = $('#countdown');
    const isToday = state.date === today();
    const now = new Date();

    if (!isToday) {
      mark.hidden = true;
      $('#localNow').textContent = '';
      cd.textContent = day.goldenEvening[0] && day.goldenEvening[1]
        ? `Вечерний золотой час: ${duration((day.goldenEvening[1] - day.goldenEvening[0]) / 6e4)}, с ${fmtTime(day.goldenEvening[0], zone)}`
        : 'В этот день у солнца необычный режим — подберём время вместе.';
      return;
    }
    const m = minutesIn(now, zone);
    mark.hidden = false;
    mark.style.left = `${(m / 1440) * 100}%`;
    mark.dataset.time = fmtTime(now, zone);
    $('#localNow').textContent = `Сейчас ${fmtTime(now, zone)} по местному времени`;

    const inside = (pair) => pair[0] && pair[1] && now >= pair[0] && now < pair[1];
    const left = (d) => duration((d - now) / 6e4);
    let text;
    if (inside(day.goldenEvening)) text = `Сейчас золотой час! Осталось ${left(day.goldenEvening[1])}.`;
    else if (inside(day.blueEvening)) text = `Сейчас синий час, ещё ${left(day.blueEvening[1])}.`;
    else if (inside(day.goldenMorning)) text = `Сейчас утренний золотой час, ещё ${left(day.goldenMorning[1])}.`;
    else if (inside(day.blueMorning)) text = `Сейчас утренний синий час, ещё ${left(day.blueMorning[1])}.`;
    else if (day.blueMorning[0] && now < day.blueMorning[0]) text = `До утреннего синего часа ${left(day.blueMorning[0])}.`;
    else if (day.goldenEvening[0] && now < day.goldenEvening[0]) text = `До вечернего золотого часа ${left(day.goldenEvening[0])}.`;
    else {
      const tomorrow = Sun.getDay(addDays(state.date, 1), state.loc.lat, state.loc.lng);
      text = `Сегодня свет уже ушёл. Завтра золотой час с ${fmtTime(tomorrow.goldenMorning[0], zone)}.`;
    }
    cd.textContent = text;
  }
  setInterval(() => { if (state.day) renderNow(); }, 30000);

  /* --- Погода --- */
  const ICONS = {
    sun: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="8"/><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5"/></svg>',
    part: '<svg viewBox="0 0 48 48"><circle cx="18" cy="17" r="6"/><path d="M18 5v3M6 17h3M9.5 8.5l2 2M26.5 8.5l-2 2"/><path d="M16 38h18a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-1 11z"/></svg>',
    cloud: '<svg viewBox="0 0 48 48"><path d="M14 36h21a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 14 36z"/></svg>',
    rain: '<svg viewBox="0 0 48 48"><path d="M14 30h21a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 14 30z"/><path d="M17 35l-2 5M25 35l-2 5M33 35l-2 5"/></svg>',
    snow: '<svg viewBox="0 0 48 48"><path d="M14 30h21a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 14 30z"/><path d="M17 36v4M15 38h4M25 36v4M23 38h4M33 36v4M31 38h4"/></svg>',
    storm: '<svg viewBox="0 0 48 48"><path d="M14 30h21a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 14 30z"/><path d="M25 32l-4 7h6l-3 6"/></svg>',
    fog: '<svg viewBox="0 0 48 48"><path d="M8 18h32M5 25h38M9 32h30M14 39h20"/></svg>'
  };
  let wData = null, wError = false, wToken = 0;

  async function loadWeather() {
    const token = ++wToken;
    $('#weather').classList.add('loading');
    try {
      const data = await Weather.getForecast(state.loc.lat, state.loc.lng);
      if (token !== wToken) return; // пользователь уже выбрал другое место
      wData = data; wError = false;
      if (!state.loc.tz && data.timezone) state.loc.tz = data.timezone;
    } catch (e) {
      if (token !== wToken) return;
      wData = null; wError = true;
    }
    $('#weather').classList.remove('loading');
    renderWeather();
  }

  function renderWeather() {
    const set = (id, v) => { $(id).textContent = v; };
    const zone = tz();
    const isToday = state.date === today();
    const golden = state.day && state.day.goldenEvening[0];
    const goldenKey = golden ? `${state.date}T${pad(Math.floor(minutesIn(golden, zone) / 60))}:00` : null;
    const goldenW = wData && goldenKey ? Weather.atHour(wData, goldenKey) : null;

    if (!wData) {
      set('#wWhen', 'Погода');
      set('#wDesc', '');
      $('#wIcon').innerHTML = ICONS.cloud;
      ['#wTemp', '#wCloud', '#wWind', '#wRain'].forEach((id) => set(id, '—'));
      $('#wGolden').hidden = true;
      set('#aTitle', wError ? 'Прогноз сейчас недоступен' : 'Загружаю прогноз…');
      set('#aText', wError ? 'Нет связи с сервисом погоды. Время света выше посчитано без интернета, а прогноз я пришлю сама за пару дней до съёмки.' : '');
      $('#aNotes').innerHTML = '';
      markOutfit(null);
      return;
    }

    if (!Weather.covers(wData, state.date)) {
      set('#wWhen', longDate(state.date));
      set('#wDesc', 'прогноз ещё не готов');
      $('#wIcon').innerHTML = ICONS.part;
      ['#wTemp', '#wCloud', '#wWind', '#wRain'].forEach((id) => set(id, '—'));
      $('#wGolden').hidden = true;
      set('#aTitle', 'Свет посчитан, погода — позже');
      set('#aText', `Прогноз бывает на ${Weather.FORECAST_DAYS} дней вперёд. Дату можно забронировать уже сейчас, а за пару дней до съёмки я пришлю прогноз и при необходимости сдвину время.`);
      $('#aNotes').innerHTML = '';
      markOutfit(null);
      return;
    }

    // сегодня — текущая погода, другой день — погода к вечернему золотому часу
    let w, when;
    if (isToday) {
      const c = wData.current;
      const nowKey = `${state.date}T${pad(Math.floor(minutesIn(new Date(), zone) / 60))}:00`;
      const nowH = Weather.atHour(wData, nowKey);
      w = { temp: c.temperature_2m, cloud: c.cloud_cover, wind: c.wind_speed_10m, code: c.weather_code, rain: nowH ? nowH.rain : 0 };
      when = 'Сейчас';
    } else {
      w = goldenW || Weather.atHour(wData, `${state.date}T12:00`);
      when = goldenW ? `В золотой час, ${fmtTime(golden, zone)}` : 'Днём';
    }
    if (!w) return;
    const [desc, icon] = Weather.describe(w.code);
    set('#wWhen', when);
    set('#wDesc', desc);
    $('#wIcon').innerHTML = ICONS[icon] || ICONS.cloud;
    set('#wTemp', `${Math.round(w.temp)}°`);
    set('#wCloud', `${Math.round(w.cloud)}%`);
    set('#wWind', `${Math.round(w.wind)} км/ч`);
    set('#wRain', `${Math.round(w.rain ?? 0)}%`);

    // сегодня дополнительно показываем погоду к золотому часу
    const gEl = $('#wGolden');
    if (isToday && goldenW && new Date() < state.day.goldenEvening[1]) {
      gEl.hidden = false;
      gEl.innerHTML = `К золотому часу (${fmtTime(golden, zone)}): <b>${Math.round(goldenW.temp)}°</b>, облачность <b>${Math.round(goldenW.cloud)}%</b>, ветер <b>${Math.round(goldenW.wind)} км/ч</b>`;
    } else gEl.hidden = true;

    // совет — по погоде в момент съёмки (золотой час), если она известна
    const a = Weather.advise(isToday && goldenW ? goldenW : w);
    set('#aTitle', a.title);
    set('#aText', a.text);
    $('#aNotes').innerHTML = a.notes.map((n) => `<li>${esc(n)}</li>`).join('');
    markOutfit(a.outfit);
  }

  /* Подсветка карточки «Что надеть» под прогноз */
  function markOutfit(key) {
    $$('.ocard').forEach((c) => c.classList.toggle('match', c.dataset.outfit === key));
  }

  // «Записаться на этот день» — переносим дату в форму
  $('#bookThisDay').addEventListener('click', () => {
    $('#fDate').value = state.date;
    updateBookingHint();
  });

  /* Подсказка в первом экране: ближайший золотой час в городе по умолчанию */
  (function heroLight() {
    const l = C.locations[0];
    const zone = l.tz || browserTz;
    const t = isoIn(new Date(), zone);
    const d = Sun.getDay(t, l.lat, l.lng);
    let text;
    if (d.goldenEvening[1] && new Date() < d.goldenEvening[1]) text = `${l.name}: золотой час сегодня ${fmtRange(d.goldenEvening, zone)}`;
    else {
      const n = Sun.getDay(addDays(t, 1), l.lat, l.lng);
      text = `${l.name}: золотой час завтра ${fmtRange(n.goldenMorning, zone)} и ${fmtRange(n.goldenEvening, zone)}`;
    }
    $('#heroLightText').textContent = text;
    $('#heroLight').hidden = false;
  })();

  /* =====================================================================
     7. ФОРМА ЗАПИСИ И КОНТАКТЫ
     ===================================================================== */
  const ct = C.contacts || {};
  const ICON = {
    telegram: '<svg viewBox="0 0 24 24"><path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c.3 2 2.5 4.3 4.5 4.6l1.2-1.2 1.8.9c-.3 1.2-1.3 1.7-2.3 1.6-3-.4-6-3.4-6.3-6.3 0-1 .5-2 1.6-2.3l.9 1.8z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    email: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
  };
  const links = [
    ct.telegram && { k: 'telegram', label: 'Telegram', value: '@' + ct.telegram, href: `https://t.me/${ct.telegram}` },
    ct.whatsapp && { k: 'whatsapp', label: 'WhatsApp', value: '+' + ct.whatsapp, href: `https://wa.me/${ct.whatsapp}` },
    ct.instagram && { k: 'instagram', label: 'Instagram', value: '@' + ct.instagram, href: `https://instagram.com/${ct.instagram}` },
    ct.phone && { k: 'phone', label: 'Телефон', value: ct.phone, href: `tel:${ct.phone.replace(/[^\d+]/g, '')}` },
    ct.email && { k: 'email', label: 'Почта', value: ct.email, href: `mailto:${ct.email}` }
  ].filter(Boolean);
  $('#contacts').hidden = !links.length; // пока контакты не заполнены — блок не показываем
  $('#contacts').innerHTML = links.map((l) => `<li><a href="${esc(l.href)}" ${l.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${ICON[l.k]}<b>${esc(l.label)}</b><span>${esc(l.value)}</span></a></li>`).join('');

  // типы съёмки — радиокнопки-чипсы
  const types = [...C.categories.map((c) => c.label), 'Другое'];
  $('#typeChips').innerHTML = types.map((t, i) => `<label class="chip"><input type="radio" name="type" value="${esc(t)}" id="type${i}">${esc(t)}</label>`).join('');

  // дата в форме: минимум — сегодня, подсказка с золотым часом
  const fDate = $('#fDate');
  fDate.min = isoIn(new Date(), tz());
  fDate.addEventListener('change', updateBookingHint);
  function goldenNote(iso) {
    const d = Sun.getDay(iso, state.loc.lat, state.loc.lng);
    return d.goldenEvening[0] ? `золотой час ${fmtRange(d.goldenEvening, tz())}, ${state.loc.name}` : '';
  }
  function updateBookingHint() {
    const hint = $('#fDateHint');
    if (!fDate.value) { hint.textContent = 'Выберите дату — подскажу время золотого часа.'; return; }
    const d = Sun.getDay(fDate.value, state.loc.lat, state.loc.lng);
    hint.innerHTML = `${esc(longDate(fDate.value))}: золотой час <b>${fmtRange(d.goldenMorning, tz())}</b> и <b>${fmtRange(d.goldenEvening, tz())}</b>, закат в ${fmtTime(d.sunset, tz())} (${esc(state.loc.name)}).`;
  }

  const form = $('#bookForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const date = fDate.value;
    const type = (form.querySelector('input[name="type"]:checked') || {}).value || '';
    const comment = form.comment.value.trim();

    // проверка обязательных полей
    const err = $('#formErr');
    form.name.classList.toggle('invalid', !name);
    form.contact.classList.toggle('invalid', contact.length < 3);
    if (!name || contact.length < 3) {
      err.textContent = !name ? 'Напишите, как к вам обращаться.' : 'Оставьте телефон или ник в Telegram, чтобы я могла ответить.';
      err.hidden = false;
      (!name ? form.name : form.contact).focus();
      return;
    }
    err.hidden = true;

    const lines = [
      'Здравствуйте! Хочу записаться на съёмку.',
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      date && `Дата: ${longDate(date)}${goldenNote(date) ? ` (${goldenNote(date)})` : ''}`,
      type && `Тип съёмки: ${type}`,
      comment && `Комментарий: ${comment}`
    ].filter(Boolean);
    const message = lines.join('\n');

    const btn = $('#submitBtn');
    if (C.formEndpoint) {
      btn.disabled = true;
      btn.textContent = 'Отправляю…';
      try {
        const res = await fetch(C.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name, contact, date, type, comment, message, _subject: `Заявка на съёмку: ${name}` })
        });
        if (!res.ok) throw new Error(res.status);
        showDone(true, message);
        form.reset();
        updateBookingHint();
      } catch (e2) {
        showDone(false, message, 'Не получилось отправить автоматически.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
      }
    } else {
      showDone(false, message);
    }
  });

  /** Итог отправки. sent=false — показываем готовый текст и способы отправить его вручную */
  function showDone(sent, message, reason) {
    const box = $('#formDone');
    box.hidden = false;
    $('#doneTitle').textContent = sent ? 'Заявка отправлена' : 'Заявка готова';
    $('#doneText').textContent = sent
      ? 'Спасибо! Отвечу в течение дня и предложу время по свету.'
      : `${reason ? reason + ' ' : ''}${links.length ? 'Отправьте текст мне любым удобным способом — он уже написан.' : 'Скопируйте текст и отправьте его мне — он уже написан.'}`;
    const pre = $('#doneMsg');
    pre.hidden = sent;
    pre.textContent = message;
    const acts = $('#doneActs');
    acts.innerHTML = '';
    if (!sent) {
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn-gold btn-sm';
      copy.textContent = 'Скопировать текст';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(message); copy.textContent = 'Скопировано'; }
        catch (e) { const r = document.createRange(); r.selectNodeContents(pre); getSelection().removeAllRanges(); getSelection().addRange(r); copy.textContent = 'Текст выделен'; }
        setTimeout(() => { copy.textContent = 'Скопировать текст'; }, 2000);
      });
      acts.append(copy);
      const add = (label, href) => { const a = document.createElement('a'); a.className = 'btn btn-line btn-sm'; a.textContent = label; a.href = href; if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; } acts.append(a); };
      if (ct.telegram) add('Открыть Telegram', `https://t.me/${ct.telegram}`);
      if (ct.whatsapp) add('WhatsApp', `https://wa.me/${ct.whatsapp}?text=${encodeURIComponent(message)}`);
      if (ct.email) add('Почта', `mailto:${ct.email}?subject=${encodeURIComponent('Запись на съёмку')}&body=${encodeURIComponent(message)}`);
    }
    box.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  /* ---------- Старт виджета ---------- */
  setLocation(state.loc);
})();
