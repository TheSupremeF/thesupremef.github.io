(function(ns){
  
  /**
   * Export issue to NCR Excel
   * This is the SINGLE function used from both sidepanel and block-edit
   */
  ns.exportIssueToNcrExcel = async function(hotspotId, issueId) {
    try {
      // Find hotspot and issue
      const hotspot = ns.getHotspot(hotspotId);
      if (!hotspot) {
        alert('Blok bulunamadı');
        return;
      }
      
      const issue = hotspot.issues ? hotspot.issues.find(i => i.id === issueId) : null;
      if (!issue) {
        alert('İmalat sorunu bulunamadı');
        return;
      }
      
      // Validate required fields
      const errors = [];
      
      if (!ns.state.projectInfo.name) errors.push('Proje adı girilmemiş');
      if (!ns.state.projectInfo.contractor) errors.push('Yüklenici girilmemiş');
      if (!ns.state.projectInfo.contractorCode) errors.push('Yüklenici kodu girilmemiş');
      if (!ns.state.projectInfo.contractorShort) errors.push('Yüklenici kısa adı girilmemiş');
      
      if (!issue.ncrType) errors.push('NCR tipi seçilmemiş');
      if (!issue.ncrNumber) errors.push('NCR numarası girilmemiş');
      if (!issue.description || !issue.description.trim()) errors.push('Açıklama girilmemiş');
      
      // Validate location pattern
      if (!issue.locationPattern) {
        errors.push('Konum bilgisi seçilmemiş');
      } else {
        const pattern = ns.NCR_LOCATION_PATTERNS[issue.locationPattern];
        if (!pattern) {
          errors.push('Geçersiz konum pattern\'i');
        } else {
          // Check required fields for pattern
          pattern.requires.forEach(field => {
            if (!hotspot[field] || String(hotspot[field]).trim() === '') {
              errors.push(`Konum bilgisi eksik: ${field}`);
            }
          });
          
          // Business rule: ADA 2 MUST have PARSEL
          const adaNumber = String(hotspot.ada || '').trim();
          if (adaNumber === '2') {
            if (issue.locationPattern === 'ADA' || issue.locationPattern === 'ADA_BLOCK') {
              errors.push('ADA 2 için PARSEL bilgisi zorunludur');
            }
            if (!hotspot.parsel || String(hotspot.parsel).trim() === '') {
              errors.push('ADA 2 için PARSEL girilmemiş');
            }
          }
        }
      }
      
      if (errors.length > 0) {
        alert('NCR oluşturulamadı. Eksik alanlar:\n\n' + errors.join('\n'));
        return;
      }
      
      // Load NCR template
      const response = await fetch('./data/NCR.xlsx');
      if (!response.ok) {
        throw new Error('NCR şablonu yüklenemedi');
      }
      
      const templateBlob = await response.blob();
      
      // Prepare NCR data from issue
      const ncrData = {
        type: issue.ncrType || 'STC',
        ncrNumber: issue.ncrNumber || 1,
        createdDate: issue.createdDate || new Date().toISOString().split('T')[0],
        description: issue.description || '',
        photos: issue.photos || [],
        controlEngineer: {
          name: issue.controlEngineerName || '',
          date: issue.controlEngineerDate || ''
        },
        controlChief: {
          name: issue.controlChiefName || '',
          date: issue.controlChiefDate || ''
        }
      };
      
      // Build location based on selected pattern
      let location = '';
      const pattern = ns.NCR_LOCATION_PATTERNS[issue.locationPattern];
      
      if (pattern) {
        location = pattern.build({
          ada: hotspot.ada,
          parsel: hotspot.parsel,
          blok: hotspot.blok
        });
      } else {
        // Fallback to full label if pattern not found
        location = ns.buildHotspotLabel(hotspot);
      }
      
      // Patch Excel
      const patcher = new NCRExcelPatcher();
      const blob = await patcher.patch(templateBlob, ncrData, ns.state.projectInfo, location);
      
      // Generate NCR code for filename
      const ncrCode = ns.generateNCRCode({
        contractorCode: ns.state.projectInfo.contractorCode,
        contractorShort: ns.state.projectInfo.contractorShort,
        typeCode: ncrData.type,
        ncrNumber: ncrData.ncrNumber
      });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ncrCode}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('NCR export error:', err);
      alert('NCR Excel oluşturulamadı:\n\n' + err.message);
    }
  };
  
})(window.EPP = window.EPP || {});
