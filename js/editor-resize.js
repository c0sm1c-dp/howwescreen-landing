/**
 * Editor Resize — Drag handles for resizing images, buttons, and custom blocks
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * When an image or button is selected in edit mode, shows 8 resize handles.
 * Drag corners to resize proportionally, edges to resize single axis.
 * Dimensions tooltip shown near cursor during resize.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorResize] HWSEditor._internal not found — skipping resize handles.');
    return;
  }

  // ---- State ----
  var _handles = null;         // container div with 8 handle elements
  var _dimTooltip = null;      // "320 × 240" tooltip
  var _resizing = false;
  var _activeHandle = null;
  var _startX = 0;
  var _startY = 0;
  var _startW = 0;
  var _startH = 0;
  var _startLeft = 0;
  var _startTop = 0;
  var _aspectRatio = 1;
  var _targetEl = null;        // the actual img / .btn element being resized
  var _currentEl = null;       // currently decorated element
  var _isEditorActive = false;

  var MIN_W = 40;
  var MIN_H = 40;

  // ---- Handle positions ----
  var HANDLE_POSITIONS = [
    { name: 'nw', cursor: 'nwse-resize' },
    { name: 'n',  cursor: 'ns-resize' },
    { name: 'ne', cursor: 'nesw-resize' },
    { name: 'e',  cursor: 'ew-resize' },
    { name: 'se', cursor: 'nwse-resize' },
    { name: 's',  cursor: 'ns-resize' },
    { name: 'sw', cursor: 'nesw-resize' },
    { name: 'w',  cursor: 'ew-resize' }
  ];

  // ---- Helpers ----

  function isResizable(el) {
    if (!el) return false;
    // Images
    if (el.tagName === 'IMG') return true;
    // Buttons
    if (el.classList.contains('btn') || el.classList.contains('btn--secondary') || el.tagName === 'BUTTON') return true;
    // Elements with img.* keys
    var key = api.getHwsKey(el);
    if (key && key.indexOf('img.') === 0) return true;
    // SVG logos
    if (el.querySelector('svg') && key && key.indexOf('img.') === 0) return true;
    return false;
  }

  function getResizableTarget(hwsEl) {
    // For image containers (data-hws="img.*"), target the img inside
    var key = api.getHwsKey(hwsEl);
    if (key && key.indexOf('img.') === 0) {
      var img = hwsEl.querySelector('img');
      if (img) return img;
      return hwsEl;
    }
    return hwsEl;
  }

  // ---- Create Handles ----

  function createHandles() {
    if (_handles) return;

    _handles = document.createElement('div');
    _handles.className = 'hws-resize-handles';
    _handles.style.cssText = 'position:absolute;pointer-events:none;z-index:100006;display:none;';

    for (var i = 0; i < HANDLE_POSITIONS.length; i++) {
      var h = document.createElement('div');
      h.className = 'hws-resize-handle hws-resize-handle--' + HANDLE_POSITIONS[i].name;
      h.setAttribute('data-handle', HANDLE_POSITIONS[i].name);
      h.style.cursor = HANDLE_POSITIONS[i].cursor;
      h.style.pointerEvents = 'auto';
      _handles.appendChild(h);
    }

    // Dimension tooltip
    _dimTooltip = document.createElement('div');
    _dimTooltip.className = 'hws-resize-dims';
    _dimTooltip.style.cssText = 'position:fixed;display:none;z-index:100008;';
    document.body.appendChild(_dimTooltip);

    document.body.appendChild(_handles);

    // Mouse handlers on handles
    _handles.addEventListener('mousedown', onHandleMouseDown);
  }

  // ---- Position Handles ----

  function positionHandles(el) {
    if (!_handles || !el) return;

    var rect = el.getBoundingClientRect();
    var scrollX = window.scrollX || window.pageXOffset;
    var scrollY = window.scrollY || window.pageYOffset;

    _handles.style.left = (rect.left + scrollX) + 'px';
    _handles.style.top = (rect.top + scrollY) + 'px';
    _handles.style.width = rect.width + 'px';
    _handles.style.height = rect.height + 'px';
    _handles.style.display = 'block';
  }

  function hideHandles() {
    if (_handles) _handles.style.display = 'none';
    if (_dimTooltip) _dimTooltip.style.display = 'none';
    _currentEl = null;
    _targetEl = null;
  }

  // ---- Show Handles on Selected Element ----

  function onElementSelected(el) {
    if (!_isEditorActive) return;
    if (!el || !isResizable(el)) {
      hideHandles();
      return;
    }

    createHandles();
    _currentEl = el;
    _targetEl = getResizableTarget(el);
    positionHandles(_targetEl);
  }

  function onElementDeselected() {
    hideHandles();
  }

  // ---- Resize Logic ----

  function onHandleMouseDown(e) {
    var handle = e.target.closest('[data-handle]');
    if (!handle || !_targetEl) return;

    e.preventDefault();
    e.stopPropagation();

    _resizing = true;
    _activeHandle = handle.getAttribute('data-handle');

    var rect = _targetEl.getBoundingClientRect();
    _startX = e.clientX;
    _startY = e.clientY;
    _startW = rect.width;
    _startH = rect.height;
    _startLeft = rect.left;
    _startTop = rect.top;
    _aspectRatio = _startW / _startH;

    // Show dimensions tooltip
    updateDimTooltip(e.clientX, e.clientY, Math.round(_startW), Math.round(_startH));

    document.addEventListener('mousemove', onResizeMouseMove, true);
    document.addEventListener('mouseup', onResizeMouseUp, true);

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.cursor = handle.style.cursor;
  }

  function onResizeMouseMove(e) {
    if (!_resizing || !_targetEl) return;

    e.preventDefault();

    var dx = e.clientX - _startX;
    var dy = e.clientY - _startY;

    var newW = _startW;
    var newH = _startH;

    var isCorner = _activeHandle === 'nw' || _activeHandle === 'ne' ||
                   _activeHandle === 'sw' || _activeHandle === 'se';

    switch (_activeHandle) {
      case 'e':
        newW = _startW + dx;
        break;
      case 'w':
        newW = _startW - dx;
        break;
      case 's':
        newH = _startH + dy;
        break;
      case 'n':
        newH = _startH - dy;
        break;
      case 'se':
        newW = _startW + dx;
        newH = newW / _aspectRatio;
        break;
      case 'sw':
        newW = _startW - dx;
        newH = newW / _aspectRatio;
        break;
      case 'ne':
        newW = _startW + dx;
        newH = newW / _aspectRatio;
        break;
      case 'nw':
        newW = _startW - dx;
        newH = newW / _aspectRatio;
        break;
    }

    // Enforce minimums
    newW = Math.max(MIN_W, newW);
    newH = Math.max(MIN_H, newH);

    // If corner handle, maintain aspect ratio after clamping
    if (isCorner) {
      if (newW / newH > _aspectRatio) {
        newW = newH * _aspectRatio;
      } else {
        newH = newW / _aspectRatio;
      }
    }

    // Apply size
    _targetEl.style.width = Math.round(newW) + 'px';
    _targetEl.style.height = Math.round(newH) + 'px';
    _targetEl.style.maxWidth = 'none';

    // Reposition handles
    positionHandles(_targetEl);

    // Update tooltip
    updateDimTooltip(e.clientX, e.clientY, Math.round(newW), Math.round(newH));
  }

  function onResizeMouseUp(e) {
    if (!_resizing) return;

    _resizing = false;
    document.removeEventListener('mousemove', onResizeMouseMove, true);
    document.removeEventListener('mouseup', onResizeMouseUp, true);
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.cursor = '';

    // Hide dimension tooltip
    if (_dimTooltip) _dimTooltip.style.display = 'none';

    // Persist the size as an override
    if (_targetEl && _currentEl) {
      var key = api.getHwsKey(_currentEl);
      if (key) {
        var w = Math.round(_targetEl.getBoundingClientRect().width);
        var h = Math.round(_targetEl.getBoundingClientRect().height);

        // Store dimensions in localStorage under a dedicated key
        saveSizeOverride(key, w, h);
      }
    }

    // Reposition handles to final position
    if (_targetEl) positionHandles(_targetEl);

    api.showToast('Resized');
  }

  function updateDimTooltip(cx, cy, w, h) {
    if (!_dimTooltip) return;
    _dimTooltip.textContent = w + ' × ' + h;
    _dimTooltip.style.display = 'block';
    _dimTooltip.style.left = (cx + 14) + 'px';
    _dimTooltip.style.top = (cy + 14) + 'px';
  }

  // ---- Size Persistence ----

  var SIZE_KEY = 'hws-admin-element-sizes';

  function getSizeOverrides() {
    try {
      var raw = localStorage.getItem(SIZE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveSizeOverride(key, w, h) {
    var sizes = getSizeOverrides();
    sizes[key] = { w: w, h: h };
    try { localStorage.setItem(SIZE_KEY, JSON.stringify(sizes)); } catch (e) {}
  }

  // ---- Restore Sizes on Page Load ----

  function restoreElementSizes() {
    var sizes = getSizeOverrides();
    if (!sizes || Object.keys(sizes).length === 0) return;

    Object.keys(sizes).forEach(function(key) {
      var s = sizes[key];
      var el = document.querySelector('[data-hws="' + key + '"]');
      if (!el) return;

      // Find the actual target (img inside img.* containers)
      var target = el;
      if (key.indexOf('img.') === 0) {
        var img = el.querySelector('img');
        if (img) target = img;
      }

      if (s.w) {
        target.style.width = s.w + 'px';
        target.style.maxWidth = 'none';
      }
      if (s.h) target.style.height = s.h + 'px';
    });
  }

  // ---- Scroll / Resize Tracking ----

  function onScrollOrResize() {
    if (_currentEl && _targetEl && _handles && _handles.style.display !== 'none') {
      positionHandles(_targetEl);
    }
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, false);

    // Poll for selection changes (since we don't have a direct hook yet)
    _selectionPoll = setInterval(function() {
      var sel = api.getSelectedEl();
      if (sel && sel !== _currentEl) {
        onElementSelected(sel);
      } else if (!sel && _currentEl) {
        onElementDeselected();
      }
    }, 200);
  }

  var _selectionPoll = null;

  function deactivate() {
    _isEditorActive = false;
    hideHandles();
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize, false);

    if (_selectionPoll) {
      clearInterval(_selectionPoll);
      _selectionPoll = null;
    }

    if (_handles) {
      _handles.remove();
      _handles = null;
    }
    if (_dimTooltip) {
      _dimTooltip.remove();
      _dimTooltip = null;
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

  window.HWSResize = {
    restoreElementSizes: restoreElementSizes
  };

})();
