/**
 * 銀行 残高 自動計算 GAS
 * --------------------------------------------------
 * ・bank-notice@example.com から来るVisaデビット利用メールを読んで支出を集計
 * ・毎週木曜の自動入金(3万)を加算
 * ・残高 = 初期残高 + 入金合計 - 支出合計 を計算してシートに記録
 * ・doGet で残高をJSONで返す（Reactアプリ用）
 *
 * 使うスプレッドシート:
 *   タブ「取引」 : 日付 | 種別 | 金額 | 店名 | 承認番号
 *   タブ「設定」 : 初期残高 / 基準日 / 現在残高
 */

const SENDER        = 'bank-notice@example.com';
const WEEKLY_AMOUNT = 30000;          // 毎週木曜の自動入金額
const TOKEN         = 'CHANGE_ME_123'; // ← 好きな合言葉に変更（URLに付ける。パスワード扱い）
const TX_SHEET      = '取引';
const CONFIG_SHEET  = '設定';

/** メイン: メールとの取り込み＋残高計算。トリガーで定期実行する */
function updateBalance() {
  const ss = SpreadsheetApp.getActive();
  const txSheet = ss.getSheetByName(TX_SHEET);
  ensureHeader_(txSheet);

  const cfg = getConfig_();
  const baseDate = new Date(cfg.map['基準日']);
  const initial  = Number(cfg.map['初期残高']) || 0;

  // すでにシートにある承認番号（重複防止のカギ）
  const existing = new Set();
  const last = txSheet.getLastRow();
  if (last >= 2) {
    txSheet.getRange(2, 5, last - 1, 1).getValues()
      .forEach(r => { if (r[0] !== '') existing.add(String(r[0])); });
  }

  // --- 1) 支出メールを取り込み（直近14日ぶんだけ検索＝軽い） ---
  const threads = GmailApp.search('from:' + SENDER + ' newer_than:14d', 0, 100);
  threads.forEach(t => t.getMessages().forEach(m => {
    const tx = parseDebitEmail_(m.getPlainBody());
    if (!tx) return;                       // デビット利用メール以外はスキップ
    if (existing.has(tx.approval)) return; // もう記録済みならスキップ
    txSheet.appendRow([tx.date, '支出', tx.amount, tx.shop, tx.approval]);
    existing.add(tx.approval);
  }));

  // --- 2) 毎週木曜の自動入金を取り込み（基準日の翌日以降の木曜） ---
  const d   = new Date(baseDate); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
  const end = new Date();         end.setHours(0, 0, 0, 0);
  while (d <= end) {
    if (d.getDay() === 4) { // 0=日,1=月,...,4=木
      const key = 'THU-' + Utilities.formatDate(d, 'JST', 'yyyyMMdd');
      if (!existing.has(key)) {
        txSheet.appendRow([
          Utilities.formatDate(d, 'JST', 'yyyy/MM/dd'),
          '入金', WEEKLY_AMOUNT, '自動入金(木)', key
        ]);
        existing.add(key);
      }
    }
    d.setDate(d.getDate() + 1);
  }

  // --- 3) 残高を計算してシートに書く（基準日より後の取引だけ集計） ---
  const balance = computeBalance_(txSheet, initial, baseDate);
  setConfigValue_('現在残高', balance);
  return balance;
}

/** Reactアプリが叩くエンドポイント。残高と直近取引をJSONで返す */
function doGet(e) {
  if (TOKEN && (!e || e.parameter.token !== TOKEN)) {
    return json_({ error: 'unauthorized' });
  }
  const balance = updateBalance(); // 14日窓なので毎回呼んでも軽い
  const txSheet = SpreadsheetApp.getActive().getSheetByName(TX_SHEET);
  const last = txSheet.getLastRow();
  let txs = [];
  if (last >= 2) {
    txs = txSheet.getRange(2, 1, last - 1, 5).getValues()
      .map(r => ({ date: r[0], type: r[1], amount: Number(r[2]), shop: r[3], id: String(r[4]) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 20);
  }
  return json_({ balance, updatedAt: new Date().toISOString(), transactions: txs });
}

/** 1日数回の自動実行トリガーを設定（最初に1回だけ実行する） */
function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'updateBalance') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('updateBalance').timeBased().everyHours(6).create();
}

// ---------- 以下、補助関数 ----------

function parseDebitEmail_(body) {
  const amtM  = body.match(/ご利用金額[：:]\s*(-?[\d,]+)\s*円/);
  const apprM = body.match(/承認番号[：:]\s*(\d+)/);
  if (!amtM || !apprM) return null; // デビット利用メールでなければ無視
  const dateM = body.match(/カード利用日[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
  const shopM = body.match(/ご利用加盟店[：:]\s*(.+)/);
  const amount = parseInt(amtM[1].replace(/,/g, ''), 10);
  const date = dateM
    ? Utilities.formatDate(new Date(+dateM[1], +dateM[2] - 1, +dateM[3]), 'JST', 'yyyy/MM/dd')
    : '';
  return { date, amount, shop: shopM ? shopM[1].trim() : '', approval: apprM[1] };
}

function computeBalance_(txSheet, initial, baseDate) {
  const last = txSheet.getLastRow();
  const base = new Date(baseDate); base.setHours(0, 0, 0, 0);
  let income = 0, expense = 0;
  if (last >= 2) {
    txSheet.getRange(2, 1, last - 1, 3).getValues().forEach(r => {
      const rowDate = new Date(r[0]);
      if (!(rowDate > base)) return; // 基準日より後の取引だけ集計（初期残高に含まれる過去ぶんは除外）
      const amt = Number(r[2]) || 0;
      if (r[1] === '入金') income += amt;
      else expense += amt; // 払戻はメール金額がマイナス→自動で加算になる
    });
  }
  return initial + income - expense;
}

function getConfig_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_SHEET);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getValues();
  const map = {};
  values.forEach(r => { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  return { sheet, map, values };
}

function setConfigValue_(key, value) {
  const { sheet, values } = getConfig_();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === key) { sheet.getRange(i + 1, 2).setValue(value); return; }
  }
  sheet.appendRow([key, value]);
}

function ensureHeader_(sh) {
  if (sh.getLastRow() === 0) sh.appendRow(['日付', '種別', '金額', '店名', '承認番号']);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
