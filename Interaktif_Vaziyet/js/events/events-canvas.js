(function(ns){

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

  function wireZoomPan() {
    const { canvasWrapper } = ns.dom;

    let spacePressed = false;
    let wasPanModeBefore = false;

    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && !spacePressed) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          return;
        }
        e.preventDefault();
        spacePressed = true;
        wasPanModeBefore = ns.state.panMode;
        if (!ns.state.panMode) {
          ns.state.panMode = true;
          ns.dom.panModeBtn.classList.add('toggle-active');
        }
      }
    });

    document.addEventListener('keyup', e => {
      if (e.code === 'Space' && spacePressed) {
        e.preventDefault();
        spacePressed = false;
        if (!wasPanModeBefore) {
          ns.state.panMode = false;
          ns.dom.panModeBtn.classList.remove('toggle-active');
        }
      }
    });

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


  ns.wireMainImageLoad = wireMainImageLoad;
  ns.wireZoomPan = wireZoomPan;
})(window.EPP = window.EPP || {});
