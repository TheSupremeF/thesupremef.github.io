(function(ns){
  const { ALL_WORK_ITEMS } = ns;

  /**
   * Render the summary/puantaj panel
   */
  ns.renderSummaryPanel = function() {
    const { sideBody } = ns.dom || {};
    if (!sideBody) return;

    const sec = document.createElement('div');
    sec.className = 'side-section';
    const h = document.createElement('h3');
    h.textContent = 'PUANTAJ';
    sec.appendChild(h);

    // Date selector
    const dateRow = document.createElement('div');
    dateRow.style.marginBottom = '8px';
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Tarih seç:';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = ns.state.selectedDate || new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', () => {
      ns.state.selectedDate = dateInput.value;
      ns.renderSidePanel();
    });
    dateRow.appendChild(dateLabel);
    dateRow.appendChild(dateInput);
    sec.appendChild(dateRow);

    const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];

    // Group hotspots by ada/parsel
    const adaParselMap = {};
    ns.state.hotspots.forEach(hs => {
      const adaKey = hs.ada && hs.ada.trim() !== '' ? hs.ada.trim() : 'Ada belirtilmemiş';
      const parselKey = hs.parsel && hs.parsel.trim() !== '' ? hs.parsel.trim() : '';
      const fullKey = parselKey ? `${adaKey}|${parselKey}` : adaKey;
      
      if (!adaParselMap[fullKey]) {
        adaParselMap[fullKey] = { ada: adaKey, parsel: parselKey, blocks: [] };
      }
      
      adaParselMap[fullKey].blocks.push(hs);
    });

    const globalWorkTotals = {};
    let globalTotal = 0;

    // Render each ada/parsel group
    Object.keys(adaParselMap).sort().forEach(key => {
      const group = adaParselMap[key];
      
      // Check if this group has any data for selected date
      let adaHasData = false;
      group.blocks.forEach(hs => {
        if (hs.dailyRecords && Array.isArray(hs.dailyRecords)) {
          hs.dailyRecords
            .filter(r => r.date === selectedDate)
            .forEach(r => {
              const w = typeof r.workers === 'number' ? r.workers : 0;
              if (!isNaN(w) && w > 0) adaHasData = true;
            });
        }
      });

      if (!adaHasData) return;

      // Ada/Parsel header
      const adaHeader = document.createElement('div');
      adaHeader.style.fontWeight = '600';
      adaHeader.style.fontSize = '12px';
      adaHeader.style.margin = '12px 0 4px 0';
      adaHeader.style.padding = '4px 0';
      adaHeader.style.borderBottom = '1px solid #1f2937';
      if (group.parsel) {
        adaHeader.textContent = `ADA ${group.ada} - PARSEL ${group.parsel}`;
      } else {
        adaHeader.textContent = `ADA ${group.ada}`;
      }
      sec.appendChild(adaHeader);

      const workTypeTotals = {};
      let adaTotal = 0;

      // Render each block in this ada/parsel
      group.blocks.forEach(hs => {
        const blokLabel = hs.blok && hs.blok.trim() !== '' ? hs.blok.trim() : hs.id;
        const blokDiv = document.createElement('div');
        blokDiv.style.marginBottom = '8px';
        blokDiv.style.padding = '4px';
        blokDiv.style.borderRadius = '4px';
        blokDiv.style.background = '#111827';

        const blokTitle = document.createElement('div');
        blokTitle.style.fontWeight = '500';
        blokTitle.style.fontSize = '11px';
        blokTitle.style.marginBottom = '4px';
        blokTitle.textContent = `${blokLabel} BLOK`;
        blokDiv.appendChild(blokTitle);

        let blockTotal = 0;

        // Render daily records for this block
        if (hs.dailyRecords && Array.isArray(hs.dailyRecords)) {
          hs.dailyRecords
            .filter(r => r.date === selectedDate)
            .forEach(r => {
              const workItem = ALL_WORK_ITEMS.find(w => w.id === r.workTypeId);
              if (!workItem) return;

              const w = typeof r.workers === 'number' ? r.workers : 0;
              if (isNaN(w) || w === 0) return;

              const pill = document.createElement('div');
              pill.className = 'status-pill';
              const statusClass = ns.workStatusClass(r.status || 'baslamadi');
              if (statusClass) pill.classList.add(statusClass);

              const indicator = document.createElement('div');
              indicator.className = 'indicator';
              indicator.textContent = ns.workStatusIcon(r.status || 'baslamadi');
              pill.appendChild(indicator);

              const infoWrapper = document.createElement('div');
              infoWrapper.className = 'info-wrapper';

              const topRow = document.createElement('div');
              topRow.className = 'top-row';

              const workLabel = document.createElement('span');
              workLabel.textContent = workItem.label;
              topRow.appendChild(workLabel);

              const separator = document.createElement('span');
              separator.className = 'separator';
              separator.textContent = '·';
              topRow.appendChild(separator);

              const workerCount = document.createElement('span');
              workerCount.textContent = `${w} kişi`;
              topRow.appendChild(workerCount);

              infoWrapper.appendChild(topRow);
              pill.appendChild(infoWrapper);
              blokDiv.appendChild(pill);

              // Update totals
              blockTotal += w;
              adaTotal += w;
              globalTotal += w;

              if (!workTypeTotals[r.workTypeId]) {
                workTypeTotals[r.workTypeId] = 0;
              }
              workTypeTotals[r.workTypeId] += w;

              if (!globalWorkTotals[r.workTypeId]) {
                globalWorkTotals[r.workTypeId] = 0;
              }
              globalWorkTotals[r.workTypeId] += w;
            });
        }

        // Block total
        if (blockTotal > 0) {
          const blockTotalDiv = document.createElement('div');
          blockTotalDiv.style.fontSize = '11px';
          blockTotalDiv.style.marginTop = '4px';
          blockTotalDiv.style.fontWeight = '500';
          blockTotalDiv.textContent = `Blok toplamı: ${blockTotal} kişi`;
          blokDiv.appendChild(blockTotalDiv);
        }

        sec.appendChild(blokDiv);
      });

      // Ada/Parsel total and breakdown
      if (adaTotal > 0) {
        const adaTotalDiv = document.createElement('div');
        adaTotalDiv.style.fontSize = '12px';
        adaTotalDiv.style.fontWeight = '600';
        adaTotalDiv.style.marginTop = '4px';
        adaTotalDiv.style.padding = '4px';
        adaTotalDiv.style.background = '#1f2937';
        adaTotalDiv.style.borderRadius = '4px';
        adaTotalDiv.textContent = `Ada/Parsel toplamı: ${adaTotal} kişi`;
        sec.appendChild(adaTotalDiv);

        const workBreakdown = document.createElement('div');
        workBreakdown.style.fontSize = '11px';
        workBreakdown.style.marginTop = '4px';
        workBreakdown.style.padding = '4px';
        workBreakdown.style.background = '#020617';
        workBreakdown.style.borderRadius = '4px';

        Object.keys(workTypeTotals).forEach(workTypeId => {
          const workItem = ALL_WORK_ITEMS.find(w => w.id === workTypeId);
          if (!workItem) return;
          const count = workTypeTotals[workTypeId];
          const line = document.createElement('div');
          line.textContent = `${workItem.label}: ${count} kişi`;
          workBreakdown.appendChild(line);
        });

        sec.appendChild(workBreakdown);
      }
    });

    // Global totals
    if (globalTotal > 0) {
      const globalHeader = document.createElement('div');
      globalHeader.style.fontWeight = '600';
      globalHeader.style.fontSize = '13px';
      globalHeader.style.margin = '16px 0 8px 0';
      globalHeader.style.padding = '8px';
      globalHeader.style.borderRadius = '4px';
      globalHeader.style.background = '#1f2937';
      globalHeader.textContent = `GENEL TOPLAM: ${globalTotal} kişi`;
      sec.appendChild(globalHeader);

      const globalBreakdown = document.createElement('div');
      globalBreakdown.style.fontSize = '11px';
      globalBreakdown.style.padding = '4px';
      globalBreakdown.style.background = '#020617';
      globalBreakdown.style.borderRadius = '4px';

      Object.keys(globalWorkTotals).forEach(workTypeId => {
        const workItem = ALL_WORK_ITEMS.find(w => w.id === workTypeId);
        if (!workItem) return;
        const count = globalWorkTotals[workTypeId];
        const line = document.createElement('div');
        line.textContent = `${workItem.label}: ${count} kişi`;
        globalBreakdown.appendChild(line);
      });

      sec.appendChild(globalBreakdown);
    }

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Excel\'e Aktar';
    exportBtn.style.marginTop = '12px';
    exportBtn.addEventListener('click', () => {
      if (typeof ns.exportPuantajXLSX === 'function') {
        ns.exportPuantajXLSX();
      }
    });
    sec.appendChild(exportBtn);

    sideBody.appendChild(sec);
  };
})(window.EPP = window.EPP || {});
