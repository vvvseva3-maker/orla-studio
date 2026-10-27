"""Hero illustrations for the concept sites.

Every motif returns an inline SVG (viewBox 0 0 400 400) coloured only through
CSS variables, so the same drawing works on any palette:
  --art-bg   panel background      --a1 main accent    --a2 second accent
  --a3 third accent                --art-ink lines     --art-hi highlights
"""
import math, random

def _svg(body, label):
    return (f'<svg viewBox="0 0 400 400" role="img" aria-label="{label}" '
            f'xmlns="http://www.w3.org/2000/svg">{body}</svg>')

F = lambda v: f'style="fill:var({v})"'
S = lambda v, w=3: f'style="fill:none;stroke:var({v});stroke-width:{w};stroke-linecap:round;stroke-linejoin:round"'


def croissant(label='Croissant'):
    out = [f'<circle cx="200" cy="200" r="168" {F("--a3")} opacity=".55"/>']
    segs = []
    n = 7
    for i in range(n):
        t = -1 + 2 * i / (n - 1)
        a = t * 1.18
        x = 200 + 118 * math.sin(a)
        y = 292 - 118 * math.cos(a)
        rx = 36 * (1 - .5 * t * t)
        ry = 64 * (1 - .42 * t * t)
        segs.append((abs(t), x, y, rx, ry, math.degrees(a)))
    for _, x, y, rx, ry, d in sorted(segs, key=lambda s: -s[0]):
        out.append(f'<g transform="translate({x:.1f} {y:.1f}) rotate({d:.1f})">'
                   f'<ellipse rx="{rx:.1f}" ry="{ry:.1f}" {F("--a1")}/>'
                   f'<ellipse rx="{rx:.1f}" ry="{ry:.1f}" {S("--art-ink", 3)}/>'
                   f'<path d="M{-rx*.55:.1f} {-ry*.62:.1f} Q0 {-ry*.2:.1f} {rx*.55:.1f} {-ry*.62:.1f}" {S("--art-hi", 4)} opacity=".7"/>'
                   f'</g>')
    rnd = random.Random(7)
    for _ in range(26):
        out.append(f'<circle cx="{rnd.uniform(60,340):.0f}" cy="{rnd.uniform(60,140):.0f}" r="{rnd.uniform(1.5,3.6):.1f}" {F("--art-hi")} opacity=".8"/>')
    return _svg(''.join(out), label)


def bun(label='Pão'):
    out = [f'<rect x="0" y="0" width="400" height="400" {F("--a3")} opacity=".35"/>']
    for k, (cx, cy, r) in enumerate([(150, 170, 92), (268, 252, 74)]):
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" {F("--a1")}/>')
        pts = []
        for i in range(160):
            th = i / 159 * 4.2 * math.pi
            rr = r * .12 + (r * .78) * i / 159
            pts.append(f'{cx + rr*math.cos(th):.1f},{cy + rr*math.sin(th)*.92:.1f}')
        out.append(f'<polyline points="{" ".join(pts)}" {S("--art-ink", 5 if k == 0 else 4)}/>')
        rnd = random.Random(k + 3)
        for _ in range(16):
            a = rnd.uniform(0, 2 * math.pi); d = rnd.uniform(0, r * .8)
            out.append(f'<rect x="{cx + d*math.cos(a):.0f}" y="{cy + d*math.sin(a):.0f}" width="6" height="6" rx="1.5" transform="rotate({rnd.uniform(0,90):.0f} {cx + d*math.cos(a):.0f} {cy + d*math.sin(a):.0f})" {F("--art-hi")}/>')
    return _svg(''.join(out), label)


