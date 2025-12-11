(function(ns){
  /**
   * Render all drawings and text overlays
   */
  ns.renderDrawings = function() {
    const { drawingLayer, textLayer, viewport } = ns.dom || {};
    if (!drawingLayer || !textLayer) return;

    // SVG boyutlarını viewport'a göre ayarla
    const vw = viewport.offsetWidth;
    const vh = viewport.offsetHeight;
    drawingLayer.setAttribute('width', vw);
    drawingLayer.setAttribute('height', vh);

    // Clear existing drawings BUT preserve curve preview elements
    // (curve preview points should persist until curve is finalized/cancelled)
    const elementsToRemove = Array.from(drawingLayer.children).filter(el => {
      return !el.classList.contains('curve-preview-point') &&
             !el.classList.contains('curve-preview-path') &&
             !el.classList.contains('curve-preview-label');
    });
    elementsToRemove.forEach(el => el.remove());

    // Render lines and curves
    if (ns.state.drawings && Array.isArray(ns.state.drawings)) {
      ns.state.drawings.forEach((drawing, idx) => {
        const isSelected = drawing.id === ns.state.selectedDrawingId;
        const isEditor = ns.state.mode === 'editor';
        
        if (drawing.type === 'line') {
          // Create group for line + handles + label
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.dataset.drawingId = drawing.id;
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (drawing.x1 * vw / 100) + '');
          line.setAttribute('y1', (drawing.y1 * vh / 100) + '');
          line.setAttribute('x2', (drawing.x2 * vw / 100) + '');
          line.setAttribute('y2', (drawing.y2 * vh / 100) + '');
          line.setAttribute('stroke', drawing.color || '#eab308');
          line.setAttribute('stroke-width', isSelected ? (drawing.width || 2) + 2 : drawing.width || 2);
          line.setAttribute('opacity', isSelected ? '1' : '0.9');
          line.style.cursor = isEditor ? 'pointer' : 'default';
          line.style.pointerEvents = 'stroke';
          line.classList.add('drawing-line');
          g.appendChild(line);
          
          // Drag handles (sadece editor modda ve seçiliyse)
          if (isEditor && isSelected) {
            // Start handle
            const startHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            startHandle.setAttribute('cx', (drawing.x1 * vw / 100) + '');
            startHandle.setAttribute('cy', (drawing.y1 * vh / 100) + '');
            startHandle.setAttribute('r', '6');
            startHandle.setAttribute('fill', '#3b82f6');
            startHandle.setAttribute('stroke', '#fff');
            startHandle.setAttribute('stroke-width', '2');
            startHandle.style.cursor = 'move';
            startHandle.style.pointerEvents = 'auto';
            startHandle.classList.add('drawing-handle');
            startHandle.dataset.handleType = 'start';
            g.appendChild(startHandle);
            
            // End handle
            const endHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            endHandle.setAttribute('cx', (drawing.x2 * vw / 100) + '');
            endHandle.setAttribute('cy', (drawing.y2 * vh / 100) + '');
            endHandle.setAttribute('r', '6');
            endHandle.setAttribute('fill', '#3b82f6');
            endHandle.setAttribute('stroke', '#fff');
            endHandle.setAttribute('stroke-width', '2');
            endHandle.style.cursor = 'move';
            endHandle.style.pointerEvents = 'auto';
            endHandle.classList.add('drawing-handle');
            endHandle.dataset.handleType = 'end';
            g.appendChild(endHandle);
          }
          
          drawingLayer.appendChild(g);
          
        } else if (drawing.type === 'curve') {
          if (drawing.points && drawing.points.length > 1) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.dataset.drawingId = drawing.id;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Smooth curve using Catmull-Rom
            ns.renderSmoothCurve(path, drawing.points, drawing.color, drawing.width);
            
            path.setAttribute('stroke', drawing.color || '#eab308');
            path.setAttribute('stroke-width', isSelected ? (drawing.width || 2) + 2 : drawing.width || 2);
            path.setAttribute('fill', 'none');
            path.setAttribute('opacity', isSelected ? '1' : '0.9');
            path.style.cursor = isEditor ? 'pointer' : 'default';
            path.style.pointerEvents = 'stroke';
            path.classList.add('drawing-curve');
            g.appendChild(path);
            
            // Handles for curve points (sadece editor modda ve seçiliyse)
            if (isEditor && isSelected) {
              const vw = ns.dom.viewport.offsetWidth;
              const vh = ns.dom.viewport.offsetHeight;
              
              drawing.points.forEach((point, pIdx) => {
                const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                handle.setAttribute('cx', (point.x * vw / 100) + '');
                handle.setAttribute('cy', (point.y * vh / 100) + '');
                handle.setAttribute('r', '5');
                handle.setAttribute('fill', '#3b82f6');
                handle.setAttribute('stroke', '#fff');
                handle.setAttribute('stroke-width', '2');
                handle.style.cursor = 'move';
                handle.style.pointerEvents = 'auto';
                handle.classList.add('drawing-handle');
                handle.dataset.handleType = 'point';
                handle.dataset.pointIndex = pIdx;
                g.appendChild(handle);
                
                // Nokta numarası
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (point.x * vw / 100) + '');
                text.setAttribute('y', (point.y * vh / 100) + '');
                text.setAttribute('dx', '10');
                text.setAttribute('dy', '4');
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('font-size', '11');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('pointer-events', 'none');
                text.textContent = String(pIdx + 1);
                g.appendChild(text);
              });
            }
            
            drawingLayer.appendChild(g);
          }
        } else if (drawing.type === 'polygon') {
          if (drawing.points && drawing.points.length >= 3) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.dataset.drawingId = drawing.id;
            
            // Use SVG polygon element for proper closed shape with fill
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            
            // Build points string for polygon
            const pts = drawing.points;
            const pointsStr = pts.map(p => `${p.x * vw / 100},${p.y * vh / 100}`).join(' ');
            polygon.setAttribute('points', pointsStr);
            
            // Stroke (outline)
            polygon.setAttribute('stroke', drawing.strokeColor || drawing.color || '#a855f7');
            polygon.setAttribute('stroke-width', isSelected ? (drawing.width || 2) + 2 : drawing.width || 2);
            polygon.setAttribute('stroke-opacity', drawing.strokeOpacity !== undefined ? drawing.strokeOpacity : 1);
            
            // Fill
            polygon.setAttribute('fill', drawing.fillColor || '#a855f7');
            polygon.setAttribute('fill-opacity', drawing.fillOpacity !== undefined ? drawing.fillOpacity : 0.3);
            
            polygon.setAttribute('opacity', isSelected ? '1' : '0.9');
            polygon.style.cursor = isEditor ? 'pointer' : 'default';
            polygon.style.pointerEvents = 'auto';
            polygon.classList.add('drawing-curve'); // Reuse curve class for click handling
            g.appendChild(polygon);
            
            // Handles for polygon vertices (sadece editor modda ve seçiliyse)
            if (isEditor && isSelected) {
              drawing.points.forEach((point, pIdx) => {
                const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                handle.setAttribute('cx', (point.x * vw / 100) + '');
                handle.setAttribute('cy', (point.y * vh / 100) + '');
                handle.setAttribute('r', '5');
                handle.setAttribute('fill', '#a855f7');
                handle.setAttribute('stroke', '#fff');
                handle.setAttribute('stroke-width', '2');
                handle.style.cursor = 'move';
                handle.style.pointerEvents = 'auto';
                handle.classList.add('drawing-handle');
                handle.dataset.handleType = 'point';
                handle.dataset.pointIndex = pIdx;
                g.appendChild(handle);
                
                // Nokta numarası
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (point.x * vw / 100) + '');
                text.setAttribute('y', (point.y * vh / 100) + '');
                text.setAttribute('dx', '10');
                text.setAttribute('dy', '4');
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('font-size', '11');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('pointer-events', 'none');
                text.textContent = String(pIdx + 1);
                g.appendChild(text);
              });
            }
            
            drawingLayer.appendChild(g);
          }
        } else if (drawing.type === 'label') {
          // Label rendering
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.dataset.drawingId = drawing.id;
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (drawing.x * vw / 100) + '');
          text.setAttribute('y', (drawing.y * vh / 100) + '');
          text.setAttribute('fill', drawing.color || '#eab308');
          text.setAttribute('font-size', (drawing.fontSize || 14) + 'px');
          text.setAttribute('font-weight', drawing.fontWeight || 'normal');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.style.cursor = isEditor ? 'move' : 'default';
          text.style.pointerEvents = 'auto';
          text.style.userSelect = 'none';
          text.classList.add('drawing-label-text');
          text.textContent = drawing.text || 'Etiket';
          
          // Background for better visibility
          const bbox = text.getBBox ? null : null; // Will be set after append
          const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bg.setAttribute('fill', 'rgba(2, 6, 23, 0.7)');
          bg.setAttribute('rx', '4');
          bg.classList.add('drawing-label-bg');
          
          g.appendChild(bg);
          g.appendChild(text);
          drawingLayer.appendChild(g);
          
          // Set background size after text is in DOM
          requestAnimationFrame(() => {
            try {
              const bbox = text.getBBox();
              bg.setAttribute('x', (bbox.x - 4) + '');
              bg.setAttribute('y', (bbox.y - 2) + '');
              bg.setAttribute('width', (bbox.width + 8) + '');
              bg.setAttribute('height', (bbox.height + 4) + '');
            } catch (e) {
              // Fallback if getBBox fails
              const textX = drawing.x * vw / 100;
              const textY = drawing.y * vh / 100;
              bg.setAttribute('x', (textX - 30) + '');
              bg.setAttribute('y', (textY - 10) + '');
              bg.setAttribute('width', '60');
              bg.setAttribute('height', '20');
            }
          });
          
          // Handle for dragging (small circle when selected)
          if (isEditor && isSelected) {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('cx', (drawing.x * vw / 100) + '');
            handle.setAttribute('cy', (drawing.y * vh / 100) + '');
            handle.setAttribute('r', '4');
            handle.setAttribute('fill', '#eab308');
            handle.setAttribute('stroke', '#fff');
            handle.setAttribute('stroke-width', '2');
            handle.style.cursor = 'move';
            handle.style.pointerEvents = 'auto';
            handle.classList.add('drawing-handle');
            handle.dataset.handleType = 'label';
            g.appendChild(handle);
          }
        } else if (drawing.type === 'poi') {
          // POI rendering - simple circle marker
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.dataset.drawingId = drawing.id;
          
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', (drawing.x * vw / 100) + '');
          circle.setAttribute('cy', (drawing.y * vh / 100) + '');
          circle.setAttribute('r', (drawing.radius || 8) + '');
          circle.setAttribute('fill', drawing.fillColor || '#3b82f6');
          circle.setAttribute('fill-opacity', drawing.fillOpacity !== undefined ? drawing.fillOpacity : 0.3);
          circle.setAttribute('stroke', drawing.strokeColor || '#3b82f6');
          circle.setAttribute('stroke-width', isSelected ? '3' : '2');
          circle.setAttribute('stroke-opacity', drawing.strokeOpacity !== undefined ? drawing.strokeOpacity : 1);
          circle.style.cursor = isEditor ? 'move' : 'default';
          circle.style.pointerEvents = 'auto';
          circle.classList.add('drawing-poi');
          
          g.appendChild(circle);
          drawingLayer.appendChild(g);
          
          // Handle for dragging (visible only when selected)
          if (isEditor && isSelected) {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('cx', (drawing.x * vw / 100) + '');
            handle.setAttribute('cy', (drawing.y * vh / 100) + '');
            handle.setAttribute('r', '4');
            handle.setAttribute('fill', '#3b82f6');
            handle.setAttribute('stroke', '#fff');
            handle.setAttribute('stroke-width', '2');
            handle.style.cursor = 'move';
            handle.style.pointerEvents = 'auto';
            handle.classList.add('drawing-handle');
            handle.dataset.handleType = 'poi';
            g.appendChild(handle);
          }
        }
      });
      
      // Labels (etiket butonu aktifse)
      if (ns.state.showLabels) {
        const vw = ns.dom.viewport.offsetWidth;
        const vh = ns.dom.viewport.offsetHeight;
        const isEditor = ns.state.mode === 'editor';
        
        ns.state.drawings.forEach(drawing => {
          if (!drawing.title) return;
          
          let labelX, labelY;
          
          if (drawing.type === 'line') {
            // Çizginin orta noktası
            labelX = ((drawing.x1 + drawing.x2) / 2) * vw / 100;
            labelY = ((drawing.y1 + drawing.y2) / 2) * vh / 100;
          } else if (drawing.type === 'curve' && drawing.points && drawing.points.length > 0) {
            // Eğrinin orta noktası
            const midIdx = Math.floor(drawing.points.length / 2);
            labelX = drawing.points[midIdx].x * vw / 100;
            labelY = drawing.points[midIdx].y * vh / 100;
          } else if (drawing.type === 'polygon' && drawing.points && drawing.points.length > 0) {
            // Poligonun merkez noktası (centroid)
            let sumX = 0, sumY = 0;
            drawing.points.forEach(p => {
              sumX += p.x;
              sumY += p.y;
            });
            labelX = (sumX / drawing.points.length) * vw / 100;
            labelY = (sumY / drawing.points.length) * vh / 100;
          }
          
          // Offset ekle (kullanıcı drag ile taşımışsa)
          if (drawing.labelOffsetX !== undefined) labelX += drawing.labelOffsetX;
          if (drawing.labelOffsetY !== undefined) labelY += drawing.labelOffsetY;
          
          if (labelX !== undefined && labelY !== undefined) {
            // Background rectangle (label için arka plan)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            
            // Önce text'i oluştur ki boyutunu ölçebilelim
            label.setAttribute('x', labelX + '');
            label.setAttribute('y', labelY + '');
            label.setAttribute('fill', '#e5e7eb');
            label.setAttribute('font-size', '11');
            label.setAttribute('font-weight', '600');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('pointer-events', isEditor ? 'auto' : 'none'); // Editor modunda tıklanabilir
            label.style.cursor = isEditor ? 'move' : 'default';
            label.classList.add('drawing-label');
            label.dataset.drawingId = drawing.id;
            label.textContent = drawing.title;
            
            // Text'i önce ekle ki bbox hesaplayabilelim
            drawingLayer.appendChild(label);
            
            // Text boyutunu al
            const bbox = label.getBBox();
            
            // Arka plan rectangle
            rect.setAttribute('x', (bbox.x - 4) + '');
            rect.setAttribute('y', (bbox.y - 2) + '');
            rect.setAttribute('width', (bbox.width + 8) + '');
            rect.setAttribute('height', (bbox.height + 4) + '');
            rect.setAttribute('fill', 'rgba(15, 23, 42, 0.96)');
            rect.setAttribute('stroke', '#374151');
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('rx', '4');
            rect.setAttribute('pointer-events', isEditor ? 'auto' : 'none');
            rect.style.cursor = isEditor ? 'move' : 'default';
            rect.classList.add('drawing-label-bg');
            rect.dataset.drawingId = drawing.id;
            
            // Rectangle'ı text'in arkasına ekle
            drawingLayer.insertBefore(rect, label);
          }
        });
      }
    }

    // Clear and render text overlays
    textLayer.innerHTML = '';
    
    // Set pointer-events based on mode
    const isEditor = ns.state.mode === 'editor';
    textLayer.style.pointerEvents = isEditor ? 'auto' : 'none';

    if (ns.state.texts && Array.isArray(ns.state.texts)) {
      
      ns.state.texts.forEach(text => {
        const textEl = document.createElement('div');
        textEl.className = 'draw-text';
        textEl.textContent = text.text;
        textEl.style.left = text.x + '%';
        textEl.style.top = text.y + '%';
        textEl.style.color = text.color || '#eab308';
        textEl.style.fontSize = (text.fontSize || 14) + 'px';
        textEl.style.cursor = isEditor ? 'move' : 'default';
        textEl.style.pointerEvents = isEditor ? 'auto' : 'none';
        textEl.dataset.id = text.id;
        textLayer.appendChild(textEl);
      });
    }
  };

  /**
   * Render preview of drawing in progress
   */
  ns.renderDrawingPreview = function(drawingState) {
    const { drawingLayer } = ns.dom || {};
    if (!drawingLayer) return;

    // Önce eski preview'ları temizle (sadece preview class'ı olanları)
    const previews = drawingLayer.querySelectorAll('.drawing-preview');
    previews.forEach(p => p.remove());

    // Then add preview overlay
    if (drawingState.type === 'line' && drawingState.endX !== undefined) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', drawingState.startX + '%');
      line.setAttribute('y1', drawingState.startY + '%');
      line.setAttribute('x2', drawingState.endX + '%');
      line.setAttribute('y2', drawingState.endY + '%');
      line.setAttribute('stroke', '#eab308');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.6');
      line.setAttribute('stroke-dasharray', '5,5');
      line.classList.add('drawing-preview');
      drawingLayer.appendChild(line);
    } else if (drawingState.type === 'curve' && drawingState.points && drawingState.points.length > 0) {
      const points = drawingState.points;
      
      // Noktaları göster (küçük daireler + numaralar)
      points.forEach((point, idx) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x + '%');
        circle.setAttribute('cy', point.y + '%');
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#ffcc00');
        circle.setAttribute('opacity', '0.9');
        circle.classList.add('drawing-preview');
        drawingLayer.appendChild(circle);
        
        // Nokta numarası
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', point.x + '%');
        text.setAttribute('y', point.y + '%');
        text.setAttribute('dx', '8');
        text.setAttribute('dy', '4');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', 'bold');
        text.textContent = String(idx + 1);
        text.classList.add('drawing-preview');
        drawingLayer.appendChild(text);
      });
      
      // Eğer 2+ nokta varsa çizgi çiz
      if (points.length >= 2) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Catmull-Rom smooth curve
        let d = `M ${points[0].x} ${points[0].y}`;
        
        if (points.length === 2) {
          // Sadece 2 nokta varsa düz çizgi
          d += ` L ${points[1].x} ${points[1].y}`;
        } else {
          // 3+ nokta varsa smooth curve
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = i === 0 ? points[0] : points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i + 2 < points.length ? points[i + 2] : points[points.length - 1];
            
            // Catmull-Rom to Bezier control points
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
          }
        }
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#eab308');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.6');
        path.setAttribute('stroke-dasharray', '5,5');
        path.setAttribute('pointer-events', 'stroke');
        path.classList.add('drawing-preview');
        drawingLayer.appendChild(path);
      }
    }
  };
  
  /**
   * Render smooth curve using Catmull-Rom spline
   */
  ns.renderSmoothCurve = function(path, points, color, width) {
    const vw = ns.dom.viewport.offsetWidth;
    const vh = ns.dom.viewport.offsetHeight;
    
    if (points.length === 2) {
      // Sadece 2 nokta varsa düz çizgi
      let d = `M ${points[0].x * vw / 100} ${points[0].y * vh / 100} L ${points[1].x * vw / 100} ${points[1].y * vh / 100}`;
      path.setAttribute('d', d);
      return;
    }
    
    // 3+ nokta için smooth Catmull-Rom curve
    let d = `M ${points[0].x * vw / 100} ${points[0].y * vh / 100}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : points[points.length - 1];
      
      // Catmull-Rom to Bezier control points
      const cp1x = (p1.x + (p2.x - p0.x) / 6) * vw / 100;
      const cp1y = (p1.y + (p2.y - p0.y) / 6) * vh / 100;
      const cp2x = (p2.x - (p3.x - p1.x) / 6) * vw / 100;
      const cp2y = (p2.y - (p3.y - p1.y) / 6) * vh / 100;
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x * vw / 100} ${p2.y * vh / 100}`;
    }
    
    path.setAttribute('d', d);
  };
})(window.EPP = window.EPP || {});
