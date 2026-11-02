(()=>{
if(window.__gwspin){window.__gwspin.open();return;}
const RE=/\/app\/resources\/catalog\/product\/threeSixty\/([^\/?"'\s)\\]+)\//g;
const p=n=>String(n).padStart(2,'0');
function findFolders(){
  // Most specific source first: the gallery currently on screen, then page markup, then the
  // initial page data (can be stale after in-site navigation), then loaded network resources.
  const s=new Set();
  const scan=t=>{if(!t)return;let m;RE.lastIndex=0;while((m=RE.exec(t)))s.add(decodeURIComponent(m[1]));};
  document.querySelectorAll('img,source').forEach(i=>{scan(i.getAttribute('src'));scan(i.getAttribute('srcset'));scan(i.currentSrc);});
  if(s.size)return [...s];
  const nd=document.getElementById('__NEXT_DATA__');
  [...document.body.children].forEach(el=>{if(el!==nd&&el.id!=='gwspin-host')scan(el.innerHTML);});
  if(s.size)return [...s];
  if(nd)scan(nd.textContent);
  if(s.size)return [...s];
  performance.getEntriesByType('resource').forEach(e=>scan(e.name));
  return [...s];
}
const ROOT=location.origin+'/app/resources/catalog/product/threeSixty/';
const head=u=>fetch(u,{method:'HEAD'}).then(r=>r.ok).catch(()=>false);
async function probe(base){
  const cols=await Promise.all(Array.from({length:72},(_,i)=>head(base+'01-'+p(i+1)+'.jpg?w=40')));
  let nc=0;while(nc<72&&cols[nc])nc++;
  const rows=await Promise.all(Array.from({length:9},(_,i)=>head(base+p(i+1)+'-01.jpg?w=40')));
  let nr=0;while(nr<9&&rows[nr])nr++;
  return{nr,nc};
}

const host=document.createElement('div');
const vis=(el,v)=>{el.style.setProperty('display',v?'block':'none','important');};
const isOpen=()=>host.style.display!=='none';
host.style.cssText='position:fixed;inset:0;z-index:2147483647;';
const sh=host.attachShadow({mode:'open'});
sh.innerHTML=`<style>
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{position:fixed;inset:0;background:#0e0d0c;color:#ece7df;display:flex;flex-direction:column}
.top,.bot{display:flex;align-items:center;gap:12px;padding:10px 16px;flex-wrap:wrap}
.top{justify-content:space-between}
.bot{padding-right:84px}
.name{font-size:14px;font-weight:600;letter-spacing:.02em}
.meta{font-size:12px;color:#a59d92;font-variant-numeric:tabular-nums}
select,button{font:inherit;font-size:13px;color:#ece7df;background:#2a2723;border:1px solid #47423b;border-radius:6px;padding:6px 10px;cursor:pointer}
button:hover,select:hover{border-color:#c9a45c}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #c9a45c;outline-offset:2px}
button.on{background:#c9a45c;color:#1b1814;border-color:#c9a45c}
.stage{flex:1;position:relative;min-height:0;margin:0 16px;border-radius:8px;overflow:hidden;cursor:grab;touch-action:none}
.stage.drag{cursor:grabbing}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font-size:14px;color:#3a352f;pointer-events:none}
[hidden]{display:none!important}
.bar{position:absolute;left:0;bottom:0;height:3px;background:#c9a45c;transition:width .2s}
.grp{display:flex;align-items:center;gap:6px}
.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#a59d92}
input[type=range]{width:min(360px,50vw);accent-color:#c9a45c}
.hint{font-size:12px;color:#8a8278;margin-left:auto}
.wrap{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (max-width:700px),(pointer:coarse){.hint,.name{display:none}.meta{font-size:11px}.bot{padding-right:76px}.stage{margin:0 8px}.top,.bot{padding:8px 10px;gap:8px}input[type=range]{width:calc(100vw - 90px)}}
</style>
<div class="wrap" role="dialog" aria-label="360 viewer">
 <div class="top">
  <div class="grp"><span class="name">360° Viewer</span><select id="spinSel" hidden></select><span class="meta" id="meta">Finding spin…</span></div>
  <button id="close" title="Close (Esc)">Close ✕</button>
 </div>
 <div class="stage" id="stage"><canvas id="cv"></canvas><div class="msg" id="msg">Loading…</div><div class="bar" id="bar"></div></div>
 <div class="bot">
  <div class="grp"><span class="lbl">Angle</span><input type="range" id="ang" min="0" max="360" step="0.5" value="0"></div>
  <div class="grp"><span class="lbl">Camera low → top</span><span id="rows" class="grp"></span></div>
  <button id="auto">Auto-spin</button>
  <button id="blend" class="on" title="Cross-fade between photos for smoother turning">Smooth</button>
  <button id="reset">Reset view</button>
  <span class="hint">Drag to turn · drag down to look from above · scroll to zoom · Shift+drag to pan · ← → ↑ ↓ · Space</span>
 </div>
</div>`;
const $=id=>sh.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),stage=$('stage'),msg=$('msg'),bar=$('bar');
const S={folders:[],base:'',nr:0,nc:0,imgs:[],a:0,row:0,z:1,px:0,py:0,vel:0,auto:false,blend:true,bg:'#fff',dpr:1,raf:0,last:0,dragging:false,token:0};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize(){const r=stage.getBoundingClientRect();S.dpr=devicePixelRatio||1;cv.width=Math.round(r.width*S.dpr);cv.height=Math.round(r.height*S.dpr);draw();}
function getImg(r,c){const row=S.imgs[r];if(!row)return null;const im=row[c];if(im&&im.complete&&im.naturalWidth)return im;
  for(let d=1;d<S.nc;d++){for(const cc of[(c+d)%S.nc,(c-d+S.nc)%S.nc]){const j=row[cc];if(j&&j.complete&&j.naturalWidth)return j;}}return null;}
function draw(){
  const W=cv.width,H=cv.height;ctx.fillStyle=S.bg;ctx.fillRect(0,0,W,H);
  if(!S.nc)return;
  const nc=S.nc,a=((S.a%nc)+nc)%nc,i0=Math.floor(a),t=a-i0,i1=(i0+1)%nc;
  const A=getImg(S.row,S.blend?i0:Math.round(a)%nc);if(!A)return;
  const s=Math.min(W/A.naturalWidth,H/A.naturalHeight)*S.z,w=A.naturalWidth*s,h=A.naturalHeight*s;
  const x=(W-w)/2+S.px*S.dpr,y=(H-h)/2+S.py*S.dpr;
  ctx.imageSmoothingQuality='high';ctx.globalAlpha=1;ctx.drawImage(A,x,y,w,h);
  if(S.blend&&t>0.002){const B=getImg(S.row,i1);if(B&&B!==A){ctx.globalAlpha=t;ctx.drawImage(B,x,y,w,h);ctx.globalAlpha=1;}}
  const deg=a/nc*360;$('ang').value=deg.toFixed(1);
}
function loop(ts){
  const dt=Math.min(50,ts-(S.last||ts));S.last=ts;let go=false;
  if(S.auto&&!S.dragging){S.a+=dt*S.nc/9000;go=true;}
  else if(!S.dragging&&Math.abs(S.vel)>0.00005){S.a+=S.vel*dt;S.vel*=Math.pow(0.94,dt/16);go=true;}
  draw();S.raf=go?requestAnimationFrame(loop):0;if(!go)S.last=0;
}
function kick(){if(!S.raf){S.last=0;S.raf=requestAnimationFrame(loop);}}
function setRow(r){S.row=Math.max(0,Math.min(S.nr-1,r));[...$('rows').children].forEach((b,i)=>b.classList.toggle('on',i===S.row));draw();}
function resetView(){S.z=1;S.px=0;S.py=0;draw();}

async function load(folder){
  const tok=++S.token;S.base=ROOT+encodeURIComponent(folder)+'/';S.nc=0;S.imgs=[];msg.hidden=false;msg.textContent='Measuring spin…';bar.style.width='0';
  const g=await probe(S.base);if(tok!==S.token)return;
  if(!g.nc){msg.textContent='Could not load this spin. Try reloading the product page.';return;}
  S.nr=g.nr;S.nc=g.nc;S.a=0;S.row=0;S.vel=0;resetView();
  $('meta').textContent=`${g.nc} angles × ${g.nr} heights · ${Math.round(360/g.nc)}° per photo`;
  $('rows').innerHTML='';for(let r=0;r<g.nr;r++){const b=document.createElement('button');b.textContent=r+1;b.title='Camera height '+(r+1);b.onclick=()=>setRow(r);$('rows').appendChild(b);}
  setRow(0);
  const w=Math.min(1600,Math.round(Math.max(innerWidth,innerHeight)*(devicePixelRatio||1)/100)*100);
  let done=0;const total=g.nr*g.nc;
  const order=[];for(let r=0;r<g.nr;r++)for(let c=0;c<g.nc;c++)order.push([r,c]);
  S.imgs=Array.from({length:g.nr},()=>new Array(g.nc));
  order.forEach(([r,c])=>{const im=new Image();im.decoding='async';
    im.onload=im.onerror=()=>{if(tok!==S.token)return;done++;bar.style.width=(done/total*100)+'%';
      if(r===0&&c===0&&im.naturalWidth){try{const k=document.createElement('canvas');k.width=k.height=1;const kc=k.getContext('2d');kc.drawImage(im,0,0,1,1,0,0,1,1);const d=kc.getImageData(0,0,1,1).data;S.bg=`rgb(${d[0]},${d[1]},${d[2]})`;}catch(e){}msg.hidden=true;}
      if(done===total)setTimeout(()=>bar.style.width='0',400);draw();};
    im.src=S.base+p(r+1)+'-'+p(c+1)+'.jpg?fm=webp&w='+w;S.imgs[r][c]=im;});
}

// pointer
const pts=new Map();let lastX=0,lastY=0,lastT=0,accY=0,pinch0=0,z0=1,panMode=false;
stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2){const[a,b]=[...pts.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);z0=S.z;return;}
  S.dragging=true;S.auto=false;$('auto').classList.remove('on');S.vel=0;panMode=e.shiftKey||e.button!==0;
  lastX=e.clientX;lastY=e.clientY;lastT=performance.now();accY=0;stage.classList.add('drag');});
