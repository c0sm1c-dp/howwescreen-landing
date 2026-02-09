/**
 * Editor Add Blocks — "+" insertion points between sections + block picker
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Shows faint "+" buttons between sections. Clicking opens a block picker
 * popover with block types: Text, Image, Button, Spacer, Divider, Two-Column.
 * New blocks are stored in localStorage and restored on page load.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorAddBlocks] HWSEditor._internal not found — skipping add blocks.');
    return;
  }

  var SECTION_SEL = 'main > .section';
  var BLOCKS_KEY = 'hws-admin-custom-blocks';
  var ORDER_KEY = 'hws-admin-section-order';

  // ---- State ----
  var _isEditorActive = false;
  var _insertPoints = [];
  var _picker = null;
  var _activeInsertPoint = null;

  // ---- Block Definitions ----

  var BLOCK_TYPES = [
    {
      type: 'text',
      label: 'Text Block',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="5" x2="16" y2="5"/><line x1="4" y1="9" x2="14" y2="9"/><line x1="4" y1="13" x2="10" y2="13"/></svg>',
      desc: 'Add a paragraph'
    },
    {
      type: 'heading',
      label: 'Heading',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><text x="3" y="15" font-size="14" font-weight="700" fill="currentColor" stroke="none">H</text></svg>',
      desc: 'Add a heading'
    },
    {
      type: 'image',
      label: 'Image',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="16" height="14" rx="2"/><circle cx="7" cy="8" r="2"/><polyline points="2,14 6,10 10,14 14,9 18,14"/></svg>',
      desc: 'Upload an image'
    },
    {
      type: 'button',
      label: 'Button',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="16" height="8" rx="4"/><line x1="7" y1="10" x2="13" y2="10"/></svg>',
      desc: 'Add a CTA button'
    },
    {
      type: 'spacer',
      label: 'Spacer',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="4" x2="16" y2="4"/><line x1="10" y1="7" x2="10" y2="13" stroke-dasharray="2 2"/><line x1="4" y1="16" x2="16" y2="16"/></svg>',
      desc: 'Add empty space'
    },
    {
      type: 'divider',
      label: 'Divider',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="10" x2="18" y2="10"/></svg>',
      desc: 'Horizontal line'
    }
  ];

  // ---- Block HTML Generators ----

  function generateBlockId() {
    return 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  function createBlockHTML(type, blockId) {
    var keyPrefix = blockId;

    switch (type) {
      case 'text':
        return '<section id="' + blockId + '" class="section hws-custom-block" style="padding:3rem 1.5rem;">' +
          '<div class="container">' +
            '<p data-hws="' + keyPrefix + '.text" style="font-size:1.1rem;line-height:1.7;">Click to edit this text block. Add your content here.</p>' +
          '</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      case 'heading':
        return '<section id="' + blockId + '" class="section hws-custom-block" style="padding:3rem 1.5rem;">' +
          '<div class="container">' +
            '<h2 data-hws="' + keyPrefix + '.heading" style="font-size:2.5rem;font-weight:700;">New Heading</h2>' +
          '</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      case 'image':
        return '<section id="' + blockId + '" class="section hws-custom-block" style="padding:3rem 1.5rem;">' +
          '<div class="container" style="text-align:center;">' +
            '<div data-hws="img.' + keyPrefix + '.image" class="hws-block-image-placeholder" style="max-width:600px;margin:0 auto;padding:3rem;border:2px dashed #d4d4d4;border-radius:12px;color:#a3a3a3;font-size:14px;cursor:pointer;">' +
              '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#a3a3a3" stroke-width="1.5" style="margin-bottom:8px;"><rect x="4" y="6" width="32" height="28" rx="4"/><circle cx="14" cy="16" r="4"/><polyline points="4,28 12,20 20,28 28,18 36,28"/></svg>' +
              '<br>Click to upload an image' +
            '</div>' +
          '</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      case 'button':
        return '<section id="' + blockId + '" class="section hws-custom-block" style="padding:3rem 1.5rem;text-align:center;">' +
          '<div class="container">' +
            '<a data-hws="' + keyPrefix + '.btn" href="#" class="btn" style="display:inline-block;">Click Me</a>' +
          '</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      case 'spacer':
        return '<section id="' + blockId + '" class="section hws-custom-block hws-custom-spacer" style="padding:0;min-height:60px;position:relative;">' +
          '<div class="hws-spacer-label">Spacer</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      case 'divider':
        return '<section id="' + blockId + '" class="section hws-custom-block" style="padding:1rem 1.5rem;">' +
          '<div class="container">' +
            '<hr style="border:none;border-top:1px solid var(--color-border, #d4d4d4);margin:0;">' +
          '</div>' +
          '<button type="button" class="hws-block-delete" title="Delete block">✕</button>' +
        '</section>';

      default:
        return '';
    }
  }

  // ---- Persistence ----

  function getSavedBlocks() {
    try {
      var raw = localStorage.getItem(BLOCKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveBlocks(blocks) {
    try { localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks)); } catch (e) {}
  }

  function saveCurrentOrder() {
    var sections = Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
    var order = sections.map(function(s) { return s.id || ''; }).filter(Boolean);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }

  // ---- Insert Points ("+" buttons) ----

  function createInsertPoints() {
    removeInsertPoints();

    var sections = Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Create a "+" point after each section
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var group = [section];
      var next = section.nextElementSibling;
      if (next && next.classList.contains('section-transition')) {
        group.push(next);
      }

      var point = document.createElement('div');
      point.className = 'hws-insert-point';
      point.setAttribute('data-insert-after', section.id || '');
      point.innerHTML = '<button type="button" class="hws-insert-btn" title="Add Block">+</button>';

      // Insert after the section group
      var afterEl = group[group.length - 1].nextSibling;
      mainEl.insertBefore(point, afterEl);

      _insertPoints.push(point);

      // Click handler
      (function(p) {
        p.querySelector('.hws-insert-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          showBlockPicker(p);
        });
      })(point);
    }
  }

  function removeInsertPoints() {
    for (var i = 0; i < _insertPoints.length; i++) {
      if (_insertPoints[i].parentNode) {
        _insertPoints[i].parentNode.removeChild(_insertPoints[i]);
      }
    }
    _insertPoints = [];
  }

  // ---- Block Picker Popover ----

  function showBlockPicker(insertPoint) {
    hideBlockPicker();

    _activeInsertPoint = insertPoint;

    _picker = document.createElement('div');
    _picker.className = 'hws-block-picker';

    var html = '<div class="hws-block-picker__header">Add Block</div>' +
               '<div class="hws-block-picker__grid">';

    for (var i = 0; i < BLOCK_TYPES.length; i++) {
      var bt = BLOCK_TYPES[i];
      html += '<button type="button" class="hws-block-picker__item" data-block-type="' + bt.type + '">' +
        '<span class="hws-block-picker__icon">' + bt.icon + '</span>' +
        '<span class="hws-block-picker__label">' + bt.label + '</span>' +
      '</button>';
    }

    html += '</div>';
    _picker.innerHTML = html;

    document.body.appendChild(_picker);

    // Position near the insert point
    var rect = insertPoint.getBoundingClientRect();
    var pickerW = 260;
    var pickerH = _picker.offsetHeight || 280;

    var left = rect.left + rect.width / 2 - pickerW / 2;
    var top = rect.bottom + 8;

    // Keep in viewport
    if (left < 8) left = 8;
    if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8;
    if (top + pickerH > window.innerHeight - 8) top = rect.top - pickerH - 8;

    _picker.style.left = left + 'px';
    _picker.style.top = top + 'px';

    // Click handler for block selection
    _picker.addEventListener('click', function(e) {
      var item = e.target.closest('[data-block-type]');
      if (!item) return;

      var type = item.getAttribute('data-block-type');
      insertBlock(type, insertPoint);
      hideBlockPicker();
    });

    // Click outside to close
    setTimeout(function() {
      document.addEventListener('click', onClickOutsidePicker, true);
    }, 0);
  }

  function hideBlockPicker() {
    if (_picker && _picker.parentNode) {
      _picker.parentNode.removeChild(_picker);
    }
    _picker = null;
    _activeInsertPoint = null;
    document.removeEventListener('click', onClickOutsidePicker, true);
  }

  function onClickOutsidePicker(e) {
    if (_picker && !_picker.contains(e.target) && !e.target.closest('.hws-insert-btn')) {
      hideBlockPicker();
    }
  }

  // ---- Insert Block ----

  function insertBlock(type, insertPoint) {
    var blockId = generateBlockId();
    var html = createBlockHTML(type, blockId);
    if (!html) return;

    // Create DOM element
    var temp = document.createElement('div');
    temp.innerHTML = html;
    var newSection = temp.firstElementChild;

    // Insert after the insert point
    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    mainEl.insertBefore(newSection, insertPoint.nextSibling);

    // Animate in
    newSection.style.opacity = '0';
    newSection.style.transform = 'translateY(-15px)';
    newSection.offsetHeight; // force reflow
    newSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    newSection.style.opacity = '1';
    newSection.style.transform = 'translateY(0)';

    setTimeout(function() {
      newSection.style.transition = '';
      newSection.style.transform = '';
    }, 350);

    // Save block definition
    var blocks = getSavedBlocks();
    blocks.push({
      id: blockId,
      type: type,
      html: newSection.outerHTML
    });
    saveBlocks(blocks);

    // Save section order
    saveCurrentOrder();

    // Bind delete button
    bindBlockDelete(newSection);

    // Rebuild insert points
    createInsertPoints();

    api.showToast('Block added');
  }

  // ---- Delete Block ----

  function bindBlockDelete(sectionEl) {
    var deleteBtn = sectionEl.querySelector('.hws-block-delete');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();

      var id = sectionEl.id;
      if (!confirm('Delete this block?')) return;

      // Animate out
      sectionEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      sectionEl.style.opacity = '0';
      sectionEl.style.transform = 'scale(0.97)';

      setTimeout(function() {
        if (sectionEl.parentNode) sectionEl.parentNode.removeChild(sectionEl);

        // Remove from saved blocks
        var blocks = getSavedBlocks();
        blocks = blocks.filter(function(b) { return b.id !== id; });
        saveBlocks(blocks);

        // Save order
        saveCurrentOrder();

        // Rebuild insert points
        createInsertPoints();

        api.showToast('Block deleted');
      }, 220);
    });
  }

  function bindAllBlockDeletes() {
    var blocks = document.querySelectorAll('.hws-custom-block');
    for (var i = 0; i < blocks.length; i++) {
      bindBlockDelete(blocks[i]);
    }
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    createInsertPoints();
    bindAllBlockDeletes();

    // Show delete buttons in edit mode
    document.documentElement.setAttribute('data-hws-blocks-edit', '');
  }

  function deactivate() {
    _isEditorActive = false;
    removeInsertPoints();
    hideBlockPicker();

    document.documentElement.removeAttribute('data-hws-blocks-edit');
  }

  // ---- Register Hooks ----

  api.onEnterEditMode(function() {
    activate();
  });

  api.onExitEditMode(function() {
    deactivate();
  });

  // ---- Expose for site-renderer ----

  window.HWSBlocks = {
    restoreBlocks: function() {
      var blocks = getSavedBlocks();
      if (!blocks || blocks.length === 0) return;

      var mainEl = document.querySelector('main');
      if (!mainEl) return;

      // Get saved order to know where to insert blocks
      var orderRaw = localStorage.getItem(ORDER_KEY);
      var order = null;
      try { if (orderRaw) order = JSON.parse(orderRaw); } catch (e) {}

      // Create all custom blocks
      blocks.forEach(function(block) {
        // Check if already in DOM (avoid duplicates on repeated calls)
        if (document.getElementById(block.id)) return;

        var temp = document.createElement('div');
        temp.innerHTML = block.html;
        var el = temp.firstElementChild;
        if (!el) return;

        // Append to main (order will be handled by restoreSectionOrder)
        mainEl.appendChild(el);
      });
    }
  };

})();
