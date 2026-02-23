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
  'nav.ctaText':   'Start Your Detox',
  'nav.ctaLink':   '#detox',
  'nav.link1Label': 'The Problem',
  'nav.link1Href':  '#problem',
  'nav.link2Label': 'What We Do',
  'nav.link2Href':  '#solution',
  'nav.link3Label': 'Free Detox',
  'nav.link3Href':  '#detox',
  'nav.link4Label': 'FAQ',
  'nav.link4Href':  '#faq',

  // ======================== HERO ========================

  'hero.label':          'A guided digital detox',
  'hero.headline':       'What if you could look at your phone and feel <em>nothing?</em>',
  'hero.subtext':        'No guilt. No anxiety. Just you, deciding what deserves your attention. How We Screen is a guided program helping Gen Z and millennials build intentional relationships with technology.',
  'hero.ctaPrimary':     'Start the Free 3-Day Reset',
  'hero.ctaPrimaryLink': '#detox',
  'hero.ctaSecondary':   'Learn more',
  'hero.ctaSecondaryLink': '#problem',
  'hero.newsletterNote': 'Or just get our weekly letter on screen culture \u2014 no commitment.',

  // ======================== TRANSITIONS ========================

  'transition.1': 'You already know something is off. Let\u2019s name it.',
  'transition.3': 'So what do we do about it?',
  'transition.4': 'Start here. It\u2019s free.',
  'transition.5': 'Here\u2019s exactly what happens.',

  // ======================== PROBLEM ========================

  'problem.label':    'The Problem',
  'problem.heading':  'The Scroll Trap',
  'problem.body1':    'It starts innocently. A quick check. A notification. And then thirty minutes vanish like they were never yours. You unlock your phone 150 times a day. You watch reels you don\u2019t even like. You know it\u2019s not making you feel good, and you do it anyway.',
  'problem.body2':    'This isn\u2019t a willpower failure. It\u2019s a design feature. Every app on your phone was built by a team of engineers whose success is measured by how long they keep you staring at glass.',
  'problem.body3':    'You\u2019re not the problem. But you might be ready for a different relationship with your screen.',
  'problem.stat1Number': '4.5 hrs',
  'problem.stat1Label':  'Average daily screen time for 18\u201329 year olds',
  'problem.stat2Number': '150x',
  'problem.stat2Label':  'Average daily phone unlocks',
  'problem.stat3Number': '57%',
  'problem.stat3Label':  'Of Gen Z say social media harms their mental health',

  // ======================== SOLUTION ========================

  'solution.label':   'What We Do',
  'solution.heading': 'Not another digital detox app.',
  'solution.subtext': 'We\u2019re a community, a content studio, and a set of guided programs. Think of us as your intentional-screen-time friend who doesn\u2019t judge you for still loving memes.',

  'solution.card0.title': 'Guided Detox Programs',
  'solution.card0.text':  'Structured multi-day programs that actually work because they don\u2019t ask you to throw your phone in a lake. Start with our free 3-day reset.',

  'solution.card1.title': 'The Community',
  'solution.card1.text':  'A private space for people who want to talk honestly about their relationship with technology. No toxic positivity. No shame. Just real conversations.',

  'solution.card2.title': 'Weekly Content',
  'solution.card2.text':  'A newsletter, essays, and curated links about screen culture, digital wellness (without the cringe), and how to reclaim your attention.',

  // ======================== DETOX ========================

  'detox.label':       'Free Program',
  'detox.heading':     'The 3-Day Reset',
  'detox.subtext':     'A free, guided micro-detox delivered to your inbox. No app required. No cold turkey. Just three days of small, intentional shifts.',

  'detox.day1Title':   'Notice',
  'detox.day1Text':    'Become aware of your patterns without changing them. Track your impulses. No judgment.',
  'detox.day2Title':   'Replace',
  'detox.day2Text':    'For every scroll impulse, try one analog alternative. We give you a list. Some are weird.',
  'detox.day3Title':   'Decide',
  'detox.day3Text':    'Choose what stays and what goes. Build your personal Screen Agreement.',

  'detox.formTitle':    'Get the free reset',
  'detox.formSubtitle': 'Three emails. Three days. Zero spam.',
  'detox.formButton':   'Send Me The Reset',
  'detox.formNote':     'Free. No spam. Unsubscribe anytime. We respect your inbox the way we want you to respect your screen time.',
  'detox.formNamePlaceholder': 'What should we call you?',
  'detox.formEmailPlaceholder': 'you@humanwithascreenname.com',
  'detox.formSuccessMsg': 'Welcome in. Check your inbox \u2014 Day 1 is on its way.',
  'detox.formErrorMsg':   'Hmm, that didn\u2019t work. Mind trying again?',

  // ======================== HOW IT WORKS ========================

  'steps.label':   'How It Works',
  'steps.heading': 'Four steps. No app download.',

  'steps.step0.title': 'Sign up for free',
  'steps.step0.text':  'Enter your email and get The 3-Day Reset delivered straight to your inbox. Takes 30 seconds.',
  'steps.step1.title': 'Follow the daily guides',
  'steps.step1.text':  'Each morning you get a short email with one focus for the day. Simple exercises, reflection prompts, and one challenge.',
  'steps.step2.title': 'Notice what changes',
  'steps.step2.text':  'Use our included reflection worksheet to track how your screen habits shift over three days. Most people are surprised.',
  'steps.step3.title': 'Keep going with us',
  'steps.step3.text':  'After your reset, join the How We Screen community to stay accountable. Or just take what you learned and go live your life.',

  // ======================== FAQ ========================

  'faq.label':   'FAQ',
  'faq.heading': 'Questions you probably have',

  'faq.item0.question': 'Is this just another \u201cput your phone in a drawer\u201d thing?',
  'faq.item0.answer':   'No. We don\u2019t believe in willpower-based approaches or shame-driven detoxes. The 3-Day Reset teaches you to notice your patterns and make conscious choices. Your phone stays in your pocket.',

  'faq.item1.question': 'Do I have to delete social media?',
  'faq.item1.answer':   'Absolutely not. We\u2019re not anti-social-media. We\u2019re pro-intentional-use. You might decide to take breaks, set boundaries, or change how you engage \u2014 but that\u2019s your call, not ours.',

  'faq.item2.question': 'Is this backed by research?',
  'faq.item2.answer':   'Our programs are informed by behavioral psychology, digital wellness research, and the lived experiences of our community. We\u2019re not doctors, though, so this isn\u2019t medical advice.',

  'faq.item3.question': 'What happens after the 3 days?',
  'faq.item3.answer':   'You\u2019ll have a personal Screen Agreement and a set of new habits to experiment with. From there, you can join our community, try a deeper program, or just take what you learned and go live your life.',

  'faq.item4.question': 'I\u2019m a content creator. Will this ruin my career?',
  'faq.item4.answer':   'We designed our programs with creators in mind. It\u2019s not about posting less \u2014 it\u2019s about separating creation from consumption. Many creators find they produce better work with more intentional screen habits.',

  'faq.item5.question': 'Is the community another group chat I\u2019ll feel guilty about not reading?',
  'faq.item5.answer':   'We actively designed against that. Our community has no pressure to participate daily. It\u2019s async-first, with weekly prompts and monthly live sessions. No 500-message-thread anxiety.',

  'faq.item6.question': 'How is this different from Screen Time / Digital Wellbeing on my phone?',
  'faq.item6.answer':   'Those tools show you data. We help you understand what to do with it. A timer that you swipe away doesn\u2019t change your relationship with your phone. A guided program with community support does.',

  // ======================== FOOTER ========================

  'footer.tagline':   'Building intentional relationships with technology. One screen at a time.',
  'footer.copyright': '\u00a9 2026 How We Screen. All rights reserved.',
  'footer.newsletterDesc': 'Screen culture, digital wellness, and taking your life back from the algorithm.',
  'footer.instagramUrl': 'https://instagram.com/',

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