def bowl(label='Bowl'):
    out = [f'<circle cx="200" cy="205" r="170" {F("--a3")} opacity=".45"/>']
    rnd = random.Random(11)
    fruits = []
    for i in range(14):
        x = 92 + i * 16 + rnd.uniform(-6, 6)
        y = 200 - math.sin(i / 13 * math.pi) * 48 + rnd.uniform(-8, 8)
        fruits.append((x, y, rnd.choice(['--a1', '--a2', '--art-hi', '--a1']), rnd.uniform(16, 30)))
    for x, y, c, r in fruits:
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" {F(c)}/><circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" {S("--art-ink", 2.5)}/>')
        if c == '--art-hi':
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r*.35:.0f}" {S("--art-ink", 2)}/>')
    out.append(f'<path d="M58 205 H342 Q336 330 200 334 Q64 330 58 205 Z" {F("--a2")}/>')
    out.append(f'<path d="M58 205 H342 Q336 330 200 334 Q64 330 58 205 Z" {S("--art-ink", 3)}/>')
    out.append(f'<path d="M96 240 Q200 262 304 240" {S("--art-hi", 4)} opacity=".6"/>')
    return _svg(''.join(out), label)


def awning(label='Quiosque'):
    out = [f'<circle cx="290" cy="110" r="54" {F("--a2")}/>']
    for i, (x, y, r) in enumerate([(84, 236, 66), (330, 262, 56)]):
        out.append(f'<rect x="{x-5}" y="{y+20}" width="10" height="{360-y-20}" {F("--art-ink")}/>')
        out.append(f'<circle cx="{x}" cy="{y}" r="{r}" {F("--a3")}/>')
        out.append(f'<circle cx="{x-r*.3:.0f}" cy="{y-r*.25:.0f}" r="{r*.55:.0f}" {F("--art-hi")} opacity=".35"/>')
    out.append(f'<rect x="120" y="190" width="160" height="150" rx="4" {F("--art-hi")}/>')
    out.append(f'<rect x="120" y="190" width="160" height="150" rx="4" {S("--art-ink", 3)}/>')
    out.append(f'<rect x="146" y="250" width="108" height="60" rx="3" {F("--a3")} opacity=".7"/>')
    w = 200 / 8
    for i in range(8):
        x = 100 + i * w
        c = '--a1' if i % 2 == 0 else '--art-hi'
        out.append(f'<path d="M{x:.1f} 150 h{w:.1f} v34 a{w/2:.1f} {w/2:.1f} 0 0 1 {-w:.1f} 0 z" {F(c)}/>')
    out.append(f'<path d="M100 150 h200" {S("--art-ink", 3)}/><path d="M92 150 L200 112 L308 150" {F("--a1")}/><path d="M92 150 L200 112 L308 150 Z" {S("--art-ink", 3)}/>')
    out.append(f'<path d="M20 340 H380" {S("--art-ink", 3)}/>')
    return _svg(''.join(out), label)


def grill(label='Peixe grelhado'):
    out = []
    for i in range(7):
        y = 92 + i * 36
        out.append(f'<path d="M40 {y} H360" {S("--a3", 9)}/>')
    out.append('<g transform="rotate(-14 200 200)">')
    out.append(f'<path d="M86 200 Q170 120 270 196 Q170 282 86 200 Z" {F("--a1")}/>')
    out.append(f'<path d="M262 196 L336 150 Q318 198 336 246 Z" {F("--a1")}/>')
    out.append(f'<path d="M86 200 Q170 120 270 196 Q170 282 86 200 Z M262 196 L336 150 Q318 198 336 246 Z" {S("--art-ink", 3)}/>')
    for k in range(5):
        x = 140 + k * 22
        out.append(f'<path d="M{x} 166 L{x+18} 236" {S("--art-ink", 5)} opacity=".8"/>')
    out.append(f'<circle cx="118" cy="190" r="7" {F("--art-hi")}/><circle cx="118" cy="190" r="3" {F("--art-ink")}/>')
    out.append('</g>')
    for i, x in enumerate([90, 150, 210, 270, 320]):
        h = [34, 52, 40, 58, 30][i]
        out.append(f'<path d="M{x-14} 360 Q{x-16} {360-h*.6} {x} {360-h} Q{x+16} {360-h*.6} {x+14} 360 Z" {F("--a2")}/>')
    return _svg(''.join(out), label)


