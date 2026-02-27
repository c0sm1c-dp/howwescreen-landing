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
  'nav.ctaText':   'Subscribe',
  'nav.ctaLink':   '#hero-form',
  'nav.link1Label': 'The Problem',
  'nav.link1Href':  '#problem',
  'nav.link2Label': 'FAQ',
  'nav.link2Href':  '#faq',

  // ======================== HERO ========================

  'hero.label':          'A guided digital detox',
  'hero.headline':       'What if you could look at your phone and feel <em>nothing?</em>',
  'hero.subtext':        'No guilt. No anxiety. Just you, deciding what deserves your attention. How We Screen is a newsletter about screen culture, digital consciousness, and building a more intentional relationship with technology \u2014 free from algorithmic reach.',
  'hero.formNote':       'Free. No spam. No algorithm. Just ideas, delivered to your inbox.',

  // ======================== TRANSITIONS ========================

  'transition.1': 'You already know something is off.',
  'transition.2': 'So here \u2014 take this.',

  // ======================== PROBLEM ========================

  'problem.label':    'The Problem',
  'problem.heading':  'The Scroll Trap',
  'problem.body1':    'It starts innocently. A quick check. A notification. And then thirty minutes vanish like they were never yours. You unlock your phone 96 times a day. You watch reels you don\u2019t even like. You know it\u2019s not making you feel good, and you do it anyway.',
  'problem.body2':    'This isn\u2019t a willpower failure. It\u2019s a design feature. Every app on your phone was built by a team of engineers whose success is measured by how long they keep you staring at glass.',
  'problem.body3':    'You\u2019re not the problem. But you might be ready for a different relationship with your screen.',
  'problem.stat1Number': '7 hrs',
  'problem.stat1Label':  'Average daily screen time for adults',
  'problem.stat2Number': '96x',
  'problem.stat2Label':  'Average daily phone checks',
  'problem.stat3Number': '58%',
  'problem.stat3Label':  'Of adults say social media harms their mental health',

  // ======================== DETOX ========================

  'detox.label':    'Our Gift to You',
  'detox.heading':  'The 3-Day Screen Reset',
  'detox.body':     'We made this for you. Three gentle emails over three days \u2014 each one a small invitation to notice, breathe, and choose differently. No rules. No shame. Just us, walking beside you through the noise, helping you find the quiet that was always yours.',
  'detox.formNote': 'Free, always. Three emails, then we let go. Unless you want to stay.',

  // ======================== FAQ ========================

  'faq.label':   'FAQ',
  'faq.heading': 'Questions you probably have',

  'faq.item0.question': 'What is How We Screen?',
  'faq.item0.answer':   'A newsletter about screen culture, digital consciousness, and building a more intentional relationship with technology. No corporate wellness. No shame. Just honest ideas delivered to your inbox.',

  'faq.item1.question': 'How often do you send emails?',
  'faq.item1.answer':   'Once a week. We respect your inbox the way we want you to respect your screen time. No daily blasts, no engagement bait \u2014 just one letter worth reading.',

  'faq.item2.question': 'Is this a product or an app?',
  'faq.item2.answer':   'Not yet. Right now How We Screen is ideas and community. We\u2019re building something bigger \u2014 guided programs, tools, conversations \u2014 but it starts here, with the newsletter. More is coming.',

  'faq.item3.question': 'Can I unsubscribe?',
  'faq.item3.answer':   'Always. One click, no guilt. We\u2019re not going to guilt-trip you into staying \u2014 that would be deeply ironic for a newsletter about intentional screen use.',

  // ======================== FOOTER ========================

  'footer.tagline':   'Building intentional relationships with technology. One screen at a time.',
  'footer.copyright': '\u00a9 2026 How We Screen. All rights reserved.',
  'footer.newsletterDesc': 'Screen culture, digital wellness, and taking your life back from the algorithm.',
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
