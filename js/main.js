/**
 * Main — Entry point, initializes all modules
 */

// Nav scroll behavior
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          nav.classList.add('nav--scrolled');
        } else {
          nav.classList.remove('nav--scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Apply all overrides and initialize the page
function applyOverridesAndInit() {
  // Apply admin overrides before anything else renders
  if (typeof initSiteRenderer === 'function') {
    initSiteRenderer();
  }

  // Restore custom blocks first (before order restoration)
  if (typeof restoreCustomBlocks === 'function') restoreCustomBlocks();

  // Restore section order, hidden state, styles, and element sizes (set by editor)
  if (typeof restoreSectionOrder === 'function') restoreSectionOrder();
  if (typeof restoreHiddenSections === 'function') restoreHiddenSections();
  if (typeof restoreSectionStyles === 'function') restoreSectionStyles();
  if (typeof restoreElementSizes === 'function') restoreElementSizes();
  if (typeof restorePerElementStyles === 'function') restorePerElementStyles();

  initNavScroll();
  initScrollAnimations();
  initMobileMenu();
  initSmoothScroll();
  initFormHandlers();
  initFAQAccordion();
}

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  // Mark JS as loaded (enables animations in CSS)
  document.documentElement.classList.add('js-loaded');

  // Try to load server-side overrides JSON first, then init
  if (typeof loadServerOverrides === 'function') {
    loadServerOverrides().then(applyOverridesAndInit);
  } else {
    applyOverridesAndInit();
  }
});