def lifebuoy(label='Bóia'):
    out = []
    for i in range(10):
        c = '--a2' if i % 2 == 0 else '--art-hi'
        out.append(f'<rect x="0" y="{i*40}" width="400" height="40" {F(c)} opacity=".9"/>')
    out.append(f'<circle cx="200" cy="200" r="132" {F("--art-hi")}/>')
    for k in range(4):
        a0 = math.radians(k * 90 + 20); a1 = math.radians(k * 90 + 70)
        R, r = 132, 70
        p = (f'M{200+R*math.cos(a0):.1f} {200+R*math.sin(a0):.1f} A{R} {R} 0 0 1 {200+R*math.cos(a1):.1f} {200+R*math.sin(a1):.1f} '
             f'L{200+r*math.cos(a1):.1f} {200+r*math.sin(a1):.1f} A{r} {r} 0 0 0 {200+r*math.cos(a0):.1f} {200+r*math.sin(a0):.1f} Z')
        out.append(f'<path d="{p}" {F("--a1")}/>')
    out.append(f'<circle cx="200" cy="200" r="70" {F("--a3")}/><circle cx="200" cy="200" r="132" {S("--art-ink", 3)}/><circle cx="200" cy="200" r="70" {S("--art-ink", 3)}/>')
    out.append(f'<circle cx="200" cy="200" r="150" {S("--art-ink", 4)} stroke-dasharray="16 12"/>')
    return _svg(''.join(out), label)


def _glass(x, base, h, fill, kind='wine'):
    bw = 46 if kind == 'wine' else 40
    top = base - h
    if kind == 'wine':
        bowl = f'M{x-bw} {top} Q{x-bw-4} {top+96} {x} {top+112} Q{x+bw+4} {top+96} {x+bw} {top} Z'
        liquid_y = top + 112 - 112 * fill
        out = [f'<clipPath id="g{x}"><path d="{bowl}"/></clipPath>',
               f'<rect x="{x-bw-6}" y="{liquid_y:.0f}" width="{2*bw+12}" height="130" clip-path="url(#g{x})" {F("--a1" if fill > .35 else "--a2")}/>',
               f'<path d="{bowl}" {S("--art-ink", 3)}/>',
               f'<path d="M{x} {top+112} V{base-6}" {S("--art-ink", 3)}/>',
               f'<path d="M{x-30} {base-4} H{x+30}" {S("--art-ink", 4)}/>',
               f'<path d="M{x-bw+12} {top+18} Q{x-bw+8} {top+60} {x-16} {top+86}" {S("--art-hi", 4)} opacity=".7"/>']
    else:
        bowl = f'M{x-bw} {top} L{x-bw+10} {base} H{x+bw-10} L{x+bw} {top} Z'
        liquid_y = base - (base - top) * fill
        out = [f'<clipPath id="g{x}"><path d="{bowl}"/></clipPath>',
               f'<rect x="{x-bw-6}" y="{liquid_y:.0f}" width="{2*bw+12}" height="{h}" clip-path="url(#g{x})" {F("--a1")}/>',
               f'<rect x="{x-bw-6}" y="{liquid_y-16:.0f}" width="{2*bw+12}" height="18" clip-path="url(#g{x})" {F("--art-hi")}/>',
               f'<path d="{bowl}" {S("--art-ink", 3)}/>']
    return ''.join(out)


