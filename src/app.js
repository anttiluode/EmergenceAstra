import {World} from './world.js';
import {probabilities, ACTIONS} from './core.js';

const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d');
const chart = $('chart'), chartCtx = chart.getContext('2d');
const symbols = ['○', '△', '□', '◇'];
const colors = ['#ddbd77', '#7fc4bb', '#b3a2d8', '#cf8d9a'];
let world = new World(), running = true, speed = 3, view = 'lineage';
let selected = [...world.cells.keys()][0], history = [], lastMeasure = -Infinity;
let lastTime = performance.now(), accumulator = 0, lastUI = 0;

function notice(message, error = false) {
  $('notice').textContent = message;
  $('notice').style.color = error ? '#f3a69c' : '';
}

function syncControls() {
  $('learning').checked = world.config.learning;
  $('growth').checked = world.config.growth;
  $('channel').value = world.config.channel;
  $('seed').value = world.config.seed;
  $('world-size').textContent = `${world.config.width} × ${world.config.height} sites`;
  $('world-limits').textContent = `This world has a ${world.config.cap}-cell ceiling, 4 symbols, 3 catalysts, and 4 developmental actions. Each cell can keep 4 connections and live for 6,000 ticks. These limits are supplied, not evolved.`;
  canvas.height = Math.round(canvas.width * world.config.height / world.config.width);
  canvas.style.aspectRatio = `${world.config.width} / ${world.config.height}`;
}

function playState() {
  $('play').textContent = running ? 'Ⅱ Pause' : '▶ Run';
  $('status').innerHTML = `<i></i> ${world.cells.size ? running ? 'WORLD RUNNING' : 'WORLD PAUSED' : 'CULTURE EMPTY'}`;
}

function measure() {
  const scores = world.assay();
  history.push({...world.stats(), ...scores, learning: world.config.learning, growth: world.config.growth, channel: world.config.channel});
  if (history.length > 1000) history.shift();
  lastMeasure = world.tick;
  $('score').textContent = scores.intact === null ? '—' : `${(scores.intact*100).toFixed(1)}%`;
  $('shuffled').textContent = scores.shuffled === null ? '—' : `${(scores.shuffled*100).toFixed(1)}%`;
  $('score-bar').style.width = `${(scores.intact ?? 0)*100}%`;
  drawChart();
}

function drawChart() {
  const w = chart.width, h = chart.height, inset = 6;
  chartCtx.clearRect(0,0,w,h);
  chartCtx.strokeStyle = '#66766a'; chartCtx.setLineDash([5,7]); chartCtx.lineWidth = 1;
  chartCtx.beginPath(); chartCtx.moveTo(inset,h-(h-2*inset)/3-inset); chartCtx.lineTo(w-inset,h-(h-2*inset)/3-inset); chartCtx.stroke(); chartCtx.setLineDash([]);
  const points = history.slice(-120);
  const minTick = points[0]?.tick ?? 0, span = Math.max(1,(points.at(-1)?.tick ?? 1)-minTick);
  chartCtx.strokeStyle = '#c4e88a'; chartCtx.lineWidth = 2; chartCtx.beginPath();
  let started = false;
  for (const point of points) {
    if (point.intact === null) { started = false; continue; }
    const x = inset+(w-inset*2)*(point.tick-minTick)/span, y = h-inset-point.intact*(h-inset*2);
    if (started) chartCtx.lineTo(x,y); else chartCtx.moveTo(x,y);
    started = true;
  }
  chartCtx.stroke();
}

function heatmap(id, table, rows, columns) {
  const el = $(id);
  el.style.gridTemplateColumns = `32px repeat(${columns.length}, 1fr)`;
  let html = '<span></span>' + columns.map(x => `<span class="label">${x}</span>`).join('');
  rows.forEach((label,r) => {
    html += `<span class="label">${label}</span>`;
    probabilities(table,r,columns.length).forEach(p => {
      html += `<span class="heat" style="background:rgba(142,187,88,${0.08+p*.72})" title="${(p*100).toFixed(2)}%">${Math.round(p*100)}</span>`;
    });
  });
  el.innerHTML = html;
}

