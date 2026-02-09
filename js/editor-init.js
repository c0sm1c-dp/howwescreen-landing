/**
 * Editor Init — Tiny bootstrapper for the inline visual editor
 * Loads editor assets on demand when ?edit=1 is in URL or Ctrl+Shift+E is pressed
 * Password-protected: requires authentication before editor activates
 */

(function() {
  var editorLoaded = false;
  var HASH = 'cb2f3ffbc31a452b3d520ab9a860b0fd5e9d9a34a5cb1196910e00c70cb28a1b';
  var AUTH_KEY = 'hws-editor-auth';
  var editorEnabled = window.location.search.indexOf('edit=1') !== -1 ||
                      localStorage.getItem('hws-editor-enabled') === '1';

  // SHA-256 hash function using Web Crypto API
  function sha256(str) {
    var buf = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', buf).then(function(hashBuf) {
      var arr = Array.from(new Uint8Array(hashBuf));
      return arr.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  // Check if already authenticated this session
  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  }

  // Show password prompt modal
  function showPasswordPrompt(onSuccess) {
    // If already authenticated, skip
    if (isAuthenticated()) {
      onSuccess();
      return;
    }

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,24,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

    var box = document.createElement('div');
    box.style.cssText = 'background:#F5F0E8;border-radius:12px;padding:32px;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Helvetica Neue,Helvetica,Arial,sans-serif;text-align:center;';

    var title = document.createElement('h3');
    title.textContent = 'Editor Access';
    title.style.cssText = 'margin:0 0 8px;font-size:18px;font-weight:600;color:#2C2418;';

    var subtitle = document.createElement('p');
    subtitle.textContent = 'Enter your password to continue';
    subtitle.style.cssText = 'margin:0 0 20px;font-size:13px;color:#5C4E3C;';

    var input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Password';
    input.autocomplete = 'off';
    input.style.cssText = 'width:100%;padding:10px 14px;font-size:14px;border:1px solid #D4C9B4;border-radius:8px;background:#fff;color:#2C2418;outline:none;box-sizing:border-box;font-family:inherit;';

    var error = document.createElement('p');
    error.style.cssText = 'margin:8px 0 0;font-size:12px;color:#c0392b;display:none;';
    error.textContent = 'Incorrect password';

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:16px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'flex:1;padding:10px;font-size:13px;font-weight:500;border:1px solid #D4C9B4;border-radius:8px;background:transparent;color:#5C4E3C;cursor:pointer;font-family:inherit;';

    var submitBtn = document.createElement('button');
    submitBtn.textContent = 'Enter';
    submitBtn.style.cssText = 'flex:1;padding:10px;font-size:13px;font-weight:500;border:none;border-radius:8px;background:#995D81;color:#fff;cursor:pointer;font-family:inherit;';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(submitBtn);
    box.appendChild(title);
    box.appendChild(subtitle);
    box.appendChild(input);
    box.appendChild(error);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    input.focus();

    function tryAuth() {
      var pw = input.value;
      if (!pw) return;
      submitBtn.textContent = '...';
      submitBtn.disabled = true;

      sha256(pw).then(function(hash) {
        if (hash === HASH) {
          sessionStorage.setItem(AUTH_KEY, '1');
          document.body.removeChild(overlay);
          onSuccess();
        } else {
          error.style.display = 'block';
          input.value = '';
          input.focus();
          submitBtn.textContent = 'Enter';
          submitBtn.disabled = false;
          input.style.borderColor = '#c0392b';
          setTimeout(function() { input.style.borderColor = '#D4C9B4'; }, 1500);
        }
      });
    }

    submitBtn.addEventListener('click', tryAuth);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') tryAuth();
    });
    cancelBtn.addEventListener('click', function() {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

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
      btn.onclick = function() { authAndToggle(); };
      document.body.appendChild(btn);
    });
  }

  // Keyboard shortcut: Ctrl+Shift+E (or Cmd+Shift+E on Mac)
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      localStorage.setItem('hws-editor-enabled', '1');
      authAndToggle();
    }
  });

  function authAndToggle() {
    showPasswordPrompt(function() {
      loadAndToggle();
    });
  }

  function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = callback || function() {};
    document.body.appendChild(script);
  }

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

    // Load scripts sequentially: core → plugins (all depend on _internal API)
    loadScript('js/inline-editor.js', function() {
      loadScript('js/editor-toolbar.js', function() {
        loadScript('js/editor-sections.js', function() {
          loadScript('js/editor-drag-sections.js', function() {
            loadScript('js/editor-add-blocks.js', function() {
              loadScript('js/editor-resize.js', function() {
                loadScript('js/editor-context-menu.js', function() {
                  loadScript('js/editor-layers.js', function() {
                    loadScript('js/editor-element-styles.js', function() {
                      editorLoaded = true;
                      if (window.HWSEditor) window.HWSEditor.toggle();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
})();
