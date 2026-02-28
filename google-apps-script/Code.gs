/**
 * DM送信管理アプリ → スプレッドシート連携（無料）
 * 
 * 使い方:
 * 1. Googleスプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. この Code.gs の内容を貼り付けて保存
 * 4. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員（リンクを知っている全員がアクセス可能）
 * 5. デプロイ後表示される「ウェブアプリのURL」をコピー
 * 6. アプリの .env に VITE_GOOGLE_SCRIPT_URL=そのURL を設定
 * 7. （任意）シートへの書き込みを制限したい場合、スクリプトプロパティで
 *    SHEET_SECRET を設定し、.env に VITE_SHEET_SECRET を同じ値で設定
 */

var SHEET_NAME = 'DM記録';

function doPost(e) {
  try {
    var raw;
    if (e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    } else if (e.postData && e.postData.contents) {
      var form = e.postData.contents;
      var match = /(?:^|&)data=([^&]*)/.exec(form);
      raw = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '{}';
    } else {
      raw = '{}';
    }
    var params = JSON.parse(raw);
    var secret = params.secret;
    var scriptSecret = getScriptSecret_();
    if (scriptSecret && scriptSecret !== secret) {
      return createJsonResponse_(401, { error: 'Unauthorized' });
    }
    var row = [
      params.date || '',
      params.month || '',
      params.userName || '',
      params.accountLink || '',
      params.businessType || '',
      params.followerRange || '',
      params.hasChampagne === true ? 'あり' : 'なし',
      params.hasChampagneTower === true ? 'あり' : 'なし',
      params.sentAt || ''
    ];
    var sheet = getOrCreateSheet_();
    sheet.appendRow(row);
    return createJsonResponse_(200, { ok: true });
  } catch (err) {
    return createJsonResponse_(500, { error: String(err.message) });
  }
}

function doGet(e) {
  return createJsonResponse_(405, { error: 'Use POST' });
}

function getScriptSecret_() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('SHEET_SECRET') || '';
  } catch (_) {
    return '';
  }
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      '日付', '月', '名前', 'アカウントリンク', '業態', 'フォロワー数',
      'シャンパン投稿', 'シャンパンタワー投稿', '送信日時'
    ]);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  return sheet;
}

function createJsonResponse_(code, obj) {
  var body = JSON.stringify(obj);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