function inspect() {
  const c = world.cells.get(selected);
  if (!c) {
    $('cell-title').textContent = selected ? `Cell ${selected} has died` : 'Select a living cell';
    $('cell-info').textContent = 'Select another cell to inspect its current rules.';
    for (const id of ['send-table','receive-table','genome','development']) $(id).textContent = '';
    return;
  }
  $('cell-title').textContent = `Cell ${c.id} · lineage ${c.lineage}`;
  $('cell-badge').textContent = `GENERATION ${c.generation}`;
  $('cell-info').textContent = `Energy ${c.energy.toFixed(2)} · age ${c.age} ticks · ${world.degree(c.id)} connections · last action: ${ACTIONS[c.lastAction]}`;
  heatmap('send-table', c.policy.send, ['R₀','R₁','R₂'], symbols);
  heatmap('receive-table', c.policy.receive, symbols, ['C₀','C₁','C₂']);
  $('genome').textContent = c.genome.map(g => g.toString(16).padStart(2,'0')).join(' ');
  const energyState = c.energy < 3 ? 0 : c.energy < 6 ? 1 : 2;
  const probs = probabilities(c.policy.develop,energyState*5+c.lastSymbol,4);
  $('development').textContent = `Current developmental probabilities: ${ACTIONS.map((a,i) => `${a} ${Math.round(probs[i]*100)}%`).join(' · ')}. Learning rate: ${c.policy.rate.toFixed(3)}.`;
}

