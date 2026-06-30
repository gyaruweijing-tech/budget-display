/**
 * 銀行 残高 GAS（シンプルな「残高を持ち回す」方式）
 * --------------------------------------------------
 * 考え方はシンプル：「残高」という数字を1個だけ持っておく。
 *   ・新しい支出メールが来たら   → 残高からその金額を引く（1回だけ）
 *   ・「＋入金」ボタンを押したら → 残高にその金額を足す
 *   ・アプリを開いただけのとき   → 保存してある残高をそのまま見せる（計算しない）
 * 基準日も初期残高もナシ。残高そのものが基準。
 *
 * 使うスプレッドシート:
 *   タブ「取引」 : 日付 | 種別 | 金額 | 店名 | 承認番号   ← 履歴＆「もう引いたか」の記録
 *   タブ「設定」 : 残高 | <金額>                          ← これ1行だけでOK
 *
 * 最初に1回だけ：「設定」の残高セルに、今の銀行の本当の残高を入れる。
 * あとはズレたらいつでも、そのセルを正しい数字に書き換えればリセットできる。
 */

const SENDER         = 'bank-notice@example.com';
const DEFAULT_INCOME = 30000;          // 「＋入金」ボタンの初期値（変更可）
const TOKEN          = 'CHANGE_ME_123'; // ← 好きな合言葉に変更（URLに付ける。パスワード扱い）
const TX_SHEET       = '取引';
const CONFIG_SHEET   = '設定';
const BAL_KEYS       = ['残高', '現在残高']; // どちらの名前でも「残高」として扱う（移行用）

/** メイン：新しい支出メールだけ残高から引く。🔄ボタン／トリガーで実行 */
function updateBalance() {
  const ss = SpreadsheetApp.getActive();
  const txSheet = ss.getSheetByName(TX_SHEET);
  ensureHeader_(txSheet);

  // すでに記録済み＝もう残高から引いた承認番号（重複防止のカギ）
  // Sheetsが承認番号を数値化して "012345"→12345 とズレるのを normKey_ で吸収。
  const existing = new Set();
  const last = txSheet.getLastRow();
  if (last >= 2) {
    txSheet.getRange(2, 5, last - 1, 1).getValues()
      .forEach(r => { if (r[0] !== '') existing.add(normKey_(r[0])); });
  }

  // 新しい支出メールだけを取り込んで、その金額ぶんだけ残高から引く（直近14日を検索＝軽い）
  let balance = getBalance_();
  const threads = GmailApp.search('from:' + SENDER + ' newer_than:14d', 0, 100);
  threads.forEach(t => t.getMessages().forEach(m => {
    const tx = parseDebitEmail_(m.getPlainBody());
    if (!tx) return;                                 // デビット利用メール以外はスキップ
    if (existing.has(normKey_(tx.approval))) return; // もう引いてあるならスキップ
    txSheet.appendRow([tx.date, '支出', tx.amount, tx.shop, tx.approval]);
    existing.add(normKey_(tx.approval));
    balance -= tx.amount; // 新規ぶんだけ残高から引く（払戻=マイナス金額なら自動で加算になる）
  }));

  setBalance_(balance);
  return balance;
}

/** Reactアプリが叩くエンドポイント。残高と直近取引をJSONで返す。
 *  ・開いただけ          → 保存してある残高をそのまま返す（書き換えない）
 *  ・?refresh=1（🔄）     → 新しい支出メールを取り込んで残高から引く
 *  ・?action=addIncome    → 入金を1件足す */
