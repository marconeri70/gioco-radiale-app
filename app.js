const $=id=>document.getElementById(id);
const KEY='skfTablesCSV';
const SAMPLE=`class,d_min,d_max,gr_min,gr_max
CN,30,50,6,20
C3,30,50,13,28
C4,30,50,25,43
C5,30,50,45,61
CN,10,18,3,10
C3,10,18,7,15`;

let SPHERES = new Set([-4,-2,0,2,4]);
let data=[];

function loadCSV(){ return localStorage.getItem(KEY) || SAMPLE; }
function saveCSV(csv){ localStorage.setItem(KEY,csv); }
function parseCSV(csv){
  const lines = csv.trim().split(/\r?\n/).filter(l=>l.trim());
  lines.shift();
  return lines.map(l=>{
    const [cls,dmin,dmax,gmin,gmax]=l.split(',').map(s=>s.trim());
    return {cls, dmin:+dmin, dmax:+dmax, gmin:+gmin, gmax:+gmax};
  });
}
function findRange(cls,d,table){
  const clsKey=cls.trim().toUpperCase();
  let rows=table.filter(r=>r.cls.toUpperCase()===clsKey && d>r.dmin-1e-9 && d<=r.dmax+1e-9);
  if(rows.length===0){
    const base=clsKey.replace(/[LH]$/,''); // fallback base class
    rows=table.filter(r=>r.cls.toUpperCase()===base && d>r.dmin-1e-9 && d<=r.dmax+1e-9);
  }
  return rows[0]||null;
}

function readInputs(){
  return {
    cls: $('skfClass').value,
    bore:+$('bore').value,
    irMin:+$('irMin').value, irMax:+$('irMax').value,
    orMin:+$('orMin').value, orMax:+$('orMax').value,
    grMin:+$('grMin').value, grMax:+$('grMax').value,
    off:+$('offset').value,
    onlyValid:$('onlyValid').checked,
    table:parseCSV(loadCSV())
  };
}
function syncFromTable(){
  const s=readInputs();
  const r=findRange(s.cls,s.bore,s.table);
  if(r){
    $('grMin').value=r.gmin; $('grMax').value=r.gmax;
    $('kGrMin').textContent=r.gmin; $('kGrMax').textContent=r.gmax;
    $('skfHint').textContent=`Range da tabella: ${s.cls} per d=${s.bore} → ${r.gmin}…${r.gmax} µm.`;
  }else{
    $('skfHint').textContent=`Nessuna riga trovata per ${s.cls} a d=${s.bore}. Aggiungi nel menu “Gestisci Tabelle SKF”.`;
  }
}
function calc(){
  const s=readInputs();
  $('offOut').textContent=s.off.toFixed(1)+' µm';
  $('kGrMin').textContent=s.grMin.toFixed(0);
  $('kGrMax').textContent=s.grMax.toFixed(0);
  $('kOffset').textContent=s.off.toFixed(1);
  data=[];
  for(let ir=s.irMin;ir<=s.irMax;ir++){
    for(let or=s.orMin;or<=s.orMax;or++){
      for(const sf of [-4,-2,0,2,4]){
        const gr=or-ir+sf+s.off;
        const ok=gr>=s.grMin && gr<=s.grMax;
        data.push({ir,or,sfera:sf,off:s.off,gr,ok});
      }
    }
  }
  const valid=data.filter(r=>r.ok);
  document.getElementById('kValid').textContent=valid.length;
  document.getElementById('kTotal').textContent=data.length;
  const center=(s.grMin+s.grMax)/2;
  const score=r => (r.ok?0:1)*1e6 + Math.abs(r.ir)*100 + Math.abs(r.gr-center)*10 + r.or;
  const best=data.slice().sort((a,b)=>score(a)-score(b))[0];
  document.getElementById('kBest').textContent=best?`IR ${best.ir}, OR ${best.or}, sfera ${best.sfera}, GR ${best.gr.toFixed(2)} µm`:'—';
  renderTable();
}
function renderTable(){
  const s=readInputs();
  const tb=document.querySelector('#tbl tbody'); tb.innerHTML='';
  let rows=data.slice(); if(s.onlyValid) rows=rows.filter(r=>r.ok);
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td>
      <td>${r.off.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td>
      <td class="${r.ok?'ok':'ko'}">${r.ok?'✔':'✖'}</td>`;
    tb.appendChild(tr);
  });
}
function setupChips(){
  document.querySelectorAll('.chip').forEach(el=>{
    el.addEventListener('click',()=>{
      const v=+el.dataset.sfera;
      if(SPHERES.has(v)){SPHERES.delete(v);el.classList.remove('chip-on');el.classList.add('chip-off');}
      else{SPHERES.add(v);el.classList.remove('chip-off');el.classList.add('chip-on');}
      calc();
    });
  });
}
// modal
const modal=document.getElementById('modal'), csvTA=document.getElementById('csv');
document.getElementById('btnTbl').addEventListener('click',()=>{csvTA.value=loadCSV(); modal.classList.remove('hidden');});
document.getElementById('mClose').addEventListener('click',()=>modal.classList.add('hidden'));
document.getElementById('mLoad').addEventListener('click',()=>csvTA.value=SAMPLE);
document.getElementById('mSave').addEventListener('click',()=>{saveCSV(csvTA.value); modal.classList.add('hidden'); syncFromTable(); calc();});
document.getElementById('mExport').addEventListener('click',()=>{
  const blob=new Blob([loadCSV()],{type:'text/csv'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='skf-tabelle.csv'; a.click(); URL.revokeObjectURL(url);
});

['skfClass','bore'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{syncFromTable();calc();}));
['irMin','irMax','orMin','orMax','grMin','grMax','offset','onlyValid'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
document.getElementById('btnCalc').addEventListener('click',calc);
setupChips(); syncFromTable(); calc();
