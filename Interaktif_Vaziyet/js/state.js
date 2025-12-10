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
    showReadyPanel: false,
    showIssuesPanel: false,
    sidePanelVisible: false,
    highlightWorkTypeId: null,
    lastExportAt: null,
    editorPassword: '',
    editorUnlocked: true,
    projectInfo: { 
      name: '', 
      contractor: '',
      contractorCode: '',
      contractorShort: '',
      projectType: 'ETAP', // Default: ETAP veya ADA
      formworkType: 'TÜNEL', // Default: TÜNEL, KONVANSİYONEL, HİBRİT
      maxFloors: 10 // Default: 10 kat
    },
    settings: {
      gridSize: 100, // Grid snap hassasiyeti (%)
      labelFontSize: 12, // Etiket yazı boyutu (px)
      labelOffsetX: 0, // Etiket X kaydırma (px)
      labelOffsetY: -20 // Etiket Y kaydırma (px) - default blok üstünde
    },
    selectedDate: new Date().toISOString().split('T')[0],
    drawMode: null
  };
  
  // Create issue with NCR fields
  ns.createIssue = function(params = {}) {
    return {
      id: 'issue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      description: params.description || '',
      photos: params.photos || [],
      status: params.status || 'open',
      createdDate: params.createdDate || new Date().toISOString().split('T')[0],
      resolutionDate: params.resolutionDate || '',
      resolutionNotes: params.resolutionNotes || '',
      
      // NCR fields
      ncrType: params.ncrType || 'STC',
      ncrNumber: params.ncrNumber || 1,
      controlEngineerName: params.controlEngineerName || '',
      controlEngineerDate: params.controlEngineerDate || '',
      controlChiefName: params.controlChiefName || '',
      controlChiefDate: params.controlChiefDate || ''
    };
  };

  ns.STATUS_OPTIONS = [
    { value: 'veri_girilmedi', label: 'Veri Girilmedi' },
    { value: 'baslamadi', label: 'Başlamadı' },
    { value: 'baslayabilir', label: 'Başlayabilir' },
    { value: 'devam_ediyor', label: 'Devam Ediyor' },
    { value: 'tamamlandi', label: 'Tamamlandı' }
  ];

  ns.createDefaultWorks = function(existingWorks) {
    const works = {};
    ALL_WORK_ITEMS.forEach(w => {
      const existing = existingWorks ? existingWorks[w.id] : null;
      works[w.id] = {
        status: existing ? (existing.status || 'veri_girilmedi') : 'veri_girilmedi',
        startDate: existing ? (existing.startDate || '') : '',
        endDate: existing ? (existing.endDate || '') : '',
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
      issues: Array.isArray(params.issues) ? params.issues : [],
      labelOffset: params.labelOffset || null // Her hotspot için özel label pozisyonu {x, y}
    };

    ns.state.hotspots.push(hotspot);
    ns.state.selectedIds = new Set([id]);
    ns.state.showSummary = false;
    ns.state.showReadyPanel = false;
    ns.state.showIssuesPanel = false;
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
      labelOffset: original.labelOffset ? JSON.parse(JSON.stringify(original.labelOffset)) : null,
      
      // Works için özel deep clone
      works: {}
    };

    // Works'ü manuel deep clone yap
    ALL_WORK_ITEMS.forEach(w => {
      const origItem = original.works ? original.works[w.id] : null;
      clone.works[w.id] = {
        status: origItem ? (origItem.status || 'veri_girilmedi') : 'veri_girilmedi',
        startDate: origItem ? (origItem.startDate || '') : '',
        endDate: origItem ? (origItem.endDate || '') : '',
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
    const projectType = ns.state.projectInfo?.projectType || 'ETAP';
    const typeLabel = projectType === 'ADA' ? 'ADA' : 'ETAP';
    
    if (h.ada && h.ada.trim()) parts.push(typeLabel + ' ' + h.ada.trim());
    if (h.parsel && h.parsel.trim()) parts.push('PARSEL ' + h.parsel.trim());
    if (h.blok && h.blok.trim()) parts.push(h.blok.trim() + ' BLOK');
    return parts.length > 0 ? parts.join(' - ') : h.id;
  };

  ns.workStatusClass = function(status) {
    if (status === 'tamamlandi') return 'green';
    if (status === 'devam_ediyor') return 'yellow';
    if (status === 'baslayabilir') return 'blue';
    if (status === 'baslamadi') return 'red';
    if (status === 'veri_girilmedi') return 'gray';
    return '';
  };

  ns.workStatusIcon = function(status) {
    if (status === 'tamamlandi') return '✓';
    if (status === 'devam_ediyor') return '◐';
    if (status === 'baslayabilir') return '▷';
    if (status === 'baslamadi') return '○';
    if (status === 'veri_girilmedi') return '−';
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