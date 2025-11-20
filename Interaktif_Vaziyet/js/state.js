(function(ns){
  const { ALL_WORK_ITEMS, STATUS_OPTIONS } = ns;
  const { hexToRgba } = ns.utils;

  ns.state = {
    mode: 'viewer',
    hotspots: [],
    selectedIds: new Set(),
    grid: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    mainImageUrl: null,
    panMode: false,
    showLabels: true,
    lastExportAt: null,
    showSummary: false,
    highlightWorkTypeId: null,
    editorPassword: '',
    editorUnlocked: true,
    sidePanelVisible: false,
    projectInfo: {
      name: '',
      contractor: ''
    }
  };

  // -----------------------------
  // HISTORY MANAGER (UNDO/REDO)
  // -----------------------------
  const HISTORY_LIMIT = 100;

  ns.history = {
    stack: [],
    index: -1,
    limit: HISTORY_LIMIT,
    isRestoring: false
  };

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  ns.snapshotState = function() {
    return {
      mode: ns.state.mode,
      hotspots: deepCopy(ns.state.hotspots),
      selectedIds: Array.from(ns.state.selectedIds),
      grid: ns.state.grid,
      scale: ns.state.scale,
      offsetX: ns.state.offsetX,
      offsetY: ns.state.offsetY,
      mainImageUrl: ns.state.mainImageUrl,
      panMode: ns.state.panMode,
      showLabels: ns.state.showLabels,
      lastExportAt: ns.state.lastExportAt
        ? new Date(ns.state.lastExportAt).toISOString()
        : null,
      showSummary: ns.state.showSummary,
      highlightWorkTypeId: ns.state.highlightWorkTypeId,
      editorPassword: ns.state.editorPassword,
      editorUnlocked: ns.state.editorUnlocked,
      sidePanelVisible: ns.state.sidePanelVisible,
      projectInfo: deepCopy(ns.state.projectInfo || { name: '', contractor: '' })
    };
  };

  ns.restoreState = function(snapshot) {
    if (!snapshot) return;
    ns.history.isRestoring = true;
    try {
      ns.state.mode = snapshot.mode || 'viewer';
      ns.state.hotspots = Array.isArray(snapshot.hotspots) ? snapshot.hotspots : [];
      ns.state.selectedIds = new Set(snapshot.selectedIds || []);
      ns.state.grid = typeof snapshot.grid === 'number' ? snapshot.grid : 1;
      ns.state.scale = typeof snapshot.scale === 'number' ? snapshot.scale : 1;
      ns.state.offsetX = typeof snapshot.offsetX === 'number' ? snapshot.offsetX : 0;
      ns.state.offsetY = typeof snapshot.offsetY === 'number' ? snapshot.offsetY : 0;
      ns.state.mainImageUrl = snapshot.mainImageUrl || null;
      ns.state.panMode = !!snapshot.panMode;
      ns.state.showLabels = snapshot.showLabels !== false;
      ns.state.lastExportAt = snapshot.lastExportAt
        ? new Date(snapshot.lastExportAt)
        : null;
      ns.state.showSummary = !!snapshot.showSummary;
      ns.state.highlightWorkTypeId = snapshot.highlightWorkTypeId || null;
      ns.state.editorPassword = snapshot.editorPassword || '';
      ns.state.editorUnlocked = snapshot.editorUnlocked !== false;
      ns.state.sidePanelVisible = !!snapshot.sidePanelVisible;
      ns.state.projectInfo = snapshot.projectInfo || { name: '', contractor: '' };

      ns.setTransform();

      if (typeof ns.applyMode === 'function') {
        ns.applyMode(ns.state.mode);
      } else {
        if (typeof ns.updateModeToggleUI === 'function') ns.updateModeToggleUI();
        if (typeof ns.renderHotspots === 'function') ns.renderHotspots();
        if (typeof ns.renderSidePanel === 'function') ns.renderSidePanel();
      }

      if (typeof ns.updateLastExportLabel === 'function') ns.updateLastExportLabel();
      if (typeof ns.updateProjectNameLabel === 'function') ns.updateProjectNameLabel();
    } finally {
      ns.history.isRestoring = false;
    }
  };

  ns.pushHistory = function(label) {
    if (ns.history.isRestoring) return;

    const snap = ns.snapshotState();

    // aynı snapshot’ı yığma
    if (ns.history.index >= 0) {
      const last = ns.history.stack[ns.history.index];
      try {
        if (JSON.stringify(last) === JSON.stringify(snap)) return;
      } catch (_) {}
    }

    // ileri redo branch’ini kes
    if (ns.history.index < ns.history.stack.length - 1) {
      ns.history.stack = ns.history.stack.slice(0, ns.history.index + 1);
    }

    ns.history.stack.push(snap);

    // limit uygula
    if (ns.history.stack.length > ns.history.limit) {
      ns.history.stack = ns.history.stack.slice(
        ns.history.stack.length - ns.history.limit
      );
    }

    ns.history.index = ns.history.stack.length - 1;
  };

  ns.resetHistory = function() {
    ns.history.stack = [];
    ns.history.index = -1;
    ns.pushHistory('reset');
  };

  ns.undo = function() {
    if (ns.history.index <= 0) return;
    ns.history.index -= 1;
    const snap = ns.history.stack[ns.history.index];
    ns.restoreState(deepCopy(snap));
  };

  ns.redo = function() {
    if (ns.history.index >= ns.history.stack.length - 1) return;
    ns.history.index += 1;
    const snap = ns.history.stack[ns.history.index];
    ns.restoreState(deepCopy(snap));
  };

  // Hotspot kopyalama için yardımcı
  ns.cloneHotspot = function(original, overrides) {
    const hs = deepCopy(original);
    hs.id = 'hs-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    hs.works = ns.createDefaultWorks(hs.works);
    return Object.assign(hs, overrides || {});
  };

  // -----------------------------
  // EXISTING FUNCTIONS
  // -----------------------------

  ns.setTransform = function() {
    if (!ns.dom || !ns.dom.viewport) return;
    ns.dom.viewport.style.transform =
      `translate(${ns.state.offsetX}px, ${ns.state.offsetY}px) scale(${ns.state.scale})`;
  };

  ns.createDefaultWorks = function(existing) {
    const works = {};
    ALL_WORK_ITEMS.forEach(w => {
      const prev = existing && existing[w.id];
      let workersVal = 0;
      if (prev && typeof prev.workers === 'number' && !isNaN(prev.workers)) {
        workersVal = prev.workers;
      }
      const subVal = prev && typeof prev.subcontractor === 'string' ? prev.subcontractor : '';
      works[w.id] = {
        status: prev && prev.status ? prev.status : 'baslamadi',
        workers: workersVal,
        subcontractor: subVal
      };
    });
    return works;
  };

  ns.getHotspot = function(id) {
    return ns.state.hotspots.find(h => h.id === id);
  };

  ns.workStatusClass = function(code) {
    if (code === 'tamamlandi') return 'green';
    if (code === 'devam_ediyor') return 'yellow';
    if (code === 'baslamadi') return 'red';
    return '';
  };

  ns.workStatusIcon = function(code) {
    if (code === 'tamamlandi') return '✔';
    if (code === 'devam_ediyor') return '▬';
    if (code === 'baslamadi') return '✖';
    return '•';
  };

  ns.statusTextTr = function(code) {
    const opt = STATUS_OPTIONS.find(o => o.value === code);
    return opt ? opt.label : code;
  };

  ns.buildHotspotLabel = function(hs) {
    const hasParsel = hs.parsel && hs.parsel.trim() !== '';
    const hasAda = hs.ada && hs.ada.trim() !== '';
    const blokText = hs.blok && hs.blok.trim() !== '' ? hs.blok.trim() : hs.id;

    if (hasAda && hasParsel) {
      return `ADA ${hs.ada.trim()} - PARSEL ${hs.parsel.trim()} - ${blokText} BLOK`;
    }
    if (hasAda && !hasParsel) {
      return `ADA ${hs.ada.trim()} - ${blokText} BLOK`;
    }
    return blokText;
  };

  ns.createHotspot = function(initial) {
    // history: create başlamadan önce mevcut state stack top’ta olmalı.
    ns.pushHistory('createHotspot');

    const id = 'hs-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const hs = Object.assign({
      id,
      top: 40,
      left: 40,
      width: 10,
      height: 10,
      ada: '',
      parsel: '',
      blok: '',
      description: '',
      detailImageUrl: null,
      fillColor: '#2563eb',
      fillOpacity: 0,
      borderColor: '#60a5fa',
      borderOpacity: 0,
      hoverGlow: true,
      works: ns.createDefaultWorks()
    }, initial || {});
    if (!hs.works) {
      hs.works = ns.createDefaultWorks();
    } else {
      hs.works = ns.createDefaultWorks(hs.works);
    }
    ns.state.hotspots.push(hs);
    ns.state.selectedIds = new Set([id]);
    ns.state.showSummary = false;
    ns.state.sidePanelVisible = true;
    ns.renderHotspots();
    ns.renderSidePanel();
  };

  ns.hexToRgba = hexToRgba; // re-export for convenience
})(window.EPP = window.EPP || {});
