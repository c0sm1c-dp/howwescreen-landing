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

// ---- SECTION STYLES (set by editor-sections.js) ----

function restoreSectionStyles() {
  try {
    var raw = localStorage.getItem('hws-admin-section-styles');
    if (!raw) return;
    var styles = JSON.parse(raw);
    if (!styles || Object.keys(styles).length === 0) return;

    Object.keys(styles).forEach(function(sectionId) {
      var section = document.getElementById(sectionId);
      if (!section) return;
      var s = styles[sectionId];
      if (s.bgColor) section.style.backgroundColor = s.bgColor;
      if (s.textColor) section.style.color = s.textColor;
      if (s.paddingTop) section.style.paddingTop = s.paddingTop + 'rem';
      if (s.paddingBottom) section.style.paddingBottom = s.paddingBottom + 'rem';
      if (s.maxWidth) {
        section.style.maxWidth = s.maxWidth + 'px';
        section.style.marginLeft = 'auto';
        section.style.marginRight = 'auto';
      }
    });
  } catch (e) {}
}

// ---- ELEMENT SIZES (set by editor-resize.js) ----

function restoreElementSizes() {
  try {
    var raw = localStorage.getItem('hws-admin-element-sizes');
    if (!raw) return;
    var sizes = JSON.parse(raw);
    if (!sizes || Object.keys(sizes).length === 0) return;

    Object.keys(sizes).forEach(function(key) {
      var s = sizes[key];
      var el = document.querySelector('[data-hws="' + key + '"]');
      if (!el) return;

      var target = el;
      if (key.indexOf('img.') === 0) {
        var img = el.querySelector('img');
        if (img) target = img;
      }

      if (s.w) {
        target.style.width = s.w + 'px';
        target.style.maxWidth = 'none';
      }
      if (s.h) target.style.height = s.h + 'px';
    });
  } catch (e) {}
}

// ---- CUSTOM BLOCKS (set by editor-add-blocks.js) ----

function restoreCustomBlocks() {
  try {
    var raw = localStorage.getItem('hws-admin-custom-blocks');
    if (!raw) return;
    var blocks = JSON.parse(raw);
    if (!blocks || blocks.length === 0) return;

    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    blocks.forEach(function(block) {
      // Check if already in DOM
      if (document.getElementById(block.id)) return;

      var temp = document.createElement('div');
      temp.innerHTML = block.html;
      var el = temp.firstElementChild;
      if (el) mainEl.appendChild(el);
    });
  } catch (e) {}
}

// ---- PER-ELEMENT STYLES (set by editor-element-styles.js) ----

function restorePerElementStyles() {
  try {
    var raw = localStorage.getItem('hws-admin-element-styles');
    if (!raw) return;
    var styles = JSON.parse(raw);
    if (!styles || Object.keys(styles).length === 0) return;

    Object.keys(styles).forEach(function(key) {
      var el = document.querySelector('[data-hws="' + key + '"]') ||
               document.querySelector('[data-hws-features="' + key + '"]');
      if (!el) return;

      var s = styles[key];
      var target = el;
      if (key.indexOf('img.') === 0) {
        var img = el.querySelector('img');
        if (img) target = img;
      }

      // Apply CSS props
      var propMap = {
        bgColor: 'backgroundColor', textColor: 'color', fontSize: ['fontSize', 'px'],
        fontWeight: 'fontWeight', lineHeight: 'lineHeight', letterSpacing: ['letterSpacing', 'px'],
        textAlign: 'textAlign', paddingTop: ['paddingTop', 'px'], paddingRight: ['paddingRight', 'px'],
        paddingBottom: ['paddingBottom', 'px'], paddingLeft: ['paddingLeft', 'px'],
        marginTop: ['marginTop', 'px'], marginBottom: ['marginBottom', 'px'],
        borderRadius: ['borderRadius', 'px'], borderWidth: ['borderWidth', 'px'],
        borderColor: 'borderColor', borderStyle: 'borderStyle',
        maxWidth: ['maxWidth', 'px'],
        btnBgColor: 'backgroundColor', btnTextColor: 'color',
        btnBorderRadius: ['borderRadius', 'px'],
        imgBorderRadius: ['borderRadius', 'px'], imgObjectFit: 'objectFit'
      };

      Object.keys(s).forEach(function(prop) {
        if (s[prop] === '' || s[prop] === undefined) return;
        var val = s[prop];

        // Special cases
        if (prop === 'opacity' || prop === 'imgOpacity') {
          target.style.opacity = val / 100;
          return;
        }
        if (prop === 'imgShadow' && val) {
          target.style.boxShadow = '0 4px ' + val + 'px rgba(0,0,0,0.15)';
          return;
        }
        if (prop === 'btnPaddingY' && val) {
          target.style.paddingTop = val + 'px';
          target.style.paddingBottom = val + 'px';
          return;
        }
        if (prop === 'btnPaddingX' && val) {
          target.style.paddingLeft = val + 'px';
          target.style.paddingRight = val + 'px';
          return;
        }
        if (prop === 'btnHref' && el.tagName === 'A') {
          el.href = val;
          return;
        }
        if (prop === 'btnNewTab' && val === 'true' && el.tagName === 'A') {
          el.target = '_blank';
          el.rel = 'noopener';
          return;
        }
        if (prop === 'imgAlt' && target.tagName === 'IMG') {
          target.alt = val;
          return;
        }

        var mapping = propMap[prop];
        if (mapping) {
          if (Array.isArray(mapping)) {
            target.style[mapping[0]] = val + mapping[1];
          } else {
            target.style[mapping] = val;
          }
        }
      });
    });
  } catch (e) {}
}
