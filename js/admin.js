/**
 * Admin Panel — Logic for editing site content, design tokens, and images
 * Auto-saves to localStorage, renders form fields from HWS_DEFAULTS
 */

let currentSection = 'design';
let overrides = {};
let saveTimeout = null;

// ---- SECTION DEFINITIONS ----

const ADMIN_SECTIONS = {
  design: {
    title: 'Global Design',
    desc: 'Colors, typography, spacing, and visual style',
    fields: [
      { type: 'heading', label: 'Background Colors' },
      { key: 'design.colorBg', label: 'Primary Background', type: 'color' },
      { key: 'design.colorBgSecondary', label: 'Secondary Background', type: 'color' },
      { key: 'design.colorBgTertiary', label: 'Tertiary Background', type: 'color' },
      { key: 'design.colorBgDark', label: 'Dark Background', type: 'color' },
      { type: 'heading', label: 'Text Colors' },
      { key: 'design.colorText', label: 'Primary Text', type: 'color' },
      { key: 'design.colorTextSecondary', label: 'Secondary Text', type: 'color' },
      { key: 'design.colorTextMuted', label: 'Muted Text', type: 'color' },
      { key: 'design.colorTextOnDark', label: 'Text on Dark', type: 'color' },
      { type: 'heading', label: 'Brand & Accent Colors' },
      { key: 'design.colorBrand', label: 'Brand', type: 'color' },
      { key: 'design.colorCta', label: 'CTA / Primary Accent', type: 'color' },
      { key: 'design.colorCtaHover', label: 'CTA Hover', type: 'color' },
      { key: 'design.colorAccent1', label: 'Accent 1 (Mauve)', type: 'color' },
      { key: 'design.colorAccent2', label: 'Accent 2 (Steel Blue)', type: 'color' },
      { key: 'design.colorAccent3', label: 'Accent 3 (Lime)', type: 'color' },
      { key: 'design.colorAccent4', label: 'Accent 4 (Orange)', type: 'color' },
      { key: 'design.colorAccent5', label: 'Accent 5 (Yellow)', type: 'color' },
      { type: 'heading', label: 'Borders' },
      { key: 'design.colorBorder', label: 'Border', type: 'color' },
      { key: 'design.colorBorderLight', label: 'Light Border', type: 'color' },
      { type: 'heading', label: 'Shape & Motion' },
      { key: 'design.borderRadiusSm', label: 'Border Radius Small', type: 'range', min: 0, max: 24, unit: 'px' },
      { key: 'design.borderRadiusMd', label: 'Border Radius Medium', type: 'range', min: 0, max: 32, unit: 'px' },
      { key: 'design.borderRadiusLg', label: 'Border Radius Large', type: 'range', min: 0, max: 48, unit: 'px' },
      { key: 'design.borderRadiusCard', label: 'Card Border Radius', type: 'range', min: 0, max: 32, unit: 'px' },
      { key: 'design.sectionPaddingY', label: 'Section Padding', type: 'range', min: 2, max: 10, unit: 'rem', step: 0.5 },
      { key: 'design.animationDistance', label: 'Animation Distance', type: 'range', min: 0, max: 80, unit: 'px' },
      { key: 'design.transitionSpeed', label: 'Transition Speed', type: 'range', min: 0.1, max: 1.0, unit: 's', step: 0.05 },
      { type: 'heading', label: 'Typography' },
      { key: 'design.fontHeadingWeight', label: 'Heading Weight', type: 'range', min: 100, max: 900, unit: '', step: 100 },
      { key: 'design.fontBodyWeight', label: 'Body Weight', type: 'range', min: 300, max: 700, unit: '', step: 100 },
    ]
  },
  nav: {
    title: 'Navigation',
    desc: 'Logo, nav links, and CTA button',
    fields: [
      { key: 'img.navLogo', label: 'Logo Image', type: 'image', desc: 'Upload to replace the SVG logo' },
      { key: 'nav.logoText', label: 'Logo Text', type: 'text' },
      { key: 'nav.ctaText', label: 'CTA Button Text', type: 'text' },
      { key: 'nav.ctaLink', label: 'CTA Button Link', type: 'text' },
      { type: 'heading', label: 'Navigation Links' },
      { key: 'nav.link1Label', label: 'Link 1', type: 'text' },
      { key: 'nav.link2Label', label: 'Link 2', type: 'text' },
      { key: 'nav.link3Label', label: 'Link 3', type: 'text' },
      { key: 'nav.link4Label', label: 'Link 4', type: 'text' },
      { key: 'nav.link5Label', label: 'Link 5', type: 'text' },
    ]
  },
  hero: {
    title: 'Hero Section',
    desc: 'Main headline, subtext, and call-to-action',
    fields: [
      { key: 'hero.label', label: 'Section Label', type: 'text' },
      { key: 'hero.headline', label: 'Headline', type: 'textarea', desc: 'Supports HTML (e.g. <em>italic</em>)' },
      { key: 'hero.subtext', label: 'Subtext', type: 'textarea' },
      { key: 'hero.ctaPrimary', label: 'Primary CTA Text', type: 'text' },
      { key: 'hero.ctaPrimaryLink', label: 'Primary CTA Link', type: 'text' },
      { key: 'hero.ctaSecondary', label: 'Secondary CTA Text', type: 'text' },
      { key: 'hero.ctaSecondaryLink', label: 'Secondary CTA Link', type: 'text' },
      { key: 'hero.newsletterNote', label: 'Newsletter Note', type: 'text' },
    ]
  },
  transitions: {
    title: 'Transition Lines',
    desc: 'Short phrases between sections',
    fields: [
      { key: 'transition.1', label: 'After Hero', type: 'text' },
      { key: 'transition.2', label: 'After Problem', type: 'text' },
      { key: 'transition.3', label: 'After Voices', type: 'text' },
      { key: 'transition.4', label: 'After Solution', type: 'text' },
      { key: 'transition.5', label: 'After Detox', type: 'text' },
      { key: 'transition.6', label: 'After Steps', type: 'text' },
    ]
  },
  problem: {
    title: 'Problem Section',
    desc: 'The Scroll Trap — stats and body copy',
    fields: [
      { key: 'problem.label', label: 'Section Label', type: 'text' },
      { key: 'problem.heading', label: 'Heading', type: 'text' },
      { key: 'problem.body1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'problem.body2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'problem.body3', label: 'Paragraph 3', type: 'textarea' },
      { type: 'heading', label: 'Statistics' },
      { key: 'problem.stat1Number', label: 'Stat 1 Number', type: 'text' },
      { key: 'problem.stat1Label', label: 'Stat 1 Label', type: 'text' },
      { key: 'problem.stat2Number', label: 'Stat 2 Number', type: 'text' },
      { key: 'problem.stat2Label', label: 'Stat 2 Label', type: 'text' },
      { key: 'problem.stat3Number', label: 'Stat 3 Number', type: 'text' },
      { key: 'problem.stat3Label', label: 'Stat 3 Label', type: 'text' },
    ]
  },
  voices: {
    title: 'Voices Section',
    desc: 'Quote cards from the internet',
    fields: buildQuoteFields()
  },
  solution: {
    title: 'Solution Section',
    desc: 'What We Do — feature cards',
    fields: [
      { key: 'solution.label', label: 'Section Label', type: 'text' },
      { key: 'solution.heading', label: 'Heading', type: 'text' },
      { key: 'solution.subtext', label: 'Subtext', type: 'textarea' },
      { type: 'heading', label: 'Card 1' },
      { key: 'solution.card0.title', label: 'Title', type: 'text' },
      { key: 'solution.card0.text', label: 'Description', type: 'textarea' },
      { type: 'heading', label: 'Card 2' },
      { key: 'solution.card1.title', label: 'Title', type: 'text' },
      { key: 'solution.card1.text', label: 'Description', type: 'textarea' },
      { type: 'heading', label: 'Card 3' },
      { key: 'solution.card2.title', label: 'Title', type: 'text' },
      { key: 'solution.card2.text', label: 'Description', type: 'textarea' },
    ]
  },
  detox: {
    title: 'Detox Section',
    desc: 'Free 3-Day Reset signup',
    fields: [
      { key: 'detox.label', label: 'Section Label', type: 'text' },
      { key: 'detox.heading', label: 'Heading', type: 'text' },
      { key: 'detox.subtext', label: 'Subtext', type: 'textarea' },
      { type: 'heading', label: 'Day 1' },
      { key: 'detox.day1Title', label: 'Title', type: 'text' },
      { key: 'detox.day1Text', label: 'Description', type: 'text' },
      { type: 'heading', label: 'Day 2' },
      { key: 'detox.day2Title', label: 'Title', type: 'text' },
      { key: 'detox.day2Text', label: 'Description', type: 'text' },
      { type: 'heading', label: 'Day 3' },
      { key: 'detox.day3Title', label: 'Title', type: 'text' },
      { key: 'detox.day3Text', label: 'Description', type: 'text' },
      { type: 'heading', label: 'Form' },
      { key: 'detox.formTitle', label: 'Form Title', type: 'text' },
      { key: 'detox.formSubtitle', label: 'Form Subtitle', type: 'text' },
      { key: 'detox.formButton', label: 'Submit Button Text', type: 'text' },
      { key: 'detox.formNote', label: 'Form Note', type: 'text' },
      { key: 'detox.formSuccessMsg', label: 'Success Message', type: 'text' },
      { key: 'detox.formErrorMsg', label: 'Error Message', type: 'text' },
    ]
  },
  steps: {
    title: 'How It Works',
    desc: 'Four-step process',
    fields: [
      { key: 'steps.label', label: 'Section Label', type: 'text' },
      { key: 'steps.heading', label: 'Heading', type: 'text' },
      { type: 'heading', label: 'Step 1' },
      { key: 'steps.step0.title', label: 'Title', type: 'text' },
      { key: 'steps.step0.text', label: 'Description', type: 'textarea' },
      { type: 'heading', label: 'Step 2' },
      { key: 'steps.step1.title', label: 'Title', type: 'text' },
      { key: 'steps.step1.text', label: 'Description', type: 'textarea' },
      { type: 'heading', label: 'Step 3' },
      { key: 'steps.step2.title', label: 'Title', type: 'text' },
      { key: 'steps.step2.text', label: 'Description', type: 'textarea' },
      { type: 'heading', label: 'Step 4' },
      { key: 'steps.step3.title', label: 'Title', type: 'text' },
      { key: 'steps.step3.text', label: 'Description', type: 'textarea' },
    ]
  },
  pricing: {
    title: 'Pricing Section',
    desc: 'Program tiers and pricing',
    fields: [
      { key: 'pricing.label', label: 'Section Label', type: 'text' },
      { key: 'pricing.heading', label: 'Heading', type: 'text' },
      { key: 'pricing.subtext', label: 'Subtext', type: 'textarea' },
      { type: 'heading', label: 'Tier 1 — Free' },
      { key: 'pricing.tier0.name', label: 'Plan Name', type: 'text' },
      { key: 'pricing.tier0.price', label: 'Price', type: 'text' },
      { key: 'pricing.tier0.priceNote', label: 'Price Note', type: 'text' },
      { key: 'pricing.tier0.features', label: 'Features (one per line)', type: 'textarea' },
      { key: 'pricing.tier0.ctaText', label: 'CTA Button Text', type: 'text' },
      { type: 'heading', label: 'Tier 2 — Popular' },
      { key: 'pricing.tier1.badge', label: 'Badge Text', type: 'text' },
      { key: 'pricing.tier1.name', label: 'Plan Name', type: 'text' },
      { key: 'pricing.tier1.price', label: 'Price', type: 'text' },
      { key: 'pricing.tier1.priceNote', label: 'Price Note', type: 'text' },
      { key: 'pricing.tier1.features', label: 'Features (one per line)', type: 'textarea' },
      { key: 'pricing.tier1.ctaText', label: 'CTA Button Text', type: 'text' },
      { type: 'heading', label: 'Tier 3 — Premium' },
      { key: 'pricing.tier2.badge', label: 'Badge Text', type: 'text' },
      { key: 'pricing.tier2.name', label: 'Plan Name', type: 'text' },
      { key: 'pricing.tier2.price', label: 'Price', type: 'text' },
      { key: 'pricing.tier2.priceNote', label: 'Price Note', type: 'text' },
      { key: 'pricing.tier2.features', label: 'Features (one per line)', type: 'textarea' },
      { key: 'pricing.tier2.ctaText', label: 'CTA Button Text', type: 'text' },
    ]
  },
  faq: {
    title: 'FAQ Section',
    desc: 'Questions and answers',
    fields: buildFaqFields()
  },
  footer: {
    title: 'Footer',
    desc: 'Tagline, copyright, and social links',
    fields: [
      { key: 'img.footerLogo', label: 'Footer Logo Image', type: 'image' },
      { key: 'footer.tagline', label: 'Tagline', type: 'textarea' },
      { key: 'footer.copyright', label: 'Copyright', type: 'text' },
      { key: 'footer.newsletterDesc', label: 'Newsletter Description', type: 'text' },
      { key: 'footer.instagramUrl', label: 'Instagram URL', type: 'text' },
    ]
  },
  export: {
    title: 'Export & Reset',
    desc: 'Download your customized site or reset to defaults',
    fields: [
      { type: 'export' }
    ]
  }
};

