(function(ns){
  // NCR (Non-Conformance Report) Constants
  
  ns.NCR_TYPES = [
    { code: 'STC', label: 'Structural (Yapısal)' },
    { code: 'ARC', label: 'Architectural (Mimari)' },
    { code: 'İSG', label: 'Occupational Health & Safety (İş Güvenliği)' },
    { code: 'ELK', label: 'Electrical (Elektrik)' },
    { code: 'MEK', label: 'Mechanical (Mekanik)' }
  ];
  
  // NCR Location Patterns - Single source of truth
  ns.NCR_LOCATION_PATTERNS = {
    ADA: {
      id: 'ADA',
      label: 'ADA <X>',
      requires: ['ada'],
      build: (values) => `ADA ${values.ada}`
    },
    ADA_BLOCK: {
      id: 'ADA_BLOCK',
      label: 'ADA <X> - <BLOCK> BLOK',
      requires: ['ada', 'blok'],
      build: (values) => `ADA ${values.ada} - ${values.blok} BLOK`
    },
    ADA_PARSEL: {
      id: 'ADA_PARSEL',
      label: 'ADA <X> - PARSEL <Y>',
      requires: ['ada', 'parsel'],
      build: (values) => `ADA ${values.ada} - PARSEL ${values.parsel}`
    },
    ADA_PARSEL_BLOK: {
      id: 'ADA_PARSEL_BLOK',
      label: 'ADA <X> - PARSEL <Y> - <BLOK> BLOK',
      requires: ['ada', 'parsel', 'blok'],
      build: (values) => `ADA ${values.ada} - PARSEL ${values.parsel} - ${values.blok} BLOK`
    }
  };
  
  // Get allowed patterns based on ADA number
  ns.getAllowedLocationPatterns = function(adaNumber) {
    const ada = String(adaNumber || '').trim();
    
    if (ada === '1') {
      // ADA 1: Allow ADA and ADA_BLOCK (no PARSEL required)
      // Also allow PARSEL patterns if they exist
      return ['ADA', 'ADA_BLOCK', 'ADA_PARSEL', 'ADA_PARSEL_BLOK'];
    } else if (ada === '2') {
      // ADA 2: MUST have PARSEL, cannot be plain ADA
      // Only allow PARSEL-based patterns
      return ['ADA_PARSEL', 'ADA_PARSEL_BLOK'];
    } else {
      // Other ADAs: Allow all patterns
      return Object.keys(ns.NCR_LOCATION_PATTERNS);
    }
  };
  
  // Render dynamic label based on current values
  ns.renderLocationLabel = function(patternId, values) {
    const pattern = ns.NCR_LOCATION_PATTERNS[patternId];
    if (!pattern) return '';
    
    let label = pattern.label;
    
    // Replace placeholders with actual values
    if (values.ada) {
      label = label.replace('<X>', values.ada);
    }
    if (values.parsel) {
      label = label.replace('<Y>', values.parsel);
    }
    if (values.blok) {
      label = label.replace('<BLOK>', values.blok);
    }
    
    return label;
  };
  
  // NCR Code Generator
  // Format: NCR-KHM-<ContractorCode>-<ContractorShort>-<TypeCode>-<NCRNumber>
  ns.generateNCRCode = function(params) {
    const {
      contractorCode = '',
      contractorShort = '',
      typeCode = '',
      ncrNumber = 1
    } = params;
    
    // Pad NCR number to 3 digits
    const paddedNumber = String(ncrNumber).padStart(3, '0');
    
    return `NCR-KHM-${contractorCode}-${contractorShort}-${typeCode}-${paddedNumber}`;
  };
  
})(window.EPP = window.EPP || {});
