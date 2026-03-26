/**
 * submit-review.js
 * Handles the actual POST to Google Apps Script once form validation passes.
 * Exposes window.hwsDoFetch which is called by the inline submit handler in review.html.
 *
 * Setup (one time):
 *   1. Create a Google Sheet with columns:
 *      Timestamp | First Name | Last Name | Email | Program | Stars | Experience |
 *      One Word | Permission | Instagram | Notify
 *   2. In the Sheet: Extensions → Apps Script → paste apps-script/review-handler.gs
 *   3. Deploy → New deployment → Web app
 *      Execute as: Me  |  Who has access: Anyone
 *   4. Copy the Web App URL and paste it below as ENDPOINT.
 */

// ── REPLACE THIS with your deployed Apps Script Web App URL ──────────────
var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzHQS3_0NZE5vht4_xAH9n2pZ77yUNPdN4pqpfZCajyKgI_w6ovdAgOHqP5F4A79LXrcQ/exec';
// ─────────────────────────────────────────────────────────────────────────

window.hwsDoFetch = function (formData, onSuccess, onError) {
  var btn = document.getElementById('btn-submit');
  btn.disabled    = true;
  btn.textContent = 'Sending...';

  // Dev / unconfigured fallback
  if (!ENDPOINT || ENDPOINT === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    console.log('[HWS] Review submission (endpoint not configured):', formData);
    onSuccess();
    return;
  }

  // Apps Script requires form-encoded data for unauthenticated Web App access
  var body = Object.keys(formData)
    .map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(
        formData[k] === null || formData[k] === undefined ? '' : formData[k]
      );
    })
    .join('&');

  fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body
  })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (data && data.ok) {
        onSuccess();
      } else {
        throw new Error(data && data.error ? data.error : 'Unknown error');
      }
    })
    .catch(function (err) {
      console.error('[HWS] Submission failed:', err);
      onError();
    });
};
