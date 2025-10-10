const $=id=>document.getElementById(id);
const KEY='skfTablesCSV_full_v58';

const CLASSES = ["C2L","C2H","CNL","CN","CNH","C3L","C3H","C2P","CNP","C3P","C4P","C5P","C4L","C4H","C5L","C5H"];
const BORE_BLOCKS = [[2.5,2.5],[10,14],[14,18],[18,24],[24,30],[30,40],[40,50],[50,65],[65,80],[80,100],[100,120],[120,140],[140,160],[160,180]];

const BUILTIN = `class,d_min,d_max,gr_min,gr_max
CN,30,40,6,20
CN,40,50,7,21
C3,30,40,13,28
C3,40,50,14,30
C4,30,40,25,43
C4,40,50,26,45
C5,30,40,45,61
C5,40,50,46,71
C2L,10,14,4,8
C2L,14,18,4,8
C2H,10,14,6,10
C2H,14,18,8,12
CNL,18,24,8,12
CNH,18,24,10,14
C3L,18,24,12,17
C3H,18,24,17,22
C4L,10,14,22,27
C4H,10,14,27,30
C5L,10,14,30,35
C5H,10,14,35,40
C4L,14,18,25,32
C4H,14,18,30,37
C5L,14,18,33,41
C5H,14,18,39,45
C4L,18,24,27,34
C4H,18,24,32,41
C5L,18,24,35,41
C5H,18,24,41,47
C4L,24,30,30,41
C4H,24,30,34,47
C5L,24,30,38,45
C5H,24,30,45,53
C4L,30,40,34,43
C4H,30,40,41,51
C5L,30,40,47,61
C5H,30,40,51,75
C4L,40,50,36,44
C4H,40,50,43,52
C5L,40,50,51,62
C5H,40,50,61,71
C4L,50,65,43,53
C4H,50,65,52,62
C5L,50,65,62,75
C5H,50,65,71,87
C2P,10,14,6,12
CNP,10,14,11,17
C3P,10,14,16,26
C4P,10,14,25,35
C5P,10,14,35,45
C2P,14,18,7,13
CNP,14,18,13,19
C3P,14,18,18,28
C4P,14,18,26,36
C5P,14,18,36,51
`;

// Se presente un CSV utente lo uso, altrimenti carico il BUILTIN e poi aggiungo righe vuote mancanti.
function ensureCsv(){
  let csv = localStorage.getItem(KEY);
  if(!csv){ csv = BUILTIN.trim(); }
  // garantisci struttura completa (righe per ogni classe×blocco d)
  const existing = new Set(csv.split(/\r?\n/).slice(1).map(l=>l.split(',').slice(0,3).join('|')));
  const rows = [csv.split(/\r?\n/)[0]];
  rows.push(...csv.split(/\r?\n/).slice(1));
  for(const cls of CLASSES){
    for(const [dmin,dmax] of BORE_BLOCKS){
      const key = [cls,dmin,dmax].join('|');
      if(!existing.has(key)){
        rows.push(`${cls},${dmin},${dmax},,`);
      }
    }
  }
  const full = rows.join('\n');
  localStorage.setItem(KEY, full);
  return full;
}

function parseCSV(csv){
  const lines = csv.trim().split(/\r?\n/).filter(l=>l.trim());
  lines.shift();
  return lines.map(l=>{
    const p=l.split(',');
    return {cls:p[0], dmin:+p[1], dmax:+p[2], gmin: p[3]===""?null:+p[3], gmax:p[4]===""?null:+p[4]};
  });
}
function currentTable(){ return parseCSV(ensureCsv()); }
function findRange(cls,d,table){
  const clsKey=cls.trim().toUpperCase();
  let rows=table.filter(r=>r.cls.toUpperCase()===clsKey && d>r.dmin-1e-9 && d<=r.dmax+1e-9);
  return rows[0]||null;
}

let SPHERES = new Set([-4,-2,0,2,4]);
let data=[];
let selectedIndex = -1;

