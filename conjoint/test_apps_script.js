// Testa sheetFor_/rowFor_ do apps-script.gs com uma planilha simulada.
const fs = require('fs');
const src = fs.readFileSync(
  '/Users/Mello/Dropbox/publications/influencers/conjoint-eleicoes-2026/apps-script.gs', 'utf8');

// ── planilha falsa ──
function makeSheet(rows) {
  const grid = rows.map(r => r.slice());
  return {
    _grid: grid,
    getLastColumn: () => grid.length ? Math.max(...grid.map(r => r.length)) : 0,
    getLastRow: () => grid.length,
    setFrozenRows() {},
    getRange(r, c, nr, nc) {
      return {
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) {
            const row = grid[r - 1 + i] || [];
            out.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? ''));
          }
          return out;
        },
        setValues(vals) {
          vals.forEach((row, i) => {
            const y = r - 1 + i;
            while (grid.length <= y) grid.push([]);
            row.forEach((v, j) => { grid[y][c - 1 + j] = v; });
          });
          return this;
        },
        setFontWeight() { return this; }
      };
    },
    appendRow(row) { grid.push(row.slice()); }
  };
}
function makeSS(sheets) {
  return { getSheetByName: n => sheets[n] || null,
           insertSheet: n => (sheets[n] = makeSheet([])) };
}

const ctx = {};
new Function('module', src + '\nmodule.exports = { sheetFor_, rowFor_, RESP_COLS };')(ctx);
const { sheetFor_, rowFor_, RESP_COLS } = ctx.exports;

const NOW = 'TS';
const ok = (label, cond) => console.log(`  ${cond ? '✅' : '❌'} ${label}`);

// ── 1. planilha nova ──
console.log('\n1. Planilha nova');
let sheets = {};
let r1 = sheetFor_(makeSS(sheets), 'respondents', RESP_COLS);
r1.sheet.appendRow(rowFor_(r1.header, { respondent_id: 'r1', mc_A_first: 'bolsonaristas' }, NOW));
ok('cabeçalho gravado com todas as colunas', r1.header.length === RESP_COLS.length);
ok('valor cai na coluna certa',
   r1.sheet._grid[1][RESP_COLS.indexOf('mc_A_first')] === 'bolsonaristas');

// ── 2. aba antiga, sem as colunas novas ──
console.log('\n2. Aba já existente com cabeçalho antigo (cenário do IBPAD)');
const OLD = ['timestamp','respondent_id','survey_version','block_order','consent','interesse'];
sheets = { respondents: makeSheet([OLD, ['TS','antigo','v1','AB','1','3']]) };
let r2 = sheetFor_(makeSS(sheets), 'respondents', RESP_COLS);
r2.sheet.appendRow(rowFor_(r2.header, {
  respondent_id: 'novo', interesse: 7, mc_B_attempts: 2, voluntario_2018: 'sim'
}, NOW));
const h2 = r2.header, g2 = r2.sheet._grid;
ok('colunas antigas continuam nas mesmas posições',
   OLD.every((c, i) => h2[i] === c));
ok('linha antiga não foi mexida', g2[1][1] === 'antigo' && g2[1][5] === '3');
ok('colunas novas acrescentadas ao fim', h2.length === RESP_COLS.length);
ok('interesse (coluna antiga) na posição antiga', g2[2][h2.indexOf('interesse')] === 7);
ok('mc_B_attempts (coluna nova) na coluna certa', g2[2][h2.indexOf('mc_B_attempts')] === 2);
ok('voluntario_2018 na coluna certa', g2[2][h2.indexOf('voluntario_2018')] === 'sim');
ok('nenhuma coluna perdida', RESP_COLS.every(c => h2.indexOf(c) !== -1));

// ── 3. script reordenado depois da coleta começar ──
console.log('\n3. Colunas reordenadas no script');
const header3 = r2.header.slice();
sheets = { respondents: makeSheet([header3]) };
const REORDER = RESP_COLS.slice().reverse();
let r3 = sheetFor_(makeSS(sheets), 'respondents', REORDER);
r3.sheet.appendRow(rowFor_(r3.header, { respondent_id: 'x', idade: 41 }, NOW));
ok('cabeçalho da planilha não é reordenado', r3.header.join() === header3.join());
ok('idade continua caindo sob "idade"',
   r3.sheet._grid[1][r3.header.indexOf('idade')] === 41);

// ── 4. coluna removida do script ──
console.log('\n4. Coluna removida do script');
sheets = { respondents: makeSheet([header3]) };
const SEM = RESP_COLS.filter(c => c !== 'interesse');
let r4 = sheetFor_(makeSS(sheets), 'respondents', SEM);
r4.sheet.appendRow(rowFor_(r4.header, { respondent_id: 'y', idade: 30 }, NOW));
ok('coluna removida continua no cabeçalho', r4.header.indexOf('interesse') !== -1);
ok('fica vazia, sem deslocar as demais',
   r4.sheet._grid[1][r4.header.indexOf('interesse')] === '' &&
   r4.sheet._grid[1][r4.header.indexOf('idade')] === 30);
