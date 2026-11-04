/* Каста · концепт v10 — интерфейс без зависимостей. 3D живёт в scenes.js. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  /* ---------- language ---------- */
  const T = {
    ru: {
      title: 'Каста · Концепт сайта',
      months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
      days: n => {
        const m10 = n % 10, m100 = n % 100;
        return m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней';
      },
      when: n => n === 0 ? 'сегодня' : n === 1 ? 'завтра' : `через ${n} ${T.ru.days(n)}`,
      count: n => n <= 1 ? T.ru.when(n) : `${n} ${T.ru.days(n)}`,
      countLabel: city => `до концерта в городе ${city}`,
      played: '· прошёл', done: 'Тур сыгран', thanks: 'спасибо, что пришли',
    },
    en: {
      title: 'Kasta · Website concept',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      days: n => n === 1 ? 'day' : 'days',
      when: n => n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`,
      count: n => n <= 1 ? T.en.when(n) : `${n} days`,
      countLabel: city => `until the show in ${city}`,
      played: '· played', done: 'Tour played', thanks: 'thanks for coming',
    },
  };
  let lang = 'ru';
  try {
    lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('kasta-lang')
      || ((navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en');
  } catch (e) {}
  if (!T[lang]) lang = 'ru';
  const t = () => T[lang];

  const ATTRS = ['aria-label', 'alt', 'href'];
  const applyLang = () => {
    document.documentElement.lang = lang;
    document.title = t().title;
    $$('[data-en]').forEach(el => {
      if (el._ru === undefined) el._ru = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el._ru;
    });
    ATTRS.forEach(a => $$(`[data-en-${a}]`).forEach(el => {
      const key = '_ru_' + a;
      if (el[key] === undefined) el[key] = el.getAttribute(a);
      el.setAttribute(a, lang === 'en' ? el.getAttribute(`data-en-${a}`) : el[key]);
    }));
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    refreshTour();
    renderRelease(false);
    if (curV) showFacts(curV);
    doFit();
    emit('kasta:lang', { lang });
  };
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('kasta-lang', lang); } catch (e) {}
    applyLang();
  }));

  /* ---------- top bar ---------- */
  const bar = $('#bar');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    bar.classList.toggle('is-solid', y > 40);
    bar.classList.toggle('is-hidden', y > 600 && y > lastY + 4);
    if (y < lastY - 4 || y < 600) bar.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- phone menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('.bar-menu');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu).focus();
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $('.menu-close').addEventListener('click', () => { setMenu(false); menuBtn.focus(); });
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- entrances ---------- */
  const hero = $('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('in')));
  $$('[data-reveal]').forEach(el => [...el.children].forEach((c, i) => { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); }));
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('in'));
  }

  /* ---------- tour: real countdown + the globe ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysTo = iso => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.round((new Date(y, m - 1, d) - today) / 864e5);
  };
  const gigs = $$('.gig');
  gigs.forEach(g => { g.dataset.days = daysTo(g.dataset.date); if (+g.dataset.days < 0) g.classList.add('is-past'); });
  const next = gigs.find(g => +g.dataset.days >= 0);
  const city = g => lang === 'en' ? g.dataset.cityEn : g.dataset.city;
  const cd = $('.js-countdown'), cdl = $('.js-countdown-label');
  const nowDays = $('.js-now-days'), nowPlace = $('.js-now-place'), nowLink = $('.js-now-link');
  let active = -1;

  const showGig = i => {
    const g = gigs[i];
    const [, m, d] = g.dataset.date.split('-').map(Number);
    const n = +g.dataset.days;
    nowDays.textContent = `${d} ${t().months[m - 1]}${n >= 0 ? ', ' + t().when(n) : ''}`;
    nowPlace.textContent = `${city(g)}, ${g.dataset.venue}`;
    nowLink.href = g.dataset.url;
  };
  function refreshTour() {
    gigs.forEach(g => {
      const n = +g.dataset.days;
      $('.gig-days', g).textContent = n < 0 ? t().played : '· ' + t().when(n);
    });
    if (next) { cd.textContent = t().count(+next.dataset.days); cdl.textContent = t().countLabel(city(next)); }
    else { cd.textContent = t().done; cdl.textContent = t().thanks; }
    if (active >= 0) showGig(active);
  }
  const focusGig = (i, fromUser) => {
    if (i === active) return;
    active = i;
    gigs.forEach((g, k) => g.classList.toggle('is-active', k === i));
    showGig(i);
    emit('kasta:gig', { i, user: !!fromUser });
  };
  gigs.forEach((g, i) => {
    if (fine) g.addEventListener('pointerenter', () => focusGig(i, true));
    $('.gig-pin', g).addEventListener('click', () => focusGig(i, true));
    $('.gig-buy', g).addEventListener('focus', () => focusGig(i, true));
  });
  focusGig(Math.max(0, gigs.indexOf(next)), false);
  window.__kastaGigs = gigs.map(g => ({ city: g.dataset.city, lat: +g.dataset.lat, lon: +g.dataset.lon }));
  window.__kastaActiveGig = () => active;
  addEventListener('kasta:globe-pick', e => focusGig(e.detail.i, true));

  /* ---------- music tabs ---------- */
  const RELEASES = [
    { img: 'assets/img/mama-sq.jpg', listen: 'https://kasta.world/release/mama-prosnis/',
      ru: { name: 'Мама, проснись', meta: 'Шым · сингл · сентябрь 2026', desc: 'Первый за 100 лет сингл Шыма из Касты. Уже на всех площадках.', alt: 'Обложка сингла «Мама, проснись»: ночной двор, увиденный из кабины самолёта' },
      en: { name: 'Mama, prosnis', meta: 'Shym · single · September 2026', desc: 'The first single in 100 years from Shym of Kasta. Out on every platform.', alt: 'Cover of the single “Mama, prosnis”: a night courtyard seen from a cockpit' } },
    { img: 'assets/img/greatest-sq.jpg', listen: 'https://open.spotify.com/album/0DHuVgG2fQzfYk7QJaOiY3',
      ru: { name: 'Greatest Hits', meta: 'Каста · сборник · октябрь 2025', desc: '30 главных треков группы за всю её историю — одним альбомом и одним туром.', alt: 'Обложка сборника Greatest Hits: Каста на фоне золотой монеты' },
      en: { name: 'Greatest Hits', meta: 'Kasta · compilation · October 2025', desc: 'The band’s 30 biggest tracks from its whole history, in one album and one tour.', alt: 'Cover of Greatest Hits: Kasta in front of a gold coin' } },
    { img: 'assets/img/nzr-sq.jpg', listen: 'https://kasta.world/novinki-zarubezhnogo-repa-na-vinile/',
      ru: { name: 'Новинки зарубежного рэпа', meta: 'Каста · альбом · теперь на виниле', desc: 'Для ценителей аналога, лампы, аудиофильской акустики. Или просто в подарок.', alt: 'Обложка альбома «Новинки зарубежного рэпа»' },
      en: { name: 'Novinki zarubezhnogo repa', meta: 'Kasta · album · now on vinyl', desc: 'For lovers of analogue, valve amps and audiophile speakers. Or just as a gift.', alt: 'Cover of the album “Novinki zarubezhnogo repa”' } },
  ];
  window.__kastaReleases = RELEASES;
  const tabs = $$('.tab');
  const body = $('.music-body');
  const listen = $('.js-r-listen');
  const fallback = $('.vinyl-fallback');
  let rel = 0;
  function renderRelease(animate) {
    const r = RELEASES[rel], x = r[lang];
    const fill = () => {
      $('.music-name', body).textContent = x.name;
      $('.music-meta', body).textContent = x.meta;
      $('.music-desc', body).textContent = x.desc;
      listen.href = r.listen;
      fallback.src = r.img; fallback.alt = x.alt;
      body.classList.remove('is-swapping');
    };
    if (!animate || reduced) { fill(); return; }
    body.classList.add('is-swapping');
    setTimeout(fill, 220);
  }
  const setRelease = (i, focus) => {
    if (i === rel) return;
    rel = i;
    tabs.forEach((tb, k) => { tb.setAttribute('aria-selected', String(k === i)); tb.tabIndex = k === i ? 0 : -1; });
    if (focus) tabs[i].focus();
    renderRelease(true);
    emit('kasta:release', { i });
  };
  tabs.forEach((tb, i) => {
    tb.addEventListener('click', () => setRelease(i));
    tb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setRelease((rel + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      }
    });
  });

  /* ---------- video: names passing the held square ---------- */
  const vItems = $$('.video-list li[data-thumb]');
  const imgA = $('.js-vf-a'), imgB = $('.js-vf-b');
  const vKind = $('.js-vf-kind'), vTime = $('.js-vf-time');
  let front = imgA, back = imgB, curV = null, token = 0;
  function showFacts(li) {
    vKind.textContent = lang === 'en' ? li.dataset.kindEn : li.dataset.kind;
    vTime.textContent = li.dataset.time;
  }
  const setVideo = li => {
    if (li === curV) return;
    curV = li;
    const my = ++token;
    vItems.forEach(x => x.classList.toggle('is-current', x === li));
    showFacts(li);
    const img = back;
    img.onload = null;
    img.src = li.dataset.thumb;
    const swap = () => {
      if (my !== token || img !== back) return;
      img.style.opacity = 1; front.style.opacity = 0;
      back = front; front = img;
    };
    if (img.complete && img.naturalWidth) swap(); else img.onload = swap;
  };
  if (vItems.length) {
    setVideo(vItems[0]);
    const vio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setVideo(e.target); }), { rootMargin: '-50% 0px -50% 0px' });
    vItems.forEach(li => vio.observe(li));
    vItems.forEach(li => fine && $('a', li).addEventListener('pointerenter', () => setVideo(li)));
  }

  /* ---------- video player ---------- */
  const player = $('#player');
  const frame = $('.player-frame', player);
  player.addEventListener('close', () => { frame.innerHTML = ''; });
  $('.player-close', player).addEventListener('click', () => player.close());
  player.addEventListener('click', e => { if (e.target === player) player.close(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-video]');
    if (!a || typeof player.showModal !== 'function') return;
    e.preventDefault();
    const title = (lang === 'en' && a.dataset.titleEn) || a.dataset.title || '';
    const ifr = document.createElement('iframe');
    ifr.src = `https://www.youtube-nocookie.com/embed/${a.dataset.video}?autoplay=1&rel=0`;
    ifr.title = title;
    ifr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    ifr.allowFullscreen = true;
    frame.replaceChildren(ifr);
    $('.player-title', player).textContent = title;
    player.showModal();
  });

  /* ---------- news: picture follows the pointer ---------- */
  const peek = $('.news-peek');
  if (peek && fine) {
    const pimg = $('img', peek);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * .18; y += (ty - y) * .18;
      peek.style.transform = `translate3d(${x + 24}px, ${y - 90}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .5 ? requestAnimationFrame(loop) : 0;
    };
    $$('.news-row').forEach(row => {
      row.addEventListener('pointerenter', e => { pimg.src = row.dataset.img; peek.classList.add('is-on'); x = tx = e.clientX; y = ty = e.clientY; loop(); });
      row.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      row.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
    });
  }

  /* ---------- photo strip: drag to scroll ---------- */
  const strip = $('.strip');
  if (strip && fine) {
    let down = false, sx = 0, sl = 0, moved = 0, v = 0, lastX = 0, lastT = 0;
    strip.addEventListener('pointerdown', e => {
      down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft; lastX = e.clientX; lastT = performance.now();
      strip.setPointerCapture(e.pointerId); strip.classList.add('is-drag');
    });
    strip.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      strip.scrollLeft = sl - dx;
      const tm = performance.now(); v = (e.clientX - lastX) / Math.max(1, tm - lastT); lastX = e.clientX; lastT = tm;
    });
    const up = () => {
      if (!down) return; down = false; strip.classList.remove('is-drag');
      if (!reduced) { let vel = v * 16; const glide = () => { if (Math.abs(vel) < .5) return; strip.scrollLeft -= vel; vel *= .92; requestAnimationFrame(glide); }; glide(); }
    };
    strip.addEventListener('pointerup', up); strip.addEventListener('pointercancel', up);
    strip.addEventListener('click', e => { if (moved > 6) e.preventDefault(); }, true);
  }

  /* ---------- booking address fitted to the width ---------- */
  const fit = $('.js-fit');
  function doFit() {
    if (!fit) return;
    if (innerWidth <= 640) { fit.style.fontSize = ''; return; }
    fit.style.fontSize = '100px';
    const w = fit.scrollWidth, avail = fit.parentElement.clientWidth - parseFloat(getComputedStyle(fit.parentElement).paddingLeft) * 2;
    fit.style.fontSize = (100 * avail / w * .995).toFixed(2) + 'px';
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(doFit);
  addEventListener('resize', doFit);

  applyLang();
})();
