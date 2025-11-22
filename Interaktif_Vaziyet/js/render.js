(function(ns){
  const { WORK_GROUPS, ALL_WORK_ITEMS } = ns;
  const { hexToRgba, formatDateTime } = ns.utils;

  ns.renderHotspots = function() {
    const { hotspotLayer, mainImage } = ns.dom || {};
    if (!hotspotLayer) return;
    hotspotLayer.innerHTML = '';
    if (!ns.state.mainImageUrl) return;

    ns.state.hotspots.forEach(h => {
      const el = document.createElement('div');
      el.className = 'hotspot' + (ns.state.selectedIds.has(h.id) ? ' selected' : '');
      if (h.hoverGlow !== false) {
        el.classList.add('glow');
      }

      let fillColor = h.fillColor || '#2563eb';
      let fillOpacity = typeof h.fillOpacity === 'number' ? h.fillOpacity : 0.2;
      let borderColorHex = h.borderColor || fillColor;
      let borderOpacity = typeof h.borderOpacity === 'number' ? h.borderOpacity : 1;

      if (ns.state.highlightWorkTypeId) {
        const works = h.works || {};
        const workItem = works[ns.state.highlightWorkTypeId];
        const status = workItem ? (workItem.status || 'baslamadi') : 'baslamadi';
        if (status === 'tamamlandi') {
          fillColor = '#22c55e';
        } else if (status === 'devam_ediyor') {
          fillColor = '#eab308';
        } else {
          fillColor = '#ef4444';
        }
        fillOpacity = 0.2;
        borderColorHex = fillColor;
        borderOpacity = 1;
      }

      el.style.top = h.top + '%';
      el.style.left = h.left + '%';
      el.style.width = h.width + '%';
      el.style.height = h.height + '%';
      el.style.backgroundColor = hexToRgba(fillColor, fillOpacity);
      el.style.borderColor = hexToRgba(borderColorHex, borderOpacity);
      el.style.borderStyle = borderOpacity <= 0 ? 'none' : 'solid';
      el.style.cursor = ns.state.mode === 'editor' ? 'move' : 'pointer';

      el.dataset.id = h.id;

      if (ns.state.showLabels) {
        const label = document.createElement('div');
        label.className = 'hotspot-label';
        label.textContent = ns.buildHotspotLabel(h);
        el.appendChild(label);
      }

      if (ns.state.mode === 'editor') {
        ['nw','ne','sw','se'].forEach(pos => {
          const handle = document.createElement('div');
          handle.className = 'handle ' + pos;
          handle.dataset.id = h.id;
          handle.dataset.handle = pos;
          el.appendChild(handle);
        });
      }

      hotspotLayer.appendChild(el);
    });

    if (typeof ns.renderDrawings === 'function') {
      ns.renderDrawings();
    }
  };

  ns.openDetailImageModal = function(src) {
    const { detailImageOverlay, detailImageLarge } = ns.dom || {};
    if (!detailImageOverlay || !detailImageLarge) return;
    detailImageLarge.src = src;
    detailImageOverlay.style.display = 'flex';
  };

  ns.renderCarousel = function(container, images) {
    if (!images || images.length === 0) return;
    
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    const inner = document.createElement('div');
    inner.className = 'carousel-inner';
    
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
      
      const imgEl = document.createElement('img');
      imgEl.src = img.url;
      imgEl.addEventListener('click', () => ns.openDetailImageModal(img.url));
      item.appendChild(imgEl);
      
      if (img.caption && img.caption.trim() !== '') {
        const caption = document.createElement('div');
        caption.className = 'carousel-caption';
        caption.textContent = img.caption;
        item.appendChild(caption);
      }
      
      inner.appendChild(item);
    });
    
    carousel.appendChild(inner);
    
    if (images.length > 1) {
      const controls = document.createElement('div');
      controls.className = 'carousel-controls';
      
      const indicators = document.createElement('div');
      indicators.className = 'carousel-indicators';
      
      images.forEach((_, idx) => {
        const indicator = document.createElement('div');
        indicator.className = 'carousel-indicator' + (idx === 0 ? ' active' : '');
        indicator.addEventListener('click', () => {
          const items = inner.querySelectorAll('.carousel-item');
          const inds = indicators.querySelectorAll('.carousel-indicator');
          items.forEach((it, i) => {
            it.classList.toggle('active', i === idx);
            inds[i].classList.toggle('active', i === idx);
          });
        });
        indicators.appendChild(indicator);
      });
      
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '◀';
      prevBtn.addEventListener('click', () => {
        const items = Array.from(inner.querySelectorAll('.carousel-item'));
        const activeIdx = items.findIndex(it => it.classList.contains('active'));
        const newIdx = activeIdx === 0 ? items.length - 1 : activeIdx - 1;
        items.forEach((it, i) => it.classList.toggle('active', i === newIdx));
        const inds = indicators.querySelectorAll('.carousel-indicator');
        inds.forEach((ind, i) => ind.classList.toggle('active', i === newIdx));
      });
      
      const nextBtn = document.createElement('button');
      nextBtn.textContent = '▶';
      nextBtn.addEventListener('click', () => {
        const items = Array.from(inner.querySelectorAll('.carousel-item'));
        const activeIdx = items.findIndex(it => it.classList.contains('active'));
        const newIdx = (activeIdx + 1) % items.length;
        items.forEach((it, i) => it.classList.toggle('active', i === newIdx));
        const inds = indicators.querySelectorAll('.carousel-indicator');
        inds.forEach((ind, i) => ind.classList.toggle('active', i === newIdx));
      });
      
      controls.appendChild(prevBtn);
      controls.appendChild(indicators);
      controls.appendChild(nextBtn);
      carousel.appendChild(controls);
    }
    
    container.appendChild(carousel);
  };

  ns.renderSummaryPanel = function() {
    const { sideBody } = ns.dom || {};
    if (!sideBody) return;

    const sec = document.createElement('div');
    sec.className = 'side-section';
    const h = document.createElement('h3');
    h.textContent = 'PUANTAJ';
    sec.appendChild(h);

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

    Object.keys(adaParselMap).sort().forEach(key => {
      const group = adaParselMap[key];
      
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

  ns.renderSidePanel = function() {
    const { sideBody, asideEl } = ns.dom || {};
    const backdrop = document.getElementById('asideBackdrop');
    
    if (!sideBody) return;
    sideBody.innerHTML = '';

    if (!ns.state.sidePanelVisible) {
      if (asideEl) asideEl.classList.remove('visible');
      if (backdrop) backdrop.classList.remove('visible');
      return;
    }

    if (asideEl) asideEl.classList.add('visible');
    if (backdrop) backdrop.classList.add('visible');

    if (ns.state.showSummary) {
      ns.renderSummaryPanel();
      return;
    }

    if (!ns.state.selectedIds.size) return;

    const selectedArray = Array.from(ns.state.selectedIds);
    if (selectedArray.length > 1) {
      const sec = document.createElement('div');
      sec.className = 'side-section';
      const h = document.createElement('h3');
      h.textContent = `${selectedArray.length} blok seçili`;
      sec.appendChild(h);

      selectedArray.forEach(id => {
        const hs = ns.getHotspot(id);
        if (!hs) return;
        const item = document.createElement('div');
        item.className = 'hotspot-list-item';
        item.textContent = ns.buildHotspotLabel(hs);
        item.addEventListener('click', () => {
          ns.state.selectedIds = new Set([id]);
          ns.renderHotspots();
          ns.renderSidePanel();
        });
        sec.appendChild(item);
      });

      sideBody.appendChild(sec);
      return;
    }

    const id = selectedArray[0];
    const hs = ns.getHotspot(id);
    if (!hs) return;

    if (ns.state.mode === 'viewer') {
      const secView = document.createElement('div');
      secView.className = 'side-section';
      const h = document.createElement('h3');
      h.textContent = ns.buildHotspotLabel(hs);
      secView.appendChild(h);

      if (hs.description && hs.description.trim()) {
        const descP = document.createElement('p');
        descP.textContent = hs.description.trim();
        descP.style.fontSize = '12px';
        descP.style.marginBottom = '8px';
        secView.appendChild(descP);
      }

      if ((typeof hs.floorCount === 'number' && hs.floorCount > 0) || 
          (typeof hs.buildingType === 'string' && hs.buildingType.trim())) {
        const infoDiv = document.createElement('div');
        infoDiv.style.fontSize = '12px';
        infoDiv.style.marginBottom = '8px';
        infoDiv.style.padding = '6px 8px';
        infoDiv.style.background = '#111827';
        infoDiv.style.borderRadius = '4px';
        infoDiv.style.border = '1px solid #374151';

        if (typeof hs.buildingType === 'string' && hs.buildingType.trim()) {
          const typeRow = document.createElement('div');
          typeRow.style.marginBottom = '4px';
          const typeLabel = document.createElement('span');
          typeLabel.style.color = '#9ca3af';
          typeLabel.textContent = 'Bina Tipi: ';
          const typeValue = document.createElement('span');
          typeValue.style.color = '#e5e7eb';
          typeValue.style.fontWeight = '500';
          typeValue.textContent = hs.buildingType.trim();
          typeRow.appendChild(typeLabel);
          typeRow.appendChild(typeValue);
          infoDiv.appendChild(typeRow);
        }

        if (typeof hs.floorCount === 'number' && hs.floorCount > 0) {
          const floorRow = document.createElement('div');
          const floorLabel = document.createElement('span');
          floorLabel.style.color = '#9ca3af';
          floorLabel.textContent = 'Kat Sayısı: ';
          const floorValue = document.createElement('span');
          floorValue.style.color = '#e5e7eb';
          floorValue.style.fontWeight = '500';
          floorValue.textContent = hs.floorCount;
          floorRow.appendChild(floorLabel);
          floorRow.appendChild(floorValue);
          infoDiv.appendChild(floorRow);
        }

        secView.appendChild(infoDiv);
      }

      if (hs.detailImages && hs.detailImages.length > 0) {
        ns.renderCarousel(secView, hs.detailImages);
      }

      if (hs.works) {
        WORK_GROUPS.forEach(group => {
          let groupHasData = false;
          group.items.forEach(w => {
            const item = hs.works[w.id];
            if (item && item.status && item.status !== 'baslamadi') {
              groupHasData = true;
            }
          });

          if (!groupHasData) return;

          const gh = document.createElement('p');
          gh.style.fontWeight = '600';
          gh.style.fontSize = '12px';
          gh.style.margin = '8px 0 4px 0';
          gh.textContent = group.label;
          secView.appendChild(gh);

          group.items.forEach(w => {
            const item = hs.works[w.id];
            if (!item || !item.status || item.status === 'baslamadi') return;

            const pill = document.createElement('div');
            pill.className = 'status-pill';
            const statusClass = ns.workStatusClass(item.status);
            if (statusClass) pill.classList.add(statusClass);

            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            indicator.textContent = ns.workStatusIcon(item.status);
            pill.appendChild(indicator);

            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'info-wrapper';

            const topRow = document.createElement('div');
            topRow.className = 'top-row';

            const workLabel = document.createElement('span');
            workLabel.textContent = w.label;
            topRow.appendChild(workLabel);

            if (typeof item.workers === 'number' && item.workers > 0) {
              const separator = document.createElement('span');
              separator.className = 'separator';
              separator.textContent = '·';
              topRow.appendChild(separator);

              const workerCount = document.createElement('span');
              workerCount.textContent = `${item.workers} kişi`;
              topRow.appendChild(workerCount);
            }

            infoWrapper.appendChild(topRow);

            if (item.subcontractor && item.subcontractor.trim()) {
              const bottomRow = document.createElement('div');
              bottomRow.className = 'bottom-row';
              bottomRow.textContent = item.subcontractor.trim();
              infoWrapper.appendChild(bottomRow);
            }

            pill.appendChild(infoWrapper);
            secView.appendChild(pill);
          });
        });
      }

      sideBody.appendChild(secView);
      return;
    }

    const secEdit = document.createElement('div');
    secEdit.className = 'side-section';
    const h = document.createElement('h3');
    h.textContent = 'Blok Düzenle';
    secEdit.appendChild(h);

    const adaLabel = document.createElement('label');
    adaLabel.textContent = 'Ada';
    secEdit.appendChild(adaLabel);
    const adaInput = document.createElement('input');
    adaInput.type = 'text';
    adaInput.value = hs.ada || '';
    adaInput.addEventListener('input', () => {
      hs.ada = adaInput.value;
      ns.renderHotspots();
    });
    secEdit.appendChild(adaInput);

    const parselLabel = document.createElement('label');
    parselLabel.textContent = 'Parsel';
    parselLabel.style.marginTop = '8px';
    secEdit.appendChild(parselLabel);
    const parselInput = document.createElement('input');
    parselInput.type = 'text';
    parselInput.value = hs.parsel || '';
    parselInput.addEventListener('input', () => {
      hs.parsel = parselInput.value;
      ns.renderHotspots();
    });
    secEdit.appendChild(parselInput);

    const blokLabel = document.createElement('label');
    blokLabel.textContent = 'Blok';
    blokLabel.style.marginTop = '8px';
    secEdit.appendChild(blokLabel);
    const blokInput = document.createElement('input');
    blokInput.type = 'text';
    blokInput.value = hs.blok || '';
    blokInput.addEventListener('input', () => {
      hs.blok = blokInput.value;
      ns.renderHotspots();
    });
    secEdit.appendChild(blokInput);

    const descLabel = document.createElement('label');
    descLabel.textContent = 'Açıklama';
    descLabel.style.marginTop = '8px';
    secEdit.appendChild(descLabel);
    const descInput = document.createElement('textarea');
    descInput.value = hs.description || '';
    descInput.addEventListener('input', () => {
      hs.description = descInput.value;
    });
    secEdit.appendChild(descInput);

    const floorLabel = document.createElement('label');
    floorLabel.textContent = 'Kat sayısı';
    floorLabel.style.marginTop = '8px';
    secEdit.appendChild(floorLabel);
    const floorInput = document.createElement('input');
    floorInput.type = 'number';
    floorInput.min = '0';
    floorInput.value = typeof hs.floorCount === 'number' ? hs.floorCount : 0;
    floorInput.addEventListener('input', () => {
      const val = parseInt(floorInput.value, 10);
      hs.floorCount = isNaN(val) ? 0 : val;
    });
    secEdit.appendChild(floorInput);

    const buildingTypeLabel = document.createElement('label');
    buildingTypeLabel.textContent = 'Bina tipi';
    buildingTypeLabel.style.marginTop = '8px';
    secEdit.appendChild(buildingTypeLabel);
    const buildingTypeInput = document.createElement('input');
    buildingTypeInput.type = 'text';
    buildingTypeInput.value = typeof hs.buildingType === 'string' ? hs.buildingType : '';
    buildingTypeInput.addEventListener('input', () => {
      hs.buildingType = buildingTypeInput.value;
    });
    secEdit.appendChild(buildingTypeInput);

    const fillColorLabel = document.createElement('label');
    fillColorLabel.textContent = 'Dolgu rengi';
    fillColorLabel.style.marginTop = '8px';
    secEdit.appendChild(fillColorLabel);
    const colorRow = document.createElement('div');
    colorRow.className = 'inline-row';
    const fillColorInput = document.createElement('input');
    fillColorInput.type = 'color';
    fillColorInput.value = hs.fillColor || '#2563eb';
    fillColorInput.addEventListener('input', () => {
      hs.fillColor = fillColorInput.value;
      ns.renderHotspots();
    });
    colorRow.appendChild(fillColorInput);
    const fillOpacityInput = document.createElement('input');
    fillOpacityInput.type = 'range';
    fillOpacityInput.min = '0';
    fillOpacityInput.max = '1';
    fillOpacityInput.step = '0.01';
    fillOpacityInput.value = typeof hs.fillOpacity === 'number' ? hs.fillOpacity : 0.2;
    fillOpacityInput.addEventListener('input', () => {
      hs.fillOpacity = parseFloat(fillOpacityInput.value);
      ns.renderHotspots();
    });
    colorRow.appendChild(fillOpacityInput);
    const opacityLabel = document.createElement('span');
    opacityLabel.textContent = Math.round((typeof hs.fillOpacity === 'number' ? hs.fillOpacity : 0.2) * 100) + '%';
    fillOpacityInput.addEventListener('input', () => {
      opacityLabel.textContent = Math.round(parseFloat(fillOpacityInput.value) * 100) + '%';
    });
    colorRow.appendChild(opacityLabel);
    secEdit.appendChild(colorRow);

    const borderColorLabel = document.createElement('label');
    borderColorLabel.textContent = 'Kenarlık rengi';
    borderColorLabel.style.marginTop = '8px';
    secEdit.appendChild(borderColorLabel);
    const borderColorRow = document.createElement('div');
    borderColorRow.className = 'inline-row';
    const borderColorInput = document.createElement('input');
    borderColorInput.type = 'color';
    borderColorInput.value = hs.borderColor || hs.fillColor || '#60a5fa';
    borderColorInput.addEventListener('input', () => {
      hs.borderColor = borderColorInput.value;
      ns.renderHotspots();
    });
    borderColorRow.appendChild(borderColorInput);
    const borderOpacityInput = document.createElement('input');
    borderOpacityInput.type = 'range';
    borderOpacityInput.min = '0';
    borderOpacityInput.max = '1';
    borderOpacityInput.step = '0.01';
    borderOpacityInput.value = typeof hs.borderOpacity === 'number' ? hs.borderOpacity : 1;
    borderOpacityInput.addEventListener('input', () => {
      hs.borderOpacity = parseFloat(borderOpacityInput.value);
      ns.renderHotspots();
    });
    borderColorRow.appendChild(borderOpacityInput);
    const borderOpacityLabel = document.createElement('span');
    borderOpacityLabel.textContent = Math.round((typeof hs.borderOpacity === 'number' ? hs.borderOpacity : 1) * 100) + '%';
    borderOpacityInput.addEventListener('input', () => {
      borderOpacityLabel.textContent = Math.round(parseFloat(borderOpacityInput.value) * 100) + '%';
    });
    borderColorRow.appendChild(borderOpacityLabel);
    secEdit.appendChild(borderColorRow);

    const imagesHeader = document.createElement('h3');
    imagesHeader.textContent = 'Detay Görselleri';
    imagesHeader.style.marginTop = '8px';
    secEdit.appendChild(imagesHeader);

    if (!hs.detailImages) hs.detailImages = [];
    if (hs.detailImages.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Henüz detay görseli yok.';
      secEdit.appendChild(hint);
    } else {
      hs.detailImages.forEach((img, idx) => {
        const imgRow = document.createElement('div');
        imgRow.style.marginBottom = '8px';
        imgRow.style.padding = '4px';
        imgRow.style.borderRadius = '4px';
        imgRow.style.background = '#111827';

        const imgEl = document.createElement('img');
        imgEl.src = img.url;
        imgEl.className = 'thumb';
        imgEl.addEventListener('click', () => ns.openDetailImageModal(img.url));
        imgRow.appendChild(imgEl);

        const captionInput = document.createElement('input');
        captionInput.type = 'text';
        captionInput.placeholder = 'Görsel açıklaması (isteğe bağlı)';
        captionInput.value = img.caption || '';
        captionInput.addEventListener('input', () => {
          img.caption = captionInput.value;
        });
        imgRow.appendChild(captionInput);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Sil';
        deleteBtn.className = 'danger';
        deleteBtn.addEventListener('click', () => {
          if (confirm('Bu görseli silmek istediğinize emin misiniz?')) {
            hs.detailImages.splice(idx, 1);
            ns.renderSidePanel();
          }
        });
        imgRow.appendChild(deleteBtn);

        secEdit.appendChild(imgRow);
      });
    }

    if (hs.detailImages.length < 4) {
      const addImgInput = document.createElement('input');
      addImgInput.type = 'file';
      addImgInput.accept = 'image/*';
      addImgInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          if (!hs.detailImages) hs.detailImages = [];
          hs.detailImages.push({ url: ev.target.result, caption: '' });
          ns.renderSidePanel();
        };
        reader.readAsDataURL(file);
      });
      secEdit.appendChild(addImgInput);
    } else {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Maksimum 4 görsel ekleyebilirsiniz.';
      secEdit.appendChild(hint);
    }

    const dailyHeader = document.createElement('h3');
    dailyHeader.textContent = 'Günlük Puantaj';
    dailyHeader.style.marginTop = '8px';
    secEdit.appendChild(dailyHeader);

    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Tarih seç:';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = ns.state.selectedDate || new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', () => {
      ns.state.selectedDate = dateInput.value;
      ns.renderSidePanel();
    });
    secEdit.appendChild(dateLabel);
    secEdit.appendChild(dateInput);

    const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];

    const dailyHint = document.createElement('p');
    dailyHint.className = 'hint';
    dailyHint.textContent = 'Seçili tarih için imalat durumlarını girin:';
    secEdit.appendChild(dailyHint);

    const secWorks = document.createElement('div');
    secWorks.className = 'side-section';

    WORK_GROUPS.forEach(group => {
      const gh = document.createElement('p');
      gh.style.fontWeight = '600';
      gh.style.fontSize = '12px';
      gh.style.margin = '6px 0 2px 0';
      gh.textContent = group.label;
      secWorks.appendChild(gh);

      group.items.forEach(w => {
        let record = hs.dailyRecords.find(r => r.date === selectedDate && r.workTypeId === w.id);
        if (!record) {
          record = { date: selectedDate, workTypeId: w.id, workers: 0, status: 'baslamadi' };
          hs.dailyRecords.push(record);
        }

        const item = hs.works[w.id] || { status: 'baslamadi', workers: 0, subcontractor: '' };
        hs.works[w.id] = item;

        const row = document.createElement('div');
        row.className = 'works-row';

        const title = document.createElement('div');
        title.className = 'works-row-title';
        title.textContent = w.label;
        row.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'works-row-controls';

        const select = document.createElement('select');
        ns.STATUS_OPTIONS.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          select.appendChild(o);
        });
        select.value = record.status || 'baslamadi';
        select.addEventListener('change', () => {
          record.status = select.value;
          hs.works[w.id].status = select.value;
          ns.renderHotspots();
        });

        const workersInput = document.createElement('input');
        workersInput.type = 'number';
        workersInput.min = '0';
        workersInput.value =
          typeof record.workers === 'number' && !isNaN(record.workers) ? record.workers : 0;
        workersInput.addEventListener('input', () => {
          const val = parseInt(workersInput.value, 10);
          record.workers = isNaN(val) ? 0 : val;
          hs.works[w.id].workers = record.workers;
        });

        const workersLabel = document.createElement('span');
        workersLabel.textContent = 'kişi';

        controls.appendChild(select);
        controls.appendChild(workersInput);
        controls.appendChild(workersLabel);

        row.appendChild(controls);

        const subInput = document.createElement('input');
        subInput.type = 'text';
        subInput.placeholder = 'Alt yüklenici (isteğe bağlı)';
        subInput.value = item.subcontractor || '';
        subInput.addEventListener('input', () => {
          hs.works[w.id].subcontractor = subInput.value;
        });
        row.appendChild(subInput);

        secWorks.appendChild(row);
      });
    });

    secEdit.appendChild(secWorks);

    // SIFIRLAMA BUTONLARI
    const resetSection = document.createElement('div');
    resetSection.style.marginTop = '12px';
    resetSection.style.padding = '8px';
    resetSection.style.background = '#111827';
    resetSection.style.borderRadius = '4px';
    resetSection.style.border = '1px solid #374151';

    const resetTitle = document.createElement('div');
    resetTitle.style.fontSize = '11px';
    resetTitle.style.fontWeight = '600';
    resetTitle.style.marginBottom = '8px';
    resetTitle.style.color = '#9ca3af';
    resetTitle.textContent = 'HIZLI SIFIRLAMA';
    resetSection.appendChild(resetTitle);

    // Attribute sıfırla
    const resetAttrsBtn = document.createElement('button');
    resetAttrsBtn.textContent = 'Attribute Sıfırla';
    resetAttrsBtn.style.width = '100%';
    resetAttrsBtn.style.marginBottom = '4px';
    resetAttrsBtn.addEventListener('click', () => {
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
    resetSection.appendChild(resetAttrsBtn);

    // Görselleri sıfırla
    const resetImagesBtn = document.createElement('button');
    resetImagesBtn.textContent = 'Görselleri Sil';
    resetImagesBtn.style.width = '100%';
    resetImagesBtn.style.marginBottom = '4px';
    resetImagesBtn.addEventListener('click', () => {
      if (!confirm('Tüm detay görsellerini silmek istediğinize emin misiniz?')) return;
      
      hs.detailImages = [];
      
      ns.pushHistory('resetImages');
      ns.renderSidePanel();
    });
    resetSection.appendChild(resetImagesBtn);

    // İmalat durumlarını sıfırla
    const resetWorksBtn = document.createElement('button');
    resetWorksBtn.textContent = 'İmalat Durumlarını Sıfırla';
    resetWorksBtn.style.width = '100%';
    resetWorksBtn.style.marginBottom = '4px';
    resetWorksBtn.addEventListener('click', () => {
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
    resetSection.appendChild(resetWorksBtn);

    // Sadece bugünkü puantajı sıfırla
    const resetTodayBtn = document.createElement('button');
    resetTodayBtn.textContent = 'Bugünkü Puantajı Sıfırla';
    resetTodayBtn.style.width = '100%';
    resetTodayBtn.addEventListener('click', () => {
      const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];
      if (!confirm(`${selectedDate} tarihli puantajı sıfırlamak istediğinize emin misiniz?`)) return;
      
      hs.dailyRecords = hs.dailyRecords.filter(r => r.date !== selectedDate);
      
      ns.pushHistory('resetTodayPuantaj');
      ns.renderSidePanel();
    });
    resetSection.appendChild(resetTodayBtn);

    secEdit.appendChild(resetSection);

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '8px';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Blok sil';
    delBtn.className = 'danger';
    delBtn.addEventListener('click', () => {
      if (!confirm('Seçili blok(lar) silinsin mi?')) return;
      const ids = Array.from(ns.state.selectedIds);
      ns.state.hotspots = ns.state.hotspots.filter(hh => !ids.includes(hh.id));
      ns.state.selectedIds.clear();
      ns.state.sidePanelVisible = false;
      ns.renderHotspots();
      ns.renderSidePanel();
    });
    btnRow.appendChild(delBtn);
    secEdit.appendChild(btnRow);

    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Shift+klik: çoklu seçim · İçini sürükle: taşı · Köşeler: yeniden boyutlandır · Klavyede Delete: seçili blok sil · Ctrl+sürükle: blok kopyala.';
    secEdit.appendChild(hint);

    sideBody.appendChild(secEdit);
  };

  ns.updateModeToggleUI = function() {
    const { modeToggle } = ns.dom || {};
    if (!modeToggle) return;
    const viewerBtn = modeToggle.querySelector('button[data-mode="viewer"]');
    const editorBtn = modeToggle.querySelector('button[data-mode="editor"]');
    if (!viewerBtn || !editorBtn) return;
    viewerBtn.classList.toggle('active', ns.state.mode === 'viewer');
    editorBtn.classList.toggle('active', ns.state.mode === 'editor');
  };

  ns.updateLastExportLabel = function() {
    const { lastExportLabel } = ns.dom || {};
    if (!lastExportLabel) return;
    if (!ns.state.lastExportAt) {
      lastExportLabel.textContent = 'Son kayıt: -';
    } else {
      lastExportLabel.textContent = 'Son kayıt: ' + formatDateTime(ns.state.lastExportAt);
    }
  };

  ns.updateProjectNameLabel = function() {
    const { projectNameLabel } = ns.dom || {};
    if (!projectNameLabel) return;
    const name = ns.state.projectInfo && ns.state.projectInfo.name
      ? ns.state.projectInfo.name.trim()
      : '';
    if (!name) {
      projectNameLabel.style.display = 'none';
      projectNameLabel.textContent = '';
    } else {
      projectNameLabel.style.display = 'inline-flex';
      projectNameLabel.textContent = name;
    }
  };

  ns.applyMode = function(newMode) {
    ns.state.mode = newMode;
    ns.updateModeToggleUI();
    const { mainImageWrapper, passwordSettingsBtn, projectInfoBtn } = ns.dom || {};
    const drawToolbar = document.getElementById('drawToolbar');
    
    if (mainImageWrapper) {
      mainImageWrapper.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (drawToolbar) {
      drawToolbar.style.display = newMode === 'editor' ? 'flex' : 'none';
    }
    if (passwordSettingsBtn) {
      passwordSettingsBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (projectInfoBtn) {
      projectInfoBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    ns.renderHotspots();
    ns.renderSidePanel();
    ns.renderDrawings();
  };

  ns.renderDrawings = function() {
    const { drawingLayer, textLayer } = ns.dom || {};
    if (!drawingLayer || !textLayer) return;

    drawingLayer.innerHTML = '';

    if (ns.state.drawings && Array.isArray(ns.state.drawings)) {
      ns.state.drawings.forEach((drawing, idx) => {
        if (drawing.type === 'line') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', drawing.x1 + '%');
          line.setAttribute('y1', drawing.y1 + '%');
          line.setAttribute('x2', drawing.x2 + '%');
          line.setAttribute('y2', drawing.y2 + '%');
          line.setAttribute('stroke', drawing.color || '#eab308');
          line.setAttribute('stroke-width', drawing.width || 2);
          line.style.cursor = 'pointer';
          line.style.pointerEvents = 'stroke';
          drawingLayer.appendChild(line);
        } else if (drawing.type === 'curve') {
          if (drawing.points && drawing.points.length > 1) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = `M ${drawing.points[0].x} ${drawing.points[0].y}`;
            for (let i = 1; i < drawing.points.length; i++) {
              d += ` L ${drawing.points[i].x} ${drawing.points[i].y}`;
            }
            path.setAttribute('d', d);
            path.setAttribute('stroke', drawing.color || '#eab308');
            path.setAttribute('stroke-width', drawing.width || 2);
            path.setAttribute('fill', 'none');
            path.style.cursor = 'pointer';
            path.style.pointerEvents = 'stroke';
            drawingLayer.appendChild(path);
          }
        }
      });
    }

    textLayer.innerHTML = '';

    if (ns.state.texts && Array.isArray(ns.state.texts)) {
      ns.state.texts.forEach(text => {
        const textEl = document.createElement('div');
        textEl.className = 'draw-text';
        textEl.textContent = text.text;
        textEl.style.left = text.x + '%';
        textEl.style.top = text.y + '%';
        textEl.style.color = text.color || '#eab308';
        textEl.style.fontSize = (text.fontSize || 14) + 'px';
        textEl.dataset.id = text.id;
        textLayer.appendChild(textEl);
      });
    }
  };

  ns.renderDrawingPreview = function(drawingState) {
    const { drawingLayer } = ns.dom || {};
    if (!drawingLayer) return;

    ns.renderDrawings();

    if (drawingState.type === 'line' && drawingState.endX !== undefined) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', drawingState.startX + '%');
      line.setAttribute('y1', drawingState.startY + '%');
      line.setAttribute('x2', drawingState.endX + '%');
      line.setAttribute('y2', drawingState.endY + '%');
      line.setAttribute('stroke', '#eab308');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.6');
      drawingLayer.appendChild(line);
    } else if (drawingState.type === 'curve' && drawingState.points.length > 1) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d = `M ${drawingState.points[0].x} ${drawingState.points[0].y}`;
      for (let i = 1; i < drawingState.points.length; i++) {
        d += ` L ${drawingState.points[i].x} ${drawingState.points[i].y}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#eab308');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.6');
      drawingLayer.appendChild(path);
    }
  };
})(window.EPP = window.EPP || {});