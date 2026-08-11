"""
Recorta o CARD DE NOTÍCIA de cada print do WhatsApp.

O card, as bolhas de conversa e a barra de digitação são todos quase brancos, então
a separação é geométrica, não por cor:

 1. procura, linha a linha, faixas brancas contíguas largas (>= MIN_RUN);
 2. agrupa essas faixas pela coluna em que COMEÇAM — o card, as bolhas e a barra
    de digitação têm bordas esquerdas diferentes. O grupo com mais linhas é o card;
 3. estende o recorte para cima e para baixo enquanto as duas bordas internas do
    card continuarem brancas. É isso que atravessa a foto do meio do card, que
    quebra a faixa larga mas mantém as margens laterais brancas.

Saída: cards/<nome>.jpg, todos com 800 px de largura.
"""
import os, glob, json
import numpy as np
from PIL import Image

SRC = '/Users/Mello/Dropbox/publications/influencers/assets/conjoint'
OUT = '/Users/Mello/Dropbox/fernandobmello-site/conjoint/assets'
W = 1000                 # largura de trabalho
CARD_W = 800             # largura final do card
MIN_RUN = 620
WHITE = 232
QUALITY = 88

def runs_of(mask):
    e = np.flatnonzero(np.diff(np.concatenate(([0], mask.astype(np.int8), [0]))))
    return list(zip(e[::2], e[1::2]))

def header_end(a):
    red = a[:, :, 0].mean(axis=1)
    i = int(np.argmax(red > 120))
    return i if red[i] > 120 else 0

def card_box(a):
    h = a.shape[0]
    hdr = header_end(a)
    light = (a > WHITE).all(axis=2)

    wide = {}
    for y in range(hdr + 2, h):
        best = max((r for r in runs_of(light[y]) if r[1] - r[0] >= MIN_RUN),
                   key=lambda r: r[1] - r[0], default=None)
        if best:
            wide[y] = best
    if not wide:
        return None

    # agrupa por borda esquerda
    clusters = []
    for y, (s, e) in sorted(wide.items()):
        for c in clusters:
            if abs(s - c['s']) <= 25:
                c['rows'].append(y); c['ss'].append(s); c['ee'].append(e)
                c['s'] = int(np.median(c['ss']))
                break
        else:
            clusters.append({'s': s, 'rows': [y], 'ss': [s], 'ee': [e]})

    c = max(clusters, key=lambda c: len(c['rows']))
    l, r = int(np.median(c['ss'])), int(np.median(c['ee']))
    seed = int(np.median(c['rows']))

    # estende pelas bordas internas (atravessa a foto dentro do card)
    xl, xr = min(l + 6, W - 1), max(r - 7, 0)
    edge = light[:, xl] & light[:, xr]
    top = seed
    while top - 1 >= hdr and edge[top - 1]:
        top -= 1
    bot = seed
    while bot + 1 < h and edge[bot + 1]:
        bot += 1
    return top, bot, l, r

def main():
    os.makedirs(OUT, exist_ok=True)
    meta, flagged = {}, []
    files = sorted(glob.glob(os.path.join(SRC, '*.png')) + glob.glob(os.path.join(SRC, '*.jpg')))
    for p in files:
        name = os.path.splitext(os.path.basename(p))[0]
        im = Image.open(p).convert('RGB')
        h = round(im.height * W / im.width)
        im = im.resize((W, h), Image.LANCZOS)
        box = card_box(np.asarray(im))
        if box is None:
            flagged.append((name, 'card não encontrado')); continue
        t, b, l, r = box
        cw, ch = r - l, b - t + 1
        if ch < 250 or cw < 600:
            flagged.append((name, f'recorte suspeito {cw}x{ch}'))
        card = im.crop((l, t, r, b + 1))
        card = card.resize((CARD_W, round(ch * CARD_W / cw)), Image.LANCZOS)
        card.save(os.path.join(OUT, name + '.jpg'), 'JPEG',
                  quality=QUALITY, optimize=True, progressive=True)
        meta[name] = {'w': card.width, 'h': card.height, 'ar': round(card.height / card.width, 3)}

    ars = sorted(m['ar'] for m in meta.values())
    print(f"{len(meta)} cards gravados em {CARD_W}px de largura")
    print("razão altura/largura: min=%.2f mediana=%.2f max=%.2f" % (ars[0], ars[len(ars)//2], ars[-1]))
    print("altura em px: min=%d max=%d" % (min(m['h'] for m in meta.values()),
                                           max(m['h'] for m in meta.values())))
    if flagged:
        print("\n⚠ conferir à mão:")
        for n, why in flagged:
            print("   ", n, "—", why)
    else:
        print("\nnenhum recorte suspeito")
    with open(os.path.join(os.path.dirname(OUT), 'cards_meta.json'), 'w') as f:
        json.dump(meta, f, indent=1, sort_keys=True)

if __name__ == '__main__':
    main()