def glasses(label='Copos de vinho', arch=False, dunes=False, chalk=False):
    out = []
    if arch:
        out.append(f'<path d="M110 360 V170 Q110 60 200 40 Q290 60 290 170 V360" {F("--a3")} opacity=".7"/>')
        out.append(f'<path d="M110 360 V170 Q110 60 200 40 Q290 60 290 170 V360" {S("--art-hi", 3)}/>')
        out.append(f'<path d="M200 40 V360 M110 200 H290" {S("--art-hi", 2)} opacity=".4"/>')
    if dunes:
        out.append(f'<path d="M0 300 Q90 250 180 292 T400 280 V400 H0 Z" {F("--a3")}/>')
        out.append(f'<path d="M0 340 Q110 300 230 338 T400 330 V400 H0 Z" {F("--a2")} opacity=".7"/>')
    if chalk:
        out.append(f'<rect x="34" y="40" width="200" height="120" rx="8" {F("--a3")}/><rect x="34" y="40" width="200" height="120" rx="8" {S("--art-hi", 3)}/>')
        out.append(f'<path d="M58 78 h120 M58 104 h150 M58 130 h90" {S("--art-hi", 4)} opacity=".75"/>')
    xs = [(130, 330, 196, .55), (230, 336, 210, .78), (318, 326, 182, .3)]
    for x, base, h, fill in xs:
        out.append(_glass(x, base, h, fill))
    return _svg(''.join(out), label)


def flowers(label='Flores', seed=1, count=5):
    rnd = random.Random(seed)
    out = [f'<circle cx="200" cy="200" r="176" {F("--a3")} opacity=".4"/>']
    blooms = [(200, 150, 62), (118, 206, 46), (288, 214, 50), (162, 112, 34), (250, 104, 38), (140, 280, 30), (262, 290, 34)][:count]
    for x, y, r in blooms:
        out.append(f'<path d="M{x} {y} Q{(x+200)/2 + rnd.uniform(-30,30):.0f} {(y+360)/2:.0f} 200 372" {S("--a2", 5)}/>')
    for i in range(6):
        lx = rnd.uniform(140, 260); ly = rnd.uniform(250, 340)
        out.append(f'<ellipse cx="{lx:.0f}" cy="{ly:.0f}" rx="26" ry="10" transform="rotate({rnd.uniform(-60,60):.0f} {lx:.0f} {ly:.0f})" {F("--a2")}/>')
    for k, (x, y, r) in enumerate(blooms):
        n = rnd.choice([5, 6, 8, 12])
        col = ['--a1', '--art-hi', '--a1', '--a2', '--art-hi', '--a1', '--art-hi'][k]
        off = rnd.uniform(0, 60)
        for i in range(n):
            d = off + i * 360 / n
            out.append(f'<ellipse cx="{x}" cy="{y - r*.52:.1f}" rx="{r*.3:.1f}" ry="{r*.55:.1f}" transform="rotate({d:.1f} {x} {y})" {F(col)}/>')
            out.append(f'<ellipse cx="{x}" cy="{y - r*.52:.1f}" rx="{r*.3:.1f}" ry="{r*.55:.1f}" transform="rotate({d:.1f} {x} {y})" {S("--art-ink", 1.6)} opacity=".55"/>')
        out.append(f'<circle cx="{x}" cy="{y}" r="{r*.2:.1f}" {F("--art-ink")}/>')
    return _svg(''.join(out), label)


def azulejo(label='Azulejo e relógio'):
    out = []
    s = 100
    for i in range(4):
        for j in range(4):
            x, y = i * s, j * s
            out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" {F("--art-hi")}/>')
            out.append(f'<rect x="{x+2}" y="{y+2}" width="{s-4}" height="{s-4}" {S("--a1", 2)}/>')
            cx, cy = x + 50, y + 50
            for a in range(4):
                out.append(f'<ellipse cx="{cx}" cy="{cy-22}" rx="11" ry="22" transform="rotate({a*90} {cx} {cy})" {F("--a1")}/>')
            out.append(f'<circle cx="{cx}" cy="{cy}" r="7" {F("--a2")}/>')
            for (qx, qy) in [(x, y), (x + s, y), (x, y + s), (x + s, y + s)]:
                out.append(f'<circle cx="{qx}" cy="{qy}" r="14" {F("--a1")} opacity=".85"/>')
    out.append(f'<circle cx="200" cy="200" r="118" {F("--a3")}/><circle cx="200" cy="200" r="118" {S("--art-ink", 4)}/>')
    for h in range(12):
        a = math.radians(h * 30)
        r1, r2 = (92, 106) if h % 3 else (84, 106)
        out.append(f'<path d="M{200+r1*math.sin(a):.1f} {200-r1*math.cos(a):.1f} L{200+r2*math.sin(a):.1f} {200-r2*math.cos(a):.1f}" {S("--art-ink", 4 if h % 3 == 0 else 2.5)}/>')
    out.append(f'<path d="M200 200 L200 128" {S("--art-ink", 7)}/><path d="M200 200 L252 226" {S("--art-ink", 5)}/><circle cx="200" cy="200" r="8" {F("--a2")}/>')
    return _svg(''.join(out), label)


