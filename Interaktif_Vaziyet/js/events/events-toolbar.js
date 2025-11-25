(function(ns){
  const { ALL_WORK_ITEMS } = ns;

  function wireToolbarButtons() {
    const { panModeBtn, labelsBtn, summaryBtn, resetViewBtn } = ns.dom;
    const { addBlockBtn, drawLineBtn, drawCurveBtn, addTextBtn } = ns.dom;

    panModeBtn.addEventListener('click', () => {
      ns.state.panMode = !ns.state.panMode;
      panModeBtn.classList.toggle('toggle-active', ns.state.panMode);
    });

    labelsBtn.addEventListener('click', () => {
      ns.state.showLabels = !ns.state.showLabels;
      labelsBtn.classList.toggle('toggle-active', ns.state.showLabels);
      ns.renderHotspots();
    });

    summaryBtn.addEventListener('click', () => {
      ns.state.showSummary = !ns.state.showSummary;
      summaryBtn.classList.toggle('toggle-active', ns.state.showSummary);
      if (ns.state.showSummary) {
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
      }
      ns.renderSidePanel();
    });

    resetViewBtn.addEventListener('click', () => {
      ns.state.scale = 1;
      ns.state.offsetX = 0;
      ns.state.offsetY = 0;
      ns.setTransform();
    });

    if (addBlockBtn) {
      addBlockBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        ns.createHotspot();
      });
    }

    if (drawLineBtn) {
      drawLineBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        const isActive = ns.state.drawMode === 'line';
        ns.state.drawMode = isActive ? null : 'line';
        drawLineBtn.classList.toggle('toggle-active', !isActive);
        if (drawCurveBtn) drawCurveBtn.classList.remove('toggle-active');
        if (addTextBtn) addTextBtn.classList.remove('toggle-active');
      });
    }

    if (drawCurveBtn) {
      drawCurveBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        const isActive = ns.state.drawMode === 'curve';
        ns.state.drawMode = isActive ? null : 'curve';
        drawCurveBtn.classList.toggle('toggle-active', !isActive);
        if (drawLineBtn) drawLineBtn.classList.remove('toggle-active');
        if (addTextBtn) addTextBtn.classList.remove('toggle-active');
      });
    }

    if (addTextBtn) {
      addTextBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        const isActive = ns.state.drawMode === 'text';
        ns.state.drawMode = isActive ? null : 'text';
        addTextBtn.classList.toggle('toggle-active', !isActive);
        if (drawLineBtn) drawLineBtn.classList.remove('toggle-active');
        if (drawCurveBtn) drawCurveBtn.classList.remove('toggle-active');
      });
    }
  }

  function wireResetToolbar() {
    const resetToolbar = document.getElementById('resetToolbar');
    const resetAttrsBtn = document.getElementById('resetAttrsBtn');
    const resetImagesBtn = document.getElementById('resetImagesBtn');
    const resetWorksBtn = document.getElementById('resetWorksBtn');
    const resetTodayBtn = document.getElementById('resetTodayBtn');

    if (!resetToolbar) return;

    resetAttrsBtn.addEventListener('click', () => {
      const selectedArray = Array.from(ns.state.selectedIds);
      if (selectedArray.length !== 1) return;
      
      const hs = ns.getHotspot(selectedArray[0]);
      if (!hs) return;

      if (!confirm('Ada, Parsel, Blok, Açıklama, Kat Sayısı, Bina Tipi ve Renkleri sıfırlamak istediğinize emin misiniz?')) return;
      
      hs.ada = '';
      hs.parsel = '';
      hs.blok = '';
      hs.description = '';
      hs.floorCount = 0;
      hs.buildingType = '';
      hs.fillColor = '#2563eb';
      hs.fillOpacity = 0.2;
      hs.borderColor = '#60a5fa';
      hs.borderOpacity = 1;
      
      ns.pushHistory('resetAttributes');
      ns.renderHotspots();
      ns.renderSidePanel();
    });

    resetImagesBtn.addEventListener('click', () => {
      const selectedArray = Array.from(ns.state.selectedIds);
      if (selectedArray.length !== 1) return;
      
      const hs = ns.getHotspot(selectedArray[0]);
      if (!hs) return;

      if (!confirm('Tüm detay görsellerini silmek istediğinize emin misiniz?')) return;
      
      hs.detailImages = [];
      
      ns.pushHistory('resetImages');
      ns.renderSidePanel();
    });

    resetWorksBtn.addEventListener('click', () => {
      const selectedArray = Array.from(ns.state.selectedIds);
      if (selectedArray.length !== 1) return;
      
      const hs = ns.getHotspot(selectedArray[0]);
      if (!hs) return;

      if (!confirm('Tüm imalat durumlarını (günlük kayıtlar dahil) sıfırlamak istediğinize emin misiniz?')) return;
      
      ALL_WORK_ITEMS.forEach(w => {
        hs.works[w.id] = {
          status: 'baslamadi',
          workers: 0,
          subcontractor: ''
        };
      });
      hs.dailyRecords = [];
      
      ns.pushHistory('resetWorks');
      ns.renderHotspots();
      ns.renderSidePanel();
    });

    resetTodayBtn.addEventListener('click', () => {
      const selectedArray = Array.from(ns.state.selectedIds);
      if (selectedArray.length !== 1) return;
      
      const hs = ns.getHotspot(selectedArray[0]);
      if (!hs) return;

      const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];
      if (!confirm(`${selectedDate} tarihli puantajı sıfırlamak istediğinize emin misiniz?`)) return;
      
      hs.dailyRecords = hs.dailyRecords.filter(r => r.date !== selectedDate);
      
      ns.pushHistory('resetTodayPuantaj');
      ns.renderSidePanel();
    });
  }


  ns.wireToolbarButtons = wireToolbarButtons;
  ns.wireResetToolbar = wireResetToolbar;
})(window.EPP = window.EPP || {});
