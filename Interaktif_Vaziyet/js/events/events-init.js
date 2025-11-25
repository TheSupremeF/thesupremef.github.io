(function(ns){
  const { WORK_GROUPS, ALL_WORK_ITEMS } = ns;
  const { snapPercent } = ns.utils;

  /**
   * Initialize DOM element references
   */
  function initDom() {
    ns.dom = {
      mainImage: document.getElementById('mainImage'),
      hotspotLayer: document.getElementById('hotspotLayer'),
      canvasWrapper: document.getElementById('canvasWrapper'),
      viewport: document.getElementById('viewport'),
      modeToggle: document.getElementById('modeToggle'),
      sideBody: document.getElementById('sideBody'),
      asideEl: document.querySelector('aside'),
      mainImageWrapper: document.getElementById('mainImageWrapper'),
      mainImageInput: document.getElementById('mainImageInput'),
      resetViewBtn: document.getElementById('resetViewBtn'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importInput: document.getElementById('importInput'),
      panModeBtn: document.getElementById('panModeBtn'),
      labelsBtn: document.getElementById('labelsBtn'),
      summaryBtn: document.getElementById('summaryBtn'),
      lastExportLabel: document.getElementById('lastExportLabel'),
      workViewSelect: document.getElementById('workViewSelect'),
      workViewStats: document.getElementById('workViewStats'),
      aboutBtn: document.getElementById('aboutBtn'),
      aboutOverlay: document.getElementById('aboutOverlay'),
      passwordSettingsBtn: document.getElementById('passwordSettingsBtn'),
      passwordSettingsOverlay: document.getElementById('passwordSettingsOverlay'),
      passwordSettingsPin: document.getElementById('passwordSettingsPin'),
      passwordSettingsSave: document.getElementById('passwordSettingsSave'),
      passwordSettingsCancel: document.getElementById('passwordSettingsCancel'),
      passwordPromptOverlay: document.getElementById('passwordPromptOverlay'),
      passwordPromptPin: document.getElementById('passwordPromptPin'),
      passwordPromptOk: document.getElementById('passwordPromptOk'),
      passwordPromptCancel: document.getElementById('passwordPromptCancel'),
      detailImageOverlay: document.getElementById('detailImageOverlay'),
      detailImageLarge: document.getElementById('detailImageLarge'),
      projectNameLabel: document.getElementById('projectNameLabel'),
      projectInfoBtn: document.getElementById('projectInfoBtn'),
      projectInfoOverlay: document.getElementById('projectInfoOverlay'),
      projectNameInput: document.getElementById('projectNameInput'),
      projectContractorInput: document.getElementById('projectContractorInput'),
      projectInfoCancel: document.getElementById('projectInfoCancel'),
      projectInfoSave: document.getElementById('projectInfoSave'),
      addBlockBtn: document.getElementById('addBlockBtn'),
      drawLineBtn: document.getElementById('drawLineBtn'),
      drawCurveBtn: document.getElementById('drawCurveBtn'),
      addTextBtn: document.getElementById('addTextBtn'),
      drawingLayer: document.getElementById('drawingLayer'),
      textLayer: document.getElementById('textLayer')
    };
  }

  function initWorkViewSelect() {
    const { workViewSelect } = ns.dom;
    if (!workViewSelect) return;

    workViewSelect.innerHTML = '';
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = 'Orijinal görünüm';
    workViewSelect.appendChild(optDefault);

    WORK_GROUPS.forEach(group => {
      const og = document.createElement('optgroup');
      og.label = group.label;
      group.items.forEach(item => {
        const o = document.createElement('option');
        o.value = item.id;
        o.textContent = item.label;
        og.appendChild(o);
      });
      workViewSelect.appendChild(og);
    });

    workViewSelect.addEventListener('change', () => {
      const val = workViewSelect.value || '';
      ns.state.highlightWorkTypeId = val === '' ? null : val;
      ns.state.showSummary = false;
      ns.renderHotspots();
      updateWorkViewStats();
    });
  }

  function updateWorkViewStats() {
    const { workViewSelect, workViewStats } = ns.dom;
    if (!workViewSelect || !workViewStats) return;
    
    const selectedWorkId = workViewSelect.value || '';
    if (selectedWorkId === '') {
      workViewStats.style.display = 'none';
      return;
    }
    
    const { hotspots } = ns.state;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    
    hotspots.forEach(h => {
      const work = h.works && h.works[selectedWorkId];
      if (!work) return;
      
      if (work.status === 'tamamlandi') completed++;
      else if (work.status === 'devam_ediyor') inProgress++;
      else if (work.status === 'baslamadi') notStarted++;
    });
    
    const parts = [];
    if (completed > 0) parts.push(`✓ ${completed} blok tamamlandı`);
    if (inProgress > 0) parts.push(`◐ ${inProgress} devam ediyor`);
    if (notStarted > 0) parts.push(`○ ${notStarted} başlamadı`);
    
    workViewStats.textContent = parts.length > 0 ? parts.join(' / ') : 'Blok yok';
    workViewStats.style.display = 'inline-block';
  }


  function boot() {
    initDom();
    initWorkViewSelect();
    ns.wireOverlays();
    ns.wirePasswordOverlays();
    ns.wireProjectInfoOverlay();
    ns.wireToolbarButtons();
    ns.wireMainImageLoad();
    ns.wireExportImport();
    ns.wireZoomPan();
    ns.wireHotspotInteractions();
    ns.wireHistoryShortcuts();
    ns.wireResetToolbar();
    
    const asideBackdrop = document.getElementById('asideBackdrop');
    if (asideBackdrop) {
      asideBackdrop.addEventListener('click', () => {
        ns.state.selectedIds.clear();
        ns.state.showSummary = false;
        ns.state.sidePanelVisible = false;
        ns.renderHotspots();
        ns.renderSidePanel();
      });
    }

    ns.exportPuantajXLSX = function() {
      if (typeof XLSX === 'undefined') {
        alert('XLSX kütüphanesi yüklenemedi.');
        return;
      }

      const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];
      
      const [year, month, day] = selectedDate.split('-');
      const formattedDate = `${day}.${month}.${year}`;

      const rows = [];

      rows.push([`Tarih: ${formattedDate}`]);
      rows.push([]);

      const headerRow = ['ADA', 'PARSEL', 'BLOK'];
      ALL_WORK_ITEMS.forEach(w => {
        headerRow.push(w.label);
      });
      rows.push(headerRow);

      ns.state.hotspots.forEach(hs => {
        const adaVal = hs.ada && hs.ada.trim() !== '' ? hs.ada.trim() : '-';
        const parselVal = hs.parsel && hs.parsel.trim() !== '' ? hs.parsel.trim() : '-';
        const blokVal = hs.blok && hs.blok.trim() !== '' ? hs.blok.trim() : '-';

        const row = [adaVal, parselVal, blokVal];

        ALL_WORK_ITEMS.forEach(workItem => {
          let workers = 0;
          if (hs.dailyRecords && Array.isArray(hs.dailyRecords)) {
            hs.dailyRecords
              .filter(r => r.date === selectedDate && r.workTypeId === workItem.id)
              .forEach(r => {
                const w = typeof r.workers === 'number' ? r.workers : 0;
                if (!isNaN(w)) workers += w;
              });
          }
          row.push(workers);
        });

        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Puantaj');

      const fileName = `puantaj-${formattedDate.replace(/\./g, '-')}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
    };

    ns.setTransform();
    ns.updateLastExportLabel();
    ns.updateProjectNameLabel();
    ns.state.sidePanelVisible = false;
    ns.renderHotspots();
    ns.renderSidePanel();
    ns.applyMode('viewer');

    if (typeof ns.resetHistory === 'function') ns.resetHistory();
  }
  
  // Export functions to namespace
  ns.updateWorkViewStats = updateWorkViewStats;
  ns.boot = boot;

  // Note: boot() is called from events-shortcuts.js (last module)
})(window.EPP = window.EPP || {});
