(function (ns) {
  // Kat bazlı kalemleri dinamik olarak oluştur
  ns.generateKatKalemleri = function(katSayisi) {
    const katKalemleri = [];
    for (let i = 1; i <= katSayisi; i++) {
      katKalemleri.push(
        { id: `kat_${i}_kolon_perde`, label: `${i}. Kat Kolon/Perde` },
        { id: `kat_${i}_kiris`,       label: `${i}. Kat Kiriş` },
        { id: `kat_${i}_doseme`,      label: `${i}. Kat Döşeme` }
      );
    }
    return katKalemleri;
  };

  // İlk başta varsayılan 10 kat ile WORK_GROUPS oluştur
  ns.initializeWorkGroups = function(katSayisi = 10) {
    const katKalemleri = ns.generateKatKalemleri(katSayisi);
    
    ns.WORK_GROUPS = [
      {
        id: 'kaba',
        label: 'KABA İMALATLARI',
        items: [
          { id: 'kazi', label: 'Kazı İmalatları' },
          { id: 'kazik', label: 'Kazık İmalatları' },
          { id: 'muhendislik_dolgusu', label: 'Mühendislik Dolgusu İmalatları' },
          { id: 'grobeton', label: 'Grobeton İmalatları' },
          { id: 'temel_alti_yalitim', label: 'Temel Altı Yalıtım İmalatları' },
          { id: 'temel', label: 'Temel İmalatları' },
          { id: 'tunnel_kalip', label: 'Tünel Kalıp İmalatları' },
          ...katKalemleri,
          { id: 'balkon_parapet', label: 'Balkon Topuk / Parapet İmalatları' },
          { id: 'merdiven', label: 'Merdiven İmalatları' },
          { id: 'cati_parapeti_asansor_kulesi', label: 'Çatı Parapeti ve Asansör Kulesi İmalatları' },
          { id: 'kapama_perdeleri', label: 'Kapama / Kuranglez Perdeleri İmalatları' },
          { id: 'baca', label: 'Baca İmalatları' },
          { id: 'perde_izolasyonu', label: 'Perde İzolasyonu İmalatları' },
          { id: 'drenaj', label: 'Drenaj İmalatları' },
          { id: 'cati_koruma_betonu', label: 'Çatı Koruma Betonu İmalatları' },
          { id: 'cati_yalitim', label: 'Çatı Yalıtım İmalatları' }
        ]
      },
      {
        id: 'ic_mekan',
        label: 'İÇ MEKAN İNCE İMALATLARI',
        items: [
          { id: 'duvar', label: 'Duvar İmalatları' },
          { id: 'ic_mekan_kara_siva', label: 'İç Mekan Kara Sıva İmalatları' },
          { id: 'alci_siva', label: 'Kaba Karışık Alçı Sıva İmalatları' },
          { id: 'saten_alci', label: 'Saten Alçı İmalatları' },
          { id: 'kor_kasa', label: 'Kör Kasa Montajları' },
          { id: 'sap', label: 'Şap İmalatları' },
          { id: 'mermer', label: 'Mermer İmalatları' },
          { id: 'seramik', label: 'Seramik İmalatları' },
          { id: 'vitrifiye', label: 'Vitrifiye Montajları' }
        ]
      },
      {
        id: 'dis_cephe',
        label: 'DIŞ CEPHE İNCE İMALATLARI',
        items: [
          { id: 'iskele', label: 'Dış Cephe İskele İmalatları' },
          { id: 'dis_cephe_kara_siva', label: 'Dış Cephe Kara Sıva İmalatları' },
          { id: 'mantolama', label: 'Mantolama İmalatları' },
          { id: 'mineral_siva', label: 'Mineral Sıva İmalatları' },
          { id: 'dograma', label: 'Dış Cephe Doğrama Montajları' },
          { id: 'dis_cephe_boya', label: 'Dış Cephe Boya İmalatları' },
          { id: 'bina_giris_dogramalari', label: 'Bina Giriş Doğramaları' },
          { id: 'merdiven_korkuluk', label: 'Merdiven Korkulukları' },
          { id: 'balkon_korkuluk', label: 'Balkon Korkulukları' }
        ]
      }
    ];

    ns.ALL_WORK_ITEMS = ns.WORK_GROUPS.flatMap(group => group.items);
  };

  // İlk başta initialize et
  ns.initializeWorkGroups();

  // Kalıp türüne göre filtrelenmiş WORK_GROUPS döndür
  ns.getFilteredWorkGroups = function() {
    const formworkType = (ns.state && ns.state.projectInfo && ns.state.projectInfo.formworkType) 
      ? ns.state.projectInfo.formworkType 
      : 'TÜNEL';
    
    return ns.WORK_GROUPS.map(group => {
      const filteredItems = group.items.filter(item => {
        // Tünel Kalıp İmalatları - sadece TÜNEL veya HİBRİT'te göster
        if (item.id === 'tunnel_kalip') {
          return formworkType === 'TÜNEL' || formworkType === 'HİBRİT';
        }
        
        // Kat bazlı kalemler (kolon/perde, kiriş, döşeme) - sadece KONVANSİYONEL veya HİBRİT'te göster
        if (item.id.startsWith('kat_') && 
            (item.id.includes('kolon_perde') || item.id.includes('kiris') || item.id.includes('doseme'))) {
          return formworkType === 'KONVANSİYONEL' || formworkType === 'HİBRİT';
        }
        
        // Diğer tüm imalatlar her zaman göster
        return true;
      });
      
      return {
        ...group,
        items: filteredItems
      };
    }).filter(group => group.items.length > 0); // Boş grupları çıkar
  };
  
  // Filtrelenmiş tüm iş kalemlerini al
  ns.getFilteredWorkItems = function() {
    return ns.getFilteredWorkGroups().flatMap(group => group.items);
  };

  ns.STATUS_OPTIONS = [
    { value: 'veri_girilmedi', label: 'Veri Girilmedi' },
    { value: 'baslamadi', label: 'Başlamadı' },
    { value: 'baslayabilir', label: 'Başlayabilir' },
    { value: 'devam_ediyor', label: 'Devam Ediyor' },
    { value: 'tamamlandi', label: 'Tamamlandı' }
  ];
})(window.EPP = window.EPP || {});
