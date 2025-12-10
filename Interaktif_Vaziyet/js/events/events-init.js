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
      readyBtn: document.getElementById('readyBtn'),
      issuesBtn: document.getElementById('issuesBtn'),
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
      settingsBtn: document.getElementById('settingsBtn'),
      addBlockBtn: document.getElementById('addBlockBtn'),
      drawLineBtn: document.getElementById('drawLineBtn'),
      drawCurveBtn: document.getElementById('drawCurveBtn'),
      addTextBtn: document.getElementById('addTextBtn'),
      drawingLayer: document.getElementById('drawingLayer'),
      textLayer: document.getElementById('textLayer')
    };
  }

  let workViewSelectInitialized = false;
  
  function initWorkViewSelect() {
    const { workViewSelect } = ns.dom;
    if (!workViewSelect) return;

    // Mevcut seçimi sakla
    const currentValue = workViewSelect.value;

    workViewSelect.innerHTML = '';
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = 'Orijinal görünüm';
    workViewSelect.appendChild(optDefault);

    ns.getFilteredWorkGroups().forEach(group => {
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

    // Önceki seçimi geri yükle (eğer hala varsa)
    if (currentValue && Array.from(workViewSelect.options).some(opt => opt.value === currentValue)) {
      workViewSelect.value = currentValue;
    }

    // Event listener'ı sadece ilk sefer ekle
    if (!workViewSelectInitialized) {
      workViewSelect.addEventListener('change', () => {
        const val = workViewSelect.value || '';
        ns.state.highlightWorkTypeId = val === '' ? null : val;
        ns.state.showSummary = false;
        ns.renderHotspots();
        updateWorkViewStats();
      });
      workViewSelectInitialized = true;
    }
  }
  
  // Public hale getir
  ns.refreshWorkViewSelect = initWorkViewSelect;

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
    let ready = 0;
    let notStarted = 0;
    let noData = 0;
    
    hotspots.forEach(h => {
      const work = h.works && h.works[selectedWorkId];
      if (!work) return;
      
      if (work.status === 'tamamlandi') completed++;
      else if (work.status === 'devam_ediyor') inProgress++;
      else if (work.status === 'baslayabilir') ready++;
      else if (work.status === 'baslamadi') notStarted++;
      else if (work.status === 'veri_girilmedi') noData++;
    });
    
    // Pill'leri oluştur
    workViewStats.innerHTML = '';
    workViewStats.style.display = 'inline-flex';
    workViewStats.style.gap = '4px';
    workViewStats.style.alignItems = 'center';
    
    const statItems = [
      { count: completed, label: 'Tamamlandı', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)' },
      { count: inProgress, label: 'Devam Ediyor', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
      { count: ready, label: 'Başlayabilir', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
      { count: notStarted, label: 'Başlamadı', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
      { count: noData, label: 'Veri Girilmedi', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
    ];
    
    statItems.forEach(item => {
      if (item.count === 0) return;
      
      const pill = document.createElement('span');
      pill.style.display = 'inline-flex';
      pill.style.alignItems = 'center';
      pill.style.gap = '4px';
      pill.style.padding = '2px 8px';
      pill.style.borderRadius = '999px';
      pill.style.fontSize = '11px';
      pill.style.fontWeight = '500';
      pill.style.border = `1px solid ${item.color}`;
      pill.style.color = item.color;
      pill.style.background = item.bg;
      pill.style.whiteSpace = 'nowrap';
      
      pill.textContent = `${item.count} ${item.label}`;
      workViewStats.appendChild(pill);
    });
    
    if (workViewStats.children.length === 0) {
      workViewStats.style.display = 'none';
    }
  }


  function boot() {
    initDom();
    initWorkViewSelect();
    ns.wireOverlays();
    ns.wirePasswordOverlays();
    ns.wireProjectInfoOverlay();
    ns.wireSettingsOverlay();
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
        ns.state.showReadyPanel = false;
        ns.state.showIssuesPanel = false;
        ns.state.sidePanelVisible = false;
        
        // Butonları untoggle et
        const { summaryBtn, readyBtn, issuesBtn } = ns.dom;
        if (summaryBtn) summaryBtn.classList.remove('toggle-active');
        if (readyBtn) readyBtn.classList.remove('toggle-active');
        if (issuesBtn) issuesBtn.classList.remove('toggle-active');
        
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
      ns.getFilteredWorkItems().forEach(w => {
        headerRow.push(w.label);
      });
      rows.push(headerRow);

      ns.state.hotspots.forEach(hs => {
        const adaVal = hs.ada && hs.ada.trim() !== '' ? hs.ada.trim() : '-';
        const parselVal = hs.parsel && hs.parsel.trim() !== '' ? hs.parsel.trim() : '-';
        const blokVal = hs.blok && hs.blok.trim() !== '' ? hs.blok.trim() : '-';

        const row = [adaVal, parselVal, blokVal];

        ns.getFilteredWorkItems().forEach(workItem => {
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
