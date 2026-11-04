/* Каста · концепт v11 — интерфейс и проигрыватель. 3D живёт в scenes.js.
   Звук пластинок — официальный плеер Spotify (Embed IFrame API); в tracks.js только ID треков. */
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
    paintPlayer();
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
  const fallback = $('.vinyl-fallback');
  let rel = 0;
  function renderRelease(animate) {
    const r = RELEASES[rel], x = r[lang];
    const fill = () => {
      $('.music-name', body).textContent = x.name;
      $('.music-meta', body).textContent = x.meta;
      $('.music-desc', body).textContent = x.desc;
      renderTracks();
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
  // Browsing the records plays them: picking a tab puts that record on.
  const browse = (i, focus) => {
    const same = i === rel;
    setRelease(i, focus);
    if (same && A.r === i && A.playing) return;
    playAt(i, 0);
  };
  tabs.forEach((tb, i) => {
    tb.addEventListener('click', () => browse(i));
    tb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        browse((rel + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      }
    });
  });

  /* ---------- the record player: the sound comes from the official Spotify player ---------- */
  // There are no audio files or audio links on this site: tracks.js holds only Spotify track IDs,
  // and the music streams inside Spotify's own embed (whole songs for people signed in to Spotify,
  // previews for everyone else). Our turntable, tracklist and buttons drive it through the Embed IFrame API.
  const DATA = window.__kastaTracks || [];
  const RKEYS = ['mama', 'greatest', 'nzr'];
  const relData = i => DATA.find(d => d.key === RKEYS[i]);
  const P = {
    ru: { put: 'Поставить пластинку', pause: 'Пауза', resume: 'Продолжить', again: 'Ещё раз', open: 'Открыть в Spotify',
          hero: 'Включить Greatest Hits', heroOn: 'Пауза', heroResume: 'Продолжить',
          vinyl: 'Поставить пластинку', vinylOn: 'Пауза или продолжить',
          note: 'Звук играет официальный плеер Spotify: если вы вошли в Spotify, песни звучат целиком, если нет — фрагментами.',
          failed: 'Плеер Spotify не загрузился (его может блокировать расширение браузера). Кнопка откроет альбом в Spotify.' },
    en: { put: 'Put the record on', pause: 'Pause', resume: 'Resume', again: 'Play again', open: 'Open in Spotify',
          hero: 'Play Greatest Hits', heroOn: 'Pause', heroResume: 'Resume',
          vinyl: 'Put the record on', vinylOn: 'Pause or resume',
          note: 'The sound comes from the official Spotify player: whole songs if you are signed in to Spotify, previews if not.',
          failed: 'The Spotify player did not load (a browser extension may block it). The button opens the album in Spotify.' },
  };
  const p = () => P[lang];
  const A = window.__kastaAudio = { playing: false, progress: 0, level: 0, r: -1, k: -1 };
  const np = $('#np');
  let ctl = null, ctlP = null, spFailed = false, albumDone = false, npClosed = false;
  let pos = 0, dur = 0, posAt = 0, endedUri = '', watchdog = 0, wantPlay = 0, readyTimer = 0;
  let expectUri = '', startedUri = '', tries = 0, checkTimer = 0;

  const loadSpotify = () => {
    if (ctlP) return ctlP;
    ctlP = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 15000);
      window.onSpotifyIframeApiReady = API => {
        API.createController($('.js-sp'), { uri: relData(rel).tracks[0].uri, width: '100%', height: 80 }, c => {
          clearTimeout(timer);
          ctl = c;
          c.addListener('playback_update', onUpdate);
          // a freshly loaded track says "ready"; only then does play() stick, even after quick clicks
          c.addListener('ready', () => { if (wantPlay) { wantPlay = 0; clearTimeout(readyTimer); c.play(); } });
          c.addListener('playback_started', e => { startedUri = (e && e.data && e.data.playingURI) || startedUri; });
          resolve(c);
        });
      };
      const sc = document.createElement('script');
      sc.src = 'https://open.spotify.com/embed/iframe-api/v1';
      sc.async = true;
      sc.onerror = () => { clearTimeout(timer); reject(new Error('blocked')); };
      document.head.append(sc);
    });
    ctlP.catch(() => { spFailed = true; A.playing = false; A.r = -1; paintPlayer(); });
    return ctlP;
  };
  // get the player ready a moment after the page settles, so the first press plays at once
  addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(() => loadSpotify()), 2000));

  function onUpdate(e) {
    const d = e.data || {};
    // late frames from the track we just left must not move the needle or end the album
    if (expectUri && d.playingURI && d.playingURI !== expectUri) return;
    pos = (d.position || 0) / 1000; dur = (d.duration || 0) / 1000; posAt = performance.now();
    if (dur > 0) clearTimeout(watchdog);
    // the embed holds the last frame as "playing" when a track runs out: that is the end
    if (dur > 0 && d.position >= d.duration - 80 && !d.isPaused) {
      if (endedUri !== d.playingURI) { endedUri = d.playingURI; onEnded(); }
      return;
    }
    const was = A.playing;
    A.playing = !d.isPaused;
    if (A.playing !== was) paintPlayer();
    if (A.playing) startLevels();
  }
  function onEnded() {
    const n = relData(A.r).tracks.length;
    if (A.k + 1 < n) { playAt(A.r, A.k + 1); return; }
    albumDone = true; A.playing = false; pos = 0;
    if (ctl) ctl.pause();
    paintPlayer();
  }

  function playAt(r, k) {
    const d = relData(r);
    if (!d || !d.tracks[k]) return;
    if (spFailed) { window.open(d.url, '_blank', 'noopener'); return; }
    A.r = r; A.k = k; albumDone = false; npClosed = false; endedUri = ''; pos = 0; dur = 0; posAt = performance.now();
    A.playing = true;                       // the needle drops while Spotify buffers
    paintPlayer(); startLevels();
    const uri = d.tracks[k].uri;
    const load = c => {
      wantPlay = 1;
      c.loadUri(uri);
      clearTimeout(readyTimer);
      readyTimer = setTimeout(() => { if (wantPlay) { wantPlay = 0; c.play(); } }, 1500);
    };
    // a load that lands while the previous track is still buffering can be dropped by the embed: try again
    const check = c => {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(() => {
        if (expectUri !== uri || startedUri === uri) return;
        if (++tries > 3) { A.playing = false; paintPlayer(); return; }
        load(c); check(c);
      }, 3500);
    };
    const go = c => { expectUri = uri; tries = 0; load(c); check(c); };
    if (ctl) go(ctl); else loadSpotify().then(go).catch(() => {});
    clearTimeout(watchdog);
    watchdog = setTimeout(() => { if (A.r === r && A.k === k && startedUri !== uri) { A.playing = false; paintPlayer(); } }, 18000);
  }
  const nextTrack = () => { if (A.r >= 0) playAt(A.r, (A.k + 1) % relData(A.r).tracks.length); };
  const toggleCurrent = () => {
    if (A.r < 0) return;
    if (albumDone || !ctl) { playAt(A.r, albumDone ? 0 : A.k); return; }
    npClosed = false;
    if (A.playing) ctl.pause(); else ctl.resume();
    A.playing = !A.playing; posAt = performance.now();
    paintPlayer(); if (A.playing) startLevels();
  };
  const toggle = () => { if (A.r !== rel || A.r < 0) playAt(rel, 0); else toggleCurrent(); };

  // the turntable needs a smooth position between Spotify's once-a-second updates;
  // the sound itself is closed inside Spotify's player, so the logo simply breathes while music plays
  let lvRaf = 0;
  function startLevels() { if (!lvRaf) lvRaf = requestAnimationFrame(levels); }
  function levels(now) {
    const cur = pos + (A.playing && dur ? (now - posAt) / 1000 : 0);
    A.progress = dur ? Math.min(1, cur / dur) : 0;
    const target = A.playing && !reduced ? 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(now / 1000 * Math.PI)) : 0;
    A.level += (target - A.level) * 0.05;
    if (A.playing || A.level > 0.01) lvRaf = requestAnimationFrame(levels); else lvRaf = 0;
  }

  const fmt = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
  const trackList = $('.js-tracks');
  function renderTracks() {
    const d = relData(rel);
    if (!d) return;
    $('.js-r-full').href = d.url;
    trackList.replaceChildren(...d.tracks.map((tr, k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'trk'; b.dataset.k = k;
      b.innerHTML = `<span class="trk-n">${tr.n}</span><span class="trk-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`
        + `<span class="trk-t"></span><span class="trk-d">${fmt(tr.dur)}</span>`;
      const tt = $('.trk-t', b);
      tt.textContent = lang === 'en' ? tr.en : tr.ru;
      if (tr.feat) { const sm = document.createElement('small'); sm.textContent = 'feat. ' + tr.feat; tt.append(' ', sm); }
      const by = lang === 'en' ? tr.by[1] : tr.by[0];
      if (!/^(Каста|Kasta)$/.test(by)) { const sm = document.createElement('small'); sm.textContent = by; tt.append(' ', sm); }
      b.addEventListener('click', () => playAt(rel, k));
      li.append(b);
      return li;
    }));
    paintPlayer();
  }

  const playBtn = $('.js-play'), playLbl = $('.js-play-label');
  const heroBtn = $('.js-hero-play'), heroLbl = $('.js-hero-play-label');
  const vinylBox = $('#vinyl'), note = $('.music-note');
  function paintPlayer() {
    const onHere = A.r === rel && A.r >= 0;
    const playingHere = onHere && A.playing;
    playLbl.textContent = spFailed ? p().open : playingHere ? p().pause : onHere && albumDone ? p().again : onHere && pos > 0 ? p().resume : p().put;
    playBtn.setAttribute('aria-pressed', String(playingHere));
    playBtn.classList.toggle('is-on', playingHere);
    const gh = A.r === 1;
    heroLbl.textContent = gh && A.playing ? p().heroOn : gh && pos > 0 && !albumDone ? p().heroResume : p().hero;
    heroBtn.setAttribute('aria-pressed', String(gh && A.playing));
    heroBtn.classList.toggle('is-on', gh && A.playing);
    vinylBox.title = playingHere ? p().vinylOn : p().vinyl;
    note.textContent = spFailed ? p().failed : p().note;
    $$('.trk', trackList).forEach(b => {
      const cur = onHere && +b.dataset.k === A.k;
      b.classList.toggle('is-current', cur);
      b.classList.toggle('is-playing', cur && A.playing);
      if (cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    const curRow = $('.trk.is-current', trackList);
    if (curRow) {
      const top = curRow.offsetTop - trackList.offsetTop, h = curRow.offsetHeight;
      if (top < trackList.scrollTop || top + h > trackList.scrollTop + trackList.clientHeight) trackList.scrollTo({ top: top - h, behavior: reduced ? 'auto' : 'smooth' });
    }
    // Spotify's own player rides along at the bottom of the screen while the music is on
    np.classList.toggle('is-off', A.r < 0 || npClosed);
    np.classList.toggle('is-playing', A.playing);
    document.documentElement.classList.toggle('is-playing', A.playing);
  }

  playBtn.addEventListener('click', toggle);
  vinylBox.addEventListener('click', toggle);
  heroBtn.addEventListener('click', () => {
    if (A.r === 1 && !albumDone && (A.playing || pos > 0)) { toggleCurrent(); return; }
    if (rel !== 1) setRelease(1);
    playAt(1, 0);
  });
  // over the music section the bar moves under the turntable, so it never covers the buttons
  new IntersectionObserver(([e]) => np.classList.toggle('is-left', e.isIntersecting), { threshold: 0.2 }).observe($('#music'));
  $('.js-np-next').addEventListener('click', nextTrack);
  $('.js-np-close').addEventListener('click', () => { if (ctl) ctl.pause(); A.playing = false; npClosed = true; paintPlayer(); });
  addEventListener('keydown', e => {
    if (e.key === ' ' && A.r >= 0 && document.activeElement === document.body) { e.preventDefault(); toggleCurrent(); }
  });
  renderTracks();

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
