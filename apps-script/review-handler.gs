/**
 * review-handler.gs
 * Google Apps Script — receives review form submissions and writes to a Google Sheet.
 *
 * HOW TO DEPLOY:
 *   1. Open your Google Sheet → Extensions → Apps Script
 *   2. Paste this entire file, replacing any existing code
 *   3. Click Deploy → New deployment
 *      - Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Click Deploy → Authorize when prompted → Copy the Web App URL
 *   5. Paste that URL into js/submit-review.js as REVIEW_ENDPOINT
 *
 * SHEET SETUP:
 *   Row 1 should have these headers (copy-paste this row into A1):
 *   Timestamp | First Name | Last Name | Email | Program | Stars | Experience | One Word | Permission | Instagram | Notify
 *
 * TO GET EMAIL ALERTS when a new review comes in:
 *   In Google Sheets → Tools → Notification rules → When → Any changes are made → Email — right away
 */

var SHEET_NAME = 'Reviews'; // change if your sheet tab is named differently

function doPost(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    var params = e.parameter;

    sheet.appendRow([
      params.timestamp   || new Date().toISOString(),
      params.first_name  || '',
      params.last_name   || '',
      params.email       || '',
      params.program     || '',
      params.star_rating || '',
      params.experience  || '',
      params.one_word    || '',
      params.permission  || '',
      params.instagram   || '',
      params.notify      || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// doGet handles browser-based testing — visiting the URL directly shows a confirmation
function doGet() {
  return ContentService
    .createTextOutput('HWS review endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