// ---- FIELD BUILDERS ----

function buildQuoteFields() {
  const fields = [
    { key: 'voices.label', label: 'Section Label', type: 'text' },
    { key: 'voices.heading', label: 'Heading', type: 'textarea' },
  ];
  for (let i = 0; i < 10; i++) {
    fields.push({ type: 'heading', label: 'Quote ' + (i + 1) });
    fields.push({ key: 'voices.quote' + i + '.avatar', label: 'Avatar Letter', type: 'text' });
    fields.push({ key: 'voices.quote' + i + '.username', label: 'Username', type: 'text' });
    fields.push({ key: 'voices.quote' + i + '.body', label: 'Quote Text', type: 'textarea' });
    fields.push({ key: 'voices.quote' + i + '.likes', label: 'Likes', type: 'text' });
  }
  return fields;
}

function buildFaqFields() {
  const fields = [
    { key: 'faq.label', label: 'Section Label', type: 'text' },
    { key: 'faq.heading', label: 'Heading', type: 'text' },
  ];
  for (let i = 0; i < 7; i++) {
    fields.push({ type: 'heading', label: 'FAQ ' + (i + 1) });
    fields.push({ key: 'faq.item' + i + '.question', label: 'Question', type: 'text' });
    fields.push({ key: 'faq.item' + i + '.answer', label: 'Answer', type: 'textarea' });
  }
  return fields;
}

