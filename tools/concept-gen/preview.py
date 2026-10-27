"""Local preview of concept sites with real fonts.

usage: python3 preview.py slug [slug ...] [--og] [--full] [--form]
Screenshots go to shots/<slug>-<w>.png ; --og writes concepts/<slug>/og.jpg
"""
import re, os, sys, glob, threading, http.server, functools, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(os.path.dirname(HERE), 'local')
REPO = os.path.normpath(os.path.join(HERE, '..', '..', 'concepts'))
SHOTS = os.path.join(HERE, 'shots'); os.makedirs(SHOTS, exist_ok=True)
os.makedirs(os.path.join(LOCAL, 'c'), exist_ok=True)
FS = os.path.join(LOCAL, 'node_modules', '@fontsource')

def font_links(html):
    m = re.search(r'<link rel="stylesheet" href="(https://fonts.googleapis.com[^"]*)">', html)
    if not m: return html
    fams = re.findall(r'family=([^:&]+)', m.group(1).replace('&amp;', '&'))
    links = []
    for f in fams:
        pkg = f.replace('+', ' ').lower().replace(' ', '-')
        d = os.path.join(FS, pkg)
        if not os.path.isdir(d):
            print('  ! missing font package', pkg); continue
        for css in sorted(glob.glob(os.path.join(d, '*.css'))):
            b = os.path.basename(css)
            if re.fullmatch(r'(\d{3}(-italic)?|index)\.css', b):
                links.append(f'<link rel="stylesheet" href="/node_modules/@fontsource/{pkg}/{b}">')
    return html.replace(m.group(0), ''.join(links))

args = [a for a in sys.argv[1:] if not a.startswith('--')]
flags = {a for a in sys.argv[1:] if a.startswith('--')}
slugs = args or sorted(os.listdir(REPO))
for s in slugs:
    html = open(os.path.join(REPO, s, 'index.html'), encoding='utf-8').read()
    open(os.path.join(LOCAL, 'c', s + '.html'), 'w', encoding='utf-8').write(font_links(html))

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=LOCAL))
port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch()
    for s in slugs:
        url = f'http://127.0.0.1:{port}/c/{s}.html'
        res = []
        for w, h in [(1440, 900), (390, 844)]:
            ctx = b.new_context(viewport={'width': w, 'height': h}, locale='pt-PT', timezone_id='Europe/Lisbon', device_scale_factor=1)
            pg = ctx.new_page(); logs = []
            pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
            pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(400)
            sw = pg.evaluate('document.documentElement.scrollWidth')
            res.append(f'{w}:sw={sw}{"!!" if sw > w else ""}')
            r = pg.evaluate("(() => { const b = [...document.querySelectorAll('.hdr-in > *')].filter(e => getComputedStyle(e).display !== 'none'); return Math.max(...b.map(e => e.getBoundingClientRect().right)); })()")
            if r > w - 15: res.append(f'HDR-OVERFLOW {r:.0f}')
            pg.screenshot(path=os.path.join(SHOTS, f'{s}-{w}.png'), full_page=('--full' in flags))
            if '--form' in flags and w == 390:
                chips = pg.query_selector_all('#reqForm .chips label')
                if chips: chips[0].click()
                d = pg.query_selector('#reqForm input[type=date]')
                if d: d.fill('2026-11-14')
                pg.fill('#f_name', 'Ana')
                pg.click('#reqForm button[type=submit]'); pg.wait_for_timeout(300)
                res.append('msg=' + pg.inner_text('#resText').replace('\n', ' | ') if pg.is_visible('#res') else 'err=' + pg.inner_text('#formErr'))
                pg.click('.lang button[data-lang=en]'); pg.wait_for_timeout(200)
                res.append('en_h1=' + pg.inner_text('h1').replace('\n', ' ')[:60])
                res.append('en_msg=' + pg.inner_text('#resText').replace('\n', ' | ')[:120])
            if logs: res.append('LOGS ' + '; '.join(logs))
            ctx.close()
        if '--og' in flags:
            ctx = b.new_context(viewport={'width': 1200, 'height': 630}, locale='pt-PT', timezone_id='Europe/Lisbon', device_scale_factor=1)
            pg = ctx.new_page(); pg.goto(url, wait_until='networkidle'); pg.wait_for_timeout(300)
            pg.add_style_tag(content='.marq-t{animation:none!important}')
            pg.screenshot(path=os.path.join(REPO, s, 'og.jpg'), type='jpeg', quality=82)
            ctx.close()
        print(s, ' '.join(res))
    b.close()
srv.shutdown()
