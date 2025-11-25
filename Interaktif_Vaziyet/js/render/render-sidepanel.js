(function(ns){
  const { WORK_GROUPS, ALL_WORK_ITEMS } = ns;

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
    /* if (backdrop) backdrop.classList.add('visible');*/

    if (ns.state.showSummary) {
      ns.renderSummaryPanel();
      return;
    }

    if (ns.state.showReadyPanel) {
      ns.renderReadyWorksPanel();
      return;
    }

    if (ns.state.showIssuesPanel) {
      ns.renderAllIssuesPanel();
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
            if (item && item.status && item.status !== 'veri_girilmedi') {
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
            if (!item || !item.status || item.status === 'veri_girilmedi') return;

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

            // Başlama ve tamamlanma tarihlerini works objesinden al
            const startDate = item.startDate || '';
            const endDate = item.endDate || '';

            // Alt yüklenici ve tarih bilgilerini göster
            const hasSubcontractor = item.subcontractor && item.subcontractor.trim();
            const hasDates = startDate || endDate;

            if (hasSubcontractor || hasDates) {
              const bottomRow = document.createElement('div');
              bottomRow.className = 'bottom-row';
              
              const parts = [];
              if (hasSubcontractor) {
                parts.push(item.subcontractor.trim());
              }
              
              if (startDate && endDate) {
                const startFormatted = startDate.split('-').reverse().join('.');
                const endFormatted = endDate.split('-').reverse().join('.');
                parts.push(`📅 ${startFormatted} → ${endFormatted}`);
              } else if (startDate) {
                const startFormatted = startDate.split('-').reverse().join('.');
                parts.push(`📅 Başlangıç: ${startFormatted}`);
              } else if (endDate) {
                const endFormatted = endDate.split('-').reverse().join('.');
                parts.push(`📅 Tamamlanma: ${endFormatted}`);
              }
              
              bottomRow.textContent = parts.join(' · ');
              infoWrapper.appendChild(bottomRow);
            }

            pill.appendChild(infoWrapper);
            secView.appendChild(pill);
          });
        });
      }

      // İMALAT SORUNLARI BÖLÜMÜ (VIEWER MODE)
      if (hs.issues && hs.issues.length > 0) {
        const issuesHeader = document.createElement('p');
        issuesHeader.style.fontWeight = '600';
        issuesHeader.style.fontSize = '12px';
        issuesHeader.style.margin = '12px 0 4px 0';
        issuesHeader.style.color = '#ef4444';
        issuesHeader.textContent = '⚠️ İmalat Sorunları';
        secView.appendChild(issuesHeader);

        hs.issues.forEach((issue, idx) => {
          const issueCard = document.createElement('div');
          issueCard.style.background = '#1f2937';
          issueCard.style.border = '1px solid #374151';
          issueCard.style.borderRadius = '6px';
          issueCard.style.padding = '8px';
          issueCard.style.marginBottom = '8px';

          const issueTop = document.createElement('div');
          issueTop.style.display = 'flex';
          issueTop.style.justifyContent = 'space-between';
          issueTop.style.alignItems = 'center';
          issueTop.style.marginBottom = '6px';

          const issueTitle = document.createElement('div');
          issueTitle.style.fontSize = '11px';
          issueTitle.style.fontWeight = '600';
          issueTitle.style.color = '#e5e7eb';
          issueTitle.textContent = `#${idx + 1} - ${issue.title || 'Sorun'}`;
          issueTop.appendChild(issueTitle);

          const statusBadge = document.createElement('span');
          statusBadge.style.fontSize = '10px';
          statusBadge.style.padding = '2px 6px';
          statusBadge.style.borderRadius = '3px';
          statusBadge.style.fontWeight = '500';
          if (issue.status === 'open') {
            statusBadge.style.background = '#dc2626';
            statusBadge.style.color = '#fff';
            statusBadge.textContent = 'Açık';
          } else {
            statusBadge.style.background = '#16a34a';
            statusBadge.style.color = '#fff';
            statusBadge.textContent = 'Kapalı';
          }
          issueTop.appendChild(statusBadge);

          issueCard.appendChild(issueTop);

          if (issue.description && issue.description.trim()) {
            const issueDesc = document.createElement('div');
            issueDesc.style.fontSize = '11px';
            issueDesc.style.color = '#d1d5db';
            issueDesc.style.marginBottom = '6px';
            issueDesc.textContent = issue.description.trim();
            issueCard.appendChild(issueDesc);
          }

          const issueMeta = document.createElement('div');
          issueMeta.style.fontSize = '10px';
          issueMeta.style.color = '#9ca3af';
          issueMeta.style.display = 'flex';
          issueMeta.style.gap = '8px';
          issueMeta.style.flexWrap = 'wrap';
          
          // Oluşturulma tarihi/saati
          if (issue.createdAt) {
            const dateSpan = document.createElement('span');
            const createdDate = new Date(issue.createdAt);
            const dateStr = createdDate.toLocaleDateString('tr-TR');
            const timeStr = createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            dateSpan.textContent = `📅 ${dateStr} ${timeStr}`;
            issueMeta.appendChild(dateSpan);
          } else if (issue.date) {
            // Eski format desteği
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `📅 ${issue.date}`;
            issueMeta.appendChild(dateSpan);
          }

          // İmalat türü
          if (issue.workTypeId) {
            const workTypeSpan = document.createElement('span');
            const workItem = ALL_WORK_ITEMS.find(w => w.id === issue.workTypeId);
            if (workItem) {
              workTypeSpan.textContent = `🔧 ${workItem.label}`;
              issueMeta.appendChild(workTypeSpan);
            }
          }
          
          if (issue.priority) {
            const prioritySpan = document.createElement('span');
            const priorityEmoji = issue.priority === 'high' ? '🔴' : issue.priority === 'medium' ? '🟡' : '🟢';
            const priorityText = issue.priority === 'high' ? 'Yüksek' : issue.priority === 'medium' ? 'Orta' : 'Düşük';
            prioritySpan.textContent = `${priorityEmoji} ${priorityText}`;
            issueMeta.appendChild(prioritySpan);
          }
          
          issueCard.appendChild(issueMeta);

          if (issue.photos && issue.photos.length > 0) {
            const photosDiv = document.createElement('div');
            photosDiv.style.display = 'flex';
            photosDiv.style.gap = '4px';
            photosDiv.style.marginTop = '6px';
            photosDiv.style.flexWrap = 'wrap';

            issue.photos.forEach((photo, photoIdx) => {
              const photoThumb = document.createElement('img');
              photoThumb.src = photo.data;
              photoThumb.alt = photo.name;
              photoThumb.style.width = '60px';
              photoThumb.style.height = '60px';
              photoThumb.style.objectFit = 'cover';
              photoThumb.style.borderRadius = '4px';
              photoThumb.style.cursor = 'pointer';
              photoThumb.style.border = '1px solid #374151';
              photoThumb.addEventListener('click', () => {
                if (typeof ns.openDetailImageModal === 'function') {
                  // Pass all photos as gallery
                  const gallery = issue.photos.map(p => p.data);
                  ns.openDetailImageModal(photo.data, gallery, photoIdx);
                }
              });
              photosDiv.appendChild(photoThumb);
            });

            issueCard.appendChild(photosDiv);
          }

          secView.appendChild(issueCard);
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
          record = { date: selectedDate, workTypeId: w.id, workers: 0, status: 'veri_girilmedi' };
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

        // Başlama ve Bitiş Tarihi satırı
        const datesRow = document.createElement('div');
        datesRow.style.display = 'flex';
        datesRow.style.gap = '8px';
        datesRow.style.marginTop = '4px';

        const startDateWrapper = document.createElement('div');
        startDateWrapper.style.flex = '1';
        const startDateLabel = document.createElement('label');
        startDateLabel.textContent = 'Başlama';
        startDateLabel.style.fontSize = '10px';
        startDateLabel.style.color = '#9ca3af';
        startDateLabel.style.display = 'block';
        startDateWrapper.appendChild(startDateLabel);
        const startDateInput = document.createElement('input');
        startDateInput.type = 'date';
        startDateInput.value = item.startDate || '';
        startDateInput.style.width = '100%';
        startDateInput.addEventListener('change', () => {
          hs.works[w.id].startDate = startDateInput.value;
        });
        startDateWrapper.appendChild(startDateInput);
        datesRow.appendChild(startDateWrapper);

        const endDateWrapper = document.createElement('div');
        endDateWrapper.style.flex = '1';
        const endDateLabel = document.createElement('label');
        endDateLabel.textContent = 'Bitiş';
        endDateLabel.style.fontSize = '10px';
        endDateLabel.style.color = '#9ca3af';
        endDateLabel.style.display = 'block';
        endDateWrapper.appendChild(endDateLabel);
        const endDateInput = document.createElement('input');
        endDateInput.type = 'date';
        endDateInput.value = item.endDate || '';
        endDateInput.style.width = '100%';
        endDateInput.addEventListener('change', () => {
          hs.works[w.id].endDate = endDateInput.value;
        });
        endDateWrapper.appendChild(endDateInput);
        datesRow.appendChild(endDateWrapper);

        row.appendChild(datesRow);

        secWorks.appendChild(row);
      });
    });

    secEdit.appendChild(secWorks);

    // İMALAT SORUNLARI BÖLÜMÜ (EDITOR MODE)
    const issuesSection = document.createElement('div');
    issuesSection.style.marginTop = '16px';
    issuesSection.style.padding = '10px';
    issuesSection.style.background = '#111827';
    issuesSection.style.borderRadius = '6px';
    issuesSection.style.border = '1px solid #374151';

    const issuesHeader = document.createElement('div');
    issuesHeader.style.display = 'flex';
    issuesHeader.style.justifyContent = 'space-between';
    issuesHeader.style.alignItems = 'center';
    issuesHeader.style.marginBottom = '10px';

    const issuesTitle = document.createElement('div');
    issuesTitle.style.fontSize = '12px';
    issuesTitle.style.fontWeight = '600';
    issuesTitle.style.color = '#ef4444';
    issuesTitle.textContent = '⚠️ İMALAT SORUNLARI';
    issuesHeader.appendChild(issuesTitle);

    const addIssueBtn = document.createElement('button');
    addIssueBtn.textContent = '+ Yeni Sorun';
    addIssueBtn.style.fontSize = '11px';
    addIssueBtn.style.padding = '4px 8px';
    addIssueBtn.addEventListener('click', () => {
      if (!hs.issues) hs.issues = [];
      const now = new Date();
      hs.issues.push({
        id: 'issue-' + Date.now(),
        title: 'Yeni Sorun',
        description: '',
        createdAt: now.toISOString(),
        workTypeId: '',
        status: 'open',
        priority: 'medium',
        photos: []
      });
      ns.pushHistory('addIssue');
      ns.renderSidePanel();
    });
    issuesHeader.appendChild(addIssueBtn);

    issuesSection.appendChild(issuesHeader);

    if (!hs.issues) hs.issues = [];

    if (hs.issues.length === 0) {
      const noIssues = document.createElement('div');
      noIssues.style.fontSize = '11px';
      noIssues.style.color = '#9ca3af';
      noIssues.style.textAlign = 'center';
      noIssues.style.padding = '8px';
      noIssues.textContent = 'Henüz sorun kaydı yok';
      issuesSection.appendChild(noIssues);
    } else {
      hs.issues.forEach((issue, idx) => {
        const issueCard = document.createElement('div');
        issueCard.style.background = '#1f2937';
        issueCard.style.border = '1px solid #374151';
        issueCard.style.borderRadius = '4px';
        issueCard.style.padding = '8px';
        issueCard.style.marginBottom = '8px';

        // Başlık
        const titleLabel = document.createElement('label');
        titleLabel.textContent = `Sorun #${idx + 1} Başlığı`;
        titleLabel.style.fontSize = '10px';
        titleLabel.style.fontWeight = '600';
        titleLabel.style.color = '#d1d5db';
        titleLabel.style.display = 'block';
        titleLabel.style.marginBottom = '4px';
        issueCard.appendChild(titleLabel);

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = issue.title || '';
        titleInput.style.width = '100%';
        titleInput.style.marginBottom = '6px';
        titleInput.addEventListener('input', () => {
          issue.title = titleInput.value;
        });
        issueCard.appendChild(titleInput);

        // Oluşturulma tarihi/saati (sadece gösterim)
        if (issue.createdAt) {
          const createdAtDiv = document.createElement('div');
          createdAtDiv.style.fontSize = '10px';
          createdAtDiv.style.color = '#9ca3af';
          createdAtDiv.style.marginBottom = '6px';
          const createdDate = new Date(issue.createdAt);
          const dateStr = createdDate.toLocaleDateString('tr-TR');
          const timeStr = createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          createdAtDiv.textContent = `📅 Oluşturulma: ${dateStr} ${timeStr}`;
          issueCard.appendChild(createdAtDiv);
        }

        // Açıklama
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Açıklama';
        descLabel.style.fontSize = '10px';
        descLabel.style.fontWeight = '600';
        descLabel.style.color = '#d1d5db';
        descLabel.style.display = 'block';
        descLabel.style.marginBottom = '4px';
        issueCard.appendChild(descLabel);

        const descInput = document.createElement('textarea');
        descInput.value = issue.description || '';
        descInput.rows = 2;
        descInput.style.width = '100%';
        descInput.style.marginBottom = '6px';
        descInput.style.resize = 'vertical';
        descInput.addEventListener('input', () => {
          issue.description = descInput.value;
        });
        issueCard.appendChild(descInput);

        // İmalat Türü, Durum, Öncelik satırı
        const metaRow = document.createElement('div');
        metaRow.style.display = 'grid';
        metaRow.style.gridTemplateColumns = '1fr 1fr 1fr';
        metaRow.style.gap = '6px';
        metaRow.style.marginBottom = '6px';

        // İmalat Türü
        const workTypeDiv = document.createElement('div');
        const workTypeLabel = document.createElement('label');
        workTypeLabel.textContent = 'İmalat Türü';
        workTypeLabel.style.fontSize = '10px';
        workTypeLabel.style.fontWeight = '600';
        workTypeLabel.style.color = '#d1d5db';
        workTypeLabel.style.display = 'block';
        workTypeLabel.style.marginBottom = '2px';
        workTypeDiv.appendChild(workTypeLabel);
        const workTypeSelect = document.createElement('select');
        workTypeSelect.style.width = '100%';
        // Boş seçenek
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- Seçiniz --';
        workTypeSelect.appendChild(emptyOpt);
        // İmalat türlerini grupla
        WORK_GROUPS.forEach(group => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = group.label;
          group.items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.label;
            optgroup.appendChild(opt);
          });
          workTypeSelect.appendChild(optgroup);
        });
        workTypeSelect.value = issue.workTypeId || '';
        workTypeSelect.addEventListener('change', () => {
          issue.workTypeId = workTypeSelect.value;
        });
        workTypeDiv.appendChild(workTypeSelect);
        metaRow.appendChild(workTypeDiv);

        // Durum
        const statusDiv = document.createElement('div');
        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'Durum';
        statusLabel.style.fontSize = '10px';
        statusLabel.style.fontWeight = '600';
        statusLabel.style.color = '#d1d5db';
        statusLabel.style.display = 'block';
        statusLabel.style.marginBottom = '2px';
        statusDiv.appendChild(statusLabel);
        const statusSelect = document.createElement('select');
        statusSelect.style.width = '100%';
        const statusOptions = [
          { value: 'open', label: 'Açık' },
          { value: 'closed', label: 'Kapalı' }
        ];
        statusOptions.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          statusSelect.appendChild(o);
        });
        statusSelect.value = issue.status || 'open';
        statusSelect.addEventListener('change', () => {
          issue.status = statusSelect.value;
        });
        statusDiv.appendChild(statusSelect);
        metaRow.appendChild(statusDiv);

        // Öncelik
        const priorityDiv = document.createElement('div');
        const priorityLabel = document.createElement('label');
        priorityLabel.textContent = 'Öncelik';
        priorityLabel.style.fontSize = '10px';
        priorityLabel.style.fontWeight = '600';
        priorityLabel.style.color = '#d1d5db';
        priorityLabel.style.display = 'block';
        priorityLabel.style.marginBottom = '2px';
        priorityDiv.appendChild(priorityLabel);
        const prioritySelect = document.createElement('select');
        prioritySelect.style.width = '100%';
        const priorityOptions = [
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ];
        priorityOptions.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          prioritySelect.appendChild(o);
        });
        prioritySelect.value = issue.priority || 'medium';
        prioritySelect.addEventListener('change', () => {
          issue.priority = prioritySelect.value;
        });
        priorityDiv.appendChild(prioritySelect);
        metaRow.appendChild(priorityDiv);

        issueCard.appendChild(metaRow);

        // Fotoğraflar
        const photosLabel = document.createElement('label');
        photosLabel.textContent = 'Fotoğraflar';
        photosLabel.style.fontSize = '10px';
        photosLabel.style.fontWeight = '600';
        photosLabel.style.color = '#d1d5db';
        photosLabel.style.display = 'block';
        photosLabel.style.marginBottom = '4px';
        issueCard.appendChild(photosLabel);

        if (!issue.photos) issue.photos = [];

        if (issue.photos.length > 0) {
          const photosGrid = document.createElement('div');
          photosGrid.style.display = 'grid';
          photosGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
          photosGrid.style.gap = '4px';
          photosGrid.style.marginBottom = '6px';

          issue.photos.forEach((photo, photoIdx) => {
            const photoWrapper = document.createElement('div');
            photoWrapper.style.position = 'relative';

            const photoImg = document.createElement('img');
            photoImg.src = photo.data;
            photoImg.alt = photo.name;
            photoImg.style.width = '100%';
            photoImg.style.height = '60px';
            photoImg.style.objectFit = 'cover';
            photoImg.style.borderRadius = '4px';
            photoImg.style.cursor = 'pointer';
            photoImg.style.border = '1px solid #374151';
            photoImg.addEventListener('click', () => {
              if (typeof ns.openDetailImageModal === 'function') {
                // Pass all photos as gallery
                const gallery = issue.photos.map(p => p.data);
                ns.openDetailImageModal(photo.data, gallery, photoIdx);
              }
            });
            photoWrapper.appendChild(photoImg);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '2px';
            deleteBtn.style.right = '2px';
            deleteBtn.style.width = '20px';
            deleteBtn.style.height = '20px';
            deleteBtn.style.padding = '0';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.lineHeight = '1';
            deleteBtn.style.background = 'rgba(0,0,0,0.7)';
            deleteBtn.style.color = '#fff';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '3px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
                issue.photos.splice(photoIdx, 1);
                ns.pushHistory('deleteIssuePhoto');
                ns.renderSidePanel();
              }
            });
            photoWrapper.appendChild(deleteBtn);

            photosGrid.appendChild(photoWrapper);
          });

          issueCard.appendChild(photosGrid);
        }

        // Fotoğraf yükleme butonu
        const addPhotoLabel = document.createElement('label');
        addPhotoLabel.style.display = 'inline-block';
        addPhotoLabel.style.padding = '4px 8px';
        addPhotoLabel.style.fontSize = '11px';
        addPhotoLabel.style.background = '#374151';
        addPhotoLabel.style.color = '#e5e7eb';
        addPhotoLabel.style.borderRadius = '4px';
        addPhotoLabel.style.cursor = 'pointer';
        addPhotoLabel.style.marginBottom = '6px';
        addPhotoLabel.textContent = '📷 Fotoğraf Ekle';
        const addPhotoInput = document.createElement('input');
        addPhotoInput.type = 'file';
        addPhotoInput.accept = 'image/*';
        addPhotoInput.multiple = true;
        addPhotoInput.style.display = 'none';
        addPhotoInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => {
              if (!issue.photos) issue.photos = [];
              issue.photos.push({
                name: file.name,
                data: reader.result
              });
              ns.pushHistory('addIssuePhoto');
              ns.renderSidePanel();
            };
            reader.readAsDataURL(file);
          }
        });
        addPhotoLabel.appendChild(addPhotoInput);
        issueCard.appendChild(addPhotoLabel);

        // Sorun silme butonu
        const deleteIssueBtn = document.createElement('button');
        deleteIssueBtn.textContent = 'Sorunu Sil';
        deleteIssueBtn.className = 'danger';
        deleteIssueBtn.style.width = '100%';
        deleteIssueBtn.style.fontSize = '11px';
        deleteIssueBtn.style.padding = '4px 8px';
        deleteIssueBtn.addEventListener('click', () => {
          if (confirm('Bu sorunu silmek istediğinize emin misiniz?')) {
            hs.issues.splice(idx, 1);
            ns.pushHistory('deleteIssue');
            ns.renderSidePanel();
          }
        });
        issueCard.appendChild(deleteIssueBtn);

        issuesSection.appendChild(issueCard);
      });
    }

    secEdit.appendChild(issuesSection);

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
    
    if (typeof ns.updateWorkViewStats === 'function') {
      ns.updateWorkViewStats();
    }
  };

  // Başlayabilir İmalatlar Paneli
  ns.renderReadyWorksPanel = function() {
    const { sideBody } = ns.dom || {};
    if (!sideBody) return;

    const sec = document.createElement('div');
    sec.className = 'side-section';

    // Başlık
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';

    const h = document.createElement('h3');
    h.style.margin = '0';
    h.style.color = '#3b82f6';
    h.textContent = '▷ Başlayabilir İmalatlar';
    header.appendChild(h);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#9ca3af';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.addEventListener('click', () => {
      ns.state.showReadyPanel = false;
      ns.state.sidePanelVisible = false;
      
      // Butonu untoggle et
      const { readyBtn } = ns.dom;
      if (readyBtn) readyBtn.classList.remove('toggle-active');
      
      ns.renderSidePanel();
    });
    header.appendChild(closeBtn);
    sec.appendChild(header);

    // Başlayabilir imalatları topla
    const readyItems = [];
    ns.state.hotspots.forEach(hs => {
      if (!hs.works) return;
      ALL_WORK_ITEMS.forEach(w => {
        const work = hs.works[w.id];
        if (work && work.status === 'baslayabilir') {
          readyItems.push({
            hotspot: hs,
            workItem: w,
            work: work
          });
        }
      });
    });

    if (readyItems.length === 0) {
      const empty = document.createElement('div');
      empty.style.textAlign = 'center';
      empty.style.padding = '20px';
      empty.style.color = '#6b7280';
      empty.textContent = 'Başlayabilir durumda imalat bulunmuyor.';
      sec.appendChild(empty);
    } else {
      // Sayaç
      const countDiv = document.createElement('div');
      countDiv.style.fontSize = '11px';
      countDiv.style.color = '#9ca3af';
      countDiv.style.marginBottom = '10px';
      countDiv.textContent = `Toplam ${readyItems.length} imalat başlayabilir durumda`;
      sec.appendChild(countDiv);

      // İmalat kartları
      readyItems.forEach(item => {
        const card = document.createElement('div');
        card.style.background = '#1f2937';
        card.style.border = '1px solid #3b82f6';
        card.style.borderRadius = '6px';
        card.style.padding = '10px';
        card.style.marginBottom = '8px';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          ns.state.showReadyPanel = false;
          ns.state.selectedIds = new Set([item.hotspot.id]);
          ns.state.highlightWorkTypeId = item.workItem.id;
          
          // Butonu untoggle et
          const { readyBtn } = ns.dom;
          if (readyBtn) readyBtn.classList.remove('toggle-active');
          
          ns.renderHotspots();
          ns.renderSidePanel();
        });

        // Blok adı
        const blockName = document.createElement('div');
        blockName.style.fontWeight = '600';
        blockName.style.fontSize = '12px';
        blockName.style.color = '#e5e7eb';
        blockName.style.marginBottom = '4px';
        blockName.textContent = ns.buildHotspotLabel(item.hotspot);
        card.appendChild(blockName);

        // İmalat adı
        const workName = document.createElement('div');
        workName.style.fontSize = '11px';
        workName.style.color = '#3b82f6';
        workName.style.display = 'flex';
        workName.style.alignItems = 'center';
        workName.style.gap = '4px';
        workName.innerHTML = `<span style="font-size: 14px;">▷</span> ${item.workItem.label}`;
        card.appendChild(workName);

        // Alt yüklenici varsa göster
        if (item.work.subcontractor && item.work.subcontractor.trim()) {
          const subDiv = document.createElement('div');
          subDiv.style.fontSize = '10px';
          subDiv.style.color = '#9ca3af';
          subDiv.style.marginTop = '4px';
          subDiv.textContent = `Alt yüklenici: ${item.work.subcontractor}`;
          card.appendChild(subDiv);
        }

        sec.appendChild(card);
      });
    }

    sideBody.appendChild(sec);
  };

  // Tüm İmalat Sorunları Paneli
  ns.renderAllIssuesPanel = function() {
    const { sideBody } = ns.dom || {};
    if (!sideBody) return;

    const sec = document.createElement('div');
    sec.className = 'side-section';

    // Başlık
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';

    const h = document.createElement('h3');
    h.style.margin = '0';
    h.style.color = '#ef4444';
    h.textContent = '⚠️ İmalat Sorunları';
    header.appendChild(h);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#9ca3af';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.addEventListener('click', () => {
      ns.state.showIssuesPanel = false;
      ns.state.sidePanelVisible = false;
      
      // Butonu untoggle et
      const { issuesBtn } = ns.dom;
      if (issuesBtn) issuesBtn.classList.remove('toggle-active');
      
      ns.renderSidePanel();
    });
    header.appendChild(closeBtn);
    sec.appendChild(header);

    // Filtre butonları
    const filterRow = document.createElement('div');
    filterRow.style.display = 'flex';
    filterRow.style.gap = '6px';
    filterRow.style.marginBottom = '10px';

    const filters = [
      { id: 'all', label: 'Tümü' },
      { id: 'open', label: 'Açık' },
      { id: 'closed', label: 'Kapalı' }
    ];

    let currentFilter = 'all';

    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.textContent = f.label;
      btn.style.fontSize = '11px';
      btn.style.padding = '4px 10px';
      btn.style.borderRadius = '999px';
      btn.style.border = '1px solid #4b5563';
      btn.style.background = f.id === currentFilter ? '#374151' : 'transparent';
      btn.style.color = '#e5e7eb';
      btn.style.cursor = 'pointer';
      btn.dataset.filter = f.id;
      btn.addEventListener('click', () => {
        currentFilter = f.id;
        filterRow.querySelectorAll('button').forEach(b => {
          b.style.background = b.dataset.filter === currentFilter ? '#374151' : 'transparent';
        });
        renderIssuesList();
      });
      filterRow.appendChild(btn);
    });
    sec.appendChild(filterRow);

    // Sorun listesi konteyneri
    const listContainer = document.createElement('div');
    listContainer.id = 'issuesListContainer';
    sec.appendChild(listContainer);

    function renderIssuesList() {
      listContainer.innerHTML = '';

      // Tüm sorunları topla
      const allIssues = [];
      ns.state.hotspots.forEach(hs => {
        if (!hs.issues || hs.issues.length === 0) return;
        hs.issues.forEach(issue => {
          allIssues.push({
            hotspot: hs,
            issue: issue
          });
        });
      });

      // Filtrele
      const filteredIssues = allIssues.filter(item => {
        if (currentFilter === 'all') return true;
        return item.issue.status === currentFilter;
      });

      // Tarihe göre sırala (en yeni önce)
      filteredIssues.sort((a, b) => {
        const dateA = a.issue.createdAt ? new Date(a.issue.createdAt) : new Date(a.issue.date || 0);
        const dateB = b.issue.createdAt ? new Date(b.issue.createdAt) : new Date(b.issue.date || 0);
        return dateB - dateA;
      });

      if (filteredIssues.length === 0) {
        const empty = document.createElement('div');
        empty.style.textAlign = 'center';
        empty.style.padding = '20px';
        empty.style.color = '#6b7280';
        empty.textContent = currentFilter === 'all' 
          ? 'Henüz imalat sorunu bulunmuyor.' 
          : `${currentFilter === 'open' ? 'Açık' : 'Kapalı'} sorun bulunmuyor.`;
        listContainer.appendChild(empty);
        return;
      }

      // Sayaçlar
      const openCount = allIssues.filter(i => i.issue.status === 'open').length;
      const closedCount = allIssues.filter(i => i.issue.status === 'closed').length;

      const countDiv = document.createElement('div');
      countDiv.style.fontSize = '11px';
      countDiv.style.color = '#9ca3af';
      countDiv.style.marginBottom = '10px';
      countDiv.style.display = 'flex';
      countDiv.style.gap = '12px';
      countDiv.innerHTML = `
        <span style="color: #ef4444;">● ${openCount} Açık</span>
        <span style="color: #22c55e;">● ${closedCount} Kapalı</span>
      `;
      listContainer.appendChild(countDiv);

      // Sorun kartları
      filteredIssues.forEach(item => {
        const card = document.createElement('div');
        card.style.background = '#1f2937';
        card.style.border = `1px solid ${item.issue.status === 'open' ? '#dc2626' : '#16a34a'}`;
        card.style.borderRadius = '6px';
        card.style.padding = '10px';
        card.style.marginBottom = '8px';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          ns.state.showIssuesPanel = false;
          ns.state.selectedIds = new Set([item.hotspot.id]);
          
          // Butonu untoggle et
          const { issuesBtn } = ns.dom;
          if (issuesBtn) issuesBtn.classList.remove('toggle-active');
          
          ns.renderHotspots();
          ns.renderSidePanel();
        });

        // Üst kısım - başlık ve durum
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'flex-start';
        topRow.style.marginBottom = '6px';

        const titleDiv = document.createElement('div');
        titleDiv.style.flex = '1';

        const issueTitle = document.createElement('div');
        issueTitle.style.fontWeight = '600';
        issueTitle.style.fontSize = '12px';
        issueTitle.style.color = '#e5e7eb';
        issueTitle.textContent = item.issue.title || 'Sorun';
        titleDiv.appendChild(issueTitle);

        const blockName = document.createElement('div');
        blockName.style.fontSize = '10px';
        blockName.style.color = '#9ca3af';
        blockName.style.marginTop = '2px';
        blockName.textContent = ns.buildHotspotLabel(item.hotspot);
        titleDiv.appendChild(blockName);

        topRow.appendChild(titleDiv);

        // Durum badge
        const statusBadge = document.createElement('span');
        statusBadge.style.fontSize = '10px';
        statusBadge.style.padding = '2px 6px';
        statusBadge.style.borderRadius = '3px';
        statusBadge.style.fontWeight = '500';
        if (item.issue.status === 'open') {
          statusBadge.style.background = '#dc2626';
          statusBadge.style.color = '#fff';
          statusBadge.textContent = 'Açık';
        } else {
          statusBadge.style.background = '#16a34a';
          statusBadge.style.color = '#fff';
          statusBadge.textContent = 'Kapalı';
        }
        topRow.appendChild(statusBadge);

        card.appendChild(topRow);

        // Açıklama
        if (item.issue.description && item.issue.description.trim()) {
          const descDiv = document.createElement('div');
          descDiv.style.fontSize = '11px';
          descDiv.style.color = '#d1d5db';
          descDiv.style.marginBottom = '6px';
          descDiv.style.overflow = 'hidden';
          descDiv.style.textOverflow = 'ellipsis';
          descDiv.style.whiteSpace = 'nowrap';
          descDiv.textContent = item.issue.description.trim();
          card.appendChild(descDiv);
        }

        // Meta bilgiler
        const metaDiv = document.createElement('div');
        metaDiv.style.fontSize = '10px';
        metaDiv.style.color = '#9ca3af';
        metaDiv.style.display = 'flex';
        metaDiv.style.gap = '8px';
        metaDiv.style.flexWrap = 'wrap';

        // Tarih
        if (item.issue.createdAt) {
          const createdDate = new Date(item.issue.createdAt);
          const dateStr = createdDate.toLocaleDateString('tr-TR');
          const timeStr = createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          const dateSpan = document.createElement('span');
          dateSpan.textContent = `📅 ${dateStr} ${timeStr}`;
          metaDiv.appendChild(dateSpan);
        } else if (item.issue.date) {
          const dateSpan = document.createElement('span');
          dateSpan.textContent = `📅 ${item.issue.date}`;
          metaDiv.appendChild(dateSpan);
        }

        // İmalat türü
        if (item.issue.workTypeId) {
          const workItem = ALL_WORK_ITEMS.find(w => w.id === item.issue.workTypeId);
          if (workItem) {
            const workSpan = document.createElement('span');
            workSpan.textContent = `🔧 ${workItem.label}`;
            metaDiv.appendChild(workSpan);
          }
        }

        // Öncelik
        if (item.issue.priority) {
          const prioritySpan = document.createElement('span');
          const priorityEmoji = item.issue.priority === 'high' ? '🔴' : item.issue.priority === 'medium' ? '🟡' : '🟢';
          prioritySpan.textContent = priorityEmoji;
          metaDiv.appendChild(prioritySpan);
        }

        // Fotoğraf sayısı
        if (item.issue.photos && item.issue.photos.length > 0) {
          const photoSpan = document.createElement('span');
          photoSpan.textContent = `📷 ${item.issue.photos.length}`;
          metaDiv.appendChild(photoSpan);
        }

        card.appendChild(metaDiv);
        listContainer.appendChild(card);
      });
    }

    renderIssuesList();
    sideBody.appendChild(sec);
  };
})(window.EPP = window.EPP || {});
