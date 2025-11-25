(function(ns){
  const { hexToRgba } = ns.utils;

  /**
   * Render all hotspots on the canvas
   */
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

      // Work type highlighting
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

      // Labels
      if (ns.state.showLabels) {
        const label = document.createElement('div');
        label.className = 'hotspot-label';
        label.textContent = ns.buildHotspotLabel(h);
        el.appendChild(label);
      }

      // Resize handles in editor mode
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

    // Also render drawings if function exists
    if (typeof ns.renderDrawings === 'function') {
      ns.renderDrawings();
    }
  };
})(window.EPP = window.EPP || {});
