    function donatiAlan(d) {
      return Math.PI * Math.pow(d, 2) / 4;
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

  if (length && length > 0 && esitAdet > 1) {
    const d2cm = d2 / 10;
    const sumD = d2cm * esitAdet;
    const spacingRaw = (length - sumD) / (esitAdet - 1);

    if (spacingRaw > 0) {
      const spacing = Math.ceil(spacingRaw).toFixed(1); // Yukarı yuvarla ve tek ondalık göster
      resultText += `\nDonatı aralığı: ${spacing} cm.`;
    }
  }

  document.getElementById("result").textContent = resultText;
}


    function calculateRho() {
      const b = parseFloat(document.getElementById("b").value);
      const d = parseFloat(document.getElementById("d").value);
      const tip = document.getElementById("eleman").value;

      if (!b || !d || b <= 0 || d <= 0) {
        document.getElementById("rhoResult").textContent = "Geçerli boyutlar girin.";
        return;
      }

      let rhomin = 0;
      let rhomax = 0;

      if (tip === "kolon") {
        rhomin = 0.01;
        rhomax = 0.04;
      } else if (tip === "kiris") {
        rhomin = 0.0025; // yaklaşık
        rhomax = 0.04;
      } else if (tip === "doseme") {
        rhomin = 0.0015;
        rhomax = 0.02;
      }

      const As_min = rhomin * b * d;
      const As_max = rhomax * b * d;

      document.getElementById("rhoResult").innerHTML = `
        <p>ρ<sub>min</sub>: ${(rhomin*100).toFixed(2)}% &nbsp;&nbsp;&nbsp;→ A<sub>s,min</sub>: ${As_min.toFixed(2)} mm²</p>
        <p>ρ<sub>max</sub>: ${(rhomax*100).toFixed(2)}% &nbsp;&nbsp;&nbsp;→ A<sub>s,max</sub>: ${As_max.toFixed(2)} mm²</p>
      `;
    }
	
function calculateOverlap() {
  const fyk = parseFloat(document.getElementById("fyk").value)
  const gamma_s = 1.15;
  const fyd = fyk / gamma_s;

  const fck = parseFloat(document.getElementById("fck").value);;
  const fctm = 0.3 * Math.pow(fck, 2 / 3);
  const fctd = fctm / 1.5;

  const d_overlapJ = parseFloat(document.getElementById("d_overlap").value);
  if (isNaN(d_overlapJ) || d_overlapJ <= 0) {
    alert("Geçerli bir donatı çapı girin (sadece sayı, mm cinsinden).");
    return;
  }

  const r = 0.3;

let lOverlap = 0.12 * (fyd / fctd) * d_overlapJ;
const lOverlapU = lOverlap;
const minLb = 20 * d_overlapJ;
lOverlap = Math.max(lOverlap, minLb); // ✅ burada güncelliyoruz

const lBindirme = 1.4 * (1 + 0.5 * r) * lOverlap;

const resultText_o = `Kenetlenme boyu: ${(lOverlap / 10).toFixed(1)} cm, minimum bindirme boyu: ${(lBindirme / 10).toFixed(1)} cm.`;

document.getElementById("resultO").textContent = resultText_o;


  console.log("D_bindirme:", d_overlapJ);
  console.log("fctd:", fctd.toFixed(2));
  console.log("fyd:", fyd.toFixed(2));
  console.log("Hesaplanan kenetlenme:", lOverlapU);
  console.log("Minimum kenetlenme (20ϕ):", minLb);
  console.log('%cKenetlenme: %c%s cm', 'font-weight: bold;', 'font-weight: normal;', (lOverlap / 10).toFixed(1));
  console.log('%cBindirme: %c%s cm', 'font-weight: bold;', 'font-weight: normal;', (lBindirme / 10).toFixed(1));

}


	
    function switchTab(tabId) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }
  window.addEventListener("DOMContentLoaded", () => {
    const appbar = document.querySelector(".appbar");
    if (appbar) {
      const height = appbar.offsetHeight;
      document.body.style.paddingTop = height + "px";
    }
  });
  
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  function activateTab(index) {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
    contents.forEach((content, i) => {
      content.classList.toggle('active', i === index);
    });
  }

  // Klavye ile sekme değiştirme
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const currentIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));

    if (['1', '2', '3', '4'].includes(key)) {
      const index = parseInt(key) - 1;
      if (index >= 0 && index < tabs.length) activateTab(index);
    }
  });

  // Mouse ile sekme tıklama
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      activateTab(i);
    });
  });
