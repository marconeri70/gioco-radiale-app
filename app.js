
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
  drawSchematicCanvas(combo);
}

function drawSchematicCanvas(r){
  const c = document.getElementById('schematicCanvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  const cx = W/2, cy = H/2;
  const R_or = Math.min(W,H)*0.35;
  const R_ir = R_or*0.6;
  const R_ball = R_or*0.13;

  // outer ring
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#6c8fbf';
  ctx.beginPath(); ctx.arc(cx,cy,R_or,0,Math.PI*2); ctx.stroke();

  // inner ring
  ctx.strokeStyle = '#9bb7dc';
  ctx.beginPath(); ctx.arc(cx,cy,R_ir,0,Math.PI*2); ctx.stroke();

  // balls
  const shift = Math.max(-6, Math.min(6, r.sfera));
  ctx.fillStyle = '#b7c9e6'; ctx.strokeStyle = '#7fa1d8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx+shift, cy-(R_ir+R_or)/2+R_ball, R_ball, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx-shift, cy+(R_ir+R_or)/2-R_ball, R_ball, 0, Math.PI*2); ctx.fill(); ctx.stroke();

  // guide + GR arrow
  ctx.strokeStyle = '#7fa1d8'; ctx.setLineDash([4,4]); ctx.lineWidth = 2;
  const yGuide = cy + R_or + 15;
  ctx.beginPath(); ctx.moveTo(cx, yGuide); ctx.lineTo(cx + R_or, yGuide); ctx.stroke();
  ctx.setLineDash([]);

  const grMin = parseFloat(document.getElementById('grMin').value);
  const grMax = parseFloat(document.getElementById('grMax').value);
  const grClamped = Math.max(grMin, Math.min(grMax, r.gr));
  const frac = (grClamped - grMin) / Math.max(1e-6, (grMax - grMin));
  const grLen = frac * R_or;

  ctx.strokeStyle = '#1f78d1'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, yGuide); ctx.lineTo(cx + grLen, yGuide); ctx.stroke();

  ctx.fillStyle = '#0c2a4f'; ctx.font = '12px Arial'; ctx.fillText('GR', cx + R_or + 6, yGuide + 4);
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

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const ir = Number(tr.dataset.ir);
      const orv = Number(tr.dataset.or);
      const s  = Number(tr.dataset.sfera);
      const off = parseFloat(document.getElementById('offset').value);
      const gr = orv - ir + s + off;
      setCurrentCombo({ ir, or: orv, sfera: s, offset: off, gr, valido: true });
    });
  });

  if(closest) setCurrentCombo(closest);
  else if (risultati.length) setCurrentCombo(risultati[0]);

  // update dashboard
  document.getElementById('dashValid').textContent = valide.length;
  document.getElementById('dashTarget').textContent = grTarget.toFixed(2);
  const grAll = risultati.map(r=>r.gr);
  if(grAll.length){
    document.getElementById('dashRange').textContent = `${Math.min(...grAll).toFixed(2)} – ${Math.max(...grAll).toFixed(2)}`;
    if(valide.length){
      const irVals = valide.map(r=>r.ir), orVals = valide.map(r=>r.or), sfVals = valide.map(r=>r.sfera);
      document.getElementById('dashIR').textContent = `${Math.min(...irVals)} – ${Math.max(...irVals)} µm`;
      document.getElementById('dashOR').textContent = `${Math.min(...orVals)} – ${Math.max(...orVals)} µm`;
      document.getElementById('dashSfere').textContent = `${Math.min(...sfVals)} – ${Math.max(...sfVals)} µm`;
      const set = new Set(sfVals), all = new Set(SFERE);
      const missing = [...all].filter(x=>!set.has(x));
      const used = [...set].sort((a,b)=>a-b).join(', ');
      document.getElementById('dashCover').textContent = missing.length===0 ? `OK (usate: ${used})` : `mancano: ${missing.sort((a,b)=>a-b).join(', ')}`;
    } else {
      document.getElementById('dashIR').textContent = '–';
      document.getElementById('dashOR').textContent = '–';
      document.getElementById('dashSfere').textContent = '–';
      document.getElementById('dashCover').textContent = '–';
    }
  }
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
