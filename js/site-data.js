/**
 * Site Data — Default content, design tokens, and localStorage API
 * Shared by both the live site (via site-renderer.js) and inline editor (via inline-editor.js)
 */

const HWS_STORAGE_KEY = 'hws-admin';

// ---- DEFAULT DATA ----

const HWS_DEFAULTS = {

  // ======================== GLOBAL DESIGN ========================

  'design.colorBg':           '#F5F0E8',
  'design.colorBgSecondary':  '#EDE6D6',
  'design.colorBgTertiary':   '#E2D9C8',
  'design.colorBgAccent':     '#D4C9B4',
  'design.colorBgDark':       '#2C2418',
  'design.colorText':         '#2C2418',
  'design.colorTextSecondary':'#5C4E3C',
  'design.colorTextMuted':    '#8A7D6B',
  'design.colorTextOnDark':   '#F5F0E8',
  'design.colorBrand':        '#6B4C3B',
  'design.colorBrandHover':   '#5A3D2E',
  'design.colorCta':          '#995D81',
  'design.colorCtaHover':     '#824E6D',
  'design.colorAccent1':      '#995D81',
  'design.colorAccent2':      '#6689A1',
  'design.colorAccent3':      '#D8DC6A',
  'design.colorAccent4':      '#EB8258',
  'design.colorAccent5':      '#F6F740',
  'design.colorBorder':       '#D4C9B4',
  'design.colorBorderLight':  '#E8E0D0',
  'design.fontHeadingWeight': '300',
  'design.fontBodyWeight':    '400',
  'design.borderRadiusSm':   '4',
  'design.borderRadiusMd':   '8',
  'design.borderRadiusLg':   '16',
  'design.borderRadiusCard': '8',
  'design.sectionPaddingY':  '5',
  'design.animationDistance': '30',
  'design.transitionSpeed':  '0.4',
  'design.containerMax':     '1200',
  'design.cardPadding':      '1.5',
  'design.gridGap':          '1.5',
  'design.sectionPaddingX':  '1.5',
  'design.cardBorderWidth':  '1',
  'design.logoHeight':       '36',
  'design.footerLogoHeight': '32',
  'design.btnPaddingY':      '0.875',
  'design.btnPaddingX':      '2',
  'design.btnFontSize':      '1',
  'design.textBase':         '1',
  'design.textLg':           '1.125',
  'design.textXl':           '1.375',
  'design.text2xl':          '1.75',
  'design.text3xl':          '2.25',
  'design.text4xl':          '3',
  'design.text5xl':          '3.75',

  // ======================== NAVIGATION ========================

  'nav.logoText':  'How We Screen',
  'nav.ctaText':   'Start the Reset',
  'nav.ctaLink':   '#hero-form',
  'nav.link1Label': 'The Problem',
  'nav.link1Href':  '#problem',
  'nav.link2Label': 'FAQ',
  'nav.link2Href':  '#faq',

  // ======================== HERO ========================

  'hero.label':          'A guided digital detox',
  'hero.headline':       'What if you could look at your phone and feel <em>nothing?</em>',
  'hero.subtext':        'No guilt. No anxiety. Just you, deciding what gets your attention. Three days, three short emails. Each one gives you something small to try that might change how the rest of your day feels.',
  'hero.formNote':       'Free, always. Three emails over three days, then we let go.',

  // ======================== TRANSITIONS ========================

  'transition.1': 'You already know something is off.',
  'transition.2': 'So. Take this.',

  // ======================== PROBLEM ========================

  'problem.label':    'The Problem',
  'problem.heading':  'The Scroll Trap',
  'problem.body1':    'It starts innocently. A quick check. A notification. And then thirty minutes vanish like they were never yours. You unlock your phone 96 times a day. You watch reels you don\u2019t even like. You know it\u2019s not making you feel good, and you do it anyway.',
  'problem.body2':    'Willpower has nothing to do with it. Every app on your phone was built by a team of engineers whose job is keeping you staring at glass for as long as possible. That\u2019s their metric. That\u2019s how they win.',
  'problem.body3':    'Something in you already knows this isn\u2019t working. Maybe you\u2019re ready to try something different.',
  'problem.stat1Number': '7 hrs',
  'problem.stat1Label':  'Average daily screen time for adults',
  'problem.stat2Number': '96x',
  'problem.stat2Label':  'Average daily phone checks',
  'problem.stat3Number': '58%',
  'problem.stat3Label':  'Of adults say social media harms their mental health',

  // ======================== DETOX ========================

  'detox.label':    'Our Gift to You',
  'detox.heading':  'The 3-Day Screen Reset',
  'detox.body':     'We made this for you. Three emails over three days, each one short and each one with something small you can actually try. No rules. No shame. Just a little room to breathe and notice what\u2019s going on with you and your phone.',
  'detox.formNote': 'Free, always. Three emails, then we let go. Unless you want to stay.',

  // ======================== VOICES (TESTIMONIALS) ========================
  // Section is hidden until real reviews are ready — see hiddenSections in hws-overrides.json.
  // To publish: remove "voices" from hiddenSections and fill in real quote data below.

  'voices.label':   'What people say',
  'voices.heading': 'Real people. Real resets.',

  'voices.quote0.body':     '',
  'voices.quote0.username': '',
  'voices.quote0.likes':    '',

  'voices.quote1.body':     '',
  'voices.quote1.username': '',
  'voices.quote1.likes':    '',

  'voices.quote2.body':     '',
  'voices.quote2.username': '',
  'voices.quote2.likes':    '',

  'voices.quote3.body':     '',
  'voices.quote3.username': '',
  'voices.quote3.likes':    '',

  'voices.quote4.body':     '',
  'voices.quote4.username': '',
  'voices.quote4.likes':    '',

  'voices.quote5.body':     '',
  'voices.quote5.username': '',
  'voices.quote5.likes':    '',

  // ======================== FAQ ========================

  'faq.label':   'FAQ',
  'faq.heading': 'Questions you probably have',

  'faq.item0.question': 'What is the 3-Day Screen Reset?',
  'faq.item0.answer':   'A free 3-day guided program to help you reset your relationship with your phone. Three short emails, each with a small practice to help you notice, breathe, and choose differently. No corporate wellness. No shame.',

  'faq.item1.question': 'What happens during the 3 days?',
  'faq.item1.answer':   'Each day you\u2019ll get one email with a simple practice to try. Day 1 is about noticing. Day 2 is about creating some space. Day 3 is about choosing differently. No pressure, just small invitations.',

  'faq.item2.question': 'Is this an app?',
  'faq.item2.answer':   'No. It comes by email. No downloads, no tracking, no app asking for more of your attention. Just three messages to help you notice and shift.',

  'faq.item3.question': 'What happens after the 3 days?',
  'faq.item3.answer':   'The emails stop. That\u2019s it. We\u2019re not going to hound your inbox. That would be pretty ironic for a digital detox. If you want to stay connected after, you can. But we let go first.',

  // ======================== FOOTER ========================

  'footer.tagline':   'Helping you use your phone on your own terms.',
  'footer.copyright': '\u00a9 2026 How We Screen. All rights reserved.',
  'footer.newsletterDesc': 'Three days, three emails, a quieter relationship with your screen.',
  'footer.instagramUrl': 'https://instagram.com/',
  'footer.tiktokUrl':    'https://www.tiktok.com/@howwescreen',

  // ======================== IMAGES ========================

  'img.navLogo':    '',
  'img.footerLogo': '',
};

