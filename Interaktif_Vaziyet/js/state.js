(function(ns){
  const { ALL_WORK_ITEMS } = ns;

  ns.state = {
    mode: 'viewer',
    mainImageUrl: '',
    hotspots: [],
    drawings: [],
    texts: [],
    selectedIds: new Set(),
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    grid: 1,
    panMode: false,
    showLabels: false,
    showSummary: false,
    sidePanelVisible: false,
    highlightWorkTypeId: null,
    lastExportAt: null,
    editorPassword: '',
    editorUnlocked: true,
    projectInfo: { name: '', contractor: '' },
    selectedDate: new Date().toISOString().split('T')[0],
    drawMode: null
  };

  ns.STATUS_OPTIONS = [
    { value: 'baslamadi', label: 'Başlamadı' },
    { value: 'devam_ediyor', label: 'Devam Ediyor' },
    { value: 'tamamlandi', label: 'Tamamlandı' }
  ];

  ns.createDefaultWorks = function(existingWorks) {
    const works = {};
    ALL_WORK_ITEMS.forEach(w => {
      const existing = existingWorks ? existingWorks[w.id] : null;
      works[w.id] = {
        status: existing ? (existing.status || 'baslamadi') : 'baslamadi',
        workers: existing && typeof existing.workers === 'number' ? existing.workers : 0,
        subcontractor: existing && typeof existing.subcontractor === 'string' ? existing.subcontractor : ''
      };
    });
    return works;
  };

  ns.createHotspot = function(params = {}) {
    const id = 'hs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const top = typeof params.top === 'number' ? params.top : 10;
    const left = typeof params.left === 'number' ? params.left : 10;
    const width = typeof params.width === 'number' ? params.width : 15;
    const height = typeof params.height === 'number' ? params.height : 15;

    const hotspot = {
      id,
      top,
      left,
      width,
      height,
      ada: params.ada || '',
      parsel: params.parsel || '',
      blok: params.blok || '',
      description: params.description || '',
      detailImages: params.detailImages || [],
      fillColor: params.fillColor || '#2563eb',
      fillOpacity: typeof params.fillOpacity === 'number' ? params.fillOpacity : 0.2,
      borderColor: params.borderColor || params.fillColor || '#60a5fa',
      borderOpacity: typeof params.borderOpacity === 'number' ? params.borderOpacity : 1,
      hoverGlow: params.hoverGlow !== false,
      works: ns.createDefaultWorks(params.works),
      floorCount: typeof params.floorCount === 'number' ? params.floorCount : 0,
      buildingType: typeof params.buildingType === 'string' ? params.buildingType : '',
      dailyRecords: Array.isArray(params.dailyRecords) ? params.dailyRecords : [],
      issues: Array.isArray(params.issues) ? params.issues : []
    };

    ns.state.hotspots.push(hotspot);
    ns.state.selectedIds = new Set([id]);
    ns.state.showSummary = false;
    ns.state.sidePanelVisible = true;

    if (typeof ns.pushHistory === 'function') {
      ns.pushHistory('createHotspot');
    }

    ns.renderHotspots();
    ns.renderSidePanel();
  };

  ns.cloneHotspot = function(original, overrides = {}) {
    // CRITICAL: DEEP CLONE - shallow copy yaparsan aynı objeye referans olur!
    const clone = {
      id: 'hs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      top: original.top,
      left: original.left,
      width: original.width,
      height: original.height,
      ada: original.ada || '',
      parsel: original.parsel || '',
      blok: original.blok || '',
      description: original.description || '',
      fillColor: original.fillColor || '#2563eb',
      fillOpacity: typeof original.fillOpacity === 'number' ? original.fillOpacity : 0.2,
      borderColor: original.borderColor || original.fillColor || '#60a5fa',
      borderOpacity: typeof original.borderOpacity === 'number' ? original.borderOpacity : 1,
      hoverGlow: original.hoverGlow !== false,
      floorCount: typeof original.floorCount === 'number' ? original.floorCount : 0,
      buildingType: typeof original.buildingType === 'string' ? original.buildingType : '',
      
      // DEEP CLONE: JSON.parse(JSON.stringify()) en basit yöntem
      detailImages: original.detailImages ? JSON.parse(JSON.stringify(original.detailImages)) : [],
      dailyRecords: original.dailyRecords ? JSON.parse(JSON.stringify(original.dailyRecords)) : [],
      issues: original.issues ? JSON.parse(JSON.stringify(original.issues)) : [],
      
      // Works için özel deep clone
      works: {}
    };

    // Works'ü manuel deep clone yap
    ALL_WORK_ITEMS.forEach(w => {
      const origItem = original.works ? original.works[w.id] : null;
      clone.works[w.id] = {
        status: origItem ? (origItem.status || 'baslamadi') : 'baslamadi',
        workers: origItem && typeof origItem.workers === 'number' ? origItem.workers : 0,
        subcontractor: origItem && typeof origItem.subcontractor === 'string' ? origItem.subcontractor : ''
      };
    });

    // Overrides'ı uygula (position vs.)
    Object.assign(clone, overrides);

    return clone;
  };

  ns.getHotspot = function(id) {
    return ns.state.hotspots.find(h => h.id === id);
  };

  ns.buildHotspotLabel = function(h) {
    const parts = [];
    if (h.ada && h.ada.trim()) parts.push('ADA ' + h.ada.trim());
    if (h.parsel && h.parsel.trim()) parts.push('PARSEL ' + h.parsel.trim());
    if (h.blok && h.blok.trim()) parts.push(h.blok.trim() + ' BLOK');
    return parts.length > 0 ? parts.join(' - ') : h.id;
  };

  ns.workStatusClass = function(status) {
    if (status === 'tamamlandi') return 'green';
    if (status === 'devam_ediyor') return 'yellow';
    if (status === 'baslamadi') return 'red';
    return '';
  };

  ns.workStatusIcon = function(status) {
    if (status === 'tamamlandi') return '✓';
    if (status === 'devam_ediyor') return '◐';
    if (status === 'baslamadi') return '○';
    return '?';
  };

  ns.setTransform = function() {
    const { viewport } = ns.dom || {};
    if (!viewport) return;
    viewport.style.transform = `translate(${ns.state.offsetX}px, ${ns.state.offsetY}px) scale(${ns.state.scale})`;
  };

  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 50;

  function captureState() {
    return JSON.parse(JSON.stringify({
      hotspots: ns.state.hotspots,
      drawings: ns.state.drawings,
      texts: ns.state.texts
    }));
  }

  function restoreState(snapshot) {
    ns.state.hotspots = JSON.parse(JSON.stringify(snapshot.hotspots));
    ns.state.drawings = JSON.parse(JSON.stringify(snapshot.drawings));
    ns.state.texts = JSON.parse(JSON.stringify(snapshot.texts));
  }

  ns.pushHistory = function(action) {
    const snapshot = captureState();
    undoStack.push(snapshot);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack = [];
  };

  ns.undo = function() {
    if (undoStack.length === 0) return;
    const current = captureState();
    redoStack.push(current);
    const prev = undoStack.pop();
    restoreState(prev);
    ns.renderHotspots();
    ns.renderSidePanel();
  };

  ns.redo = function() {
    if (redoStack.length === 0) return;
    const current = captureState();
    undoStack.push(current);
    const next = redoStack.pop();
    restoreState(next);
    ns.renderHotspots();
    ns.renderSidePanel();
  };

  ns.resetHistory = function() {
    undoStack = [];
    redoStack = [];
  };
})(window.EPP = window.EPP || {});