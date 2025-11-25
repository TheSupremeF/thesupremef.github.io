(function(ns){
  /**
   * Render all drawings and text overlays
   */
  ns.renderDrawings = function() {
    const { drawingLayer, textLayer } = ns.dom || {};
    if (!drawingLayer || !textLayer) return;

    // Clear existing drawings
    drawingLayer.innerHTML = '';

    // Render lines and curves
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

    // Clear and render text overlays
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

  /**
   * Render preview of drawing in progress
   */
  ns.renderDrawingPreview = function(drawingState) {
    const { drawingLayer } = ns.dom || {};
    if (!drawingLayer) return;

    // First render existing drawings
    ns.renderDrawings();

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