def nuts(label='Frutos secos'):
    rnd = random.Random(5)
    out = [f'<rect width="400" height="400" {F("--a3")} opacity=".35"/>']
    placed = []
    tries = 0
    while len(placed) < 30 and tries < 2000:
        tries += 1
        x, y = rnd.uniform(30, 370), rnd.uniform(30, 370)
        if any((x - px) ** 2 + (y - py) ** 2 < 46 ** 2 for px, py in placed):
            continue
        placed.append((x, y))
        kind = rnd.choice(['almond', 'almond', 'hazel', 'walnut', 'pistachio'])
        rot = rnd.uniform(0, 180)
        if kind == 'almond':
            out.append(f'<path d="M0 -26 Q18 -6 0 26 Q-18 -6 0 -26 Z" transform="translate({x:.0f} {y:.0f}) rotate({rot:.0f})" {F("--a1")}/>'
                       f'<path d="M0 -18 Q6 0 0 18" transform="translate({x:.0f} {y:.0f}) rotate({rot:.0f})" {S("--art-ink", 2)} opacity=".5"/>')
        elif kind == 'hazel':
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="17" {F("--a2")}/><path d="M{x-16:.0f} {y-4:.0f} Q{x:.0f} {y-26:.0f} {x+16:.0f} {y-4:.0f}" {F("--art-ink")} opacity=".55"/>')
        elif kind == 'walnut':
            out.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="22" ry="18" {F("--art-hi")}/><path d="M{x:.0f} {y-18:.0f} V{y+18:.0f} M{x-14:.0f} {y-8:.0f} q7 6 0 12 M{x+14:.0f} {y-8:.0f} q-7 6 0 12" {S("--art-ink", 2.5)}/>')
        else:
            out.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="14" ry="20" transform="rotate({rot:.0f} {x:.0f} {y:.0f})" {F("--art-hi")}/><ellipse cx="{x:.0f}" cy="{y:.0f}" rx="7" ry="13" transform="rotate({rot:.0f} {x:.0f} {y:.0f})" {F("--a2")}/>')
    return _svg(''.join(out), label)


def plate(label='Prato'):
    out = [f'<circle cx="200" cy="200" r="168" {F("--a3")}/>',
           f'<circle cx="200" cy="200" r="132" {F("--art-hi")}/><circle cx="200" cy="200" r="104" {S("--a3", 3)} opacity=".6"/>']
    out.append(f'<path d="M108 236 A92 92 0 0 1 292 236 Z" {F("--a1")}/><path d="M108 236 A92 92 0 0 1 292 236 Z" {S("--art-ink", 3)}/>')
    rnd = random.Random(4)
    for _ in range(14):
        a = rnd.uniform(math.pi * 1.08, math.pi * 1.92); d = rnd.uniform(58, 86)
        out.append(f'<circle cx="{200 + d*math.cos(a):.0f}" cy="{236 + d*math.sin(a):.0f}" r="{rnd.uniform(6,11):.0f}" {F(rnd.choice(["--a2", "--art-ink", "--a2"]))}/>')
    out.append(f'<rect x="132" y="250" width="136" height="40" rx="12" {F("--a2")} opacity=".9"/><path d="M146 262 q20 10 40 0 t40 0 t28 0" {S("--art-hi", 3)}/>')
    return _svg(''.join(out), label)


