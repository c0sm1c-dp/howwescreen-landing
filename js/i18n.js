/**
 * i18n — Lightweight English/Spanish translation system
 * Auto-detects browser language, persists choice in localStorage
 * Translates UI chrome only (nav, labels, headings, buttons, transitions, footer)
 */

const HWS_TRANSLATIONS = {
  // Navigation
  'nav.problem':   { en: 'The Problem',    es: 'El Problema' },
  'nav.detox':     { en: 'The Reset',      es: 'El Reset' },
  'nav.faq':       { en: 'FAQ',            es: 'Preguntas' },
  'nav.cta':       { en: 'Start the Reset', es: 'Empezar el Reset' },

  // Hero
  'hero.badge':            { en: 'A guided digital detox',  es: 'Un detox digital guiado' },
  'hero.subtext':          { en: 'No guilt. No anxiety. Just you, deciding what deserves your attention. A free 3-day guided practice \u2014 three gentle emails to help you notice, breathe, and build space between you and the digital noise.', es: 'Sin culpa. Sin ansiedad. Solo t\u00fa, decidiendo qu\u00e9 merece tu atenci\u00f3n. Una pr\u00e1ctica guiada gratuita de 3 d\u00edas \u2014 tres emails suaves para ayudarte a notar, respirar, y crear espacio entre t\u00fa y el ruido digital.' },
  'hero.namePlaceholder':  { en: 'Your name',               es: 'Tu nombre' },
  'hero.emailPlaceholder': { en: 'Your email',              es: 'Tu correo' },
  'hero.formButton':       { en: 'Start My Reset',          es: 'Empezar Mi Reset' },
  'hero.formNote':         { en: 'Free, always. Three emails over three days, then we let go.', es: 'Gratis, siempre. Tres emails en tres d\u00edas, y te dejamos ir.' },
  'hero.formSuccess':      { en: 'You\u2019re in. Check your inbox \u2014 Day 1 is on its way.', es: 'Ya est\u00e1s. Revisa tu bandeja \u2014 el D\u00eda 1 va en camino.' },
  'hero.formError':        { en: 'Hmm, that didn\u2019t work. Try again?', es: 'Hmm, eso no funcion\u00f3. \u00bfIntentas de nuevo?' },

  // Transitions
  'transition.1':  { en: 'You already know something is off.', es: 'Ya sabes que algo no est\u00e1 bien.' },
  'transition.2':  { en: 'So here \u2014 take this.', es: 'As\u00ed que toma \u2014 esto es para ti.' },

  // Problem section
  'problem.label':   { en: 'The Problem',   es: 'El Problema' },
  'problem.heading': { en: 'The Scroll Trap', es: 'La Trampa del Scroll' },
  'problem.body1':   { en: 'It starts innocently. A quick check. A notification. And then thirty minutes vanish like they were never yours. You unlock your phone 96 times a day. You watch reels you don\u2019t even like. You know it\u2019s not making you feel good, and you do it anyway.', es: 'Empieza de forma inocente. Una revisi\u00f3n r\u00e1pida. Una notificaci\u00f3n. Y luego treinta minutos desaparecen como si nunca hubieran sido tuyos. Desbloqueas tu tel\u00e9fono 96 veces al d\u00eda. Ves reels que ni siquiera te gustan. Sabes que no te hace sentir bien, y lo haces igual.' },
  'problem.body2':   { en: 'This isn\u2019t a willpower failure. It\u2019s a design feature. Every app on your phone was built by a team of engineers whose success is measured by how long they keep you staring at glass.', es: 'Esto no es una falta de voluntad. Es una caracter\u00edstica de dise\u00f1o. Cada app en tu tel\u00e9fono fue construida por un equipo de ingenieros cuyo \u00e9xito se mide por cu\u00e1nto tiempo te mantienen mirando una pantalla.' },
  'problem.body3':   { en: 'You\u2019re not the problem. But you might be ready for a different relationship with your screen.', es: 'T\u00fa no eres el problema. Pero quiz\u00e1s est\u00e9s lista/o para una relaci\u00f3n diferente con tu pantalla.' },
  'problem.stat1Label': { en: 'Average daily screen time for adults', es: 'Tiempo de pantalla diario promedio para adultos' },
  'problem.stat2Label': { en: 'Average daily phone checks', es: 'Revisiones diarias promedio del tel\u00e9fono' },
  'problem.stat3Label': { en: 'Of adults say social media harms their mental health', es: 'De los adultos dicen que las redes sociales da\u00f1an su salud mental' },

  // Detox section
  'detox.label':            { en: 'The Reset',              es: 'El Reset' },
  'detox.heading':          { en: '3 Days. 3 Emails. A Quieter You.', es: '3 D\u00edas. 3 Emails. Un T\u00fa M\u00e1s Tranquilo.' },
  'detox.body':             { en: 'We made this for you. Three gentle emails over three days \u2014 each one a small invitation to notice, breathe, and choose differently. No rules. No shame. Just us, walking beside you through the noise, helping you find the quiet that was always yours.', es: 'Hicimos esto para ti. Tres emails suaves en tres d\u00edas \u2014 cada uno una peque\u00f1a invitaci\u00f3n a notar, respirar, y elegir diferente. Sin reglas. Sin verg\u00fcenza. Solo nosotros, caminando a tu lado entre el ruido, ayud\u00e1ndote a encontrar la calma que siempre fue tuya.' },
  'detox.namePlaceholder':  { en: 'Your name',              es: 'Tu nombre' },
  'detox.emailPlaceholder': { en: 'Your email',             es: 'Tu correo' },
  'detox.formButton':       { en: 'Send Me the Reset',      es: 'Env\u00edame el Reset' },
  'detox.formNote':         { en: 'Free, always. Three emails, then we let go. Unless you want to stay.', es: 'Gratis, siempre. Tres emails, y te dejamos ir. A menos que quieras quedarte.' },
  'detox.formSuccess':      { en: 'You\u2019re in. Check your inbox \u2014 Day 1 is on its way.', es: 'Ya est\u00e1s. Revisa tu bandeja \u2014 el D\u00eda 1 va en camino.' },
  'detox.formError':        { en: 'Hmm, that didn\u2019t work. Try again?', es: 'Hmm, eso no funcion\u00f3. \u00bfIntentas de nuevo?' },

  // FAQ section
  'faq.label':   { en: 'FAQ',  es: 'Preguntas Frecuentes' },
  'faq.heading': { en: 'Questions you probably have', es: 'Preguntas que probablemente tienes' },
  'faq.item0.question': { en: 'What is the 3-Day Screen Reset?', es: '\u00bfQu\u00e9 es el Reset de Pantalla de 3 D\u00edas?' },
  'faq.item0.answer':   { en: 'A free 3-day guided program to help you reset your relationship with your phone. Three gentle emails, each with a small practice to help you notice, breathe, and choose differently. No corporate wellness. No shame.', es: 'Un programa guiado gratuito de 3 d\u00edas para ayudarte a resetear tu relaci\u00f3n con el tel\u00e9fono. Tres emails suaves, cada uno con una peque\u00f1a pr\u00e1ctica para notar, respirar, y elegir diferente. Sin bienestar corporativo. Sin verg\u00fcenza.' },
  'faq.item1.question': { en: 'What happens during the 3 days?', es: '\u00bfQu\u00e9 pasa durante los 3 d\u00edas?' },
  'faq.item1.answer':   { en: 'Each day you\u2019ll receive one email with a simple, guided practice. Day 1 is about noticing. Day 2 is about creating space. Day 3 is about choosing differently. No rules, no shame \u2014 just small invitations.', es: 'Cada d\u00eda recibir\u00e1s un email con una pr\u00e1ctica simple y guiada. El D\u00eda 1 es sobre notar. El D\u00eda 2 es sobre crear espacio. El D\u00eda 3 es sobre elegir diferente. Sin reglas, sin verg\u00fcenza \u2014 solo peque\u00f1as invitaciones.' },
  'faq.item2.question': { en: 'Is this an app?', es: '\u00bfEs una app?' },
  'faq.item2.answer':   { en: 'No. The 3-Day Screen Reset is delivered by email \u2014 no downloads, no tracking, no app demanding more of your attention. Just three messages designed to help you notice and shift.', es: 'No. El Reset de Pantalla de 3 D\u00edas se entrega por email \u2014 sin descargas, sin tracking, sin app exigi\u00e9ndote m\u00e1s atenci\u00f3n. Solo tres mensajes dise\u00f1ados para ayudarte a notar y cambiar.' },
  'faq.item3.question': { en: 'What happens after the 3 days?', es: '\u00bfQu\u00e9 pasa despu\u00e9s de los 3 d\u00edas?' },
  'faq.item3.answer':   { en: 'The emails stop. That\u2019s it. We\u2019re not going to hound your inbox \u2014 that would be deeply ironic for a digital detox. If you want to stay connected, you can. But we let go first.', es: 'Los emails paran. Eso es todo. No vamos a bombardear tu bandeja \u2014 ser\u00eda profundamente ir\u00f3nico para un detox digital. Si quieres seguir conectada/o, puedes. Pero nosotros soltamos primero.' },

  // Footer
  'footer.tagline':  { en: 'Building intentional relationships with technology. One screen at a time.', es: 'Construyendo relaciones intencionales con la tecnolog\u00eda. Una pantalla a la vez.' },
  'footer.navigate': { en: 'Navigate',      es: 'Navegar' },
  'footer.connect':  { en: 'Connect',       es: 'Conectar' },
  'footer.newsletter': { en: 'Start the Reset', es: 'Empezar el Reset' },
  'footer.newsletterDesc': { en: 'Three days. Three emails. A quieter relationship with your screen.', es: 'Tres d\u00edas. Tres emails. Una relaci\u00f3n m\u00e1s tranquila con tu pantalla.' },
  'footer.emailPlaceholder': { en: 'Your email address', es: 'Tu correo electr\u00f3nico' },
  'footer.subscribe': { en: 'Start My Reset', es: 'Empezar Mi Reset' },
  'footer.copyright': { en: '\u00a9 2026 How We Screen. All rights reserved.', es: '\u00a9 2026 How We Screen. Todos los derechos reservados.' },

  // Share
  'share.copyLink':  { en: 'Copy link',     es: 'Copiar enlace' },
  'share.email':     { en: 'Email',         es: 'Email' },
  'share.whatsapp':  { en: 'WhatsApp',      es: 'WhatsApp' },
  'share.label':     { en: 'Share this article', es: 'Comparte este art\u00edculo' },

  // Lang toggle
  'lang.switchTo': { en: 'ES', es: 'EN' },
};

