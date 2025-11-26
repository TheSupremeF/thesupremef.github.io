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
        descP.innerHTML = hs.description.trim(); // Render HTML formatting
        descP.style.fontSize = '12px';
        descP.style.marginBottom = '8px';
        descP.style.lineHeight = '1.5';
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
            issueDesc.style.lineHeight = '1.5';
            issueDesc.innerHTML = issue.description.trim(); // Render HTML formatting
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
          
          // Convert to NCR button
          const ncrButton = document.createElement('button');
          ncrButton.textContent = '📋 NCR\'a Dönüştür';
          ncrButton.style.marginTop = '8px';
          ncrButton.style.padding = '6px 12px';
          ncrButton.style.background = '#2563eb';
          ncrButton.style.color = '#fff';
          ncrButton.style.border = 'none';
          ncrButton.style.borderRadius = '4px';
          ncrButton.style.fontSize = '11px';
          ncrButton.style.cursor = 'pointer';
          ncrButton.style.width = '100%';
          ncrButton.addEventListener('click', () => {
            if (typeof ns.exportIssueToNcrExcel === 'function') {
              ns.exportIssueToNcrExcel(hs.id, issue.id);
            }
          });
          issueCard.appendChild(ncrButton);

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

    // DETAY GÖRSELLERİ - Collapsible Section
    const imagesSection = document.createElement('div');
    imagesSection.style.marginTop = '16px';
    imagesSection.style.border = '1px solid #374151';
    imagesSection.style.borderRadius = '6px';
    imagesSection.style.overflow = 'hidden';
    
    const imagesHeader = document.createElement('div');
    imagesHeader.style.display = 'flex';
    imagesHeader.style.justifyContent = 'space-between';
    imagesHeader.style.alignItems = 'center';
    imagesHeader.style.padding = '8px 10px';
    imagesHeader.style.background = '#1f2937';
    imagesHeader.style.cursor = 'pointer';
    imagesHeader.style.userSelect = 'none';
    
    const imagesTitle = document.createElement('span');
    imagesTitle.textContent = '📸 Detay Görselleri';
    imagesTitle.style.fontSize = '12px';
    imagesTitle.style.fontWeight = '600';
    imagesTitle.style.color = '#e5e7eb';
    
    const imagesToggle = document.createElement('span');
    imagesToggle.textContent = '▼';
    imagesToggle.style.fontSize = '10px';
    imagesToggle.style.color = '#9ca3af';
    imagesToggle.style.transition = 'transform 0.2s';
    
    imagesHeader.appendChild(imagesTitle);
    imagesHeader.appendChild(imagesToggle);
    
    const imagesContent = document.createElement('div');
    imagesContent.style.padding = '10px';
    imagesContent.style.background = '#111827';
    imagesContent.style.display = 'block'; // Start expanded
    
    imagesHeader.addEventListener('click', () => {
      const isHidden = imagesContent.style.display === 'none';
      imagesContent.style.display = isHidden ? 'block' : 'none';
      imagesToggle.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    });
    
    imagesSection.appendChild(imagesHeader);
    imagesSection.appendChild(imagesContent);
    secEdit.appendChild(imagesSection);

    if (!hs.detailImages) hs.detailImages = [];
    if (hs.detailImages.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Henüz detay görseli yok.';
      imagesContent.appendChild(hint);
    } else {
      hs.detailImages.forEach((img, idx) => {
        const imgRow = document.createElement('div');
        imgRow.style.marginBottom = '8px';
        imgRow.style.padding = '4px';
        imgRow.style.borderRadius = '4px';
        imgRow.style.background = '#1f2937';

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

        imagesContent.appendChild(imgRow);
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
      imagesContent.appendChild(addImgInput);
    } else {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Maksimum 4 görsel ekleyebilirsiniz.';
      imagesContent.appendChild(hint);
    }

    // GÜNLÜK PUANTAJ - Collapsible Section
    const dailySection = document.createElement('div');
    dailySection.style.marginTop = '16px';
    dailySection.style.border = '1px solid #374151';
    dailySection.style.borderRadius = '6px';
    dailySection.style.overflow = 'hidden';
    
    const dailyHeader = document.createElement('div');
    dailyHeader.style.display = 'flex';
    dailyHeader.style.justifyContent = 'space-between';
    dailyHeader.style.alignItems = 'center';
    dailyHeader.style.padding = '8px 10px';
    dailyHeader.style.background = '#1f2937';
    dailyHeader.style.cursor = 'pointer';
    dailyHeader.style.userSelect = 'none';
    
    const dailyTitle = document.createElement('span');
    dailyTitle.textContent = '📅 Günlük Puantaj';
    dailyTitle.style.fontSize = '12px';
    dailyTitle.style.fontWeight = '600';
    dailyTitle.style.color = '#e5e7eb';
    
    const dailyToggle = document.createElement('span');
    dailyToggle.textContent = '▼';
    dailyToggle.style.fontSize = '10px';
    dailyToggle.style.color = '#9ca3af';
    dailyToggle.style.transition = 'transform 0.2s';
    
    dailyHeader.appendChild(dailyTitle);
    dailyHeader.appendChild(dailyToggle);
    
    const dailyContent = document.createElement('div');
    dailyContent.style.padding = '10px';
    dailyContent.style.background = '#111827';
    dailyContent.style.display = 'none'; // Start collapsed
    
    dailyHeader.addEventListener('click', () => {
      const isHidden = dailyContent.style.display === 'none';
      dailyContent.style.display = isHidden ? 'block' : 'none';
      dailyToggle.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    });
    
    dailySection.appendChild(dailyHeader);
    dailySection.appendChild(dailyContent);
    secEdit.appendChild(dailySection);

    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Tarih seç:';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = ns.state.selectedDate || new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', () => {
      ns.state.selectedDate = dateInput.value;
      ns.renderSidePanel();
    });
    dailyContent.appendChild(dateLabel);
    dailyContent.appendChild(dateInput);

    const selectedDate = ns.state.selectedDate || new Date().toISOString().split('T')[0];

    const dailyHint = document.createElement('p');
    dailyHint.className = 'hint';
    dailyHint.textContent = 'Seçili tarih için imalat durumlarını girin:';
    dailyContent.appendChild(dailyHint);

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

    dailyContent.appendChild(secWorks);

    // İMALAT SORUNLARI BÖLÜMÜ (EDITOR MODE) - Collapsible
    const issuesSection = document.createElement('div');
    issuesSection.style.marginTop = '16px';
    issuesSection.style.border = '1px solid #374151';
    issuesSection.style.borderRadius = '6px';
    issuesSection.style.overflow = 'hidden';

    const issuesHeader = document.createElement('div');
    issuesHeader.style.display = 'flex';
    issuesHeader.style.justifyContent = 'space-between';
    issuesHeader.style.alignItems = 'center';
    issuesHeader.style.padding = '8px 10px';
    issuesHeader.style.background = '#1f2937';
    issuesHeader.style.cursor = 'pointer';
    issuesHeader.style.userSelect = 'none';

    const issuesTitle = document.createElement('span');
    issuesTitle.style.fontSize = '12px';
    issuesTitle.style.fontWeight = '600';
    issuesTitle.style.color = '#ef4444';
    issuesTitle.textContent = '⚠️ İMALAT SORUNLARI';
    
    const issuesToggle = document.createElement('span');
    issuesToggle.textContent = '▼';
    issuesToggle.style.fontSize = '10px';
    issuesToggle.style.color = '#9ca3af';
    issuesToggle.style.transition = 'transform 0.2s';
    issuesToggle.style.marginLeft = 'auto';
    issuesToggle.style.marginRight = '8px';
    
    issuesHeader.appendChild(issuesTitle);
    issuesHeader.appendChild(issuesToggle);

    const addIssueBtn = document.createElement('button');
    addIssueBtn.textContent = '+ Yeni Sorun';
    addIssueBtn.style.fontSize = '11px';
    addIssueBtn.style.padding = '4px 8px';
    addIssueBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent toggle when clicking add button
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
        photos: [],
        // NCR fields
        ncrType: 'STC',
        ncrNumber: 1,
        locationPattern: null, // Will be auto-selected to most detailed option
        controlEngineerName: '',
        controlEngineerDate: '',
        controlChiefName: '',
        controlChiefDate: ''
      });
      ns.pushHistory('addIssue');
      ns.renderSidePanel();
    });
    issuesHeader.appendChild(addIssueBtn);
    
    const issuesContent = document.createElement('div');
    issuesContent.style.padding = '10px';
    issuesContent.style.background = '#111827';
    issuesContent.style.display = 'block'; // Start expanded
    
    issuesHeader.addEventListener('click', (e) => {
      if (e.target !== addIssueBtn && !addIssueBtn.contains(e.target)) {
        const isHidden = issuesContent.style.display === 'none';
        issuesContent.style.display = isHidden ? 'block' : 'none';
        issuesToggle.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });

    issuesSection.appendChild(issuesHeader);
    issuesSection.appendChild(issuesContent);

    if (!hs.issues) hs.issues = [];

    if (hs.issues.length === 0) {
      const noIssues = document.createElement('div');
      noIssues.style.fontSize = '11px';
      noIssues.style.color = '#9ca3af';
      noIssues.style.textAlign = 'center';
      noIssues.style.padding = '8px';
      noIssues.textContent = 'Henüz sorun kaydı yok';
      issuesContent.appendChild(noIssues);
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

        // Açıklama - WYSIWYG Editor
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Açıklama';
        descLabel.style.fontSize = '10px';
        descLabel.style.fontWeight = '600';
        descLabel.style.color = '#d1d5db';
        descLabel.style.display = 'block';
        descLabel.style.marginBottom = '4px';
        issueCard.appendChild(descLabel);
        
        // WYSIWYG Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.gap = '4px';
        toolbar.style.marginBottom = '4px';
        toolbar.style.flexWrap = 'wrap';
        
        const createToolbarBtn = (label, command) => {
          const btn = document.createElement('button');
          btn.textContent = label;
          btn.type = 'button';
          btn.style.padding = '4px 8px';
          btn.style.fontSize = '10px';
          btn.style.background = '#374151';
          btn.style.color = '#e5e7eb';
          btn.style.border = '1px solid #4b5563';
          btn.style.borderRadius = '3px';
          btn.style.cursor = 'pointer';
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            document.execCommand(command, false, null);
            descEditor.focus();
          });
          return btn;
        };
        
        toolbar.appendChild(createToolbarBtn('B', 'bold'));
        toolbar.appendChild(createToolbarBtn('I', 'italic'));
        toolbar.appendChild(createToolbarBtn('• List', 'insertUnorderedList'));
        toolbar.appendChild(createToolbarBtn('1. List', 'insertOrderedList'));
        
        // Font size dropdown
        const fontSizeSelect = document.createElement('select');
        fontSizeSelect.style.padding = '4px';
        fontSizeSelect.style.fontSize = '10px';
        fontSizeSelect.style.background = '#374151';
        fontSizeSelect.style.color = '#e5e7eb';
        fontSizeSelect.style.border = '1px solid #4b5563';
        fontSizeSelect.style.borderRadius = '3px';
        fontSizeSelect.style.cursor = 'pointer';
        
        const fontSizes = [
          { label: '10pt', value: '10pt' },
          { label: '11pt', value: '11pt' },
          { label: '12pt', value: '12pt' },
          { label: '14pt', value: '14pt' },
          { label: '16pt', value: '16pt' }
        ];
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Font Size';
        fontSizeSelect.appendChild(defaultOption);
        
        fontSizes.forEach(size => {
          const opt = document.createElement('option');
          opt.value = size.value;
          opt.textContent = size.label;
          fontSizeSelect.appendChild(opt);
        });
        
        fontSizeSelect.addEventListener('change', (e) => {
          if (e.target.value) {
            // Apply font size to selection
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const span = document.createElement('span');
              span.style.fontSize = e.target.value;
              
              try {
                range.surroundContents(span);
              } catch (err) {
                // If selection spans multiple elements, use execCommand fallback
                document.execCommand('fontSize', false, '7');
                // Find the font tags and replace with span
                const fontTags = descEditor.querySelectorAll('font[size="7"]');
                fontTags.forEach(font => {
                  const newSpan = document.createElement('span');
                  newSpan.style.fontSize = e.target.value;
                  newSpan.innerHTML = font.innerHTML;
                  font.replaceWith(newSpan);
                });
              }
              
              issue.description = descEditor.innerHTML;
            }
            e.target.value = ''; // Reset dropdown
            descEditor.focus();
          }
        });
        
        toolbar.appendChild(fontSizeSelect);
        issueCard.appendChild(toolbar);
        
        // WYSIWYG Editor (contenteditable)
        const descEditor = document.createElement('div');
        descEditor.contentEditable = 'true';
        descEditor.innerHTML = issue.description || '';
        descEditor.style.minHeight = '80px';
        descEditor.style.width = '100%';
        descEditor.style.padding = '8px';
        descEditor.style.marginBottom = '6px';
        descEditor.style.background = '#111827';
        descEditor.style.color = '#e5e7eb';
        descEditor.style.border = '1px solid #374151';
        descEditor.style.borderRadius = '4px';
        descEditor.style.overflowY = 'auto';
        descEditor.style.fontSize = '11px';
        descEditor.style.lineHeight = '1.5';
        descEditor.addEventListener('input', () => {
          issue.description = descEditor.innerHTML;
        });
        descEditor.addEventListener('blur', () => {
          issue.description = descEditor.innerHTML;
        });
        // Prevent space from toggling pan mode
        descEditor.addEventListener('keydown', (e) => {
          e.stopPropagation();
        });
        descEditor.addEventListener('keyup', (e) => {
          e.stopPropagation();
        });
        descEditor.addEventListener('keypress', (e) => {
          e.stopPropagation();
        });
        issueCard.appendChild(descEditor);

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
        
        // NCR FIELDS SECTION
        const ncrSection = document.createElement('div');
        ncrSection.style.marginTop = '12px';
        ncrSection.style.padding = '8px';
        ncrSection.style.background = '#111827';
        ncrSection.style.borderRadius = '4px';
        ncrSection.style.border = '1px solid #374151';
        
        const ncrTitle = document.createElement('div');
        ncrTitle.style.fontSize = '11px';
        ncrTitle.style.fontWeight = '600';
        ncrTitle.style.marginBottom = '8px';
        ncrTitle.style.color = '#93c5fd';
        ncrTitle.textContent = '📋 NCR BİLGİLERİ';
        ncrSection.appendChild(ncrTitle);
        
        // NCR Type + Number row
        const ncrRow1 = document.createElement('div');
        ncrRow1.style.display = 'grid';
        ncrRow1.style.gridTemplateColumns = '2fr 1fr';
        ncrRow1.style.gap = '6px';
        ncrRow1.style.marginBottom = '6px';
        
        // NCR Type
        const ncrTypeDiv = document.createElement('div');
        const ncrTypeLabel = document.createElement('label');
        ncrTypeLabel.textContent = 'Uygunsuzluk Tipi';
        ncrTypeLabel.style.fontSize = '10px';
        ncrTypeLabel.style.fontWeight = '600';
        ncrTypeLabel.style.color = '#d1d5db';
        ncrTypeLabel.style.display = 'block';
        ncrTypeLabel.style.marginBottom = '2px';
        ncrTypeDiv.appendChild(ncrTypeLabel);
        const ncrTypeSelect = document.createElement('select');
        ncrTypeSelect.style.width = '100%';
        if (!ns.NCR_TYPES) {
          ns.NCR_TYPES = [
            { code: 'STC', label: 'Structural' },
            { code: 'ARC', label: 'Architectural' },
            { code: 'İSG', label: 'İş Güvenliği' },
            { code: 'ELK', label: 'Electrical' },
            { code: 'MEK', label: 'Mechanical' }
          ];
        }
        ns.NCR_TYPES.forEach(type => {
          const opt = document.createElement('option');
          opt.value = type.code;
          opt.textContent = type.label + ' (' + type.code + ')';
          ncrTypeSelect.appendChild(opt);
        });
        ncrTypeSelect.value = issue.ncrType || 'STC';
        ncrTypeSelect.addEventListener('change', () => {
          issue.ncrType = ncrTypeSelect.value;
        });
        ncrTypeDiv.appendChild(ncrTypeSelect);
        ncrRow1.appendChild(ncrTypeDiv);
        
        // NCR Number
        const ncrNumberDiv = document.createElement('div');
        const ncrNumberLabel = document.createElement('label');
        ncrNumberLabel.textContent = 'NCR No';
        ncrNumberLabel.style.fontSize = '10px';
        ncrNumberLabel.style.fontWeight = '600';
        ncrNumberLabel.style.color = '#d1d5db';
        ncrNumberLabel.style.display = 'block';
        ncrNumberLabel.style.marginBottom = '2px';
        ncrNumberDiv.appendChild(ncrNumberLabel);
        const ncrNumberInput = document.createElement('input');
        ncrNumberInput.type = 'number';
        ncrNumberInput.min = '1';
        ncrNumberInput.max = '999';
        ncrNumberInput.value = issue.ncrNumber || 1;
        ncrNumberInput.style.width = '100%';
        ncrNumberInput.addEventListener('input', () => {
          issue.ncrNumber = parseInt(ncrNumberInput.value) || 1;
        });
        ncrNumberDiv.appendChild(ncrNumberInput);
        ncrRow1.appendChild(ncrNumberDiv);
        
        ncrSection.appendChild(ncrRow1);
        
        // LOCATION PATTERN SECTION
        const locationLabel = document.createElement('label');
        locationLabel.textContent = 'Konum Bilgisi';
        locationLabel.style.fontSize = '10px';
        locationLabel.style.fontWeight = '600';
        locationLabel.style.color = '#d1d5db';
        locationLabel.style.display = 'block';
        locationLabel.style.marginTop = '6px';
        locationLabel.style.marginBottom = '2px';
        ncrSection.appendChild(locationLabel);
        
        const locationSelect = document.createElement('select');
        locationSelect.style.width = '100%';
        locationSelect.style.marginBottom = '6px';
        
        // Get allowed patterns based on ADA number (business rules)
        const allowedPatterns = ns.getAllowedLocationPatterns(hs.ada);
        const locationOptions = [];
        
        // Build options based on allowed patterns and available data
        allowedPatterns.forEach(patternId => {
          const pattern = ns.NCR_LOCATION_PATTERNS[patternId];
          if (!pattern) return;
          
          // Check if we have required data for this pattern
          const hasRequiredData = pattern.requires.every(field => {
            return hs[field] && String(hs[field]).trim() !== '';
          });
          
          if (hasRequiredData) {
            // Build dynamic label with actual values
            let label = pattern.label;
            label = label.replace('<X>', hs.ada || '');
            label = label.replace('<Y>', hs.parsel || '');
            label = label.replace('<BLOK>', hs.blok || '');
            label = label.replace('<BLOCK>', hs.blok || '');
            
            locationOptions.push({
              pattern: patternId,
              label: label
            });
          }
        });
        
        // If no location data, add default option
        if (locationOptions.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Konum bilgisi girilmemiş';
          locationSelect.appendChild(opt);
          locationSelect.disabled = true;
        } else {
          locationOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.pattern;
            opt.textContent = option.label;
            locationSelect.appendChild(opt);
          });
          
          // Set initial value or default to most detailed available
          if (!issue.locationPattern || !allowedPatterns.includes(issue.locationPattern)) {
            // Default to most detailed available pattern
            issue.locationPattern = locationOptions[locationOptions.length - 1].pattern;
          }
          locationSelect.value = issue.locationPattern;
          
          locationSelect.addEventListener('change', () => {
            issue.locationPattern = locationSelect.value;
          });
        }
        
        ncrSection.appendChild(locationSelect);
        
        // Control Engineer
        const engineerLabel = document.createElement('label');
        engineerLabel.textContent = 'Kontrol Mühendisi';
        engineerLabel.style.fontSize = '10px';
        engineerLabel.style.fontWeight = '600';
        engineerLabel.style.color = '#d1d5db';
        engineerLabel.style.display = 'block';
        engineerLabel.style.marginTop = '6px';
        engineerLabel.style.marginBottom = '2px';
        ncrSection.appendChild(engineerLabel);
        
        const engineerRow = document.createElement('div');
        engineerRow.style.display = 'grid';
        engineerRow.style.gridTemplateColumns = '2fr 1fr';
        engineerRow.style.gap = '6px';
        engineerRow.style.marginBottom = '6px';
        
        const engineerNameInput = document.createElement('input');
        engineerNameInput.type = 'text';
        engineerNameInput.placeholder = 'Adı Soyadı';
        engineerNameInput.value = issue.controlEngineerName || '';
        engineerNameInput.style.width = '100%';
        engineerNameInput.addEventListener('input', () => {
          issue.controlEngineerName = engineerNameInput.value;
        });
        engineerRow.appendChild(engineerNameInput);
        
        const engineerDateInput = document.createElement('input');
        engineerDateInput.type = 'date';
        engineerDateInput.value = issue.controlEngineerDate || '';
        engineerDateInput.style.width = '100%';
        engineerDateInput.addEventListener('change', () => {
          issue.controlEngineerDate = engineerDateInput.value;
        });
        engineerRow.appendChild(engineerDateInput);
        
        ncrSection.appendChild(engineerRow);
        
        // Control Chief
        const chiefLabel = document.createElement('label');
        chiefLabel.textContent = 'Kontrol Şefi';
        chiefLabel.style.fontSize = '10px';
        chiefLabel.style.fontWeight = '600';
        chiefLabel.style.color = '#d1d5db';
        chiefLabel.style.display = 'block';
        chiefLabel.style.marginBottom = '2px';
        ncrSection.appendChild(chiefLabel);
        
        const chiefRow = document.createElement('div');
        chiefRow.style.display = 'grid';
        chiefRow.style.gridTemplateColumns = '2fr 1fr';
        chiefRow.style.gap = '6px';
        chiefRow.style.marginBottom = '6px';
        
        const chiefNameInput = document.createElement('input');
        chiefNameInput.type = 'text';
        chiefNameInput.placeholder = 'Adı Soyadı';
        chiefNameInput.value = issue.controlChiefName || '';
        chiefNameInput.style.width = '100%';
        chiefNameInput.addEventListener('input', () => {
          issue.controlChiefName = chiefNameInput.value;
        });
        chiefRow.appendChild(chiefNameInput);
        
        const chiefDateInput = document.createElement('input');
        chiefDateInput.type = 'date';
        chiefDateInput.value = issue.controlChiefDate || '';
        chiefDateInput.style.width = '100%';
        chiefDateInput.addEventListener('change', () => {
          issue.controlChiefDate = chiefDateInput.value;
        });
        chiefRow.appendChild(chiefDateInput);
        
        ncrSection.appendChild(chiefRow);
        
        // Convert to NCR button
        const ncrExportBtn = document.createElement('button');
        ncrExportBtn.textContent = '📋 NCR\'a Dönüştür ve Excel\'e Aktar';
        ncrExportBtn.style.width = '100%';
        ncrExportBtn.style.padding = '6px 12px';
        ncrExportBtn.style.fontSize = '11px';
        ncrExportBtn.style.background = '#2563eb';
        ncrExportBtn.style.color = '#fff';
        ncrExportBtn.style.border = 'none';
        ncrExportBtn.style.borderRadius = '4px';
        ncrExportBtn.style.cursor = 'pointer';
        ncrExportBtn.style.marginTop = '4px';
        ncrExportBtn.addEventListener('click', () => {
          if (typeof ns.exportIssueToNcrExcel === 'function') {
            ns.exportIssueToNcrExcel(hs.id, issue.id);
          }
        });
        ncrSection.appendChild(ncrExportBtn);
        
        issueCard.appendChild(ncrSection);

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

        issuesContent.appendChild(issueCard);
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

    // Başlayabilir imalatları imalat türüne göre grupla
    const readyByWorkType = {};
    
    ns.state.hotspots.forEach(hs => {
      if (!hs.works) return;
      ALL_WORK_ITEMS.forEach(w => {
        const work = hs.works[w.id];
        if (work && work.status === 'baslayabilir') {
          if (!readyByWorkType[w.id]) {
            readyByWorkType[w.id] = {
              workItem: w,
              items: []
            };
          }
          readyByWorkType[w.id].items.push({
            hotspot: hs,
            work: work
          });
        }
      });
    });

    const workTypeIds = Object.keys(readyByWorkType);
    
    // WORK_GROUPS sıralamasına göre sırala
    const sortedWorkTypeIds = ALL_WORK_ITEMS
      .map(w => w.id)
      .filter(id => workTypeIds.includes(id));
    
    if (sortedWorkTypeIds.length === 0) {
      const empty = document.createElement('div');
      empty.style.textAlign = 'center';
      empty.style.padding = '20px';
      empty.style.color = '#6b7280';
      empty.textContent = 'Başlayabilir durumda imalat bulunmuyor.';
      sec.appendChild(empty);
    } else {
      // Toplam sayaç
      let totalCount = 0;
      sortedWorkTypeIds.forEach(id => {
        totalCount += readyByWorkType[id].items.length;
      });
      
      const countDiv = document.createElement('div');
      countDiv.style.fontSize = '11px';
      countDiv.style.color = '#9ca3af';
      countDiv.style.marginBottom = '10px';
      countDiv.textContent = `Toplam ${totalCount} imalat, ${sortedWorkTypeIds.length} kalemde başlayabilir durumda`;
      sec.appendChild(countDiv);

      // Her imalat türü için grup oluştur
      sortedWorkTypeIds.forEach(workTypeId => {
        const group = readyByWorkType[workTypeId];
        
        // Grup başlığı
        const groupHeader = document.createElement('div');
        groupHeader.style.background = '#1e3a5f';
        groupHeader.style.border = '1px solid #3b82f6';
        groupHeader.style.borderRadius = '6px';
        groupHeader.style.padding = '8px 10px';
        groupHeader.style.marginBottom = '6px';
        groupHeader.style.display = 'flex';
        groupHeader.style.justifyContent = 'space-between';
        groupHeader.style.alignItems = 'center';
        
        const groupTitle = document.createElement('div');
        groupTitle.style.fontWeight = '600';
        groupTitle.style.fontSize = '12px';
        groupTitle.style.color = '#93c5fd';
        groupTitle.innerHTML = `▷ ${group.workItem.label}`;
        groupHeader.appendChild(groupTitle);
        
        // Sağ taraf: Excel butonu + blok sayısı
        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.alignItems = 'center';
        rightSide.style.gap = '8px';
        
        // Excel export butonu
        const excelBtn = document.createElement('button');
        excelBtn.innerHTML = '📥';
        excelBtn.style.background = '#16a34a';
        excelBtn.style.border = 'none';
        excelBtn.style.color = '#fff';
        excelBtn.style.padding = '2px 6px';
        excelBtn.style.borderRadius = '4px';
        excelBtn.style.cursor = 'pointer';
        excelBtn.style.fontSize = '12px';
        excelBtn.title = 'Excel\'e Aktar';
        excelBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          
          if (typeof XLSXPatcher === 'undefined') {
            alert('XLSXPatcher yüklenemedi.');
            return;
          }
          
          try {
            // Template'i yükle
            const response = await fetch('./data/baslayabilir.xlsx');
            if (!response.ok) {
              throw new Error('Şablon yüklenemedi (HTTP ' + response.status + ')');
            }
            
            const templateBlob = await response.blob();
            
            // Blokları sırala
            const sortedItems = [...group.items].sort((a, b) => {
              const aLabel = ns.buildHotspotLabel(a.hotspot);
              const bLabel = ns.buildHotspotLabel(b.hotspot);
              return aLabel.localeCompare(bLabel, 'tr');
            });
            
            // Data hazırla
            const data = sortedItems.map(item => ({
              ADA: parseInt(item.hotspot.ada) || 0,
              PARSEL: parseInt(item.hotspot.parsel) || 0,
              blokAdi: item.hotspot.blok || ''
            }));
            
            // Header bilgileri
            const headerInfo = {
              projectName: ns.state.projectInfo?.name || '<PROJE ADI>',
              date: new Date(),
              imalatTuru: group.workItem.label.toUpperCase()
            };
            
            // Patch
            const patcher = new XLSXPatcher();
            const blob = await patcher.patch(templateBlob, data, headerInfo);
            
            // İndir
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Baslayabilir_${group.workItem.id}_${dd}${mm}${yyyy}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
          } catch (err) {
            console.error('Excel export hatası:', err);
            alert('Excel oluşturulamadı.\n\nHata: ' + err.message);
          }
        });
        rightSide.appendChild(excelBtn);
        
        const groupCount = document.createElement('span');
        groupCount.style.fontSize = '11px';
        groupCount.style.color = '#60a5fa';
        groupCount.style.background = 'rgba(59, 130, 246, 0.2)';
        groupCount.style.padding = '2px 8px';
        groupCount.style.borderRadius = '999px';
        groupCount.textContent = `${group.items.length} blok`;
        rightSide.appendChild(groupCount);
        
        groupHeader.appendChild(rightSide);
        
        sec.appendChild(groupHeader);
        
        // Blokları ada, parsel, blok sırasına göre sırala
        group.items.sort((a, b) => {
          const aLabel = ns.buildHotspotLabel(a.hotspot);
          const bLabel = ns.buildHotspotLabel(b.hotspot);
          return aLabel.localeCompare(bLabel, 'tr');
        });
        
        // Blok listesi container
        const itemsContainer = document.createElement('div');
        itemsContainer.style.marginBottom = '12px';
        itemsContainer.style.paddingLeft = '8px';
        
        // Blok kartları
        group.items.forEach(item => {
          const card = document.createElement('div');
          card.style.background = '#1f2937';
          card.style.border = '1px solid #374151';
          card.style.borderLeft = '3px solid #3b82f6';
          card.style.borderRadius = '4px';
          card.style.padding = '8px 10px';
          card.style.marginBottom = '4px';
          card.style.cursor = 'pointer';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          
          card.addEventListener('click', () => {
            ns.state.showReadyPanel = false;
            ns.state.selectedIds = new Set([item.hotspot.id]);
            ns.state.highlightWorkTypeId = group.workItem.id;
            
            // Butonu untoggle et
            const { readyBtn } = ns.dom;
            if (readyBtn) readyBtn.classList.remove('toggle-active');
            
            ns.renderHotspots();
            ns.renderSidePanel();
          });

          // Blok adı
          const blockName = document.createElement('div');
          blockName.style.fontSize = '12px';
          blockName.style.color = '#e5e7eb';
          blockName.textContent = ns.buildHotspotLabel(item.hotspot);
          card.appendChild(blockName);

          // Alt yüklenici varsa göster
          if (item.work.subcontractor && item.work.subcontractor.trim()) {
            const subDiv = document.createElement('div');
            subDiv.style.fontSize = '10px';
            subDiv.style.color = '#9ca3af';
            subDiv.textContent = item.work.subcontractor.trim();
            card.appendChild(subDiv);
          }

          itemsContainer.appendChild(card);
        });
        
        sec.appendChild(itemsContainer);
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
          descDiv.style.display = '-webkit-box';
          descDiv.style.webkitLineClamp = '2'; // Show max 2 lines
          descDiv.style.webkitBoxOrient = 'vertical';
          descDiv.style.lineHeight = '1.5';
          descDiv.innerHTML = item.issue.description.trim(); // Render HTML formatting
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
        
        // Convert to NCR button
        const ncrButton = document.createElement('button');
        ncrButton.textContent = '📋 NCR\'a Dönüştür';
        ncrButton.style.marginTop = '8px';
        ncrButton.style.padding = '6px 12px';
        ncrButton.style.background = '#2563eb';
        ncrButton.style.color = '#fff';
        ncrButton.style.border = 'none';
        ncrButton.style.borderRadius = '4px';
        ncrButton.style.fontSize = '11px';
        ncrButton.style.cursor = 'pointer';
        ncrButton.style.width = '100%';
        ncrButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent card click
          if (typeof ns.exportIssueToNcrExcel === 'function') {
            ns.exportIssueToNcrExcel(item.hotspot.id, item.issue.id);
          }
        });
        card.appendChild(ncrButton);
        
        listContainer.appendChild(card);
      });
    }

    renderIssuesList();
    sideBody.appendChild(sec);
  };
})(window.EPP = window.EPP || {});