stage.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2){const[a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){S.z=Math.max(1,Math.min(6,z0*d/pinch0));draw();}return;}
  if(!S.dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY,now=performance.now(),dt=Math.max(1,now-lastT);
  if(panMode){S.px+=dx;S.py+=dy;}
  else{const turn=Math.max(500,Math.min(1100,stage.clientWidth*1.1));const da=-dx/turn*S.nc;S.a+=da;S.vel=S.vel*0.6+(da/dt)*0.4;
    accY+=dy;if(Math.abs(accY)>45){setRow(S.row+(accY>0?1:-1));accY=0;}}
  lastX=e.clientX;lastY=e.clientY;lastT=now;draw();});
const up=e=>{pts.delete(e.pointerId);if(pts.size)return;pinch0=0;if(!S.dragging)return;S.dragging=false;stage.classList.remove('drag');
  if(performance.now()-lastT>80||reduce||panMode)S.vel=0;kick();};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
stage.addEventListener('contextmenu',e=>e.preventDefault());
stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();const cx=e.clientX-r.left-r.width/2,cy=e.clientY-r.top-r.height/2;
  const nz=Math.max(1,Math.min(6,S.z*Math.exp(-e.deltaY*0.0015)));S.px=cx-(cx-S.px)*(nz/S.z);S.py=cy-(cy-S.py)*(nz/S.z);S.z=nz;if(S.z===1){S.px=0;S.py=0;}draw();},{passive:false});
