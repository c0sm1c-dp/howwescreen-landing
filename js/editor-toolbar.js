/**
 * Editor Toolbar — Rich floating formatting toolbar for inline text editing
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Squarespace/Wix-style toolbar with:
 * Font Family | Format/Heading | B I U S | Link | Align L C R | Lists UL OL | Font Size | Color | Highlight
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorToolbar] HWSEditor._internal not found — skipping toolbar init.');
    return;
  }

  // ---- State ----
  var _bar = null;
  var _row1 = null;            // Main button row
  var _linkPopover = null;
  var _colorPicker = null;
  var _highlightPicker = null;
  var _isVisible = false;
  var _activeEl = null;
  var _savedRange = null;

  // ---- Constants ----

  var FONTS = [
    { label: 'Helvetica',      value: 'Helvetica Neue, Helvetica, Arial, sans-serif' },
    { label: 'Arial',          value: 'Arial, sans-serif' },
    { label: 'Georgia',        value: 'Georgia, serif' },
    { label: 'Times',          value: 'Times New Roman, Times, serif' },
    { label: 'Courier',        value: 'Courier New, Courier, monospace' },
    { label: 'Verdana',        value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet',      value: 'Trebuchet MS, sans-serif' },
    { label: 'Palatino',       value: 'Palatino Linotype, Palatino, serif' },
    { label: 'Garamond',       value: 'Garamond, serif' },
    { label: 'System',         value: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }
  ];

  var FORMATS = [
    { label: 'Paragraph',  value: 'P' },
    { label: 'Heading 1',  value: 'H1' },
    { label: 'Heading 2',  value: 'H2' },
    { label: 'Heading 3',  value: 'H3' },
    { label: 'Heading 4',  value: 'H4' },
    { label: 'Quote',      value: 'BLOCKQUOTE' }
  ];

  var PALETTE = [
    { label: 'Black',         color: '#1a1a2e' },
    { label: 'Brand Brown',   color: '#6B4C3B' },
    { label: 'Mauve',         color: '#995D81' },
    { label: 'Steel Blue',    color: '#6689A1' },
    { label: 'Lime',          color: '#D8DC6A' },
    { label: 'Burnt Orange',  color: '#EB8258' },
    { label: 'Yellow',        color: '#F6F740' },
    { label: 'White',         color: '#FFFFFF' },
    { label: 'Dark Gray',     color: '#555555' },
    { label: 'Light Gray',    color: '#BBBBBB' }
  ];

  var HIGHLIGHT_PALETTE = [
    { label: 'Yellow',        color: '#FFF9C4' },
    { label: 'Pink',          color: '#F8BBD0' },
    { label: 'Blue',          color: '#BBDEFB' },
    { label: 'Green',         color: '#C8E6C9' },
    { label: 'Orange',        color: '#FFE0B2' },
    { label: 'Purple',        color: '#E1BEE7' },
    { label: 'None',          color: 'transparent' }
  ];

  // SVG Icons
  var ICONS = {
    alignLeft:    '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="1" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="1" y1="15" x2="9" y2="15" stroke="currentColor" stroke-width="2"/></svg>',
    alignCenter:  '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="3" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="4" y1="15" x2="12" y2="15" stroke="currentColor" stroke-width="2"/></svg>',
    alignRight:   '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="7" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>',
    listUL:       '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="2" cy="4" r="1.5" fill="currentColor"/><line x1="6" y1="4" x2="15" y2="4" stroke="currentColor" stroke-width="2"/><circle cx="2" cy="8" r="1.5" fill="currentColor"/><line x1="6" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="2" cy="12" r="1.5" fill="currentColor"/><line x1="6" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    listOL:       '<svg width="16" height="16" viewBox="0 0 16 16"><text x="1" y="5.5" font-size="6" fill="currentColor" font-family="sans-serif">1</text><line x1="6" y1="4" x2="15" y2="4" stroke="currentColor" stroke-width="2"/><text x="1" y="9.5" font-size="6" fill="currentColor" font-family="sans-serif">2</text><line x1="6" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="2"/><text x="1" y="13.5" font-size="6" fill="currentColor" font-family="sans-serif">3</text><line x1="6" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    link:         '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M6.5 9.5a3.5 3.5 0 004.9-.4l2-2a3.5 3.5 0 00-5-4.9l-1.1 1.1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M9.5 6.5a3.5 3.5 0 00-4.9.4l-2 2a3.5 3.5 0 005 4.9l1.1-1.1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>'
  };

  // ---- Build Toolbar DOM ----

  function createBar() {
    if (_bar) return;

    _bar = document.createElement('div');
    _bar.id = 'hws-fmt-toolbar';
    _bar.className = 'hws-fmt-toolbar';

    _bar.addEventListener('mousedown', function(e) {
      // Allow select/input interactions
      var tag = e.target.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'OPTION') return;
      e.preventDefault();
      e.stopPropagation();
    });

    _row1 = document.createElement('div');
    _row1.className = 'hws-fmt-row';

    // ---- Font Family Dropdown ----
    var fontSelect = createSelect('hws-fmt-font-select', FONTS, 'Font Family');
    fontSelect.addEventListener('change', function() {
      if (_activeEl) _activeEl.focus();
      restoreSelection();
      var val = fontSelect.value;
      if (val) {
        wrapSelectionInSpan('font-family', val);
        api.pushUndo();
      }
      fontSelect.value = '';
    });
    _row1.appendChild(fontSelect);

    // ---- Format/Heading Dropdown ----
    var formatSelect = createSelect('hws-fmt-format-select', FORMATS, 'Format');
    formatSelect.addEventListener('change', function() {
      if (_activeEl) _activeEl.focus();
      restoreSelection();
      var val = formatSelect.value;
      if (val) {
        document.execCommand('formatBlock', false, '<' + val + '>');
        api.pushUndo();
        updateActiveStates();
      }
    });
    _row1.appendChild(formatSelect);

    addSep(_row1);

    // ---- Inline Formatting: B I U S ----
    addBtn(_row1, 'bold',          '<b>B</b>',                 'Bold (Ctrl+B)');
    addBtn(_row1, 'italic',        '<i>I</i>',                 'Italic (Ctrl+I)');
    addBtn(_row1, 'underline',     '<u>U</u>',                 'Underline (Ctrl+U)');
    addBtn(_row1, 'strikeThrough', '<s style="font-size:14px">S</s>', 'Strikethrough');

    addSep(_row1);

    // ---- Link ----
    addBtn(_row1, 'link', ICONS.link, 'Insert Link');

    addSep(_row1);

    // ---- Alignment ----
    addBtn(_row1, 'justifyLeft',   ICONS.alignLeft,   'Align Left');
    addBtn(_row1, 'justifyCenter', ICONS.alignCenter,  'Align Center');
    addBtn(_row1, 'justifyRight',  ICONS.alignRight,   'Align Right');

    addSep(_row1);

    // ---- Lists ----
    addBtn(_row1, 'insertUnorderedList', ICONS.listUL, 'Bullet List');
    addBtn(_row1, 'insertOrderedList',   ICONS.listOL, 'Numbered List');

    addSep(_row1);

    // ---- Font Size (numeric input) ----
    var sizeWrap = document.createElement('div');
    sizeWrap.className = 'hws-fmt-size-wrap';

    var sizeDown = document.createElement('button');
    sizeDown.type = 'button';
    sizeDown.className = 'hws-fmt-size-arrow';
    sizeDown.innerHTML = '&#9662;';
    sizeDown.title = 'Decrease size';

    var sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.className = 'hws-fmt-size-input';
    sizeInput.min = '8';
    sizeInput.max = '96';
    sizeInput.value = '16';
    sizeInput.title = 'Font size (px)';

    var sizeUp = document.createElement('button');
    sizeUp.type = 'button';
    sizeUp.className = 'hws-fmt-size-arrow';
    sizeUp.innerHTML = '&#9652;';
    sizeUp.title = 'Increase size';

    function applyFontSize(px) {
      if (px < 8) px = 8;
      if (px > 96) px = 96;
      sizeInput.value = px;
      if (_activeEl) _activeEl.focus();
      restoreSelection();
      wrapSelectionInSpan('font-size', px + 'px');
      api.pushUndo();
    }

    sizeDown.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      saveSelection();
      applyFontSize(parseInt(sizeInput.value, 10) - 1);
    });
    sizeUp.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      saveSelection();
      applyFontSize(parseInt(sizeInput.value, 10) + 1);
    });
    sizeInput.addEventListener('change', function() {
      saveSelection();
      applyFontSize(parseInt(sizeInput.value, 10) || 16);
    });
    sizeInput.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    sizeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveSelection();
        applyFontSize(parseInt(sizeInput.value, 10) || 16);
      }
    });

    sizeWrap.appendChild(sizeDown);
    sizeWrap.appendChild(sizeInput);
    sizeWrap.appendChild(sizeUp);
    _row1.appendChild(sizeWrap);

    addSep(_row1);

    // ---- Text Color ----
    addBtn(_row1, 'textColor', '<span class="hws-fmt-color-icon">A</span>', 'Text Color');

    // ---- Highlight Color ----
    addBtn(_row1, 'highlightColor', '<span class="hws-fmt-highlight-icon">A</span>', 'Highlight');

    _bar.appendChild(_row1);

    // ---- Link Popover ----
    _linkPopover = buildLinkPopover();
    _bar.appendChild(_linkPopover);

    // ---- Color Picker ----
    _colorPicker = buildColorPicker(PALETTE, 'foreColor', 'hws-fmt-color-picker');
    _bar.appendChild(_colorPicker);

    // ---- Highlight Picker ----
    _highlightPicker = buildColorPicker(HIGHLIGHT_PALETTE, 'hiliteColor', 'hws-fmt-highlight-picker');
    _bar.appendChild(_highlightPicker);

    document.body.appendChild(_bar);
  }

  // ---- DOM Helpers ----

  function createSelect(className, options, placeholder) {
    var select = document.createElement('select');
    select.className = className;

    var defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = placeholder;
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    select.appendChild(defaultOpt);

    options.forEach(function(opt) {
      var o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    });

    return select;
  }

  function addBtn(parent, cmd, icon, title) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'hws-fmt-btn';
    button.setAttribute('data-cmd', cmd);
    button.title = title;
    button.innerHTML = icon;
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleCommand(cmd);
    });
    parent.appendChild(button);
    return button;
  }

  function addSep(parent) {
    var sep = document.createElement('span');
    sep.className = 'hws-fmt-sep';
    parent.appendChild(sep);
  }

  function buildLinkPopover() {
    var popover = document.createElement('div');
    popover.className = 'hws-fmt-link-popover';
    popover.style.display = 'none';

    var input = document.createElement('input');
    input.type = 'url';
    input.placeholder = 'https://';
    input.className = 'hws-fmt-link-input';

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.textContent = 'Apply';
    applyBtn.className = 'hws-fmt-link-apply';

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'hws-fmt-link-remove';

    applyBtn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      var url = input.value.trim();
      if (url) {
        restoreSelection();
        document.execCommand('createLink', false, url);
        api.pushUndo();
      }
      popover.style.display = 'none';
    });

    removeBtn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      restoreSelection();
      document.execCommand('unlink', false, null);
      api.pushUndo();
      popover.style.display = 'none';
    });

    input.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); }
      if (e.key === 'Escape') { e.preventDefault(); popover.style.display = 'none'; }
    });

    popover.appendChild(input);
    popover.appendChild(applyBtn);
    popover.appendChild(removeBtn);
    return popover;
  }

  function buildColorPicker(palette, execCmd, className) {
    var picker = document.createElement('div');
    picker.className = className;
    picker.style.display = 'none';

    var grid = document.createElement('div');
    grid.className = 'hws-fmt-swatch-grid';

    palette.forEach(function(swatch) {
      var s = document.createElement('button');
      s.type = 'button';
      s.className = 'hws-fmt-swatch';
      s.style.backgroundColor = swatch.color;
      s.title = swatch.label;
      if (swatch.color === '#FFFFFF' || swatch.color === '#F6F740' || swatch.color === '#D8DC6A' || swatch.color === 'transparent') {
        s.style.border = '1px solid rgba(255,255,255,0.3)';
      }
      if (swatch.color === 'transparent') {
        s.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14"><line x1="0" y1="14" x2="14" y2="0" stroke="#f44" stroke-width="2"/></svg>';
      }
      s.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        restoreSelection();
        if (swatch.color === 'transparent' && execCmd === 'hiliteColor') {
          document.execCommand('removeFormat', false, null);
        } else {
          document.execCommand(execCmd, false, swatch.color);
        }
        api.pushUndo();
        picker.style.display = 'none';
        updateActiveStates();
      });
      grid.appendChild(s);
    });

    picker.appendChild(grid);

    // Custom hex input
    var hexRow = document.createElement('div');
    hexRow.className = 'hws-fmt-hex-row';

    var hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'hws-fmt-hex-input';
    hexInput.placeholder = '#000000';
    hexInput.maxLength = 7;

    var hexApply = document.createElement('button');
    hexApply.type = 'button';
    hexApply.className = 'hws-fmt-hex-apply';
    hexApply.textContent = 'Apply';

    function applyHex() {
      var val = hexInput.value.trim();
      if (val && /^#?[0-9a-fA-F]{3,6}$/.test(val)) {
        if (val[0] !== '#') val = '#' + val;
        restoreSelection();
        document.execCommand(execCmd, false, val);
        api.pushUndo();
        picker.style.display = 'none';
        updateActiveStates();
      }
    }

    hexApply.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      applyHex();
    });
    hexInput.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    hexInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); applyHex(); }
      e.stopPropagation();
    });

    hexRow.appendChild(hexInput);
    hexRow.appendChild(hexApply);
    picker.appendChild(hexRow);

    return picker;
  }

  // ---- Selection Helpers ----

  function saveSelection() {
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
      _savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!_savedRange) return;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(_savedRange);
  }

  /**
   * Wrap the current selection in a <span> with a given CSS property.
   * More reliable than execCommand for font-family and precise font sizes.
   */
  function wrapSelectionInSpan(cssProp, cssValue) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;

    var range = sel.getRangeAt(0);
    if (range.collapsed) return;

    // Create wrapper span
    var span = document.createElement('span');
    span.style[cssProp === 'font-family' ? 'fontFamily' : 'fontSize'] = cssValue;

    try {
      range.surroundContents(span);
    } catch (e) {
      // surroundContents fails if selection crosses element boundaries
      // Fall back to extracting and wrapping
      var fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }

    // Restore selection to the new span
    sel.removeAllRanges();
    var newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
    _savedRange = newRange.cloneRange();
  }

  // ---- Command Handler ----

  function handleCommand(cmd) {
    if (_activeEl) _activeEl.focus();
    restoreSelection();

    if (cmd === 'link') {
      handleLinkCommand();
      return;
    }
    if (cmd === 'textColor') {
      handlePickerToggle(_colorPicker);
      return;
    }
    if (cmd === 'highlightColor') {
      handlePickerToggle(_highlightPicker);
      return;
    }

    // Standard execCommand
    document.execCommand(cmd, false, null);
    api.pushUndo();
    updateActiveStates();
  }

  function handleLinkCommand() {
    closeAllPopovers();
    saveSelection();

    var sel = window.getSelection();
    var anchor = null;
    if (sel.rangeCount > 0) {
      var node = sel.anchorNode;
      while (node && node !== _activeEl) {
        if (node.nodeName === 'A') { anchor = node; break; }
        node = node.parentNode;
      }
    }

    var input = _linkPopover.querySelector('input');
    input.value = anchor ? anchor.href : '';
    _linkPopover.style.display = 'flex';
    setTimeout(function() { input.focus(); input.select(); }, 50);
  }

  function handlePickerToggle(picker) {
    var wasVisible = picker.style.display !== 'none';
    closeAllPopovers();
    if (!wasVisible) {
      saveSelection();
      picker.style.display = 'block';
    }
  }

  function closeAllPopovers() {
    if (_linkPopover) _linkPopover.style.display = 'none';
    if (_colorPicker) _colorPicker.style.display = 'none';
    if (_highlightPicker) _highlightPicker.style.display = 'none';
  }

  // ---- Active State Detection ----

  function updateActiveStates() {
    if (!_bar) return;

    // Update buttons
    var buttons = _bar.querySelectorAll('.hws-fmt-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var cmd = btn.getAttribute('data-cmd');
      if (!cmd) continue;

      var isActive = false;
      try {
        if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline' || cmd === 'strikeThrough' ||
            cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight' ||
            cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
          isActive = document.queryCommandState(cmd);
        }
      } catch (e) {}

      if (isActive) {
        btn.classList.add('hws-fmt-active');
      } else {
        btn.classList.remove('hws-fmt-active');
      }
    }

    // Update format dropdown to show current block format
    var formatSelect = _bar.querySelector('.hws-fmt-format-select');
    if (formatSelect) {
      try {
        var blockTag = document.queryCommandValue('formatBlock').toUpperCase();
        // Normalize — some browsers return "h1" vs "H1"
        var match = false;
        for (var j = 0; j < formatSelect.options.length; j++) {
          if (formatSelect.options[j].value === blockTag) {
            formatSelect.selectedIndex = j;
            match = true;
            break;
          }
        }
        if (!match) formatSelect.selectedIndex = 0;
      } catch (e) {}
    }

    // Update font size input
    var sizeInput = _bar.querySelector('.hws-fmt-size-input');
    if (sizeInput && _activeEl) {
      var sel = window.getSelection();
      if (sel.rangeCount > 0) {
        var container = sel.anchorNode;
        if (container && container.nodeType === 3) container = container.parentNode;
        if (container) {
          var computed = window.getComputedStyle(container);
          var px = Math.round(parseFloat(computed.fontSize));
          if (px && px > 0) sizeInput.value = px;
        }
      }
    }
  }

  // ---- Positioning ----

  function positionBar() {
    if (!_bar || !_activeEl) return;

    var sel = window.getSelection();
    var rect;

    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      rect = sel.getRangeAt(0).getBoundingClientRect();
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      rect = _activeEl.getBoundingClientRect();
    }

    var barRect = _bar.getBoundingClientRect();
    var barW = barRect.width || 700;
    var barH = barRect.height || 48;
    var scrollY = window.scrollY || window.pageYOffset;

    var left = rect.left + (rect.width / 2) - (barW / 2);
    var top = rect.top + scrollY - barH - 12;

    if (top - scrollY < 60) {  // Account for top editor bar
      top = rect.bottom + scrollY + 12;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - barW - 8));

    _bar.style.left = left + 'px';
    _bar.style.top = top + 'px';
  }

  // ---- Show / Hide ----

  function show(el, key) {
    if (!api.isRichTextKey(key)) return;

    _activeEl = el;
    createBar();
    _bar.style.display = 'block';
    _isVisible = true;

    closeAllPopovers();
    positionBar();
    updateActiveStates();

    document.addEventListener('selectionchange', onSelectionChange, false);
  }

  function hide() {
    if (!_bar) return;
    _bar.style.display = 'none';
    _isVisible = false;
    _activeEl = null;
    closeAllPopovers();
    document.removeEventListener('selectionchange', onSelectionChange, false);
  }

  function destroy() {
    hide();
    if (_bar) {
      _bar.remove();
      _bar = null;
      _row1 = null;
      _linkPopover = null;
      _colorPicker = null;
      _highlightPicker = null;
    }
  }

  function onSelectionChange() {
    if (!_isVisible) return;
    saveSelection();
    positionBar();
    updateActiveStates();
  }

  // ---- Register Lifecycle Hooks ----

  api.onStartEditing(function(el, key) {
    show(el, key);
  });

  api.onStopEditing(function() {
    hide();
  });

  api.onExitEditMode(function() {
    destroy();
  });

})();
