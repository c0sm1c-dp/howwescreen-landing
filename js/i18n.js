/**
 * i18n — Lightweight English/Spanish translation system
 * Auto-detects browser language, persists choice in localStorage
 * Translates UI chrome only (nav, labels, headings, buttons, transitions, footer)
 */

const HWS_TRANSLATIONS = {
  // Navigation
  'nav.problem':   { en: 'The Problem',    es: 'El Problema' },
  'nav.detox':     { en: 'Free Reset',     es: 'Reset Gratis' },
  'nav.faq':       { en: 'FAQ',            es: 'Preguntas' },
  'nav.cta':       { en: 'Subscribe',      es: 'Suscr\u00edbete' },

  // Hero
  'hero.badge':            { en: 'A guided digital detox',  es: 'Un detox digital guiado' },
  'hero.subtext':          { en: 'No guilt. No anxiety. Just you, deciding what deserves your attention. How We Screen is a newsletter about screen culture, digital consciousness, and building a more intentional relationship with technology \u2014 free from algorithmic reach.', es: 'Sin culpa. Sin ansiedad. Solo t\u00fa, decidiendo qu\u00e9 merece tu atenci\u00f3n. How We Screen es un newsletter sobre cultura de pantallas, consciencia digital, y construir una relaci\u00f3n m\u00e1s intencional con la tecnolog\u00eda \u2014 libre del alcance algor\u00edtmico.' },
  'hero.namePlaceholder':  { en: 'Your name',               es: 'Tu nombre' },
  'hero.emailPlaceholder': { en: 'Your email',              es: 'Tu correo' },
  'hero.formButton':       { en: 'Subscribe',               es: 'Suscr\u00edbete' },
  'hero.formNote':         { en: 'Free. No spam. No algorithm. Just ideas, delivered to your inbox.', es: 'Gratis. Sin spam. Sin algoritmo. Solo ideas, directo a tu bandeja.' },
  'hero.formSuccess':      { en: 'Welcome in. Check your inbox to confirm.', es: 'Bienvenida/o. Revisa tu bandeja para confirmar.' },
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
  'detox.label':            { en: 'Our Gift to You',        es: 'Nuestro Regalo Para Ti' },
  'detox.heading':          { en: 'The 3-Day Screen Reset', es: 'El Reset de Pantalla de 3 D\u00edas' },
  'detox.body':             { en: 'Three days. Three short emails. Zero judgment. We\u2019ll walk you through noticing your patterns, replacing a few habits, and deciding what stays. Think of it as a friend who gets it \u2014 holding your hand through the noise, not asking you to throw your phone in a lake.', es: 'Tres d\u00edas. Tres emails cortos. Cero juicio. Te acompa\u00f1aremos a notar tus patrones, reemplazar algunos h\u00e1bitos, y decidir qu\u00e9 se queda. Pi\u00e9nsalo como un amigo/a que te entiende \u2014 tom\u00e1ndote de la mano entre el ruido, sin pedirte que tires tu tel\u00e9fono al lago.' },
  'detox.namePlaceholder':  { en: 'Your name',              es: 'Tu nombre' },
  'detox.emailPlaceholder': { en: 'Your email',             es: 'Tu correo' },
  'detox.formButton':       { en: 'Send Me the Reset',      es: 'Env\u00edame el Reset' },
  'detox.formNote':         { en: 'Free forever. No spam. We respect your inbox the way we want you to respect your screen time.', es: 'Gratis siempre. Sin spam. Respetamos tu bandeja como queremos que respetes tu tiempo de pantalla.' },
  'detox.formSuccess':      { en: 'You\u2019re in. Check your inbox \u2014 Day 1 is on its way.', es: 'Ya est\u00e1s. Revisa tu bandeja \u2014 el D\u00eda 1 va en camino.' },
  'detox.formError':        { en: 'Hmm, that didn\u2019t work. Try again?', es: 'Hmm, eso no funcion\u00f3. \u00bfIntentas de nuevo?' },

  // FAQ section
  'faq.label':   { en: 'FAQ',  es: 'Preguntas Frecuentes' },
  'faq.heading': { en: 'Questions you probably have', es: 'Preguntas que probablemente tienes' },
  'faq.item0.question': { en: 'What is How We Screen?', es: '\u00bfQu\u00e9 es How We Screen?' },
  'faq.item0.answer':   { en: 'A newsletter about screen culture, digital consciousness, and building a more intentional relationship with technology. No corporate wellness. No shame. Just honest ideas delivered to your inbox.', es: 'Un newsletter sobre cultura de pantallas, consciencia digital, y construir una relaci\u00f3n m\u00e1s intencional con la tecnolog\u00eda. Sin bienestar corporativo. Sin verg\u00fcenza. Solo ideas honestas directo a tu bandeja.' },
  'faq.item1.question': { en: 'How often do you send emails?', es: '\u00bfCon qu\u00e9 frecuencia env\u00edan emails?' },
  'faq.item1.answer':   { en: 'Once a week. We respect your inbox the way we want you to respect your screen time. No daily blasts, no engagement bait \u2014 just one letter worth reading.', es: 'Una vez por semana. Respetamos tu bandeja como queremos que respetes tu tiempo de pantalla. Sin correos diarios, sin carnada de engagement \u2014 solo una carta que vale la pena leer.' },
  'faq.item2.question': { en: 'Is this a product or an app?', es: '\u00bfEs un producto o una app?' },
  'faq.item2.answer':   { en: 'Not yet. Right now How We Screen is ideas and community. We\u2019re building something bigger \u2014 guided programs, tools, conversations \u2014 but it starts here, with the newsletter. More is coming.', es: 'A\u00fan no. Ahora mismo How We Screen es ideas y comunidad. Estamos construyendo algo m\u00e1s grande \u2014 programas guiados, herramientas, conversaciones \u2014 pero empieza aqu\u00ed, con el newsletter. Viene m\u00e1s.' },
  'faq.item3.question': { en: 'Can I unsubscribe?', es: '\u00bfPuedo cancelar la suscripci\u00f3n?' },
  'faq.item3.answer':   { en: 'Always. One click, no guilt. We\u2019re not going to guilt-trip you into staying \u2014 that would be deeply ironic for a newsletter about intentional screen use.', es: 'Siempre. Un clic, sin culpa. No vamos a hacerte sentir culpable por irte \u2014 ser\u00eda profundamente ir\u00f3nico para un newsletter sobre uso intencional de pantallas.' },

  // Footer
  'footer.tagline':  { en: 'Building intentional relationships with technology. One screen at a time.', es: 'Construyendo relaciones intencionales con la tecnolog\u00eda. Una pantalla a la vez.' },
  'footer.navigate': { en: 'Navigate',      es: 'Navegar' },
  'footer.connect':  { en: 'Connect',       es: 'Conectar' },
  'footer.newsletter': { en: 'Weekly Letter', es: 'Carta Semanal' },
  'footer.newsletterDesc': { en: 'Screen culture, digital wellness, and taking your life back from the algorithm.', es: 'Cultura de pantallas, bienestar digital, y recuperando tu vida del algoritmo.' },
  'footer.emailPlaceholder': { en: 'Your email address', es: 'Tu correo electr\u00f3nico' },
  'footer.subscribe': { en: 'Subscribe', es: 'Suscr\u00edbete' },
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