// ---- DESIGN TOKEN → CSS VARIABLE MAP ----

const HWS_DESIGN_MAP = {
  'design.colorBg':           '--color-bg-primary',
  'design.colorBgSecondary':  '--color-bg-secondary',
  'design.colorBgTertiary':   '--color-bg-tertiary',
  'design.colorBgAccent':     '--color-bg-accent',
  'design.colorBgDark':       '--color-bg-dark',
  'design.colorText':         '--color-text-primary',
  'design.colorTextSecondary':'--color-text-secondary',
  'design.colorTextMuted':    '--color-text-muted',
  'design.colorTextOnDark':   '--color-text-on-dark',
  'design.colorBrand':        '--color-brand',
  'design.colorBrandHover':   '--color-brand-hover',
  'design.colorCta':          '--color-cta-bg',
  'design.colorCtaHover':     '--color-cta-hover-bg',
  'design.colorAccent1':      '--color-accent-1',
  'design.colorAccent2':      '--color-accent-2',
  'design.colorAccent3':      '--color-accent-3',
  'design.colorAccent4':      '--color-accent-4',
  'design.colorAccent5':      '--color-accent-5',
  'design.colorBorder':       '--color-border',
  'design.colorBorderLight':  '--color-border-light',
  // Layout
  'design.containerMax':      '--container-max',
  'design.cardPadding':       '--card-padding',
  'design.gridGap':           '--grid-gap',
  'design.sectionPaddingX':   '--section-padding-x',
  'design.cardBorderWidth':   '--card-border-width',
  // Element Sizing
  'design.logoHeight':        '--logo-height',
  'design.footerLogoHeight':  '--footer-logo-height',
  'design.btnPaddingY':       '--btn-padding-y',
  'design.btnPaddingX':       '--btn-padding-x',
  'design.btnFontSize':       '--btn-font-size',
  // Type Scale
  'design.textBase':          '--text-base',
  'design.textLg':            '--text-lg',
  'design.textXl':            '--text-xl',
  'design.text2xl':           '--text-2xl',
  'design.text3xl':           '--text-3xl',
  'design.text4xl':           '--text-4xl',
  'design.text5xl':           '--text-5xl',
  // Typography
  'design.fontHeadingWeight': '--font-weight-heading',
  'design.fontBodyWeight':    '--font-weight-body',
  'design.borderRadiusSm':   '--border-radius-sm',
  'design.borderRadiusMd':   '--border-radius-md',
  'design.borderRadiusLg':   '--border-radius-lg',
  'design.borderRadiusCard': '--border-radius-card',
  'design.transitionSpeed':  '--transition-speed',
  'design.animationDistance': '--animation-distance',
};

