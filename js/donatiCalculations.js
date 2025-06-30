function drawDonatiWithSpacing(adet, spacing) {
  const placementDiv = document.getElementById('placementDiv');
  placementDiv.innerHTML = '';

  const targetDiameter = document.getElementById("target").value;

  for (let i = 0; i < 2; i++) {
    // Donatıyı saran wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('donati-wrapper');

    // Donatı dairesi
    const circle = document.createElement('div');
    circle.classList.add('donati-circle');

    // Çap oku çizgisi
    const line = document.createElement('div');
    line.classList.add('diameter-line');

    // Çap yazısı
    const text = document.createElement('div');
    text.classList.add('diameter-text');
    text.textContent = `⌀${targetDiameter}`;

    // Yapıya ekle
    wrapper.appendChild(circle);
    wrapper.appendChild(line);
    wrapper.appendChild(text);
    placementDiv.appendChild(wrapper);

    if (i < 2) {
      const spacingLine = document.createElement('div');
      spacingLine.classList.add('spacing-line');

      const label = document.createElement('span');
      label.classList.add('spacing-label');
      label.textContent = spacing.toFixed(0) + ' cm';

      if (i === 0) {
        label.style.display = 'block';
        spacingLine.style.backgroundColor = 'var(--border-color)';

        const tickLeft = document.createElement('div');
        const tickRight = document.createElement('div');
        const lineLeft = document.createElement('div');
        const lineRight = document.createElement('div');

        tickLeft.style.cssText = `
          position: absolute;
          left: 0;
          top: 50%;
          width: 1px;
          height: 8px;
          background-color: var(--border-color);
          transform: translateY(-50%) rotate(45deg);
        `;
        tickRight.style.cssText = `
          position: absolute;
          right: 0;
          top: 50%;
          width: 1px;
          height: 8px;
          background-color: var(--border-color);
          transform: translateY(-50%) rotate(45deg);
        `;
        lineLeft.style.cssText = `
          position: absolute;
          left: 0;
          top: 50%;
          width: 1px;
          height: 8px;
          background-color: var(--border-color);
          transform: translateY(-50%);
        `;
        lineRight.style.cssText = `
          position: absolute;
          right: 0;
          top: 50%;
          width: 1px;
          height: 8px;
          background-color: var(--border-color);
          transform: translateY(-50%);
        `;

        spacingLine.style.position = 'relative';
        spacingLine.appendChild(tickLeft);
        spacingLine.appendChild(tickRight);
        spacingLine.appendChild(lineLeft);
        spacingLine.appendChild(lineRight);
      } else {
        label.style.display = 'none';
        spacingLine.style.backgroundColor = 'transparent';
      }

      spacingLine.appendChild(label);
      placementDiv.appendChild(spacingLine);
    }
  }
}

function calculate() {
  const d1 = parseFloat(document.getElementById("source").value);
  const adet = parseFloat(document.getElementById("count").value);
  const d2 = parseFloat(document.getElementById("target").value);
  const length = parseFloat(document.getElementById("length").value);

  if (adet <= 0 || isNaN(adet)) {
    document.getElementById("result").textContent = "Lütfen geçerli bir adet girin.";
    return;
  }

  const alan1 = donatiAlan(d1);
  const alan2 = donatiAlan(d2);
  const toplamAlan = adet * alan1;
  const esitAdet = Math.ceil(toplamAlan / alan2);

  let resultText = `${adet} adet Ø${d1} donatı, ${esitAdet} adet Ø${d2} donatıyı sağlar.`;

  let spacing = null;

  if (length && length > 0 && esitAdet > 1) {
    const d2cm = d2 / 10;
    const sumD = d2cm * esitAdet;
    const spacingRaw = (length - sumD) / (esitAdet - 1);

    if (spacingRaw > 0) {
      spacing = Math.ceil(spacingRaw * 10) / 10; // 1 ondalık basamak yuvarlama
      resultText += `\nDonatı aralığı: ${spacing.toFixed(0)} cm.`;
    }

    if (window.debug === true) {
      console.log("Kaynak çap (d1):", d1);
      console.log("Kaynak adet:", adet);
      console.log("Hedef çap (d2):", d2);
      console.log("Hedef adet (yaklaşık):", esitAdet);
      console.log("Uzunluk:", length);
      console.log("spacingRaw:", spacingRaw.toFixed(2));
    }
  }

  document.getElementById("result").textContent = resultText;

  // Donatı çizimini yapalım (eğer spacing hesaplandıysa)
  if (spacing !== null) {
    drawDonatiWithSpacing(esitAdet, spacing);
  } else {
    // spacing yoksa temizle
    document.getElementById('placementDiv').innerHTML = '';
  }
}

