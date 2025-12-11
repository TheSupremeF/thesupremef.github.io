(function(ns){

  function wireHistoryShortcuts() {
    document.addEventListener('keydown', e => {
      if (ns.state.mode !== 'editor') return;

      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }

      // Delete tuşu - Seçili çizim veya hotspot'u sil
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Çizim seçiliyse
        if (ns.state.selectedDrawingId) {
          e.preventDefault();
          const idx = ns.state.drawings.findIndex(d => d.id === ns.state.selectedDrawingId);
          if (idx >= 0) {
            ns.state.drawings.splice(idx, 1);
            ns.pushHistory('deleteDrawing');
            ns.state.selectedDrawingId = null;
            ns.state.sidePanelVisible = false;
            ns.renderDrawings();
            ns.renderSidePanel();
          }
          return;
        }
        
        // Hotspot seçiliyse
        if (ns.state.selectedIds.size > 0) {
          e.preventDefault();
          if (confirm(`${ns.state.selectedIds.size} blok silinecek. Emin misiniz?`)) {
            ns.state.selectedIds.forEach(id => {
              const idx = ns.state.hotspots.findIndex(h => h.id === id);
              if (idx >= 0) {
                ns.state.hotspots.splice(idx, 1);
              }
            });
            ns.pushHistory('deleteHotspots');
            ns.state.selectedIds.clear();
            ns.state.sidePanelVisible = false;
            ns.renderHotspots();
            ns.renderSidePanel();
          }
          return;
        }
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
