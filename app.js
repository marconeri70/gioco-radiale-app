
const SFERE = [0, -2, -4, 2, 4];
let risultati = [];
let currentCombo = null;

function setCurrentCombo(combo){
  currentCombo = combo;
  document.getElementById('schOR').textContent  = combo.or.toFixed(0);
  document.getElementById('schIR').textContent  = combo.ir.toFixed(0);
  document.getElementById('schOff').textContent = combo.offset.toFixed(1);
  document.getElementById('schSf').textContent  = combo.sfera.toFixed(0);
  document.getElementById('schGR').textContent  = combo.gr.toFixed(3);
  drawSchematic(combo);
}

function drawSchematic(r){
  const grPix = Math.max(10, Math.min(100, r.gr));
  document.getElementById('grLine').setAttribute('x2', String(160 + (grPix/100)*80));
  const shift = Math.max(-6, Math.min(6, r.sfera));
  document.getElementById('ballTop').setAttribute('cx', String(160 + shift));
  document.getElementById('ballBottom').setAttribute('cx', String(160 - shift));
}

function calcola(){
  const irMin = parseFloat(document.getElementById('irMin').value);
  const irMax = parseFloat(document.getElementById('irMax').value);
  const orMin = parseFloat(document.getElementById('orMin').value);
  const orMax = parseFloat(document.getElementById('orMax').value);
  const offset = parseFloat(document.getElementById('offset').value);
  const grMin = parseFloat(document.getElementById('grMin').value);
  const grMax = parseFloat(document.getElementById('grMax').value);
  const preferIR0 = document.getElementById('preferIR0').checked;
  const grTarget = (grMin + grMax) / 2;

  risultati = [];
  for(let ir = irMin; ir <= irMax; ir += 1){
    for(let orv = orMin; orv <= orMax; orv += 1){
      for(const s of SFERE){
        const gr = orv - ir + s + offset;
        const valido = gr >= grMin && gr <= grMax;
        risultati.push({ir, or: orv, sfera: s, offset, gr, valido});
      }
    }
  }

  risultati.sort((a,b)=>{
    const a1 = Math.abs(a.gr - grTarget) - Math.abs(b.gr - grTarget);
    if(a1 !== 0) return a1;
    if(preferIR0){
      const a2 = Math.abs(a.ir) - Math.abs(b.ir);
      if(a2 !== 0) return a2;
    }
    return a.or - b.or;
  });

  render(grMin, grMax, grTarget);
}

function render(grMin, grMax, grTarget){
  const onlyValid = document.getElementById('onlyValid').checked;
  const tbody = document.querySelector('#tabellaRisultati tbody');
  tbody.innerHTML = '';

  const valide = risultati.filter(r=>r.valido);
  const closest = valide.length ? valide.reduce((a,b)=>Math.abs(a.gr-grTarget)<=Math.abs(b.gr-grTarget)?a:b) : null;

  for(const r of risultati){
    if(onlyValid && !r.valido) continue;
    const tr = document.createElement('tr');
    tr.dataset.ir = r.ir; tr.dataset.or = r.or; tr.dataset.sfera = r.sfera;
    if(closest && r.ir===closest.ir && r.or===closest.or && r.sfera===closest.sfera) tr.classList.add('ideal');
    tr.innerHTML = `<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td><td>${r.offset.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td><td class="${r.valido?'ok':'not-ok'}">${r.valido?'✔️':'❌'}</td>`;
    tbody.appendChild(tr);
  }

  // Click-to-apply shows in schematic immediately
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const ir = Number(tr.dataset.ir);
      const orv = Number(tr.dataset.or);
      const s  = Number(tr.dataset.sfera);
      const offset = parseFloat(document.getElementById('offset').value);
      const gr = orv - ir + s + offset;
      setCurrentCombo({ ir, or: orv, sfera: s, offset, gr, valido: true });
    });
  });

  if(closest) setCurrentCombo(closest);
  else if (risultati.length) setCurrentCombo(risultati[0]);
}

function exportCSV(){
  const validOnly = risultati.filter(r=>r.valido);
  if(!validOnly.length){ alert('Nessuna combinazione valida da esportare.'); return; }
  const header='IR,OR,Sfera,Offset,GR,Valido\n';
  const rows=validOnly.map(r=>[r.ir,r.or,r.sfera,r.offset.toFixed(1),r.gr.toFixed(2),'OK'].join(',')).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='combinazioni_valide.csv'; a.click(); URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btnCalcola').addEventListener('click', calcola);
  document.getElementById('btnCSV').addEventListener('click', exportCSV);
  document.getElementById('onlyValid').addEventListener('change', calcola);
  calcola();
});