// Units for numeric design tokens
const HWS_DESIGN_UNITS = {
  'design.borderRadiusSm':   'px',
  'design.borderRadiusMd':   'px',
  'design.borderRadiusLg':   'px',
  'design.borderRadiusCard': 'px',
  'design.sectionPaddingY':  'rem',
  'design.animationDistance': 'px',
  'design.transitionSpeed':  's',
  'design.containerMax':     'px',
  'design.cardPadding':      'rem',
  'design.gridGap':          'rem',
  'design.sectionPaddingX':  'rem',
  'design.cardBorderWidth':  'px',
  'design.logoHeight':       'px',
  'design.footerLogoHeight': 'px',
  'design.btnPaddingY':      'rem',
  'design.btnPaddingX':      'rem',
  'design.btnFontSize':      'rem',
  'design.textBase':         'rem',
  'design.textLg':           'rem',
  'design.textXl':           'rem',
  'design.text2xl':          'rem',
  'design.text3xl':          'rem',
  'design.text4xl':          'rem',
  'design.text5xl':          'rem',
};

// ---- LOCALSTORAGE API ----

function hwsGetOverrides() {
  try {
    const stored = localStorage.getItem(HWS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.warn('HWS: Could not read overrides', e);
    return {};
  }
}

function hwsSaveOverrides(overrides) {
  try {
    localStorage.setItem(HWS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('HWS: Could not save overrides', e);
  }
}

function hwsResetOverrides() {
  localStorage.removeItem(HWS_STORAGE_KEY);
}

function hwsGetValue(key) {
  const overrides = hwsGetOverrides();
  return (key in overrides) ? overrides[key] : HWS_DEFAULTS[key];
}
