/**
 * testimonial-stack.js
 * Editorial testimonial carousel — single card, serif quote, initials avatar,
 * line navigation, prev/next arrows, swipe/drag support.
 * Must run after initSiteRenderer() has injected content into data-hws elements.
 */

function initTestimonialStack() {
  var stack    = document.getElementById('testimonial-stack');
  var pagNav   = document.getElementById('testimonial-pagination');
  var counterEl = document.getElementById('testimonial-counter');
  var prevBtn  = document.getElementById('testimonial-prev');
  var nextBtn  = document.getElementById('testimonial-next');

  if (!stack) return;

  // Collect cards, filter out empty ones
  var allCards = Array.prototype.slice.call(stack.querySelectorAll('.voice-card'));
  var cards = allCards.filter(function(card) {
    var body = card.querySelector('.voice-card__body');
    return body && body.textContent.trim() !== '';
  });

  // Hide empty cards
  allCards.forEach(function(card) {
    if (cards.indexOf(card) === -1) card.style.display = 'none';
  });

  if (cards.length === 0) {
    stack.style.display = 'none';
    var ctrlWrap = prevBtn && prevBtn.parentElement;
    if (ctrlWrap) ctrlWrap.style.display = 'none';
    return;
  }

  var total       = cards.length;
  var activeIndex = 0;

  // ── INJECT BIG FADED INDEX NUMBER ──────────────────────────────────────────
  var numEl = document.createElement('div');
  numEl.className = 'et-number';
  numEl.setAttribute('aria-hidden', 'true');
  stack.insertBefore(numEl, stack.firstChild);

  // ── INJECT AVATAR INTO EACH CARD FOOTER ────────────────────────────────────
  cards.forEach(function(card) {
    var footer = card.querySelector('.voice-card__footer');
    if (!footer) return;
    var avatarDiv = document.createElement('div');
    avatarDiv.className = 'voice-card__avatar';
    avatarDiv.setAttribute('aria-hidden', 'true');
    footer.insertBefore(avatarDiv, footer.firstChild);
  });

  // ── LINE NAV ────────────────────────────────────────────────────────────────
  var lines = [];
  if (pagNav) {
    cards.forEach(function(_, i) {
      var btn = document.createElement('button');
      btn.className = 'testimonial-line';
      btn.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      btn.addEventListener('click', function() { navigate(i); });
      pagNav.appendChild(btn);
      lines.push(btn);
    });
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function getInitials(nameEl) {
    if (!nameEl) return '?';
    var raw = (nameEl.textContent || '').trim();
    // Strip leading dash, em-dash, @
    var name = raw.replace(/^[\u2014\-@\s]+/, '').trim();
    if (!name) return '?';
    var parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // ── POSITION UPDATE ─────────────────────────────────────────────────────────
  function updatePositions() {
    // Update big number
    numEl.textContent = pad(activeIndex + 1);

    // Update counter
    if (counterEl) counterEl.textContent = pad(activeIndex + 1) + ' / ' + pad(total);

    cards.forEach(function(card, i) {
      var pos = (i - activeIndex + total) % total;
      card.setAttribute('data-pos', pos === 0 ? '0' : 'hidden');
      card.style.transform = ''; // clear any drag offset

      // Update avatar initials for the active card
      if (pos === 0) {
        var nameEl   = card.querySelector('.voice-card__name');
        var avatarEl = card.querySelector('.voice-card__avatar');
        if (avatarEl) avatarEl.textContent = getInitials(nameEl);
      }
    });

    lines.forEach(function(line, i) {
      line.classList.toggle('active', i === activeIndex);
      line.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
    });
  }

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  function navigate(newIndex) {
    activeIndex = ((newIndex % total) + total) % total;
    updatePositions();
  }

  // Prev / Next buttons
  if (prevBtn) prevBtn.addEventListener('click', function() { navigate(activeIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { navigate(activeIndex + 1); });

  // ── DRAG / SWIPE ─────────────────────────────────────────────────────────────
  var dragging   = false;
  var dragStartX = 0;
  var dragNowX   = 0;
  var THRESHOLD  = 50;

  function clientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    if (e.currentTarget.getAttribute('data-pos') !== '0') return;
    dragging   = true;
    dragStartX = clientX(e);
    dragNowX   = dragStartX;
    e.currentTarget.classList.add('is-dragging');
  }

  function onDragMove(e) {
    if (!dragging) return;
    dragNowX = clientX(e);
    var offset = dragNowX - dragStartX;
    var frontCard = cards[activeIndex];
    if (frontCard) frontCard.style.transform = 'translateX(' + offset + 'px)';
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    var offset    = dragNowX - dragStartX;
    var frontCard = cards[activeIndex];
    if (frontCard) frontCard.classList.remove('is-dragging');
    if (Math.abs(offset) > THRESHOLD) {
      navigate(activeIndex + (offset < 0 ? 1 : -1));
    } else {
      updatePositions(); // snap back
    }
  }

  cards.forEach(function(card) {
    card.addEventListener('mousedown',  onDragStart);
    card.addEventListener('touchstart', onDragStart, { passive: true });
  });

  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('mouseup',   onDragEnd);
  window.addEventListener('touchend',  onDragEnd);

  // ── KEYBOARD ─────────────────────────────────────────────────────────────────
  stack.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      navigate(activeIndex + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigate(activeIndex - 1);
    }
  });

  // ── INIT ─────────────────────────────────────────────────────────────────────
  updatePositions();
}