stage.addEventListener('dblclick',resetView);
$('ang').addEventListener('input',e=>{S.vel=0;S.auto=false;$('auto').classList.remove('on');S.a=e.target.value/360*S.nc;draw();});
$('auto').onclick=()=>{S.auto=!S.auto;$('auto').classList.toggle('on',S.auto);kick();};
$('blend').onclick=()=>{S.blend=!S.blend;$('blend').classList.toggle('on',S.blend);draw();};
$('reset').onclick=()=>{S.a=0;setRow(0);resetView();};
$('close').onclick=()=>close();
$('spinSel').onchange=e=>load(e.target.value);
function onKey(e){if(!isOpen())return;const k=e.key;let h=true;
  if(k==='Escape')close();else if(k==='ArrowLeft'){S.a-=1;S.vel=0;}else if(k==='ArrowRight'){S.a+=1;S.vel=0;}
  else if(k==='ArrowUp')setRow(S.row+1);else if(k==='ArrowDown')setRow(S.row-1);
  else if(k===' '){$('auto').click();}else if(k==='+'||k==='='){S.z=Math.min(6,S.z*1.25);}else if(k==='-'){S.z=Math.max(1,S.z/1.25);if(S.z===1){S.px=0;S.py=0;}}
  else if(k==='0')resetView();else h=false;
  if(h){e.preventDefault();e.stopPropagation();draw();}}
