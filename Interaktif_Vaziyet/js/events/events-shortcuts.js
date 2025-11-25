(function(ns){

  function wireHistoryShortcuts() {
    document.addEventListener('keydown', e => {
      if (ns.state.mode !== 'editor') return;

      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = (e.key || '').toLowerCase();

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        ns.undo();
        return;
      }

      if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        ns.redo();
        return;
      }
    });
  }


  ns.wireHistoryShortcuts = wireHistoryShortcuts;

  // Initialize app after all modules are loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof ns.boot === 'function') ns.boot();
    });
  } else {
    if (typeof ns.boot === 'function') ns.boot();
  }
})(window.EPP = window.EPP || {});