// Rho hesaplama
function calculateRho() {
  const b = parseFloat(document.getElementById("b").value);
  const d = parseFloat(document.getElementById("d").value);
  const tip = document.getElementById("eleman").value;

  if (!b || !d || b <= 0 || d <= 0) {
    document.getElementById("rhoResult").textContent = "Geçerli boyutlar girin.";
    return;
  }

  let rhomin = 0, rhomax = 0;

  if (tip === "kolon") {
    rhomin = 0.01;
    rhomax = 0.04;
  } else if (tip === "kiris") {
    rhomin = 0.0025;
    rhomax = 0.04;
  } else if (tip === "doseme") {
    rhomin = 0.0015;
    rhomax = 0.02;
  }

  const As_min = rhomin * b * d;
  const As_max = rhomax * b * d;

  document.getElementById("rhoResult").innerHTML = `
    <p>ρ<sub>min</sub>: ${(rhomin * 100).toFixed(2)}% &nbsp;&nbsp;&nbsp;→ A<sub>s,min</sub>: ${As_min.toFixed(2)} mm²</p>
    <p>ρ<sub>max</sub>: ${(rhomax * 100).toFixed(2)}% &nbsp;&nbsp;&nbsp;→ A<sub>s,max</sub>: ${As_max.toFixed(2)} mm²</p>
  `;
}

// Kenetlenme ve bindirme hesaplama
function calculateOverlap() {
  const fyk = parseFloat(document.getElementById("fyk").value);
  const gamma_s = 1.15;
  const fyd = fyk / gamma_s;

  const fck = parseFloat(document.getElementById("fck").value);
  const fctm = 0.3 * Math.pow(fck, 2 / 3);
  const fctd = fctm / 1.5;

  const d_overlapJ = parseFloat(document.getElementById("d_overlap").value);
  if (isNaN(d_overlapJ) || d_overlapJ <= 0) {
    alert("Geçerli bir donatı çapı girin (sadece sayı, mm cinsinden).");
    return;
  }

  const r = 0.3;
  const lOverlapU = 0.12 * (fyd / fctd) * d_overlapJ;
  const minLb = 20 * d_overlapJ;
  const lOverlap = Math.max(lOverlapU, minLb);
  const lBindirme = 1.4 * (1 + 0.5 * r) * lOverlap;

  const resultText_o = `Kenetlenme boyu: ${(lOverlap / 10).toFixed(1)} cm, minimum bindirme boyu: ${(lBindirme / 10).toFixed(1)} cm.`;
  document.getElementById("resultO").textContent = resultText_o;

  if (window.debug) {
    console.log("🔍 calculateOverlap() debug:");
    console.log("D_bindirme:", d_overlapJ);
    console.log("fctd:", fctd.toFixed(2));
    console.log("fyd:", fyd.toFixed(2));
    console.log("Hesaplanan kenetlenme:", lOverlapU.toFixed(1));
    console.log("Minimum kenetlenme (20ϕ):", minLb.toFixed(1));
    console.log('%cKenetlenme: %c%s cm', 'font-weight: bold;', 'font-weight: normal;', (lOverlap / 10).toFixed(1));
    console.log('%cBindirme: %c%s cm', 'font-weight: bold;', 'font-weight: normal;', (lBindirme / 10).toFixed(1));
  }
}
