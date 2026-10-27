"""Build quick concept sites for Cascais leads.

usage: python3 gen.py [slug ...]      (no args = every sites/*.yaml)
Writes /home/claude/orla-studio/concepts/<slug>/index.html
"""
import sys, os, json, glob, html, urllib.parse
import yaml, jinja2
from markupsafe import Markup
from motifs import MOTIFS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'concepts'))
BASE = 'https://vvvseva3-maker.github.io/orla-studio/'

SHARED = {
 'pt': dict(
  rib_tag='Conceito',
  rib='Proposta de site para {name}, feita pela Orla. Não é o site oficial.',
  nav_menu='Menu', nav_about='A casa', nav_visit='Visitar', nav_form='Pedido',
  cta2='Ver o menu', about_k='A casa', visit_k='Visitar', form_k='Pedido',
  visit_h='Venha visitar-nos', visit_p='Horário, morada e contactos num só sítio, sempre certos.',
  hours_h='Horário', where_h='Onde estamos', addr_l='Morada', phone_l='Telefone',
  map='Abrir no mapa', call='Ligar', closed='Fechado', today='hoje', today_l='hoje', tomorrow='amanhã',
  days=['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  open_now='Aberto agora', closes_at='fecha às {t}', closed_now='Fechado agora', opens_at='abre {d} às {t}',
  hours_unknown='Horário a confirmar com a casa.',
  step1='Escolha o que precisa no formulário.', step2='O site prepara a mensagem.', step3='Envia-a pelo Instagram com um toque.',
  fl_name='Nome', fl_notes='Notas', fl_date='Dia', fl_time='Hora', fl_people='Pessoas',
  ph_notes='Alguma coisa que devamos saber?',
  res_h='Mensagem pronta', copy='Copiar mensagem', copied='Copiado ✓', selected='Texto selecionado', open_ig='Abrir conversa no Instagram',
  res_note='Isto é um conceito: nada foi enviado. No site final, o pedido chegaria diretamente à casa, por Instagram, WhatsApp ou e-mail.',
  err_req='Falta preencher: {f}.', msg_hi='Olá! Venho do vosso site.',
  foot_note='Conceito de site não oficial, feito pela Orla com informação pública. Fotos e textos finais seriam escolhidos com a casa.',
  foot_by='Site: Orla, estúdio web em Cascais', og_title='conceito de site'),
 'en': dict(
  rib_tag='Concept',
  rib='A website proposal for {name} by Orla. Not the official site.',
  nav_menu='Menu', nav_about='About', nav_visit='Visit', nav_form='Request',
  cta2='See the menu', about_k='About', visit_k='Visit', form_k='Request',
  visit_h='Come and see us', visit_p='Hours, address and contacts in one place, always up to date.',
  hours_h='Opening hours', where_h='Find us', addr_l='Address', phone_l='Phone',
  map='Open in Maps', call='Call', closed='Closed', today='today', today_l='today', tomorrow='tomorrow',
  days=['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  open_now='Open now', closes_at='closes at {t}', closed_now='Closed now', opens_at='opens {d} at {t}',
  hours_unknown='Hours to be confirmed with the owners.',
  step1='Pick what you need in the form.', step2='The site writes the message for you.', step3='Send it on Instagram with one tap.',
  fl_name='Name', fl_notes='Notes', fl_date='Date', fl_time='Time', fl_people='People',
  ph_notes='Anything we should know?',
  res_h='Message ready', copy='Copy message', copied='Copied ✓', selected='Text selected', open_ig='Open chat on Instagram',
  res_note='This is a concept: nothing was sent. On the real site the request would go straight to the owners by Instagram, WhatsApp or email.',
  err_req='Please fill in: {f}.', msg_hi='Hi! I found you through your website.',
  foot_note='Unofficial website concept made by Orla from public information. Final photos and text would be chosen with the owners.',
  foot_by='Site: Orla, web studio in Cascais', og_title='website concept'),
}

FORM_DEFAULTS = {
 'order': dict(pt=dict(form_k='Encomendas', fl_what='O que vai querer', fl_date='Para que dia', fl_slot='Levantamento', msg_intro='Queria fazer uma encomenda:', submit='Preparar encomenda'),
               en=dict(form_k='Orders', fl_what='What would you like', fl_date='For which day', fl_slot='Pick-up', msg_intro="I'd like to place an order:", submit='Prepare my order')),
 'table': dict(pt=dict(form_k='Reservas', msg_intro='Queria reservar mesa:', submit='Preparar reserva'),
               en=dict(form_k='Bookings', msg_intro="I'd like to book a table:", submit='Prepare my booking')),
 'bouquet': dict(pt=dict(form_k='Encomendas', fl_occ='Ocasião', fl_budget='Orçamento', fl_col='Cores', fl_how='Entrega', msg_intro='Queria encomendar flores:', submit='Preparar pedido'),
                 en=dict(form_k='Orders', fl_occ='Occasion', fl_budget='Budget', fl_col='Colours', fl_how='Delivery', msg_intro="I'd like to order flowers:", submit='Prepare my request')),
 'enquiry': dict(pt=dict(form_k='Contacto', fl_int='Tenho interesse em', msg_intro='Queria saber mais:', submit='Preparar mensagem'),
                 en=dict(form_k='Contact', fl_int="I'm interested in", msg_intro="I'd like to know more:", submit='Prepare my message')),
}

PEOPLE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']


def fields_for(s):
    f = s['form']
    kind = f['type']
    opts = f.get('opts', {})
    if kind == 'order':
        what = opts.get('what') or [it['n'] for it in s['items']]
        fl = [dict(id='what', kind='chips', multi=True, opts=what),
              dict(kind='pair', items=[dict(id='date', kind='date'), dict(id='name', kind='text', ac='name')]),
              dict(id='notes', kind='textarea')]
        req = ['what', 'date', 'name']
    elif kind == 'table':
        times = f.get('times', ['12:30', '13:00', '13:30', '19:30', '20:00', '20:30', '21:00'])
        fl = [dict(kind='pair', items=[dict(id='date', kind='date'), dict(id='time', kind='select', opts=times)]),
              dict(kind='pair', items=[dict(id='people', kind='select', opts=PEOPLE, default='2'), dict(id='name', kind='text', ac='name')]),
              dict(id='notes', kind='textarea')]
        req = ['date', 'name']
    elif kind == 'bouquet':
        fl = [dict(id='occ', kind='chips', multi=False, opts=opts['occ']),
              dict(id='budget', kind='chips', multi=False, opts=opts['budget']),
              dict(id='col', kind='chips', multi=True, opts=opts['col']),
              dict(id='how', kind='chips', multi=False, opts=opts['how']),
              dict(kind='pair', items=[dict(id='date', kind='date'), dict(id='name', kind='text', ac='name')]),
              dict(id='notes', kind='textarea')]
        req = ['occ', 'date', 'name']
    else:
        fl = [dict(id='int', kind='chips', multi=True, opts=opts['int']),
              dict(id='name', kind='text', ac='name'),
              dict(id='notes', kind='textarea')]
        req = ['int', 'name']
    for extra in f.get('extra', []):
        fl.insert(extra.get('at', len(fl) - 1), extra)
    return fl, req


def build(path):
    s = yaml.safe_load(open(path, encoding='utf-8'))
    # compact list forms -> dicts
    s['items'] = [({'n': {'pt': it[0], 'en': it[1]}, 'd': {'pt': it[2], 'en': it[3]}, 'p': (it[4] if len(it) > 4 else None)} if isinstance(it, list) else it) for it in s['items']]
    s['facts'] = [({'b': f[0], 't': {'pt': f[1], 'en': f[2]}} if isinstance(f, list) else f) for f in s['facts']]
    for k, v in (s['form'].get('opts') or {}).items():
        s['form']['opts'][k] = [({'pt': o[0], 'en': o[1]} if isinstance(o, list) else o) for o in v]
    L = dict(s['look'])
    L.setdefault('dc', 'none'); L.setdefault('dt', '-0.02em'); L.setdefault('dstyle', 'normal'); L.setdefault('h1', 1)
    L.setdefault('r', 18); L.setdefault('btn_r', '999px'); L.setdefault('hero', 'split'); L.setdefault('menu', 'cards')
    L.setdefault('sep', '✳'); L.setdefault('em_style', 'italic'); L.setdefault('logo_size', '26px'); L.setdefault('logo_size_sm', '22px')
    L.setdefault('art_shadow', 'none'); L.setdefault('extra_css', ''); L.setdefault('err', '#b3261e'); L.setdefault('open', '#2f8a3b')
    L.setdefault('art_bg', L['bg2'])
    for k in ('a1', 'a2', 'a3', 'art_ink', 'art_hi'):
        L.setdefault(k, L['acc'])
    import re as _re
    plain = _re.sub('<[^>]+>', '', s.get('wordmark') or s['name'])
    if len(plain) > 12:
        L['extra_css'] = L['extra_css'] + ' @media (max-width:440px){.hdr .btn.sm{display:none}}'
    L = {k: (Markup(v) if isinstance(v, str) else v) for k, v in L.items()}
    fams = L['fonts']  # list of google css2 family specs
    fonts_url = 'https://fonts.googleapis.com/css2?' + '&'.join('family=' + f for f in fams) + '&display=swap'

    fields, req = fields_for(s)
    T = {}
    for lg in ('pt', 'en'):
        t = dict(SHARED[lg])
        t.update(FORM_DEFAULTS[s['form']['type']][lg])
        t.update({k: v for k, v in s['t'][lg].items()})
        t['rib'] = t['rib'].replace('{name}', s['name'])
        if not s.get('hours'):
            t.setdefault('hours_note', t['hours_unknown'])
        for i, it in enumerate(s['items']):
            t[f'i{i}n'] = it['n'][lg] if isinstance(it['n'], dict) else it['n']
            t[f'i{i}d'] = it['d'][lg]
        for i, fct in enumerate(s['facts']):
            t[f'f{i}'] = fct['t'][lg]
        for i, p in enumerate(t.get('about_p', [])):
            t[f'about_p{i}'] = p
        for f in fields:
            if f.get('kind') == 'chips':
                for j, o in enumerate(f['opts']):
                    t[f'fo_{f["id"]}_{j}'] = o[lg] if isinstance(o, dict) else o
        T[lg] = t
    # normalise items for template (pt view)
    for it in s['items']:
        if not isinstance(it['n'], dict):
            it['n'] = {'pt': it['n'], 'en': it['n']}
        it.setdefault('p', None)
    for f in fields:
        if f.get('kind') == 'chips':
            f['opts'] = [o if isinstance(o, dict) else {'pt': o, 'en': o} for o in f['opts']]
    hours = None
    if s.get('hours'):
        keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        hours = [s['hours'].get(k) or [] for k in keys]
    js_site = dict(slug=s['slug'], hours=hours, fields=[
        (dict(kind='pair', items=[dict(id=g['id'], kind=g['kind']) for g in f['items']]) if f['kind'] == 'pair' else dict(id=f['id'], kind=f['kind']))
        for f in fields], required=req)
    marquee = s.get('marquee') or [it['n']['pt'] for it in s['items']]
    s.setdefault('wordmark', html.escape(s['name']))
    s.setdefault('foot_name', s['wordmark'])
    s.setdefault('giant', s['wordmark'])
    s['hours'] = hours
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(HERE), autoescape=True)
    tpl = env.get_template('template.html')
    art = MOTIFS[L['motif']]()
    out = tpl.render(s=s, L=L, t=T['pt'], fonts_url=fonts_url, art=art, fields=fields, marquee=marquee, base=BASE,
                     js_site=json.dumps(js_site, ensure_ascii=False), js_t=json.dumps(T, ensure_ascii=False).replace('</', '<\\/'))
    d = os.path.join(OUT, s['slug'])
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)
    return s['slug'], fams


if __name__ == '__main__':
    paths = [os.path.join(HERE, 'sites', a + '.yaml') for a in sys.argv[1:]] or sorted(glob.glob(os.path.join(HERE, 'sites', '*.yaml')))
    for p in paths:
        slug, fams = build(p)
        print('built', slug)