function initI18n() {
  // Determine language: localStorage > browser detection > default 'en'
  let lang = localStorage.getItem('hws-lang');

  if (!lang) {
    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    lang = browserLang.startsWith('es') ? 'es' : 'en';
  }

  applyLanguage(lang);
  setupLangToggle();
}

function applyLanguage(lang) {
  // Validate
  if (lang !== 'en' && lang !== 'es') lang = 'en';

  // Save preference
  localStorage.setItem('hws-lang', lang);

  // Update html lang attribute
  document.documentElement.lang = lang;

  // Translate all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translation = HWS_TRANSLATIONS[key];
    if (!translation || !translation[lang]) return;

    // Handle input placeholders
    if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
      el.placeholder = translation[lang];
    } else {
      // Preserve child elements (like SVG icons inside buttons)
      const hasChildElements = el.querySelector('svg, img, span.hero-card__badge-dot');
      if (hasChildElements && el.childNodes.length > 1) {
        // Find and update only text nodes
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = translation[lang];
            break;
          }
        }
      } else {
        el.textContent = translation[lang];
      }
    }
  });

  // Update toggle buttons
  document.querySelectorAll('.lang-toggle').forEach((btn) => {
    btn.textContent = lang === 'en' ? 'ES' : 'EN';
    btn.setAttribute('aria-label', lang === 'en' ? 'Cambiar a espa\u00f1ol' : 'Switch to English');
  });
}

function setupLangToggle() {
  document.querySelectorAll('.lang-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const currentLang = localStorage.getItem('hws-lang') || 'en';
      const newLang = currentLang === 'en' ? 'es' : 'en';
      applyLanguage(newLang);
    });
  });
}
