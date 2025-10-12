const $=id=>document.getElementById(id);
const KEY='skfTablesCSV_full_v59';

const CLASSES = ["C2L","C2H","CNL","CN","CNH","C3L","C3H","C2P","CNP","C3P","C4P","C5P","C4L","C4H","C5L","C5H"];
const BORE_BLOCKS = [[2.5,2.5],[10,14],[14,18],[18,24],[24,30],[30,40],[40,50],[50,65],[65,80],[80,100],[100,120],[120,140],[140,160],[160,180]];

function buildEmptyCSV(){
  let rows = ["class,d_min,d_max,gr_min,gr_max"];
  for(const cls of CLASSES){
    for(const [dmin,dmax] of BORE_BLOCKS){
      rows.push(`${cls},${dmin},${dmax},,`);
    }
  }
  return rows.join("\n");
}
function ensureCsv(){
  if(!localStorage.getItem(KEY)){
    localStorage.setItem(KEY, buildEmptyCSV());
  }
  return localStorage.getItem(KEY);
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

// ===== Import/Export CSV/Excel =====
const modal=document.getElementById('modal'), csvTA=document.getElementById('csv');
function setCSV(text){ localStorage.setItem(KEY, text); csvTA.value=text; }
function getCSV(){ return localStorage.getItem(KEY) || buildEmptyCSV(); }

document.getElementById('btnTbl').addEventListener('click',()=>{csvTA.value=getCSV(); modal.classList.remove('hidden');});
document.getElementById('mClose').addEventListener('click',()=>modal.classList.add('hidden'));
document.getElementById('mReset').addEventListener('click',()=>{setCSV(buildEmptyCSV());});
document.getElementById('mSave').addEventListener('click',()=>{setCSV(csvTA.value); modal.classList.add('hidden'); syncFromTable(); calc();});
document.getElementById('mExport').addEventListener('click',()=>{
  const blob=new Blob([getCSV()],{type:'text/csv'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='skf-tabelle.csv'; a.click(); URL.revokeObjectURL(url);
});
document.getElementById('mImport').addEventListener('click',async()=>{
  const file = document.getElementById('fileIn').files[0];
  if(!file){ alert('Seleziona un file CSV o XLSX.'); return; }
  const name = file.name.toLowerCase();
  if(name.endsWith('.csv')){
    const text = await file.text();
    setCSV(text); alert('CSV importato. Premi Salva per applicare.'); return;
  }
  if(name.endsWith('.xlsx')){
    if(typeof XLSX==='undefined'){ alert('Libreria Excel non caricata. Se sei offline, importa un CSV.'); return; }
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, {defval:""});
    const norm = s => String(s||"").toLowerCase().replace(/\s+/g,'');
    const headerMap = {}; const first = json[0]||{};
    for(const k of Object.keys(first)){ headerMap[norm(k)] = k; }
    const get = (row, key) => row[ headerMap[key] ] ?? row[key] ?? "";
    const rows = ["class,d_min,d_max,gr_min,gr_max"];
    for(const row of json){
      const cls = get(row,'class');
      const dmin = get(row,'d_min') || get(row,'dmin') || get(row,'from');
      const dmax = get(row,'d_max') || get(row,'dmax') || get(row,'to');
      const gmin = get(row,'gr_min') || get(row,'grmin') || get(row,'min');
      const gmax = get(row,'gr_max') || get(row,'grmax') || get(row,'max');
      if(!cls || !dmin || !dmax){ continue; }
      rows.push([cls,dmin,dmax,gmin,gmax].join(','));
    }
    if(rows.length<=1){ alert('Nessuna riga valida trovata nel foglio Excel.'); return; }
    setCSV(rows.join('\n'));
    alert('Excel importato. Premi Salva per applicare.');
    return;
  }
  alert('Formato non supportato. Usa .csv o .xlsx');
});

['skfClass','bore','lockGR'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{syncFromTable();calc();}));
['irMin','irMax','orMin','orMax','grMin','grMax','offset','onlyValid','winIR','winOR'].forEach(id=>document.getElementById(id).addEventListener('input',calc));

document.getElementById('btnCalc').addEventListener('click',calc);
document.getElementById('btnResetRanges').addEventListener('click',()=>{
  $('irMin').value=-10; $('irMax').value=10; $('orMin').value=0; $('orMax').value=30; calc();
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
  $('irMin').value = r.ir - wIR; $('irMax').value = r.ir + wIR;
  $('orMin').value = r.or - wOR; $('orMax').value = r.or + wOR;
  calc();
});

fillSelectors(); syncFromTable(); setupChips(); calc();
