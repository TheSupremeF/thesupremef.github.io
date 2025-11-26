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

    if (projectInfoBtn && projectInfoOverlay) {
      projectInfoBtn.addEventListener('click', () => {
        if (ns.state.mode !== 'editor') return;
        const info = ns.state.projectInfo || { name: '', contractor: '', contractorCode: '', contractorShort: '' };
        if (projectNameInput) projectNameInput.value = info.name || '';
        if (projectContractorInput) projectContractorInput.value = info.contractor || '';
        if (projectContractorCodeInput) projectContractorCodeInput.value = info.contractorCode || '';
        if (projectContractorShortInput) projectContractorShortInput.value = info.contractorShort || '';
        projectInfoOverlay.style.display = 'flex';
        setTimeout(() => {
          if (projectNameInput) projectNameInput.focus();
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
        ns.state.projectInfo = { name, contractor, contractorCode, contractorShort };
        ns.updateProjectNameLabel();
        projectInfoOverlay.style.display = 'none';
      });
    }
  }


  ns.wireOverlays = wireOverlays;
  ns.wirePasswordOverlays = wirePasswordOverlays;
  ns.wireProjectInfoOverlay = wireProjectInfoOverlay;
})(window.EPP = window.EPP || {});