function doGet(e) {
  if (TOKEN && (!e || e.parameter.token !== TOKEN)) {
    return json_({ error: 'unauthorized' });
  }
  const p = (e && e.parameter) || {};
  let balance;
  if (p.action === 'addIncome') {
    balance = addManual_(p.amount, '入金');   // ＋入金：残高に足す
  } else if (p.action === 'subtract') {
    balance = addManual_(p.amount, '支出');   // －減らす：残高から引く（押し間違いの取り消し用）
  } else if (p.action === 'setBalance') {
    balance = setBalanceManual_(p.amount);    // 残高を直接この金額にセット
  } else if (p.refresh === '1') {
    balance = updateBalance();
  } else {
    balance = getBalance_(); // 開いただけ：保存してある残高をそのまま返す（計算しない＝ブレない）
  }

  const txSheet = SpreadsheetApp.getActive().getSheetByName(TX_SHEET);
  const last = txSheet.getLastRow();
  let txs = [];
  if (last >= 2) {
    const seenTx = new Set(); // 重複行は履歴に1回だけ出す
    txs = txSheet.getRange(2, 1, last - 1, 5).getValues()
      .filter(r => {
        const key = normKey_(r[4]);
        if (key && seenTx.has(key)) return false;
        if (key) seenTx.add(key);
        return true;
      })
      .map(r => ({ date: r[0], type: r[1], amount: Number(r[2]), shop: r[3], id: String(r[4]) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 20);
  }
  return json_({ balance, updatedAt: new Date().toISOString(), transactions: txs });
}

/** 「＋入金」「－減らす」ボタンの実体：手動の取引を1件記録して残高を増減する。
 *  type='入金'なら足す、'支出'なら引く。
 *  ユニークなキー(MANUAL-…)を付けるので、同じ金額でも何回でも追加できる。 */
function addManual_(amountParam, type) {
  const ss = SpreadsheetApp.getActive();
  const txSheet = ss.getSheetByName(TX_SHEET);
  ensureHeader_(txSheet);

  let amount = Math.abs(Math.round(Number(amountParam)));
  if (!isFinite(amount) || amount === 0) {
    if (type === '入金') amount = DEFAULT_INCOME; // 入金は空なら初期値、減額は0なら何もしない
    else return getBalance_();
  }

  const now = new Date();
  const key = 'MANUAL-' + Utilities.formatDate(now, 'JST', 'yyyyMMddHHmmss');
  const label = type === '入金' ? '入金（手動）' : '減額（手動）';
  txSheet.appendRow([
    Utilities.formatDate(now, 'JST', 'yyyy/MM/dd'),
    type, amount, label, key
  ]);

  const balance = getBalance_() + (type === '入金' ? amount : -amount);
  setBalance_(balance);
  return balance;
}

/** 残高を指定の金額に直接セットする（「残高を修正」ボタン用）。
 *  取引は記録せず、残高そのものを上書き。ズレたとき一発で直せる。 */
function setBalanceManual_(amountParam) {
  const v = Math.round(Number(amountParam));
  if (!isFinite(v)) return getBalance_(); // 数字でなければ何もしない
  setBalance_(v);
  return v;
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

/** 「設定」シートから残高を読む（'残高'優先、無ければ'現在残高'） */
function getBalance_() {
  const cfg = getConfig_();
  for (const k of BAL_KEYS) {
    if (cfg.map[k] !== undefined && cfg.map[k] !== '') return Number(cfg.map[k]) || 0;
  }
  return 0;
}

/** 「設定」シートに残高を書く（既存の残高セルがあればそこへ、無ければ'残高'を追加） */
function setBalance_(value) {
  const { sheet, values } = getConfig_();
  for (const k of BAL_KEYS) {
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === k) { sheet.getRange(i + 1, 2).setValue(value); return; }
    }
  }
  sheet.appendRow(['残高', value]);
}

function getConfig_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_SHEET);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getValues();
  const map = {};
  values.forEach(r => { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  return { sheet, map, values };
}

/** 重複防止キーの正規化。
 *  Sheetsは承認番号を数値に変換してしまい "012345"→12345 のように
 *  文字列と数値で食い違う。数字だけのキーは先頭ゼロを落として揃え、
 *  "MANUAL-..." のような文字列キーはそのまま比較する。 */
function normKey_(v) {
  return String(v).trim().replace(/^0+(?=\d)/, '');
}

function ensureHeader_(sh) {
  if (sh.getLastRow() === 0) sh.appendRow(['日付', '種別', '金額', '店名', '承認番号']);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
