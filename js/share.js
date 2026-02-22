/**
 * Share — Floating share FAB + inline share bars
 * Uses Web Share API on mobile, popover fallback on desktop
 */

function initShare() {
  setupShareFAB();
  setupShareBars();
}

/* ---- Floating Action Button ---- */

function setupShareFAB() {
  const fab = document.querySelector('.share-fab');
  const popover = document.querySelector('.share-popover');
  if (!fab || !popover) return;

  fab.addEventListener('click', (e) => {
    e.stopPropagation();

    // Try native share on mobile
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: 'Check this out — How We Screen',
        url: window.location.href,
      }).catch(() => {});
      return;
    }

    // Desktop: toggle popover
    const isOpen = popover.classList.contains('share-popover--open');
    popover.classList.toggle('share-popover--open');
    fab.setAttribute('aria-expanded', !isOpen);
  });

  // Close popover on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.share-fab-wrapper')) {
      popover.classList.remove('share-popover--open');
      fab.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      popover.classList.remove('share-popover--open');
      fab.setAttribute('aria-expanded', 'false');
    }
  });

  // Wire up popover share options
  setupShareOptions(popover);
}

/* ---- Inline Share Bars (blog articles) ---- */

function setupShareBars() {
  document.querySelectorAll('.share-bar').forEach((bar) => {
    setupShareOptions(bar);
  });
}

/* ---- Share Option Handlers ---- */

function setupShareOptions(container) {
  container.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const action = btn.getAttribute('data-share');
      const url = window.location.href;
      const title = document.title;
      const text = document.querySelector('meta[name="description"]')?.content || title;

      switch (action) {
        case 'copy':
          copyLink(btn, url);
          break;
        case 'twitter':
          openPopup(
            'https://twitter.com/intent/tweet?text=' +
            encodeURIComponent(text + ' ') +
            '&url=' + encodeURIComponent(url),
            'Share on X'
          );
          break;
        case 'email':
          window.location.href =
            'mailto:?subject=' + encodeURIComponent(title) +
            '&body=' + encodeURIComponent(text + '\n\n' + url);
          break;
        case 'whatsapp':
          openPopup(
            'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url),
            'Share on WhatsApp'
          );
          break;
      }
    });
  });
}

/* ---- Helpers ---- */

function copyLink(btn, url) {
  const originalText = btn.textContent;
  navigator.clipboard.writeText(url).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('share-option--copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('share-option--copied');
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  });
}

function openPopup(url, title) {
  const w = 600;
  const h = 400;
  const left = (screen.width - w) / 2;
  const top = (screen.height - h) / 2;
  window.open(url, title, 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',toolbar=0,menubar=0');
}