function fillSelectors(){
  const clsSel=$('skfClass'); clsSel.innerHTML = CLASSES.map(c=>`<option>${c}</option>`).join('');
  const boreSel=$('bore'); boreSel.innerHTML = BORE_BLOCKS.map(b=>`<option value="${b[1]}">${b[0]}–${b[1]}</option>`).join('');
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
    lockGR:$('lockGR').checked,
    wIR:+$('winIR').value, wOR:+$('winOR').value,
    table:currentTable()
  };
}
function syncFromTable(){
  const s=readInputs();
  const r=findRange(s.cls,s.bore,s.table);
  const lock=$('lockGR').checked;
  $('grMin').disabled=lock; $('grMax').disabled=lock;
  if(lock && r && r.gmin!=null && r.gmax!=null){
    $('grMin').value=r.gmin; $('grMax').value=r.gmax;
    $('kGrMin').textContent=r.gmin; $('kGrMax').textContent=r.gmax;
    $('skfHint').textContent=`Range da tabella: ${s.cls} per d ${s.bore} → ${r.gmin}…${r.gmax} µm.`;
  }else if(lock){
    $('kGrMin').textContent='—'; $('kGrMax').textContent='—';
    $('skfHint').textContent=`Manca il valore in tabella per ${s.cls} a d ${s.bore}. Apri “Tabelle SKF”, inserisci GR min/max e salva.`;
  }else{
    $('kGrMin').textContent=$('grMin').value||'—';
    $('kGrMax').textContent=$('grMax').value||'—';
    $('skfHint').textContent=`GR impostato manualmente.`;
  }
}
function calc(){
  const s=readInputs();
  $('offOut').textContent=s.off.toFixed(1)+' µm';
  $('kGrMin').textContent=s.grMin||'—'; $('kGrMax').textContent=s.grMax||'—';
  $('kOffset').textContent=s.off.toFixed(1);
  data=[];
  const sphereList=[-4,-2,0,2,4].filter(x=>SPHERES.has(x));
  for(let ir=s.irMin;ir<=s.irMax;ir++){
    for(let or=s.orMin;or<=s.orMax;or++){
      for(const sf of sphereList){
        const gr=or-ir+sf+s.off;
        const ok=(isFinite(s.grMin)&&isFinite(s.grMax))? (gr>=s.grMin && gr<=s.grMax) : false;
        data.push({ir,or,sfera:sf,off:s.off,gr,ok});
      }
    }
  }
  const valid=data.filter(r=>r.ok);
  $('kValid').textContent=valid.length; $('kTotal').textContent=data.length;
  const center=(s.grMin+s.grMax)/2 || 0;
  const score=r => (r.ok?0:1)*1e6 + Math.abs(r.ir)*100 + Math.abs(r.gr-center)*10 + r.or;
  const best=data.slice().sort((a,b)=>score(a)-score(b))[0];
  $('kBest').textContent=best?`IR ${best.ir}, OR ${best.or}, sfera ${best.sfera}, GR ${best.gr.toFixed(2)} µm`:'—';
  renderTable();
}
function renderTable(){
  const s=readInputs();
  const tb=document.querySelector('#tbl tbody'); tb.innerHTML='';
  let rows=data.slice(); if(s.onlyValid) rows=rows.filter(r=>r.ok);
  rows.forEach((r,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td>
      <td>${r.off.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td>
      <td class="${r.ok?'ok':'ko'}">${r.ok?'✔':'✖'}</td>`;
    tr.addEventListener('click',()=>{
      document.querySelectorAll('#tbl tbody tr').forEach(x=>x.classList.remove('sel'));
      tr.classList.add('sel'); selectedIndex = i;
    });
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
// Modal tabelle
const modal=document.getElementById('modal'), csvTA=document.getElementById('csv');
document.getElementById('btnTbl').addEventListener('click',()=>{csvTA.value=ensureCsv(); modal.classList.remove('hidden');});
document.getElementById('mClose').addEventListener('click',()=>modal.classList.add('hidden'));
document.getElementById('mReset').addEventListener('click',()=>{localStorage.removeItem(KEY); csvTA.value=ensureCsv();});
document.getElementById('mSave').addEventListener('click',()=>{localStorage.setItem(KEY, csvTA.value); modal.classList.add('hidden'); syncFromTable(); calc();});
document.getElementById('mExport').addEventListener('click',()=>{
  const blob=new Blob([ensureCsv()],{type:'text/csv'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='skf-tabelle-precaricate.csv'; a.click(); URL.revokeObjectURL(url);
});

['skfClass','bore','lockGR'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{syncFromTable();calc();}));
['irMin','irMax','orMin','orMax','grMin','grMax','offset','onlyValid','winIR','winOR'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
document.getElementById('btnCalc').addEventListener('click',calc);
document.getElementById('btnResetRanges').addEventListener('click',()=>{
  document.getElementById('irMin').value=-10; document.getElementById('irMax').value=10;
  document.getElementById('orMin').value=0; document.getElementById('orMax').value=30; calc();
});
document.getElementById('btnNarrow').addEventListener('click',()=>{
  const tBody = document.querySelector('#tbl tbody');
  const sel = tBody.querySelector('tr.sel');
  if(!sel){alert('Seleziona prima una riga nella tabella.'); return;}
  const idx=[...tBody.children].indexOf(sel);
  const r = (document.getElementById('onlyValid').checked?data.filter(x=>x.ok):data)[idx];
  if(!r){alert('Riga non valida.'); return;}
  const wIR = +document.getElementById('winIR').value;
  const wOR = +document.getElementById('winOR').value;
  document.getElementById('irMin').value = r.ir - wIR;
  document.getElementById('irMax').value = r.ir + wIR;
  document.getElementById('orMin').value = r.or - wOR;
  document.getElementById('orMax').value = r.or + wOR;
  calc();
});

fillSelectors(); setupChips(); syncFromTable(); calc();
