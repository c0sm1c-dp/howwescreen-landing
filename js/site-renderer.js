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

  // Special handling for section padding
  if (key === 'design.sectionPaddingY') {
    document.documentElement.style.setProperty('--section-padding', value + 'rem 1.5rem');
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
      img.style.height = svg.getAttribute('height') ? svg.getAttribute('height') + 'px' : '36px';
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
