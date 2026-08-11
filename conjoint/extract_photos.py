"""
Recorta a FOTO de dentro de cada card de notícia.

As variantes 'post' e 'post_source' são desenhadas em CSS (bolha de texto +
foto), então delas só é preciso a foto. Uma foto por notícia, tirada do card
`<noticia>_g1_high`.

Saída: assets/photo_<noticia>.jpg, 800 px de largura.
"""
import os, json
import numpy as np
from PIL import Image

CARDS = '/Users/Mello/Dropbox/fernandobmello-site/conjoint/assets'
STORIES = ['f1','f2','f3','f4','f5','f6','t1','t2','t3','t4','t5','t6']
WHITE = 232

def photo_box(a):
    """Maior bloco contíguo de linhas majoritariamente NÃO brancas."""
    h, w = a.shape[:2]
    mid = a[:, int(w * .06):int(w * .94)]
    white_frac = (mid > WHITE).all(axis=2).mean(axis=1)
    rows = np.flatnonzero(white_frac < 0.5)
    if rows.size == 0:
        return None
    blocks, cur = [], [rows[0]]
    for y in rows[1:]:
        if y - cur[-1] <= 4:
            cur.append(y)
        else:
            blocks.append(cur); cur = [y]
    blocks.append(cur)
    blk = max(blocks, key=len)
    top, bot = blk[0], blk[-1]
    # bordas laterais: colunas não brancas dentro do bloco
    band = a[top:bot + 1]
    col_white = (band > WHITE).all(axis=2).mean(axis=0)
    cols = np.flatnonzero(col_white < 0.5)
    if cols.size == 0:
        return None
    return int(top), int(bot), int(cols[0]), int(cols[-1])

meta = {}
for s in STORIES:
    src = os.path.join(CARDS, f'{s}_g1_high.jpg')
    im = Image.open(src).convert('RGB')
    box = photo_box(np.asarray(im))
    if box is None:
        print('!! sem foto:', s); continue
    t, b, l, r = box
    photo = im.crop((l, t, r + 1, b + 1))
    photo = photo.resize((800, round(photo.height * 800 / photo.width)), Image.LANCZOS)
    out = os.path.join(CARDS, f'photo_{s}.jpg')
    photo.save(out, 'JPEG', quality=88, optimize=True, progressive=True)
    meta[s] = {'w': photo.width, 'h': photo.height, 'ar': round(photo.height / photo.width, 3)}
    print(f'{s}: foto {photo.width}x{photo.height}  (ar {meta[s]["ar"]})')

ars = [m['ar'] for m in meta.values()]
print('\nrazão altura/largura das fotos: min=%.2f max=%.2f' % (min(ars), max(ars)))
with open(os.path.join(os.path.dirname(CARDS), 'photos_meta.json'), 'w') as f:
    json.dump(meta, f, indent=1, sort_keys=True)
