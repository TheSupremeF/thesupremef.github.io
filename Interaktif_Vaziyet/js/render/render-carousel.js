(function(ns){
  /**
   * Image gallery state for modal navigation
   */
  let currentGallery = [];
  let currentGalleryIndex = 0;

  /**
   * Open detail image modal with gallery navigation
   */
  ns.openDetailImageModal = function(src, gallery = null, startIndex = 0) {
    const { detailImageOverlay, detailImageLarge, detailImageDialog } = ns.dom || {};
    if (!detailImageOverlay || !detailImageLarge) return;
    
    // Setup gallery if provided
    if (gallery && Array.isArray(gallery) && gallery.length > 0) {
      currentGallery = gallery;
      currentGalleryIndex = startIndex;
    } else {
      currentGallery = [src];
      currentGalleryIndex = 0;
    }
    
    // Show current image
    detailImageLarge.src = currentGallery[currentGalleryIndex];
    detailImageOverlay.style.display = 'flex';
    
    // Add navigation controls if not already present
    updateModalNavigation();
  };

  /**
   * Update modal navigation controls
   */
  function updateModalNavigation() {
    const { detailImageDialog } = ns.dom || {};
    if (!detailImageDialog) return;
    
    // Remove existing controls
    const existingNav = detailImageDialog.querySelector('.modal-image-nav');
    if (existingNav) existingNav.remove();
    
    const existingCounter = detailImageDialog.querySelector('.modal-image-counter');
    if (existingCounter) existingCounter.remove();
    
    // Only add controls if there are multiple images
    if (currentGallery.length <= 1) return;
    
    // Create navigation container
    const nav = document.createElement('div');
    nav.className = 'modal-image-nav';
    nav.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      align-items: center;
      z-index: 1001;
    `;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀';
    prevBtn.style.cssText = `
      background: rgba(0,0,0,0.7);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(-1);
    });
    nav.appendChild(prevBtn);
    
    // Counter
    const counter = document.createElement('div');
    counter.className = 'modal-image-counter';
    counter.style.cssText = `
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 13px;
      border: 1px solid rgba(255,255,255,0.3);
    `;
    counter.textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
    nav.appendChild(counter);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '▶';
    nextBtn.style.cssText = `
      background: rgba(0,0,0,0.7);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(1);
    });
    nav.appendChild(nextBtn);
    
    detailImageDialog.appendChild(nav);
  }

  /**
   * Navigate through gallery
   */
  function navigateGallery(direction) {
    const { detailImageLarge } = ns.dom || {};
    if (!detailImageLarge || currentGallery.length <= 1) return;
    
    currentGalleryIndex += direction;
    
    // Wrap around
    if (currentGalleryIndex < 0) {
      currentGalleryIndex = currentGallery.length - 1;
    } else if (currentGalleryIndex >= currentGallery.length) {
      currentGalleryIndex = 0;
    }
    
    // Update image
    detailImageLarge.src = currentGallery[currentGalleryIndex];
    
    // Update counter
    const counter = document.querySelector('.modal-image-counter');
    if (counter) {
      counter.textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
    }
  }

  /**
   * Setup keyboard navigation
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      const { detailImageOverlay } = ns.dom || {};
      if (!detailImageOverlay || detailImageOverlay.style.display !== 'flex') return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateGallery(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateGallery(1);
      } else if (e.key === 'Escape') {
        detailImageOverlay.style.display = 'none';
      }
    });
  }

  // Initialize keyboard navigation once
  if (typeof ns._keyboardNavInitialized === 'undefined') {
    setupKeyboardNavigation();
    ns._keyboardNavInitialized = true;
  }

  // Alias for compatibility - now with gallery support
  ns.showDetailImage = ns.openDetailImageModal;

  /**
   * Render a carousel component with multiple images
   */
  ns.renderCarousel = function(container, images) {
    if (!images || images.length === 0) return;
    
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    const inner = document.createElement('div');
    inner.className = 'carousel-inner';
    
    // Create carousel items
    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
      
      const imgEl = document.createElement('img');
      imgEl.src = img.url;
      imgEl.addEventListener('click', () => {
        // Pass all carousel images as gallery
        const gallery = images.map(i => i.url);
        ns.openDetailImageModal(img.url, gallery, idx);
      });
      item.appendChild(imgEl);
      
      if (img.caption && img.caption.trim() !== '') {
        const caption = document.createElement('div');
        caption.className = 'carousel-caption';
        caption.textContent = img.caption;
        item.appendChild(caption);
      }
      
      inner.appendChild(item);
    });
    
    carousel.appendChild(inner);
    
    // Controls for multiple images
    if (images.length > 1) {
      const controls = document.createElement('div');
      controls.className = 'carousel-controls';
      
      // Indicators
      const indicators = document.createElement('div');
      indicators.className = 'carousel-indicators';
      
      images.forEach((_, idx) => {
        const indicator = document.createElement('div');
        indicator.className = 'carousel-indicator' + (idx === 0 ? ' active' : '');
        indicator.addEventListener('click', () => {
          const items = inner.querySelectorAll('.carousel-item');
          const inds = indicators.querySelectorAll('.carousel-indicator');
          items.forEach((it, i) => {
            it.classList.toggle('active', i === idx);
            inds[i].classList.toggle('active', i === idx);
          });
        });
        indicators.appendChild(indicator);
      });
      
      // Previous button
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '◀';
      prevBtn.addEventListener('click', () => {
        const items = Array.from(inner.querySelectorAll('.carousel-item'));
        const activeIdx = items.findIndex(it => it.classList.contains('active'));
        const newIdx = activeIdx === 0 ? items.length - 1 : activeIdx - 1;
        items.forEach((it, i) => it.classList.toggle('active', i === newIdx));
        const inds = indicators.querySelectorAll('.carousel-indicator');
        inds.forEach((ind, i) => ind.classList.toggle('active', i === newIdx));
      });
      
      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.textContent = '▶';
      nextBtn.addEventListener('click', () => {
        const items = Array.from(inner.querySelectorAll('.carousel-item'));
        const activeIdx = items.findIndex(it => it.classList.contains('active'));
        const newIdx = (activeIdx + 1) % items.length;
        items.forEach((it, i) => it.classList.toggle('active', i === newIdx));
        const inds = indicators.querySelectorAll('.carousel-indicator');
        inds.forEach((ind, i) => ind.classList.toggle('active', i === newIdx));
      });
      
      controls.appendChild(prevBtn);
      controls.appendChild(indicators);
      controls.appendChild(nextBtn);
      carousel.appendChild(controls);
    }
    
    container.appendChild(carousel);
  };
})(window.EPP = window.EPP || {});
