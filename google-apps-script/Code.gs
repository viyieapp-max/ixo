/**
 * Google Apps Script Web App untuk penyimpanan data keuangan per user di Google Sheets.
 * Tempelkan kode ini ke file Code.gs di project Apps Script Anda, lalu lakukan:
 * Deploy -> Manage deployments -> Edit -> New version -> Deploy (Execute as: Me, Who has access: Anyone).
 */

var SHEET_NAME = 'UserFinanceData';
var HEADERS = [
  'uid',
  'email',
  'brandName',
  'baseBalance',
  'transactionsJson',
  'balanceLogsJson',
  'updatedAt',
];

function getOrCreateUserSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (String(firstRow[0] || '').trim() !== 'uid') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
  return sheet;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function findUserRowIndex_(sheet, uid, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var normalizedUid = String(uid || '').trim();
  var normalizedEmail = String(email || '').trim().toLowerCase();

  for (var i = 0; i < rows.length; i++) {
    if (normalizedUid && String(rows[i][0] || '').trim() === normalizedUid) {
      return i + 2;
    }
  }
  if (normalizedEmail) {
    for (var j = 0; j < rows.length; j++) {
      if (
        !String(rows[j][0] || '').trim() &&
        String(rows[j][1] || '').trim().toLowerCase() === normalizedEmail
      ) {
        return j + 2;
      }
    }
  }
  return -1;
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = String(params.action || 'getUserData');
    if (action !== 'getUserData') {
      return jsonResponse_({ ok: false, error: 'Unsupported action' });
    }

    var uid = String(params.uid || '').trim();
    var email = String(params.email || '').trim();
    if (!uid && !email) {
      return jsonResponse_({ ok: false, error: 'uid or email required' });
    }

    var sheet = getOrCreateUserSheet_();
    var rowIndex = findUserRowIndex_(sheet, uid, email);
    if (rowIndex === -1) {
      return jsonResponse_({ ok: true, found: false });
    }

    var row = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
    var transactions = [];
    var balanceLogs = [];
    try {
      transactions = row[4] ? JSON.parse(String(row[4])) : [];
    } catch (err1) {
      transactions = [];
    }
    try {
      balanceLogs = row[5] ? JSON.parse(String(row[5])) : [];
    } catch (err2) {
      balanceLogs = [];
    }

    return jsonResponse_({
      ok: true,
      found: true,
      data: {
        brandName: String(row[2] || 'KasBuku'),
        baseBalance: Number(row[3] || 0),
        transactions: transactions,
        balanceLogs: balanceLogs,
        updatedAt: String(row[6] || ''),
      },
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var rawBody =
      e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var body = JSON.parse(rawBody);
    if (body.action !== 'saveUserData') {
      return jsonResponse_({ ok: false, error: 'Unsupported action' });
    }

    var uid = String(body.uid || '').trim();
    var email = String(body.email || '').trim();
    if (!uid) {
      return jsonResponse_({ ok: false, error: 'uid is required' });
    }

    var data = body.data || {};
    var brandName = String(data.brandName || 'KasBuku').trim().slice(0, 32) || 'KasBuku';
    var baseBalance = Number(data.baseBalance || 0);
    if (!isFinite(baseBalance)) baseBalance = 0;

    var transactionsJson = JSON.stringify(
      Array.isArray(data.transactions) ? data.transactions : []
    );
    var balanceLogsJson = JSON.stringify(
      Array.isArray(data.balanceLogs) ? data.balanceLogs : []
    );
    var updatedAt = new Date().toISOString();

    var sheet = getOrCreateUserSheet_();
    var rowIndex = findUserRowIndex_(sheet, uid, email);
    var rowValues = [
      uid,
      email,
      brandName,
      baseBalance,
      transactionsJson,
      balanceLogsJson,
      updatedAt,
    ];

    if (rowIndex === -1) {
      sheet.appendRow(rowValues);
    } else {
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([rowValues]);
    }

    return jsonResponse_({ ok: true, updatedAt: updatedAt });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
