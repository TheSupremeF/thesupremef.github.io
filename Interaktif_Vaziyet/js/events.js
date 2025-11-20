(function(ns){
  const { WORK_GROUPS, ALL_WORK_ITEMS } = ns;
  const {
    dataUrlToParts,
    mimeToExt,
    sanitizeFilename,
    formatDateTime,
    readPin,
    setPin,
    clearPin,
    focusFirstPin,
    setupPinAutoAdvance,
    snapPercent
  } = ns.utils;

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
      addHotspotBtn: document.getElementById('addHotspotBtn'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importInput: document.getElementById('importInput'),
      panModeBtn: document.getElementById('panModeBtn'),
      labelsBtn: document.getElementById('labelsBtn'),
      summaryBtn: document.getElementById('summaryBtn'),
      lastExportLabel: document.getElementById('lastExportLabel'),
      workViewSelect: document.getElementById('workViewSelect'),
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
      projectInfoSave: document.getElementById('projectInfoSave')
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
    });
  }

  function wireOverlays() {
    const { aboutBtn, aboutOverlay, detailImageOverlay, detailImageLarge } = ns.dom;

    if (aboutBtn && aboutOverlay) {
      aboutBtn.addEventListener('click', () => {
        aboutOverlay.style.display = 'flex';
      });
      aboutOverlay.addEventListener('click', e => {
        if (e.target === aboutOverlay) {
          aboutOverlay.style.display = 'none';
        }
      });
    }

    if (detailImageOverlay && detailImageLarge) {
      detailImageOverlay.addEventListener('click', e => {
        if (e.target === detailImageOverlay) {
          detailImageOverlay.style.display = 'none';
          detailImageLarge.src = '';
        }
      });
    }
  }

  function wirePasswordOverlays() {
    const {
      passwordSettingsBtn, passwordSettingsOverlay, passwordSettingsPin,
      passwordSettingsSave, passwordSettingsCancel,
      passwordPromptOverlay, passwordPromptPin,
      passwordPromptOk, passwordPromptCancel
    } = ns.dom;

    setupPinAutoAdvance(passwordSettingsPin);
    setupPinAutoAdvance(passwordPromptPin);

    let pendingModeAfterPassword = null;

    function openPasswordPrompt() {
      if (!passwordPromptOverlay || !passwordPromptPin) {
        const entered = window.prompt("Düzenleme PIN'ini girin:") || '';
        if (entered === ns.state.editorPassword) {
          ns.state.editorUnlocked = true;
          if (pendingModeAfterPassword) {
            ns.applyMode(pendingModeAfterPassword);
            pendingModeAfterPassword = null;
          }
        } else if (entered !== null) {
          alert('PIN hatalı.');
          pendingModeAfterPassword = null;
        }
        return;
      }
      clearPin(passwordPromptPin);
      passwordPromptOverlay.style.display = 'flex';
      setTimeout(() => focusFirstPin(passwordPromptPin), 10);
    }

    if (ns.dom.modeToggle) {
      ns.dom.modeToggle.addEventListener('click', e => {
        const btn = e.target.closest('button[data-mode]');
        if (!btn) return;
        const targetMode = btn.dataset.mode;
        if (!targetMode || targetMode === ns.state.mode) return;

        if (targetMode === 'viewer') {
          ns.applyMode('viewer');
          return;
        }

        if (targetMode === 'editor') {
          if (ns.state.editorPassword && !ns.state.editorUnlocked) {
            pendingModeAfterPassword = 'editor';
            openPasswordPrompt();
          } else {
            ns.applyMode('editor');
          }
        }
      });
    }

    if (passwordSettingsBtn && passwordSettingsOverlay) {
      passwordSettingsBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        if (passwordSettingsPin) {
          if (ns.state.editorPassword) {
            setPin(passwordSettingsPin, ns.state.editorPassword);
          } else {
            clearPin(passwordSettingsPin);
          }
        }
        passwordSettingsOverlay.style.display = 'flex';
        setTimeout(() => focusFirstPin(passwordSettingsPin), 10);
      });

      passwordSettingsCancel.addEventListener('click', () => {
        passwordSettingsOverlay.style.display = 'none';
      });

      passwordSettingsOverlay.addEventListener('click', e => {
        if (e.target === passwordSettingsOverlay) {
          passwordSettingsOverlay.style.display = 'none';
        }
      });

      passwordSettingsSave.addEventListener('click', () => {
        const newPin = readPin(passwordSettingsPin);
        if (newPin && newPin.length === 4) {
          ns.state.editorPassword = newPin;
          ns.state.editorUnlocked = false;
          alert("Düzenleme PIN'i ayarlandı.");
        } else {
          ns.state.editorPassword = '';
          ns.state.editorUnlocked = true;
          alert("Düzenleme PIN'i kaldırıldı.");
        }
        passwordSettingsOverlay.style.display = 'none';
      });
    }

    if (passwordPromptOverlay && passwordPromptPin) {
      passwordPromptCancel.addEventListener('click', () => {
        passwordPromptOverlay.style.display = 'none';
        pendingModeAfterPassword = null;
        ns.applyMode('viewer');
      });

      passwordPromptOverlay.addEventListener('click', e => {
        if (e.target === passwordPromptOverlay) {
          passwordPromptOverlay.style.display = 'none';
          pendingModeAfterPassword = null;
          ns.applyMode('viewer');
        }
      });

      passwordPromptOk.addEventListener('click', () => {
        const entered = readPin(passwordPromptPin);
        if (entered === ns.state.editorPassword) {
          ns.state.editorUnlocked = true;
          passwordPromptOverlay.style.display = 'none';
          if (pendingModeAfterPassword) {
            ns.applyMode(pendingModeAfterPassword);
            pendingModeAfterPassword = null;
          }
        } else {
          alert('PIN hatalı.');
          clearPin(passwordPromptPin);
          focusFirstPin(passwordPromptPin);
        }
      });
    }

    ns.openPasswordPrompt = openPasswordPrompt;
    ns._pendingModeAfterPasswordRef = () => pendingModeAfterPassword;
    ns._setPendingModeAfterPassword = v => pendingModeAfterPassword = v;
  }

  function wireProjectInfoOverlay() {
    const {
      projectInfoBtn, projectInfoOverlay, projectNameInput,
      projectContractorInput, projectInfoCancel, projectInfoSave
    } = ns.dom;

    if (projectInfoBtn && projectInfoOverlay) {
      projectInfoBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        const info = ns.state.projectInfo || { name: '', contractor: '' };
        if (projectNameInput) projectNameInput.value = info.name || '';
        if (projectContractorInput) projectContractorInput.value = info.contractor || '';
        projectInfoOverlay.style.display = 'flex';
        setTimeout(() => {
          if (projectNameInput) projectNameInput.focus();
        }, 10);
      });

      projectInfoCancel.addEventListener('click', () => {
        projectInfoOverlay.style.display = 'none';
      });

      projectInfoOverlay.addEventListener('click', e => {
        if (e.target === projectInfoOverlay) {
          projectInfoOverlay.style.display = 'none';
        }
      });

      projectInfoSave.addEventListener('click', () => {
        const name = projectNameInput ? projectNameInput.value.trim() : '';
        const contractor = projectContractorInput ? projectContractorInput.value.trim() : '';
        ns.state.projectInfo = { name, contractor };
        ns.updateProjectNameLabel();
        projectInfoOverlay.style.display = 'none';
      });
    }
  }

  function wireToolbarButtons() {
    const { panModeBtn, labelsBtn, summaryBtn, resetViewBtn, addHotspotBtn } = ns.dom;

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

    addHotspotBtn.addEventListener('click', () => {
      if (!ns.state.mainImageUrl) {
        alert('Önce bir ana görsel yükleyin.');
        return;
      }
      ns.createHotspot();
    });
  }

  function wireMainImageLoad() {
    const { mainImageInput, mainImage } = ns.dom;
    mainImageInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        ns.state.mainImageUrl = ev.target.result;
        mainImage.src = ns.state.mainImageUrl;
        mainImage.onload = () => {
          ns.setTransform();
          ns.renderHotspots();
          ns.renderSidePanel();
          if (typeof ns.resetHistory === 'function') ns.resetHistory();
        };
      };
      reader.readAsDataURL(file);
    });
  }

  function wireExportImport() {
    const { exportBtn, importBtn, importInput, mainImage } = ns.dom;

    exportBtn.addEventListener('click', async () => {
      if (!ns.state.mainImageUrl) {
        alert('Dışa aktarılacak ana görsel yok.');
        return;
      }
      if (typeof JSZip === 'undefined') {
        alert('JSZip yüklenemedi.');
        return;
      }

      const zip = new JSZip();
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const fileName = 'site-plan-' +
        now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) + '-' +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds()) +
        '.epp';

      const cfg = {
        version: 8,
        grid: ns.state.grid,
        mainImage: null,
        hotspots: [],
        exportedAt: now.toISOString(),
        editorPassword: ns.state.editorPassword || '',
        projectInfo: ns.state.projectInfo || null
      };

      const mainParts = dataUrlToParts(ns.state.mainImageUrl);
      if (!mainParts.base64) {
        alert('Ana görsel verisi geçersiz.');
        return;
      }
      const mainExt = mimeToExt(mainParts.mime);
      const mainPath = 'images/main' + mainExt;
      cfg.mainImage = { path: mainPath, mime: mainParts.mime };
      zip.file(mainPath, mainParts.base64, { base64: true });

      ns.state.hotspots.forEach((hs, idx) => {
        let detail = null;
        if (hs.detailImageUrl) {
          const detParts = dataUrlToParts(hs.detailImageUrl);
          if (detParts.base64) {
            const detExt = mimeToExt(detParts.mime);
            const safeId = sanitizeFilename(hs.id);
            const detPath = `images/detail-${idx + 1}-${safeId}${detExt}`;
            zip.file(detPath, detParts.base64, { base64: true });
            detail = { path: detPath, mime: detParts.mime };
          }
        }
        const worksClean = {};
        const srcWorks = hs.works || {};
        ALL_WORK_ITEMS.forEach(w => {
          const item = srcWorks[w.id] || { status: 'baslamadi', workers: 0, subcontractor: '' };
          worksClean[w.id] = {
            status: item.status || 'baslamadi',
            workers: typeof item.workers === 'number' ? item.workers : 0,
            subcontractor: typeof item.subcontractor === 'string' ? item.subcontractor : ''
          };
        });

        cfg.hotspots.push({
          id: hs.id,
          top: hs.top,
          left: hs.left,
          width: hs.width,
          height: hs.height,
          ada: hs.ada || '',
          parsel: hs.parsel || '',
          blok: hs.blok || '',
          description: hs.description || '',
          detailImage: detail,
          fillColor: hs.fillColor || '#2563eb',
          fillOpacity: typeof hs.fillOpacity === 'number' ? hs.fillOpacity : 0.2,
          borderColor: hs.borderColor || hs.fillColor || '#60a5fa',
          borderOpacity: typeof hs.borderOpacity === 'number' ? hs.borderOpacity : 1,
          hoverGlow: hs.hoverGlow !== false,
          works: worksClean
        });
      });

      zip.file('config.json', JSON.stringify(cfg, null, 2));

      try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        ns.state.lastExportAt = now;
        ns.updateLastExportLabel();
      } catch (err) {
        console.error(err);
        alert('EPP oluşturulurken hata oluştu.');
      }
    });

    importBtn.addEventListener('click', () => {
      importInput.value = '';
      importInput.click();
    });

    importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          if (typeof JSZip === 'undefined') {
            alert('JSZip yüklenemedi.');
            return;
          }
          const zip = await JSZip.loadAsync(ev.target.result);
          const cfgFile = zip.file('config.json');
          if (!cfgFile) {
            alert('EPP içinde config.json bulunamadı.');
            return;
          }
          const cfgText = await cfgFile.async('string');
          const cfg = JSON.parse(cfgText);

          if (!cfg.mainImage || !cfg.mainImage.path) {
            alert('Geçersiz konfigürasyon: Ana görsel tanımı yok.');
            return;
          }

          const mainZipFile = zip.file(cfg.mainImage.path);
          if (!mainZipFile) {
            alert('EPP içinde ana görsel dosyası bulunamadı.');
            return;
          }
          const mainBase64 = await mainZipFile.async('base64');
          const mainMime = cfg.mainImage.mime || 'image/png';
          ns.state.mainImageUrl = `data:${mainMime};base64,${mainBase64}`;

          ns.state.grid = cfg.grid || 1;

          ns.state.editorPassword = typeof cfg.editorPassword === 'string' ? cfg.editorPassword : '';
          ns.state.editorUnlocked = !ns.state.editorPassword;

          ns.state.projectInfo = cfg.projectInfo || { name: '', contractor: '' };
          ns.updateProjectNameLabel();

          if (cfg.exportedAt) {
            const dt = new Date(cfg.exportedAt);
            if (!isNaN(dt.getTime())) {
              ns.state.lastExportAt = dt;
            }
          }
          ns.updateLastExportLabel();

          const hotspotDefs = Array.isArray(cfg.hotspots) ? cfg.hotspots : [];
          const hotspotPromises = hotspotDefs.map(async h => {
            let detailUrl = null;
            if (h.detailImage && h.detailImage.path) {
              const detFile = zip.file(h.detailImage.path);
              if (detFile) {
                const detBase64 = await detFile.async('base64');
                const detMime = h.detailImage.mime || 'image/png';
                detailUrl = `data:${detMime};base64,${detBase64}`;
              }
            }

            const fillColor = h.fillColor || h.color || '#2563eb';
            const fillOpacity = typeof h.fillOpacity === 'number'
              ? h.fillOpacity
              : (typeof h.opacity === 'number' ? h.opacity : 0.2);
            const borderColor = h.borderColor || fillColor || '#60a5fa';
            const borderOpacity = typeof h.borderOpacity === 'number' ? h.borderOpacity : 1;

            const works = ns.createDefaultWorks(h.works);

            return {
              id: h.id,
              top: h.top,
              left: h.left,
              width: h.width,
              height: h.height,
              ada: h.ada || '',
              parsel: h.parsel || '',
              blok: h.blok || '',
              description: h.description || '',
              detailImageUrl: detailUrl,
              fillColor,
              fillOpacity,
              borderColor,
              borderOpacity,
              hoverGlow: h.hoverGlow !== false,
              works
            };
          });

          const newHotspots = await Promise.all(hotspotPromises);
          ns.state.hotspots = newHotspots;
          ns.state.selectedIds = new Set();
          ns.state.showSummary = false;
          ns.state.sidePanelVisible = false;
          ns.state.highlightWorkTypeId = null;

          mainImage.src = ns.state.mainImageUrl;
          mainImage.onload = () => {
            ns.state.scale = 1;
            ns.state.offsetX = 0;
            ns.state.offsetY = 0;
            ns.setTransform();
            ns.renderHotspots();
            ns.renderSidePanel();
            if (typeof ns.resetHistory === 'function') ns.resetHistory();
          };

          ns.applyMode('viewer');
        } catch (err) {
          console.error(err);
          alert('EPP okunurken hata oluştu.');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function wireZoomPan() {
    const { canvasWrapper } = ns.dom;

    canvasWrapper.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const rect = canvasWrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldScale = ns.state.scale;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(5, Math.max(0.25, oldScale * factor));

      const contentX = (mx - ns.state.offsetX) / oldScale;
      const contentY = (my - ns.state.offsetY) / oldScale;

      ns.state.offsetX = mx - contentX * newScale;
      ns.state.offsetY = my - contentY * newScale;
      ns.state.scale = newScale;
      ns.setTransform();
    }, { passive: false });

    let panState = null;
    canvasWrapper.addEventListener('mousedown', e => {
      if (e.button === 1 || (e.button === 0 && ns.state.panMode)) {
        e.preventDefault();
        panState = {
          startX: e.clientX,
          startY: e.clientY,
          offsetX: ns.state.offsetX,
          offsetY: ns.state.offsetY
        };
      }
    });
    document.addEventListener('mousemove', e => {
      if (!panState) return;
      const dx = e.clientX - panState.startX;
      const dy = e.clientY - panState.startY;
      ns.state.offsetX = panState.offsetX + dx;
      ns.state.offsetY = panState.offsetY + dy;
      ns.setTransform();
    });
    document.addEventListener('mouseup', () => {
      panState = null;
    });
  }

  function wireHotspotInteractions() {
    const { hotspotLayer, canvasWrapper, mainImage } = ns.dom;

    let dragState = null;
    let drawState = null;

    hotspotLayer.addEventListener('mousedown', e => {
      if (ns.state.panMode && e.button === 0) {
        return;
      }

      if (ns.state.mode !== 'editor') {
        const hotspotEl = e.target.closest('.hotspot');
        if (!hotspotEl) return;
        const id = hotspotEl.dataset.id;
        ns.state.selectedIds = new Set([id]);
        ns.state.showSummary = false;
        ns.state.sidePanelVisible = true;
        ns.renderHotspots();
        ns.renderSidePanel();
        return;
      }

      const handleEl = e.target.closest('.handle');
      const hotspotEl = e.target.closest('.hotspot');

      if (!hotspotEl && !handleEl && e.target === hotspotLayer) {
        if (!ns.state.mainImageUrl) return;
        const imgRect = mainImage.getBoundingClientRect();
        if (imgRect.width === 0 || imgRect.height === 0) return;

        drawState = {
          startX: e.clientX,
          startY: e.clientY,
          imgRect,
          ghostEl: null
        };
        e.preventDefault();
        return;
      }

      if (!hotspotEl) return;

      const id = hotspotEl.dataset.id;
      let hs = ns.getHotspot(id);
      const imgRect = mainImage.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;

      if (e.shiftKey) {
        if (ns.state.selectedIds.has(id)) ns.state.selectedIds.delete(id);
        else ns.state.selectedIds.add(id);
      } else {
        ns.state.selectedIds = new Set([id]);
      }
      ns.state.showSummary = false;
      ns.state.sidePanelVisible = true;
      ns.renderHotspots();
      ns.renderSidePanel();

      // Ctrl basılıysa, seçili hotspot(ları) kopyala ve kopyaları sürükle
      if (!handleEl && e.ctrlKey) {
        const idsToClone = Array.from(ns.state.selectedIds);
        if (idsToClone.length) {
          ns.pushHistory('copyHotspot');

          const clones = [];
          const offset = 1; // yüzde cinsinden küçük kaydırma

          idsToClone.forEach(cid => {
            const orig = ns.getHotspot(cid);
            if (!orig) return;
            const clone = ns.cloneHotspot(orig, {
              top: snapPercent((orig.top || 0) + offset),
              left: snapPercent((orig.left || 0) + offset)
            });
            clones.push(clone);
          });

          if (clones.length) {
            ns.state.hotspots.push(...clones);
            ns.state.selectedIds = new Set(clones.map(c => c.id));
            ns.state.showSummary = false;
            ns.state.sidePanelVisible = true;
            ns.renderHotspots();
            ns.renderSidePanel();

            // Drag için artık kopyalara bakacağız
            hs = clones[0];
          }
        }
      }

      if (handleEl) {
        const handlePos = handleEl.dataset.handle || 'se';
        const topPct = hs.top;
        const leftPct = hs.left;
        const bottomPct = hs.top + hs.height;
        const rightPct = hs.left + hs.width;

        let anchorLeftPct, anchorTopPct;
        if (handlePos === 'se') {
          anchorLeftPct = leftPct;
          anchorTopPct = topPct;
        } else if (handlePos === 'nw') {
          anchorLeftPct = rightPct;
          anchorTopPct = bottomPct;
        } else if (handlePos === 'ne') {
          anchorLeftPct = leftPct;
          anchorTopPct = bottomPct;
        } else if (handlePos === 'sw') {
          anchorLeftPct = rightPct;
          anchorTopPct = topPct;
        } else {
          anchorLeftPct = leftPct;
          anchorTopPct = topPct;
        }

        dragState = {
          type: 'resize',
          id: hs.id,
          handle: handlePos,
          imgRect,
          anchorLeftPct,
          anchorTopPct,
          changed: false
        };
      } else {
        const selectedIds = Array.from(ns.state.selectedIds);
        dragState = {
          type: 'move',
          ids: selectedIds,
          startX,
          startY,
          imgRect,
          startPositions: selectedIds.map(hid => {
            const h = ns.getHotspot(hid);
            return { id: hid, top: h.top, left: h.left };
          }),
          changed: false
        };
      }
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (dragState) {
        const { imgRect } = dragState;
        if (imgRect.width === 0 || imgRect.height === 0) return;

        if (dragState.type === 'move') {
          const dxPx = e.clientX - dragState.startX;
          const dyPx = e.clientY - dragState.startY;
          const dxPct = dxPx * 100 / imgRect.width;
          const dyPct = dyPx * 100 / imgRect.height;

          dragState.startPositions.forEach(sp => {
            const hs = ns.getHotspot(sp.id);
            if (!hs) return;
            let newTop = sp.top + dyPct;
            let newLeft = sp.left + dxPct;
            newTop = Math.max(0, Math.min(100 - hs.height, newTop));
            newLeft = Math.max(0, Math.min(100 - hs.width, newLeft));
            hs.top = newTop;
            hs.left = newLeft;
          });

          dragState.changed = true;
          ns.renderHotspots();
          return;
        }

        if (dragState.type === 'resize') {
          const hs = ns.getHotspot(dragState.id);
          if (!hs) return;
          const { handle, anchorLeftPct, anchorTopPct } = dragState;

          const MIN_PX = 8;
          const minPctX = (MIN_PX * 100) / imgRect.width;
          const minPctY = (MIN_PX * 100) / imgRect.height;

          let pointerLeftPct = ((e.clientX - imgRect.left) * 100) / imgRect.width;
          let pointerTopPct = ((e.clientY - imgRect.top) * 100) / imgRect.height;

          pointerLeftPct = Math.max(0, Math.min(100, pointerLeftPct));
          pointerTopPct = Math.max(0, Math.min(100, pointerTopPct));

          let newLeft, newTop, newWidth, newHeight;

          if (handle === 'se') {
            pointerLeftPct = Math.max(anchorLeftPct + minPctX, pointerLeftPct);
            pointerTopPct = Math.max(anchorTopPct + minPctY, pointerTopPct);

            newLeft = anchorLeftPct;
            newTop = anchorTopPct;
            newWidth = pointerLeftPct - anchorLeftPct;
            newHeight = pointerTopPct - anchorTopPct;
          } else if (handle === 'nw') {
            pointerLeftPct = Math.min(anchorLeftPct - minPctX, pointerLeftPct);
            pointerTopPct = Math.min(anchorTopPct - minPctY, pointerTopPct);

            newLeft = pointerLeftPct;
            newTop = pointerTopPct;
            newWidth = anchorLeftPct - newLeft;
            newHeight = anchorTopPct - newTop;
          } else if (handle === 'ne') {
            pointerLeftPct = Math.max(anchorLeftPct + minPctX, pointerLeftPct);
            pointerTopPct = Math.min(anchorTopPct - minPctY, pointerTopPct);

            newLeft = anchorLeftPct;
            newTop = pointerTopPct;
            newWidth = pointerLeftPct - anchorLeftPct;
            newHeight = anchorTopPct - newTop;
          } else if (handle === 'sw') {
            pointerLeftPct = Math.min(anchorLeftPct - minPctX, pointerLeftPct);
            pointerTopPct = Math.max(anchorTopPct + minPctY, pointerTopPct);

            newLeft = pointerLeftPct;
            newTop = anchorTopPct;
            newWidth = anchorLeftPct - newLeft;
            newHeight = pointerTopPct - anchorTopPct;
          } else {
            return;
          }

          if (newLeft < 0) {
            newWidth -= (0 - newLeft);
            newLeft = 0;
          }
          if (newTop < 0) {
            newHeight -= (0 - newTop);
            newTop = 0;
          }
          if (newLeft + newWidth > 100) {
            newWidth = 100 - newLeft;
          }
          if (newTop + newHeight > 100) {
            newHeight = 100 - newTop;
          }

          newWidth = Math.max(minPctX, newWidth);
          newHeight = Math.max(minPctY, newHeight);

          hs.left = newLeft;
          hs.top = newTop;
          hs.width = newWidth;
          hs.height = newHeight;

          dragState.changed = true;
          ns.renderHotspots();
          return;
        }
      }

      if (drawState) {
        const { imgRect } = drawState;
        if (imgRect.width === 0 || imgRect.height === 0) return;
        const x1 = drawState.startX;
        const y1 = drawState.startY;
        const x2 = e.clientX;
        const y2 = e.clientY;

        const leftPx = Math.min(x1, x2);
        const topPx = Math.min(y1, y2);
        const widthPx = Math.abs(x2 - x1);
        const heightPx = Math.abs(y2 - y1);

        const relLeft = ((leftPx - imgRect.left) * 100) / imgRect.width;
        const relTop = ((topPx - imgRect.top) * 100) / imgRect.height;
        const relWidth = (widthPx * 100) / imgRect.width;
        const relHeight = (heightPx * 100) / imgRect.height;

        if (!drawState.ghostEl) {
          const el = document.createElement('div');
          el.className = 'hotspot';
          el.style.pointerEvents = 'none';
          hotspotLayer.appendChild(el);
          drawState.ghostEl = el;
        }

        const el = drawState.ghostEl;
        el.style.top = relTop + '%';
        el.style.left = relLeft + '%';
        el.style.width = relWidth + '%';
        el.style.height = relHeight + '%';
      }
    });

    document.addEventListener('mouseup', e => {
      if (dragState) {
        const type = dragState.type;
        const changed = !!dragState.changed;

        dragState.ids = dragState.ids || (dragState.id ? [dragState.id] : []);
        dragState.ids.forEach(id => {
          const hs = ns.getHotspot(id);
          if (!hs) return;
          hs.top = snapPercent(hs.top);
          hs.left = snapPercent(hs.left);
          hs.width = snapPercent(hs.width);
          hs.height = snapPercent(hs.height);
          hs.top = Math.max(0, Math.min(100 - hs.height, hs.top));
          hs.left = Math.max(0, Math.min(100 - hs.width, hs.left));
        });

        if (changed) {
          if (type === 'move') ns.pushHistory('moveHotspot');
          if (type === 'resize') ns.pushHistory('resizeHotspot');
        }

        dragState = null;
        ns.renderHotspots();
        return;
      }

      if (drawState) {
        const { imgRect } = drawState;
        if (imgRect.width === 0 || imgRect.height === 0) {
          if (drawState.ghostEl) drawState.ghostEl.remove();
          drawState = null;
          return;
        }
        const x1 = drawState.startX;
        const y1 = drawState.startY;
        const x2 = e.clientX;
        const y2 = e.clientY;
        const widthPx = Math.abs(x2 - x1);
        const heightPx = Math.abs(y2 - y1);

        if (drawState.ghostEl) {
          drawState.ghostEl.remove();
        }
        drawState = null;

        if (widthPx < 10 || heightPx < 10) {
          return;
        }

        const leftPx = Math.min(x1, x2);
        const topPx = Math.min(y1, y2);
        const relLeft = ((leftPx - imgRect.left) * 100) / imgRect.width;
        const relTop = ((topPx - imgRect.top) * 100) / imgRect.height;
        const relWidth = (widthPx * 100) / imgRect.width;
        const relHeight = (heightPx * 100) / imgRect.height;

        ns.createHotspot({
          top: snapPercent(relTop),
          left: snapPercent(relLeft),
          width: snapPercent(relWidth),
          height: snapPercent(relHeight)
        });
      }
    });

    canvasWrapper.addEventListener('click', e => {
      const hotspotEl = e.target.closest('.hotspot');
      if (!hotspotEl) {
        ns.state.selectedIds.clear();
        ns.state.showSummary = false;
        ns.state.sidePanelVisible = false;
        ns.renderHotspots();
        ns.renderSidePanel();
      }
    });

    document.addEventListener('keydown', e => {
      if (ns.state.mode !== 'editor') return;
      if (e.key !== 'Delete') return;

      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }

      if (!ns.state.selectedIds.size) return;
      e.preventDefault();

      const ids = Array.from(ns.state.selectedIds);
      ns.pushHistory('deleteHotspot');
      ns.state.hotspots = ns.state.hotspots.filter(h => !ids.includes(h.id));
      ns.state.selectedIds.clear();
      ns.state.sidePanelVisible = false;
      ns.renderHotspots();
      ns.renderSidePanel();
    });
  }

  // Undo/Redo kısayolları
  function wireHistoryShortcuts() {
    document.addEventListener('keydown', e => {
      if (ns.state.mode !== 'editor') return;

      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = (e.key || '').toLowerCase();

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        ns.undo();
        return;
      }

      if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        ns.redo();
        return;
      }
    });
  }

  function boot() {
    initDom();
    initWorkViewSelect();
    wireOverlays();
    wirePasswordOverlays();
    wireProjectInfoOverlay();
    wireToolbarButtons();
    wireMainImageLoad();
    wireExportImport();
    wireZoomPan();
    wireHotspotInteractions();
    wireHistoryShortcuts();

    ns.setTransform();
    ns.updateLastExportLabel();
    ns.updateProjectNameLabel();
    ns.state.sidePanelVisible = false;
    ns.renderHotspots();
    ns.renderSidePanel();
    ns.applyMode('viewer');

    if (typeof ns.resetHistory === 'function') ns.resetHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.EPP = window.EPP || {});
