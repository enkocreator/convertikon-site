/**
 * CONVERTIKON launch sign-ups -> this Google Sheet.
 *
 * Paste into the sheet's Extensions > Apps Script, then Deploy > New deployment >
 * Web app, Execute as: Me, Who has access: Anyone. The page posts email + source here;
 * each new address becomes one row on the "Signups" tab (date, email, where from).
 * Duplicates and bot submissions (the hidden "website" field filled in) are skipped.
 */
const SHEET_NAME = 'Signups';

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return reply('ok');                       // honeypot: a person never fills it
  const email = String(p.email || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply('bad');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(['Date', 'Email', 'Source']);
    const n = sheet.getLastRow() - 1;
    const known = n > 0 ? sheet.getRange(2, 2, n, 1).getValues().flat() : [];
    if (known.indexOf(email) === -1) {
      sheet.appendRow([new Date(), email, String(p.source || '').slice(0, 100)]);
    }
  } finally {
    lock.releaseLock();
  }
  return reply('ok');
}

function reply(text) {
  return ContentService.createTextOutput(text);
}
