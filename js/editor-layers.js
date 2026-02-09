/**
 * Editor Layers — Tree panel showing all sections and editable elements
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Adds a "Layers" tab to the right panel with:
 *   - Collapsible section tree (▾ Hero → hero.label, hero.headline, ...)
 *   - Click to select + scroll to element
 *   - Hover to highlight on page
 *   - Eye icon to toggle section visibility
 *   - Override indicator dots
 *   - Search/filter input
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorLayers] HWSEditor._internal not found — skipping layers panel.');
    return;
  }

  var SECTION_SEL = 'main > .section';
  var HIDDEN_KEY = 'hws-admin-hidden-sections';

  // ---- State ----
  var _isEditorActive = false;
  var _collapsed = {};  // { sectionId: true } for collapsed sections

  // ---- Section Names (mirror from editor-sections) ----
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

  function getSectionName(el) {
    var id = el.id || '';
    return SECTION_NAMES[id] || id || 'Section';
  }

  // ---- Helpers ----

  function getHiddenSections() {
    try {
      var raw = localStorage.getItem(HIDDEN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function getOverrides() {
    return api.getOverrides ? api.getOverrides() : {};
  }

  function isOverridden(key) {
    var overrides = getOverrides();
    return key in overrides;
  }

  function getReadableKey(key) {
    // "hero.headline" → "headline"
    var parts = key.split('.');
    return parts[parts.length - 1];
  }

  function getKeyTypeIcon(key) {
    if (key.indexOf('img.') === 0) return '🖼️';
    if (key.indexOf('.features') !== -1) return '📋';
    if (key.indexOf('headline') !== -1 || key.indexOf('title') !== -1) return 'H';
    if (key.indexOf('body') !== -1 || key.indexOf('text') !== -1 || key.indexOf('subtext') !== -1) return 'T';
    if (key.indexOf('label') !== -1) return 'L';
    if (key.indexOf('btn') !== -1 || key.indexOf('cta') !== -1) return '⊞';
    return '•';
  }

  // ---- Build Layers HTML ----

  function buildLayersHTML(filterText) {
    var sections = Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
    var hidden = getHiddenSections();
    var filter = (filterText || '').toLowerCase().trim();

    var html = '';

    html += '<div class="hws-layers-search">' +
      '<input type="text" class="hws-layers-search__input" id="hws-layers-filter" placeholder="Search elements..." value="' + (filter ? api.escAttr(filter) : '') + '">' +
    '</div>';

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      var sId = section.id || 'section-' + i;
      var sName = getSectionName(section);
      var isHidden = hidden.indexOf(sId) !== -1;
      var isCollapsed = _collapsed[sId] === true;

      // Gather child elements
      var hwsChildren = section.querySelectorAll('[data-hws], [data-hws-features]');
      var childItems = [];
      for (var j = 0; j < hwsChildren.length; j++) {
        var child = hwsChildren[j];
        var key = child.getAttribute('data-hws') || child.getAttribute('data-hws-features');
        if (!key) continue;

        // Apply filter
        if (filter && key.toLowerCase().indexOf(filter) === -1 && getReadableKey(key).toLowerCase().indexOf(filter) === -1) {
          continue;
        }

        childItems.push({
          el: child,
          key: key,
          readable: getReadableKey(key),
          icon: getKeyTypeIcon(key),
          overridden: isOverridden(key)
        });
      }

      // If filter active and no children match, skip this section
      if (filter && childItems.length === 0) continue;

      // If filter active, force sections open
      var showChildren = filter ? true : !isCollapsed;

      html += '<div class="hws-layers-section" data-section-id="' + sId + '">' +
        '<div class="hws-layers-section__header' + (isHidden ? ' hws-layers-section__header--hidden' : '') + '">' +
          '<button type="button" class="hws-layers-toggle" data-action="toggle-collapse" data-section="' + sId + '">' +
            (showChildren ? '▾' : '▸') +
          '</button>' +
          '<span class="hws-layers-section__name" data-action="scroll-section" data-section="' + sId + '">' + api.escHtml(sName) + '</span>' +
          '<span class="hws-layers-section__count">' + childItems.length + '</span>' +
          '<button type="button" class="hws-layers-eye' + (isHidden ? ' hws-layers-eye--hidden' : '') + '" data-action="toggle-visibility" data-section="' + sId + '" title="' + (isHidden ? 'Show' : 'Hide') + '">' +
            (isHidden ? '🙈' : '👁') +
          '</button>' +
        '</div>';

      if (showChildren) {
        html += '<div class="hws-layers-children">';
        for (var k = 0; k < childItems.length; k++) {
          var item = childItems[k];
          html += '<div class="hws-layers-item" data-action="select-element" data-key="' + api.escAttr(item.key) + '">' +
            '<span class="hws-layers-item__icon">' + item.icon + '</span>' +
            '<span class="hws-layers-item__key">' + api.escHtml(item.readable) + '</span>' +
            (item.overridden ? '<span class="hws-layers-item__dot" title="Has override"></span>' : '') +
          '</div>';
        }
        html += '</div>';
      }

      html += '</div>';
    }

    if (!html || (filter && html.indexOf('hws-layers-section') === -1)) {
      html += '<p class="hws-editor-panel__empty">No matching elements found.</p>';
    }

    return html;
  }

  // ---- Open Layers Panel ----

  function openLayersPanel(filterText) {
    api.createPanel();
    api.openPanel('element'); // Use element tab type
    api.setPanelTitle('Layers');

    var html = buildLayersHTML(filterText);
    api.setPanelBody(html);

    bindLayerEvents();
  }

  function bindLayerEvents() {
    var panel = api.getPanel();
    if (!panel) return;

    // Delegate clicks
    var body = panel.querySelector('#hws-editor-panel-body');
    if (!body) return;

    body.addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (!target) return;

      var action = target.getAttribute('data-action');

      switch (action) {
        case 'toggle-collapse':
          var sId = target.getAttribute('data-section');
          _collapsed[sId] = !_collapsed[sId];
          openLayersPanel(getCurrentFilter());
          break;

        case 'scroll-section':
          var secId = target.getAttribute('data-section');
          var secEl = document.getElementById(secId);
          if (secEl) {
            secEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash highlight
            secEl.classList.add('hws-layers-flash');
            setTimeout(function() { secEl.classList.remove('hws-layers-flash'); }, 1000);
          }
          break;

        case 'toggle-visibility':
          var visSecId = target.getAttribute('data-section');
          // Simulate the section bar's toggle hide
          var sbar = document.getElementById('hws-section-bar');
          if (sbar) {
            // Trigger hover on the section, then click hide button
            var visSec = document.getElementById(visSecId);
            if (visSec) {
              var rect = visSec.getBoundingClientRect();
              var synth = new MouseEvent('mousemove', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + 20,
                bubbles: true
              });
              document.dispatchEvent(synth);
              setTimeout(function() {
                var hideBtn = sbar.querySelector('[data-action="toggleHide"]');
                if (hideBtn) hideBtn.click();
                // Refresh layers
                setTimeout(function() { openLayersPanel(getCurrentFilter()); }, 100);
              }, 50);
            }
          }
          break;

        case 'select-element':
          var key = target.getAttribute('data-key');
          var el = document.querySelector('[data-hws="' + key + '"]') ||
                   document.querySelector('[data-hws-features="' + key + '"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash highlight
            el.classList.add('hws-layers-flash');
            setTimeout(function() { el.classList.remove('hws-layers-flash'); }, 1000);
          }
          break;
      }
    });

    // Hover to highlight
    body.addEventListener('mouseenter', function(e) {
      var item = e.target.closest('.hws-layers-item');
      if (!item) return;
      var key = item.getAttribute('data-key');
      var el = document.querySelector('[data-hws="' + key + '"]') ||
               document.querySelector('[data-hws-features="' + key + '"]');
      if (el) el.classList.add('hws-layers-highlight');
    }, true);

    body.addEventListener('mouseleave', function(e) {
      var item = e.target.closest('.hws-layers-item');
      if (!item) return;
      var key = item.getAttribute('data-key');
      var el = document.querySelector('[data-hws="' + key + '"]') ||
               document.querySelector('[data-hws-features="' + key + '"]');
      if (el) el.classList.remove('hws-layers-highlight');
    }, true);

    // Filter input
    var filterInput = body.querySelector('#hws-layers-filter');
    if (filterInput) {
      filterInput.addEventListener('input', function() {
        var val = filterInput.value;
        // Rebuild layers content (keep the search)
        var newHtml = buildLayersHTML(val);
        body.innerHTML = newHtml;
        bindLayerEvents();
        // Re-focus input and set cursor position
        var newInput = body.querySelector('#hws-layers-filter');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(val.length, val.length);
        }
      });
    }
  }

  function getCurrentFilter() {
    var panel = api.getPanel();
    if (!panel) return '';
    var input = panel.querySelector('#hws-layers-filter');
    return input ? input.value : '';
  }

  // ---- Add Layers Button to Toolbar ----

  function addLayersButton() {
    // Find the toolbar's right section
    var toolbar = document.getElementById('hws-editor-toolbar');
    if (!toolbar) return;

    // Check if already added
    if (toolbar.querySelector('[data-action="layers"]')) return;

    var rightSection = toolbar.querySelector('.hws-editor-toolbar__right');
    if (!rightSection) return;

    // Insert before the Design button
    var designBtn = rightSection.querySelector('[data-action="design"]');

    var layersBtn = document.createElement('button');
    layersBtn.className = 'hws-editor-toolbar__btn';
    layersBtn.setAttribute('data-action', 'layers');
    layersBtn.title = 'Layers';
    layersBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8,1 15,5 8,9 1,5"/><polyline points="1,9 8,13 15,9"/></svg>';

    layersBtn.addEventListener('click', function() {
      openLayersPanel('');
    });

    if (designBtn) {
      rightSection.insertBefore(layersBtn, designBtn);
    } else {
      rightSection.appendChild(layersBtn);
    }
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    _collapsed = {};

    // Wait for toolbar to be ready, then inject Layers button
    setTimeout(addLayersButton, 100);
  }

  function deactivate() {
    _isEditorActive = false;
    _collapsed = {};

    // Clean up any highlights
    var highlights = document.querySelectorAll('.hws-layers-highlight, .hws-layers-flash');
    for (var i = 0; i < highlights.length; i++) {
      highlights[i].classList.remove('hws-layers-highlight', 'hws-layers-flash');
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