def star_tiles(label='Padrão turco'):
    out = [f'<rect width="400" height="400" {F("--a3")}/>']
    s = 100
    for i in range(4):
        for j in range(4):
            cx, cy = i * s + 50, j * s + 50
            pts = []
            for k in range(16):
                r = 40 if k % 2 == 0 else 24
                a = math.radians(k * 22.5)
                pts.append(f'{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}')
            out.append(f'<polygon points="{" ".join(pts)}" {F("--a1" if (i + j) % 2 == 0 else "--a2")} opacity=".9"/>')
            out.append(f'<circle cx="{cx}" cy="{cy}" r="9" {F("--art-hi")}/>')
    out.append(f'<path d="M168 112 Q150 190 172 250 Q178 266 168 296 H232 Q222 266 228 250 Q250 190 232 112 Z" {F("--art-hi")}/>')
    out.append(f'<path d="M176 168 Q166 210 180 246 Q186 262 178 288 H222 Q214 262 220 246 Q234 210 224 168 Z" {F("--a1")}/>')
    out.append(f'<path d="M168 112 Q150 190 172 250 Q178 266 168 296 H232 Q222 266 228 250 Q250 190 232 112 Z" {S("--art-ink", 4)}/>')
    out.append(f'<ellipse cx="200" cy="304" rx="62" ry="12" {F("--art-hi")}/><ellipse cx="200" cy="304" rx="62" ry="12" {S("--art-ink", 3)}/>')
    return _svg(''.join(out), label)


def vinyl(label='Disco'):
    out = [f'<circle cx="200" cy="200" r="170" {F("--art-ink")}/>']
    for r in range(70, 168, 7):
        out.append(f'<circle cx="200" cy="200" r="{r}" {S("--a3", 1.4)} opacity=".55"/>')
    out.append(f'<path d="M200 200 m-150 -40 A156 156 0 0 1 120 64" {S("--art-hi", 5)} opacity=".35"/>')
    out.append(f'<circle cx="200" cy="200" r="58" {F("--a1")}/><circle cx="200" cy="200" r="7" {F("--art-ink")}/>')
    for i in range(9):
        h = [30, 56, 40, 72, 50, 64, 34, 48, 26][i]
        out.append(f'<rect x="{150 + i*11.5:.0f}" y="{200 - h/2:.0f}" width="6" height="{h}" rx="3" {F("--art-hi")} opacity=".85" transform="scale(1)"/>' if False else '')
    out.append(f'<path d="M326 52 L366 90 L250 230" {S("--a2", 8)}/><circle cx="326" cy="52" r="16" {F("--a2")}/>')
    return _svg(''.join(out), label)


def lamps(label='Candeeiros'):
    out = []
    for x, len_, r, c in [(110, 120, 58, '--a1'), (220, 70, 46, '--a2'), (316, 150, 40, '--a1')]:
        y = len_ + r
        out.append(f'<path d="M{x-r*2.2:.0f} 400 L{x-r*.9:.0f} {y} H{x+r*.9:.0f} L{x+r*2.2:.0f} 400 Z" {F("--a3")} opacity=".45"/>')
        out.append(f'<path d="M{x} 0 V{len_}" {S("--art-ink", 2.5)}/>')
        out.append(f'<path d="M{x-r} {y} A{r} {r} 0 0 1 {x+r} {y} Z" {F(c)}/>')
        out.append(f'<path d="M{x-r} {y} A{r} {r} 0 0 1 {x+r} {y} Z" {S("--art-ink", 2.5)}/>')
        out.append(f'<circle cx="{x}" cy="{y+6}" r="9" {F("--art-hi")}/>')
    out.append(f'<path d="M0 372 H400" {S("--art-ink", 3)}/>')
    return _svg(''.join(out), label)


