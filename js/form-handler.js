/**
 * Form Handler — ConvertKit (Kit) form submission with UX states
 * Posts to Kit's JSON API for reliable cross-origin submission
 */

function initFormHandlers() {
  setupForm('detox-form', 'detox-form-success', 'detox-form-error');
  setupForm('footer-form', 'footer-form-success', null);
  setupForm('waitlist-7day-form', 'waitlist-7day-form-success', null);
  setupForm('waitlist-14day-form', 'waitlist-14day-form-success', null);
  setupForm('waitlist-30day-form', 'waitlist-30day-form-success', null);
}

function setupForm(formId, successId, errorId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const successEl = document.getElementById(successId);
  const errorEl = errorId ? document.getElementById(errorId) : null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Validate email
    const emailInput = form.querySelector('input[type="email"]');
    if (!emailInput || !emailInput.value || !isValidEmail(emailInput.value)) {
      emailInput?.classList.add('input--error');
      emailInput?.focus();
      setTimeout(() => emailInput?.classList.remove('input--error'), 2000);
      return;
    }

    // Loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Timeout controller
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Build JSON payload for Kit's API
      const payload = {
        email_address: emailInput.value,
      };

      // Include first name if present (detox form)
      const nameInput = form.querySelector('input[name="fields[first_name]"]');
      if (nameInput && nameInput.value) {
        payload.first_name = nameInput.value;
      }

      const response = await fetch(form.action, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok || response.status === 200 || response.status === 302) {
        form.hidden = true;
        if (successEl) successEl.hidden = false;
        if (errorEl) errorEl.hidden = true;
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      clearTimeout(timeout);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      if (errorEl) {
        errorEl.hidden = false;
        setTimeout(() => { errorEl.hidden = true; }, 5000);
      }
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
