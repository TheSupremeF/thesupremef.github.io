(function(ns){
  const { ALL_WORK_ITEMS } = ns;

  function wireToolbarButtons() {
    const { panModeBtn, labelsBtn, summaryBtn, readyBtn, issuesBtn, resetViewBtn } = ns.dom;
    const { addBlockBtn, drawLineBtn, drawCurveBtn, drawPolygonBtn, addTextBtn } = ns.dom;

    panModeBtn.addEventListener('click', () => {
      ns.state.panMode = !ns.state.panMode;
      panModeBtn.classList.toggle('toggle-active', ns.state.panMode);
    });

    labelsBtn.addEventListener('click', () => {
      ns.state.showLabels = !ns.state.showLabels;
      labelsBtn.classList.toggle('toggle-active', ns.state.showLabels);
      ns.renderHotspots();
      ns.renderDrawings(); // Çizgi/curve labellarını göster
    });

    summaryBtn.addEventListener('click', () => {
      ns.state.showSummary = !ns.state.showSummary;
      ns.state.showReadyPanel = false;
      ns.state.showIssuesPanel = false;
      summaryBtn.classList.toggle('toggle-active', ns.state.showSummary);
      readyBtn.classList.remove('toggle-active');
      issuesBtn.classList.remove('toggle-active');
      if (ns.state.showSummary) {
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
      }
      ns.renderSidePanel();
    });

    readyBtn.addEventListener('click', () => {
      ns.state.showReadyPanel = !ns.state.showReadyPanel;
      ns.state.showSummary = false;
      ns.state.showIssuesPanel = false;
      readyBtn.classList.toggle('toggle-active', ns.state.showReadyPanel);
      summaryBtn.classList.remove('toggle-active');
      issuesBtn.classList.remove('toggle-active');
      if (ns.state.showReadyPanel) {
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
      }
      ns.renderSidePanel();
    });

    issuesBtn.addEventListener('click', () => {
      ns.state.showIssuesPanel = !ns.state.showIssuesPanel;
      ns.state.showSummary = false;
      ns.state.showReadyPanel = false;
      issuesBtn.classList.toggle('toggle-active', ns.state.showIssuesPanel);
      summaryBtn.classList.remove('toggle-active');
      readyBtn.classList.remove('toggle-active');
      if (ns.state.showIssuesPanel) {
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
        if (drawPolygonBtn) drawPolygonBtn.classList.remove('toggle-active');
        if (addTextBtn) addTextBtn.classList.remove('toggle-active');
        
        // Show/hide drawing mode toolbar with curve hint
        if (ns.dom.drawingModeToolbar) {
          ns.dom.drawingModeToolbar.style.display = (!isActive && ns.state.drawMode === 'curve') ? 'flex' : 'none';
          if (ns.dom.drawingModeHint && !isActive) {
            ns.dom.drawingModeHint.textContent = 'Nokta eklemek için tıklayın';
          }
        }
        
        // If turning off curve mode, clear any preview
        if (isActive && ns.dom.drawingLayer) {
          const previews = ns.dom.drawingLayer.querySelectorAll('.curve-preview-point, .curve-preview-path, .curve-preview-label, .polygon-preview-point, .polygon-preview-line');
          previews.forEach(el => el.remove());
        }
      });
    }

    if (drawPolygonBtn) {
      drawPolygonBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        const isActive = ns.state.drawMode === 'polygon';
        ns.state.drawMode = isActive ? null : 'polygon';
        drawPolygonBtn.classList.toggle('toggle-active', !isActive);
        if (drawLineBtn) drawLineBtn.classList.remove('toggle-active');
        if (drawCurveBtn) drawCurveBtn.classList.remove('toggle-active');
        if (addTextBtn) addTextBtn.classList.remove('toggle-active');
        
        // Show/hide drawing mode toolbar with polygon hint
        if (ns.dom.drawingModeToolbar) {
          ns.dom.drawingModeToolbar.style.display = (!isActive && ns.state.drawMode === 'polygon') ? 'flex' : 'none';
          if (ns.dom.drawingModeHint && !isActive) {
            ns.dom.drawingModeHint.textContent = 'Köşe eklemek için tıklayın';
          }
        }
        
        // If turning off polygon mode, clear any preview
        if (isActive && ns.dom.drawingLayer) {
          const previews = ns.dom.drawingLayer.querySelectorAll('.curve-preview-point, .curve-preview-path, .curve-preview-label, .polygon-preview-point, .polygon-preview-line');
          previews.forEach(el => el.remove());
        }
      });
    }

    const { addPoiBtn } = ns.dom;
    if (addPoiBtn) {
      addPoiBtn.addEventListener('click', () => {
        if (!ns.state.mainImageUrl) {
          alert('Önce bir ana görsel yükleyin.');
          return;
        }
        const isActive = ns.state.drawMode === 'poi';
        ns.state.drawMode = isActive ? null : 'poi';
        addPoiBtn.classList.toggle('toggle-active', !isActive);
        if (drawLineBtn) drawLineBtn.classList.remove('toggle-active');
        if (drawCurveBtn) drawCurveBtn.classList.remove('toggle-active');
        if (drawPolygonBtn) drawPolygonBtn.classList.remove('toggle-active');
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
        if (drawPolygonBtn) drawPolygonBtn.classList.remove('toggle-active');
        if (addPoiBtn) addPoiBtn.classList.remove('toggle-active');
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
          status: 'veri_girilmedi',
          startDate: '',
          endDate: '',
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
