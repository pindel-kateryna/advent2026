// Dress Andre as a Straw Hat pirate with a drag or a keyboard-accessible tap.
let realPirateState=null,previewPirateState=null,pirateGame=null;
try{const value=JSON.parse(localStorage.getItem('adv26-day1')||'null');if(value&&typeof value==='object')realPirateState={done:value.done===true,earned:value.earned===true}}catch(error){}
function persistPirate(game){const state={done:game.done,earned:game.earned};if(game.progress===realOpened){realPirateState=state;try{localStorage.setItem('adv26-day1',JSON.stringify(state))}catch(error){}}else previewPirateState=state}
function stopPirate(){const game=pirateGame;if(game){persistPirate(game);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel())}pirateGame=null;$('pirate-dust').innerHTML='';$('pirate-hat').style.transform='';$('pirate-scene').classList.remove('pirate-over')}
function pirateLater(game,fn,delay){const timer=setTimeout(()=>{game.timers.delete(timer);if(pirateGame===game)fn()},delay);game.timers.add(timer)}
function renderPirate(){
const game=pirateGame;if(!game)return;
$('pirate-scene').classList.toggle('pirate-done',game.done);
$('pirate-hat').hidden=game.done;
$('pirate-again').hidden=!game.earned||game.busy;
$('pirate-hat-tray').hidden=game.done;
$('pirate-hat').disabled=game.busy||game.done;
$('pirate-result').hidden=!game.done||game.busy;
$('pirate-before').hidden=game.done;$('pirate-after').hidden=!game.done;
$('pirate-status').textContent=game.busy?'Ein bisschen Strohhut-Magie … ✨':game.done?'Ahoi, Captain Andre! Dein Abenteuer kann beginnen.':'Zieh den Strohhut auf Andre oder tippe ihn an.';
}
function startPirate(progress,replay=false){
stopPirate();const state=progress===realOpened?realPirateState:previewPirateState;
const done=!replay&&(state?state.done:progress.has(1));
pirateGame={progress,done,earned:done||progress.has(1)||Boolean(state&&state.earned),busy:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,timers:new Set(),animations:new Set(),drag:null,suppressUntil:0};
$('pirate-scene').classList.remove('pirate-casting');renderPirate();
}
function pirateDust(game){
if(game.reduced)return;
for(let i=0;i<38;i++){
const node=document.createElement('i');node.className=i%3?'pirate-speck':'pirate-star';const angle=Math.random()*Math.PI*2,radius=35+Math.random()*110;
node.style.left=40+Math.random()*20+'%';node.style.top=20+Math.random()*50+'%';$('pirate-dust').appendChild(node);
const animation=node.animate([{opacity:0,transform:'translate(0,0) scale(.3)'},{opacity:1,offset:.25},{opacity:0,transform:`translate(${Math.cos(angle)*radius}px,${Math.sin(angle)*radius-35}px) rotate(110deg) scale(.2)`}],{duration:1000+Math.random()*500,delay:Math.random()*150,easing:'ease-out'});
game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)};
}
}
async function transformPirate(){
const game=pirateGame;if(!game||game.done||game.busy)return;
game.busy=true;game.drag=null;$('pirate-scene').classList.remove('pirate-over');$('pirate-hat').style.transform='';renderPirate();
try{await Promise.all(['pirate-before','pirate-after'].map(id=>{const img=$(id);return img.decode?img.decode():Promise.resolve()}))}catch(error){if(pirateGame===game){game.busy=false;renderPirate();$('pirate-status').textContent='Das Bild lädt noch. Bitte versuch es gleich noch einmal.'}return}
if(pirateGame!==game)return;
const reveal=()=>{game.done=true;game.earned=true;game.progress.add(1);save(game.progress);persistPirate(game);grid();renderPirate()};
const finish=()=>{game.busy=false;$('pirate-scene').classList.remove('pirate-casting');renderPirate();$('pirate-result').focus({preventScroll:true})};
if(game.reduced){reveal();finish();return}
$('pirate-scene').classList.add('pirate-casting');
const hat=$('pirate-hat'),from=hat.getBoundingClientRect(),to=$('pirate-scene').getBoundingClientRect();
const flight=hat.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${to.left+to.width*.5-from.left-from.width*.5}px,${to.top+to.height*.2-from.top-from.height*.5}px) scale(.65)`,opacity:0}],{duration:700,easing:'cubic-bezier(.22,.68,0,1)',fill:'forwards'});
game.animations.add(flight);
pirateLater(game,()=>pirateDust(game),300);
pirateLater(game,reveal,850);
pirateLater(game,finish,1800);
}
function pirateOver(x,y){const rect=$('pirate-scene').getBoundingClientRect();return x>=rect.left+rect.width*.2&&x<=rect.right-rect.width*.2&&y>=rect.top&&y<=rect.bottom}
function initPirate(){
const hat=$('pirate-hat');
hat.onclick=()=>{if(pirateGame&&Date.now()>=pirateGame.suppressUntil)transformPirate()};
hat.addEventListener('pointerdown',event=>{const game=pirateGame;if(!game||game.busy||game.done||event.button>0)return;game.drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};hat.setPointerCapture(event.pointerId)});
hat.addEventListener('pointermove',event=>{const game=pirateGame,drag=game&&game.drag;if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>8)drag.moved=true;if(!drag.moved)return;hat.style.transform=`translate(${dx}px,${dy}px) scale(1.08)`;$('pirate-scene').classList.toggle('pirate-over',pirateOver(event.clientX,event.clientY))});
hat.addEventListener('pointerup',event=>{const game=pirateGame,drag=game&&game.drag;if(!drag||drag.id!==event.pointerId)return;game.drag=null;hat.style.transform='';$('pirate-scene').classList.remove('pirate-over');if(drag.moved){game.suppressUntil=Date.now()+400;if(pirateOver(event.clientX,event.clientY))transformPirate()}});
for(const type of ['pointercancel','lostpointercapture'])hat.addEventListener(type,()=>{if(pirateGame)pirateGame.drag=null;hat.style.transform='';$('pirate-scene').classList.remove('pirate-over')});
$('pirate-again').onclick=()=>{const game=pirateGame;if(!game||game.busy)return;const progress=game.progress;startPirate(progress,true);persistPirate(pirateGame);$('pirate-hat').focus({preventScroll:true})};
}
