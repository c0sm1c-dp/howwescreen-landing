/**
 * Editor Element Styles — Per-element style overrides + button/image editors
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Phase 6A: Adds a collapsible "Style" section below content in the element panel
 *           (spacing, background, border, text properties)
 * Phase 6B: Button editor (link URL, style, size, colors)
 * Phase 6C: Image editor (alt text, fit mode, border-radius, opacity)
 *
 * All stored in localStorage under 'hws-admin-element-styles'.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorElementStyles] HWSEditor._internal not found — skipping element styles.');
    return;
  }

  var STYLES_KEY = 'hws-admin-element-styles';

  // ---- Persistence ----

  function getElementStyles() {
    try {
      var raw = localStorage.getItem(STYLES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveElementStyles(styles) {
    try { localStorage.setItem(STYLES_KEY, JSON.stringify(styles)); } catch (e) {}
  }

  function getStyleValue(key, prop, fallback) {
    var styles = getElementStyles();
    if (styles[key] && styles[key][prop] !== undefined && styles[key][prop] !== '') {
      return styles[key][prop];
    }
    return fallback || '';
  }

  function setStyleValue(key, prop, value) {
    var styles = getElementStyles();
    if (!styles[key]) styles[key] = {};
    styles[key][prop] = value;
    saveElementStyles(styles);
  }

  function removeStylesForKey(key) {
    var styles = getElementStyles();
    delete styles[key];
    saveElementStyles(styles);
  }

  // ---- Apply Style to Element ----

  function applyElementStyle(el, prop, value) {
    if (!el) return;
    switch (prop) {
      case 'bgColor':       el.style.backgroundColor = value || ''; break;
      case 'textColor':      el.style.color = value || ''; break;
      case 'fontSize':       el.style.fontSize = value ? value + 'px' : ''; break;
      case 'fontWeight':     el.style.fontWeight = value || ''; break;
      case 'lineHeight':     el.style.lineHeight = value || ''; break;
      case 'letterSpacing':  el.style.letterSpacing = value ? value + 'px' : ''; break;
      case 'textAlign':      el.style.textAlign = value || ''; break;
      case 'paddingTop':     el.style.paddingTop = value ? value + 'px' : ''; break;
      case 'paddingRight':   el.style.paddingRight = value ? value + 'px' : ''; break;
      case 'paddingBottom':  el.style.paddingBottom = value ? value + 'px' : ''; break;
      case 'paddingLeft':    el.style.paddingLeft = value ? value + 'px' : ''; break;
      case 'marginTop':      el.style.marginTop = value ? value + 'px' : ''; break;
      case 'marginBottom':   el.style.marginBottom = value ? value + 'px' : ''; break;
      case 'borderRadius':   el.style.borderRadius = value ? value + 'px' : ''; break;
      case 'borderWidth':    el.style.borderWidth = value ? value + 'px' : ''; break;
      case 'borderColor':    el.style.borderColor = value || ''; break;
      case 'borderStyle':    el.style.borderStyle = value || ''; break;
      case 'opacity':        el.style.opacity = (value !== '' && value !== undefined) ? value / 100 : ''; break;
      case 'maxWidth':       el.style.maxWidth = value ? value + 'px' : ''; break;
      // Button-specific
      case 'btnBgColor':     el.style.backgroundColor = value || ''; break;
      case 'btnTextColor':   el.style.color = value || ''; break;
      case 'btnBorderRadius': el.style.borderRadius = value ? value + 'px' : ''; break;
      case 'btnPaddingY':    el.style.paddingTop = value ? value + 'px' : ''; el.style.paddingBottom = value ? value + 'px' : ''; break;
      case 'btnPaddingX':    el.style.paddingLeft = value ? value + 'px' : ''; el.style.paddingRight = value ? value + 'px' : ''; break;
      // Image-specific
      case 'imgBorderRadius': el.style.borderRadius = value ? value + 'px' : ''; break;
      case 'imgOpacity':     el.style.opacity = (value !== '' && value !== undefined) ? value / 100 : ''; break;
      case 'imgObjectFit':   el.style.objectFit = value || ''; break;
      case 'imgShadow':
        el.style.boxShadow = value ? '0 4px ' + value + 'px rgba(0,0,0,0.15)' : '';
        break;
    }
  }

  function applyAllStyles(key, el) {
    var styles = getElementStyles();
    if (!styles[key]) return;
    var s = styles[key];
    Object.keys(s).forEach(function(prop) {
      if (s[prop] !== '' && s[prop] !== undefined) {
        applyElementStyle(el, prop, s[prop]);
      }
    });
  }

  // ---- Inject Style Section into Panel ----

  var _observing = false;
  var _panelObserver = null;

  function watchPanel() {
    if (_observing) return;
    _observing = true;

    // Watch for panel body changes to inject our style controls
    _panelObserver = new MutationObserver(function() {
      injectStyleControls();
    });

    var panel = api.getPanel();
    if (panel) {
      var body = panel.querySelector('#hws-editor-panel-body');
      if (body) {
        _panelObserver.observe(body, { childList: true, subtree: false });
      }
    }
  }

  function stopWatchingPanel() {
    if (_panelObserver) {
      _panelObserver.disconnect();
      _panelObserver = null;
    }
    _observing = false;
  }

  function injectStyleControls() {
    var panel = api.getPanel();
    if (!panel) return;

    var body = panel.querySelector('#hws-editor-panel-body');
    if (!body) return;

    // Only inject if there's a selected element and the panel shows element content
    var selectedEl = api.getSelectedEl();
    var selectedKey = api.getSelectedKey();
    if (!selectedEl || !selectedKey) return;

    // Don't inject if already present
    if (body.querySelector('#hws-elem-style-section')) return;

    // Don't inject for design tab
    var titleEl = panel.querySelector('#hws-editor-panel-title');
    if (titleEl && (titleEl.textContent === 'Design Tokens' || titleEl.textContent === 'Actions' || titleEl.textContent === 'Layers' || titleEl.textContent.indexOf('Section:') === 0)) return;

    // Determine element type
    var isButton = selectedEl.classList.contains('btn') || selectedEl.classList.contains('btn--secondary') || selectedEl.tagName === 'BUTTON';
    var isImage = selectedKey.indexOf('img.') === 0;

    // Build style section HTML
    var html = '<div id="hws-elem-style-section" class="hws-elem-style-section">';
    html += '<div class="hws-elem-style__header" id="hws-elem-style-toggle">';
    html += '<span class="hws-elem-style__arrow">▸</span> ';
    html += '<span>Style & Layout</span>';
    html += '</div>';
    html += '<div class="hws-elem-style__body" id="hws-elem-style-body" style="display:none;">';

    if (isButton) {
      html += buildButtonEditorHTML(selectedKey, selectedEl);
    } else if (isImage) {
      html += buildImageEditorHTML(selectedKey, selectedEl);
    } else {
      html += buildGenericStyleHTML(selectedKey, selectedEl);
    }

    html += '<div class="hws-editor-panel__divider"></div>';
    html += '<button class="hws-editor-btn hws-editor-btn--reset hws-editor-btn--full" id="hws-elem-style-reset">Reset Element Styles</button>';
    html += '</div>';
    html += '</div>';

    // Append to the panel body
    body.insertAdjacentHTML('beforeend', html);

    // Bind toggle
    var toggle = body.querySelector('#hws-elem-style-toggle');
    var styleBody = body.querySelector('#hws-elem-style-body');
    var arrow = body.querySelector('.hws-elem-style__arrow');

    if (toggle) {
      toggle.addEventListener('click', function() {
        var isOpen = styleBody.style.display !== 'none';
        styleBody.style.display = isOpen ? 'none' : 'block';
        arrow.textContent = isOpen ? '▸' : '▾';
      });
    }

    // Bind controls
    if (isButton) {
      bindButtonEditor(selectedKey, selectedEl, body);
    } else if (isImage) {
      bindImageEditor(selectedKey, selectedEl, body);
    } else {
      bindGenericStyleControls(selectedKey, selectedEl, body);
    }

    // Bind reset
    var resetBtn = body.querySelector('#hws-elem-style-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        removeStylesForKey(selectedKey);
        clearElementStyles(selectedEl, isButton, isImage);
        api.showToast('Element styles reset');
      });
    }
  }

  function clearElementStyles(el, isButton, isImage) {
    var props = ['backgroundColor', 'color', 'fontSize', 'fontWeight', 'lineHeight',
                 'letterSpacing', 'textAlign', 'paddingTop', 'paddingRight',
                 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom',
                 'borderRadius', 'borderWidth', 'borderColor', 'borderStyle',
                 'opacity', 'maxWidth', 'objectFit', 'boxShadow'];
    props.forEach(function(p) { el.style[p] = ''; });
  }

  // ---- Generic Style Controls (6A) ----

  function buildGenericStyleHTML(key) {
    var textColor = getStyleValue(key, 'textColor');
    var bgColor = getStyleValue(key, 'bgColor');
    var fontSize = getStyleValue(key, 'fontSize');
    var fontWeight = getStyleValue(key, 'fontWeight');
    var textAlign = getStyleValue(key, 'textAlign');
    var marginTop = getStyleValue(key, 'marginTop');
    var marginBottom = getStyleValue(key, 'marginBottom');
    var borderRadius = getStyleValue(key, 'borderRadius');

    return '' +
      fieldRow('Text Color', 'color', 'hws-es-text-color', textColor, '#1a1a2e') +
      fieldRow('Background', 'color', 'hws-es-bg-color', bgColor, '#ffffff') +
      '<div class="hws-editor-panel__divider"></div>' +
      rangeRow('Font Size', 'hws-es-font-size', fontSize || 16, 10, 72, 1, 'px') +
      selectRow('Font Weight', 'hws-es-font-weight', fontWeight || '400', [
        { val: '300', label: 'Light' },
        { val: '400', label: 'Normal' },
        { val: '500', label: 'Medium' },
        { val: '600', label: 'Semi-Bold' },
        { val: '700', label: 'Bold' },
        { val: '800', label: 'Extra-Bold' }
      ]) +
      selectRow('Text Align', 'hws-es-text-align', textAlign || '', [
        { val: '', label: 'Default' },
        { val: 'left', label: 'Left' },
        { val: 'center', label: 'Center' },
        { val: 'right', label: 'Right' }
      ]) +
      '<div class="hws-editor-panel__divider"></div>' +
      rangeRow('Margin Top', 'hws-es-margin-top', marginTop || 0, 0, 80, 1, 'px') +
      rangeRow('Margin Bottom', 'hws-es-margin-bottom', marginBottom || 0, 0, 80, 1, 'px') +
      rangeRow('Border Radius', 'hws-es-border-radius', borderRadius || 0, 0, 40, 1, 'px');
  }

  function bindGenericStyleControls(key, el, container) {
    bindColorField(container, 'hws-es-text-color', key, 'textColor', el);
    bindColorField(container, 'hws-es-bg-color', key, 'bgColor', el);
    bindRangeField(container, 'hws-es-font-size', key, 'fontSize', el, 'px');
    bindSelectField(container, 'hws-es-font-weight', key, 'fontWeight', el);
    bindSelectField(container, 'hws-es-text-align', key, 'textAlign', el);
    bindRangeField(container, 'hws-es-margin-top', key, 'marginTop', el, 'px');
    bindRangeField(container, 'hws-es-margin-bottom', key, 'marginBottom', el, 'px');
    bindRangeField(container, 'hws-es-border-radius', key, 'borderRadius', el, 'px');
  }

  // ---- Button Editor (6B) ----

  function buildButtonEditorHTML(key) {
    var href = getStyleValue(key, 'btnHref');
    var btnBgColor = getStyleValue(key, 'btnBgColor');
    var btnTextColor = getStyleValue(key, 'btnTextColor');
    var btnBorderRadius = getStyleValue(key, 'btnBorderRadius');
    var btnPaddingY = getStyleValue(key, 'btnPaddingY');
    var btnPaddingX = getStyleValue(key, 'btnPaddingX');

    return '' +
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Link URL</label>' +
        '<input type="text" class="hws-editor-input" id="hws-es-btn-href" value="' + api.escAttr(href) + '" placeholder="https://">' +
      '</div>' +
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">' +
          '<input type="checkbox" id="hws-es-btn-newtab" ' + (getStyleValue(key, 'btnNewTab') === 'true' ? 'checked' : '') + '> Open in new tab' +
        '</label>' +
      '</div>' +
      '<div class="hws-editor-panel__divider"></div>' +
      fieldRow('Button Color', 'color', 'hws-es-btn-bg', btnBgColor, '#EB8258') +
      fieldRow('Text Color', 'color', 'hws-es-btn-text', btnTextColor, '#ffffff') +
      '<div class="hws-editor-panel__divider"></div>' +
      rangeRow('Border Radius', 'hws-es-btn-radius', btnBorderRadius || 6, 0, 40, 1, 'px') +
      rangeRow('Padding Y', 'hws-es-btn-pady', btnPaddingY || 12, 4, 32, 1, 'px') +
      rangeRow('Padding X', 'hws-es-btn-padx', btnPaddingX || 24, 8, 60, 1, 'px');
  }

  function bindButtonEditor(key, el, container) {
    // Link URL
    var hrefInput = container.querySelector('#hws-es-btn-href');
    if (hrefInput) {
      hrefInput.addEventListener('input', function() {
        setStyleValue(key, 'btnHref', hrefInput.value);
        if (el.tagName === 'A') el.href = hrefInput.value || '#';
      });
    }

    // New tab checkbox
    var newtabCheck = container.querySelector('#hws-es-btn-newtab');
    if (newtabCheck) {
      newtabCheck.addEventListener('change', function() {
        setStyleValue(key, 'btnNewTab', newtabCheck.checked ? 'true' : '');
        if (el.tagName === 'A') {
          if (newtabCheck.checked) {
            el.target = '_blank';
            el.rel = 'noopener';
          } else {
            el.removeAttribute('target');
            el.removeAttribute('rel');
          }
        }
      });
    }

    bindColorField(container, 'hws-es-btn-bg', key, 'btnBgColor', el);
    bindColorField(container, 'hws-es-btn-text', key, 'btnTextColor', el);
    bindRangeField(container, 'hws-es-btn-radius', key, 'btnBorderRadius', el, 'px');
    bindRangeField(container, 'hws-es-btn-pady', key, 'btnPaddingY', el, 'px');
    bindRangeField(container, 'hws-es-btn-padx', key, 'btnPaddingX', el, 'px');
  }

  // ---- Image Editor (6C) ----

  function buildImageEditorHTML(key) {
    var altText = getStyleValue(key, 'imgAlt');
    var fitMode = getStyleValue(key, 'imgObjectFit');
    var borderRadius = getStyleValue(key, 'imgBorderRadius');
    var opacity = getStyleValue(key, 'imgOpacity');
    var shadow = getStyleValue(key, 'imgShadow');

    return '' +
      '<div class="hws-editor-panel__field">' +
        '<label class="hws-editor-label">Alt Text</label>' +
        '<input type="text" class="hws-editor-input" id="hws-es-img-alt" value="' + api.escAttr(altText) + '" placeholder="Describe the image">' +
      '</div>' +
      selectRow('Object Fit', 'hws-es-img-fit', fitMode || '', [
        { val: '', label: 'Default' },
        { val: 'cover', label: 'Cover' },
        { val: 'contain', label: 'Contain' },
        { val: 'fill', label: 'Fill' },
        { val: 'none', label: 'None' }
      ]) +
      '<div class="hws-editor-panel__divider"></div>' +
      rangeRow('Border Radius', 'hws-es-img-radius', borderRadius || 0, 0, 50, 1, 'px') +
      rangeRow('Opacity', 'hws-es-img-opacity', opacity || 100, 0, 100, 1, '%') +
      rangeRow('Shadow', 'hws-es-img-shadow', shadow || 0, 0, 40, 1, 'px');
  }

  function bindImageEditor(key, el, container) {
    // Find the actual image element
    var imgEl = el.querySelector('img') || el;

    // Alt text
    var altInput = container.querySelector('#hws-es-img-alt');
    if (altInput) {
      altInput.addEventListener('input', function() {
        setStyleValue(key, 'imgAlt', altInput.value);
        if (imgEl.tagName === 'IMG') imgEl.alt = altInput.value;
      });
    }

    bindSelectField(container, 'hws-es-img-fit', key, 'imgObjectFit', imgEl);
    bindRangeField(container, 'hws-es-img-radius', key, 'imgBorderRadius', imgEl, 'px');
    bindRangeField(container, 'hws-es-img-opacity', key, 'imgOpacity', imgEl, '%');
    bindRangeField(container, 'hws-es-img-shadow', key, 'imgShadow', imgEl, 'px');
  }

  // ---- HTML Builder Helpers ----

  function fieldRow(label, type, id, value, defaultColor) {
    return '<div class="hws-editor-panel__field">' +
      '<label class="hws-editor-label">' + label + '</label>' +
      '<div class="hws-editor-color-row">' +
        '<input type="color" class="hws-editor-color-picker" id="' + id + '-picker" value="' + (value || defaultColor) + '">' +
        '<input type="text" class="hws-editor-color-hex" id="' + id + '-hex" value="' + api.escAttr(value) + '" maxlength="7" placeholder="none">' +
      '</div>' +
    '</div>';
  }

  function rangeRow(label, id, value, min, max, step, unit) {
    return '<div class="hws-editor-panel__field hws-editor-panel__field--range">' +
      '<label class="hws-editor-label">' + label + '</label>' +
      '<div class="hws-editor-range-row">' +
        '<input type="range" class="hws-editor-range" id="' + id + '" value="' + value + '" min="' + min + '" max="' + max + '" step="' + step + '">' +
        '<span class="hws-editor-range-value" id="' + id + '-val">' + value + unit + '</span>' +
      '</div>' +
    '</div>';
  }

  function selectRow(label, id, value, options) {
    var html = '<div class="hws-editor-panel__field">' +
      '<label class="hws-editor-label">' + label + '</label>' +
      '<select class="hws-editor-select" id="' + id + '">';

    for (var i = 0; i < options.length; i++) {
      html += '<option value="' + options[i].val + '"' + (value === options[i].val ? ' selected' : '') + '>' + options[i].label + '</option>';
    }

    html += '</select></div>';
    return html;
  }

  // ---- Field Binding Helpers ----

  function bindColorField(container, id, key, prop, el) {
    var picker = container.querySelector('#' + id + '-picker');
    var hex = container.querySelector('#' + id + '-hex');

    if (picker) {
      picker.addEventListener('input', function() {
        if (hex) hex.value = picker.value;
        setStyleValue(key, prop, picker.value);
        applyElementStyle(el, prop, picker.value);
      });
    }
    if (hex) {
      hex.addEventListener('input', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) {
          if (picker) picker.value = hex.value;
          setStyleValue(key, prop, hex.value);
          applyElementStyle(el, prop, hex.value);
        }
      });
    }
  }

  function bindRangeField(container, id, key, prop, el, unit) {
    var range = container.querySelector('#' + id);
    var valSpan = container.querySelector('#' + id + '-val');

    if (range) {
      range.addEventListener('input', function() {
        var val = range.value;
        if (valSpan) valSpan.textContent = val + unit;
        setStyleValue(key, prop, val);
        applyElementStyle(el, prop, val);
      });
    }
  }

  function bindSelectField(container, id, key, prop, el) {
    var select = container.querySelector('#' + id);
    if (select) {
      select.addEventListener('change', function() {
        setStyleValue(key, prop, select.value);
        applyElementStyle(el, prop, select.value);
      });
    }
  }

  // ---- Restore Styles on Page Load ----

  function restoreAllElementStyles() {
    var styles = getElementStyles();
    if (!styles || Object.keys(styles).length === 0) return;

    Object.keys(styles).forEach(function(key) {
      var el = document.querySelector('[data-hws="' + key + '"]') ||
               document.querySelector('[data-hws-features="' + key + '"]');
      if (!el) return;

      var s = styles[key];
      var target = el;

      // For images, find the img inside
      if (key.indexOf('img.') === 0) {
        var img = el.querySelector('img');
        if (img) target = img;
      }

      Object.keys(s).forEach(function(prop) {
        if (s[prop] !== '' && s[prop] !== undefined) {
          applyElementStyle(target, prop, s[prop]);

          // Special: apply href and target for buttons
          if (prop === 'btnHref' && el.tagName === 'A') {
            el.href = s[prop];
          }
          if (prop === 'btnNewTab' && s[prop] === 'true' && el.tagName === 'A') {
            el.target = '_blank';
            el.rel = 'noopener';
          }
          if (prop === 'imgAlt' && target.tagName === 'IMG') {
            target.alt = s[prop];
          }
        }
      });
    });
  }

  // ---- Lifecycle ----

  function activate() {
    watchPanel();
  }

  function deactivate() {
    stopWatchingPanel();
  }

  // ---- Register Hooks ----

  api.onEnterEditMode(function() {
    activate();
  });

  api.onExitEditMode(function() {
    deactivate();
  });

  // ---- Expose for site-renderer ----

  window.HWSElementStyles = {
    restoreElementStyles: restoreAllElementStyles
  };

})();
