(function(ns){
  const {
    readPin,
    setPin,
    clearPin,
    focusFirstPin,
    setupPinAutoAdvance
  } = ns.utils;

  function wireOverlays() {
    const { aboutBtn, aboutOverlay, detailImageOverlay, detailImageLarge } = ns.dom;

    if (aboutBtn && aboutOverlay) {
      aboutBtn.addEventListener('click', () => {
        aboutOverlay.style.display = 'flex';
      });
      aboutOverlay.addEventListener('click', e => {
        if (e.target === aboutOverlay) {
          aboutOverlay.style.display = 'none';
        }
      });
    }

    if (detailImageOverlay && detailImageLarge) {
      detailImageOverlay.addEventListener('click', e => {
        if (e.target === detailImageOverlay) {
          detailImageOverlay.style.display = 'none';
          detailImageLarge.src = '';
        }
      });
    }
  }

  function wirePasswordOverlays() {
    const {
      passwordSettingsBtn, passwordSettingsOverlay, passwordSettingsPin,
      passwordSettingsSave, passwordSettingsCancel,
      passwordPromptOverlay, passwordPromptPin,
      passwordPromptOk, passwordPromptCancel
    } = ns.dom;

    setupPinAutoAdvance(passwordSettingsPin);
    setupPinAutoAdvance(passwordPromptPin);

    let pendingModeAfterPassword = null;

    function openPasswordPrompt() {
      if (!passwordPromptOverlay || !passwordPromptPin) {
        const entered = window.prompt("Düzenleme PIN'ini girin:") || '';
        if (entered === ns.state.editorPassword) {
          ns.state.editorUnlocked = true;
          if (pendingModeAfterPassword) {
            ns.applyMode(pendingModeAfterPassword);
            pendingModeAfterPassword = null;
          }
        } else if (entered !== null) {
          alert('PIN hatalı.');
          pendingModeAfterPassword = null;
        }
        return;
      }
      clearPin(passwordPromptPin);
      passwordPromptOverlay.style.display = 'flex';
      setTimeout(() => focusFirstPin(passwordPromptPin), 10);
    }

    if (ns.dom.modeToggle) {
      ns.dom.modeToggle.addEventListener('click', e => {
        const btn = e.target.closest('button[data-mode]');
        if (!btn) return;
        const targetMode = btn.dataset.mode;
        if (!targetMode || targetMode === ns.state.mode) return;

        if (targetMode === 'viewer') {
          ns.applyMode('viewer');
          return;
        }

        if (targetMode === 'editor') {
          if (ns.state.editorPassword && !ns.state.editorUnlocked) {
            pendingModeAfterPassword = 'editor';
            openPasswordPrompt();
          } else {
            ns.applyMode('editor');
          }
        }
      });
    }

    if (passwordSettingsBtn && passwordSettingsOverlay) {
      passwordSettingsBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        if (passwordSettingsPin) {
          if (ns.state.editorPassword) {
            setPin(passwordSettingsPin, ns.state.editorPassword);
          } else {
            clearPin(passwordSettingsPin);
          }
        }
        passwordSettingsOverlay.style.display = 'flex';
        setTimeout(() => focusFirstPin(passwordSettingsPin), 10);
      });

      passwordSettingsCancel.addEventListener('click', () => {
        passwordSettingsOverlay.style.display = 'none';
      });

      passwordSettingsOverlay.addEventListener('click', e => {
        if (e.target === passwordSettingsOverlay) {
          passwordSettingsOverlay.style.display = 'none';
        }
      });

      passwordSettingsSave.addEventListener('click', () => {
        const newPin = readPin(passwordSettingsPin);
        if (newPin && newPin.length === 4) {
          ns.state.editorPassword = newPin;
          ns.state.editorUnlocked = false;
          alert("Düzenleme PIN'i ayarlandı.");
        } else {
          ns.state.editorPassword = '';
          ns.state.editorUnlocked = true;
          alert("Düzenleme PIN'i kaldırıldı.");
        }
        passwordSettingsOverlay.style.display = 'none';
      });
    }

    if (passwordPromptOverlay && passwordPromptPin) {
      passwordPromptCancel.addEventListener('click', () => {
        passwordPromptOverlay.style.display = 'none';
        pendingModeAfterPassword = null;
        ns.applyMode('viewer');
      });

      passwordPromptOverlay.addEventListener('click', e => {
        if (e.target === passwordPromptOverlay) {
          passwordPromptOverlay.style.display = 'none';
          pendingModeAfterPassword = null;
          ns.applyMode('viewer');
        }
      });

      passwordPromptOk.addEventListener('click', () => {
        const entered = readPin(passwordPromptPin);
        if (entered === ns.state.editorPassword) {
          ns.state.editorUnlocked = true;
          passwordPromptOverlay.style.display = 'none';
          if (pendingModeAfterPassword) {
            ns.applyMode(pendingModeAfterPassword);
            pendingModeAfterPassword = null;
          }
        } else {
          alert('PIN hatalı.');
          clearPin(passwordPromptPin);
          focusFirstPin(passwordPromptPin);
        }
      });
    }

    ns.openPasswordPrompt = openPasswordPrompt;
  }

  function wireProjectInfoOverlay() {
    const {
      projectInfoBtn, projectInfoOverlay, projectNameInput,
      projectContractorInput, projectInfoCancel, projectInfoSave
    } = ns.dom;
    
    const projectContractorCodeInput = document.getElementById('projectContractorCodeInput');
    const projectContractorShortInput = document.getElementById('projectContractorShortInput');
    const projectTypeSelect = document.getElementById('projectTypeSelect');
    const formworkTypeSelect = document.getElementById('formworkTypeSelect');
    const maxFloorsInput = document.getElementById('maxFloorsInput');

    if (projectInfoBtn && projectInfoOverlay) {
      projectInfoBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        const info = ns.state.projectInfo || { 
          name: '', 
          contractor: '', 
          contractorCode: '', 
          contractorShort: '',
          projectType: 'ETAP',
          formworkType: 'TÜNEL',
          maxFloors: 10
        };
        if (projectNameInput) projectNameInput.value = info.name || '';
        if (projectContractorInput) projectContractorInput.value = info.contractor || '';
        if (projectContractorCodeInput) projectContractorCodeInput.value = info.contractorCode || '';
        if (projectContractorShortInput) projectContractorShortInput.value = info.contractorShort || '';
        if (projectTypeSelect) projectTypeSelect.value = info.projectType || 'ETAP';
        if (formworkTypeSelect) formworkTypeSelect.value = info.formworkType || 'TÜNEL';
        if (maxFloorsInput) maxFloorsInput.value = info.maxFloors || 10;
        
        projectInfoOverlay.style.display = 'flex';
        setTimeout(() => {
          if (projectTypeSelect) projectTypeSelect.focus();
        }, 10);
      });

      projectInfoCancel.addEventListener('click', () => {
        projectInfoOverlay.style.display = 'none';
      });

      projectInfoOverlay.addEventListener('click', e => {
        if (e.target === projectInfoOverlay) {
          projectInfoOverlay.style.display = 'none';
        }
      });

      projectInfoSave.addEventListener('click', () => {
        const name = projectNameInput ? projectNameInput.value.trim() : '';
        const contractor = projectContractorInput ? projectContractorInput.value.trim() : '';
        const contractorCode = projectContractorCodeInput ? projectContractorCodeInput.value.trim() : '';
        const contractorShort = projectContractorShortInput ? projectContractorShortInput.value.trim() : '';
        const projectType = projectTypeSelect ? projectTypeSelect.value : 'ETAP';
        const formworkType = formworkTypeSelect ? formworkTypeSelect.value : 'TÜNEL';
        
        // maxFloors'u basit input'tan oku ve 1-99 arası sınırla
        let maxFloors = 10;
        if (maxFloorsInput) {
          maxFloors = parseInt(maxFloorsInput.value) || 10;
          maxFloors = Math.max(1, Math.min(99, maxFloors));
        }
        
        // Kat sayısı değiştiyse WORK_GROUPS'u yeniden oluştur
        const oldMaxFloors = ns.state.projectInfo.maxFloors || 10;
        if (maxFloors !== oldMaxFloors) {
          ns.initializeWorkGroups(maxFloors);
        }
        
        ns.state.projectInfo = { name, contractor, contractorCode, contractorShort, projectType, formworkType, maxFloors };
        ns.updateProjectNameLabel();
        
        // Proje türü veya kalıp türü değiştiğinde tüm UI'ı yeniden render et
        if (typeof ns.refreshWorkViewSelect === 'function') {
          ns.refreshWorkViewSelect();
        }
        ns.renderHotspots();
        ns.renderSidePanel();
        
        projectInfoOverlay.style.display = 'none';
      });
    }
  }


  function wireSettingsOverlay() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsCancel = document.getElementById('settingsCancel');
    const settingsSave = document.getElementById('settingsSave');
    const gridSizeInput = document.getElementById('gridSizeInput');
    const labelFontSizeInput = document.getElementById('labelFontSizeInput');
    const labelOffsetXInput = document.getElementById('labelOffsetXInput');
    const labelOffsetYInput = document.getElementById('labelOffsetYInput');

    if (settingsBtn && settingsOverlay) {
      settingsBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        
        const settings = ns.state.settings || {
          gridSize: 100,
          labelFontSize: 12,
          labelOffsetX: 0,
          labelOffsetY: -20
        };
        
        if (gridSizeInput) gridSizeInput.value = settings.gridSize || 100;
        if (labelFontSizeInput) labelFontSizeInput.value = settings.labelFontSize || 12;
        if (labelOffsetXInput) labelOffsetXInput.value = settings.labelOffsetX || 0;
        if (labelOffsetYInput) labelOffsetYInput.value = settings.labelOffsetY || -20;
        
        settingsOverlay.style.display = 'flex';
        setTimeout(() => {
          if (gridSizeInput) gridSizeInput.focus();
        }, 10);
      });

      settingsCancel.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
      });

      settingsOverlay.addEventListener('click', e => {
        if (e.target === settingsOverlay) {
          settingsOverlay.style.display = 'none';
        }
      });

      settingsSave.addEventListener('click', () => {
        const gridSize = gridSizeInput ? parseInt(gridSizeInput.value) || 100 : 100;
        const labelFontSize = labelFontSizeInput ? parseInt(labelFontSizeInput.value) || 12 : 12;
        const labelOffsetX = labelOffsetXInput ? parseInt(labelOffsetXInput.value) || 0 : 0;
        const labelOffsetY = labelOffsetYInput ? parseInt(labelOffsetYInput.value) || -20 : -20;
        
        // Sınırları kontrol et
        ns.state.settings = {
          gridSize: Math.max(25, Math.min(200, gridSize)),
          labelFontSize: Math.max(8, Math.min(24, labelFontSize)),
          labelOffsetX: Math.max(-100, Math.min(100, labelOffsetX)),
          labelOffsetY: Math.max(-100, Math.min(100, labelOffsetY))
        };
        
        // Grid değişirse hotspot'ları yeniden render et
        ns.renderHotspots();
        ns.renderSidePanel();
        
        settingsOverlay.style.display = 'none';
      });
    }
  }

  ns.wireOverlays = wireOverlays;
  ns.wirePasswordOverlays = wirePasswordOverlays;
  ns.wireProjectInfoOverlay = wireProjectInfoOverlay;
  ns.wireSettingsOverlay = wireSettingsOverlay;
})(window.EPP = window.EPP || {});
