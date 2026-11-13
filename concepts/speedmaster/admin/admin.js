// Speed Master dealer panel (demo): Início, Motas (list and edit), Pedidos.
// Everything goes through assets/store.js, the same store the public pages read.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (v) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const num = (v) => new Intl.NumberFormat('pt-PT').format(v);
  const int = (v) => { const d = String(v || '').replace(/\D/g, ''); return d ? parseInt(d, 10) : null; };
  const dec = (v) => { const s = String(v || '').replace(',', '.').replace(/[^\d.]/g, ''); return s ? parseFloat(s) : null; };
  const TZ = 'Europe/Lisbon';
  const when = (iso) => new Intl.DateTimeFormat('pt-PT', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const day = (d) => new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(d + 'T12:00:00'));
  const site = (id) => `../mota/?id=${encodeURIComponent(id)}`;
  const tel = (p) => String(p).replace(/[^\d+]/g, '');
  const wa = (p) => { let d = String(p).replace(/\D/g, ''); if (d.length === 9) d = '351' + d; return d.length >= 11 ? `https://wa.me/${d}` : ''; };

  const ST = { available: 'À venda', reserved: 'Reservada', sold: 'Vendida' };
  const STP = { all: 'Todas', available: 'À venda', reserved: 'Reservadas', sold: 'Vendidas' };
  const CATS = { scooter: 'Scooter', naked: 'Naked', trail: 'Trail', scrambler: 'Scrambler', custom: 'Custom', sport: 'Desportiva' };
  const COLORS = { black: 'Preto', white: 'Branco', grey: 'Cinzento', blue: 'Azul', red: 'Vermelho', green: 'Verde', yellow: 'Amarelo', orange: 'Laranja', tricolour: 'Tricolor' };
  const KINDS = { ride: 'Test-ride', reserve: 'Reserva', trade: 'Avaliação de mota', service: 'Oficina', other: 'Outro' };

  let toastT;
  function toast(msg, link) {
    const el = $('#toast');
    el.innerHTML = esc(msg) + (link ? ` <a href="${link.href}" target="_blank" rel="noopener">${esc(link.text)}</a>` : '');
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('on'), 3400);
  }
  function badge() {
    const n = SM.requests().filter((r) => r.status === 'new').length, b = $('#badge');
    b.hidden = !n;
    b.textContent = n;
  }

  /* requests, used on Início and Pedidos */
  const emptyReq = (f) => `<p class="empty">${f === 'done' ? 'Ainda não há pedidos tratados.' : 'Ainda não há pedidos. Abra uma mota no site e carregue em «Marcar test-ride» para ver como chega aqui.'} <a href="../motas/" target="_blank" rel="noopener">Abrir o site</a></p>`;
  function reqItem(r) {
    const done = r.status === 'done';
    const bike = !r.bike ? '' : r.bikeId && SM.get(r.bikeId) ? `<a href="${site(r.bikeId)}" target="_blank" rel="noopener">${esc(r.bike)}</a>` : esc(r.bike);
    return `<li class="req${done ? ' is-done' : ''}" data-rid="${esc(r.id)}">
      <div class="req-top"><span><span class="kind">${KINDS[r.kind] || 'Pedido'}</span>${done ? '' : '<span class="new">Novo</span>'}</span><span class="nums">${when(r.at)}</span></div>
      <p class="req-nm"><b>${esc(r.name)}</b> · <a class="nums" href="tel:${esc(tel(r.phone))}">${esc(r.phone)}</a></p>
      ${bike ? `<p>${bike}</p>` : ''}${r.date ? `<p>Dia preferido: ${esc(day(r.date))}</p>` : ''}${r.msg ? `<p class="req-msg">${esc(r.msg)}</p>` : ''}
      <div class="req-acts"><a class="sbtn" href="tel:${esc(tel(r.phone))}">Ligar</a>${wa(r.phone) ? `<a class="sbtn" href="${wa(r.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button type="button" class="${done ? 'sbtn' : 'pbtn'}" data-done="${done ? 0 : 1}">${done ? 'Voltar a abrir' : 'Marcar como tratado'}</button></div>
    </li>`;
  }
  function bindReqs() {
    $$('[data-done]', view).forEach((x) => x.addEventListener('click', () => {
      const close = x.dataset.done === '1';
      SM.setRequest(x.closest('.req').dataset.rid, { status: close ? 'done' : 'new' });
      toast(close ? 'Pedido marcado como tratado.' : 'Pedido aberto de novo.');
    }));
  }

  /* Início */
  function home() {
    const all = SM.all(), reqs = SM.requests(), cnt = (s) => all.filter((b) => b.status === s).length;
    const fresh = reqs.filter((r) => r.status === 'new').length;
    const h = +new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date());
    const today = new Intl.DateTimeFormat('pt-PT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    view.innerHTML = `
      <header class="vh"><div><h1>${h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'}</h1><p class="muted">${today}</p></div><a class="pbtn" href="#nova">+ Adicionar mota</a></header>
      <div class="kpis">
        <a class="kpi" href="#motas?f=available"><span class="kpi-n nums">${cnt('available')}</span><span>À venda</span></a>
        <a class="kpi" href="#motas?f=reserved"><span class="kpi-n nums">${cnt('reserved')}</span><span>Reservadas</span></a>
        <a class="kpi" href="#motas?f=sold"><span class="kpi-n nums">${cnt('sold')}</span><span>Vendidas</span></a>
        <a class="kpi${fresh ? ' hot' : ''}" href="#pedidos"><span class="kpi-n nums">${fresh}</span><span>Pedidos novos</span></a>
      </div>
      <section class="box"><div class="box-h"><h2>Últimos pedidos</h2><a href="#pedidos">Ver todos</a></div>${reqs.length ? `<ul class="reqs">${reqs.slice(0, 3).map(reqItem).join('')}</ul>` : emptyReq()}</section>
      <section class="box"><h2>Como funciona</h2><ol class="how">
        <li><b>Adicione a mota</b> com as fotos tiradas no telemóvel. A carta necessária é calculada sozinha.</li>
        <li><b>Mude o estado</b> num toque: à venda, reservada ou vendida. O site atualiza logo.</li>
        <li><b>Os pedidos</b> de test-ride, reserva, avaliação e oficina chegam aqui, com o telefone do cliente.</li>
      </ol></section>`;
    bindReqs();
  }

  /* Motas: list with one-tap status */
  let filter = 'all', query = '';
  function motas(qs) {
    if (qs.get('f') && STP[qs.get('f')]) filter = qs.get('f');
    view.innerHTML = `
      <header class="vh"><h1>Motas</h1><a class="pbtn" href="#nova">+ Adicionar mota</a></header>
      <div class="filters">
        <input type="search" id="q" placeholder="Procurar marca ou modelo" aria-label="Procurar marca ou modelo" value="${esc(query)}">
        <div class="seg" role="group" aria-label="Estado">${Object.keys(STP).map((k) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${STP[k]}</button>`).join('')}</div>
      </div>
      <p class="count" id="count"></p>
      <ul class="rows" id="rows"></ul>`;
    $('#q').addEventListener('input', (e) => { query = e.target.value; rows(); });
    $$('[data-f]', view).forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.f;
      $$('[data-f]', view).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      rows();
    }));
    rows();
  }
  function rows() {
    const q = query.trim().toLowerCase();
    const list = SM.all().filter((b) => (filter === 'all' || b.status === filter) && (!q || `${b.name} ${b.year || ''}`.toLowerCase().includes(q)));
    $('#count').textContent = list.length === 1 ? '1 mota' : `${list.length} motas`;
    $('#rows').innerHTML = list.length ? list.map((b) => {
      const ph = b.cover || (b.photos || [])[0];
      return `<li class="r" data-id="${esc(b.id)}">
        <a class="r-main" href="#mota/${encodeURIComponent(b.id)}">${ph ? `<img class="r-th" ${SM.img(ph)} alt="" loading="lazy">` : '<span class="r-th"></span>'}<span class="r-tx"><b>${esc(b.name)}</b><span class="nums">${[b.year, b.km != null ? num(b.km) + ' km' : ''].filter(Boolean).join(' · ')}</span></span><span class="r-pr nums">${b.price ? eur(b.price) : 'Sob consulta'}</span></a>
        <div class="st" role="group" aria-label="Estado de ${esc(b.name)}">${Object.keys(ST).map((s) => `<button type="button" data-s="${s}" aria-pressed="${b.status === s}">${ST[s]}</button>`).join('')}</div>
      </li>`;
    }).join('') : '<li class="empty">Nada encontrado. <a href="#nova">Adicionar uma mota</a></li>';
    $$('[data-s]', $('#rows')).forEach((btn) => btn.addEventListener('click', () => {
      const id = btn.closest('.r').dataset.id, b = SM.get(id), s = btn.dataset.s;
      if (!b || b.status === s) return;
      SM.upsert({ ...b, status: s });
      toast(`${b.name}: ${ST[s].toLowerCase()}.`, { href: site(id), text: 'Ver no site' });
    }));
    SM.hydrate($('#rows'));
  }

  /* Add or edit one bike */
  function edit(id) {
    const b = id ? SM.get(id) : null;
    if (id && !b) { view.innerHTML = '<a class="back" href="#motas">← Motas</a><p class="empty">Esta mota já não existe.</p>'; return; }
    const v = b || { brand: '', model: '', cat: 'naked', color: 'black', status: 'available', photos: [] };
    let photos = (v.photos && v.photos.length ? v.photos : v.cover ? [v.cover] : []).slice();
    let status = v.status || 'available';
    const opt = (o, cur) => Object.keys(o).map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${o[k]}</option>`).join('');
    view.innerHTML = `
      <a class="back" href="#motas">← Motas</a>
      <header class="vh"><h1>${b ? esc(b.name) : 'Nova mota'}</h1>${b ? `<a class="sbtn" href="${site(b.id)}" target="_blank" rel="noopener">Ver no site</a>` : ''}</header>
      <form class="ed" id="ed" novalidate>
        <section class="box"><h2>Fotos</h2>
          <div class="phs" id="phs"></div>
          <label class="drop" id="drop"><input type="file" id="file" accept="image/*" multiple><span><b>Adicionar fotos</b><br>Tire na hora ou escolha da galeria. A primeira é a capa.</span></label>
        </section>
        <section class="box"><h2>A mota</h2>
          <div class="fg two"><label>Marca<input name="brand" list="brands" value="${esc(v.brand)}" autocomplete="off" required></label><label>Modelo<input name="model" value="${esc(v.model)}" autocomplete="off" required></label></div>
          <div class="fg three"><label>Ano<input name="year" inputmode="numeric" value="${v.year || ''}"></label><label>Quilómetros<input name="km" inputmode="numeric" value="${v.km != null ? v.km : ''}"></label><label>Preço (€)<input name="price" inputmode="numeric" value="${v.price || ''}" placeholder="Vazio: sob consulta"></label></div>
          <div class="fg three"><label>Cilindrada (cc)<input name="cc" inputmode="numeric" value="${v.cc || ''}"></label><label>Potência (kW)<input name="kw" inputmode="decimal" value="${v.kw != null ? String(v.kw).replace('.', ',') : ''}"></label><label>Tipo<select name="cat">${opt(CATS, v.cat)}</select></label></div>
          <div class="fg two"><label>Cor<select name="color">${opt(COLORS, v.color)}</select></label><p class="licbox">Carta necessária <b id="licv"></b><span class="hint">Calculada pela cilindrada e pela potência</span></p></div>
        </section>
        <section class="box"><h2>No site</h2>
          <div class="seg" id="st" role="group" aria-label="Estado">${Object.keys(ST).map((s) => `<button type="button" data-s="${s}" aria-pressed="${s === status}">${ST[s]}</button>`).join('')}</div>
          <label class="check"><input type="checkbox" name="featured"${v.featured ? ' checked' : ''}> Mostrar em destaque na página inicial</label>
        </section>
        <div class="savebar">${b ? '<button type="button" class="dbtn" id="del">Apagar mota</button>' : ''}<a class="sbtn" href="#motas">Cancelar</a><button class="pbtn" type="submit">Guardar</button></div>
      </form>`;
    const form = $('#ed'), f = form.elements;
    const licv = () => { $('#licv').textContent = SM.lic({ cc: int(f.cc.value), kw: dec(f.kw.value) }); };
    f.cc.addEventListener('input', licv);
    f.kw.addEventListener('input', licv);
    licv();

    function drawPhotos() {
      $('#phs').innerHTML = photos.length ? photos.map((p, i) => `<figure class="ph"><img ${SM.img(p)} alt="Foto ${i + 1}">${i ? `<button type="button" class="ph-b" data-cover="${i}">Tornar capa</button>` : '<span class="cover">Capa</span>'}<button type="button" class="ph-x" data-rm="${i}" aria-label="Remover foto ${i + 1}">×</button></figure>`).join('') : '<p class="muted">Ainda sem fotos.</p>';
      SM.hydrate($('#phs'));
      $$('[data-cover]', view).forEach((x) => x.addEventListener('click', () => { photos.unshift(...photos.splice(+x.dataset.cover, 1)); drawPhotos(); }));
      $$('[data-rm]', view).forEach((x) => x.addEventListener('click', () => { photos.splice(+x.dataset.rm, 1); drawPhotos(); }));
    }
    drawPhotos();
    $('#file').addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, 12);
      if (!files.length) return;
      $('#drop').classList.add('is-busy');
      try {
        for (const file of files) photos.push(await SM.addPhoto(file));
        toast(files.length === 1 ? 'Foto adicionada. Carregue em Guardar.' : `${files.length} fotos adicionadas. Carregue em Guardar.`);
      } catch (err) { toast('Não foi possível guardar a foto neste navegador.'); }
      $('#drop').classList.remove('is-busy');
      e.target.value = '';
      drawPhotos();
    });
    $$('#st button').forEach((x) => x.addEventListener('click', () => {
      status = x.dataset.s;
      $$('#st button').forEach((y) => y.setAttribute('aria-pressed', String(y === x)));
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const brand = f.brand.value.trim(), model = f.model.value.trim(), year = int(f.year.value);
      if (!brand || !model) { toast('Falta a marca ou o modelo.'); (brand ? f.model : f.brand).focus(); return; }
      const rec = {
        id: b ? b.id : SM.newId({ brand, model, year }),
        brand, model, year, km: int(f.km.value), cc: int(f.cc.value), kw: dec(f.kw.value),
        cat: f.cat.value, color: f.color.value, price: int(f.price.value), status, featured: f.featured.checked,
        photos: photos.slice(),
        cover: b && b.cover && (b.photos || [])[0] === photos[0] ? b.cover : null
      };
      try { SM.upsert(rec); } catch (err) { toast('Sem espaço neste navegador para guardar.'); return; }
      toast(b ? 'Guardado. O site já mostra as alterações.' : 'Mota adicionada ao site.', { href: site(rec.id), text: 'Ver no site' });
      if (!b) location.hash = '#mota/' + encodeURIComponent(rec.id);
    });
    if (b) $('#del').addEventListener('click', () => {
      if (!confirm(`Apagar ${b.name}? Deixa de aparecer no site.`)) return;
      SM.remove(b.id);
      toast('Mota apagada.');
      location.hash = '#motas';
    });
  }

  /* Pedidos */
  let rf = 'new';
  function pedidos() {
    view.innerHTML = `
      <header class="vh"><h1>Pedidos</h1></header>
      <div class="filters"><div class="seg" role="group" aria-label="Mostrar">${[['new', 'Novos'], ['done', 'Tratados'], ['all', 'Todos']].map(([k, l]) => `<button type="button" data-rf="${k}" aria-pressed="${k === rf}">${l}</button>`).join('')}</div></div>
      <ul class="reqs" id="reqs"></ul>`;
    $$('[data-rf]', view).forEach((x) => x.addEventListener('click', () => {
      rf = x.dataset.rf;
      $$('[data-rf]', view).forEach((y) => y.setAttribute('aria-pressed', String(y === x)));
      drawReqs();
    }));
    drawReqs();
  }
  function drawReqs() {
    const list = SM.requests().filter((r) => rf === 'all' || r.status === rf);
    $('#reqs').innerHTML = list.length ? list.map(reqItem).join('') : `<li>${emptyReq(rf)}</li>`;
    bindReqs();
  }

  /* routing */
  let cur = '';
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'inicio';
    const [path, qs] = h.split('?'), [name, ...rest] = path.split('/');
    cur = name === 'mota' || name === 'nova' ? 'edit' : ['motas', 'pedidos'].includes(name) ? name : 'inicio';
    $$('.tabs a').forEach((a) => (a.dataset.v === (cur === 'edit' ? 'motas' : cur) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (cur === 'edit') edit(name === 'mota' ? rest.join('/') : null);
    else if (cur === 'motas') motas(new URLSearchParams(qs || ''));
    else if (cur === 'pedidos') pedidos();
    else home();
    document.title = `${{ inicio: 'Início', motas: 'Motas', pedidos: 'Pedidos', edit: 'Mota' }[cur]} · Painel Speed Master`;
    view.focus({ preventScroll: true });
    scrollTo(0, 0);
    badge();
  }
  addEventListener('hashchange', route);
  addEventListener('sm:change', () => {
    badge();
    if (cur === 'motas') rows(); else if (cur === 'pedidos') drawReqs(); else if (cur === 'inicio') home();
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm(`Repor as ${(window.SM_SEED || []).length} motas de exemplo e apagar os pedidos e as alterações deste navegador?`)) return;
    SM.reset();
    toast('Dados de exemplo repostos.');
    route();
  });
  route();
})();