// ---- INIT ----

function initAdmin() {
  overrides = hwsGetOverrides();
  renderNav();
  navigateTo('design');
}

// ---- NAVIGATION ----

function renderNav() {
  const nav = document.getElementById('admin-nav');
  if (!nav) return;

  const sections = [
    { type: 'label', text: 'Design' },
    { id: 'design', icon: '🎨', label: 'Global Design' },
    { type: 'label', text: 'Content' },
    { id: 'nav', icon: '🧭', label: 'Navigation' },
    { id: 'hero', icon: '⭐', label: 'Hero' },
    { id: 'transitions', icon: '↔', label: 'Transitions' },
    { id: 'problem', icon: '📊', label: 'Problem' },
    { id: 'voices', icon: '💬', label: 'Voices' },
    { id: 'solution', icon: '💡', label: 'Solution' },
    { id: 'detox', icon: '🌱', label: 'Detox' },
    { id: 'steps', icon: '📋', label: 'How It Works' },
    { id: 'pricing', icon: '💰', label: 'Pricing' },
    { id: 'faq', icon: '❓', label: 'FAQ' },
    { id: 'footer', icon: '📄', label: 'Footer' },
    { type: 'label', text: 'Actions' },
    { id: 'export', icon: '📦', label: 'Export & Reset' },
  ];

  nav.innerHTML = sections.map(s => {
    if (s.type === 'label') {
      return '<div class="admin__nav-label">' + s.text + '</div>';
    }
    return '<button class="admin__nav-item" data-section="' + s.id + '" onclick="navigateTo(\'' + s.id + '\')">' +
      '<span>' + s.icon + '</span> ' + s.label +
    '</button>';
  }).join('');
}

