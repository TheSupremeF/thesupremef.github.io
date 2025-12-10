(function(ns){
  ns.utils = ns.utils || {};

  ns.utils.snapPercent = function(val){
    // Grid snap hassasiyetini settings'ten al
    const settings = ns.state && ns.state.settings ? ns.state.settings : {};
    const gridSize = settings.gridSize || 100;
    const baseGrid = ns.state && ns.state.grid ? ns.state.grid : 1;
    
    // gridSize yüzdesi kadar snap hassasiyeti
    // 100% = normal, 50% = daha hassas (daha küçük grid), 200% = daha gevşek
    const effectiveGrid = baseGrid * (gridSize / 100);
    
    return Math.round(val / effectiveGrid) * effectiveGrid;
  };

  ns.utils.hexToRgba = function(hex, alpha) {
    if (!hex) return `rgba(37,99,235,${alpha})`;
    let c = hex.replace('#','');
    if (c.length === 3) {
      c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    }
    if (c.length !== 6) return `rgba(37,99,235,${alpha})`;
    const r = parseInt(c.slice(0,2),16);
    const g = parseInt(c.slice(2,4),16);
    const b = parseInt(c.slice(4,6),16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(37,99,235,${alpha})`;
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  ns.utils.dataUrlToParts = function(dataUrl) {
    const parts = String(dataUrl).split(',');
    if (parts.length !== 2) {
      return { mime: 'application/octet-stream', base64: '' };
    }
    const header = parts[0];
    const data = parts[1];
    const m = header.match(/^data:(.*?);base64$/);
    const mime = m ? m[1] : 'application/octet-stream';
    return { mime, base64: data };
  };

  ns.utils.mimeToExt = function(mime) {
    if (!mime) return '.bin';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
    if (mime === 'image/webp') return '.webp';
    return '.bin';
  };

  ns.utils.sanitizeFilename = function(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'item';
  };

  ns.utils.formatDateTime = function(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds());
  };

  // PIN helpers
  ns.utils.readPin = function(container) {
    if (!container) return '';
    const inputs = container.querySelectorAll('.pin-box');
    let pin = '';
    inputs.forEach(input => {
      const v = (input.value || '').replace(/\D/g, '');
      if (v) pin += v.charAt(0);
    });
    return pin;
  };

  ns.utils.setPin = function(container, pin) {
    if (!container) return;
    const inputs = container.querySelectorAll('.pin-box');
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].value = pin && pin[i] ? pin[i] : '';
    }
  };

  ns.utils.clearPin = function(container) {
    ns.utils.setPin(container, '');
  };

  ns.utils.focusFirstPin = function(container) {
    if (!container) return;
    const first = container.querySelector('.pin-box');
    if (first) first.focus();
  };

  ns.utils.setupPinAutoAdvance = function(container) {
    if (!container) return;
    const inputs = Array.from(container.querySelectorAll('.pin-box'));
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => {
        let v = (input.value || '').replace(/\D/g, '');
        if (v.length > 1) v = v.charAt(0);
        input.value = v;
        if (v && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1].focus();
        }
        if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault();
          inputs[idx - 1].focus();
        }
        if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
          e.preventDefault();
          inputs[idx + 1].focus();
        }
      });
    });
  };
})(window.EPP = window.EPP || {});