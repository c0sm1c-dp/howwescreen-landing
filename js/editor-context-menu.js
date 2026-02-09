/**
 * Editor Context Menu — Right-click menu for elements and sections
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Right-click on a [data-hws] element: Edit, Duplicate, Reset to Default, Copy Content
 * Right-click on a section: Edit Section, Duplicate, Move Up/Down, Hide/Show, Delete
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorContextMenu] HWSEditor._internal not found — skipping context menu.');
    return;
  }

  // ---- State ----
  var _menu = null;
  var _isEditorActive = false;
  var _targetEl = null;       // the [data-hws] element or section
  var _targetType = null;     // 'element' | 'section'

  var SECTION_SEL = 'main > .section';

  // ---- Create Menu ----

  function createMenu() {
    if (_menu) return;

    _menu = document.createElement('div');
    _menu.className = 'hws-context-menu';
    _menu.style.display = 'none';

    _menu.addEventListener('click', function(e) {
      var item = e.target.closest('[data-ctx-action]');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();

      var action = item.getAttribute('data-ctx-action');
      handleAction(action);
      hideMenu();
    });

    // Prevent bubbling
    _menu.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });

    document.body.appendChild(_menu);
  }

  // ---- Show / Hide ----

  function showMenu(x, y, items) {
    createMenu();

    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.separator) {
        html += '<div class="hws-context-menu__sep"></div>';
      } else {
        var cls = 'hws-context-menu__item';
        if (item.danger) cls += ' hws-context-menu__item--danger';
        html += '<button class="' + cls + '" data-ctx-action="' + item.action + '">' +
          (item.icon ? '<span class="hws-context-menu__icon">' + item.icon + '</span>' : '') +
          '<span>' + item.label + '</span>' +
        '</button>';
      }
    }

    _menu.innerHTML = html;
    _menu.style.display = 'block';

    // Position (ensure it stays in viewport)
    var menuW = _menu.offsetWidth || 200;
    var menuH = _menu.offsetHeight || 200;
    var winW = window.innerWidth;
    var winH = window.innerHeight;

    var left = x;
    var top = y;

    if (left + menuW > winW - 8) left = winW - menuW - 8;
    if (top + menuH > winH - 8) top = winH - menuH - 8;
    if (left < 8) left = 8;
    if (top < 8) top = 8;

    _menu.style.left = left + 'px';
    _menu.style.top = top + 'px';
  }

  function hideMenu() {
    if (_menu) _menu.style.display = 'none';
    _targetEl = null;
    _targetType = null;
  }

  // ---- Build Menu Items ----

  function getElementMenuItems(el) {
    var key = api.getHwsKey(el);
    var isImg = key && key.indexOf('img.') === 0;

    var items = [
      { action: 'edit', label: 'Edit', icon: '✏️' }
    ];

    if (!isImg) {
      items.push({ action: 'copy-content', label: 'Copy Content', icon: '📋' });
    }

    items.push({ separator: true });
    items.push({ action: 'reset', label: 'Reset to Default', icon: '↺' });

    return items;
  }

  function getSectionMenuItems(sectionEl) {
    var id = sectionEl.id;
    var sections = Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
    var idx = sections.indexOf(sectionEl);

    var hiddenRaw = [];
    try {
      var raw = localStorage.getItem('hws-admin-hidden-sections');
      if (raw) hiddenRaw = JSON.parse(raw);
    } catch (e) {}

    var isHidden = hiddenRaw.indexOf(id) !== -1;

    var items = [
      { action: 'section-edit', label: 'Section Settings', icon: '⚙️' },
      { action: 'section-duplicate', label: 'Duplicate Section', icon: '📋' },
      { separator: true },
      { action: 'section-move-up', label: 'Move Up', icon: '▲' },
      { action: 'section-move-down', label: 'Move Down', icon: '▼' },
      { separator: true },
      { action: 'section-toggle-hide', label: isHidden ? 'Show Section' : 'Hide Section', icon: isHidden ? '👁️' : '🙈' },
      { separator: true },
      { action: 'section-delete', label: 'Delete Section', icon: '🗑️', danger: true }
    ];

    // Disable move if at edges
    if (idx <= 0) items[3].disabled = true;
    if (idx >= sections.length - 1) items[4].disabled = true;

    return items;
  }

  // ---- Handle Actions ----

  function handleAction(action) {
    if (!_targetEl) return;

    switch (action) {
      case 'edit':
        // Select the element and open panel
        var hwsEl = findHwsElement(_targetEl);
        if (hwsEl) {
          // Simulate click to select
          var key = api.getHwsKey(hwsEl);
          if (key) {
            api.openPanel('element');
          }
        }
        break;

      case 'copy-content':
        var copyEl = findHwsElement(_targetEl);
        if (copyEl) {
          var text = copyEl.textContent || copyEl.innerText || '';
          copyToClipboard(text);
          api.showToast('Content copied');
        }
        break;

      case 'reset':
        var resetEl = findHwsElement(_targetEl);
        if (resetEl) {
          var resetKey = api.getHwsKey(resetEl);
          if (resetKey) {
            api.pushUndo();
            var overrides = api.getOverrides();
            delete overrides[resetKey];
            api.setOverrides(overrides);

            // Re-apply default
            var defaultVal = api.getValue(resetKey);
            if (resetKey.indexOf('img.') === 0) {
              // Re-show SVG, remove img
              var uploadedImg = resetEl.querySelector('img[data-hws-img]');
              if (uploadedImg) uploadedImg.remove();
              var svg = resetEl.querySelector('svg');
              if (svg) svg.style.display = '';
            } else if (api.isRichTextKey(resetKey)) {
              resetEl.innerHTML = defaultVal;
            } else {
              resetEl.textContent = defaultVal;
            }

            api.updateBadge();
            api.showToast('Reset to default');
          }
        }
        break;

      case 'section-edit':
      case 'section-duplicate':
      case 'section-move-up':
      case 'section-move-down':
      case 'section-toggle-hide':
      case 'section-delete':
        // Dispatch to section bar's click handler by simulating button clicks
        dispatchSectionAction(action, _targetEl);
        break;
    }
  }

  function dispatchSectionAction(action, sectionEl) {
    // Find the section bar and simulate the corresponding button click
    var bar = document.getElementById('hws-section-bar');
    if (!bar) return;

    var actionMap = {
      'section-edit': 'editSection',
      'section-duplicate': 'duplicate',
      'section-move-up': 'moveUp',
      'section-move-down': 'moveDown',
      'section-toggle-hide': 'toggleHide',
      'section-delete': 'deleteSection'
    };

    var dataAction = actionMap[action];
    if (!dataAction) return;

    // We need to first trigger section hover on this section so the bar targets it
    // Then click the corresponding button
    var btn = bar.querySelector('[data-action="' + dataAction + '"]');
    if (btn) {
      // Make sure the section bar is targeting this section
      // Fire a synthetic mousemove to set _hoveredSection
      var rect = sectionEl.getBoundingClientRect();
      var syntheticEvent = new MouseEvent('mousemove', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + 20,
        bubbles: true
      });
      document.dispatchEvent(syntheticEvent);

      // Small delay to let the section bar update
      setTimeout(function() {
        btn.click();
      }, 50);
    }
  }

  // ---- Helpers ----

  function findHwsElement(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.hasAttribute && (el.hasAttribute('data-hws') || el.hasAttribute('data-hws-features'))) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function findSection(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.matches && el.matches(SECTION_SEL)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  // ---- Event Handler ----

  function onContextMenu(e) {
    if (!_isEditorActive) return;
    if (api.getMode() === 'editing') return; // Don't show while editing text
    if (api.getMode() === 'preview') return; // Don't show in preview

    // Don't intercept on toolbar or panel
    if (e.target.closest('#hws-editor-toolbar') || e.target.closest('#hws-editor-panel') ||
        e.target.closest('#hws-section-bar')) return;

    // Check for element first, then section
    var hwsEl = findHwsElement(e.target);
    var section = findSection(e.target);

    if (hwsEl) {
      e.preventDefault();
      _targetEl = hwsEl;
      _targetType = 'element';
      showMenu(e.clientX, e.clientY, getElementMenuItems(hwsEl));
    } else if (section) {
      e.preventDefault();
      _targetEl = section;
      _targetType = 'section';
      showMenu(e.clientX, e.clientY, getSectionMenuItems(section));
    }
  }

  function onClickOutside(e) {
    if (_menu && _menu.style.display !== 'none' && !_menu.contains(e.target)) {
      hideMenu();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && _menu && _menu.style.display !== 'none') {
      hideMenu();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onScroll() {
    hideMenu();
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('click', onClickOutside, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScroll, true);
  }

  function deactivate() {
    _isEditorActive = false;
    hideMenu();
    document.removeEventListener('contextmenu', onContextMenu, true);
    document.removeEventListener('click', onClickOutside, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('scroll', onScroll, true);

    if (_menu) {
      _menu.remove();
      _menu = null;
    }
  }

  // ---- Register Hooks ----

  api.onEnterEditMode(function() {
    activate();
  });

  api.onExitEditMode(function() {
    deactivate();
  });

})();
