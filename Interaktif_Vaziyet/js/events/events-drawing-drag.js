(function(ns){
  
  ns.wireDrawingDrag = function() {
    const { drawingLayer, textLayer } = ns.dom || {};
    if (!drawingLayer || !textLayer) return;

    let dragState = null;

    // Helper function for SVG element traversal
    function findParentWithClass(element, className) {
      let current = element;
      while (current && current !== drawingLayer) {
        if (current.classList && current.classList.contains(className)) {
          return current;
        }
        current = current.parentElement || current.parentNode;
      }
      return null;
    }

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

    drawingLayer.addEventListener('mousedown', e => {
      if (ns.state.mode !== 'editor') return;
      if (ns.state.panMode) return;
      if (ns.state.drawMode) return; // Çizim modundaysa drag yapma

      // Label drag
      if (e.target.classList.contains('drawing-label') || e.target.classList.contains('drawing-label-bg')) {
        const drawingId = e.target.dataset.drawingId;
        const drawing = ns.state.drawings.find(d => d.id === drawingId);
        if (drawing) {
          e.preventDefault();
          dragState = {
            type: 'label',
            drawing,
            startX: e.clientX,
            startY: e.clientY,
            initialOffsetX: drawing.labelOffsetX || 0,
            initialOffsetY: drawing.labelOffsetY || 0
          };
        }
        return;
      }

      // Handle drag
      const handle = findParentWithClass(e.target, 'drawing-handle');
      if (handle) {
        e.preventDefault();
        e.stopPropagation();

        const g = findParentG(handle);
        const drawingId = g ? g.dataset.drawingId : null;
        const drawing = ns.state.drawings.find(d => d.id === drawingId);
        if (!drawing) return;

        const handleType = handle.dataset.handleType;
        const pointIndex = handle.dataset.pointIndex;

        dragState = {
          type: 'handle',
          drawing,
          handleType,
          pointIndex: pointIndex ? parseInt(pointIndex) : null,
          startX: e.clientX,
          startY: e.clientY
        };
        return;
      }

      // Drawing line/curve drag (Ctrl için kopyalama)
      const lineEl = findParentWithClass(e.target, 'drawing-line');
      const curveEl = findParentWithClass(e.target, 'drawing-curve');
      const labelTextEl = findParentWithClass(e.target, 'drawing-label-text');
      const labelBgEl = findParentWithClass(e.target, 'drawing-label-bg');
      const poiEl = findParentWithClass(e.target, 'drawing-poi');
      
      if (lineEl || curveEl || labelTextEl || labelBgEl || poiEl) {
        e.preventDefault();
        e.stopPropagation();

        const g = findParentG(lineEl || curveEl || labelTextEl || labelBgEl || poiEl);
        const drawingId = g ? g.dataset.drawingId : null;
        const drawing = ns.state.drawings.find(d => d.id === drawingId);
        if (!drawing) return;

        // Seç
        ns.state.selectedDrawingId = drawing.id;
        ns.state.selectedIds.clear();
        ns.state.sidePanelVisible = true;
        ns.renderSidePanel();
        ns.renderDrawings();

        // Ctrl+Drag = Kopyala
        if (e.ctrlKey) {
          const clone = JSON.parse(JSON.stringify(drawing));
          clone.id = 'draw-' + Date.now();
          ns.state.drawings.push(clone);
          ns.pushHistory('copyDrawing');
          ns.state.selectedDrawingId = clone.id;

          dragState = {
            type: 'move',
            drawing: clone,
            startX: e.clientX,
            startY: e.clientY
          };
          return;
        }

        // Normal drag
        dragState = {
          type: 'move',
          drawing,
          startX: e.clientX,
          startY: e.clientY
        };
      }
    });

    document.addEventListener('mousemove', e => {
      if (!dragState) return;
      if (ns.state.mode !== 'editor') return;

      const viewportRect = ns.dom.viewport.getBoundingClientRect();
      const dx = ((e.clientX - dragState.startX) / viewportRect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / viewportRect.height) * 100;

      if (dragState.type === 'label') {
        // Label drag - pixel cinsinden offset
        const dxPixel = e.clientX - dragState.startX;
        const dyPixel = e.clientY - dragState.startY;
        
        dragState.drawing.labelOffsetX = dragState.initialOffsetX + dxPixel;
        dragState.drawing.labelOffsetY = dragState.initialOffsetY + dyPixel;
        
        ns.renderDrawings();
        
      } else if (dragState.type === 'text') {
        // Text drag
        dragState.text.x = dragState.initialX + dx;
        dragState.text.y = dragState.initialY + dy;
        
        ns.renderDrawings();
        
      } else if (dragState.type === 'handle') {
        const { drawing, handleType, pointIndex } = dragState;
        
        if (drawing.type === 'line') {
          const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
          const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;

          if (handleType === 'start') {
            drawing.x1 = Math.max(0, Math.min(100, relX));
            drawing.y1 = Math.max(0, Math.min(100, relY));
          } else if (handleType === 'end') {
            drawing.x2 = Math.max(0, Math.min(100, relX));
            drawing.y2 = Math.max(0, Math.min(100, relY));
          }
        } else if ((drawing.type === 'curve' || drawing.type === 'polygon') && handleType === 'point' && pointIndex !== null) {
          const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
          const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;
          
          drawing.points[pointIndex].x = Math.max(0, Math.min(100, relX));
          drawing.points[pointIndex].y = Math.max(0, Math.min(100, relY));
        } else if (drawing.type === 'label' && handleType === 'label') {
          const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
          const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;
          
          drawing.x = Math.max(0, Math.min(100, relX));
          drawing.y = Math.max(0, Math.min(100, relY));
        } else if (drawing.type === 'poi' && handleType === 'poi') {
          const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
          const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;
          
          drawing.x = Math.max(0, Math.min(100, relX));
          drawing.y = Math.max(0, Math.min(100, relY));
        }

        ns.renderDrawings();
        
      } else if (dragState.type === 'move') {
        const { drawing } = dragState;

        if (drawing.type === 'line') {
          drawing.x1 = Math.max(0, Math.min(100, drawing.x1 + dx));
          drawing.y1 = Math.max(0, Math.min(100, drawing.y1 + dy));
          drawing.x2 = Math.max(0, Math.min(100, drawing.x2 + dx));
          drawing.y2 = Math.max(0, Math.min(100, drawing.y2 + dy));
        } else if (drawing.type === 'curve' || drawing.type === 'polygon') {
          drawing.points.forEach(p => {
            p.x = Math.max(0, Math.min(100, p.x + dx));
            p.y = Math.max(0, Math.min(100, p.y + dy));
          });
        } else if (drawing.type === 'label') {
          drawing.x = Math.max(0, Math.min(100, drawing.x + dx));
          drawing.y = Math.max(0, Math.min(100, drawing.y + dy));
        } else if (drawing.type === 'poi') {
          drawing.x = Math.max(0, Math.min(100, drawing.x + dx));
          drawing.y = Math.max(0, Math.min(100, drawing.y + dy));
        }

        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        ns.renderDrawings();
      }
    });

    document.addEventListener('mouseup', () => {
      if (dragState) {
        if (dragState.type === 'handle') {
          ns.pushHistory('resizeDrawing');
        } else if (dragState.type === 'move') {
          ns.pushHistory('moveDrawing');
        } else if (dragState.type === 'label') {
          ns.pushHistory('moveLabel');
        } else if (dragState.type === 'text') {
          ns.pushHistory('moveText');
        }
        dragState = null;
      }
    });
    
    // Text drag
    textLayer.addEventListener('mousedown', e => {
      if (ns.state.mode !== 'editor') return;
      if (ns.state.panMode) return;
      if (ns.state.drawMode) return;
      
      const textEl = e.target.closest('.draw-text');
      if (textEl) {
        const textId = textEl.dataset.id;
        const text = ns.state.texts.find(t => t.id === textId);
        if (text) {
          e.preventDefault();
          dragState = {
            type: 'text',
            text,
            startX: e.clientX,
            startY: e.clientY,
            initialX: text.x,
            initialY: text.y
          };
        }
      }
    });
    
    // Görüntüleme modunda drawing'e tıklama
    drawingLayer.addEventListener('click', e => {
      if (ns.state.mode === 'editor') return; // Editor modunda mousedown kullanılıyor
      
      // Drawing-line, drawing-curve, or drawing-poi'ye tıklanmış mı?
      if (e.target.classList.contains('drawing-line') || 
          e.target.classList.contains('drawing-curve') ||
          e.target.classList.contains('drawing-poi')) {
        const g = findParentG(e.target);
        if (g && g.dataset.drawingId) {
          const drawingId = g.dataset.drawingId;
          const drawing = ns.state.drawings.find(d => d.id === drawingId);
          
          if (drawing) {
            ns.state.selectedDrawingId = drawingId;
            ns.state.sidePanelVisible = true;
            ns.renderDrawings();
            ns.renderSidePanel();
          }
        }
      }
    });
  };

})(window.EPP = window.EPP || {});
