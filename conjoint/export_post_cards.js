/**
 * Gera os 48 PNGs das variantes "post" e "post_source".
 *
 * As fontes `g1` e `no_source` já são arquivos (recortados dos prints originais).
 * As fontes `post` e `post_source` são desenhadas em CSS dentro do survey — este
 * script rasteriza exatamente esse mesmo desenho, para que as 96 células do
 * conjoint existam também como imagem (útil para portar o survey para outra
 * plataforma, para revisão e para pré-registro).
 *
 * O CSS e a função cardHTML() são LIDOS do index.html, nunca reescritos aqui:
 * assim a imagem gerada não pode divergir do que o respondente vê.
 *
 * Uso:  node export_post_cards.js
 * Requer: Google Chrome e ImageMagick (`magick`).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const SURVEY = path.join(HERE, 'index.html');
const OUT = path.join(HERE, 'assets');
const TMP = path.join(HERE, '.export-tmp');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Largura do balão no survey (~256 CSS px) e fator de escala para sair com 800 px,
// que é a mesma largura dos cards g1/no_source.
const CSS_W = 256;
const SCALE = 800 / CSS_W;

const src = fs.readFileSync(SURVEY, 'utf8');
const styles = src.split('<style>')[1].split('</style>')[0];
const script = src.split('<script>')[1].split('</script>')[0];

// ── extrai do index.html as constantes e a função de desenho ──
const cfg = script.slice(
  script.indexOf('const STORIES'),
  script.indexOf('// ═══════════════════════════════════════════════════════════════════\n//  GERAÇÃO')
)
  // fora do navegador não há window.crypto; nada disso é usado para desenhar
  .replace(/function uuid\(\)[\s\S]*?\n}\n/, '')
  .replace(/const RESPONDENT_ID = uuid\(\);/, '');
const cardFn = script.slice(
  script.indexOf('function cardHTML(p, alt)'),
  script.indexOf('// Moldura de uma opção da tarefa')
);

const ctx = {};
new Function('module', `${cfg}\n${cardFn}\nmodule.exports = { STORIES, SOURCES, VIRALITY,
  RENDERED_SOURCES, photoFor, cardHTML };`)(ctx);
const M = ctx.exports;

fs.mkdirSync(TMP, { recursive: true });

const cells = [];
for (const s of M.STORIES)
  for (const source of M.SOURCES)
    for (const virality of M.VIRALITY)
      if (M.RENDERED_SOURCES.has(source))
        cells.push({ story: s, source, virality });

console.log(`gerando ${cells.length} PNGs a ${800}px de largura…`);

let done = 0;
for (const c of cells) {
  const id = `${c.story.key}_${c.source}_${c.virality}`;
  const profile = {
    story: c.story.key, veracity: c.story.veracity, valence: c.story.valence,
    headline: c.story.headline, source: c.source, virality: c.virality,
    rendered: true, img: null, photo: M.photoFor(c.story.key)
  };

  // <base> aponta para a raiz do repositório: sem isso o caminho relativo
  // assets/photo_*.jpg não resolve a partir da pasta temporária e o card sai sem foto.
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8">
<base href="file://${HERE}/"><style>
${styles}
/* fora do survey o card ocupa a largura toda e não tem teto de altura */
html,body { margin:0; padding:0; background:#efe7de; }
.stage { width:${CSS_W}px; }
.stage .wa__cardwrap { max-width:100% !important; max-height:none !important; }
.stage .post-photo { min-height:0; }
</style></head><body><div class="stage">${M.cardHTML(profile, id)}</div></body></html>`;

  const html = path.join(TMP, id + '.html');
  fs.writeFileSync(html, page.replace(/ loading="lazy"/g, ''));

  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--virtual-time-budget=4000',                    // deixa a foto carregar
    // Fundo do chat do WhatsApp, não transparente: assim a imagem é
    // autossuficiente em qualquer plataforma. Num fundo branco, um balão
    // branco com pílulas brancas praticamente desapareceria.
    '--default-background-color=efe7de',
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${CSS_W},1200`,
    `--screenshot=${path.join(TMP, id + '.png')}`,
    'file://' + html
  ], { stdio: 'pipe' });

  // recorta a sobra e devolve uma margem do fundo do chat
  execFileSync('magick', [
    path.join(TMP, id + '.png'), '-trim', '+repage',
    '-bordercolor', '#efe7de', '-border', '18',
    '-strip', '-define', 'png:compression-level=9',
    path.join(OUT, id + '.png')
  ]);

  done++;
  if (done % 12 === 0) console.log(`  ${done}/${cells.length}`);
}

fs.rmSync(TMP, { recursive: true, force: true });

const sizes = cells.map(c => {
  const f = path.join(OUT, `${c.story.key}_${c.source}_${c.virality}.png`);
  const dim = execFileSync('magick', ['identify', '-format', '%wx%h', f]).toString();
  return { id: `${c.story.key}_${c.source}_${c.virality}`, dim, bytes: fs.statSync(f).size };
});
const widths = [...new Set(sizes.map(s => s.dim.split('x')[0]))];
console.log(`\n${sizes.length} PNGs gravados em assets/`);
console.log('larguras:', widths.join(', '));
console.log('alturas :', Math.min(...sizes.map(s => +s.dim.split('x')[1])), '–',
                          Math.max(...sizes.map(s => +s.dim.split('x')[1])));
console.log('peso total:', (sizes.reduce((a, s) => a + s.bytes, 0) / 1048576).toFixed(1), 'MB');