function drawWorld() {
  const {width,height} = world.config, sx = canvas.width/width, sy = canvas.height/height;
  ctx.fillStyle = '#0d1611'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let i=0;i<world.nutrient.length;i++) {
    const x=i%width*sx,y=Math.floor(i/width)*sy,n=world.nutrient[i];
    ctx.fillStyle = ['#786444','#38675e','#58486f'][world.resource[i]];
    ctx.globalAlpha = .025+n*.055; ctx.fillRect(x+1,y+1,sx-2,sy-2);
    ctx.globalAlpha = .12+n*.15; ctx.fillRect(x+sx/2,y+sy/2,1.2,1.2);
  }
  ctx.globalAlpha = 1;
  const position = site => [(site%width+.5)*sx,(Math.floor(site/width)+.5)*sy];
  for (const bond of world.bonds.values()) {
    const a = world.cells.get(bond.a), b = world.cells.get(bond.b);
    const [ax,ay]=position(a.site),[bx,by]=position(b.site);
    ctx.strokeStyle=`rgba(166,205,123,${.1+bond.strength*.5})`;ctx.lineWidth=1+bond.strength*2;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  }
  for (const c of world.cells.values()) {
    const [x,y]=position(c.site),radius = Math.min(sx,sy)*(.16+.17*Math.min(c.energy/8,1));
    const color = view === 'energy' ? `hsl(${30+Math.min(c.energy/10,1)*75} 60% 65%)`
      : view === 'signal' ? colors[c.sent%4] : `hsl(${(c.lineage*137.508)%360} 38% 67%)`;
    ctx.fillStyle=color;ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(x,y,radius+4,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle='#dae9c1';ctx.beginPath();ctx.arc(x-.8,y-.8,Math.max(1,radius*.22),0,Math.PI*2);ctx.fill();
    if(c.id===selected){ctx.strokeStyle='#e1f8ad';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,radius+6,0,Math.PI*2);ctx.stroke();}
  }
  for (const e of world.events) {
    const [ax,ay]=position(e.a),[bx,by]=position(e.b),t=Math.min(1,(world.tick-e.tick)/7);
    ctx.globalAlpha=(1-t)*(e.success?.8:.25);ctx.fillStyle=colors[e.symbol];
    ctx.beginPath();ctx.arc(ax+(bx-ax)*t,ay+(by-ay)*t,e.success?2.4:1.3,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  $('empty').hidden = world.cells.size > 0;
}

function updateUI() {
  const stats = world.stats();
  for (const id of ['tick','population','lineages','generation']) $(id).textContent=stats[id].toLocaleString();
  if(world.tick-lastMeasure>=200) measure();
  inspect(); playState();
}

function download(name, object) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(object,null,2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('play').onclick=()=>{running=!running;accumulator=0;playState();};
$('step').onclick=()=>{running=false;world.step();updateUI();drawWorld();};
$('reset').onclick=()=>{
  const seed = Number($('seed').value);
  if(!Number.isInteger(seed)||seed<0||seed>4294967295){notice('Choose a whole seed from 0 to 4294967295.',true);return;}
  world=new World({...world.config,seed});selected=[...world.cells.keys()][0];history=[];lastMeasure=-Infinity;accumulator=0;
  syncControls();measure();updateUI();drawWorld();notice(`Fresh world started with seed ${seed}.`);
};
$('speed').oninput=()=>{speed=Number($('speed').value);$('speed-value').textContent=`${speed}×`;};
for(const key of ['learning','growth']) $(key).onchange=()=>{world.config[key]=$(key).checked;measure();};
$('channel').onchange=()=>{world.config.channel=$('channel').value;measure();notice('Channel changed in the running world. The assay still compares all channels with learning frozen.');};
$('assay').onclick=()=>{measure();notice(`Measured ${history.at(-1).pairs} directed neighboring pairs without changing the world.`);};
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
  view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));drawWorld();
});
canvas.onclick=event=>{
  const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*world.config.width,y=(event.clientY-rect.top)/rect.height*world.config.height;
  let nearest=null,distance=2.5;
  for(const c of world.cells.values()){
    const d=Math.hypot(c.site%world.config.width+.5-x,Math.floor(c.site/world.config.width)+.5-y);
    if(d<distance){nearest=c.id;distance=d;}
  }
  if(nearest!==null){selected=nearest;inspect();drawWorld();}
};
$('save').onclick=()=>{download(`astra-seed-${world.config.seed}-tick-${world.tick}.json`,{format:'astra-viewer-1',world:world.snapshot(),history});notice('Checkpoint downloaded. Resume it here to continue the same world.');};
$('export').onclick=()=>{measure();download(`astra-measures-${world.config.seed}-${world.tick}.json`,{format:'astra-measures-1',config:world.config,history});notice('Measures downloaded with settings recorded at each observation.');};
$('load').onclick=()=>$('file').click();
$('file').onchange=async()=>{
  const file=$('file').files[0];if(!file)return;
  try{
    if(file.size>20*1024*1024)throw new Error('Checkpoint is larger than 20 MB.');
    const data=JSON.parse(await file.text());
    const restored=World.restore(data.format==='astra-viewer-1'?data.world:data);
    let imported=[];
    if(data.format==='astra-viewer-1' && Array.isArray(data.history)){
      imported=data.history.slice(-1000).filter(p=>p&&Number.isInteger(p.tick)&&p.tick>=0&&p.tick<=restored.tick&&(p.intact===null||(Number.isFinite(p.intact)&&p.intact>=0&&p.intact<=1)));
    }
    world=restored;history=imported;selected=[...world.cells.keys()][0];running=false;accumulator=0;
    syncControls();measure();updateUI();drawWorld();notice(`Resumed seed ${world.config.seed} at tick ${world.tick}. Press Run to continue.`);
  }catch(error){notice(`Could not resume: ${error.message}`,true);}
  $('file').value='';
};

function frame(time){
  const elapsed=Math.min(100,time-lastTime);lastTime=time;
  if(running&&world.cells.size){
    accumulator=Math.min(30,accumulator+elapsed/1000*30*speed);
    const start=performance.now();
    while(accumulator>=1&&performance.now()-start<10){world.step();accumulator--;}
  }
  drawWorld();
  if(time-lastUI>300){updateUI();lastUI=time;}
  requestAnimationFrame(frame);
}
syncControls();measure();updateUI();requestAnimationFrame(frame);
