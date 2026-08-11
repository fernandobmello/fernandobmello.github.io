// Extracts the randomization block from index.html and simulates 5000 respondents.
const fs = require('fs');
const path = require('path');

const SURVEY = '/Users/Mello/Dropbox/fernandobmello-site/conjoint/index.html';
const ASSETS = '/Users/Mello/Dropbox/fernandobmello-site/conjoint/assets';
const src = fs.readFileSync(SURVEY, 'utf8');

// Pull the <script> body and evaluate only the parts we need (no DOM).
const script = src.split('<script>')[1].split('</script>')[0];
const start = script.indexOf('const STORIES');
const end = script.indexOf('// ═══════════════════════════════════════════════════════════════════\n//  GERAÇÃO');
const logic = script.slice(start, end);

// Stub out the config constants the logic needs from above the slice.
const preamble = `const TASKS_PER_BLOCK = 5;\n`;
const exportTail = `
module.exports = { STORIES, SOURCES, VIRALITY, NO_REPEAT_WITHIN_BLOCK,
                   imgFor, buildProfile, buildBlockTasks,
                   shuffle, pick, RENDERED_SOURCES, photoFor, getState: () => ({ BLOCK_ORDER, TASKS }),
                   buildAllTasks };
`;
// The slice references `responses`, `currentScreen` etc. only in later functions; strip DOM bits.
const cleaned = logic
  .replace(/const RESPONDENT_ID = uuid\(\);/, '')
  .replace(/function uuid\(\)[\s\S]*?\n}\n/, '');

const mod = { exports: {} };
new Function('module', 'exports', preamble + cleaned + exportTail)(mod, mod.exports);
const M = mod.exports;

// ── 1. Every asset a cell needs must exist on disk ──
// Fontes 'post'/'post_source' são desenhadas em CSS: precisam só da foto.
const missing = [];
for (const s of M.STORIES) {
  if (!fs.existsSync(path.join(ASSETS, `photo_${s.key}.jpg`))) missing.push(`photo_${s.key}.jpg`);
  for (const src2 of M.SOURCES)
    for (const v of M.VIRALITY) {
      if (M.RENDERED_SOURCES.has(src2)) continue;
      const f = M.imgFor(s.key, src2, v).replace('assets/', '');
      if (!fs.existsSync(path.join(ASSETS, f))) missing.push(f);
    }
}
console.log('cells in design:', M.STORIES.length * M.SOURCES.length * M.VIRALITY.length);
console.log('missing asset files:', missing.length ? missing : 'NONE ✅');

// ── 2. Simulate ──
const N = 5000;
const orderCount = {}, storyCount = {}, sourceCount = {}, viralCount = {};
const posByBlock = { A: [0,0], B: [0,0] };
let samePairViolations = 0, dupWithinBlock = 0, badPath = 0, totalProfiles = 0;

for (let i = 0; i < N; i++) {
  M.buildAllTasks();
  const { BLOCK_ORDER, TASKS } = M.getState();
  orderCount[BLOCK_ORDER.join('')] = (orderCount[BLOCK_ORDER.join('')] || 0) + 1;
  posByBlock[BLOCK_ORDER[0]][0]++;
  posByBlock[BLOCK_ORDER[1]][1]++;

  if (TASKS.length !== 10) throw new Error('expected 10 tasks, got ' + TASKS.length);

  const seenPerBlock = { A: new Set(), B: new Set() };
  for (const t of TASKS) {
    if (t.left.story === t.right.story) samePairViolations++;
    for (const p of [t.left, t.right]) {
      totalProfiles++;
      storyCount[p.story] = (storyCount[p.story] || 0) + 1;
      sourceCount[p.source] = (sourceCount[p.source] || 0) + 1;
      viralCount[p.virality] = (viralCount[p.virality] || 0) + 1;
      const expect = M.RENDERED_SOURCES.has(p.source)
        ? null : `assets/${p.story}_${p.source}_${p.virality}.jpg`;
      if (p.img !== expect) badPath++;
      if (p.photo !== `assets/photo_${p.story}.jpg`) badPath++;
      if (seenPerBlock[t.block].has(p.story)) dupWithinBlock++;
      seenPerBlock[t.block].add(p.story);
    }
  }
}

const pct = (n, d) => (100 * n / d).toFixed(2) + '%';
console.log('\n── block order (want ~50/50) ──');
Object.entries(orderCount).forEach(([k, v]) => console.log(`  ${k}: ${pct(v, N)}`));
console.log('\n── block position (want ~50/50 each) ──');
Object.entries(posByBlock).forEach(([k, v]) =>
  console.log(`  ${k}: 1st ${pct(v[0], N)} | 2nd ${pct(v[1], N)}`));
console.log('\n── story frequency (want ~8.33% each) ──');
Object.entries(storyCount).sort().forEach(([k, v]) => console.log(`  ${k}: ${pct(v, totalProfiles)}`));
console.log('\n── source (want ~50/50) ──');
Object.entries(sourceCount).forEach(([k, v]) => console.log(`  ${k}: ${pct(v, totalProfiles)}`));
console.log('── virality (want ~50/50) ──');
Object.entries(viralCount).forEach(([k, v]) => console.log(`  ${k}: ${pct(v, totalProfiles)}`));

console.log('\n── integrity ──');
console.log('  same story on both sides of a pair:', samePairViolations, samePairViolations === 0 ? '✅' : '❌');
console.log('  story repeated within a block:     ', dupWithinBlock, dupWithinBlock === 0 ? '✅' : '❌');
console.log('  malformed image paths:             ', badPath, badPath === 0 ? '✅' : '❌');
console.log('  total profiles simulated:          ', totalProfiles);
