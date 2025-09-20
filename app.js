function calcola() {
  const irMin = parseFloat(document.getElementById("irMin").value);
  const irMax = parseFloat(document.getElementById("irMax").value);
  const orMin = parseFloat(document.getElementById("orMin").value);
  const orMax = parseFloat(document.getElementById("orMax").value);
  const grMin = parseFloat(document.getElementById("grMin").value);
  const grMax = parseFloat(document.getElementById("grMax").value);
  const offset = parseFloat(document.getElementById("offset").value);
  const soloValide = document.getElementById("soloValide").checked;

  const sfere = [-4,-2,0,2,4];
  const tbody = document.querySelector("#tabellaRisultati tbody");
  tbody.innerHTML = "";
  let validCount = 0, total = 0;

  for (let ir = irMin; ir <= irMax; ir++) {
    for (let or = orMin; or <= orMax; or++) {
      for (let sfera of sfere) {
        const gr = or - ir + offset + sfera;
        const valido = gr >= grMin && gr <= grMax;
        total++;
        if (valido) validCount++;
        if (!soloValide || valido) {
          const row = `<tr>
            <td>${ir}</td>
            <td>${or}</td>
            <td>${sfera}</td>
            <td>${offset}</td>
            <td>${gr.toFixed(2)}</td>
            <td class="${valido ? "valid" : "invalid"}">${valido ? "✔" : "✖"}</td>
          </tr>`;
          tbody.innerHTML += row;
        }
      }
    }
  }
  document.getElementById("kpi").innerText =
    `Valide: ${validCount} / ${total} combinazioni`;
}