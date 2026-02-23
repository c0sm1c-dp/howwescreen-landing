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
          window.open(
            'https://twitter.com/intent/tweet?text=' +
            encodeURIComponent(text + ' ') +
            '&url=' + encodeURIComponent(url),
            '_blank'
          );
          break;
        case 'email': {
          const mailtoUrl =
            'mailto:?subject=' + encodeURIComponent(title) +
            '&body=' + encodeURIComponent(text + '\n\n' + url);
          // Use anchor click trick for reliable mailto handling
          const a = document.createElement('a');
          a.href = mailtoUrl;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break;
        }
        case 'whatsapp':
          window.open(
            'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url),
            '_blank'
          );
          break;
        case 'instagram':
          copyLink(btn, url, 'Link copied — paste it in your Instagram story or bio!');
          break;
      }
    });
  });
}

/* ---- Helpers ---- */

function copyLink(btn, url, customMsg) {
  const originalHTML = btn.innerHTML;
  const successText = customMsg || 'Copied!';
  navigator.clipboard.writeText(url).then(() => {
    const svgEl = btn.querySelector('svg');
    const svgHTML = svgEl ? svgEl.outerHTML : '';
    btn.innerHTML = svgHTML + ' ' + successText;
    btn.classList.add('share-option--copied');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('share-option--copied');
    }, 2500);
  }).catch(() => {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    const svgEl = btn.querySelector('svg');
    const svgHTML = svgEl ? svgEl.outerHTML : '';
    btn.innerHTML = svgHTML + ' ' + successText;
    btn.classList.add('share-option--copied');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('share-option--copied');
    }, 2500);
  });
}
