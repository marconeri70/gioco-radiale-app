
// === LOGICA CALCOLO ===
const SFERE=[0,-2,-4,2,4];
let risultati=[],currentCombo=null;
const el=(id)=>document.getElementById(id);

function setCurrentCombo(c){
  currentCombo=c;
  el('stOR').textContent=c.or.toFixed(0);
  el('stIR').textContent=c.ir.toFixed(0);
  el('stOff').textContent=c.offset.toFixed(1);
  el('stSf1').textContent=c.sfera.toFixed(0);
  el('stSf2').textContent=c.sfera.toFixed(0);
  el('stGR').textContent=c.gr.toFixed(3);
  drawMachineStyle(c);
}

function applyRangeFromCombo(c){
  if(!el('autoRange').checked) return;
  const tIR=+el('tolIR').value||0, tOR=+el('tolOR').value||0;
  el('irMin').value = Math.round(c.ir - tIR);
  el('irMax').value = Math.round(c.ir + tIR);
  el('orMin').value = Math.round(c.or - tOR);
  el('orMax').value = Math.round(c.or + tOR);
}

function calcola(){
  const irMin=+el('irMin').value;
  const irMax=+el('irMax').value;
  const orMin=+el('orMin').value;
  const orMax=+el('orMax').value;
  const grMin=+el('grMin').value;
  const grMax=+el('grMax').value;
  const offset=+el('offsetSlider').value;
  el('offsetValue').textContent=offset.toFixed(1)+' µm';
  const preferIR0=el('preferIR0').checked;
  const grTarget=(grMin+grMax)/2;

  risultati=[];
  for(let ir=irMin;ir<=irMax;ir++){for(let orv=orMin;orv<=orMax;orv++){for(const s of SFERE){const gr=orv-ir+s+offset;const valido=gr>=grMin&&gr<=grMax;risultati.push({ir,or:orv,sfera:s,offset,gr,valido});}}}
  risultati.sort((a,b)=>{const d=Math.abs(a.gr-grTarget)-Math.abs(b.gr-grTarget);if(d!==0)return d; if(preferIR0){const d2=Math.abs(a.ir)-Math.abs(b.ir); if(d2!==0)return d2;} return a.or-b.or;});
  render(grMin,grMax,grTarget);
}

