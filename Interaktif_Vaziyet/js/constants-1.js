(function (ns) {
  const KAT_SAYISI = 10;

  // 1–10. kat için:
  // "x. Kat Kolon/Perde"
  // "x. Kat Kiriş"
  // "x. Kat Döşeme"
  const katKalemleri = [];
  for (let i = 1; i <= KAT_SAYISI; i++) {
    katKalemleri.push(
      { id: `kat_${i}_kolon_perde`, label: `${i}. Kat Kolon/Perde` },
      { id: `kat_${i}_kiris`,       label: `${i}. Kat Kiriş` },
      { id: `kat_${i}_doseme`,      label: `${i}. Kat Döşeme` }
    );
  }

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
        { id: 'cati_yalitim', label: 'Çatı Yalıtım İmalatları' },
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

  ns.STATUS_OPTIONS = [
    { value: 'veri_girilmedi', label: 'Veri Girilmedi' },
    { value: 'baslamadi', label: 'Başlamadı' },
    { value: 'baslayabilir', label: 'Başlayabilir' },
    { value: 'devam_ediyor', label: 'Devam Ediyor' },
    { value: 'tamamlandi', label: 'Tamamlandı' }
  ];
})(window.EPP = window.EPP || {});
