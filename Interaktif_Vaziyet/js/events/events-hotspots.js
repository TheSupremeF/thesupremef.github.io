(function(ns){
  const { snapPercent } = ns.utils;

  function wireHotspotInteractions() {
    const { hotspotLayer, canvasWrapper, mainImage, drawingLayer, textLayer } = ns.dom;

    let dragState = null;
    let drawState = null;
    let lineDrawing = null;
    let curveDrawing = null;
    let polygonDrawing = null;
    let selectedDrawing = null;
    
    // Helper function to render curve preview
    function renderCurvePreview() {
      if (!curveDrawing || !curveDrawing.points || curveDrawing.points.length === 0) return;
      
      const { drawingLayer, viewport } = ns.dom;
      if (!drawingLayer || !viewport) return;
      
      const vw = viewport.offsetWidth;
      const vh = viewport.offsetHeight;
      
      // Remove old preview elements
      const oldPreviews = drawingLayer.querySelectorAll('.curve-preview-point, .curve-preview-path, .curve-preview-label');
      oldPreviews.forEach(el => el.remove());
      
      // Render points
      curveDrawing.points.forEach((point, idx) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', (point.x * vw / 100) + '');
        circle.setAttribute('cy', (point.y * vh / 100) + '');
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#ffcc00');
        circle.classList.add('curve-preview-point');
        drawingLayer.appendChild(circle);
        
        // Nokta numarası
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (point.x * vw / 100) + '');
        text.setAttribute('y', (point.y * vh / 100) + '');
        text.setAttribute('dx', '8');
        text.setAttribute('dy', '4');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', 'bold');
        text.textContent = String(idx + 1);
        text.classList.add('curve-preview-label');
        drawingLayer.appendChild(text);
      });
      
      // Render curve if we have 2+ points
      if (curveDrawing.points.length >= 2) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pts = curveDrawing.points;
        let d = `M ${pts[0].x * vw / 100} ${pts[0].y * vh / 100}`;
        
        if (pts.length === 2) {
          d += ` L ${pts[1].x * vw / 100} ${pts[1].y * vh / 100}`;
        } else {
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = i === 0 ? pts[0] : pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = i + 2 < pts.length ? pts[i + 2] : pts[pts.length - 1];
            
            const cp1x = (p1.x + (p2.x - p0.x) / 6) * vw / 100;
            const cp1y = (p1.y + (p2.y - p0.y) / 6) * vh / 100;
            const cp2x = (p2.x - (p3.x - p1.x) / 6) * vw / 100;
            const cp2y = (p2.y - (p3.y - p1.y) / 6) * vh / 100;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x * vw / 100} ${p2.y * vh / 100}`;
          }
        }
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#60a5fa');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.classList.add('curve-preview-path');
        drawingLayer.appendChild(path);
      }
    }
    
    // Helper function to render polygon preview
    function renderPolygonPreview() {
      if (!polygonDrawing || !polygonDrawing.points || polygonDrawing.points.length === 0) return;
      
      const { drawingLayer, viewport } = ns.dom;
      if (!drawingLayer || !viewport) return;
      
      const vw = viewport.offsetWidth;
      const vh = viewport.offsetHeight;
      
      // Remove old preview elements
      const oldPreviews = drawingLayer.querySelectorAll('.polygon-preview-point, .polygon-preview-line, .polygon-preview-label');
      oldPreviews.forEach(el => el.remove());
      
      // Render points
      polygonDrawing.points.forEach((point, idx) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', (point.x * vw / 100) + '');
        circle.setAttribute('cy', (point.y * vh / 100) + '');
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#a855f7'); // Purple color for polygon points
        circle.classList.add('polygon-preview-point');
        drawingLayer.appendChild(circle);
        
        // Nokta numarası
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (point.x * vw / 100) + '');
        text.setAttribute('y', (point.y * vh / 100) + '');
        text.setAttribute('dx', '8');
        text.setAttribute('dy', '4');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', 'bold');
        text.textContent = String(idx + 1);
        text.classList.add('polygon-preview-label');
        drawingLayer.appendChild(text);
      });
      
      // Render lines if we have 2+ points
      if (polygonDrawing.points.length >= 2) {
        const pts = polygonDrawing.points;
        for (let i = 0; i < pts.length - 1; i++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (pts[i].x * vw / 100) + '');
          line.setAttribute('y1', (pts[i].y * vh / 100) + '');
          line.setAttribute('x2', (pts[i + 1].x * vw / 100) + '');
          line.setAttribute('y2', (pts[i + 1].y * vh / 100) + '');
          line.setAttribute('stroke', '#a855f7'); // Purple color for polygon lines
          line.setAttribute('stroke-width', '2');
          line.classList.add('polygon-preview-line');
          drawingLayer.appendChild(line);
        }
        
        // Close the loop with 3+ points (preview closing line)
        if (pts.length >= 3) {
          const closingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          closingLine.setAttribute('x1', (pts[pts.length - 1].x * vw / 100) + '');
          closingLine.setAttribute('y1', (pts[pts.length - 1].y * vh / 100) + '');
          closingLine.setAttribute('x2', (pts[0].x * vw / 100) + '');
          closingLine.setAttribute('y2', (pts[0].y * vh / 100) + '');
          closingLine.setAttribute('stroke', '#a855f7');
          closingLine.setAttribute('stroke-width', '2');
          closingLine.setAttribute('stroke-dasharray', '5,5'); // Dashed to show it's the closing edge
          closingLine.classList.add('polygon-preview-line');
          drawingLayer.appendChild(closingLine);
        }
      }
    }

    canvasWrapper.addEventListener('click', e => {
      // Text, line, curve, or polygon çizimindeyken boş alan tıklamayı devre dışı bırak
      if (lineDrawing || curveDrawing || polygonDrawing || ns.state.drawMode === 'text') return;
      
      // Hotspot, text veya çizim elementine tıklanmış mı?
      if (e.target.closest('.hotspot') || 
          e.target.closest('.draw-text') ||
          e.target.classList.contains('drawing-line') ||
          e.target.classList.contains('drawing-curve') ||
          e.target.classList.contains('drawing-handle')) {
        // Bir şeye tıklanmış, sidepanel'i kapatma
        return;
      }
      
      // Boş alana tıklanmış, her şeyi temizle
      ns.state.selectedIds.clear();
      ns.state.selectedDrawingId = null;
      ns.state.showSummary = false;
      ns.state.showReadyPanel = false;
      ns.state.showIssuesPanel = false;
      ns.state.sidePanelVisible = false;
      selectedDrawing = null;
      
      // Butonları untoggle et
      const { summaryBtn, readyBtn, issuesBtn } = ns.dom;
      if (summaryBtn) summaryBtn.classList.remove('toggle-active');
      if (readyBtn) readyBtn.classList.remove('toggle-active');
      if (issuesBtn) issuesBtn.classList.remove('toggle-active');
      
      ns.renderHotspots();
      ns.renderSidePanel();
    });

    // Eğri çizimini tamamla (ortak fonksiyon)
    function completeCurveDrawing() {
      if (!curveDrawing || !curveDrawing.isDrawing) return;
      
      curveDrawing.isDrawing = false;
      
      // Hide drawing mode toolbar
      if (ns.dom.drawingModeToolbar) {
        ns.dom.drawingModeToolbar.style.display = 'none';
      }
      
      if (curveDrawing.points.length > 1) {
        ns.state.drawings = ns.state.drawings || [];
        
        // Otomatik ID oluştur
        const curveCount = ns.state.drawings.filter(d => d.type === 'curve').length + 1;
        const autoTitle = `Eğri ${curveCount}`;
        
        const newCurve = {
          id: 'draw-' + Date.now(),
          type: 'curve',
          points: curveDrawing.points,
          lineType: 'diger',
          title: autoTitle,
          description: '',
          photos: [],
          color: '#eab308',
          width: 2
        };
        ns.state.drawings.push(newCurve);
        ns.pushHistory('addCurve');
        
        // Yeni eğriyi seç ve sidepanel'de göster
        ns.state.selectedDrawingId = newCurve.id;
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
      }
      
      // Clear curve preview elements
      if (ns.dom.drawingLayer) {
        const previews = ns.dom.drawingLayer.querySelectorAll('.curve-preview-point, .curve-preview-path, .curve-preview-label');
        previews.forEach(el => el.remove());
      }
      
      curveDrawing = null;
      ns.renderDrawings();
      ns.state.drawMode = null;
      ns.dom.drawCurveBtn.classList.remove('toggle-active');
    }
    
    // Poligon çizimini tamamla
    function completePolygonDrawing() {
      if (!polygonDrawing || !polygonDrawing.isDrawing) return;
      
      polygonDrawing.isDrawing = false;
      
      // Hide drawing mode toolbar
      if (ns.dom.drawingModeToolbar) {
        ns.dom.drawingModeToolbar.style.display = 'none';
      }
      
      if (polygonDrawing.points.length >= 3) {
        ns.state.drawings = ns.state.drawings || [];
        
        // Otomatik ID oluştur
        const polygonCount = ns.state.drawings.filter(d => d.type === 'polygon').length + 1;
        const autoTitle = `Poligon ${polygonCount}`;
        
        const newPolygon = {
          id: 'draw-' + Date.now(),
          type: 'polygon',
          points: polygonDrawing.points,
          lineType: 'diger',
          title: autoTitle,
          description: '',
          photos: [],
          // Stroke (outline) properties
          strokeColor: '#a855f7',
          strokeOpacity: 1,
          width: 2,
          // Fill properties
          fillColor: '#a855f7',
          fillOpacity: 0.3
        };
        ns.state.drawings.push(newPolygon);
        ns.pushHistory('addPolygon');
        
        // Yeni poligonu seç ve sidepanel'de göster
        ns.state.selectedDrawingId = newPolygon.id;
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
      }
      
      // Clear polygon preview elements
      if (ns.dom.drawingLayer) {
        const previews = ns.dom.drawingLayer.querySelectorAll('.polygon-preview-point, .polygon-preview-line, .polygon-preview-label');
        previews.forEach(el => el.remove());
      }
      
      polygonDrawing = null;
      ns.renderDrawings();
      ns.state.drawMode = null;
      ns.dom.drawPolygonBtn.classList.remove('toggle-active');
    }
    
    // Cancel curve drawing
    function cancelCurveDrawing() {
      // Hide drawing mode toolbar
      if (ns.dom.drawingModeToolbar) {
        ns.dom.drawingModeToolbar.style.display = 'none';
      }
      
      // Clear curve preview elements
      if (ns.dom.drawingLayer) {
        const previews = ns.dom.drawingLayer.querySelectorAll('.curve-preview-point, .curve-preview-path, .curve-preview-label');
        previews.forEach(el => el.remove());
      }
      
      curveDrawing = null;
      ns.renderDrawings(); // Clear preview
      ns.state.drawMode = null;
      if (ns.dom.drawCurveBtn) {
        ns.dom.drawCurveBtn.classList.remove('toggle-active');
      }
    }
    
    // Cancel polygon drawing
    function cancelPolygonDrawing() {
      // Hide drawing mode toolbar
      if (ns.dom.drawingModeToolbar) {
        ns.dom.drawingModeToolbar.style.display = 'none';
      }
      
      // Clear polygon preview elements
      if (ns.dom.drawingLayer) {
        const previews = ns.dom.drawingLayer.querySelectorAll('.polygon-preview-point, .polygon-preview-line, .polygon-preview-label');
        previews.forEach(el => el.remove());
      }
      
      polygonDrawing = null;
      ns.renderDrawings();
      ns.state.drawMode = null;
      if (ns.dom.drawPolygonBtn) {
        ns.dom.drawPolygonBtn.classList.remove('toggle-active');
      }
    }
    
    // Eğri çizimini double-click ile bitir
    canvasWrapper.addEventListener('dblclick', e => {
      if (curveDrawing && curveDrawing.isDrawing) {
        e.preventDefault();
        e.stopPropagation();
        completeCurveDrawing();
      } else if (polygonDrawing && polygonDrawing.isDrawing) {
        e.preventDefault();
        e.stopPropagation();
        completePolygonDrawing();
      }
    });
    
    // Wire up drawing mode toolbar buttons (works for both curves and polygons)
    if (ns.dom.confirmDrawingBtn) {
      ns.dom.confirmDrawingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (curveDrawing) {
          completeCurveDrawing();
        } else if (polygonDrawing) {
          completePolygonDrawing();
        }
      });
    }
    
    if (ns.dom.cancelDrawingBtn) {
      ns.dom.cancelDrawingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (curveDrawing) {
          cancelCurveDrawing();
        } else if (polygonDrawing) {
          cancelPolygonDrawing();
        }
      });
    }

    canvasWrapper.addEventListener('mousedown', e => {
      if (ns.state.mode !== 'editor') return;
      if (ns.state.panMode) return;
      
      // Çizim modundaysak, hotspot ve handle kontrollerini bypass et
      if (!ns.state.drawMode && (e.target.closest('.hotspot') || e.target.closest('.draw-text'))) return;

      const viewportRect = ns.dom.viewport.getBoundingClientRect();
      const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
      const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;

      if (ns.state.drawMode === 'line') {
        lineDrawing = {
          startX: relX,
          startY: relY,
          endX: relX,
          endY: relY
        };
        e.stopPropagation();
        e.preventDefault();
      } else if (ns.state.drawMode === 'curve') {
        // Check if click is on drawing toolbar - don't add point
        if (e.target.closest('#drawingModeToolbar') || e.target.closest('.curve-toolbar')) {
          return;
        }
        
        // HER TIKLAMADA NOKTA EKLE
        if (!curveDrawing) {
          curveDrawing = {
            points: [],
            isDrawing: true
          };
          
          // Show drawing mode toolbar when first point is added
          if (ns.dom.drawingModeToolbar) {
            ns.dom.drawingModeToolbar.style.display = 'flex';
          }
        }
        
        // Nokta ekle - viewport'a göre hesapla
        const vw = ns.dom.viewport.offsetWidth;
        const vh = ns.dom.viewport.offsetHeight;
        curveDrawing.points.push({ x: relX, y: relY });
        
        // Manually render just the preview without clearing everything
        // This keeps points visible
        renderCurvePreview();
        
        e.stopPropagation();
        e.preventDefault();
      } else if (ns.state.drawMode === 'polygon') {
        // Check if click is on drawing toolbar - don't add point
        if (e.target.closest('#drawingModeToolbar') || e.target.closest('.curve-toolbar')) {
          return;
        }
        
        // HER TIKLAMADA KÖŞE EKLE
        if (!polygonDrawing) {
          polygonDrawing = {
            points: [],
            isDrawing: true
          };
          
          // Show drawing mode toolbar when first point is added
          if (ns.dom.drawingModeToolbar) {
            ns.dom.drawingModeToolbar.style.display = 'flex';
          }
        }
        
        // Köşe ekle - viewport'a göre hesapla
        const vw = ns.dom.viewport.offsetWidth;
        const vh = ns.dom.viewport.offsetHeight;
        polygonDrawing.points.push({ x: relX, y: relY });
        
        // Manually render just the preview without clearing everything
        // This keeps points visible
        renderPolygonPreview();
        
        e.stopPropagation();
        e.preventDefault();
      } else if (ns.state.drawMode === 'text') {
        // Create label as a drawing object
        ns.state.drawings = ns.state.drawings || [];
        
        const labelCount = ns.state.drawings.filter(d => d.type === 'label').length + 1;
        const autoTitle = `Etiket ${labelCount}`;
        
        const newLabel = {
          id: 'draw-' + Date.now(),
          type: 'label',
          x: relX,
          y: relY,
          text: 'Yeni Etiket',
          title: autoTitle,
          description: '',
          color: '#eab308',
          fontSize: 14,
          fontWeight: 'normal'
        };
        
        ns.state.drawings.push(newLabel);
        ns.pushHistory('addLabel');
        
        // Select the new label
        ns.state.selectedDrawingId = newLabel.id;
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
        ns.renderDrawings();
        
        e.stopPropagation();
        e.preventDefault();
      } else if (ns.state.drawMode === 'poi') {
        // Create POI as a drawing object
        ns.state.drawings = ns.state.drawings || [];
        
        const poiCount = ns.state.drawings.filter(d => d.type === 'poi').length + 1;
        const autoTitle = `Nokta ${poiCount}`;
        
        const newPoi = {
          id: 'draw-' + Date.now(),
          type: 'poi',
          x: relX,
          y: relY,
          title: autoTitle,
          description: '',
          strokeColor: '#3b82f6',
          strokeOpacity: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          radius: 8
        };
        
        ns.state.drawings.push(newPoi);
        ns.pushHistory('addPoi');
        
        // Select the new POI
        ns.state.selectedDrawingId = newPoi.id;
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
        ns.renderDrawings();
        
        e.stopPropagation();
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', e => {
      if (lineDrawing) {
        const viewportRect = ns.dom.viewport.getBoundingClientRect();
        const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
        const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;
        
        lineDrawing.endX = relX;
        lineDrawing.endY = relY;
        
        // Preview render
        ns.renderDrawingPreview({
          type: 'line',
          startX: lineDrawing.startX,
          startY: lineDrawing.startY,
          endX: lineDrawing.endX,
          endY: lineDrawing.endY
        });
      }
      
      // Eğri çizimi artık tıklayarak yapılıyor, mousemove'da nokta eklemiyoruz
    });

    document.addEventListener('mouseup', e => {
      if (lineDrawing) {
        ns.state.drawings = ns.state.drawings || [];
        
        // Otomatik ID oluştur
        const lineCount = ns.state.drawings.filter(d => d.type === 'line').length + 1;
        const autoTitle = `Çizgi ${lineCount}`;
        
        const newLine = {
          id: 'draw-' + Date.now(),
          type: 'line',
          x1: lineDrawing.startX,
          y1: lineDrawing.startY,
          x2: lineDrawing.endX,
          y2: lineDrawing.endY,
          lineType: 'diger',
          title: autoTitle,
          description: '',
          photos: [],
          color: '#eab308',
          width: 2
        };
        ns.state.drawings.push(newLine);
        ns.pushHistory('addLine');
        lineDrawing = null;
        ns.renderDrawings();
        ns.state.drawMode = null;
        ns.dom.drawLineBtn.classList.remove('toggle-active');
        
        // Yeni çizgiyi seç ve sidepanel'de göster
        ns.state.selectedDrawingId = newLine.id;
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
      }
      
      // Curve çizimi mouseup'ta bitmiyor - double-click ile bitecek
      // Sadece drawing durumunu durdur
      if (curveDrawing) {
        // isDrawing durumunu false yapmıyoruz ki çizime devam edebilsin
        // Double-click ile bitecek
      }
    });

    drawingLayer.addEventListener('click', e => {
      if (ns.state.mode !== 'editor') return;
      
      // SVG element traversal helper
      function findParentG(element) {
        let current = element;
        while (current && current !== drawingLayer) {
          if (current.tagName === 'g') {
            return current;
          }
          current = current.parentElement || current.parentNode;
        }
        return null;
      }
      
      const line = e.target.tagName === 'line' ? e.target : null;
      const path = e.target.tagName === 'path' ? e.target : null;
      
      if (line || path) {
        const g = findParentG(line || path);
        if (g && g.dataset.drawingId) {
          const drawingId = g.dataset.drawingId;
          const drawing = ns.state.drawings.find(d => d.id === drawingId);
          
          if (drawing) {
            // Çizimi seç ve sidepanel'de göster
            ns.state.selectedDrawingId = drawing.id;
            ns.state.selectedIds.clear(); // Hotspot seçimini temizle
            ns.state.sidePanelVisible = true;
            ns.renderSidePanel();
            ns.renderDrawings(); // Seçim highlight'ı için
          }
        }
      }
    });

    textLayer.addEventListener('dblclick', e => {
      if (ns.state.mode !== 'editor') return;
      
      const textEl = e.target.closest('.draw-text');
      if (!textEl) return;
      
      const textId = textEl.dataset.id;
      const textObj = ns.state.texts.find(t => t.id === textId);
      if (!textObj) return;
      
      textEl.contentEditable = true;
      textEl.classList.add('editing');
      textEl.focus();
      document.execCommand('selectAll', false, null);
      
      const finishEdit = () => {
        const newText = textEl.textContent.trim();
        if (newText) {
          textObj.text = newText;
          ns.pushHistory('editText');
        }
        textEl.contentEditable = false;
        textEl.classList.remove('editing');
        ns.renderDrawings();
      };
      
      textEl.addEventListener('blur', finishEdit, { once: true });
      textEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          textEl.blur();
        }
        if (e.key === 'Escape') {
          textEl.contentEditable = false;
          textEl.classList.remove('editing');
          ns.renderDrawings();
        }
      }, { once: true });
    });

    textLayer.addEventListener('contextmenu', e => {
      if (ns.state.mode !== 'editor') return;
      
      const textEl = e.target.closest('.draw-text');
      if (!textEl) return;
      
      e.preventDefault();
      const textId = textEl.dataset.id;
      
      if (confirm('Bu metni silmek istediğinize emin misiniz?')) {
        ns.state.texts = ns.state.texts.filter(t => t.id !== textId);
        ns.pushHistory('deleteText');
        ns.renderDrawings();
      }
    });

    hotspotLayer.addEventListener('mousedown', e => {
      if (ns.state.panMode && e.button === 0) {
        return;
      }

      // Label dragging (Editor modda)
      const labelEl = e.target.closest('.hotspot-label');
      if (labelEl && ns.state.mode === 'editor') {
        e.preventDefault();
        e.stopPropagation();
        
        const hotspotId = labelEl.dataset.id;
        const hs = ns.getHotspot(hotspotId);
        if (!hs) return;
        
        const settings = ns.state.settings || {};
        const defaultOffsetX = settings.labelOffsetX || 0;
        const defaultOffsetY = settings.labelOffsetY || -20;
        
        // Mevcut offset'i al
        const currentOffsetX = hs.labelOffset ? hs.labelOffset.x : defaultOffsetX;
        const currentOffsetY = hs.labelOffset ? hs.labelOffset.y : defaultOffsetY;
        
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        
        const onMouseMove = (moveEvent) => {
          const dx = (moveEvent.clientX - startMouseX) / ns.state.scale;
          const dy = (moveEvent.clientY - startMouseY) / ns.state.scale;
          
          hs.labelOffset = {
            x: Math.round(currentOffsetX + dx),
            y: Math.round(currentOffsetY + dy)
          };
          
          ns.renderHotspots();
        };
        
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          ns.pushHistory('moveLabelOffset');
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return;
      }

      if (ns.state.mode !== 'editor') {
        const hotspotEl = e.target.closest('.hotspot');
        if (!hotspotEl) return;
        const id = hotspotEl.dataset.id;
        ns.state.selectedIds = new Set([id]);
        ns.state.showSummary = false;
        ns.state.showReadyPanel = false;
        ns.state.showIssuesPanel = false;
        ns.state.sidePanelVisible = true;
        
        // Butonları untoggle et
        const { summaryBtn, readyBtn, issuesBtn } = ns.dom;
        if (summaryBtn) summaryBtn.classList.remove('toggle-active');
        if (readyBtn) readyBtn.classList.remove('toggle-active');
        if (issuesBtn) issuesBtn.classList.remove('toggle-active');
        
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
      ns.state.showReadyPanel = false;
      ns.state.showIssuesPanel = false;
      ns.state.sidePanelVisible = true;
      
      // Butonları untoggle et
      const { summaryBtn, readyBtn, issuesBtn } = ns.dom;
      if (summaryBtn) summaryBtn.classList.remove('toggle-active');
      if (readyBtn) readyBtn.classList.remove('toggle-active');
      if (issuesBtn) issuesBtn.classList.remove('toggle-active');
      
      ns.renderHotspots();
      ns.renderSidePanel();

      if (!handleEl && e.ctrlKey) {
        const idsToClone = Array.from(ns.state.selectedIds);
        if (idsToClone.length) {
          ns.pushHistory('copyHotspot');

          const clones = [];
          const offset = 1;

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
            ns.state.showReadyPanel = false;
            ns.state.showIssuesPanel = false;
            ns.state.sidePanelVisible = true;
            ns.renderHotspots();
            ns.renderSidePanel();

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


  ns.wireHotspotInteractions = wireHotspotInteractions;
})(window.EPP = window.EPP || {});
