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
        rhomin = 0.002; // yaklaşık
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
		const fydJ = parseFloat(document.getElementById("fyd").value);
		const fctdJ = parseFloat(document.getElementById("fctd").value);
		const d_overlapJ = parseFloat(document.getElementById("d_overlap").value);
		
		const lOverlap = (0.12*(fydJ/fctdJ)*d_overlapJ)/10;
		
		let resultText_o = `Kenetlenme boyu ${lOverlap.toFixed(1)} cm'dir.`;
		document.getElementById("resultO").textContent = resultText_o;
		
	}
    function switchTab(tabId) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }
