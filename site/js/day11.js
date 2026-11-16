// Adapted from the owner's ParfumSpiel: round wiping brush, sampled coverage,
// sparkles and a reveal after 60% of the fog has been cleared.
const MIRROR_W=640,MIRROR_H=880,MIRROR_R=48,MIRROR_CELL=44;
const MIRROR_COLS=Math.ceil(MIRROR_W/MIRROR_CELL),MIRROR_ROWS=Math.ceil(MIRROR_H/MIRROR_CELL);
let realMirrorState=null,previewMirrorState=null,mirrorGame=null;
function readMirrorState(value){
if(!value||typeof value!=='object')return null;
const strokes=Array.isArray(value.strokes)?value.strokes.filter(stroke=>Array.isArray(stroke)&&stroke.length===4&&stroke.every(Number.isFinite)).map(stroke=>stroke.map((v,i)=>Math.max(0,Math.min(i%2?MIRROR_H:MIRROR_W,v)))):[];
return{strokes,earned:value.earned===true,done:value.done===true};
}
try{realMirrorState=readMirrorState(JSON.parse(localStorage.getItem('adv26-day11')||'null'))}catch(error){}
function persistMirror(game){
const state={earned:game.earned,done:game.done,strokes:game.done?[]:game.strokes.map(stroke=>stroke.slice())};
if(game.progress===realOpened){realMirrorState=state;try{localStorage.setItem('adv26-day11',JSON.stringify(state))}catch(error){}}else previewMirrorState=state;
}
function stopMirror(){
const game=mirrorGame;if(game){persistMirror(game);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel());game.pointer=null}
mirrorGame=null;$('mirror-sparks').innerHTML='';
}
function mirrorLater(game,fn,delay){const id=setTimeout(()=>{game.timers.delete(id);if(mirrorGame===game)fn()},delay);game.timers.add(id);return id}
function renderMirror(){
const game=mirrorGame;if(!game)return;
const ratio=game.seen.size/(MIRROR_COLS*MIRROR_ROWS);
$('ch').hidden=false;if($('ch').textContent!==MIRROR_TITLE)$('ch').textContent=MIRROR_TITLE;
$('mirror-scene').classList.toggle('mirror-clear',game.done);
$('mirror-scene').classList.toggle('mirror-restored',game.restored);
$('mirror-scene').classList.toggle('mirror-no-canvas',!game.ctx);
$('mirror-message').setAttribute('aria-hidden',String(!game.done));
$('mirror-status').hidden=game.done;
const instruction=MIRROR_STEPS[ratio<.1?0:ratio<.3?1:ratio<.45?2:3];
if($('mirror-status').textContent!==instruction)$('mirror-status').textContent=instruction;
$('mirror-skip').hidden=game.done;$('mirror-again').hidden=!game.earned;
const announcement=game.done?'Der Spiegel ist frei. Deine Botschaft ist sichtbar.':`${Math.floor(ratio*10)*10} Prozent des Spiegels freigewischt.`;
if($('mirror-live').textContent!==announcement)$('mirror-live').textContent=announcement;
}
function paintMirrorFog(game){
const ctx=game.ctx;if(!ctx)return;
ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
const gradient=ctx.createLinearGradient(0,0,MIRROR_W,MIRROR_H);
gradient.addColorStop(0,'#dcd3e8');gradient.addColorStop(.5,'#cbc0dd');gradient.addColorStop(1,'#bcaed2');ctx.fillStyle=gradient;ctx.fillRect(0,0,MIRROR_W,MIRROR_H);
for(let i=0;i<220;i++){ctx.fillStyle=`rgba(255,255,255,${.1+Math.random()*.25})`;ctx.beginPath();ctx.arc(Math.random()*MIRROR_W,Math.random()*MIRROR_H,2+Math.random()*6,0,Math.PI*2);ctx.fill()}
// Small painted stars disappear with the fog, rather than flashing constantly.
ctx.strokeStyle='#fff1cc99';ctx.lineWidth=2;
for(let i=0;i<24;i++){const x=20+Math.random()*(MIRROR_W-40),y=20+Math.random()*(MIRROR_H-40),r=4+Math.random()*4;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke()}
}
function markMirror(game,x,y){
for(let col=Math.max(0,Math.floor((x-MIRROR_R)/MIRROR_CELL));col<=Math.min(MIRROR_COLS-1,Math.floor((x+MIRROR_R)/MIRROR_CELL));col++)for(let row=Math.max(0,Math.floor((y-MIRROR_R)/MIRROR_CELL));row<=Math.min(MIRROR_ROWS-1,Math.floor((y+MIRROR_R)/MIRROR_CELL));row++){
if(Math.hypot((col+.5)*MIRROR_CELL-x,(row+.5)*MIRROR_CELL-y)<MIRROR_R)game.seen.add(row*MIRROR_COLS+col);
}
}
function eraseMirrorStroke(game,x0,y0,x1,y1){
const ctx=game.ctx;
if(ctx){ctx.globalCompositeOperation='destination-out';ctx.lineCap=ctx.lineJoin='round';ctx.lineWidth=MIRROR_R*2;ctx.shadowColor='#000';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.shadowBlur=0}
const segments=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/20));
for(let i=0;i<=segments;i++)markMirror(game,x0+(x1-x0)*i/segments,y0+(y1-y0)*i/segments);
}
function sparkleMirror(game,x,y){
if(game.reduced||Date.now()-game.lastSpark<70)return;game.lastSpark=Date.now();
const node=document.createElement('i');node.className='mirror-spark';node.style.left=x/MIRROR_W*100+'%';node.style.top=y/MIRROR_H*100+'%';$('mirror-sparks').appendChild(node);
const animation=node.animate([{transform:'translate(0,0) rotate(45deg)',opacity:1},{transform:`translate(${(Math.random()-.5)*30}px,-40px) rotate(45deg) scale(.3)`,opacity:0}],{duration:900,easing:'ease-out'});
game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)};
}
function revealMirror(){
const game=mirrorGame;if(!game||game.done)return;
game.done=true;game.earned=true;game.pointer=null;game.progress.add(11);save(game.progress);persistMirror(game);grid();renderMirror();
const focus=()=>{$('mirror-message').focus({preventScroll:true});$('mirror-scene').scrollIntoView({block:'nearest'})};
if(game.reduced)focus();else mirrorLater(game,focus,900);
}
function wipeMirror(x0,y0,x1,y1){
const game=mirrorGame;if(!game||game.done)return;
if(![x0,y0,x1,y1].every(Number.isFinite))return;
const stroke=[x0,y0,x1,y1].map((v,i)=>Math.round(Math.max(0,Math.min(i%2?MIRROR_H:MIRROR_W,v))*10)/10);
game.strokes.push(stroke);eraseMirrorStroke(game,...stroke);sparkleMirror(game,stroke[2],stroke[3]);
if(game.seen.size/(MIRROR_COLS*MIRROR_ROWS)>=.6)revealMirror();else renderMirror();
}
function startMirror(progress,replay=false){
stopMirror();const stored=progress===realOpened?realMirrorState:previewMirrorState;
const done=!replay&&(stored?stored.done:progress.has(11)),earned=progress.has(11)||Boolean(stored&&stored.earned)||done;
const canvas=$('mirror-fog');canvas.width=MIRROR_W;canvas.height=MIRROR_H;
let ctx=null;try{ctx=canvas.getContext?canvas.getContext('2d'):null}catch(error){}
mirrorGame={progress,done,earned,restored:done,strokes:replay||done?[]:stored?stored.strokes.map(stroke=>stroke.slice()):[],seen:new Set(),ctx,pointer:null,lastX:0,lastY:0,lastSpark:0,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,timers:new Set(),animations:new Set()};
paintMirrorFog(mirrorGame);for(const stroke of mirrorGame.strokes)eraseMirrorStroke(mirrorGame,...stroke);
if(earned&&!progress.has(11)){progress.add(11);save(progress)}
renderMirror();if(!done&&mirrorGame.seen.size/(MIRROR_COLS*MIRROR_ROWS)>=.6)revealMirror();
}
function mirrorPointerPosition(event){const rect=$('mirror-fog').getBoundingClientRect();return[(event.clientX-rect.left)*MIRROR_W/rect.width,(event.clientY-rect.top)*MIRROR_H/rect.height]}
function initMirror(){
const canvas=$('mirror-fog');
canvas.addEventListener('pointerdown',event=>{
const game=mirrorGame;if(!game||game.done||event.button>0)return;
game.pointer=event.pointerId;canvas.setPointerCapture(event.pointerId);[game.lastX,game.lastY]=mirrorPointerPosition(event);wipeMirror(game.lastX,game.lastY,game.lastX,game.lastY);
});
canvas.addEventListener('pointermove',event=>{
const game=mirrorGame;if(!game||game.done||game.pointer!==event.pointerId)return;
const [x,y]=mirrorPointerPosition(event);wipeMirror(game.lastX,game.lastY,x,y);game.lastX=x;game.lastY=y;
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{if(mirrorGame){mirrorGame.pointer=null;persistMirror(mirrorGame)}});
$('mirror-skip').onclick=revealMirror;
$('mirror-again').onclick=()=>{const game=mirrorGame;if(!game)return;const progress=game.progress;startMirror(progress,true);persistMirror(mirrorGame);$('card').scrollTop=0;$('mirror-skip').focus({preventScroll:true})};
}