def knots(label='Macramé'):
    out = [f'<rect width="400" height="400" {F("--a3")} opacity=".45"/>']
    step = 50
    for i in range(-8, 10):
        out.append(f'<path d="M{i*step} 0 L{i*step + 400} 400" {S("--a1", 5)}/>')
        out.append(f'<path d="M{i*step + 400} 0 L{i*step} 400" {S("--a1", 5)}/>')
    for i in range(0, 9):
        for j in range(0, 9):
            x = i * step; y = j * step
            if (i + j) % 2 == 0:
                out.append(f'<circle cx="{x}" cy="{y}" r="11" {F("--art-hi")}/><circle cx="{x}" cy="{y}" r="11" {S("--art-ink", 2.5)}/>'
                           f'<path d="M{x-6} {y-3} Q{x} {y+6} {x+6} {y-3}" {S("--art-ink", 2)}/>')
    return _svg(''.join(out), label)


def vessels(label='Cerâmica'):
    out = [f'<rect width="400" height="400" {F("--a3")} opacity=".4"/>', f'<path d="M0 330 H400 V400 H0 Z" {F("--a2")} opacity=".5"/>']
    for x, w, h, neck, c in [(110, 70, 190, 26, '--a1'), (226, 92, 130, 60, '--art-hi'), (318, 52, 160, 18, '--a1')]:
        top = 330 - h
        p = (f'M{x-neck/2:.0f} {top} Q{x-neck/2:.0f} {top+h*.25:.0f} {x-w:.0f} {top+h*.55:.0f} Q{x-w*1.05:.0f} {330-8} {x-w*.55:.0f} 330 '
             f'H{x+w*.55:.0f} Q{x+w*1.05:.0f} {330-8} {x+w:.0f} {top+h*.55:.0f} Q{x+neck/2:.0f} {top+h*.25:.0f} {x+neck/2:.0f} {top} Z')
        out.append(f'<path d="{p}" {F(c)}/><path d="{p}" {S("--art-ink", 3)}/>')
        out.append(f'<path d="M{x-w*.7:.0f} {top+h*.62:.0f} Q{x:.0f} {top+h*.7:.0f} {x+w*.7:.0f} {top+h*.62:.0f}" {S("--art-ink", 2)} opacity=".35"/>')
    return _svg(''.join(out), label)


def scoops(label='Gelado'):
    out = [f'<circle cx="200" cy="200" r="170" {F("--a3")} opacity=".45"/>']
    for x, cols in [(140, ['--a1', '--art-hi']), (262, ['--a2', '--a1'])]:
        out.append(f'<path d="M{x-44} 214 L{x} 360 L{x+44} 214 Z" {F("--art-hi")}/><path d="M{x-44} 214 L{x} 360 L{x+44} 214 Z" {S("--art-ink", 3)}/>')
        for k in range(4):
            out.append(f'<path d="M{x-38+k*20} 216 L{x-10+k*8} 330" {S("--a3", 2)}/>')
        for k, c in enumerate(cols):
            cy = 196 - k * 66
            out.append(f'<path d="M{x-50} {cy+16} Q{x-60} {cy-50} {x} {cy-56} Q{x+60} {cy-50} {x+50} {cy+16} Q{x+36} {cy+30} {x+22} {cy+14} Q{x+8} {cy+34} {x-8} {cy+16} Q{x-26} {cy+32} {x-50} {cy+16} Z" {F(c)}/>'
                       f'<path d="M{x-50} {cy+16} Q{x-60} {cy-50} {x} {cy-56} Q{x+60} {cy-50} {x+50} {cy+16} Q{x+36} {cy+30} {x+22} {cy+14} Q{x+8} {cy+34} {x-8} {cy+16} Q{x-26} {cy+32} {x-50} {cy+16} Z" {S("--art-ink", 3)}/>')
    return _svg(''.join(out), label)


