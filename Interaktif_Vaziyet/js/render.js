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
  };

  ns.openDetailImageModal = function(src) {
    const { detailImageOverlay, detailImageLarge } = ns.dom || {};
    if (!detailImageOverlay || !detailImageLarge) return;
    detailImageLarge.src = src;
    detailImageOverlay.style.display = 'flex';
  };

  ns.renderSummaryPanel = function() {
    const { sideBody } = ns.dom || {};
    if (!sideBody) return;

    const sec = document.createElement('div');
    sec.className = 'side-section';
    const h = document.createElement('h3');
    h.textContent = 'Toplam kişi sayıları';
    sec.appendChild(h);

    let any = false;
    let globalTotal = 0;

    WORK_GROUPS.forEach(group => {
      let groupHas = false;
      group.items.forEach(w => {
        let total = 0;
        ns.state.hotspots.forEach(hs => {
          if (!hs.works) return;
          const item = hs.works[w.id];
          if (!item) return;
          const n = typeof item.workers === 'number' ? item.workers : 0;
          if (!isNaN(n)) total += n;
        });
        if (total > 0) {
          if (!groupHas) {
            const gh = document.createElement('p');
            gh.style.fontWeight = '600';
            gh.style.margin = '4px 0 2px 0';
            gh.style.fontSize = '12px';
            gh.textContent = group.label;
            sec.appendChild(gh);
            groupHas = true;
          }
          any = true;
          globalTotal += total;
          const row = document.createElement('p');
          row.textContent = `${w.label}: ${total} kişi`;
          sec.appendChild(row);
        }
      });
    });

    if (!any) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Herhangi bir imalat türü için kişi sayısı girilmemiş.';
      sec.appendChild(p);
    }

    if (globalTotal > 0) {
      const totalP = document.createElement('p');
      totalP.style.marginTop = '6px';
      totalP.style.fontWeight = '600';
      totalP.textContent = `Genel toplam: ${globalTotal} kişi`;
      sec.appendChild(totalP);
    }

    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Kişi sayıları tüm hotspotlar (bloklar) üzerinden toplanmıştır.';
    sec.appendChild(hint);

    sideBody.appendChild(sec);
  };

  ns.renderSidePanel = function() {
    const { asideEl, sideBody } = ns.dom || {};
    if (!asideEl || !sideBody) return;

    if (!ns.state.sidePanelVisible) {
      asideEl.style.display = 'none';
      sideBody.innerHTML = '';
      return;
    }

    asideEl.style.display = 'flex';
    sideBody.innerHTML = '';

    if (ns.state.showSummary) {
      ns.renderSummaryPanel();
      return;
    }

    const ids = Array.from(ns.state.selectedIds);
    const selected = ids.map(ns.getHotspot).filter(Boolean);

    if (ns.state.mode === 'viewer') {
      if (!selected.length) {
        ns.state.sidePanelVisible = false;
        asideEl.style.display = 'none';
        return;
      }
      const sec = document.createElement('div');
      sec.className = 'side-section';
      const h = document.createElement('h3');
      h.textContent = 'Blok detayları';
      sec.appendChild(h);

      const hs = selected[0];
      hs.works = ns.createDefaultWorks(hs.works);

      const title = document.createElement('p');
      title.innerHTML = `<strong>${ns.buildHotspotLabel(hs)}</strong>`;
      sec.appendChild(title);

      const loc = document.createElement('p');
      loc.textContent = `Ada: ${hs.ada || '-'} · Parsel: ${hs.parsel || '-'}`;
      sec.appendChild(loc);

      const worksTitle = document.createElement('h3');
      worksTitle.textContent = 'İmalat durumları';
      sec.appendChild(worksTitle);

      let hasAny = false;

      WORK_GROUPS.forEach(group => {
        let groupHas = false;
        group.items.forEach(w => {
          const item = hs.works[w.id];
          if (!item) return;
          const status = item.status || 'baslamadi';
          const workers = typeof item.workers === 'number' ? item.workers : 0;
          const subcontractor = item.subcontractor || '';
          const hasActivity =
            status !== 'baslamadi' ||
            workers > 0 ||
            (subcontractor && subcontractor.trim() !== '');
          if (!hasActivity) return;

          if (!groupHas) {
            const gh = document.createElement('p');
            gh.style.fontWeight = '600';
            gh.style.fontSize = '12px';
            gh.style.margin = '6px 0 2px 0';
            gh.textContent = group.label;
            sec.appendChild(gh);
            groupHas = true;
          }

          hasAny = true;

          const row = document.createElement('div');
          const cls = ns.workStatusClass(status);
          row.className = 'status-pill ' + cls;

          const statusLabel = ns.statusTextTr(status);
          const itemsTop = [];
          itemsTop.push(w.label);
          itemsTop.push(statusLabel);
          if (workers > 0) {
            itemsTop.push(`${workers} kişi`);
          }

          let topRowHtml = '';
          itemsTop.forEach((txt, idx) => {
            if (idx > 0) {
              topRowHtml += `<span class="separator">·</span>`;
            }
            topRowHtml += `<span>${txt}</span>`;
          });

          const hasSub = subcontractor && subcontractor.trim() !== '';
          const bottomRowHtml = hasSub
            ? `<div class="bottom-row">Alt Yüklenici: ${subcontractor.trim()}</div>`
            : '';

          row.innerHTML =
            `<span class="indicator">${ns.workStatusIcon(status)}</span>` +
            `<div class="info-wrapper">` +
              `<div class="top-row">${topRowHtml}</div>` +
              bottomRowHtml +
            `</div>`;

          sec.appendChild(row);
        });
      });

      if (!hasAny) {
        const p = document.createElement('p');
        p.className = 'hint';
        p.textContent = 'Bu blok için henüz imalat bilgisi girilmemiş.';
        sec.appendChild(p);
      }

      if (hs.detailImageUrl) {
        const img = document.createElement('img');
        img.src = hs.detailImageUrl;
        img.className = 'thumb';
        img.addEventListener('click', () => ns.openDetailImageModal(hs.detailImageUrl));
        sec.appendChild(img);
      }

      if (hs.description) {
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Açıklama';
        sec.appendChild(descLabel);
        const desc = document.createElement('p');
        desc.textContent = hs.description;
        sec.appendChild(desc);
      }

      sideBody.appendChild(sec);
      return;
    }

    const secPlan = document.createElement('div');
    secPlan.className = 'side-section';
    const hPlan = document.createElement('h3');
    hPlan.textContent = 'Plan';
    secPlan.appendChild(hPlan);

    const pInfo = document.createElement('p');
    pInfo.innerHTML = ns.state.mainImageUrl
      ? 'Ana görsel yüklendi.'
      : 'Ana görsel yok. Araç çubuğundaki ana görsel ikonundan yükleyin.';
    secPlan.appendChild(pInfo);

    if (ns.state.projectInfo && (ns.state.projectInfo.name || ns.state.projectInfo.contractor)) {
      if (ns.state.projectInfo.name) {
        const pName = document.createElement('p');
        pName.textContent = ns.state.projectInfo.name;
        secPlan.appendChild(pName);
      }
      if (ns.state.projectInfo.contractor) {
        const pContr = document.createElement('p');
        pContr.textContent = 'Yüklenici: ' + ns.state.projectInfo.contractor;
        secPlan.appendChild(pContr);
      }
    }

    if (ns.state.lastExportAt) {
      const pExp = document.createElement('p');
      pExp.className = 'hint';
      pExp.textContent = 'Son EPP kaydı: ' + formatDateTime(ns.state.lastExportAt);
      secPlan.appendChild(pExp);
    }

    sideBody.appendChild(secPlan);

    const secList = document.createElement('div');
    secList.className = 'side-section';
    const hList = document.createElement('h3');
    hList.textContent = `Hotspotlar (${ns.state.hotspots.length})`;
    secList.appendChild(hList);

    ns.state.hotspots.forEach(hs => {
      const item = document.createElement('div');
      item.className = 'hotspot-list-item' + (ns.state.selectedIds.has(hs.id) ? ' active' : '');
      item.textContent = ns.buildHotspotLabel(hs);
      item.title = ns.buildHotspotLabel(hs);
      item.addEventListener('click', () => {
        ns.state.selectedIds = new Set([hs.id]);
        ns.state.showSummary = false;
        ns.state.sidePanelVisible = true;
        ns.renderHotspots();
        ns.renderSidePanel();
      });
      secList.appendChild(item);
    });

    sideBody.appendChild(secList);

    const hs = selected[0];
    const secEdit = document.createElement('div');
    secEdit.className = 'side-section';
    const hEdit = document.createElement('h3');
    hEdit.textContent = 'Hotspot detayları';
    secEdit.appendChild(hEdit);

    if (!hs) {
      const p = document.createElement('p');
      p.textContent = 'Düzenlemek için bir hotspot seçin.';
      secEdit.appendChild(p);
      sideBody.appendChild(secEdit);
      return;
    }

    hs.works = ns.createDefaultWorks(hs.works);

    const idp = document.createElement('p');
    idp.textContent = `ID: ${hs.id}`;
    secEdit.appendChild(idp);

    const imgLbl = document.createElement('label');
    imgLbl.textContent = 'Detay görseli';
    secEdit.appendChild(imgLbl);
    if (hs.detailImageUrl) {
      const img = document.createElement('img');
      img.src = hs.detailImageUrl;
      img.className = 'thumb';
      img.addEventListener('click', () => ns.openDetailImageModal(hs.detailImageUrl));
      secEdit.appendChild(img);
    }
    const detailInput = document.createElement('input');
    detailInput.type = 'file';
    detailInput.accept = 'image/*';
    detailInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        hs.detailImageUrl = ev.target.result;
        ns.renderSidePanel();
      };
      reader.readAsDataURL(file);
    });
    secEdit.appendChild(detailInput);

    function makeTextField(labelText, key) {
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = hs[key] || '';
      input.addEventListener('input', () => {
        hs[key] = input.value;
        ns.renderHotspots();
      });
      secEdit.appendChild(label);
      secEdit.appendChild(input);
    }

    makeTextField('Ada', 'ada');
    makeTextField('Parsel', 'parsel');
    makeTextField('Blok', 'blok');

    const labelDesc = document.createElement('label');
    labelDesc.textContent = 'Açıklama';
    const ta = document.createElement('textarea');
    ta.value = hs.description || '';
    ta.addEventListener('input', () => {
      hs.description = ta.value;
    });
    secEdit.appendChild(labelDesc);
    secEdit.appendChild(ta);

    const secWorks = document.createElement('div');
    secWorks.className = 'side-section';
    const hWorks = document.createElement('h3');
    hWorks.textContent = 'İmalat durumları';
    secWorks.appendChild(hWorks);

    WORK_GROUPS.forEach(group => {
      const gh = document.createElement('p');
      gh.style.fontWeight = '600';
      gh.style.fontSize = '12px';
      gh.style.margin = '6px 0 2px 0';
      gh.textContent = group.label;
      secWorks.appendChild(gh);

      group.items.forEach(w => {
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
        select.value = item.status || 'baslamadi';
        select.addEventListener('change', () => {
          hs.works[w.id].status = select.value;
          ns.renderHotspots();
        });

        const workersInput = document.createElement('input');
        workersInput.type = 'number';
        workersInput.min = '0';
        workersInput.value =
          typeof item.workers === 'number' && !isNaN(item.workers) ? item.workers : 0;
        workersInput.addEventListener('input', () => {
          const val = parseInt(workersInput.value, 10);
          hs.works[w.id].workers = isNaN(val) ? 0 : val;
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

    const styleLabel = document.createElement('h3');
    styleLabel.textContent = 'Stil';
    styleLabel.style.marginTop = '8px';
    secEdit.appendChild(styleLabel);

    const fillColorLabel = document.createElement('label');
    fillColorLabel.textContent = 'Dolgu rengi';
    const fillColorInput = document.createElement('input');
    fillColorInput.type = 'color';
    fillColorInput.value = hs.fillColor || '#2563eb';
    fillColorInput.addEventListener('input', () => {
      hs.fillColor = fillColorInput.value || '#2563eb';
      ns.renderHotspots();
    });
    secEdit.appendChild(fillColorLabel);
    secEdit.appendChild(fillColorInput);

    const fillOpacityLabel = document.createElement('label');
    fillOpacityLabel.textContent = 'Dolgu opaklığı';
    const fillOpacityRow = document.createElement('div');
    fillOpacityRow.className = 'inline-row';
    const fillOpacityInput = document.createElement('input');
    fillOpacityInput.type = 'range';
    fillOpacityInput.min = '0.05';
    fillOpacityInput.max = '1';
    fillOpacityInput.step = '0.05';
    const fOp = typeof hs.fillOpacity === 'number' ? hs.fillOpacity : 0.2;
    fillOpacityInput.value = fOp;
    const fillOpacityText = document.createElement('span');
    fillOpacityText.textContent = Math.round(fOp * 100) + '%';
    fillOpacityInput.addEventListener('input', () => {
      const v = parseFloat(fillOpacityInput.value);
      hs.fillOpacity = isNaN(v) ? 0.2 : v;
      fillOpacityText.textContent = Math.round(hs.fillOpacity * 100) + '%';
      ns.renderHotspots();
    });
    fillOpacityRow.appendChild(fillOpacityInput);
    fillOpacityRow.appendChild(fillOpacityText);
    secEdit.appendChild(fillOpacityLabel);
    secEdit.appendChild(fillOpacityRow);

    const borderColorLabel = document.createElement('label');
    borderColorLabel.textContent = 'Kenarlık rengi';
    const borderColorInput = document.createElement('input');
    borderColorInput.type = 'color';
    borderColorInput.value = hs.borderColor || hs.fillColor || '#60a5fa';
    borderColorInput.addEventListener('input', () => {
      hs.borderColor = borderColorInput.value || hs.fillColor || '#60a5fa';
      ns.renderHotspots();
    });
    secEdit.appendChild(borderColorLabel);
    secEdit.appendChild(borderColorInput);

    const borderOpacityLabel = document.createElement('label');
    borderOpacityLabel.textContent = 'Kenarlık opaklığı';
    const borderOpacityRow = document.createElement('div');
    borderOpacityRow.className = 'inline-row';
    const borderOpacityInput = document.createElement('input');
    borderOpacityInput.type = 'range';
    borderOpacityInput.min = '0';
    borderOpacityInput.max = '1';
    borderOpacityInput.step = '0.05';
    const bOp = typeof hs.borderOpacity === 'number' ? hs.borderOpacity : 1;
    borderOpacityInput.value = bOp;
    const borderOpacityText = document.createElement('span');
    borderOpacityText.textContent = Math.round(bOp * 100) + '%';
    borderOpacityInput.addEventListener('input', () => {
      const v = parseFloat(borderOpacityInput.value);
      hs.borderOpacity = isNaN(v) ? 1 : v;
      borderOpacityText.textContent = Math.round(hs.borderOpacity * 100) + '%';
      ns.renderHotspots();
    });
    borderOpacityRow.appendChild(borderOpacityInput);
    borderOpacityRow.appendChild(borderOpacityText);
    secEdit.appendChild(borderOpacityLabel);
    secEdit.appendChild(borderOpacityRow);

    const hoverLabel = document.createElement('label');
    hoverLabel.textContent = 'Üzerine gelince parlama';
    const hoverRow = document.createElement('div');
    hoverRow.className = 'inline-row';
    const hoverInput = document.createElement('input');
    hoverInput.type = 'checkbox';
    hoverInput.checked = hs.hoverGlow !== false;
    hoverInput.addEventListener('change', () => {
      hs.hoverGlow = hoverInput.checked;
      ns.renderHotspots();
    });
    const hoverText = document.createElement('span');
    hoverText.textContent = 'Hover vurgusu';
    hoverRow.appendChild(hoverInput);
    hoverRow.appendChild(hoverText);
    secEdit.appendChild(hoverLabel);
    secEdit.appendChild(hoverRow);

    const btnRow = document.createElement('div');
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Hotspot sil';
    delBtn.className = 'danger';
    delBtn.addEventListener('click', () => {
      if (!confirm('Seçili hotspot(lar) silinsin mi?')) return;
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
    hint.textContent = 'Shift+klik: çoklu seçim · İçini sürükle: taşı · Köşeler: yeniden boyutlandır · Klavyede Delete: seçili hotspot sil.';
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
    const { mainImageWrapper, addHotspotBtn, passwordSettingsBtn, projectInfoBtn } = ns.dom || {};
    if (mainImageWrapper) {
      mainImageWrapper.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (addHotspotBtn) {
      addHotspotBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (passwordSettingsBtn) {
      passwordSettingsBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (projectInfoBtn) {
      projectInfoBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    ns.renderHotspots();
    ns.renderSidePanel();
  };
})(window.EPP = window.EPP || {});
