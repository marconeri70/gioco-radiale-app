
const sfere = [0, -2, -4, 2, 4];
let lastResults = [];

function calcola() {
  const irMin = parseFloat(document.getElementById("irMin").value);
  const irMax = parseFloat(document.getElementById("irMax").value);
  const orMin = parseFloat(document.getElementById("orMin").value);
  const orMax = parseFloat(document.getElementById("orMax").value);
  const offset = parseFloat(document.getElementById("offset").value);
  const grMin = parseFloat(document.getElementById("grMin").value);
  const grMax = parseFloat(document.getElementById("grMax").value);
  const grTarget = (grMin + grMax) / 2;

  const onlyValid = document.getElementById("onlyValid").checked;
  const tbody = document.querySelector("#tabellaRisultati tbody");
  tbody.innerHTML = "";
  lastResults = [];

  // genera tutte le combinazioni, step 1 µm
  for (let ir = irMin; ir <= irMax; ir += 1) {
    for (let or = orMin; or <= orMax; or += 1) {
      for (let sfera of sfere) {
        const gr = or - ir + sfera + offset;
        const valido = gr >= grMin && gr <= grMax;
        const row = { ir, or, sfera, offset, gr, valido };
        lastResults.push(row);
      }
    }
  }

  // trova la distanza minima dal target tra le valide
  const validOnly = lastResults.filter(r => r.valido);
  const closest = validOnly.length
    ? validOnly.reduce((a,b) => Math.abs(a.gr - grTarget) <= Math.abs(b.gr - grTarget) ? a : b)
    : null;

  // render tabella
  for (const r of lastResults) {
    if (onlyValid && !r.valido) continue;
    const tr = document.createElement("tr");
    if (closest && r.ir === closest.ir && r.or === closest.or && r.sfera === closest.sfera && r.offset === closest.offset)
      tr.classList.add("ideal");
    tr.innerHTML = `
      <td>${r.ir}</td>
      <td>${r.or}</td>
      <td>${r.sfera}</td>
      <td>${r.offset.toFixed(1)}</td>
      <td>${r.gr.toFixed(2)}</td>
      <td class="${r.valido ? 'ok' : 'not-ok'}">${r.valido ? '✔️' : '❌'}</td>
    `;
    tbody.appendChild(tr);
  }

  // aggiorna cruscotto
  document.getElementById("dashValid").textContent = validOnly.length;
  document.getElementById("dashTarget").textContent = grTarget.toFixed(2);
  if (validOnly.length) {
    const irVals = validOnly.map(r => r.ir);
    const orVals = validOnly.map(r => r.or);
    const sfVals = validOnly.map(r => r.sfera);
    const min = arr => Math.min(...arr);
    const max = arr => Math.max(...arr);
    document.getElementById("dashIR").textContent = `${min(irVals)} – ${max(irVals)} µm`;
    document.getElementById("dashOR").textContent = `${min(orVals)} – ${max(orVals)} µm`;
    document.getElementById("dashSfere").textContent = `${min(sfVals)} – ${max(sfVals)} µm`;
  } else {
    document.getElementById("dashIR").textContent = "–";
    document.getElementById("dashOR").textContent = "–";
    document.getElementById("dashSfere").textContent = "–";
  }
}

function exportCSV() {
  const validOnly = lastResults.filter(r => r.valido);
  if (!validOnly.length) {
    alert("Nessuna combinazione valida da esportare.");
    return;
  }
  const header = "IR,OR,Sfera,Offset,GR,Valido\n";
  const rows = validOnly
    .map(r => [r.ir, r.or, r.sfera, r.offset.toFixed(1), r.gr.toFixed(3), r.valido ? "OK" : "KO"].join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "combinazioni_valide.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// listeners
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCalcola").addEventListener("click", calcola);
  document.getElementById("btnCSV").addEventListener("click", exportCSV);
  document.getElementById("onlyValid").addEventListener("change", calcola);
  // prima esecuzione
  calcola();
});
