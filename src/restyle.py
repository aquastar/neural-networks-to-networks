"""Regenerate index.html from src/original.html in the house style v2 (style_v2.py, same module as the graph-inside-generative-models deck).
Run: python3 src/restyle.py"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import style_v2 as SV

s = open(os.path.join(HERE, 'original.html')).read()
i = s.find('<div class="slides">'); j = s.rfind('</section>') + len('</section>')
head, body, tail = s[:i], s[i:j], s[j:]

COVER = f'''
.reveal section.titlehero h1{{color:{SV.INK} !important}}
.reveal section.titlehero .th-sub,.reveal section.titlehero .th-author{{color:{SV.INK2} !important}}
.reveal section.titlehero .th-author b{{color:{SV.INK} !important}}
.reveal section.titlehero .th-kicker{{color:{SV.INK2} !important}}
'''
head = head.replace('</style>', SV.CSS + COVER + '</style>', 1)
head = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^"]*">', '', head)

def fix_section(m):
    sec = m.group(0)
    cover = 'titlehero' in sec[:200]
    if cover:
        sec = re.sub(r'data-background-gradient="[^"]*"', f'data-background-color="{SV.BG}"', sec, count=1)
    return SV.ref_separators(SV.restyle(sec, cover=cover))

body = re.sub(r'<section\b.*?</section>', fix_section, body, flags=re.S)
html = head + body + tail
open(os.path.join(ROOT, 'index.html'), 'w').write(html)
print('sections', body.count('<section'))

# scripts: same color map (deck.js builds the timeline and map, wb3d.js the 3D whiteboard)
def recolor_js(src, dst, hex0x=False):
    t = open(os.path.join(HERE, src)).read()
    t = SV.HEX.sub(SV._map, t)
    t = t.replace('#1c2430', SV.INK).replace('#5b6b7c', SV.INK2).replace('#8a9bab', SV.AXIS).replace('#e3e8ec', SV.RULE).replace('#f4f6f8', SV.GROUP).replace('#fbfbfa', SV.BG)
    if hex0x:
        t = re.sub(r'0x([0-9a-fA-F]{6})', lambda m: '0x' + SV.CMAP.get('#' + m.group(1).lower(), '#' + m.group(1)).lstrip('#').upper(), t)
        t = t.replace('0xEEF1F3', '0x' + SV.GROUP[1:]).replace('0x3D4A54', '0x' + SV.INK2[1:]).replace('0xB9C2C8', '0x' + SV.AXIS[1:]).replace('0xD3E3EE', '0x' + SV.RULE[1:])
    t = t.replace('Fira Sans', 'et-book')
    open(os.path.join(ROOT, dst), 'w').write(t)

recolor_js('deck.original.js', 'deck.js')
recolor_js('wb3d.original.js', 'wb3d.js', hex0x=True)
