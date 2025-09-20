// --- util ---
const $ = (id)=>document.getElementById(id);
const SFERE=[-4,-2,0,2,4];

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
  if(data.length){
    current = data.reduce((a,b)=> Math.abs(a.gr-((+$('grMin').value+ +$('grMax').value)/2)) < Math.abs(b.gr-((+$('grMin').value+ +$('grMax').value)/2)) ? a:b);
    updatePanel(); draw(current);
  }
}

function updatePanel(){
  if(!current) return;
  const r=current;
  $('valOR').textContent = r.or.toFixed(0);
  $('valIR').textContent = r.ir.toFixed(0);
  $('valOff').textContent= r.off.toFixed(1);
  $('valSf').textContent = r.sfera.toFixed(0);
  $('valGR').textContent = r.gr.toFixed(3);

  $('sumOR').textContent = `+${r.or.toFixed(3)} µm`;
  $('sumIR').textContent = `${(-r.ir).toFixed(3)} µm`;
  $('sumOff').textContent= `+${r.off.toFixed(3)} µm`;
  $('sumSf1').textContent= `${(r.sfera).toFixed(3)} µm`;
  $('sumSf2').textContent= `${(r.sfera).toFixed(3)} µm`;
  $('sumGR').textContent = `${r.gr.toFixed(3)} µm`;
}

// --- svg drawing migliorato con tacca rossa e quote esterne ---
function draw(r){
  const svg = $('bearingSVG');
  const ns  = 'http://www.w3.org/2000/svg';
  svg.innerHTML = '';

  const W=900, H=540; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const cx=350, cy=290;
  const R_or=160, R_ir=102;
  const RB = (R_or - R_ir) * 0.46; // sfere grandi
  const PAD = 26;

  const make=(name,attrs,parent=svg)=>{ const el=document.createElementNS(ns,name);
    for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v); parent.appendChild(el); return el; };

  // marker frecce
  const defs=make('defs',{});
  const m=make('marker',{id:'arr',markerWidth:10,markerHeight:10,refX:5,refY:3,orient:'auto',markerUnits:'strokeWidth'},defs);
  make('path',{d:'M0,0 L0,6 L6,3 z',fill:'#0c2a4f'},m);

  // pannello
  make('rect',{x:PAD,y:PAD,width:W-PAD*2,height:H-PAD*2,rx:16,fill:'#ffffff',stroke:'#c7d7ef','stroke-width':1.5});

  // anelli + piste
  make('circle',{cx,cy,r:R_or,fill:'none',stroke:'#1f5fbf','stroke-width':10});
  make('circle',{cx,cy,r:R_or-14,fill:'none',stroke:'#1f5fbf','stroke-width':10});
  make('circle',{cx,cy,r:R_ir,fill:'none',stroke:'#6ea5e0','stroke-width':8});
  make('circle',{cx,cy,r:R_ir-12,fill:'none',stroke:'#6ea5e0','stroke-width':8});

  // sfere
  const shift = Math.max(-6, Math.min(6, r.sfera));
  const balls = [
    {x:cx+shift, y:cy-(R_ir+R_or)/2},
    {x:cx-shift, y:cy+(R_ir+R_or)/2},
  ];
  balls.forEach(b=>{
    make('circle',{cx:b.x,cy:b.y,r:RB,fill:'#cfe0f6',stroke:'#7fa1d8','stroke-width':2});
    make('line',{x1:b.x-6,y1:b.y,x2:b.x+6,y2:b.y,stroke:'#4f79b3','stroke-width':1.6});
    make('line',{x1:b.x,y1:b.y-6,x2:b.x,y2:b.y+6,stroke:'#4f79b3','stroke-width':1.6});
  });

  // tacca rossa in basso sul bordo esterno (tipo macchina)
  const tx = cx, ty = cy + R_or + 6;
  make('path',{d:`M ${tx-10} ${ty} L ${tx} ${ty+14} L ${tx+10} ${ty} Z`, fill:'#b3261e'});

  // funzione per etichetta in box
  const boxLabel=(x,y,text,anchor='start',color='#0c2a4f')=>{
    const pad=8;
    const g=make('g',{});
    const t=make('text',{x:x+pad,y:y+18,fill:color,'font-size':16,'font-family':'Arial','text-anchor':anchor==='end'?'end':'start'},g);
    t.textContent=text;
    const w=t.getComputedTextLength()+pad*2, h=26;
    make('rect',{x:x,y:y,width:w,height:h,rx:6,ry:6,fill:'#fff',stroke:'#7fa1d8','stroke-width':1.5},g);
    g.appendChild(t);
    return g;
  };

  // Ø OR (sopra)
  make('line',{x1:cx-R_or,y1:cy-R_or-24,x2:cx+R_or,y2:cy-R_or-24,stroke:'#c0352b','stroke-width':2,
               'marker-start':'url(#arr)','marker-end':'url(#arr)'});
  boxLabel(cx-R_or, cy-R_or-48, `Ø OR: ${r.or.toFixed(0)} µm`);

  // Ø IR (sotto)
  make('line',{x1:cx-R_ir,y1:cy+R_ir+28,x2:cx+R_ir,y2:cy+R_ir+28,stroke:'#2da44e','stroke-width':2,
               'marker-start':'url(#arr)','marker-end':'url(#arr)'});
  boxLabel(cx-R_ir, cy+R_ir+36, `Ø IR: ${r.ir.toFixed(0)} µm`);

  // GR verticale a destra
  make('line',{x1:cx+R_or+34,y1:cy+R_ir,x2:cx+R_or+34,y2:cy+R_or,stroke:'#b3261e','stroke-width':2,
               'marker-start':'url(#arr)','marker-end':'url(#arr)'});
  boxLabel(cx+R_or+42, cy+(R_ir+R_or)/2-13, `GR: ${r.gr.toFixed(2)} µm`,'start','#b3261e');

  // leader a destra (diametro sfera e misure)
  const lead=(x1,y1,x2,y2,text)=>{
    make('line',{x1,y1,x2,y2,stroke:'#7fa1d8','stroke-dasharray':'6 6','stroke-width':1.6});
    boxLabel(x2+6,y2-14,text,'start','#7fa1d8');
  };
  lead(cx, cy-(R_ir+R_or)/2-RB, 740, 110, `Diametro sfera: ${r.sfera.toFixed(0)} µm`);
  lead(cx-R_ir, cy, 740, 170, `Misura Ø IR: ${r.ir.toFixed(0)} µm`);
  lead(cx+R_or, cy, 740, 230, `Misura Ø OR: +${r.or.toFixed(0)} µm`);

  // click per regolazioni
  const clickRing=(rad,prop)=>{
    const hit=make('circle',{cx,cy,r:rad,fill:'transparent',stroke:'transparent','stroke-width':14});
    hit.addEventListener('click',e=>{
      if(!r) return;
      r[prop] += (e.offsetX>cx?1:-1);
      r.gr = r.or - r.ir + r.sfera + r.off;
      updatePanel(); draw(r);
    });
  };
  clickRing(R_ir,'ir');
  clickRing(R_or,'or');
}

// eventi
$('btnCalc').addEventListener('click',calcola);
$('onlyValid').addEventListener('change',calcola);
$('offset').addEventListener('input',calcola);

// boot
calcola();
