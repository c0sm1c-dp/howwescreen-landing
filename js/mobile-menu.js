/**
 * Mobile Menu — Hamburger toggle with focus trap and body scroll lock
 */

function initMobileMenu() {
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('nav-mobile-menu');
  if (!burger || !menu) return;

  const menuLinks = menu.querySelectorAll('a, button');
  let isOpen = false;
  let scrollPosition = 0;

  function openMenu() {
    isOpen = true;
    scrollPosition = window.scrollY;
    burger.setAttribute('aria-expanded', 'true');
    menu.classList.add('nav__menu--open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${scrollPosition}px`;

    // Focus first link
    if (menuLinks.length > 0) {
      menuLinks[0].focus();
    }
  }

  function closeMenu() {
    isOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('nav__menu--open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
    burger.focus();
  }

  function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
  }

  // Burger click
  burger.addEventListener('click', toggleMenu);

  // Close on link click (smooth scroll navigation)
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) closeMenu();
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeMenu();
    }
  });

  // Focus trap
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen) return;

    const focusable = [burger, ...menuLinks];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
