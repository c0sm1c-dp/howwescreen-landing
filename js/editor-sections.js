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
        '<button type="button" class="hws-section-bar__btn" data-action="editSection" title="Section Settings">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z"/></svg>' +
        '</button>' +
        '<button type="button" class="hws-section-bar__btn" data-action="duplicate" title="Duplicate Section">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M4 10H3a1 1 0 01-1-1V3a1 1 0 011-1h6a1 1 0 011 1v1"/></svg>' +
        '</button>' +
        '<span class="hws-section-bar__sep"></span>' +
        '<button type="button" class="hws-section-bar__btn" data-action="moveUp" title="Move Up">&#9650;</button>' +
        '<button type="button" class="hws-section-bar__btn" data-action="moveDown" title="Move Down">&#9660;</button>' +
        '<span class="hws-section-bar__sep"></span>' +
        '<button type="button" class="hws-section-bar__btn hws-section-bar__btn--hide" data-action="toggleHide" title="Hide/Show">&#128065;</button>' +
        '<button type="button" class="hws-section-bar__btn hws-section-bar__btn--delete" data-action="deleteSection" title="Delete Section">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="2,4 12,4"/><path d="M5 4V2.5A.5.5 0 015.5 2h3a.5.5 0 01.5.5V4"/><path d="M3 4l.7 8.1a1 1 0 001 .9h4.6a1 1 0 001-.9L11 4"/></svg>' +
        '</button>' +
      '</div>';

    // Button click handler
    _bar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn || !_hoveredSection) return;
      e.preventDefault();
      e.stopPropagation();

      var action = btn.getAttribute('data-action');
      if (action === 'moveUp')         moveSection(_hoveredSection, -1);
      else if (action === 'moveDown')   moveSection(_hoveredSection, 1);
      else if (action === 'toggleHide') toggleSectionVisibility(_hoveredSection);
      else if (action === 'duplicate')  duplicateSection(_hoveredSection);
      else if (action === 'deleteSection') deleteSection(_hoveredSection);
      else if (action === 'editSection')   editSectionSettings(_hoveredSection);
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

  // ---- Duplicate Section ----

  function duplicateSection(sectionEl) {
    var id = getSectionId(sectionEl);
    if (!id) return;

    _animating = true;

    // Generate a new unique ID
    var copyNum = 1;
    while (document.getElementById(id + '-copy-' + copyNum)) {
      copyNum++;
    }
    var newId = id + '-copy-' + copyNum;

    // Clone section and its transition sibling
    var group = getSectionGroup(sectionEl);
    var mainEl = sectionEl.parentElement;
    var afterEl = group[group.length - 1].nextSibling;

    var clonedGroup = [];
    group.forEach(function(el, i) {
      var clone = el.cloneNode(true);

      // Update IDs on the section clone (first element)
      if (i === 0) {
        clone.id = newId;
        clone.classList.add('section');

        // Re-key all data-hws children with a __copy suffix
        var hwsChildren = clone.querySelectorAll('[data-hws]');
        for (var j = 0; j < hwsChildren.length; j++) {
          var oldKey = hwsChildren[j].getAttribute('data-hws');
          var newKey = oldKey.replace(id + '.', newId + '.');
          hwsChildren[j].setAttribute('data-hws', newKey);
        }

        // Also re-key data-hws-features children
        var featChildren = clone.querySelectorAll('[data-hws-features]');
        for (var k = 0; k < featChildren.length; k++) {
          var oldFeatKey = featChildren[k].getAttribute('data-hws-features');
          var newFeatKey = oldFeatKey.replace(id + '.', newId + '.');
          featChildren[k].setAttribute('data-hws-features', newFeatKey);
        }
      }

      // Remove any editor state classes
      clone.classList.remove('hws-section-hover', 'hws-editor-selected');

      clonedGroup.push(clone);
    });

    // Insert clones after the original group
    clonedGroup.forEach(function(clone) {
      mainEl.insertBefore(clone, afterEl);
    });

    // FLIP animate the new section in
    var newSection = clonedGroup[0];
    newSection.style.opacity = '0';
    newSection.style.transform = 'translateY(-20px)';
    newSection.offsetHeight; // force reflow

    newSection.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    newSection.style.opacity = '1';
    newSection.style.transform = 'translateY(0)';

    // Add the friendly name
    SECTION_NAMES[newId] = (SECTION_NAMES[id] || id) + ' (Copy)';

    // Copy overrides from original section to new section
    var overrides = api.getOverrides ? api.getOverrides() : {};
    var keys = Object.keys(overrides);
    for (var m = 0; m < keys.length; m++) {
      if (keys[m].indexOf(id + '.') === 0) {
        var newOverrideKey = keys[m].replace(id + '.', newId + '.');
        overrides[newOverrideKey] = overrides[keys[m]];
      }
      // Also copy section-level styles (section.SECTIONID.*)
      if (keys[m].indexOf('section.' + id + '.') === 0) {
        var newSectionKey = keys[m].replace('section.' + id + '.', 'section.' + newId + '.');
        overrides[newSectionKey] = overrides[keys[m]];
      }
    }
    if (api.setOverrides) api.setOverrides(overrides);

    setTimeout(function() {
      newSection.style.transition = '';
      newSection.style.transform = '';
      _animating = false;

      // Save new order
      saveOrder(getCurrentOrder());

      // Show the new section's bar
      showBar(newSection);

      api.showToast('Section duplicated');
    }, 380);
  }

  // ---- Delete Section ----

  var _deletedSection = null;     // { group: [...DOM], afterEl, parentEl, id, timeout }

  function deleteSection(sectionEl) {
    var id = getSectionId(sectionEl);
    if (!id) return;

    // Confirm
    if (!confirm('Delete "' + getSectionName(sectionEl) + '"? You can undo within 10 seconds.')) return;

    var group = getSectionGroup(sectionEl);
    var mainEl = sectionEl.parentElement;
    var afterEl = group[group.length - 1].nextSibling;

    // Save for undo
    if (_deletedSection && _deletedSection.timeout) {
      clearTimeout(_deletedSection.timeout);
    }

    _deletedSection = {
      group: group,
      afterEl: afterEl,
      parentEl: mainEl,
      id: id
    };

    // Animate out
    sectionEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    sectionEl.style.opacity = '0';
    sectionEl.style.transform = 'scale(0.97)';

    hideBar();

    setTimeout(function() {
      // Remove from DOM
      group.forEach(function(el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });

      // Remove from hidden list if present
      var hidden = getHiddenSections();
      var hidx = hidden.indexOf(id);
      if (hidx !== -1) {
        hidden.splice(hidx, 1);
        saveHiddenSections(hidden);
      }

      // Save new order
      saveOrder(getCurrentOrder());

      // Remove section-level overrides
      var overrides = api.getOverrides ? api.getOverrides() : {};
      var toRemove = [];
      var okeys = Object.keys(overrides);
      for (var n = 0; n < okeys.length; n++) {
        if (okeys[n].indexOf(id + '.') === 0 || okeys[n].indexOf('section.' + id + '.') === 0) {
          toRemove.push(okeys[n]);
        }
      }
      for (var r = 0; r < toRemove.length; r++) {
        delete overrides[toRemove[r]];
      }
      if (api.setOverrides) api.setOverrides(overrides);

      // Show undo toast
      showUndoToast(id);
    }, 280);
  }

  function showUndoToast(sectionId) {
    // Custom undo toast with clickable "Undo" button
    var toast = document.createElement('div');
    toast.className = 'hws-section-undo-toast';
    toast.innerHTML =
      '<span>"' + (SECTION_NAMES[sectionId] || sectionId) + '" deleted</span>' +
      '<button type="button" class="hws-section-undo-btn">Undo</button>';

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(function() {
      toast.classList.add('hws-section-undo-toast--visible');
    });

    var undoBtn = toast.querySelector('.hws-section-undo-btn');
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.remove('hws-section-undo-toast--visible');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }

    undoBtn.addEventListener('click', function() {
      if (!_deletedSection || _deletedSection.id !== sectionId) return;

      // Re-insert the group
      var ds = _deletedSection;
      ds.group.forEach(function(el) {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
        ds.parentEl.insertBefore(el, ds.afterEl);
      });

      _deletedSection = null;

      // Save order
      saveOrder(getCurrentOrder());

      api.showToast('Section restored');
      dismiss();
    });

    // Auto-dismiss after 10 seconds
    _deletedSection.timeout = setTimeout(function() {
      _deletedSection = null;
      dismiss();
    }, 10000);
  }

  // ---- Edit Section Settings ----

  var SECTION_STYLE_KEY = 'hws-admin-section-styles';

  function getSectionStyles() {
    try {
      var raw = localStorage.getItem(SECTION_STYLE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveSectionStyles(styles) {
    try { localStorage.setItem(SECTION_STYLE_KEY, JSON.stringify(styles)); } catch (e) {}
  }

  function getSectionStyleValue(sectionId, prop, fallback) {
    var styles = getSectionStyles();
    if (styles[sectionId] && styles[sectionId][prop] !== undefined) {
      return styles[sectionId][prop];
    }
    return fallback;
  }

  function setSectionStyleValue(sectionId, prop, value) {
    var styles = getSectionStyles();
    if (!styles[sectionId]) styles[sectionId] = {};
    styles[sectionId][prop] = value;
    saveSectionStyles(styles);
  }

  function applySectionStyle(sectionEl, prop, value) {
    switch (prop) {
      case 'bgColor':
        sectionEl.style.backgroundColor = value || '';
        break;
      case 'paddingTop':
        sectionEl.style.paddingTop = value ? value + 'rem' : '';
        break;
      case 'paddingBottom':
        sectionEl.style.paddingBottom = value ? value + 'rem' : '';
        break;
      case 'maxWidth':
        sectionEl.style.maxWidth = value ? value + 'px' : '';
        if (value) {
          sectionEl.style.marginLeft = 'auto';
          sectionEl.style.marginRight = 'auto';
        } else {
          sectionEl.style.marginLeft = '';
          sectionEl.style.marginRight = '';
        }
        break;
      case 'textColor':
        sectionEl.style.color = value || '';
        break;
    }
  }

  function editSectionSettings(sectionEl) {
    var id = getSectionId(sectionEl);
    if (!id) return;

    // Ensure panel is created
    api.createPanel();

    api.openPanel('element'); // Open as element tab type
    api.setPanelTitle('Section: ' + getSectionName(sectionEl));

    var bgColor = getSectionStyleValue(id, 'bgColor', '');
    var paddingTop = getSectionStyleValue(id, 'paddingTop', '');
    var paddingBottom = getSectionStyleValue(id, 'paddingBottom', '');
    var maxWidth = getSectionStyleValue(id, 'maxWidth', '');
    var textColor = getSectionStyleValue(id, 'textColor', '');

    var html =
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Background Color</label>' +
        '<div class="hws-editor-color-row">' +
          '<input type="color" class="hws-editor-color-picker" id="hws-sec-bg-color" value="' + (bgColor || '#ffffff') + '">' +
          '<input type="text" class="hws-editor-color-hex" id="hws-sec-bg-hex" value="' + api.escAttr(bgColor) + '" maxlength="7" placeholder="none">' +
          '<button type="button" class="hws-editor-btn hws-editor-btn--small" id="hws-sec-bg-clear" title="Clear">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Text Color</label>' +
        '<div class="hws-editor-color-row">' +
          '<input type="color" class="hws-editor-color-picker" id="hws-sec-text-color" value="' + (textColor || '#1a1a2e') + '">' +
          '<input type="text" class="hws-editor-color-hex" id="hws-sec-text-hex" value="' + api.escAttr(textColor) + '" maxlength="7" placeholder="none">' +
          '<button type="button" class="hws-editor-btn hws-editor-btn--small" id="hws-sec-text-clear" title="Clear">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__divider"></div>' +
      '<div class="hws-editor-panel__field hws-editor-panel__field--range">' +
        '<label class="hws-editor-label">Padding Top</label>' +
        '<div class="hws-editor-range-row">' +
          '<input type="range" class="hws-editor-range" id="hws-sec-pad-top" value="' + (paddingTop || 5) + '" min="0" max="12" step="0.5">' +
          '<span class="hws-editor-range-value" id="hws-sec-pad-top-val">' + (paddingTop || 5) + 'rem</span>' +
        '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__field hws-editor-panel__field--range">' +
        '<label class="hws-editor-label">Padding Bottom</label>' +
        '<div class="hws-editor-range-row">' +
          '<input type="range" class="hws-editor-range" id="hws-sec-pad-bottom" value="' + (paddingBottom || 5) + '" min="0" max="12" step="0.5">' +
          '<span class="hws-editor-range-value" id="hws-sec-pad-bottom-val">' + (paddingBottom || 5) + 'rem</span>' +
        '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__divider"></div>' +
      '<div class="hws-editor-panel__field hws-editor-panel__field--range">' +
        '<label class="hws-editor-label">Max Width</label>' +
        '<div class="hws-editor-range-row">' +
          '<input type="range" class="hws-editor-range" id="hws-sec-max-width" value="' + (maxWidth || 1600) + '" min="600" max="1600" step="50">' +
          '<span class="hws-editor-range-value" id="hws-sec-max-width-val">' + (maxWidth ? maxWidth + 'px' : 'none') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__divider"></div>' +
      '<div class="hws-editor-panel__actions">' +
        '<button class="hws-editor-btn hws-editor-btn--reset" id="hws-sec-reset-all">Reset Section Styles</button>' +
      '</div>';

    api.setPanelBody(html);

    // ---- Bind controls ----

    var panel = api.getPanel();
    if (!panel) return;

    // Background color
    var bgPicker = panel.querySelector('#hws-sec-bg-color');
    var bgHex = panel.querySelector('#hws-sec-bg-hex');
    var bgClear = panel.querySelector('#hws-sec-bg-clear');

    if (bgPicker) {
      bgPicker.addEventListener('input', function() {
        bgHex.value = bgPicker.value;
        setSectionStyleValue(id, 'bgColor', bgPicker.value);
        applySectionStyle(sectionEl, 'bgColor', bgPicker.value);
      });
    }
    if (bgHex) {
      bgHex.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(bgHex.value)) {
          bgPicker.value = bgHex.value;
          setSectionStyleValue(id, 'bgColor', bgHex.value);
          applySectionStyle(sectionEl, 'bgColor', bgHex.value);
        }
      });
    }
    if (bgClear) {
      bgClear.addEventListener('click', function() {
        bgHex.value = '';
        setSectionStyleValue(id, 'bgColor', '');
        applySectionStyle(sectionEl, 'bgColor', '');
      });
    }

    // Text color
    var textPicker = panel.querySelector('#hws-sec-text-color');
    var textHex = panel.querySelector('#hws-sec-text-hex');
    var textClear = panel.querySelector('#hws-sec-text-clear');

    if (textPicker) {
      textPicker.addEventListener('input', function() {
        textHex.value = textPicker.value;
        setSectionStyleValue(id, 'textColor', textPicker.value);
        applySectionStyle(sectionEl, 'textColor', textPicker.value);
      });
    }
    if (textHex) {
      textHex.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(textHex.value)) {
          textPicker.value = textHex.value;
          setSectionStyleValue(id, 'textColor', textHex.value);
          applySectionStyle(sectionEl, 'textColor', textHex.value);
        }
      });
    }
    if (textClear) {
      textClear.addEventListener('click', function() {
        textHex.value = '';
        setSectionStyleValue(id, 'textColor', '');
        applySectionStyle(sectionEl, 'textColor', '');
      });
    }

    // Padding Top
    var padTop = panel.querySelector('#hws-sec-pad-top');
    var padTopVal = panel.querySelector('#hws-sec-pad-top-val');
    if (padTop) {
      padTop.addEventListener('input', function() {
        padTopVal.textContent = padTop.value + 'rem';
        setSectionStyleValue(id, 'paddingTop', padTop.value);
        applySectionStyle(sectionEl, 'paddingTop', padTop.value);
      });
    }

    // Padding Bottom
    var padBottom = panel.querySelector('#hws-sec-pad-bottom');
    var padBottomVal = panel.querySelector('#hws-sec-pad-bottom-val');
    if (padBottom) {
      padBottom.addEventListener('input', function() {
        padBottomVal.textContent = padBottom.value + 'rem';
        setSectionStyleValue(id, 'paddingBottom', padBottom.value);
        applySectionStyle(sectionEl, 'paddingBottom', padBottom.value);
      });
    }

    // Max Width
    var maxW = panel.querySelector('#hws-sec-max-width');
    var maxWVal = panel.querySelector('#hws-sec-max-width-val');
    if (maxW) {
      maxW.addEventListener('input', function() {
        var val = parseInt(maxW.value);
        if (val >= 1600) {
          maxWVal.textContent = 'none';
          setSectionStyleValue(id, 'maxWidth', '');
          applySectionStyle(sectionEl, 'maxWidth', '');
        } else {
          maxWVal.textContent = val + 'px';
          setSectionStyleValue(id, 'maxWidth', val);
          applySectionStyle(sectionEl, 'maxWidth', val);
        }
      });
    }

    // Reset all section styles
    var resetAll = panel.querySelector('#hws-sec-reset-all');
    if (resetAll) {
      resetAll.addEventListener('click', function() {
        var styles = getSectionStyles();
        delete styles[id];
        saveSectionStyles(styles);

        // Clear inline styles
        sectionEl.style.backgroundColor = '';
        sectionEl.style.color = '';
        sectionEl.style.paddingTop = '';
        sectionEl.style.paddingBottom = '';
        sectionEl.style.maxWidth = '';
        sectionEl.style.marginLeft = '';
        sectionEl.style.marginRight = '';

        // Re-render panel
        editSectionSettings(sectionEl);
        api.showToast('Section styles reset');
      });
    }
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
    },

    restoreSectionStyles: function() {
      var styles = getSectionStyles();
      if (!styles || Object.keys(styles).length === 0) return;

      Object.keys(styles).forEach(function(sectionId) {
        var section = document.getElementById(sectionId);
        if (!section) return;
        var sectionStyle = styles[sectionId];
        if (sectionStyle.bgColor) applySectionStyle(section, 'bgColor', sectionStyle.bgColor);
        if (sectionStyle.textColor) applySectionStyle(section, 'textColor', sectionStyle.textColor);
        if (sectionStyle.paddingTop) applySectionStyle(section, 'paddingTop', sectionStyle.paddingTop);
        if (sectionStyle.paddingBottom) applySectionStyle(section, 'paddingBottom', sectionStyle.paddingBottom);
        if (sectionStyle.maxWidth) applySectionStyle(section, 'maxWidth', sectionStyle.maxWidth);
      });
    }
  };

})();
