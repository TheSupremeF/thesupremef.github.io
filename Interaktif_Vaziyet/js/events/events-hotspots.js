(function(ns){
  const { snapPercent } = ns.utils;

  function wireHotspotInteractions() {
    const { hotspotLayer, canvasWrapper, mainImage, drawingLayer, textLayer } = ns.dom;

    let dragState = null;
    let drawState = null;
    let lineDrawing = null;
    let curveDrawing = null;
    let selectedDrawing = null;

    canvasWrapper.addEventListener('click', e => {
      if (lineDrawing || curveDrawing) return;
      
      if (!e.target.closest('.hotspot') && 
          !e.target.closest('.draw-text') &&
          !e.target.closest('line') &&
          !e.target.closest('path')) {
        ns.state.selectedIds.clear();
        ns.state.showSummary = false;
        ns.state.sidePanelVisible = false;
        selectedDrawing = null;
        ns.renderHotspots();
        ns.renderSidePanel();
      }
    });

    canvasWrapper.addEventListener('mousedown', e => {
      if (ns.state.mode !== 'editor') return;
      if (ns.state.panMode) return;
      
      if (e.target.closest('.hotspot') || e.target.closest('.draw-text')) return;

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
        curveDrawing = {
          points: [{ x: relX, y: relY }],
          isDrawing: true
        };
        e.stopPropagation();
        e.preventDefault();
      } else if (ns.state.drawMode === 'text') {
        const textDiv = document.createElement('div');
        textDiv.className = 'draw-text editing';
        textDiv.contentEditable = true;
        textDiv.style.left = relX + '%';
        textDiv.style.top = relY + '%';
        textDiv.style.minWidth = '50px';
        textDiv.textContent = 'Metin';
        textLayer.appendChild(textDiv);
        
        textDiv.focus();
        document.execCommand('selectAll', false, null);
        
        textDiv.addEventListener('blur', () => {
          const text = textDiv.textContent.trim();
          if (text) {
            ns.state.texts = ns.state.texts || [];
            ns.state.texts.push({
              id: 'text-' + Date.now(),
              x: relX,
              y: relY,
              text: text,
              color: '#eab308',
              fontSize: 14
            });
            ns.pushHistory('addText');
          }
          textDiv.remove();
          ns.renderDrawings();
        });
        
        textDiv.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textDiv.blur();
          }
          if (e.key === 'Escape') {
            textDiv.remove();
          }
        });
        
        ns.state.drawMode = null;
        ns.dom.addTextBtn.classList.remove('toggle-active');
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
        
        drawingLayer.innerHTML = '';
        ns.state.drawings.forEach(d => {
          if (d.type === 'line') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', d.x1 + '%');
            line.setAttribute('y1', d.y1 + '%');
            line.setAttribute('x2', d.x2 + '%');
            line.setAttribute('y2', d.y2 + '%');
            line.setAttribute('stroke', d.color || '#eab308');
            line.setAttribute('stroke-width', d.width || 2);
            line.style.cursor = 'pointer';
            drawingLayer.appendChild(line);
          } else if (d.type === 'curve') {
            if (d.points && d.points.length > 1) {
              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              let pathD = `M ${d.points[0].x} ${d.points[0].y}`;
              for (let i = 1; i < d.points.length; i++) {
                pathD += ` L ${d.points[i].x} ${d.points[i].y}`;
              }
              path.setAttribute('d', pathD);
              path.setAttribute('stroke', d.color || '#eab308');
              path.setAttribute('stroke-width', d.width || 2);
              path.setAttribute('fill', 'none');
              path.style.cursor = 'pointer';
              drawingLayer.appendChild(path);
            }
          }
        });
        
        const previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('x1', lineDrawing.startX + '%');
        previewLine.setAttribute('y1', lineDrawing.startY + '%');
        previewLine.setAttribute('x2', lineDrawing.endX + '%');
        previewLine.setAttribute('y2', lineDrawing.endY + '%');
        previewLine.setAttribute('stroke', '#eab308');
        previewLine.setAttribute('stroke-width', '2');
        previewLine.setAttribute('opacity', '0.6');
        previewLine.setAttribute('stroke-dasharray', '5,5');
        drawingLayer.appendChild(previewLine);
      }
      
      if (curveDrawing && curveDrawing.isDrawing) {
        const viewportRect = ns.dom.viewport.getBoundingClientRect();
        const relX = ((e.clientX - viewportRect.left) / viewportRect.width) * 100;
        const relY = ((e.clientY - viewportRect.top) / viewportRect.height) * 100;
        
        const lastPoint = curveDrawing.points[curveDrawing.points.length - 1];
        const dist = Math.sqrt(Math.pow(relX - lastPoint.x, 2) + Math.pow(relY - lastPoint.y, 2));
        if (dist > 0.5) {
          curveDrawing.points.push({ x: relX, y: relY });
        }
        
        drawingLayer.innerHTML = '';
        ns.state.drawings.forEach(d => {
          if (d.type === 'line') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', d.x1 + '%');
            line.setAttribute('y1', d.y1 + '%');
            line.setAttribute('x2', d.x2 + '%');
            line.setAttribute('y2', d.y2 + '%');
            line.setAttribute('stroke', d.color || '#eab308');
            line.setAttribute('stroke-width', d.width || 2);
            line.style.cursor = 'pointer';
            drawingLayer.appendChild(line);
          } else if (d.type === 'curve') {
            if (d.points && d.points.length > 1) {
              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              let pathD = `M ${d.points[0].x} ${d.points[0].y}`;
              for (let i = 1; i < d.points.length; i++) {
                pathD += ` L ${d.points[i].x} ${d.points[i].y}`;
              }
              path.setAttribute('d', pathD);
              path.setAttribute('stroke', d.color || '#eab308');
              path.setAttribute('stroke-width', d.width || 2);
              path.setAttribute('fill', 'none');
              path.style.cursor = 'pointer';
              drawingLayer.appendChild(path);
            }
          }
        });
        
        if (curveDrawing.points.length > 1) {
          const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          let pathD = `M ${curveDrawing.points[0].x} ${curveDrawing.points[0].y}`;
          for (let i = 1; i < curveDrawing.points.length; i++) {
            pathD += ` L ${curveDrawing.points[i].x} ${curveDrawing.points[i].y}`;
          }
          previewPath.setAttribute('d', pathD);
          previewPath.setAttribute('stroke', '#eab308');
          previewPath.setAttribute('stroke-width', '2');
          previewPath.setAttribute('fill', 'none');
          previewPath.setAttribute('opacity', '0.6');
          drawingLayer.appendChild(previewPath);
        }
      }
    });

    document.addEventListener('mouseup', e => {
      if (lineDrawing) {
        ns.state.drawings = ns.state.drawings || [];
        ns.state.drawings.push({
          id: 'draw-' + Date.now(),
          type: 'line',
          x1: lineDrawing.startX,
          y1: lineDrawing.startY,
          x2: lineDrawing.endX,
          y2: lineDrawing.endY,
          color: '#eab308',
          width: 2
        });
        ns.pushHistory('addLine');
        lineDrawing = null;
        ns.renderDrawings();
        ns.state.drawMode = null;
        ns.dom.drawLineBtn.classList.remove('toggle-active');
      }
      
      if (curveDrawing) {
        curveDrawing.isDrawing = false;
        if (curveDrawing.points.length > 1) {
          ns.state.drawings = ns.state.drawings || [];
          ns.state.drawings.push({
            id: 'draw-' + Date.now(),
            type: 'curve',
            points: curveDrawing.points,
            color: '#eab308',
            width: 2
          });
          ns.pushHistory('addCurve');
        }
        curveDrawing = null;
        ns.renderDrawings();
        ns.state.drawMode = null;
        ns.dom.drawCurveBtn.classList.remove('toggle-active');
      }
    });

    drawingLayer.addEventListener('click', e => {
      if (ns.state.mode !== 'editor') return;
      
      const line = e.target.closest('line');
      const path = e.target.closest('path');
      
      if (line || path) {
        const idx = Array.from(drawingLayer.children).indexOf(line || path);
        if (idx >= 0 && idx < ns.state.drawings.length) {
          selectedDrawing = ns.state.drawings[idx];
          
          if (confirm('Bu çizimi silmek ister misiniz?')) {
            ns.state.drawings.splice(idx, 1);
            ns.pushHistory('deleteDrawing');
            ns.renderDrawings();
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
