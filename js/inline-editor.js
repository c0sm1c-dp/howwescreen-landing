/**
 * Inline Visual Editor — Squarespace-style WYSIWYG editor for How We Screen
 * Pure vanilla JS, no frameworks, no ES modules, works on file:// protocol
 *
 * Depends on globals from site-data.js and site-renderer.js:
 *   HWS_DEFAULTS, HWS_DESIGN_MAP, HWS_DESIGN_UNITS,
 *   hwsGetOverrides, hwsSaveOverrides, hwsResetOverrides, hwsGetValue,
 *   initSiteRenderer, applyDesignToken, applyTextOverride,
 *   applyImageOverride, applyFeaturesOverride
 */

(function() {
  'use strict';

  // =====================================================================
  // STATE
  // =====================================================================

  var _mode = 'off';            // 'off' | 'browse' | 'editing'
  var _overrides = {};
  var _selectedKey = null;
  var _selectedEl = null;
  var _editingEl = null;
  var _saveTimeout = null;
  var _undoStack = [];
  var _redoStack = [];
  var MAX_UNDO = 50;
  var _panelTab = 'element';    // 'element' | 'design' | 'actions'
  var _toastTimeout = null;

  // Cached DOM references (injected by editor)
  var _toolbar = null;
  var _panel = null;
  var _tooltip = null;
  var _toastEl = null;

  // =====================================================================
  // DESIGN FIELD DEFINITIONS
  // =====================================================================

  var DESIGN_FIELDS = [
    { type: 'heading', label: 'Background Colors' },
    { key: 'design.colorBg', label: 'Primary Background', type: 'color' },
    { key: 'design.colorBgSecondary', label: 'Secondary Background', type: 'color' },
    { key: 'design.colorBgTertiary', label: 'Tertiary Background', type: 'color' },
    { key: 'design.colorBgDark', label: 'Dark Background', type: 'color' },
    { type: 'heading', label: 'Text Colors' },
    { key: 'design.colorText', label: 'Primary Text', type: 'color' },
    { key: 'design.colorTextSecondary', label: 'Secondary Text', type: 'color' },
    { key: 'design.colorTextMuted', label: 'Muted Text', type: 'color' },
    { key: 'design.colorTextOnDark', label: 'Text on Dark', type: 'color' },
    { type: 'heading', label: 'Brand & Accent Colors' },
    { key: 'design.colorBrand', label: 'Brand', type: 'color' },
    { key: 'design.colorCta', label: 'CTA / Primary Accent', type: 'color' },
    { key: 'design.colorCtaHover', label: 'CTA Hover', type: 'color' },
    { key: 'design.colorAccent1', label: 'Accent 1 (Mauve)', type: 'color' },
    { key: 'design.colorAccent2', label: 'Accent 2 (Steel Blue)', type: 'color' },
    { key: 'design.colorAccent3', label: 'Accent 3 (Lime)', type: 'color' },
    { key: 'design.colorAccent4', label: 'Accent 4 (Orange)', type: 'color' },
    { key: 'design.colorAccent5', label: 'Accent 5 (Yellow)', type: 'color' },
    { type: 'heading', label: 'Borders' },
    { key: 'design.colorBorder', label: 'Border', type: 'color' },
    { key: 'design.colorBorderLight', label: 'Light Border', type: 'color' },
    { type: 'heading', label: 'Shape & Motion' },
    { key: 'design.borderRadiusSm', label: 'Border Radius Small', type: 'range', min: 0, max: 24, unit: 'px' },
    { key: 'design.borderRadiusMd', label: 'Border Radius Medium', type: 'range', min: 0, max: 32, unit: 'px' },
    { key: 'design.borderRadiusLg', label: 'Border Radius Large', type: 'range', min: 0, max: 48, unit: 'px' },
    { key: 'design.borderRadiusCard', label: 'Card Border Radius', type: 'range', min: 0, max: 32, unit: 'px' },
    { key: 'design.sectionPaddingY', label: 'Section Padding', type: 'range', min: 2, max: 10, unit: 'rem', step: 0.5 },
    { key: 'design.animationDistance', label: 'Animation Distance', type: 'range', min: 0, max: 80, unit: 'px' },
    { key: 'design.transitionSpeed', label: 'Transition Speed', type: 'range', min: 0.1, max: 1.0, unit: 's', step: 0.05 },
    { type: 'heading', label: 'Typography' },
    { key: 'design.fontHeadingWeight', label: 'Heading Weight', type: 'range', min: 100, max: 900, unit: '', step: 100 },
    { key: 'design.fontBodyWeight', label: 'Body Weight', type: 'range', min: 300, max: 700, unit: '', step: 100 }
  ];

  // =====================================================================
  // UTILITY HELPERS
  // =====================================================================

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Determine if a key uses innerHTML (rich text) or textContent (plain text).
   * Mirrors the logic in site-renderer.js applyTextOverride.
   */
  function isRichTextKey(key) {
    return (key.indexOf('headline') !== -1 ||
            key.indexOf('body') !== -1 ||
            key.indexOf('subtext') !== -1 ||
            key.indexOf('text') !== -1 ||
            key.indexOf('answer') !== -1 ||
            key.indexOf('Note') !== -1 ||
            key.indexOf('note') !== -1);
  }

  function isImageKey(key) {
    return key.indexOf('img.') === 0;
  }

  function isFeaturesKey(key) {
    return key.indexOf('.features') !== -1;
  }

  function isDesignKey(key) {
    return key.indexOf('design.') === 0;
  }

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function countOverrides() {
    return Object.keys(_overrides).length;
  }

  // =====================================================================
  // VALUE GET / SET
  // =====================================================================

  function getValue(key) {
    if (key in _overrides) return _overrides[key];
    return HWS_DEFAULTS[key] || '';
  }

  function setOverride(key, value) {
    pushUndo();

    // If value matches the default, remove the override
    if (value === HWS_DEFAULTS[key]) {
      delete _overrides[key];
    } else {
      _overrides[key] = value;
    }

    // Debounced save
    clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(function() {
      hwsSaveOverrides(_overrides);
      updateBadge();
    }, 300);
  }

  // =====================================================================
  // UNDO / REDO
  // =====================================================================

  function pushUndo() {
    _undoStack.push(cloneObj(_overrides));
    if (_undoStack.length > MAX_UNDO) {
      _undoStack.shift();
    }
    _redoStack = [];
    updateUndoRedoButtons();
  }

  function undo() {
    if (_undoStack.length === 0) return;
    _redoStack.push(cloneObj(_overrides));
    _overrides = _undoStack.pop();
    hwsSaveOverrides(_overrides);
    resetPageToDefaults();
    initSiteRenderer();
    updateBadge();
    updateUndoRedoButtons();
    // Refresh panel if open
    if (_panel && _selectedKey) {
      renderElementTab(_selectedKey);
    } else if (_panel && _panelTab === 'design') {
      renderDesignTab();
    }
    showToast('Undo');
  }

  function redo() {
    if (_redoStack.length === 0) return;
    _undoStack.push(cloneObj(_overrides));
    _overrides = _redoStack.pop();
    hwsSaveOverrides(_overrides);
    resetPageToDefaults();
    initSiteRenderer();
    updateBadge();
    updateUndoRedoButtons();
    if (_panel && _selectedKey) {
      renderElementTab(_selectedKey);
    } else if (_panel && _panelTab === 'design') {
      renderDesignTab();
    }
    showToast('Redo');
  }

  function updateUndoRedoButtons() {
    if (!_toolbar) return;
    var undoBtn = _toolbar.querySelector('[data-action="undo"]');
    var redoBtn = _toolbar.querySelector('[data-action="redo"]');
    if (undoBtn) undoBtn.disabled = _undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = _redoStack.length === 0;
  }

  /**
   * Reset every data-hws element to its default value and strip inline
   * CSS custom properties from :root so initSiteRenderer() applies cleanly.
   */
  function resetPageToDefaults() {
    var allKeys = Object.keys(HWS_DEFAULTS);
    var i, key, el;

    for (i = 0; i < allKeys.length; i++) {
      key = allKeys[i];

      if (isDesignKey(key)) {
        // Remove inline style for this CSS var
        var cssVar = HWS_DESIGN_MAP[key];
        if (cssVar) {
          document.documentElement.style.removeProperty(cssVar);
        }
        if (key === 'design.sectionPaddingY') {
          document.documentElement.style.removeProperty('--section-padding');
        }
        if (key === 'design.colorCta') {
          document.documentElement.style.removeProperty('--color-cta-secondary-border');
          document.documentElement.style.removeProperty('--color-cta-secondary-text');
        }
      } else if (isImageKey(key)) {
        el = document.querySelector('[data-hws="' + key + '"]');
        if (el) {
          var uploadedImg = el.querySelector('img[data-hws-img]');
          if (uploadedImg) uploadedImg.remove();
          var svg = el.querySelector('svg');
          if (svg) svg.style.display = '';
        }
      } else if (isFeaturesKey(key)) {
        el = document.querySelector('[data-hws-features="' + key + '"]');
        if (el) {
          var features = (HWS_DEFAULTS[key] || '').split('\n').filter(function(f) { return f.trim(); });
          el.innerHTML = features.map(function(f) {
            return '<div class="card__feature-item">' + f.trim() + '</div>';
          }).join('');
        }
      } else {
        el = document.querySelector('[data-hws="' + key + '"]');
        if (el) {
          if (isRichTextKey(key)) {
            el.innerHTML = HWS_DEFAULTS[key] || '';
          } else {
            el.textContent = HWS_DEFAULTS[key] || '';
          }
        }
      }
    }
  }

  // =====================================================================
  // HTML SANITIZER
  // =====================================================================

  function sanitizeHTML(html) {
    // Create a temporary element to parse the HTML
    var tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Walk all elements and strip disallowed tags
    var allowed = { EM: true, STRONG: true, A: true, BR: true, B: true, I: true, U: true };

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      var i, child, parent, frag, grandchildren, j;

      for (i = 0; i < children.length; i++) {
        child = children[i];

        if (child.nodeType === 1) { // Element node
          var tag = child.tagName;

          if (!allowed[tag]) {
            // Unwrap: replace this node with its children
            parent = child.parentNode;
            frag = document.createDocumentFragment();
            grandchildren = Array.prototype.slice.call(child.childNodes);
            for (j = 0; j < grandchildren.length; j++) {
              frag.appendChild(grandchildren[j]);
            }
            parent.replaceChild(frag, child);
            // Re-walk the parent since structure changed
            walk(parent);
            return;
          } else {
            // Strip unwanted attributes, keep only href on <a>
            var attrs = Array.prototype.slice.call(child.attributes);
            for (j = 0; j < attrs.length; j++) {
              if (tag === 'A' && attrs[j].name === 'href') continue;
              child.removeAttribute(attrs[j].name);
            }
            walk(child);
          }
        }
      }
    }

    walk(tmp);

    // Normalize whitespace: collapse multiple spaces/newlines
    var result = tmp.innerHTML;
    result = result.replace(/\n/g, ' ');
    result = result.replace(/\s{2,}/g, ' ');
    return result.trim();
  }

  // =====================================================================
  // TOAST NOTIFICATION
  // =====================================================================

  function showToast(msg) {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.id = 'hws-editor-toast';
      _toastEl.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'background:#2C2418;color:#F5F0E8;padding:10px 24px;border-radius:8px;font-size:14px;font-family:Helvetica,Arial,sans-serif;' +
        'z-index:100010;opacity:0;transition:opacity 0.2s,transform 0.2s;pointer-events:none;white-space:nowrap;' +
        'box-shadow:0 4px 16px rgba(0,0,0,0.25);';
      document.body.appendChild(_toastEl);
    }

    _toastEl.textContent = msg;
    _toastEl.style.opacity = '1';
    _toastEl.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(function() {
      _toastEl.style.opacity = '0';
      _toastEl.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2000);
  }

  // =====================================================================
  // BADGE (override count)
  // =====================================================================

  function updateBadge() {
    if (!_toolbar) return;
    var badge = _toolbar.querySelector('#hws-editor-badge');
    if (!badge) return;
    var count = countOverrides();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // =====================================================================
  // TOOLBAR
  // =====================================================================

  function createToolbar() {
    var tb = document.createElement('div');
    tb.id = 'hws-editor-toolbar';
    tb.className = 'hws-editor-toolbar';
    tb.innerHTML =
      '<div class="hws-editor-toolbar__left">' +
        '<button class="hws-editor-toolbar__btn" data-action="exit" title="Exit Editor">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>' +
        '</button>' +
        '<span class="hws-editor-toolbar__sep"></span>' +
        '<button class="hws-editor-toolbar__btn" data-action="undo" title="Undo" disabled>' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,7 1,4 4,1"/><path d="M1 4h9a4 4 0 0 1 0 8H8"/></svg>' +
        '</button>' +
        '<button class="hws-editor-toolbar__btn" data-action="redo" title="Redo" disabled>' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12,7 15,4 12,1"/><path d="M15 4H6a4 4 0 0 0 0 8h2"/></svg>' +
        '</button>' +
        '<span class="hws-editor-toolbar__sep"></span>' +
        '<button class="hws-editor-toolbar__btn" data-action="design" title="Design Tokens">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="5" r="3"/><path d="M5.5 7.5L3 14l5-2 5 2-2.5-6.5"/></svg>' +
        '</button>' +
        '<button class="hws-editor-toolbar__btn" data-action="actions" title="Actions">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><line x1="8" y1="8" x2="10.5" y2="10.5"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="hws-editor-toolbar__right">' +
        '<span class="hws-editor-toolbar__badge" id="hws-editor-badge" style="display:none;">0</span>' +
      '</div>';

    document.body.appendChild(tb);
    _toolbar = tb;

    // Bind toolbar actions
    tb.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');

      switch (action) {
        case 'exit':
          toggle();
          break;
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'design':
          openPanel('design');
          break;
        case 'actions':
          openPanel('actions');
          break;
      }
    });

    updateBadge();
    updateUndoRedoButtons();
  }

  // =====================================================================
  // TOOLTIP
  // =====================================================================

  function createTooltip() {
    var tip = document.createElement('div');
    tip.id = 'hws-editor-tooltip';
    tip.style.cssText = 'position:fixed;padding:4px 10px;background:#2C2418;color:#F5F0E8;font-size:12px;' +
      'font-family:monospace;border-radius:4px;pointer-events:none;z-index:100005;opacity:0;' +
      'transition:opacity 0.15s;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    document.body.appendChild(tip);
    _tooltip = tip;
  }

  function showTooltip(text, x, y) {
    if (!_tooltip) return;
    _tooltip.textContent = text;
    _tooltip.style.opacity = '1';
    // Position above cursor
    var tipW = _tooltip.offsetWidth;
    var left = Math.max(4, Math.min(x - tipW / 2, window.innerWidth - tipW - 4));
    var top = Math.max(4, y - 34);
    _tooltip.style.left = left + 'px';
    _tooltip.style.top = top + 'px';
  }

  function hideTooltip() {
    if (!_tooltip) return;
    _tooltip.style.opacity = '0';
  }

  // =====================================================================
  // PANEL
  // =====================================================================

  function createPanel() {
    var p = document.createElement('div');
    p.id = 'hws-editor-panel';
    p.className = 'hws-editor-panel';
    p.innerHTML =
      '<div class="hws-editor-panel__header">' +
        '<span class="hws-editor-panel__title" id="hws-editor-panel-title">Editor</span>' +
        '<button class="hws-editor-panel__close" id="hws-editor-panel-close" title="Close Panel">' +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="hws-editor-panel__body" id="hws-editor-panel-body"></div>';

    document.body.appendChild(p);
    _panel = p;

    // Close button
    var closeBtn = p.querySelector('#hws-editor-panel-close');
    closeBtn.addEventListener('click', function() {
      closePanel();
    });
  }

  function openPanel(tab) {
    if (!_panel) createPanel();
    _panelTab = tab;
    _panel.classList.add('hws-editor-panel--open');

    switch (tab) {
      case 'element':
        renderElementTab(_selectedKey);
        break;
      case 'design':
        renderDesignTab();
        break;
      case 'actions':
        renderActionsTab();
        break;
    }
  }

  function closePanel() {
    if (!_panel) return;
    _panel.classList.remove('hws-editor-panel--open');
  }

  function setPanelTitle(title) {
    if (!_panel) return;
    var titleEl = _panel.querySelector('#hws-editor-panel-title');
    if (titleEl) titleEl.textContent = title;
  }

  function setPanelBody(html) {
    if (!_panel) return;
    var body = _panel.querySelector('#hws-editor-panel-body');
    if (body) body.innerHTML = html;
  }

  // =====================================================================
  // ELEMENT TAB
  // =====================================================================

  function renderElementTab(key) {
    if (!key) {
      setPanelTitle('Element');
      setPanelBody('<p class="hws-editor-panel__empty">Click an element on the page to edit it.</p>');
      return;
    }

    _panelTab = 'element';
    var val = getValue(key);

    if (isImageKey(key)) {
      renderImageControls(key, val);
    } else if (isFeaturesKey(key)) {
      renderFeaturesControls(key, val);
    } else {
      renderTextControls(key, val);
    }
  }

  function renderTextControls(key, value) {
    setPanelTitle(key);

    var isDefault = !(key in _overrides);
    var badge = isDefault ? ' <span class="hws-editor-panel__default-badge">default</span>' : '';

    var html =
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Content' + badge + '</label>' +
        '<textarea class="hws-editor-input" id="hws-editor-panel-textarea" rows="4">' +
          escHtml(value) +
        '</textarea>' +
        '<p class="hws-editor-panel__hint">' +
          (isRichTextKey(key) ? 'Supports &lt;em&gt;, &lt;strong&gt;, &lt;a href&gt;, &lt;br&gt;' : 'Plain text only') +
        '</p>' +
      '</div>' +
      '<div class="hws-editor-panel__actions">' +
        '<button class="hws-editor-btn hws-editor-btn--reset" id="hws-editor-panel-reset">Reset to default</button>' +
      '</div>';

    setPanelBody(html);

    // Bind textarea
    var textarea = _panel.querySelector('#hws-editor-panel-textarea');
    if (textarea) {
      autoResizeTextarea(textarea);
      textarea.addEventListener('input', function() {
        var newVal = textarea.value;
        setOverride(key, newVal);
        // Live-update the DOM element
        applyValueToDOM(key, newVal);
        autoResizeTextarea(textarea);
      });
    }

    // Bind reset button
    var resetBtn = _panel.querySelector('#hws-editor-panel-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        pushUndo();
        delete _overrides[key];
        hwsSaveOverrides(_overrides);
        var defaultVal = HWS_DEFAULTS[key] || '';
        applyValueToDOM(key, defaultVal);
        renderElementTab(key);
        updateBadge();
        showToast('Reset to default');
      });
    }
  }

  function renderImageControls(key, value) {
    setPanelTitle(key);

    var hasImage = value && value.length > 0;
    var previewHtml = hasImage
      ? '<img src="' + escAttr(value) + '" alt="Preview" style="max-width:100%;max-height:120px;border-radius:6px;margin-bottom:12px;">'
      : '<div class="hws-editor-panel__img-empty">No image uploaded</div>';

    var html =
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Image</label>' +
        '<div id="hws-editor-panel-img-preview">' + previewHtml + '</div>' +
      '</div>' +
      '<div class="hws-editor-panel__actions">' +
        '<button class="hws-editor-btn hws-editor-btn--primary" id="hws-editor-panel-pick-img">Choose Image</button>' +
        (hasImage ? '<button class="hws-editor-btn hws-editor-btn--danger" id="hws-editor-panel-clear-img">Remove</button>' : '') +
        '<button class="hws-editor-btn hws-editor-btn--reset" id="hws-editor-panel-reset">Reset to default</button>' +
      '</div>';

    setPanelBody(html);

    var pickBtn = _panel.querySelector('#hws-editor-panel-pick-img');
    if (pickBtn) {
      pickBtn.addEventListener('click', function() {
        pickImage(key);
      });
    }

    var clearBtn = _panel.querySelector('#hws-editor-panel-clear-img');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        clearImage(key);
      });
    }

    var resetBtn = _panel.querySelector('#hws-editor-panel-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        pushUndo();
        delete _overrides[key];
        hwsSaveOverrides(_overrides);
        // Reset the image element in DOM
        var el = document.querySelector('[data-hws="' + key + '"]');
        if (el) {
          var uploadedImg = el.querySelector('img[data-hws-img]');
          if (uploadedImg) uploadedImg.remove();
          var svg = el.querySelector('svg');
          if (svg) svg.style.display = '';
        }
        renderElementTab(key);
        updateBadge();
        showToast('Reset to default');
      });
    }
  }

  function renderFeaturesControls(key, value) {
    setPanelTitle(key);

    var isDefault = !(key in _overrides);
    var badge = isDefault ? ' <span class="hws-editor-panel__default-badge">default</span>' : '';

    var html =
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Features' + badge + '</label>' +
        '<textarea class="hws-editor-input" id="hws-editor-panel-textarea" rows="6" placeholder="One feature per line">' +
          escHtml(value) +
        '</textarea>' +
        '<p class="hws-editor-panel__hint">One feature per line</p>' +
      '</div>' +
      '<div class="hws-editor-panel__actions">' +
        '<button class="hws-editor-btn hws-editor-btn--reset" id="hws-editor-panel-reset">Reset to default</button>' +
      '</div>';

    setPanelBody(html);

    var textarea = _panel.querySelector('#hws-editor-panel-textarea');
    if (textarea) {
      autoResizeTextarea(textarea);
      textarea.addEventListener('input', function() {
        var newVal = textarea.value;
        setOverride(key, newVal);
        applyFeaturesOverride(key, newVal);
        autoResizeTextarea(textarea);
      });
    }

    var resetBtn = _panel.querySelector('#hws-editor-panel-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        pushUndo();
        delete _overrides[key];
        hwsSaveOverrides(_overrides);
        applyFeaturesOverride(key, HWS_DEFAULTS[key] || '');
        renderElementTab(key);
        updateBadge();
        showToast('Reset to default');
      });
    }
  }

  function autoResizeTextarea(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(80, ta.scrollHeight) + 'px';
  }

  // =====================================================================
  // DESIGN TAB
  // =====================================================================

  function renderDesignTab() {
    _panelTab = 'design';
    setPanelTitle('Design Tokens');

    var html = '';
    var i, field;

    for (i = 0; i < DESIGN_FIELDS.length; i++) {
      field = DESIGN_FIELDS[i];

      if (field.type === 'heading') {
        html += '<div class="hws-editor-panel__divider"></div>' +
          '<h4 class="hws-editor-panel__section-heading">' + field.label + '</h4>';
        continue;
      }

      var val = getValue(field.key);

      if (field.type === 'color') {
        html +=
          '<div class="hws-editor-panel__field hws-editor-panel__field--color">' +
            '<label class="hws-editor-label">' + field.label + '</label>' +
            '<div class="hws-editor-color-row">' +
              '<input type="color" class="hws-editor-color-picker" data-key="' + field.key + '" value="' + escAttr(val) + '">' +
              '<input type="text" class="hws-editor-color-hex" data-key="' + field.key + '" value="' + escAttr(val) + '" maxlength="7">' +
            '</div>' +
          '</div>';
      } else if (field.type === 'range') {
        var step = field.step || 1;
        var unit = field.unit || '';
        html +=
          '<div class="hws-editor-panel__field hws-editor-panel__field--range">' +
            '<label class="hws-editor-label">' + field.label + '</label>' +
            '<div class="hws-editor-range-row">' +
              '<input type="range" class="hws-editor-range" data-key="' + field.key + '" ' +
                'value="' + escAttr(val) + '" min="' + field.min + '" max="' + field.max + '" step="' + step + '" ' +
                'data-unit="' + unit + '">' +
              '<span class="hws-editor-range-value">' + val + unit + '</span>' +
            '</div>' +
          '</div>';
      }
    }

    setPanelBody(html);

    // Bind color pickers
    var colorPickers = _panel.querySelectorAll('.hws-editor-color-picker');
    var k;
    for (k = 0; k < colorPickers.length; k++) {
      (function(picker) {
        picker.addEventListener('input', function() {
          var key = picker.getAttribute('data-key');
          var hex = picker.value;
          // Sync text input
          var textInput = picker.parentElement.querySelector('.hws-editor-color-hex');
          if (textInput) textInput.value = hex;
          setOverride(key, hex);
          applyDesignToken(key, hex);
        });
      })(colorPickers[k]);
    }

    // Bind color hex inputs
    var hexInputs = _panel.querySelectorAll('.hws-editor-color-hex');
    for (k = 0; k < hexInputs.length; k++) {
      (function(input) {
        input.addEventListener('input', function() {
          var key = input.getAttribute('data-key');
          var hex = input.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            var picker = input.parentElement.querySelector('.hws-editor-color-picker');
            if (picker) picker.value = hex;
            setOverride(key, hex);
            applyDesignToken(key, hex);
          }
        });
      })(hexInputs[k]);
    }

    // Bind range inputs
    var ranges = _panel.querySelectorAll('.hws-editor-range');
    for (k = 0; k < ranges.length; k++) {
      (function(range) {
        range.addEventListener('input', function() {
          var key = range.getAttribute('data-key');
          var unit = range.getAttribute('data-unit') || '';
          var val = range.value;
          var display = range.parentElement.querySelector('.hws-editor-range-value');
          if (display) display.textContent = val + unit;
          setOverride(key, val);
          applyDesignToken(key, val);
        });
      })(ranges[k]);
    }
  }

  // =====================================================================
  // ACTIONS TAB
  // =====================================================================

  function renderActionsTab() {
    _panelTab = 'actions';
    setPanelTitle('Actions');

    var count = countOverrides();

    var html =
      '<div class="hws-editor-panel__field">' +
        '<p class="hws-editor-panel__info">You have <strong>' + count + '</strong> custom override' + (count !== 1 ? 's' : '') + ' saved.</p>' +
      '</div>' +
      '<div class="hws-editor-panel__actions-list">' +
        '<button class="hws-editor-btn hws-editor-btn--primary hws-editor-btn--full" id="hws-editor-action-export-html">' +
          'Export HTML' +
        '</button>' +
        '<button class="hws-editor-btn hws-editor-btn--full" id="hws-editor-action-export-json">' +
          'Export JSON' +
        '</button>' +
        '<button class="hws-editor-btn hws-editor-btn--full" id="hws-editor-action-import-json">' +
          'Import JSON' +
        '</button>' +
        '<div class="hws-editor-panel__divider"></div>' +
        '<button class="hws-editor-btn hws-editor-btn--danger hws-editor-btn--full" id="hws-editor-action-reset">' +
          'Reset All' +
        '</button>' +
      '</div>';

    setPanelBody(html);

    // Bind buttons
    var exportHtmlBtn = _panel.querySelector('#hws-editor-action-export-html');
    if (exportHtmlBtn) exportHtmlBtn.addEventListener('click', exportHTML);

    var exportJsonBtn = _panel.querySelector('#hws-editor-action-export-json');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportOverrides);

    var importJsonBtn = _panel.querySelector('#hws-editor-action-import-json');
    if (importJsonBtn) importJsonBtn.addEventListener('click', importOverrides);

    var resetBtn = _panel.querySelector('#hws-editor-action-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
  }

  // =====================================================================
  // IMAGE UPLOAD
  // =====================================================================

  function pickImage(key) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.svg';
    input.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(event) {
        var dataUrl = event.target.result;
        setOverride(key, dataUrl);
        applyImageOverride(key, dataUrl);
        renderElementTab(key);
        showToast('Image uploaded');
      };
      reader.readAsDataURL(file);
    });
    input.click();
  }

  function clearImage(key) {
    setOverride(key, '');
    // Restore SVG
    var el = document.querySelector('[data-hws="' + key + '"]');
    if (el) {
      var uploadedImg = el.querySelector('img[data-hws-img]');
      if (uploadedImg) uploadedImg.remove();
      var svg = el.querySelector('svg');
      if (svg) svg.style.display = '';
    }
    renderElementTab(key);
    showToast('Image removed');
  }

  // =====================================================================
  // APPLY VALUE TO DOM (for live preview)
  // =====================================================================

  function applyValueToDOM(key, value) {
    if (isImageKey(key)) {
      applyImageOverride(key, value);
    } else if (isFeaturesKey(key)) {
      applyFeaturesOverride(key, value);
    } else {
      applyTextOverride(key, value);
    }
  }

  // =====================================================================
  // EXPORT HTML
  // =====================================================================

  function exportHTML() {
    showToast('Generating...');

    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'index.html';
    document.body.appendChild(iframe);

    iframe.onload = function() {
      try {
        var doc = iframe.contentDocument;
        var clone = doc.documentElement.cloneNode(true);

        // Remove editor scripts
        clone.querySelectorAll('script[src*="site-data"], script[src*="site-renderer"], script[src*="editor-init"], script[src*="inline-editor"]').forEach(function(el) {
          el.remove();
        });

        // Remove editor CSS
        clone.querySelectorAll('link[href*="inline-editor"]').forEach(function(el) {
          el.remove();
        });

        // Remove data attributes
        clone.querySelectorAll('[data-hws]').forEach(function(el) {
          el.removeAttribute('data-hws');
        });
        clone.querySelectorAll('[data-hws-features]').forEach(function(el) {
          el.removeAttribute('data-hws-features');
        });
        clone.querySelectorAll('[data-hws-img]').forEach(function(el) {
          el.removeAttribute('data-hws-img');
        });

        // Remove edit mode attribute
        clone.removeAttribute('data-hws-edit-mode');

        // Remove editor DOM
        clone.querySelectorAll('[id^="hws-editor"], [class*="hws-editor"]').forEach(function(el) {
          el.remove();
        });

        // Bake CSS variables
        var designOverrides = {};
        var keys = Object.keys(_overrides);
        var i;
        for (i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (k.indexOf('design.') === 0 && HWS_DESIGN_MAP[k]) {
            var cssVar = HWS_DESIGN_MAP[k];
            var unit = HWS_DESIGN_UNITS[k] || '';
            if (k === 'design.sectionPaddingY') {
              designOverrides['--section-padding'] = _overrides[k] + 'rem 1.5rem';
            } else {
              designOverrides[cssVar] = _overrides[k] + unit;
            }
          }
        }

        if (Object.keys(designOverrides).length > 0) {
          var styleStr = Object.keys(designOverrides).map(function(dk) {
            return dk + ': ' + designOverrides[dk];
          }).join('; ');
          var existing = clone.getAttribute('style') || '';
          clone.setAttribute('style', (existing ? existing + '; ' : '') + styleStr);
        }

        clone.classList.remove('js-loaded');

        var html = '<!DOCTYPE html>\n' + clone.outerHTML;
        var blob = new Blob([html], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(url);

        showToast('HTML downloaded!');
      } catch (err) {
        console.error('Export error:', err);
        showToast('Export failed');
      }

      document.body.removeChild(iframe);
    };
  }

  // =====================================================================
  // EXPORT / IMPORT JSON
  // =====================================================================

  function exportOverrides() {
    var json = JSON.stringify(_overrides, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'hws-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Overrides exported');
  }

  function importOverrides() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(event) {
        try {
          var imported = JSON.parse(event.target.result);
          pushUndo();
          _overrides = imported;
          hwsSaveOverrides(_overrides);
          resetPageToDefaults();
          initSiteRenderer();
          updateBadge();
          showToast('Overrides imported');
          if (_panelTab === 'actions') renderActionsTab();
        } catch (err) {
          showToast('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function resetAll() {
    if (!confirm('Reset all changes? This will restore every field to its default value.')) return;
    pushUndo();
    _overrides = {};
    hwsResetOverrides();
    resetPageToDefaults();
    updateBadge();
    showToast('All changes reset');
    if (_panelTab === 'actions') renderActionsTab();
    deselectElement();
  }

  // =====================================================================
  // ELEMENT SELECTION
  // =====================================================================

  function getHwsKey(el) {
    // Check for data-hws attribute
    if (el.hasAttribute('data-hws')) return el.getAttribute('data-hws');
    return null;
  }

  function getHwsFeaturesKey(el) {
    if (el.hasAttribute('data-hws-features')) return el.getAttribute('data-hws-features');
    return null;
  }

  function findHwsElement(target) {
    // Walk up from target to find nearest [data-hws] or [data-hws-features]
    var el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.hasAttribute && (el.hasAttribute('data-hws') || el.hasAttribute('data-hws-features'))) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function selectElement(el) {
    deselectElement();

    var key = getHwsKey(el);
    var featuresKey = getHwsFeaturesKey(el);

    if (featuresKey) {
      _selectedKey = featuresKey;
    } else if (key) {
      _selectedKey = key;
    } else {
      return;
    }

    _selectedEl = el;
    el.classList.add('hws-editor-selected');

    // Determine what kind of control to show
    if (isImageKey(_selectedKey)) {
      openPanel('element');
    } else if (isFeaturesKey(_selectedKey)) {
      openPanel('element');
    } else if (isDesignKey(_selectedKey)) {
      openPanel('design');
    } else {
      openPanel('element');
    }
  }

  function deselectElement() {
    if (_selectedEl) {
      _selectedEl.classList.remove('hws-editor-selected');
    }
    _selectedEl = null;
    _selectedKey = null;
  }

  // =====================================================================
  // INLINE TEXT EDITING
  // =====================================================================

  function startEditing(el) {
    if (_mode === 'editing') return;
    var key = getHwsKey(el);
    if (!key) return;
    if (isImageKey(key) || isFeaturesKey(key)) return;

    _mode = 'editing';
    _editingEl = el;

    el.setAttribute('contenteditable', 'true');
    el.classList.add('hws-editor-editing');
    el.focus();

    // Select all text for convenience
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Sync panel textarea
    syncPanelFromElement(key, el);
  }

  function stopEditing() {
    if (_mode !== 'editing' || !_editingEl) return;

    var key = getHwsKey(_editingEl);
    if (key) {
      // Read value from element
      var value;
      if (isRichTextKey(key)) {
        value = sanitizeHTML(_editingEl.innerHTML);
      } else {
        value = _editingEl.textContent.trim();
      }

      setOverride(key, value);

      // Update panel textarea
      var textarea = _panel ? _panel.querySelector('#hws-editor-panel-textarea') : null;
      if (textarea) {
        textarea.value = value;
      }
    }

    _editingEl.removeAttribute('contenteditable');
    _editingEl.classList.remove('hws-editor-editing');
    _editingEl = null;
    _mode = 'browse';
  }

  function syncPanelFromElement(key, el) {
    var textarea = _panel ? _panel.querySelector('#hws-editor-panel-textarea') : null;
    if (!textarea) return;

    if (isRichTextKey(key)) {
      textarea.value = el.innerHTML;
    } else {
      textarea.value = el.textContent;
    }
    autoResizeTextarea(textarea);
  }

  // =====================================================================
  // EVENT HANDLERS
  // =====================================================================

  function onMouseOver(e) {
    if (_mode !== 'browse') return;

    var el = findHwsElement(e.target);
    if (!el) return;

    // Don't highlight toolbar/panel elements
    if (el.closest('#hws-editor-toolbar') || el.closest('#hws-editor-panel')) return;

    el.classList.add('hws-editor-hoverable');

    var key = getHwsKey(el) || getHwsFeaturesKey(el);
    if (key) {
      showTooltip(key, e.clientX, e.clientY);
    }
  }

  function onMouseOut(e) {
    if (_mode !== 'browse') return;

    var el = findHwsElement(e.target);
    if (el) {
      el.classList.remove('hws-editor-hoverable');
    }
    hideTooltip();
  }

  function onMouseMove(e) {
    if (_mode !== 'browse') return;
    // Update tooltip position if visible
    if (_tooltip && _tooltip.style.opacity === '1') {
      var el = findHwsElement(e.target);
      if (el) {
        var key = getHwsKey(el) || getHwsFeaturesKey(el);
        if (key) {
          showTooltip(key, e.clientX, e.clientY);
        }
      }
    }
  }

  function onClick(e) {
    if (_mode === 'off') return;

    // Ignore clicks on toolbar and panel
    if (e.target.closest('#hws-editor-toolbar') || e.target.closest('#hws-editor-panel') || e.target.closest('#hws-editor-toast')) {
      return;
    }

    var el = findHwsElement(e.target);

    if (_mode === 'editing') {
      // If clicking outside the editing element, stop editing
      if (!_editingEl || !_editingEl.contains(e.target)) {
        stopEditing();
        if (el) {
          e.stopPropagation();
          e.preventDefault();
          selectElement(el);
        }
      }
      // If clicking inside the editing element, let it be (for cursor positioning)
      return;
    }

    // browse mode
    if (el) {
      e.stopPropagation();
      e.preventDefault();
      selectElement(el);
    } else {
      // Clicking on empty space — deselect
      deselectElement();
      closePanel();
    }
  }

  function onDblClick(e) {
    if (_mode !== 'browse') return;

    // Ignore toolbar/panel
    if (e.target.closest('#hws-editor-toolbar') || e.target.closest('#hws-editor-panel')) return;

    var el = findHwsElement(e.target);
    if (!el) return;

    var key = getHwsKey(el);
    if (!key) return;
    if (isImageKey(key) || isFeaturesKey(key)) return;

    e.stopPropagation();
    e.preventDefault();

    // Ensure element is selected first
    selectElement(el);
    startEditing(el);
  }

  function onKeyDown(e) {
    // Escape key
    if (e.key === 'Escape') {
      if (_mode === 'editing') {
        stopEditing();
        e.preventDefault();
      } else if (_mode === 'browse') {
        if (_selectedEl) {
          deselectElement();
          closePanel();
        } else {
          toggle();
        }
        e.preventDefault();
      }
      return;
    }

    // Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          if (_mode !== 'editing') {
            e.preventDefault();
            redo();
          }
        } else {
          if (_mode !== 'editing') {
            e.preventDefault();
            undo();
          }
        }
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        if (_mode !== 'editing') {
          e.preventDefault();
          redo();
        }
        return;
      }
    }

    // Enter on editing element (prevent creating divs)
    if (_mode === 'editing' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Insert <br> instead
      document.execCommand('insertLineBreak');
    }
  }

  function onBlur(e) {
    if (_mode !== 'editing') return;
    if (!_editingEl) return;

    // Delay to allow click events to fire first
    setTimeout(function() {
      if (_mode === 'editing') {
        stopEditing();
      }
    }, 150);
  }

  // =====================================================================
  // ENTER / EXIT EDIT MODE
  // =====================================================================

  function enterEditMode() {
    if (_mode !== 'off') return;

    _mode = 'browse';
    _overrides = hwsGetOverrides();

    // Set edit mode attribute on html
    document.documentElement.setAttribute('data-hws-edit-mode', '');

    // Inject UI
    createToolbar();
    createTooltip();
    // Panel is created lazily on first open

    // Attach event listeners (capture phase for click interception)
    document.addEventListener('click', onClick, true);
    document.addEventListener('dblclick', onDblClick, true);
    document.addEventListener('mouseover', onMouseOver, false);
    document.addEventListener('mouseout', onMouseOut, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, true);

    // Hide the trigger button
    var trigger = document.getElementById('hws-edit-trigger');
    if (trigger) trigger.style.display = 'none';

    showToast('Editor active');
  }

  function exitEditMode() {
    if (_mode === 'off') return;

    // Stop editing if active
    if (_mode === 'editing') {
      stopEditing();
    }

    _mode = 'off';

    // Remove edit mode attribute
    document.documentElement.removeAttribute('data-hws-edit-mode');

    // Remove event listeners
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('dblclick', onDblClick, true);
    document.removeEventListener('mouseover', onMouseOver, false);
    document.removeEventListener('mouseout', onMouseOut, false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('keydown', onKeyDown, true);

    // Remove all editor classes from elements
    var hoverables = document.querySelectorAll('.hws-editor-hoverable');
    var i;
    for (i = 0; i < hoverables.length; i++) {
      hoverables[i].classList.remove('hws-editor-hoverable');
    }
    var selecteds = document.querySelectorAll('.hws-editor-selected');
    for (i = 0; i < selecteds.length; i++) {
      selecteds[i].classList.remove('hws-editor-selected');
    }
    var editings = document.querySelectorAll('.hws-editor-editing');
    for (i = 0; i < editings.length; i++) {
      editings[i].classList.remove('hws-editor-editing');
      editings[i].removeAttribute('contenteditable');
    }

    // Remove injected DOM
    if (_toolbar) {
      _toolbar.remove();
      _toolbar = null;
    }
    if (_panel) {
      _panel.remove();
      _panel = null;
    }
    if (_tooltip) {
      _tooltip.remove();
      _tooltip = null;
    }
    if (_toastEl) {
      _toastEl.remove();
      _toastEl = null;
    }

    // Reset selection state
    _selectedEl = null;
    _selectedKey = null;
    _editingEl = null;

    // Show the trigger button again
    var trigger = document.getElementById('hws-edit-trigger');
    if (trigger) trigger.style.display = '';
  }

  // =====================================================================
  // PUBLIC API
  // =====================================================================

  function toggle() {
    if (_mode === 'off') {
      enterEditMode();
    } else {
      exitEditMode();
    }
  }

  function isActive() {
    return _mode !== 'off';
  }

  function getMode() {
    return _mode;
  }

  // Expose global
  window.HWSEditor = {
    toggle: toggle,
    isActive: isActive,
    getMode: getMode
  };

})();
