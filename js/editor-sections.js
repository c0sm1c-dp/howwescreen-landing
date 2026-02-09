/**
 * Editor Sections — Hover controls for section reordering + hide/show
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * When hovering a section in edit mode, shows a floating bar with:
 *   Section name  |  ⬆ Move Up  |  ⬇ Move Down  |  👁 Hide/Show
 *
 * Section order and hidden state persist in localStorage.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorSections] HWSEditor._internal not found — skipping section controls.');
    return;
  }

  // ---- Constants ----
  var ORDER_KEY   = 'hws-admin-section-order';
  var HIDDEN_KEY  = 'hws-admin-hidden-sections';
  var SECTION_SEL = 'main > .section';

  // ---- State ----
  var _bar = null;
  var _hoveredSection = null;
  var _isEditorActive = false;
  var _animating = false;

  // ---- Friendly section names ----
  var SECTION_NAMES = {
    'hero':         'Hero',
    'problem':      'The Problem',
    'voices':       'Voices',
    'solution':     'The Solution',
    'detox':        'Detox Challenge',
    'how-it-works': 'How It Works',
    'pricing':      'Pricing',
    'faq':          'FAQ'
  };

  // ---- Helpers ----

  /**
   * Get section + its trailing .section-transition sibling as a group.
   * Moving or hiding a section should always move/hide the transition too.
   */
  function getSectionGroup(sectionEl) {
    var group = [sectionEl];
    var next = sectionEl.nextElementSibling;
    if (next && next.classList.contains('section-transition')) {
      group.push(next);
    }
    return group;
  }

  function getAllSections() {
    return Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
  }

  function getSectionId(el) {
    return el.id || '';
  }

  function getSectionName(el) {
    var id = getSectionId(el);
    return SECTION_NAMES[id] || id || 'Section';
  }

  // ---- localStorage helpers ----

  function getSavedOrder() {
    try {
      var raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveOrder(orderArr) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(orderArr)); } catch (e) {}
  }

  function getHiddenSections() {
    try {
      var raw = localStorage.getItem(HIDDEN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHiddenSections(arr) {
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function getCurrentOrder() {
    return getAllSections().map(function(s) { return getSectionId(s); }).filter(Boolean);
  }

  // ---- Build Section Bar ----

  function createBar() {
    if (_bar) return;

    _bar = document.createElement('div');
    _bar.id = 'hws-section-bar';
    _bar.className = 'hws-section-bar';

    _bar.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });

    _bar.innerHTML =
      '<span class="hws-section-bar__name"></span>' +
      '<div class="hws-section-bar__actions">' +
        '<button type="button" class="hws-section-bar__btn" data-action="moveUp" title="Move Up">&#9650;</button>' +
        '<button type="button" class="hws-section-bar__btn" data-action="moveDown" title="Move Down">&#9660;</button>' +
        '<button type="button" class="hws-section-bar__btn hws-section-bar__btn--hide" data-action="toggleHide" title="Hide/Show">&#128065;</button>' +
      '</div>';

    // Button click handler
    _bar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn || !_hoveredSection) return;
      e.preventDefault();
      e.stopPropagation();

      var action = btn.getAttribute('data-action');
      if (action === 'moveUp')       moveSection(_hoveredSection, -1);
      else if (action === 'moveDown') moveSection(_hoveredSection, 1);
      else if (action === 'toggleHide') toggleSectionVisibility(_hoveredSection);
    });

    document.body.appendChild(_bar);
  }

  // ---- Position Bar ----

  function positionBar(sectionEl) {
    if (!_bar) return;

    var rect = sectionEl.getBoundingClientRect();
    var scrollY = window.scrollY || window.pageYOffset;
    var scrollX = window.scrollX || window.pageXOffset;

    var barW = _bar.offsetWidth || 260;

    _bar.style.left = (rect.left + scrollX + rect.width / 2 - barW / 2) + 'px';
    _bar.style.top  = (rect.top + scrollY + 12) + 'px';
  }

  function showBar(sectionEl) {
    if (_animating) return;

    _hoveredSection = sectionEl;
    createBar();

    // Update name
    _bar.querySelector('.hws-section-bar__name').textContent = getSectionName(sectionEl);

    // Update hide button text
    var hidden = getHiddenSections();
    var isHidden = hidden.indexOf(getSectionId(sectionEl)) !== -1;
    var hideBtn = _bar.querySelector('[data-action="toggleHide"]');
    hideBtn.innerHTML = isHidden ? '&#128065;&#65039; Show' : '&#128065; Hide';
    hideBtn.title = isHidden ? 'Show this section' : 'Hide this section';

    // Disable move buttons at edges
    var sections = getAllSections();
    var idx = sections.indexOf(sectionEl);
    var upBtn = _bar.querySelector('[data-action="moveUp"]');
    var downBtn = _bar.querySelector('[data-action="moveDown"]');
    upBtn.disabled = idx <= 0;
    downBtn.disabled = idx >= sections.length - 1;

    _bar.style.display = 'flex';
    positionBar(sectionEl);

    // Add hover outline to section
    sectionEl.classList.add('hws-section-hover');
  }

  function hideBar() {
    if (_bar) _bar.style.display = 'none';
    if (_hoveredSection) {
      _hoveredSection.classList.remove('hws-section-hover');
      _hoveredSection = null;
    }
  }

  // ---- Move Section (FLIP Animation) ----

  function moveSection(sectionEl, direction) {
    if (_animating) return;

    var sections = getAllSections();
    var idx = sections.indexOf(sectionEl);
    var targetIdx = idx + direction;

    if (targetIdx < 0 || targetIdx >= sections.length) return;

    _animating = true;
    var mainEl = sectionEl.parentElement;

    var movingGroup = getSectionGroup(sectionEl);
    var targetSection = sections[targetIdx];
    var targetGroup = getSectionGroup(targetSection);

    // 1. FLIP — capture old positions
    var allElements = movingGroup.concat(targetGroup);
    var oldRects = allElements.map(function(el) {
      return el.getBoundingClientRect();
    });

    // 2. Perform DOM move
    if (direction === -1) {
      // Move up: insert before target group's first element
      movingGroup.forEach(function(el) {
        mainEl.insertBefore(el, targetGroup[0]);
      });
    } else {
      // Move down: insert after target group's last element
      var afterEl = targetGroup[targetGroup.length - 1].nextSibling;
      movingGroup.forEach(function(el) {
        mainEl.insertBefore(el, afterEl);
      });
    }

    // 3. FLIP — capture new positions and animate
    allElements.forEach(function(el, i) {
      var newRect = el.getBoundingClientRect();
      var dx = oldRects[i].left - newRect.left;
      var dy = oldRects[i].top - newRect.top;

      if (dx === 0 && dy === 0) return;

      el.style.transition = 'none';
      el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';

      // Force reflow
      el.offsetHeight; // eslint-disable-line

      el.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
      el.style.transform = '';
    });

    // 4. Clean up after animation
    setTimeout(function() {
      allElements.forEach(function(el) {
        el.style.transition = '';
        el.style.transform = '';
      });
      _animating = false;

      // Save new order
      saveOrder(getCurrentOrder());

      // Reposition bar
      positionBar(sectionEl);
      showBar(sectionEl);

      api.showToast('Section moved');
    }, 380);
  }

  // ---- Toggle Section Visibility ----

  function toggleSectionVisibility(sectionEl) {
    var id = getSectionId(sectionEl);
    if (!id) return;

    var hidden = getHiddenSections();
    var idx = hidden.indexOf(id);
    var group = getSectionGroup(sectionEl);

    if (idx === -1) {
      // Hide it
      hidden.push(id);
      group.forEach(function(el) {
        el.style.display = 'none';
      });
      hideBar();
      api.showToast(getSectionName(sectionEl) + ' hidden');
    } else {
      // Show it
      hidden.splice(idx, 1);
      group.forEach(function(el) {
        el.style.display = '';
      });
      api.showToast(getSectionName(sectionEl) + ' visible');
    }

    saveHiddenSections(hidden);

    // Refresh bar state
    if (_hoveredSection) showBar(_hoveredSection);
  }

  // ---- Event Handlers ----

  function onMouseMove(e) {
    if (!_isEditorActive || _animating) return;

    // Don't show section bar while editing text
    if (api.getMode() === 'editing') {
      if (_hoveredSection) hideBar();
      return;
    }

    // Check if mouse is over the section bar itself
    if (_bar && _bar.contains(e.target)) return;

    // Find the section under cursor
    var el = e.target;
    var section = null;
    while (el && el !== document.body) {
      if (el.matches && el.matches(SECTION_SEL)) {
        section = el;
        break;
      }
      el = el.parentElement;
    }

    if (section && section !== _hoveredSection) {
      if (_hoveredSection) _hoveredSection.classList.remove('hws-section-hover');
      showBar(section);
    } else if (!section && _hoveredSection) {
      hideBar();
    }
  }

  function onMouseLeave(e) {
    // If mouse leaves viewport, hide bar
    if (!e.relatedTarget && !e.toElement) {
      hideBar();
    }
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseleave', onMouseLeave, false);
  }

  function deactivate() {
    _isEditorActive = false;
    hideBar();
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseleave', onMouseLeave, false);
    if (_bar) {
      _bar.remove();
      _bar = null;
    }
  }

  // ---- Register Hooks ----

  api.onEnterEditMode(function() {
    activate();
  });

  api.onExitEditMode(function() {
    deactivate();
  });

  // ---- Expose for site-renderer ----

  window.HWSSections = {
    restoreOrder: function() {
      var order = getSavedOrder();
      if (!order || !order.length) return;

      var mainEl = document.querySelector('main');
      if (!mainEl) return;

      // Build map of sections by ID
      var sections = getAllSections();
      var sectionMap = {};
      sections.forEach(function(s) {
        var id = getSectionId(s);
        if (id) sectionMap[id] = getSectionGroup(s);
      });

      // Reorder by appending in saved order
      order.forEach(function(id) {
        var group = sectionMap[id];
        if (group) {
          group.forEach(function(el) {
            mainEl.appendChild(el);
          });
        }
      });
    },

    restoreHidden: function() {
      var hidden = getHiddenSections();
      if (!hidden || !hidden.length) return;

      hidden.forEach(function(id) {
        var section = document.getElementById(id);
        if (!section) return;
        var group = getSectionGroup(section);
        group.forEach(function(el) {
          el.style.display = 'none';
        });
      });
    }
  };

})();
