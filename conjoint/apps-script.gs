/**
 * Backend do survey de conjoint (fernandobmello.com/conjoint).
 *
 * ── COMO INSTALAR ──────────────────────────────────────────────────
 * 1. Crie uma nova planilha em https://sheets.new  (ex.: "Conjoint 2026 — respostas")
 * 2. Extensões → Apps Script. Apague o conteúdo e cole ESTE arquivo inteiro.
 * 3. Salve. Depois: Implantar → Nova implantação → tipo "App da Web"
 *      · Executar como:        Eu (seu e-mail)
 *      · Quem pode acessar:    Qualquer pessoa                 <-- IMPORTANTE
 * 4. Copie a URL gerada (termina em /exec) e cole em index.html na constante ENDPOINT.
 * 5. Toda vez que editar este script, faça "Implantar → Gerenciar implantações →
 *    editar (lápis) → Versão: Nova versão → Implantar". A URL permanece a mesma.
 *
 * ── O QUE ELE GRAVA ────────────────────────────────────────────────
 * Aba "respondents"   : 1 linha por respondente (formato wide)
 * Aba "conjoint_long" : 1 linha por TAREFA (10 por respondente) — pronto para
 *                       reshape em formato de perfil para AMCE/cjoint em R.
 * Aba "raw"           : JSON bruto, como backup caso algum campo mude.
 */

var SHEET_RESP = 'respondents';
var SHEET_LONG = 'conjoint_long';
var SHEET_RAW  = 'raw';

var RESP_COLS = [
  'timestamp','respondent_id','survey_version','block_order',
  'start_time','end_time',
  'consent','interesse','influencia','compartilha',
  'partido_sim','partido_gosta','partido_nao','partido_menos',
  'termo_petistas','termo_antipetistas','bolso_anti',
  'midia','plataformas','busca','exp_odio','exp_briga',
  'silenciou','saiu_grupo','evitou',
  'voluntario_2018','voluntario_2022','voluntario_2026',
  'genero','idade','escolaridade','renda',
  'raca','estado','religiao','status',
  'context_A','context_B',
  'mc_A_first','mc_A_attempts','mc_A_correct1st',
  'mc_B_first','mc_B_attempts','mc_B_correct1st',
  'mc_A_order','mc_B_order',
  'partido_gosta_order','partido_menos_order','user_agent','screen_w'
];

var LONG_COLS = [
  'timestamp','respondent_id','task_global','block','block_position','task_in_block','rt_ms',
  'chosen_side',
  'left_story','left_veracity','left_source','left_virality','left_valence','left_profile','left_ctx',
  'right_story','right_veracity','right_source','right_virality','right_valence','right_profile','right_ctx',
  'chosen_story','chosen_veracity','chosen_source','chosen_virality','chosen_valence','chosen_profile'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    // ── respondents ──
    var r = data.respondent || {};
    var respSheet = getSheet_(ss, SHEET_RESP, RESP_COLS);
    respSheet.appendRow(RESP_COLS.map(function (c) {
      if (c === 'timestamp') return now;
      var v = r[c];
      return (v === undefined || v === null) ? '' : v;
    }));

    // ── conjoint_long ──
    var tasks = data.conjoint || [];
    if (tasks.length) {
      var longSheet = getSheet_(ss, SHEET_LONG, LONG_COLS);
      var rows = tasks.map(function (t) {
        return LONG_COLS.map(function (c) {
          if (c === 'timestamp') return now;
          var v = t[c];
          return (v === undefined || v === null) ? '' : v;
        });
      });
      longSheet.getRange(longSheet.getLastRow() + 1, 1, rows.length, LONG_COLS.length).setValues(rows);
    }

    // ── raw ──
    var rawSheet = getSheet_(ss, SHEET_RAW, ['timestamp', 'respondent_id', 'json']);
    rawSheet.appendRow([now, r.respondent_id || '', JSON.stringify(data)]);

    return json_({ status: 'ok', rows: tasks.length });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ status: 'ok', message: 'conjoint endpoint ativo' });
}

function getSheet_(ss, name, cols) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(cols);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
