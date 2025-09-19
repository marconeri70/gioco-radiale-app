
const SFERE = [0, -2, -4, 2, 4];
let risultati = [];

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
  requestAnimationFrame(drawCharts);
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
      document.getElementById('irMin').value = ir - 1;
      document.getElementById('irMax').value = ir + 1;
      document.getElementById('orMin').value = orv - 1;
      document.getElementById('orMax').value = orv + 1;
      calcola();
    });
  });

  document.getElementById('dashValid').textContent = valide.length;
  document.getElementById('dashTarget').textContent = grTarget.toFixed(2);
  const grAll = risultati.map(r=>r.gr);
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

// Charts
function setupCanvas(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w:rect.width,h:rect.height};
}
function drawHistogram(canvas, values, binsize){
  const {ctx,w:cssW,h:cssH} = setupCanvas(canvas);
  ctx.clearRect(0,0,cssW,cssH);
  if(values.length===0){ ctx.fillStyle='#333'; ctx.fillText('Nessun dato',10,20); return; }
  const min = Math.min(...values), max = Math.max(...values);
  const start = Math.floor(min/binsize)*binsize, end = Math.ceil(max/binsize)*binsize;
  const bins=[]; for(let b=start; b<=end+1e-9; b+=binsize) bins.push(Number(b.toFixed(4)));
  const counts = new Array(bins.length).fill(0);
  for(const v of values){ const i=Math.min(Math.floor((v-start)/binsize), bins.length-1); counts[i]++; }
  const pad={l:40,r:10,t:20,b:30}; const w=cssW-pad.l-pad.r; const h=cssH-pad.t-pad.b;
  const maxC=Math.max(...counts)||1; const barW=w/bins.length;
  ctx.strokeStyle='#333'; ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
  ctx.fillStyle='#1f78d1'; counts.forEach((c,i)=>{ const bh=(c/maxC)*(h-2); const x=pad.l+i*barW+1; const y=pad.t+h-bh; ctx.fillRect(x,y,barW-2,bh); });
  ctx.fillStyle='#000'; ctx.font='10px Arial'; const step=Math.max(1,Math.floor(bins.length/8));
  for(let i=0;i<bins.length;i+=step){ const x=pad.l+i*barW; ctx.fillText(bins[i].toFixed(1), x, pad.t+h+12); }
}
function drawCharts(){
  const all = risultati.map(r=>r.gr);
  const valid = risultati.filter(r=>r.valido).map(r=>r.gr);
  const c1 = document.getElementById('chartAll');
  const c2 = document.getElementById('chartValid');
  if(c1&&c2){ drawHistogram(c1, all, 0.5); drawHistogram(c2, valid, 0.5); }
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
