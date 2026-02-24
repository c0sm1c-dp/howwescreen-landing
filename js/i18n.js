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
  'nav.about':     { en: 'About',          es: 'Acerca de' },
  'nav.faq':       { en: 'FAQ',            es: 'Preguntas' },
  'nav.blog':      { en: 'Blog',           es: 'Blog' },
  'nav.cta':       { en: 'Start Your Detox', es: 'Comienza Tu Detox' },

  // Hero
  'hero.badge':     { en: 'A guided digital detox', es: 'Un detox digital guiado' },
  'hero.subtext':   { en: 'No guilt. No anxiety. Just you, deciding what deserves your attention. How We Screen is a free, guided practice for anyone ready to build space between themselves and the digital noise.', es: 'Sin culpa. Sin ansiedad. Solo t\u00fa, decidiendo qu\u00e9 merece tu atenci\u00f3n. How We Screen es una pr\u00e1ctica gratuita y guiada para cualquiera que est\u00e9 listo/a para crear espacio entre s\u00ed mismo/a y el ruido digital.' },
  'hero.ctaPrimary': { en: 'Start the Free 3-Day Reset', es: 'Comienza el Reset Gratis de 3 D\u00edas' },
  'hero.ctaSecondary': { en: 'Learn more', es: 'Saber m\u00e1s' },
  'hero.note':      { en: 'Or just get our weekly letter on screen culture \u2014 no commitment.', es: 'O solo recibe nuestra carta semanal sobre cultura digital \u2014 sin compromiso.' },

  // Transitions
  'transition.1':  { en: 'This is our gift to you. Take it.', es: 'Este es nuestro regalo para ti. T\u00f3malo.' },
  'transition.2':  { en: 'Why does this exist?', es: '\u00bfPor qu\u00e9 existe esto?' },
  'transition.3':  { en: 'You already know something is off. Let\u2019s name it.', es: 'Ya sabes que algo no est\u00e1 bien. Vamos a nombrarlo.' },
  'transition.4':  { en: 'So what do we do about it?', es: '\u00bfY qu\u00e9 hacemos al respecto?' },
  'transition.5':  { en: 'Here\u2019s exactly what happens.', es: 'Esto es exactamente lo que pasa.' },

  // Problem section
  'problem.label':   { en: 'The Problem',   es: 'El Problema' },
  'problem.heading': { en: 'The Scroll Trap', es: 'La Trampa del Scroll' },
  'problem.body1':   { en: 'It starts innocently. A quick check. A notification. And then thirty minutes vanish like they were never yours. You unlock your phone 96 times a day. You watch reels you don\u2019t even like. You know it\u2019s not making you feel good, and you do it anyway.', es: 'Empieza de forma inocente. Una revisi\u00f3n r\u00e1pida. Una notificaci\u00f3n. Y luego treinta minutos desaparecen como si nunca hubieran sido tuyos. Desbloqueas tu tel\u00e9fono 96 veces al d\u00eda. Ves reels que ni siquiera te gustan. Sabes que no te hace sentir bien, y lo haces igual.' },
  'problem.body2':   { en: 'This isn\u2019t a willpower failure. It\u2019s a design feature. Every app on your phone was built by a team of engineers whose success is measured by how long they keep you staring at glass.', es: 'Esto no es una falta de voluntad. Es una caracter\u00edstica de dise\u00f1o. Cada app en tu tel\u00e9fono fue construida por un equipo de ingenieros cuyo \u00e9xito se mide por cu\u00e1nto tiempo te mantienen mirando una pantalla.' },
  'problem.body3':   { en: 'You\u2019re not the problem. But you might be ready for a different relationship with your screen.', es: 'T\u00fa no eres el problema. Pero quiz\u00e1s est\u00e9s lista/o para una relaci\u00f3n diferente con tu pantalla.' },
  'problem.stat1Label': { en: 'Average daily screen time for adults', es: 'Tiempo de pantalla diario promedio para adultos' },
  'problem.stat2Label': { en: 'Average daily phone checks', es: 'Revisiones diarias promedio del tel\u00e9fono' },
  'problem.stat3Label': { en: 'Of adults say social media harms their mental health', es: 'De los adultos dicen que las redes sociales da\u00f1an su salud mental' },

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
  'detox.formSuccessMsg': { en: 'Welcome in! Check your inbox and confirm your email to start Day 1.', es: '\u00a1Bienvenida/o! Revisa tu bandeja de entrada y confirma tu email para empezar el D\u00eda 1.' },
  'detox.formErrorMsg':  { en: 'Hmm, that didn\u2019t work. Mind trying again?', es: 'Hmm, eso no funcion\u00f3. \u00bfPuedes intentar de nuevo?' },

  // About / Founder
  'about.label':   { en: 'About',   es: 'Acerca de' },
  'about.heading': { en: '[Your heading here]', es: '[Tu t\u00edtulo aqu\u00ed]' },
  'about.body1':   { en: '[Your story \u2014 why you built this]', es: '[Tu historia \u2014 por qu\u00e9 creaste esto]' },
  'about.body2':   { en: '[Your philosophy \u2014 consciousness, digital distance, the gift]', es: '[Tu filosof\u00eda \u2014 consciencia, distancia digital, el regalo]' },
  'about.body3':   { en: '[Your invitation \u2014 take the key, run with it]', es: '[Tu invitaci\u00f3n \u2014 toma la llave, corre con ella]' },

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
  'steps.step3.text':  { en: 'After your reset, join the How We Screen community to stay accountable. Or just take what you learned and go live your life.', es: 'Despu\u00e9s de tu reset, \u00fanete a la comunidad de How We Screen para mantenerte firme. O simplemente toma lo que aprendiste y vive tu vida.' },

  // FAQ section
  'faq.label':   { en: 'FAQ',  es: 'Preguntas Frecuentes' },
  'faq.heading': { en: 'Questions you probably have', es: 'Preguntas que probablemente tienes' },
  'faq.item0.question': { en: 'Is this just another \u201cput your phone in a drawer\u201d thing?', es: '\u00bfEs esto otro de esos de \u201cguarda tu tel\u00e9fono en un caj\u00f3n\u201d?' },
  'faq.item0.answer':   { en: 'No. We don\u2019t believe in willpower-based approaches or shame-driven detoxes. The 3-Day Reset teaches you to notice your patterns and make conscious choices. Your phone stays in your pocket.', es: 'No. No creemos en enfoques basados en fuerza de voluntad ni en detoxes impulsados por la verg\u00fcenza. El Reset de 3 D\u00edas te ense\u00f1a a notar tus patrones y tomar decisiones conscientes. Tu tel\u00e9fono se queda en tu bolsillo.' },
  'faq.item1.question': { en: 'Do I have to delete social media?', es: '\u00bfTengo que borrar mis redes sociales?' },
  'faq.item1.answer':   { en: 'Absolutely not. We\u2019re not anti-social-media. We\u2019re pro-intentional-use. You might decide to take breaks, set boundaries, or change how you engage \u2014 but that\u2019s your call, not ours.', es: 'Absolutamente no. No estamos en contra de las redes sociales. Estamos a favor del uso intencional. Puedes decidir tomar descansos, poner l\u00edmites, o cambiar c\u00f3mo interact\u00faas \u2014 pero esa es tu decisi\u00f3n, no la nuestra.' },
  'faq.item2.question': { en: 'Is this backed by research?', es: '\u00bfEsto est\u00e1 respaldado por investigaci\u00f3n?' },
  'faq.item2.answer':   { en: 'Our programs are informed by behavioral psychology, digital wellness research, and the lived experiences of our community. We\u2019re not doctors, though, so this isn\u2019t medical advice.', es: 'Nuestros programas est\u00e1n informados por psicolog\u00eda conductual, investigaci\u00f3n en bienestar digital, y las experiencias vividas de nuestra comunidad. No somos m\u00e9dicos, as\u00ed que esto no es consejo m\u00e9dico.' },
  'faq.item3.question': { en: 'What happens after the 3 days?', es: '\u00bfQu\u00e9 pasa despu\u00e9s de los 3 d\u00edas?' },
  'faq.item3.answer':   { en: 'You\u2019ll have a personal Screen Agreement and a set of new habits to experiment with. From there, you can join our community, try a deeper program, or just take what you learned and go live your life.', es: 'Tendr\u00e1s un Acuerdo de Pantalla personal y un conjunto de nuevos h\u00e1bitos para experimentar. Desde ah\u00ed, puedes unirte a nuestra comunidad, probar un programa m\u00e1s profundo, o simplemente tomar lo que aprendiste y vivir tu vida.' },
  'faq.item4.question': { en: 'I\u2019m a content creator. Will this ruin my career?', es: 'Soy creador/a de contenido. \u00bfEsto arruinar\u00e1 mi carrera?' },
  'faq.item4.answer':   { en: 'We designed our programs with creators in mind. It\u2019s not about posting less \u2014 it\u2019s about separating creation from consumption. Many creators find they produce better work with more intentional screen habits.', es: 'Dise\u00f1amos nuestros programas pensando en creadores. No se trata de publicar menos \u2014 se trata de separar la creaci\u00f3n del consumo. Muchos creadores descubren que producen mejor trabajo con h\u00e1bitos de pantalla m\u00e1s intencionales.' },
  'faq.item5.question': { en: 'Is the community another group chat I\u2019ll feel guilty about not reading?', es: '\u00bfLa comunidad es otro grupo del que me voy a sentir culpable por no leer?' },
  'faq.item5.answer':   { en: 'We actively designed against that. Our community has no pressure to participate daily. It\u2019s async-first, with weekly prompts and monthly live sessions. No 500-message-thread anxiety.', es: 'Dise\u00f1amos activamente en contra de eso. Nuestra comunidad no tiene presi\u00f3n para participar diariamente. Es as\u00edncrona primero, con prompts semanales y sesiones en vivo mensuales. Sin ansiedad de hilos de 500 mensajes.' },
  'faq.item6.question': { en: 'How is this different from Screen Time / Digital Wellbeing on my phone?', es: '\u00bfC\u00f3mo es diferente a Tiempo de Pantalla / Bienestar Digital de mi tel\u00e9fono?' },
  'faq.item6.answer':   { en: 'Those tools show you data. We help you understand what to do with it. A timer that you swipe away doesn\u2019t change your relationship with your phone. A guided program with community support does.', es: 'Esas herramientas te muestran datos. Nosotros te ayudamos a entender qu\u00e9 hacer con ellos. Un temporizador que deslizas no cambia tu relaci\u00f3n con tu tel\u00e9fono. Un programa guiado con apoyo comunitario s\u00ed.' },

  // Footer
  'footer.tagline':  { en: 'Building intentional relationships with technology, one screen at a time.', es: 'Construyendo relaciones intencionales con la tecnolog\u00eda, una pantalla a la vez.' },
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