function navigateTo(sectionId) {
  currentSection = sectionId;

  // Update active nav
  document.querySelectorAll('.admin__nav-item').forEach(el => {
    el.classList.toggle('admin__nav-item--active', el.dataset.section === sectionId);
  });

  // Render section
  const section = ADMIN_SECTIONS[sectionId];
  if (!section) return;

  const main = document.getElementById('admin-main');
  main.innerHTML = '<h2 class="admin__section-title">' + section.title + '</h2>' +
    '<p class="admin__section-desc">' + section.desc + '</p>' +
    renderFields(section.fields);

  // Scroll to top
  main.scrollTop = 0;
}

// ---- FIELD RENDERING ----

function renderFields(fields) {
  return fields.map(field => {
    if (field.type === 'heading') {
      return '<hr class="admin__divider"><h3 style="font-size:14px;font-weight:600;margin-bottom:16px;">' + field.label + '</h3>';
    }
    if (field.type === 'export') {
      return renderExportSection();
    }
    return renderField(field);
  }).join('');
}

function renderField(field) {
  const value = getValue(field.key);
  const desc = field.desc ? '<span class="admin__sublabel">' + field.desc + '</span>' : '';

  switch (field.type) {
    case 'text':
      return '<div class="admin__group">' +
        '<label class="admin__label">' + field.label + desc + '</label>' +
        '<input class="admin__input" type="text" data-key="' + field.key + '" value="' + escAttr(value) + '" oninput="onFieldChange(this)">' +
      '</div>';

    case 'textarea':
      return '<div class="admin__group">' +
        '<label class="admin__label">' + field.label + desc + '</label>' +
        '<textarea class="admin__input" data-key="' + field.key + '" oninput="onFieldChange(this)">' + escHtml(value) + '</textarea>' +
      '</div>';

    case 'color':
      return '<div class="admin__group">' +
        '<label class="admin__label">' + field.label + '</label>' +
        '<div class="admin__color-row">' +
          '<input type="color" class="admin__color-picker" data-key="' + field.key + '" value="' + value + '" oninput="onColorChange(this)">' +
          '<input type="text" class="admin__input admin__color-hex" data-key="' + field.key + '" value="' + value + '" oninput="onHexChange(this)" maxlength="7">' +
        '</div>' +
      '</div>';

    case 'range':
      const step = field.step || 1;
      const unit = field.unit || '';
      return '<div class="admin__group">' +
        '<label class="admin__label">' + field.label + '</label>' +
        '<div class="admin__range-row">' +
          '<input type="range" class="admin__range" data-key="' + field.key + '" value="' + value + '" min="' + field.min + '" max="' + field.max + '" step="' + step + '" oninput="onRangeChange(this, \'' + unit + '\')">' +
          '<span class="admin__range-value">' + value + unit + '</span>' +
        '</div>' +
      '</div>';

    case 'image':
      const hasImage = value && value.length > 0;
      const previewInner = hasImage
        ? '<img src="' + value + '" alt="Preview">'
        : '<span class="admin__upload-preview--empty">+</span>';
      return '<div class="admin__group">' +
        '<label class="admin__label">' + field.label + (field.desc ? ' <span class="admin__sublabel">' + field.desc + '</span>' : '') + '</label>' +
        '<div class="admin__upload">' +
          '<div class="admin__upload-preview" id="preview-' + field.key + '">' + previewInner + '</div>' +
          '<div class="admin__upload-actions">' +
            '<button class="admin__btn" onclick="pickImage(\'' + field.key + '\')">Choose Image</button>' +
            (hasImage ? '<button class="admin__btn admin__btn--sm admin__btn--danger" onclick="clearImage(\'' + field.key + '\')">Remove</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    default:
      return '';
  }
}

function renderExportSection() {
  const count = Object.keys(overrides).length;
  return '<div class="admin__group">' +
    '<p style="margin-bottom:16px;color:var(--admin-text-muted);">' +
      'You have <strong>' + count + '</strong> custom override' + (count !== 1 ? 's' : '') + ' saved.' +
    '</p>' +
    '<div class="admin__export-actions">' +
      '<button class="admin__btn admin__btn--primary" onclick="exportHTML()">Download Customized HTML</button>' +
      '<button class="admin__btn" onclick="exportOverrides()">Export Overrides JSON</button>' +
      '<button class="admin__btn" onclick="importOverrides()">Import Overrides JSON</button>' +
    '</div>' +
    '<hr class="admin__divider">' +
    '<h3 style="font-size:14px;font-weight:600;margin-bottom:12px;color:#e07a5f;">Danger Zone</h3>' +
    '<p style="margin-bottom:12px;color:var(--admin-text-muted);font-size:13px;">Reset all changes and restore the site to its original default content.</p>' +
    '<button class="admin__btn admin__btn--danger" onclick="resetAll()">Reset Everything</button>' +
  '</div>';
}

// ---- EVENT HANDLERS ----

function onFieldChange(el) {
  const key = el.dataset.key;
  const value = el.value;
  setOverride(key, value);
}

function onColorChange(el) {
  const key = el.dataset.key;
  const hex = el.value;
  // Sync the text input
  const textInput = el.parentElement.querySelector('.admin__color-hex');
  if (textInput) textInput.value = hex;
  setOverride(key, hex);
}

function onHexChange(el) {
  const key = el.dataset.key;
  let hex = el.value;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const picker = el.parentElement.querySelector('.admin__color-picker');
    if (picker) picker.value = hex;
    setOverride(key, hex);
  }
}

