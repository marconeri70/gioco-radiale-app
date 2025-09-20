// --- util ---
const $ = (id)=>document.getElementById(id);
const SFERE=[-4,-2,0,2,4];

// --- combinazioni ---
let data=[], current=null;

function calcola(){
  const irMin=+$('irMin').value, irMax=+$('irMax').value;
  const orMin=+$('orMin').value, orMax=+$('orMax').value;
  const grMin=+$('grMin').value, grMax=+$('grMax').value;
  const off=+$('offset').value; $('offOut').textContent=off.toFixed(1)+' µm';
  data=[];
  for(let ir=irMin; ir<=irMax; ir++){
    for(let or=orMin; or<=orMax; or++){
      for(const s of SFERE){
        const gr=or-ir+s+off;
        const ok=gr>=grMin && gr<=grMax;
        data.push({ir,or,sfera:s,off,gr,ok});
      }
    }
  }
  renderTable();
}

function renderTable(){
  const tbody = $('tbl').querySelector('tbody'); tbody.innerHTML='';
  const onlyValid=$('onlyValid').checked;
  (onlyValid?data.filter(r=>r.ok):data).forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.ir}</td><td>${r.or}</td><td>${r.sfera}</td><td>${r.off.toFixed(1)}</td><td>${r.gr.toFixed(2)}</td><td class="${r.ok?'ok':'ko'}">${r.ok?'✔':'✖'}</td>`;
    tr.addEventListener('click',()=>{ current=r; updatePanel(); draw(r); });
    tbody.appendChild(tr);
  });
  // auto selezione migliore
  if(data.length){
    current = data.reduce((a,b)=> Math.abs(a.gr-((+$('grMin').value+ +$('grMax').value)/2)) < Math.abs(b.gr-((+$('grMin').value+ +$('grMax').value)/2)) ? a:b);
    updatePanel(); draw(current);
  }
}

function updatePanel(){
  if(!current) return;
  $('valOR').textContent = current.or.toFixed(0);
  $('valIR').textContent = current.ir.toFixed(0);
  $('valOff').textContent= current.off.toFixed(1);
  $('valSf').textContent = current.sfera.toFixed(0);
  $('valGR').textContent = current.gr.toFixed(3);
}

// --- svg drawing ---
function draw(r){
  const svg = $('bearingSVG');
  const ns='http://www.w3.org/2000/svg';
  svg.innerHTML='';
  const W=900,H=540,cx=360,cy=300;
  const R_or=160, R_ir=100;
  const R_ball=(R_or-R_ir)*0.9/2 + (R_or+R_ir)/2 - ((R_or+R_ir)/2); // radius visual
  const RB = (R_or-R_ir)*0.9/2; // simpler

  // helpers
  const make = (name, attrs, parent=svg)=>{
    const el=document.createElementNS(ns,name);
    for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
    parent.appendChild(el); return el;
  };

  // outer ring & race
  make('circle',{cx,cy,r:R_or,fill:'none',stroke:'#1f5fbf','stroke-width':10});
  make('circle',{cx,cy,r:R_or-14,fill:'none',stroke:'#1f5fbf','stroke-width':10});
  // inner ring & race
  make('circle',{cx,cy,r:R_ir,fill:'none',stroke:'#6ea5e0','stroke-width':8});
  make('circle',{cx,cy,r:R_ir-12,fill:'none',stroke:'#6ea5e0','stroke-width':8});

  // balls (top & bottom)
  const shift = Math.max(-6,Math.min(6,r.sfera)); // small visual shift by sfera
  const b1={x:cx+shift,y:cy-(R_ir+R_or)/2+22}, b2={x:cx-shift,y:cy+(R_ir+R_or)/2-22};
  [b1,b2].forEach(b=>{
    make('circle',{cx:b.x,cy:b.y,r:22,fill:'#cfe0f6',stroke:'#7fa1d8','stroke-width':2});
    make('line',{x1:b.x-6,y1:b.y,x2:b.x+6,y2:b.y,stroke:'#4f79b3','stroke-width':1.5});
    make('line',{x1:b.x,y1:b.y-6,x2:b.x,y2:b.y+6,stroke:'#4f79b3','stroke-width':1.5});
  });

  // dimension helpers
  const dim = (x1,y1,x2,y2,label,color='#0c2a4f')=>{
    make('line',{x1,y1,x2,y2,stroke:color,'stroke-width':2,'marker-start':'url(#a)','marker-end':'url(#a)'});
    const tx=(x1+x2)/2, ty=(y1+y2)/2-6;
    make('text',{x:tx,y:ty,fill:color,'text-anchor':'middle','font-size':14},svg).textContent=label;
  };
  // marker arrow
  const defs=make('defs',{});
  const m=make('marker',{id:'a',markerWidth:10,markerHeight:10,refX:5,refY:3,orient:'auto',markerUnits:'strokeWidth'},defs);
  make('path',{d:'M0,0 L0,6 L6,3 z',fill:'#0c2a4f'},m);

  // dimensions OR (top) & IR (bottom)
  dim(cx-R_or, cy-R_or-30, cx+R_or, cy-R_or-30, `Ø OR: ${r.or.toFixed(0)} µm`, '#c0352b');
  dim(cx-R_ir, cy+R_ir+34, cx+R_ir, cy+R_ir+34, `Ø IR: ${r.ir.toFixed(0)} µm`, '#2da44e');

  // GR vertical at right
  dim(cx+R_or+30, cy+R_ir, cx+R_or+30, cy+R_or, `GR: ${r.gr.toFixed(2)} µm`, '#c0352b');

  // leaders
  const lead = (x1,y1,x2,y2,text)=>{
    const g=make('g',{});
    make('line',{x1,y1,x2,y2,stroke:'#7fa1d8','stroke-width':1.6,'stroke-dasharray':'6 6'},g);
    make('text',{x:x2+6,y:y2-6,fill:'#7fa1d8','font-size':13},g).textContent=text;
  };
  lead(cx, cy-(R_ir+R_or)/2+22-22, 760, 90, `Diametro sfera: ${r.sfera.toFixed(0)} µm`);
  lead(cx-R_ir, cy, 760, 170, `Misura Ø IR: ${r.ir.toFixed(0)} µm`);
  make('text',{x:760,y:250,fill:'#7fa1d8','font-size':13},svg).textContent=`Misura Ø OR: +${r.or.toFixed(0)} µm`;

  // clickable rings to nudge ±1
  const clickAdjust=(rad,prop)=>{
    const ring=make('circle',{cx,cy,r:rad,fill:'transparent',stroke:'transparent','stroke-width':14});
    ring.addEventListener('click',e=>{
      if(!current) return;
      current[prop]+= (e.offsetX>cx?1:-1);
      current.gr=current.or-current.ir+current.sfera+current.off;
      updatePanel(); draw(current);
    });
  };
  clickAdjust(R_ir,'ir');
  clickAdjust(R_or,'or');
}

// interactions
$('btnCalc').addEventListener('click',calcola);
$('onlyValid').addEventListener('change',calcola);
$('offset').addEventListener('input',calcola);

// bootstrap
calcola();
