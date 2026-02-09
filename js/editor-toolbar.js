/**
 * Editor Toolbar — Floating formatting toolbar for inline text editing
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Shows Bold / Italic / Underline / Link / Align / Font Size / Text Color
 * when the user is editing a rich-text element.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorToolbar] HWSEditor._internal not found — skipping toolbar init.');
    return;
  }

  // ---- State ----
  var _bar = null;           // The toolbar element
  var _linkPopover = null;   // Link URL input popover
  var _colorPicker = null;   // Color swatch grid
  var _isVisible = false;
  var _activeEl = null;      // Element being edited

  // Brand palette for text color swatches
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

  // ---- Build Toolbar DOM ----

  function createBar() {
    if (_bar) return;

    _bar = document.createElement('div');
    _bar.id = 'hws-fmt-toolbar';
    _bar.className = 'hws-fmt-toolbar';

    // Prevent clicks inside toolbar from stealing focus from contenteditable
    _bar.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    // --- Format buttons ---
    var groups = [
      // Group 1: Inline formatting
      [
        { cmd: 'bold',      icon: '<b>B</b>',  title: 'Bold (Ctrl+B)' },
        { cmd: 'italic',    icon: '<i>I</i>',   title: 'Italic (Ctrl+I)' },
        { cmd: 'underline', icon: '<u>U</u>',   title: 'Underline (Ctrl+U)' },
        { cmd: 'link',      icon: '&#128279;',  title: 'Insert Link' }
      ],
      // Group 2: Alignment
      [
        { cmd: 'justifyLeft',   icon: '\u2261',  title: 'Align Left',   extraClass: 'hws-fmt-align' },
        { cmd: 'justifyCenter', icon: '\u2261',  title: 'Align Center', extraClass: 'hws-fmt-align' },
        { cmd: 'justifyRight',  icon: '\u2261',  title: 'Align Right',  extraClass: 'hws-fmt-align' }
      ],
      // Group 3: Font size
      [
        { cmd: 'fontSize-small',  icon: '<span style="font-size:11px">S</span>',  title: 'Small Text' },
        { cmd: 'fontSize-medium', icon: '<span style="font-size:14px">M</span>',  title: 'Medium Text' },
        { cmd: 'fontSize-large',  icon: '<span style="font-size:17px">L</span>',  title: 'Large Text' }
      ],
      // Group 4: Color
      [
        { cmd: 'textColor', icon: '<span class="hws-fmt-color-icon">A</span>', title: 'Text Color' }
      ]
    ];

    groups.forEach(function(group, gi) {
      if (gi > 0) {
        var sep = document.createElement('span');
        sep.className = 'hws-fmt-sep';
        _bar.appendChild(sep);
      }

      group.forEach(function(btn) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'hws-fmt-btn';
        if (btn.extraClass) button.classList.add(btn.extraClass);
        button.setAttribute('data-cmd', btn.cmd);
        button.title = btn.title;
        button.innerHTML = btn.icon;

        // Alignment icons — distinct visual via CSS rotation
        if (btn.cmd === 'justifyLeft')   button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="1" y1="7" x2="11" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="1" y1="15" x2="9" y2="15" stroke="currentColor" stroke-width="2"/></svg>';
        if (btn.cmd === 'justifyCenter') button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="3" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="4" y1="15" x2="12" y2="15" stroke="currentColor" stroke-width="2"/></svg>';
        if (btn.cmd === 'justifyRight')  button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="2"/><line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="2"/><line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2"/><line x1="7" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>';

        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          handleCommand(btn.cmd);
        });
        _bar.appendChild(button);
      });
    });

    // Link popover (hidden by default)
    _linkPopover = document.createElement('div');
    _linkPopover.className = 'hws-fmt-link-popover';
    _linkPopover.style.display = 'none';

    var linkInput = document.createElement('input');
    linkInput.type = 'url';
    linkInput.placeholder = 'https://';
    linkInput.className = 'hws-fmt-link-input';

    var linkApply = document.createElement('button');
    linkApply.type = 'button';
    linkApply.textContent = 'Apply';
    linkApply.className = 'hws-fmt-link-apply';

    var linkRemove = document.createElement('button');
    linkRemove.type = 'button';
    linkRemove.textContent = 'Remove';
    linkRemove.className = 'hws-fmt-link-remove';

    linkApply.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var url = linkInput.value.trim();
      if (url) {
        restoreSelection();
        document.execCommand('createLink', false, url);
        api.pushUndo();
      }
      _linkPopover.style.display = 'none';
    });

    linkRemove.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      restoreSelection();
      document.execCommand('unlink', false, null);
      api.pushUndo();
      _linkPopover.style.display = 'none';
    });

    // Prevent link input from losing contenteditable focus
    linkInput.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });
    linkInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        linkApply.click();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        _linkPopover.style.display = 'none';
      }
    });

    _linkPopover.appendChild(linkInput);
    _linkPopover.appendChild(linkApply);
    _linkPopover.appendChild(linkRemove);
    _bar.appendChild(_linkPopover);

    // Color picker (hidden by default)
    _colorPicker = document.createElement('div');
    _colorPicker.className = 'hws-fmt-color-picker';
    _colorPicker.style.display = 'none';

    PALETTE.forEach(function(swatch) {
      var s = document.createElement('button');
      s.type = 'button';
      s.className = 'hws-fmt-swatch';
      s.style.backgroundColor = swatch.color;
      s.title = swatch.label;
      if (swatch.color === '#FFFFFF' || swatch.color === '#F6F740' || swatch.color === '#D8DC6A') {
        s.style.border = '1px solid #ccc';
      }
      s.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        restoreSelection();
        document.execCommand('foreColor', false, swatch.color);
        api.pushUndo();
        _colorPicker.style.display = 'none';
        updateActiveStates();
      });
      _colorPicker.appendChild(s);
    });

    _bar.appendChild(_colorPicker);

    document.body.appendChild(_bar);
  }

  // ---- Selection save/restore (for popover interactions) ----

  var _savedRange = null;

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

  // ---- Command Handler ----

  function handleCommand(cmd) {
    // Make sure contenteditable element has focus
    if (_activeEl) _activeEl.focus();
    restoreSelection();

    if (cmd === 'link') {
      handleLinkCommand();
      return;
    }

    if (cmd === 'textColor') {
      handleColorCommand();
      return;
    }

    // Font size mapping
    if (cmd.startsWith('fontSize-')) {
      var sizeMap = { 'fontSize-small': '2', 'fontSize-medium': '3', 'fontSize-large': '5' };
      document.execCommand('fontSize', false, sizeMap[cmd]);
      api.pushUndo();
      updateActiveStates();
      return;
    }

    // Standard execCommand (bold, italic, underline, justifyLeft, etc.)
    document.execCommand(cmd, false, null);
    api.pushUndo();
    updateActiveStates();
  }

  function handleLinkCommand() {
    // Close color picker if open
    if (_colorPicker) _colorPicker.style.display = 'none';

    saveSelection();

    // Check if selection is inside a link
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

    // Focus input without destroying selection
    setTimeout(function() { input.focus(); input.select(); }, 50);
  }

  function handleColorCommand() {
    // Close link popover if open
    if (_linkPopover) _linkPopover.style.display = 'none';

    saveSelection();
    _colorPicker.style.display = _colorPicker.style.display === 'none' ? 'grid' : 'none';
  }

  // ---- Active State Detection ----

  function updateActiveStates() {
    if (!_bar) return;
    var buttons = _bar.querySelectorAll('.hws-fmt-btn');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var cmd = btn.getAttribute('data-cmd');
      if (!cmd) continue;

      var isActive = false;
      try {
        if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline') {
          isActive = document.queryCommandState(cmd);
        } else if (cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight') {
          isActive = document.queryCommandState(cmd);
        }
      } catch (e) {}

      if (isActive) {
        btn.classList.add('hws-fmt-active');
      } else {
        btn.classList.remove('hws-fmt-active');
      }
    }
  }

  // ---- Positioning ----

  function positionBar() {
    if (!_bar || !_activeEl) return;

    var sel = window.getSelection();
    var rect;

    // Try to position above the selection
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      rect = sel.getRangeAt(0).getBoundingClientRect();
    }

    // Fallback to the element itself
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      rect = _activeEl.getBoundingClientRect();
    }

    var barRect = _bar.getBoundingClientRect();
    var barW = barRect.width || 380;
    var barH = barRect.height || 44;
    var scrollY = window.scrollY || window.pageYOffset;
    var scrollX = window.scrollX || window.pageXOffset;

    // Center above selection, clamp to viewport
    var left = rect.left + scrollX + (rect.width / 2) - (barW / 2);
    var top = rect.top + scrollY - barH - 10;

    // If it goes above viewport, show below instead
    if (top - scrollY < 8) {
      top = rect.bottom + scrollY + 10;
    }

    // Clamp horizontal
    left = Math.max(8, Math.min(left, window.innerWidth - barW - 8));

    _bar.style.left = left + 'px';
    _bar.style.top = top + 'px';
  }

  // ---- Show / Hide ----

  function show(el, key) {
    // Only show for rich text keys
    if (!api.isRichTextKey(key)) return;

    _activeEl = el;
    createBar();
    _bar.style.display = 'flex';
    _isVisible = true;

    // Close sub-menus
    if (_linkPopover) _linkPopover.style.display = 'none';
    if (_colorPicker) _colorPicker.style.display = 'none';

    positionBar();
    updateActiveStates();

    // Reposition on selection change
    document.addEventListener('selectionchange', onSelectionChange, false);
  }

  function hide() {
    if (!_bar) return;
    _bar.style.display = 'none';
    _isVisible = false;
    _activeEl = null;
    if (_linkPopover) _linkPopover.style.display = 'none';
    if (_colorPicker) _colorPicker.style.display = 'none';
    document.removeEventListener('selectionchange', onSelectionChange, false);
  }

  function destroy() {
    hide();
    if (_bar) {
      _bar.remove();
      _bar = null;
      _linkPopover = null;
      _colorPicker = null;
    }
  }

  function onSelectionChange() {
    if (!_isVisible) return;
    positionBar();
    updateActiveStates();
  }

  // ---- Register Lifecycle Hooks ----

  api.onStartEditing(function(el, key) {
    show(el, key);
  });

  api.onStopEditing(function(el) {
    hide();
  });

  api.onExitEditMode(function() {
    destroy();
  });

  // If editor is already in edit mode (hot reload case), don't auto-show
  // The toolbar will appear on next startEditing call

})();
