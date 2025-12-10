(function(ns){
  const { formatDateTime } = ns.utils;

  /**
   * Update mode toggle UI (viewer/editor buttons)
   */
  ns.updateModeToggleUI = function() {
    const { modeToggle } = ns.dom || {};
    if (!modeToggle) return;
    const viewerBtn = modeToggle.querySelector('button[data-mode="viewer"]');
    const editorBtn = modeToggle.querySelector('button[data-mode="editor"]');
    if (!viewerBtn || !editorBtn) return;
    viewerBtn.classList.toggle('active', ns.state.mode === 'viewer');
    editorBtn.classList.toggle('active', ns.state.mode === 'editor');
  };

  /**
   * Update last export timestamp label
   */
  ns.updateLastExportLabel = function() {
    const { lastExportLabel } = ns.dom || {};
    if (!lastExportLabel) return;
    if (!ns.state.lastExportAt) {
      lastExportLabel.textContent = 'Son kayıt: -';
    } else {
      lastExportLabel.textContent = 'Son kayıt: ' + formatDateTime(ns.state.lastExportAt);
    }
  };

  /**
   * Update project name label in header
   */
  ns.updateProjectNameLabel = function() {
    const { projectNameLabel } = ns.dom || {};
    if (!projectNameLabel) return;
    const name = ns.state.projectInfo && ns.state.projectInfo.name
      ? ns.state.projectInfo.name.trim()
      : '';
    if (!name) {
      projectNameLabel.style.display = 'none';
      projectNameLabel.textContent = '';
    } else {
      projectNameLabel.style.display = 'inline-flex';
      projectNameLabel.textContent = name;
    }
  };

  /**
   * Apply mode change (viewer/editor) and update UI
   */
  ns.applyMode = function(newMode) {
    ns.state.mode = newMode;
    ns.updateModeToggleUI();
    const { mainImageWrapper, passwordSettingsBtn, projectInfoBtn, settingsBtn } = ns.dom || {};
    const drawToolbar = document.getElementById('drawToolbar');
    
    if (mainImageWrapper) {
      mainImageWrapper.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (drawToolbar) {
      drawToolbar.style.display = newMode === 'editor' ? 'flex' : 'none';
    }
    if (passwordSettingsBtn) {
      passwordSettingsBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (projectInfoBtn) {
      projectInfoBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    if (settingsBtn) {
      settingsBtn.style.display = newMode === 'editor' ? 'inline-flex' : 'none';
    }
    ns.renderHotspots();
    ns.renderSidePanel();
    ns.renderDrawings();
  };
})(window.EPP = window.EPP || {});
