/**
 * Editor Drag Sections — Drag-to-reorder sections via HTML5 Drag & Drop
 * Depends on: inline-editor.js (window.HWSEditor._internal)
 *
 * Adds a drag handle (⋮⋮) to the section bar. When dragged, drop zones
 * appear between sections with a blue line indicator. On drop, the section
 * animates to its new position using FLIP.
 */

(function() {
  'use strict';

  var api = window.HWSEditor && window.HWSEditor._internal;
  if (!api) {
    console.warn('[EditorDragSections] HWSEditor._internal not found — skipping drag reorder.');
    return;
  }

  var SECTION_SEL = 'main > .section';
  var ORDER_KEY = 'hws-admin-section-order';

  // ---- State ----
  var _isEditorActive = false;
  var _draggedSection = null;
  var _dropZones = [];
  var _activeZone = null;
  var _placeholder = null;

  // ---- Helpers ----

  function getAllSections() {
    return Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL));
  }

  function getSectionGroup(sectionEl) {
    var group = [sectionEl];
    var next = sectionEl.nextElementSibling;
    if (next && next.classList.contains('section-transition')) {
      group.push(next);
    }
    return group;
  }

  function getCurrentOrder() {
    return getAllSections().map(function(s) { return s.id || ''; }).filter(Boolean);
  }

  function saveOrder(orderArr) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(orderArr)); } catch (e) {}
  }

  // ---- Inject Drag Handle into Section Bar ----

  function injectDragHandle() {
    // Find the section bar and prepend a drag handle
    var bar = document.getElementById('hws-section-bar');
    if (!bar) return;

    // Check if already injected
    if (bar.querySelector('.hws-section-bar__drag')) return;

    var handle = document.createElement('div');
    handle.className = 'hws-section-bar__drag';
    handle.setAttribute('draggable', 'true');
    handle.title = 'Drag to reorder';
    handle.innerHTML = '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/></svg>';

    bar.insertBefore(handle, bar.firstChild);

    // Drag events on the handle
    handle.addEventListener('dragstart', onDragStart);
    handle.addEventListener('dragend', onDragEnd);
  }

  // ---- Watch for section bar creation ----

  var _barObserver = null;

  function watchForBar() {
    // Use a MutationObserver to detect when the section bar is added to DOM
    _barObserver = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        for (var j = 0; j < mutations[i].addedNodes.length; j++) {
          var node = mutations[i].addedNodes[j];
          if (node.id === 'hws-section-bar' || (node.querySelector && node.querySelector('#hws-section-bar'))) {
            injectDragHandle();
          }
        }
      }
      // Also check periodically if bar exists but handle doesn't
      var bar = document.getElementById('hws-section-bar');
      if (bar && !bar.querySelector('.hws-section-bar__drag')) {
        injectDragHandle();
      }
    });

    _barObserver.observe(document.body, { childList: true, subtree: true });

    // Also try immediately
    injectDragHandle();
  }

  // ---- Create Drop Zones ----

  function createDropZones() {
    removeDropZones();

    var sections = getAllSections();
    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Create a drop zone before the first section and after each section
    for (var i = 0; i <= sections.length; i++) {
      var zone = document.createElement('div');
      zone.className = 'hws-drop-zone';
      zone.setAttribute('data-drop-index', i);

      zone.addEventListener('dragover', onDragOver);
      zone.addEventListener('dragleave', onDragLeave);
      zone.addEventListener('drop', onDrop);

      if (i < sections.length) {
        // Insert before the section
        var group = getSectionGroup(sections[i]);
        mainEl.insertBefore(zone, group[0]);
      } else {
        // Insert at the end
        mainEl.appendChild(zone);
      }

      _dropZones.push(zone);
    }
  }

  function removeDropZones() {
    for (var i = 0; i < _dropZones.length; i++) {
      if (_dropZones[i].parentNode) {
        _dropZones[i].parentNode.removeChild(_dropZones[i]);
      }
    }
    _dropZones = [];
    _activeZone = null;
  }

  // ---- Drag Events ----

  function onDragStart(e) {
    // Find the section that the bar is currently targeting
    var bar = document.getElementById('hws-section-bar');
    if (!bar) return;

    // Get the hovered section from the bar's name
    var nameEl = bar.querySelector('.hws-section-bar__name');
    if (!nameEl) return;

    // Find the section element by traversing (use position data)
    var sections = getAllSections();
    var barRect = bar.getBoundingClientRect();
    var bestSection = null;
    var bestDist = Infinity;

    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      var dist = Math.abs(rect.top + 12 - barRect.top);
      if (dist < bestDist) {
        bestDist = dist;
        bestSection = sections[i];
      }
    }

    if (!bestSection) return;

    _draggedSection = bestSection;

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bestSection.id || '');

    // Add dragging class
    document.body.classList.add('hws-dragging');
    bestSection.classList.add('hws-section-dragging');

    // Hide the section bar during drag
    bar.style.display = 'none';

    // Create drop zones
    setTimeout(function() {
      createDropZones();
    }, 0);
  }

  function onDragEnd(e) {
    document.body.classList.remove('hws-dragging');

    if (_draggedSection) {
      _draggedSection.classList.remove('hws-section-dragging');
    }

    removeDropZones();
    _draggedSection = null;

    // Show bar again
    var bar = document.getElementById('hws-section-bar');
    if (bar) bar.style.display = '';
  }

  function onDragOver(e) {
    if (!_draggedSection) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    var zone = e.currentTarget;
    if (zone !== _activeZone) {
      if (_activeZone) _activeZone.classList.remove('hws-drop-zone--active');
      zone.classList.add('hws-drop-zone--active');
      _activeZone = zone;
    }
  }

  function onDragLeave(e) {
    var zone = e.currentTarget;
    zone.classList.remove('hws-drop-zone--active');
    if (_activeZone === zone) _activeZone = null;
  }

  function onDrop(e) {
    e.preventDefault();

    if (!_draggedSection || !_activeZone) return;

    var dropIndex = parseInt(_activeZone.getAttribute('data-drop-index'));
    var mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Remove drop zones first
    removeDropZones();

    // Get current section positions for FLIP animation
    var sections = getAllSections();
    var allElements = [];
    sections.forEach(function(s) {
      var group = getSectionGroup(s);
      group.forEach(function(el) { allElements.push(el); });
    });

    var oldRects = allElements.map(function(el) {
      return el.getBoundingClientRect();
    });

    // Perform DOM move
    var movingGroup = getSectionGroup(_draggedSection);
    var targetSections = getAllSections().filter(function(s) { return s !== _draggedSection; });

    if (dropIndex >= targetSections.length) {
      // Move to end
      movingGroup.forEach(function(el) {
        mainEl.appendChild(el);
      });
    } else {
      var beforeSection = targetSections[dropIndex];
      var beforeGroup = getSectionGroup(beforeSection);
      movingGroup.forEach(function(el) {
        mainEl.insertBefore(el, beforeGroup[0]);
      });
    }

    // FLIP animation
    var newAllElements = [];
    getAllSections().forEach(function(s) {
      var group = getSectionGroup(s);
      group.forEach(function(el) { newAllElements.push(el); });
    });

    // Create a mapping from old to new elements
    allElements.forEach(function(el, i) {
      var newRect = el.getBoundingClientRect();
      if (i < oldRects.length) {
        var dx = oldRects[i].left - newRect.left;
        var dy = oldRects[i].top - newRect.top;

        if (dx !== 0 || dy !== 0) {
          el.style.transition = 'none';
          el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
          el.offsetHeight; // force reflow
          el.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = '';
        }
      }
    });

    // Clean up animation
    setTimeout(function() {
      allElements.forEach(function(el) {
        el.style.transition = '';
        el.style.transform = '';
      });
    }, 380);

    // Remove dragging state
    _draggedSection.classList.remove('hws-section-dragging');
    document.body.classList.remove('hws-dragging');

    // Save new order
    saveOrder(getCurrentOrder());
    api.showToast('Section moved');

    _draggedSection = null;
  }

  // ---- Lifecycle ----

  function activate() {
    _isEditorActive = true;
    watchForBar();
  }

  function deactivate() {
    _isEditorActive = false;
    removeDropZones();
    _draggedSection = null;

    if (_barObserver) {
      _barObserver.disconnect();
      _barObserver = null;
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
