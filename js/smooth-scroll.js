/**
 * Smooth Scroll — Anchor navigation with nav height offset
 */

function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const nav = document.getElementById('nav');
    const navHeight = nav ? nav.offsetHeight : 0;
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

    window.scrollTo({
      top: targetPosition,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    });

    // Update URL hash without scrolling
    history.pushState(null, null, targetId);
  });
}
