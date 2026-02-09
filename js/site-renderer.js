/**
 * Site Renderer — Applies admin overrides from localStorage to the live page
 * Reads from HWS_DEFAULTS + localStorage, updates DOM and CSS custom properties
 */

function initSiteRenderer() {
  const overrides = hwsGetOverrides();
  if (!overrides || Object.keys(overrides).length === 0) return;

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;

    if (key.startsWith('design.')) {
      applyDesignToken(key, value);
    } else if (key.startsWith('img.')) {
      applyImageOverride(key, value);
    } else if (key.endsWith('.features')) {
      applyFeaturesOverride(key, value);
    } else {
      applyTextOverride(key, value);
    }
  });
}

// ---- DESIGN TOKENS ----

function applyDesignToken(key, value) {
  const cssVar = HWS_DESIGN_MAP[key];
  if (!cssVar) return;

  const unit = HWS_DESIGN_UNITS[key] || '';

  // Special handling for section padding (combines Y with X)
  if (key === 'design.sectionPaddingY') {
    var xPad = getComputedStyle(document.documentElement).getPropertyValue('--section-padding-x').trim() || '1.5rem';
    document.documentElement.style.setProperty('--section-padding', value + 'rem ' + xPad);
    return;
  }
  if (key === 'design.sectionPaddingX') {
    document.documentElement.style.setProperty(cssVar, value + unit);
    // Also update the compound --section-padding
    var yPad = getComputedStyle(document.documentElement).getPropertyValue('--section-padding').trim().split(' ')[0] || '5rem';
    document.documentElement.style.setProperty('--section-padding', yPad + ' ' + value + 'rem');
    return;
  }

  document.documentElement.style.setProperty(cssVar, value + unit);

  // Keep CTA secondary colors in sync with CTA
  if (key === 'design.colorCta') {
    document.documentElement.style.setProperty('--color-cta-secondary-border', value);
    document.documentElement.style.setProperty('--color-cta-secondary-text', value);
    document.documentElement.style.setProperty('--color-accent-1', value);
  }
}

// ---- TEXT OVERRIDES ----

function applyTextOverride(key, value) {
  const el = document.querySelector('[data-hws="' + key + '"]');
  if (!el) return;

  // Use innerHTML for keys that might contain markup (headlines, body)
  if (key.includes('headline') || key.includes('body') || key.includes('subtext') ||
      key.includes('text') || key.includes('answer') || key.includes('Note') ||
      key.includes('note')) {
    el.innerHTML = value;
  } else {
    el.textContent = value;
  }
}

// ---- IMAGE OVERRIDES ----

function applyImageOverride(key, value) {
  if (!value) return;

  const el = document.querySelector('[data-hws="' + key + '"]');
  if (!el) return;

  const svg = el.querySelector('svg');
  if (svg) {
    svg.style.display = 'none';

    // Check if we already inserted an img
    const existing = el.querySelector('img[data-hws-img]');
    if (existing) {
      existing.src = value;
    } else {
      const img = document.createElement('img');
      img.src = value;
      img.alt = 'Logo';
      img.style.width = 'auto';
      img.setAttribute('data-hws-img', 'true');
      el.insertBefore(img, svg);
    }
  }
}

// ---- FEATURES LIST OVERRIDE ----

function applyFeaturesOverride(key, value) {
  const el = document.querySelector('[data-hws-features="' + key + '"]');
  if (!el) return;

  const features = value.split('\n').filter(f => f.trim());
  el.innerHTML = features.map(f => '<div class="card__feature-item">' + f.trim() + '</div>').join('');
}

// ---- SECTION ORDER & VISIBILITY (set by editor-sections.js) ----

function restoreSectionOrder() {
  try {
    var raw = localStorage.getItem('hws-admin-section-order');
    if (!raw) return;
    var order = JSON.parse(raw);
    if (!order || !order.length) return;

    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    var sections = Array.prototype.slice.call(mainEl.querySelectorAll('.section'));
    var sectionMap = {};
    sections.forEach(function(s) {
      if (!s.id) return;
      var group = [s];
      var next = s.nextElementSibling;
      if (next && next.classList.contains('section-transition')) group.push(next);
      sectionMap[s.id] = group;
    });

    order.forEach(function(id) {
      var group = sectionMap[id];
      if (group) {
        group.forEach(function(el) { mainEl.appendChild(el); });
      }
    });
  } catch (e) {}
}

function restoreHiddenSections() {
  try {
    var raw = localStorage.getItem('hws-admin-hidden-sections');
    if (!raw) return;
    var hidden = JSON.parse(raw);
    if (!hidden || !hidden.length) return;

    hidden.forEach(function(id) {
      var section = document.getElementById(id);
      if (!section) return;
      section.style.display = 'none';
      var next = section.nextElementSibling;
      if (next && next.classList.contains('section-transition')) {
        next.style.display = 'none';
      }
    });
  } catch (e) {}
}
