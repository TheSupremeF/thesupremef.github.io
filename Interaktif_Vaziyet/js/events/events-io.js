(function(ns){
  const { ALL_WORK_ITEMS } = ns;
  const {
    dataUrlToParts,
    mimeToExt,
    sanitizeFilename,
    formatDateTime
  } = ns.utils;

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
      const fileName = 'site-plan-' +ns.state.projectInfo.contractorShort+'-'+
        now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) + '-' +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds()) +
        '.epp';

      const cfg = {
        version: 9,
        grid: ns.state.grid,
        mainImage: null,
        hotspots: [],
        drawings: ns.state.drawings || [],
        texts: ns.state.texts || [],
        exportedAt: now.toISOString(),
        editorPassword: ns.state.editorPassword || '',
        projectInfo: ns.state.projectInfo || null,
        settings: ns.state.settings || null
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

      let imageCounter = 0;
      ns.state.hotspots.forEach((hs, idx) => {
        const detailImagesData = [];
        if (hs.detailImages && Array.isArray(hs.detailImages)) {
          hs.detailImages.forEach(img => {
            if (!img.url) return;
            const detParts = dataUrlToParts(img.url);
            if (detParts.base64) {
              imageCounter++;
              const detExt = mimeToExt(detParts.mime);
              const safeId = sanitizeFilename(hs.id);
              const detPath = `images/detail-${imageCounter}-${safeId}${detExt}`;
              zip.file(detPath, detParts.base64, { base64: true });
              detailImagesData.push({ path: detPath, mime: detParts.mime, caption: img.caption || '' });
            }
          });
        }

        const worksClean = {};
        const srcWorks = hs.works || {};
        ALL_WORK_ITEMS.forEach(w => {
          const item = srcWorks[w.id] || { status: 'veri_girilmedi', workers: 0, subcontractor: '', startDate: '', endDate: '' };
          worksClean[w.id] = {
            status: item.status || 'veri_girilmedi',
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            workers: typeof item.workers === 'number' ? item.workers : 0,
            subcontractor: typeof item.subcontractor === 'string' ? item.subcontractor : ''
          };
        });

        // Issues'ları da ekle
        const issuesClean = [];
        if (hs.issues && Array.isArray(hs.issues)) {
          hs.issues.forEach(issue => {
            issuesClean.push({
              id: issue.id || '',
              title: issue.title || '',
              description: issue.description || '',
              createdAt: issue.createdAt || '',
              workTypeId: issue.workTypeId || '',
              status: issue.status || 'open',
              priority: issue.priority || 'medium',
              photos: issue.photos || []
            });
          });
        }

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
          detailImages: detailImagesData,
          fillColor: hs.fillColor || '#2563eb',
          fillOpacity: typeof hs.fillOpacity === 'number' ? hs.fillOpacity : 0.2,
          borderColor: hs.borderColor || hs.fillColor || '#60a5fa',
          borderOpacity: typeof hs.borderOpacity === 'number' ? hs.borderOpacity : 1,
          hoverGlow: hs.hoverGlow !== false,
          works: worksClean,
          floorCount: typeof hs.floorCount === 'number' ? hs.floorCount : 0,
          buildingType: typeof hs.buildingType === 'string' ? hs.buildingType : '',
          dailyRecords: Array.isArray(hs.dailyRecords) ? hs.dailyRecords : [],
          issues: issuesClean,
          labelOffset: hs.labelOffset || null
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
          
          // projectInfo'yu default değerlerle merge et
          ns.state.projectInfo = {
            name: '',
            contractor: '',
            contractorCode: '',
            contractorShort: '',
            projectType: 'ETAP',
            formworkType: 'TÜNEL',
            maxFloors: 10,
            ...(cfg.projectInfo || {})
          };
          
          // settings'i default değerlerle merge et
          ns.state.settings = {
            gridSize: 100,
            labelFontSize: 12,
            labelOffsetX: 0,
            labelOffsetY: -20,
            ...(cfg.settings || {})
          };
          
          // Kat sayısı varsa WORK_GROUPS'u yeniden oluştur
          const maxFloors = ns.state.projectInfo.maxFloors || 10;
          ns.initializeWorkGroups(maxFloors);
          
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
            let detailImagesArray = [];
            if (h.detailImages && Array.isArray(h.detailImages)) {
              for (const detImg of h.detailImages) {
                if (!detImg.path) continue;
                const detFile = zip.file(detImg.path);
                if (detFile) {
                  const detBase64 = await detFile.async('base64');
                  const detMime = detImg.mime || 'image/png';
                  detailImagesArray.push({
                    url: `data:${detMime};base64,${detBase64}`,
                    caption: detImg.caption || ''
                  });
                }
              }
            } else if (h.detailImage && h.detailImage.path) {
              const detFile = zip.file(h.detailImage.path);
              if (detFile) {
                const detBase64 = await detFile.async('base64');
                const detMime = h.detailImage.mime || 'image/png';
                detailImagesArray.push({
                  url: `data:${detMime};base64,${detBase64}`,
                  caption: ''
                });
              }
            }

            const fillColor = h.fillColor || h.color || '#2563eb';
            const fillOpacity = typeof h.fillOpacity === 'number'
              ? h.fillOpacity
              : (typeof h.opacity === 'number' ? h.opacity : 0.2);
            const borderColor = h.borderColor || fillColor || '#60a5fa';
            const borderOpacity = typeof h.borderOpacity === 'number' ? h.borderOpacity : 1;

            const works = ns.createDefaultWorks(h.works);
            const floorCount = typeof h.floorCount === 'number' ? h.floorCount : 0;
            const buildingType = typeof h.buildingType === 'string' ? h.buildingType : '';
            const dailyRecords = Array.isArray(h.dailyRecords) ? h.dailyRecords : [];
            const issues = Array.isArray(h.issues) ? h.issues : [];
            const labelOffset = h.labelOffset || null;

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
              detailImages: detailImagesArray,
              fillColor,
              fillOpacity,
              borderColor,
              borderOpacity,
              hoverGlow: h.hoverGlow !== false,
              works,
              floorCount,
              buildingType,
              dailyRecords,
              issues,
              labelOffset
            };
          });

          const newHotspots = await Promise.all(hotspotPromises);
          ns.state.hotspots = newHotspots;
          ns.state.drawings = Array.isArray(cfg.drawings) ? cfg.drawings : [];
          ns.state.texts = Array.isArray(cfg.texts) ? cfg.texts : [];
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
            
            // İmalat dropdown'unu yeniden doldur (kalıp türüne göre filtrelenmiş)
            if (typeof ns.refreshWorkViewSelect === 'function') {
              ns.refreshWorkViewSelect();
            }
            
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

  ns.wireExportImport = wireExportImport;
})(window.EPP = window.EPP || {});
