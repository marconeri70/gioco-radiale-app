const $=id=>document.getElementById(id);
let SPHERES = new Set([-4,-2,0,2,4]);
let data=[], current=null;

function readInputs(){
  return {
    irMin:+$('irMin').value, irMax:+$('irMax').value,
    orMin:+$('orMin').value, orMax:+$('orMax').value,
    grMin:+$('grMin').value, grMax:+$('grMax').value,
    off:+$('offset').value,
    preferZero:$('preferZero')?$('preferZero').checked:true,
    onlyValid:$('onlyValid')?$('onlyValid').checked:false,
    spheres:[...SPHERES].sort((a,b)=>a-b)
  };
}
function calc(){
  const s=readInputs();
  $('offOut').textContent = s.off.toFixed(1)+' µm';
  $('kGrMin').textContent = s.grMin.toFixed(0);
  $('kGrMax').textContent = s.grMax.toFixed(0);
  $('kOffset').textContent = s.off.toFixed(1);
  data=[];
  for(let ir=s.irMin; ir<=s.irMax; ir++){
    for(let or=s.orMin; or<=s.orMax; or++){
      for(const sf of s.spheres){
        const gr = or - ir + sf + s.off;
        const ok = gr>=s.grMin && gr<=s.grMax;
        data.push({ir,or,sfera:sf,off:s.off,gr,ok});
      }
    }
  }
  const valid = data.filter(r=>r.ok);
  $('kValid').textContent = valid.length;
  $('kTotal').textContent = data.length;
  const span = s.grMax - s.grMin, step = 0.5;
  let covered=0;
  for(let g=s.grMin; g<=s.grMax; g+=step)
    if(valid.some(r=>Math.abs(r.gr-g)<=step/2)) covered++;
  const pct=Math.round(covered/((span/step)+1)*100);
  $('barFill').style.width=pct+'%'; $('barPct').textContent=pct+'%';
  const center=(s.grMin+s.grMax)/2;
  const score=r => (r.ok?0:1)*1e6 + Math.abs(r.ir)*100 + Math.abs(r.gr-center)*10 + r.or;
  current = data.slice().sort((a,b)=>score(a)-score(b))[0];
  $('kBest').textContent = current ? `IR ${current.ir}, OR ${current.or}, sfera ${current.sfera}, GR ${current.gr.toFixed(2)} µm` : '—';
  renderTable();
}
function renderTable(){
  const s=readInputs();
  const tbody=$('tbl').querySelector('tbody'); tbody.innerHTML='';
  const q=$('q')?$('q').value.trim().toLowerCase():'';
  let rows=data.slice();
  if(s.onlyValid) rows=rows.filter(r=>r.ok);
  if(q) rows=rows.filter(r=> [r.ir,r.or,r.sfera,r.gr.toFixed(2)].some(x=>String(x).toLowerCase().includes(q)));
  const center=(s.grMin+s.grMax)/2;
  const sortBy=$('sortBy')?$('sortBy').value:'gr';
  const cmp={
    gr:(a,b)=>Math.abs(a.gr-center)-Math.abs(b.gr-center),
    ir:(a,b)=>Math.abs(a.ir)-Math.abs(b.ir),
    or:(a,b)=>a.or-b.or,
    sfera:(a,b)=>a.sfera-b.sfera,
  }[sortBy];
  rows.sort(cmp);
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td>
                  <td>${r.off.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td>
                  <td class="${r.ok?'ok':'ko'}">${r.ok?'✔':'✖'}</td>`;
    tr.addEventListener('click',()=>{
      $('kBest').textContent=`IR ${r.ir}, OR ${r.or}, sfera ${r.sfera}, GR ${r.gr.toFixed(2)} µm`;
    });
    tbody.appendChild(tr);
  });
}
function setupChips(){
  document.querySelectorAll('.chip').forEach(el=>{
    el.addEventListener('click',()=>{
      const v=+el.dataset.sfera;
      if(SPHERES.has(v)){ SPHERES.delete(v); el.classList.remove('chip-on'); el.classList.add('chip-off'); }
      else { SPHERES.add(v); el.classList.remove('chip-off'); el.classList.add('chip-on'); }
      calc();
    });
  });
}
function exportCSV(){
  const header=['IR','OR','Sfera','Offset','GR','Valido'];
  const lines=[header.join(',')];
  data.forEach(r=> lines.push([r.ir,r.or,r.sfera,r.off.toFixed(1),r.gr.toFixed(3),r.ok?'OK':'KO'].join(',')));
  const blob=new Blob([lines.join('\n')],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='combinazioni.csv'; a.click();
  URL.revokeObjectURL(url);
}
['irMin','irMax','orMin','orMax','grMin','grMax','sortBy','q'].forEach(id=>{
  const el=document.getElementById(id); if(el) el.addEventListener('input',calc);
});
const onlyValidEl=document.getElementById('onlyValid'); if(onlyValidEl) onlyValidEl.addEventListener('change',calc);
const offsetEl=document.getElementById('offset'); if(offsetEl) offsetEl.addEventListener('input',calc);
document.getElementById('btnCalc').addEventListener('click',calc);
document.getElementById('btnCSV').addEventListener('click',exportCSV);
setupChips(); calc();
