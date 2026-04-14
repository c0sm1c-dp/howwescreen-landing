/**
 * testimonial-stack.js
 * Vanilla JS stacked testimonial carousel.
 * Must run after initSiteRenderer() has injected content into data-hws elements.
 */

function initTestimonialStack() {
  var stack    = document.getElementById('testimonial-stack');
  var pagNav   = document.getElementById('testimonial-pagination');
  if (!stack) return;

  // Collect cards and filter out empty ones (no quote body text)
  var allCards = Array.prototype.slice.call(stack.querySelectorAll('.voice-card'));
  var cards = allCards.filter(function(card) {
    var body = card.querySelector('.voice-card__body');
    return body && body.textContent.trim() !== '';
  });

  // Hide cards with no content
  allCards.forEach(function(card) {
    if (cards.indexOf(card) === -1) {
      card.style.display = 'none';
    }
  });

  // Nothing to show
  if (cards.length === 0) {
    stack.style.display = 'none';
    if (pagNav) pagNav.style.display = 'none';
    return;
  }

  var total       = cards.length;
  var activeIndex = 0;
  var BEHIND      = 2; // how many cards peek behind the active

  // ── PAGINATION DOTS ──────────────────────────────────────────────────────
  var dots = [];
  if (pagNav) {
    cards.forEach(function(_, i) {
      var btn = document.createElement('button');
      btn.className  = 'testimonial-dot';
      btn.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      btn.addEventListener('click', function() { navigate(i); });
      pagNav.appendChild(btn);
      dots.push(btn);
    });
  }

  // ── POSITION UPDATE ───────────────────────────────────────────────────────
  function updatePositions() {
    cards.forEach(function(card, i) {
      var pos = (i - activeIndex + total) % total;
      card.setAttribute('data-pos', pos <= BEHIND ? String(pos) : 'hidden');
      card.style.transform = ''; // reset any drag offset
    });

    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === activeIndex);
      dot.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
    });
  }

  // ── NAVIGATION ───────────────────────────────────────────────────────────
  function navigate(newIndex) {
    activeIndex = ((newIndex % total) + total) % total;
    updatePositions();
  }

  // ── DRAG / SWIPE ─────────────────────────────────────────────────────────
  var dragging   = false;
  var dragStartX = 0;
  var dragNowX   = 0;
  var THRESHOLD  = 50;

  function clientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    // Only respond on the active (front) card
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
    if (frontCard) {
      frontCard.style.transform = 'translateX(' + offset + 'px)';
    }
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

  // ── KEYBOARD ─────────────────────────────────────────────────────────────
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

  // ── INIT ─────────────────────────────────────────────────────────────────
  updatePositions();
}
