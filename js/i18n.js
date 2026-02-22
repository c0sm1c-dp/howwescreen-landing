/**
 * i18n — Lightweight English/Spanish translation system
 * Auto-detects browser language, persists choice in localStorage
 * Translates UI chrome only (nav, labels, headings, buttons, transitions, footer)
 */

const HWS_TRANSLATIONS = {
  // Navigation
  'nav.problem':   { en: 'The Problem',    es: 'El Problema' },
  'nav.solution':  { en: 'What We Do',     es: 'Lo Que Hacemos' },
  'nav.detox':     { en: 'Free Detox',     es: 'Detox Gratis' },
  'nav.programs':  { en: 'Programs',       es: 'Programas' },
  'nav.faq':       { en: 'FAQ',            es: 'Preguntas' },
  'nav.blog':      { en: 'Blog',           es: 'Blog' },
  'nav.cta':       { en: 'Start Your Detox', es: 'Comienza Tu Detox' },

  // Hero
  'hero.badge':     { en: 'A guided digital detox', es: 'Un detox digital guiado' },
  'hero.subtext':   { en: 'No guilt. No anxiety. Just you, deciding what deserves your attention. How We Screen is a guided program helping Gen Z and millennials build intentional relationships with technology.', es: 'Sin culpa. Sin ansiedad. Solo t\u00fa, decidiendo qu\u00e9 merece tu atenci\u00f3n. How We Screen es un programa guiado que ayuda a Gen Z y millennials a construir relaciones intencionales con la tecnolog\u00eda.' },
  'hero.ctaPrimary': { en: 'Start the Free 3-Day Reset', es: 'Comienza el Reset Gratis de 3 D\u00edas' },
  'hero.ctaSecondary': { en: 'Learn more', es: 'Saber m\u00e1s' },
  'hero.note':      { en: 'Or just get our weekly letter on screen culture \u2014 no commitment.', es: 'O solo recibe nuestra carta semanal sobre cultura digital \u2014 sin compromiso.' },

  // Transitions
  'transition.1':  { en: 'You already know something is off. Let\u2019s name it.', es: 'Ya sabes que algo no est\u00e1 bien. Vamos a nombrarlo.' },
  'transition.2':  { en: 'You\u2019re not alone in feeling this.', es: 'No eres la \u00fanica persona que siente esto.' },
  'transition.3':  { en: 'So what do we do about it?', es: '\u00bfY qu\u00e9 hacemos al respecto?' },
  'transition.4':  { en: 'Start here. It\u2019s free.', es: 'Empieza aqu\u00ed. Es gratis.' },
  'transition.5':  { en: 'Here\u2019s exactly what happens.', es: 'Esto es exactamente lo que pasa.' },
  'transition.6':  { en: 'Ready to go deeper?', es: '\u00bfLista/o para ir m\u00e1s profundo?' },

  // Problem section
  'problem.label':   { en: 'The Problem',   es: 'El Problema' },
  'problem.heading': { en: 'The Scroll Trap', es: 'La Trampa del Scroll' },
  'problem.stat1Label': { en: 'Average daily screen time for 18\u201329 year olds', es: 'Tiempo de pantalla diario promedio para 18\u201329 a\u00f1os' },
  'problem.stat2Label': { en: 'Average daily phone unlocks', es: 'Desbloqueos diarios promedio del tel\u00e9fono' },
  'problem.stat3Label': { en: 'Of Gen Z say social media harms their mental health', es: 'De la Gen Z dice que las redes sociales da\u00f1an su salud mental' },

  // Voices section
  'voices.label':   { en: 'Voices from the Internet', es: 'Voces de Internet' },
  'voices.heading': { en: 'The things we say when we think nobody\u2019s building a website about it', es: 'Lo que decimos cuando creemos que nadie est\u00e1 construyendo un sitio web sobre eso' },

  // Solution section
  'solution.label':   { en: 'The Solution',       es: 'La Soluci\u00f3n' },
  'solution.heading': { en: 'Not another digital detox app.', es: 'No es otra app de detox digital.' },
  'solution.intro':   { en: 'We\u2019re a community, a content studio, and a set of guided programs. Think of us as your intentional-screen-time friend who doesn\u2019t judge you for still loving memes.', es: 'Somos una comunidad, un estudio de contenido y un conjunto de programas guiados. Pi\u00e9nsanos como tu amigo/a del tiempo de pantalla intencional que no te juzga por a\u00fan amar los memes.' },
  'solution.card0.title': { en: 'Guided Detox Programs', es: 'Programas de Detox Guiados' },
  'solution.card0.text':  { en: 'Structured multi-day programs that actually work because they don\u2019t ask you to throw your phone in a lake. Start with our free 3-day reset.', es: 'Programas estructurados de varios d\u00edas que realmente funcionan porque no te piden tirar tu tel\u00e9fono al lago. Empieza con nuestro reset gratis de 3 d\u00edas.' },
  'solution.card1.title': { en: 'The Community',      es: 'La Comunidad' },
  'solution.card1.text':  { en: 'A private space for people who want to talk honestly about their relationship with technology. No toxic positivity. No shame. Just real conversations.', es: 'Un espacio privado para personas que quieren hablar honestamente sobre su relaci\u00f3n con la tecnolog\u00eda. Sin positivismo t\u00f3xico. Sin verg\u00fcenza.' },
  'solution.card2.title': { en: 'Weekly Content',     es: 'Contenido Semanal' },
  'solution.card2.text':  { en: 'A newsletter, essays, and curated links about screen culture, digital wellness (without the cringe), and how to reclaim your attention.', es: 'Un newsletter, ensayos y links curados sobre cultura de pantallas, bienestar digital (sin lo cringe), y c\u00f3mo recuperar tu atenci\u00f3n.' },

  // Detox section
  'detox.label':       { en: 'Free Program',         es: 'Programa Gratis' },
  'detox.heading':     { en: 'The 3-Day Reset',      es: 'El Reset de 3 D\u00edas' },
  'detox.subtext':     { en: 'A free, guided micro-detox delivered to your inbox. No app required. No cold turkey. Just three days of small, intentional shifts.', es: 'Un micro-detox gratis y guiado, directo a tu bandeja de entrada. Sin app. Sin dejar todo de golpe. Solo tres d\u00edas de cambios peque\u00f1os e intencionales.' },
  'detox.day1Title':   { en: 'Notice',    es: 'Observa' },
  'detox.day1Text':    { en: 'Become aware of your patterns without changing them. Track your impulses. No judgment.', es: 'Hazte consciente de tus patrones sin cambiarlos. Rastrea tus impulsos. Sin juicio.' },
  'detox.day2Title':   { en: 'Replace',   es: 'Reemplaza' },
  'detox.day2Text':    { en: 'For every scroll impulse, try one analog alternative. We give you a list. Some are weird.', es: 'Por cada impulso de scroll, prueba una alternativa an\u00e1loga. Te damos una lista. Algunas son raras.' },
  'detox.day3Title':   { en: 'Decide',    es: 'Decide' },
  'detox.day3Text':    { en: 'Choose what stays and what goes. Build your personal Screen Agreement.', es: 'Elige qu\u00e9 se queda y qu\u00e9 se va. Construye tu Acuerdo de Pantalla personal.' },
  'detox.formTitle':   { en: 'Get the free reset',    es: 'Obt\u00e9n el reset gratis' },
  'detox.formSubtitle': { en: 'Three emails. Three days. Zero spam.', es: 'Tres emails. Tres d\u00edas. Cero spam.' },
  'detox.formButton':  { en: 'Send Me The Reset',     es: 'Env\u00edame El Reset' },
  'detox.formNote':    { en: 'Free. No spam. Unsubscribe anytime. We respect your inbox the way we want you to respect your screen time.', es: 'Gratis. Sin spam. Cancela cuando quieras. Respetamos tu bandeja de entrada como queremos que respetes tu tiempo de pantalla.' },
  'detox.namePlaceholder': { en: 'What should we call you?', es: '\u00bfC\u00f3mo te llamamos?' },
  'detox.emailPlaceholder': { en: 'you@humanwithascreenname.com', es: 'tu@humanoconpantalla.com' },

  // Steps section
  'steps.label':   { en: 'How It Works',  es: 'C\u00f3mo Funciona' },
  'steps.heading': { en: 'Four steps. No app download.', es: 'Cuatro pasos. Sin descargar apps.' },
  'steps.step0.title': { en: 'Sign up for free',   es: 'Reg\u00edstrate gratis' },
  'steps.step0.text':  { en: 'Enter your email and get The 3-Day Reset delivered straight to your inbox. Takes 30 seconds.', es: 'Ingresa tu email y recibe El Reset de 3 D\u00edas directo a tu bandeja. Toma 30 segundos.' },
  'steps.step1.title': { en: 'Follow the daily guides', es: 'Sigue las gu\u00edas diarias' },
  'steps.step1.text':  { en: 'Each morning you get a short email with one focus for the day. Simple exercises, reflection prompts, and one challenge.', es: 'Cada ma\u00f1ana recibes un email corto con un enfoque del d\u00eda. Ejercicios simples, reflexiones y un reto.' },
  'steps.step2.title': { en: 'Notice what changes',  es: 'Nota los cambios' },
  'steps.step2.text':  { en: 'Use our included reflection worksheet to track how your screen habits shift over three days. Most people are surprised.', es: 'Usa nuestra hoja de reflexi\u00f3n para seguir c\u00f3mo cambian tus h\u00e1bitos de pantalla en tres d\u00edas. La mayor\u00eda se sorprende.' },
  'steps.step3.title': { en: 'Keep going with us',   es: 'Sigue con nosotros' },
  'steps.step3.text':  { en: 'After your reset, join the How We Screen community to stay accountable. Or explore our deeper paid programs.', es: 'Despu\u00e9s de tu reset, \u00fanete a la comunidad de How We Screen para mantenerte firme. O explora nuestros programas de pago.' },

  // Pricing section
  'pricing.label':   { en: 'Programs',          es: 'Programas' },
  'pricing.heading': { en: 'Choose your depth',  es: 'Elige tu profundidad' },
  'pricing.subtext': { en: 'Every journey starts with the free reset. Go further when you\u2019re ready.', es: 'Cada camino empieza con el reset gratis. Avanza cuando est\u00e9s lista/o.' },
  'pricing.startFree':   { en: 'Start Free',       es: 'Empieza Gratis' },
  'pricing.joinWaitlist': { en: 'Join the Waitlist', es: '\u00danete a la Lista' },
  'pricing.emailPlaceholder': { en: 'Your email',  es: 'Tu email' },

  // FAQ section
  'faq.label':   { en: 'FAQ',  es: 'Preguntas Frecuentes' },
  'faq.heading': { en: 'Questions you probably have', es: 'Preguntas que probablemente tienes' },

  // Footer
  'footer.tagline':  { en: 'Building intentional relationships with technology, one screen at a time.', es: 'Construyendo relaciones intencionales con la tecnolog\u00eda, una pantalla a la vez.' },
  'footer.navigate': { en: 'Navigate',      es: 'Navegar' },
  'footer.connect':  { en: 'Connect',       es: 'Conectar' },
  'footer.newsletter': { en: 'Weekly Letter', es: 'Carta Semanal' },
  'footer.newsletterDesc': { en: 'Screen culture, digital wellness, and taking your life back from the algorithm.', es: 'Cultura de pantallas, bienestar digital, y recuperando tu vida del algoritmo.' },
  'footer.emailPlaceholder': { en: 'Your email address', es: 'Tu correo electr\u00f3nico' },
  'footer.subscribe': { en: 'Subscribe', es: 'Suscr\u00edbete' },
  'footer.copyright': { en: '\u00a9 2025 How We Screen. All rights reserved.', es: '\u00a9 2025 How We Screen. Todos los derechos reservados.' },

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