function onRangeChange(el, unit) {
  const key = el.dataset.key;
  const value = el.value;
  const display = el.parentElement.querySelector('.admin__range-value');
  if (display) display.textContent = value + unit;
  setOverride(key, value);
}

// ---- SAVE ----

function setOverride(key, value) {
  // If value matches default, remove override
  if (value === HWS_DEFAULTS[key]) {
    delete overrides[key];
  } else {
    overrides[key] = value;
  }

  // Debounced save
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    hwsSaveOverrides(overrides);
    showToast('Saved');
  }, 300);
}

function getValue(key) {
  return (key in overrides) ? overrides[key] : (HWS_DEFAULTS[key] || '');
}

// ---- IMAGE UPLOAD ----

function pickImage(key) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.svg';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      overrides[key] = dataUrl;
      hwsSaveOverrides(overrides);
      showToast('Image uploaded');
      // Re-render to show preview
      navigateTo(currentSection);
    };
    reader.readAsDataURL(file);
  });
  input.click();
}

function clearImage(key) {
  overrides[key] = '';
  hwsSaveOverrides(overrides);
  showToast('Image removed');
  navigateTo(currentSection);
}

// ---- EXPORT ----

function exportHTML() {
  showToast('Generating HTML...');

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = 'index.html';
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      const doc = iframe.contentDocument;
      const clone = doc.documentElement.cloneNode(true);

      // Remove admin/renderer script references
      clone.querySelectorAll('script[src*="site-data"], script[src*="site-renderer"]').forEach(el => el.remove());

      // Remove data-hws attributes (content is already baked in)
      clone.querySelectorAll('[data-hws]').forEach(el => el.removeAttribute('data-hws'));
      clone.querySelectorAll('[data-hws-features]').forEach(el => el.removeAttribute('data-hws-features'));
      clone.querySelectorAll('[data-hws-img]').forEach(el => el.removeAttribute('data-hws-img'));

      // Bake CSS variables into inline style on :root if we have design overrides
      const designOverrides = {};
      Object.entries(overrides).forEach(([key, value]) => {
        if (key.startsWith('design.') && HWS_DESIGN_MAP[key]) {
          const cssVar = HWS_DESIGN_MAP[key];
          const unit = HWS_DESIGN_UNITS[key] || '';
          if (key === 'design.sectionPaddingY') {
            designOverrides['--section-padding'] = value + 'rem 1.5rem';
          } else {
            designOverrides[cssVar] = value + unit;
          }
        }
      });

      if (Object.keys(designOverrides).length > 0) {
        const styleStr = Object.entries(designOverrides).map(([k, v]) => k + ': ' + v).join('; ');
        const existingStyle = clone.getAttribute('style') || '';
        clone.setAttribute('style', (existingStyle ? existingStyle + '; ' : '') + styleStr);
      }

      // Remove js-loaded class (will be added by JS at runtime)
      clone.classList.remove('js-loaded');

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;

      // Download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      a.click();
      URL.revokeObjectURL(url);

      showToast('HTML downloaded!');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Export failed — see console');
    }

    document.body.removeChild(iframe);
  };
}

function exportOverrides() {
  const json = JSON.stringify(overrides, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hws-overrides.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Overrides exported');
}

function importOverrides() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        overrides = imported;
        hwsSaveOverrides(overrides);
        showToast('Overrides imported');
        navigateTo(currentSection);
      } catch (err) {
        showToast('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function resetAll() {
  if (!confirm('Reset all changes? This will restore every field to its default value.')) return;
  hwsResetOverrides();
  overrides = {};
  showToast('All changes reset');
  navigateTo(currentSection);
}

// ---- TOAST ----

function showToast(message) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin__toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('admin__toast--visible');
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove('admin__toast--visible');
  }, 2000);
}

// ---- UTILITIES ----

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', initAdmin);