function render(grMin,grMax,grTarget){
  const onlyValid=el('onlyValid').checked;
  const tb=document.querySelector('#tabellaRisultati tbody'); tb.innerHTML='';
  const valide=risultati.filter(r=>r.valido);
  const closest=valide.length?valide.reduce((a,b)=>Math.abs(a.gr-grTarget)<=Math.abs(b.gr-grTarget)?a:b):null;
  for(const r of risultati){
    if(onlyValid&&!r.valido) continue;
    const tr=document.createElement('tr'); tr.dataset.ir=r.ir; tr.dataset.or=r.or; tr.dataset.sfera=r.sfera;
    if(closest && r.ir===closest.ir && r.or===closest.or && r.sfera===closest.sfera) tr.classList.add('ideal');
    tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td><td>${r.offset.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td><td class="${r.valido?'ok':'not-ok'}">${r.valido?'✔️':'❌'}</td>`;
    tb.appendChild(tr);
  }
  tb.querySelectorAll('tr').forEach(tr=>tr.addEventListener('click',()=>{
    const ir=+tr.dataset.ir,orv=+tr.dataset.or,s=+tr.dataset.sfera,off=+el('offsetSlider').value;
    const gr=orv-ir+s+off; const combo={ir,or:orv,sfera:s,offset:off,gr,valido:true};
    setCurrentCombo(combo);
    applyRangeFromCombo(combo); // imposta IR/OR min-max attorno ai valori
  }));
  if(closest){ setCurrentCombo(closest); applyRangeFromCombo(closest); }
  else if(risultati.length) setCurrentCombo(risultati[0]);
}

// === DISEGNO TIPO-MACCHINA (più simile allo screenshot) ===
function drawDim(ctx,x1,y1,x2,y2,label){
  ctx.save(); ctx.strokeStyle='#0c2a4f'; ctx.fillStyle='#0c2a4f'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const ang=Math.atan2(y2-y1,x2-x1),ah=8;
  function arr(x,y,a){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-ah*Math.cos(a-Math.PI/6),y-ah*Math.sin(a-Math.PI/6));ctx.lineTo(x-ah*Math.cos(a+Math.PI/6),y-ah*Math.sin(a+Math.PI/6));ctx.closePath();ctx.fill();}
  arr(x1,y1,ang+Math.PI); arr(x2,y2,ang); const mx=(x1+x2)/2,my=(y1+y2)/2; ctx.font='12px Arial'; ctx.fillText(label,mx+6,my-6);
  ctx.restore();
}
function leader(ctx,x1,y1,x2,y2,text){
  ctx.save(); ctx.setLineDash([6,6]); ctx.strokeStyle='#7fa1d8'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle='#7fa1d8'; ctx.font='12px Arial'; ctx.fillText(text,x2+6,y2-6); ctx.restore();
}
function drawMachineStyle(r){
  const c=document.getElementById('schematicCanvas'), ctx=c.getContext('2d'), W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  const cx=W*0.38, cy=H*0.52;
  const R_or=Math.min(W,H)*0.28, track_or=R_or*0.10;
  const R_ir=R_or*0.62, track_ir=R_ir*0.12;
  const R_ball=R_or*0.12;
  // bearing
  ctx.save(); ctx.translate(2,2); ctx.globalAlpha=0.12; ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(cx,cy,R_or,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.lineWidth=8; ctx.strokeStyle='#6b8fbe';
  ctx.beginPath(); ctx.arc(cx,cy,R_or,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,R_or-track_or,0,Math.PI*2); ctx.stroke();
  ctx.lineWidth=6; ctx.strokeStyle='#8eacd6';
  ctx.beginPath(); ctx.arc(cx,cy,R_ir,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,R_ir-track_ir,0,Math.PI*2); ctx.stroke();
  // balls
  const shift=Math.max(-6,Math.min(6,r.sfera));
  const b1={x:cx+shift,y:cy-(R_ir+R_or)/2+R_ball}, b2={x:cx-shift,y:cy+(R_ir+R_or)/2-R_ball};
  ctx.fillStyle='#cfe0f6'; ctx.strokeStyle='#7fa1d8'; ctx.lineWidth=2;
  for(const b of [b1,b2]){ ctx.beginPath(); ctx.arc(b.x,b.y,R_ball,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#4f79b3'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(b.x-6,b.y); ctx.lineTo(b.x+6,b.y); ctx.moveTo(b.x,b.y-6); ctx.lineTo(b.x,b.y+6); ctx.stroke(); }
  leader(ctx, b1.x, b1.y-R_ball, W*0.80, H*0.18, `Diametro sfera: ${r.sfera.toFixed(0)} µm`);
  leader(ctx, cx-R_ir, cy,       W*0.80, H*0.55, `Misura diametro IR: ${r.ir.toFixed(0)} µm`);
  ctx.fillStyle='#7fa1d8'; ctx.font='12px Arial';
  ctx.fillText(`Misura diametro OR: ${r.or.toFixed(0)} µm`, W*0.72, H*0.90);
  // quotas OR / IR
  drawDim(ctx,cx-R_or,cy-R_or-22,cx+R_or,cy-R_or-22,`Ø OR: ${r.or.toFixed(0)} µm`);
  drawDim(ctx,cx-R_ir,cy+R_ir+26,cx+R_ir,cy+R_ir+26,`Ø IR: ${r.ir.toFixed(0)} µm`);
  // quota GR
  const grMin=+el('grMin').value, grMax=+el('grMax').value;
  const gTop=cy+R_ir, gBot=cy+R_or;
  const frac=Math.max(0,Math.min(1,(r.gr-grMin)/Math.max(1e-6,(grMax-grMin))));
  const gy=gTop + (gBot-gTop)*frac;
  drawDim(ctx, cx+R_or+22, gTop, cx+R_or+22, gy, `GR: ${r.gr.toFixed(2)} µm`);
}

function exportCSV(){
  const valid=risultati.filter(r=>r.valido);
  if(!valid.length){alert('Nessuna combinazione valida da esportare.');return;}
  const header='IR,OR,Sfera,Offset,GR,Valido\n', rows=valid.map(r=>[r.ir,r.or,r.sfera,r.offset.toFixed(1),r.gr.toFixed(2),'OK'].join(',')).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='combinazioni_valide.csv'; a.click(); URL.revokeObjectURL(url);
}

// events
document.addEventListener('DOMContentLoaded',()=>{
  el('btnCalcola').addEventListener('click',calcola);
  el('btnCSV').addEventListener('click',exportCSV);
  el('onlyValid').addEventListener('change',calcola);
  el('offsetSlider').addEventListener('input',calcola);
  el('btnFissa').addEventListener('click',()=>{ if(!currentCombo) return; applyRangeFromCombo(currentCombo); calcola(); });
  const upd=(chg)=>{ if(!currentCombo) return; const off=+el('offsetSlider').value; const c=chg({...currentCombo}); c.gr=c.or-c.ir+c.sfera+off; setCurrentCombo(c); };
  el('btnIRminus').addEventListener('click',()=>upd(c=>{c.ir--;return c;}));
  el('btnIRplus').addEventListener('click', ()=>upd(c=>{c.ir++;return c;}));
  el('btnORminus').addEventListener('click',()=>upd(c=>{c.or--;return c;}));
  el('btnORplus').addEventListener('click', ()=>upd(c=>{c.or++;return c;}));
  el('btnSfera').addEventListener('click',   ()=>upd(c=>{const i=SFERE.indexOf(c.sfera); c.sfera=SFERE[(i+1)%SFERE.length]; return c;}));
  const canvas=document.getElementById('schematicCanvas');
  canvas.addEventListener('click',e=>{
    if(!currentCombo) return;
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top;
    const cx=canvas.width*0.38, cy=canvas.height*0.52;
    const R_or=Math.min(canvas.width,canvas.height)*0.28; const R_ir=R_or*0.62;
    const dist=Math.hypot(x-cx,y-cy), near=r=>Math.abs(dist-r)<12;
    const off=+el('offsetSlider').value;
    if(near(R_ir)){ const dir=(x>cx?1:-1); const ir=currentCombo.ir+dir; const gr=currentCombo.or - ir + currentCombo.sfera + off; const combo={...currentCombo, ir, gr}; setCurrentCombo(combo); }
    else if(near(R_or)){ const dir=(x>cx?1:-1); const orv=currentCombo.or+dir; const gr= orv - currentCombo.ir + currentCombo.sfera + off; const combo={...currentCombo, or: orv, gr}; setCurrentCombo(combo); }
  });
  calcola();
});
