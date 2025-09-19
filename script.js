
function calcola() {
  const irMin = parseFloat(document.getElementById("irMin").value);
  const irMax = parseFloat(document.getElementById("irMax").value);
  const orMin = parseFloat(document.getElementById("orMin").value);
  const orMax = parseFloat(document.getElementById("orMax").value);
  const offset = parseFloat(document.getElementById("offset").value);
  const grMin = parseFloat(document.getElementById("grMin").value);
  const grMax = parseFloat(document.getElementById("grMax").value);
  const sfere = [-4, -2, 0, 2, 4];

  const tbody = document.querySelector("#tabellaRisultati tbody");
  tbody.innerHTML = "";
  document.getElementById("btnCalcola").addEventListener("click", calcola);

  for (let ir = irMin; ir <= irMax; ir++) {
    for (let or = orMin; or <= orMax; or++) {
      for (let sfera of sfere) {
        const gr = or - ir + offset + sfera;
        const valido = gr >= grMin && gr <= grMax ? "✅" : "❌";
        const row = `<tr><td>${ir}</td><td>${or}</td><td>${sfera}</td><td>${gr.toFixed(3)} µm</td><td>${valido}</td></tr>`;
        tbody.innerHTML += row;
      }
    }
  }
}
