
const SFERE=[0,-2,-4,2,4];let risultati=[];let currentCombo=null;
function setCurrentCombo(combo){currentCombo=combo;
document.getElementById('schOR').textContent=combo.or.toFixed(0);
document.getElementById('schIR').textContent=combo.ir.toFixed(0);
document.getElementById('schOff').textContent=combo.offset.toFixed(1);
document.getElementById('schSf').textContent=combo.sfera.toFixed(0);
document.getElementById('schGR').textContent=combo.gr.toFixed(3);
drawSchematic(combo);}
function drawSchematic(r){const grPix=Math.max(10,Math.min(100,r.gr));
document.getElementById('grLine').setAttribute('x2',String(160+(grPix/100)*80));
const shift=Math.max(-6,Math.min(6,r.sfera));
document.getElementById('ballTop').setAttribute('cx',String(160+shift));
document.getElementById('ballBottom').setAttribute('cx',String(160-shift));}
function calcola(){const irMin=parseFloat(irMinEl.value),irMax=parseFloat(irMaxEl.value),
orMin=parseFloat(orMinEl.value),orMax=parseFloat(orMaxEl.value),offset=parseFloat(offsetEl.value),
grMin=parseFloat(grMinEl.value),grMax=parseFloat(grMaxEl.value);
risultati=[];for(let ir=irMin;ir<=irMax;ir++){for(let orv=orMin;orv<=orMax;orv++){for(const s of SFERE){
const gr=orv-ir+s+offset;const valido=gr>=grMin&&gr<=grMax;risultati.push({ir,or:orv,sfera:s,offset,gr,valido});}}}
render(grMin,grMax);}
function render(grMin,grMax){const tbody=document.querySelector('#tabellaRisultati tbody');tbody.innerHTML='';
const valide=risultati.filter(r=>r.valido);const closest=valide.length?valide[0]:null;
for(const r of risultati){const tr=document.createElement('tr');tr.dataset.ir=r.ir;tr.dataset.or=r.or;tr.dataset.sfera=r.sfera;
tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td><td>${r.offset.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td><td>${r.valido?'✔️':'❌'}</td>`;
tbody.appendChild(tr);tr.addEventListener('click',()=>{setCurrentCombo(r);});}
if(closest) setCurrentCombo(closest);}
const irMinEl=document.getElementById('irMin'),irMaxEl=document.getElementById('irMax'),
orMinEl=document.getElementById('orMin'),orMaxEl=document.getElementById('orMax'),
offsetEl=document.getElementById('offset'),grMinEl=document.getElementById('grMin'),grMaxEl=document.getElementById('grMax');
document.getElementById('btnCalcola').addEventListener('click',calcola);window.onload=calcola;