def books(label='Livros'):
    rnd = random.Random(3)
    out = [f'<rect width="400" height="400" {F("--a3")} opacity=".35"/>']
    x = 40
    while x < 340:
        w = rnd.uniform(22, 44); h = rnd.uniform(170, 260)
        c = rnd.choice(['--a1', '--a2', '--art-hi', '--a1'])
        out.append(f'<rect x="{x:.0f}" y="{330-h:.0f}" width="{w:.0f}" height="{h:.0f}" rx="3" {F(c)}/><rect x="{x:.0f}" y="{330-h:.0f}" width="{w:.0f}" height="{h:.0f}" rx="3" {S("--art-ink", 2.5)}/>')
        out.append(f'<path d="M{x+5:.0f} {330-h+22:.0f} H{x+w-5:.0f} M{x+5:.0f} {330-h+32:.0f} H{x+w-5:.0f}" {S("--art-ink", 2)} opacity=".5"/>')
        x += w + 4
    out.append(f'<path d="M20 332 H380" {S("--art-ink", 5)}/>')
    return _svg(''.join(out), label)


def pints(label='Cerveja'):
    out = [f'<circle cx="200" cy="200" r="170" {F("--a3")} opacity=".4"/>']
    for x, base, h, fill in [(130, 340, 220, .82), (270, 340, 190, .7)]:
        out.append(_glass(x, base, h, fill, kind='pint'))
    rnd = random.Random(9)
    for _ in range(18):
        out.append(f'<circle cx="{rnd.uniform(100,300):.0f}" cy="{rnd.uniform(200,320):.0f}" r="{rnd.uniform(2,4):.1f}" {F("--art-hi")} opacity=".7"/>')
    return _svg(''.join(out), label)


def cup_vr(label='Café e realidade virtual'):
    out = [f'<rect width="400" height="400" {F("--a3")} opacity=".35"/>']
    out.append(f'<rect x="70" y="70" width="260" height="120" rx="48" {F("--a1")}/><rect x="70" y="70" width="260" height="120" rx="48" {S("--art-ink", 4)}/>')
    out.append(f'<rect x="96" y="96" width="94" height="68" rx="26" {F("--art-ink")}/><rect x="210" y="96" width="94" height="68" rx="26" {F("--art-ink")}/>')
    out.append(f'<path d="M110 120 l24 -10" {S("--art-hi", 5)}/><path d="M224 120 l24 -10" {S("--art-hi", 5)}/>')
    out.append(f'<path d="M140 250 H260 V318 Q260 352 226 352 H174 Q140 352 140 318 Z" {F("--art-hi")}/><path d="M140 250 H260 V318 Q260 352 226 352 H174 Q140 352 140 318 Z" {S("--art-ink", 4)}/>')
    out.append(f'<path d="M260 268 Q296 268 292 296 Q288 318 260 318" {S("--art-ink", 4)}/>')
    out.append(f'<path d="M176 236 q-10 -12 0 -24 t0 -24 M202 236 q-10 -12 0 -24 t0 -24 M228 236 q-10 -12 0 -24 t0 -24" {S("--a2", 4)}/>')
    return _svg(''.join(out), label)


def waves(label='Mar'):
    out = [f'<circle cx="200" cy="200" r="170" {F("--a3")} opacity=".45"/>']
    for k in range(6):
        y = 150 + k * 34
        c = ['--a1', '--a2', '--art-hi'][k % 3]
        out.append(f'<path d="M20 {y} q30 -22 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" {S(c, 9)}/>')
    out.append(f'<circle cx="290" cy="96" r="40" {F("--a2")}/>')
    return _svg(''.join(out), label)


MOTIFS = dict(croissant=croissant, bun=bun, bowl=bowl, awning=awning, grill=grill, lifebuoy=lifebuoy,
              glasses=glasses, holyglass=lambda: glasses('Copos e arco', arch=True),
              dunes=lambda: glasses('Copos e dunas de Colares', dunes=True),
              chalk=lambda: glasses('Vinho da semana', chalk=True),
              flowers=flowers, flowers2=lambda: flowers(seed=4, count=7), flowers3=lambda: flowers(seed=9, count=4),
              azulejo=azulejo, nuts=nuts, plate=plate, star=star_tiles, vinyl=vinyl, lamps=lamps, knots=knots,
              vessels=vessels, scoops=scoops, books=books, pints=pints, cupvr=cup_vr, waves=waves)