addEventListener('keydown',onKey,true);
addEventListener('resize',resize);
let prevOverflow='';
function close(){vis(host,false);S.auto=false;document.documentElement.style.overflow=prevOverflow;}
function open(){vis(host,true);prevOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';resize();
  const f=findFolders();const sel=$('spinSel');
  if(!f.length){S.token++;S.nc=0;S.folders=[];S.bg='#24211e';sel.hidden=true;draw();msg.hidden=false;msg.style.color='#ece7df';msg.textContent='No 360° spin found on this page. Open a product that shows a 360° button, wait for it to load, then try again.';$('meta').textContent='';return;}
  msg.style.color='';
  if(f.join()!==S.folders.join()){S.folders=f;S.bg='#fff';sel.innerHTML=f.map((x,i)=>`<option value="${x.replace(/"/g,'&quot;')}">Spin ${i+1}</option>`).join('');sel.hidden=f.length<2;load(f[0]);}
}
host.id='gwspin-host';
document.body.appendChild(host);
window.__gwspin={open};

if(window.__gwspinUserscript){
  // Userscript mode: stay closed and put a launch button on product pages that have a spin.
  vis(host,false);
  const bh=document.createElement('div');bh.id='gwspin-launch';
  bh.style.cssText='position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483646;';
  const bs=bh.attachShadow({mode:'open'});
  bs.innerHTML=`<style>button{all:initial;display:flex;align-items:center;gap:8px;font:600 15px system-ui,-apple-system,"Segoe UI",sans-serif;color:#1b1814;background:#c9a45c;border-radius:999px;padding:11px 16px 11px 13px;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer}button:focus-visible{outline:2px solid #fff;outline-offset:2px}svg{width:20px;height:20px}</style><button type="button" aria-label="Open Smooth 360 viewer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>Smooth 360</button>`;
  bs.querySelector('button').onclick=()=>{vis(bh,false);open();};
  vis(bh,false);document.body.appendChild(bh);
  const has=()=>!!document.querySelector('img[src*="threeSixty"],source[srcset*="threeSixty"]');
  let lastUrl='';
  setInterval(()=>{vis(bh,has()&&!isOpen());
    if(location.href!==lastUrl){lastUrl=location.href;if(isOpen())close();}},1200);
}else{
  open();
}
})();
