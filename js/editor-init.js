/**
 * Editor Init — Tiny bootstrapper for the inline visual editor
 * Loads editor assets on demand when ?edit=1 is in URL or Ctrl+Shift+E is pressed
 */

(function() {
  var editorLoaded = false;
  var editorEnabled = window.location.search.indexOf('edit=1') !== -1 ||
                      localStorage.getItem('hws-editor-enabled') === '1';

  // Show floating edit button if enabled
  if (editorEnabled) {
    document.addEventListener('DOMContentLoaded', function() {
      var btn = document.createElement('button');
      btn.id = 'hws-edit-trigger';
      btn.innerHTML = '&#9998;';
      btn.title = 'Toggle Editor (Ctrl+Shift+E)';
      btn.setAttribute('aria-label', 'Toggle visual editor');
      btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:48px;height:48px;border-radius:50%;background:#995D81;color:#fff;border:none;font-size:20px;cursor:pointer;z-index:99990;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:transform 0.2s;';
      btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; };
      btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; };
      btn.onclick = function() { loadAndToggle(); };
      document.body.appendChild(btn);
    });
  }

  // Keyboard shortcut: Ctrl+Shift+E (or Cmd+Shift+E on Mac)
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      localStorage.setItem('hws-editor-enabled', '1');
      loadAndToggle();
    }
  });

  function loadAndToggle() {
    if (editorLoaded) {
      if (window.HWSEditor) window.HWSEditor.toggle();
      return;
    }

    // Inject CSS
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/inline-editor.css';
    document.head.appendChild(link);

    // Inject JS
    var script = document.createElement('script');
    script.src = 'js/inline-editor.js';
    script.onload = function() {
      editorLoaded = true;
      if (window.HWSEditor) window.HWSEditor.toggle();
    };
    document.body.appendChild(script);
  }
})();
