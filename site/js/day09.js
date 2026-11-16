// The owner's prototype: tap five batteries; they fly to seated Andre.
const ENERGY_GOAL=5;
let realEnergyState=null,previewEnergyState=null,energyGame=null;
const energyCount=value=>Number.isInteger(value)&&value>=0&&value<=ENERGY_GOAL?value:0;
function readEnergyState(value){
if(!value||typeof value!=='object')return null;
const count=value.version===2?energyCount(value.count):Number.isInteger(value.count)&&value.count>=0&&value.count<=9?Math.floor(value.count/9*ENERGY_GOAL):0;
return{version:2,count,earned:value.earned===true};
}
try{realEnergyState=readEnergyState(JSON.parse(localStorage.getItem('adv26-day9')||'null'))}catch(error){}
function persistEnergy(game){
const state={version:2,count:game.count,earned:game.earned};
if(game.progress===realOpened){realEnergyState=state;try{localStorage.setItem('adv26-day9',JSON.stringify(state))}catch(error){}}else previewEnergyState=state;
}
function energyLater(game,fn,delay){
const id=setTimeout(()=>{game.timers.delete(id);if(energyGame===game)fn()},delay);game.timers.add(id);return id;
}
function removeEnergyDrop(game,drop){drop.el.remove();game.drops=game.drops.filter(item=>item!==drop)}
function stopEnergy(){
const game=energyGame;if(game){game.running=false;cancelAnimationFrame(game.frame);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel())}
energyGame=null;$('energy-drops').innerHTML='';$('energy-effects').innerHTML='';$('energy-player').classList.remove('energy-pulse');
}
function energyMood(count){return count<2?'sleepy':count<4?'awake':count<5?'happy':'cheer'}
function renderEnergy(){
const game=energyGame;if(!game)return;
const done=game.count===ENERGY_GOAL,mood=energyMood(game.count),charge=game.count?game.count*20:3;
$('ch').hidden=false;$('ch').textContent=ENERGY_TITLE;
$('energy-help').textContent=game.calm?ENERGY_CALM_HELP:ENERGY_HELP;
$('energy-help').hidden=!$('energy-help').textContent;
$('energy-prompt').textContent=ENERGY_STEPS[game.count];
$('energy-meter').setAttribute('aria-valuenow',String(game.count));
$('energy-meter').setAttribute('aria-valuetext',`${game.count} von 5 Batterien, ${charge} Prozent geladen`);
for(let i=0;i<ENERGY_GOAL;i++)$('energy-cell-'+i).classList.toggle('is-on',i<game.count);
$('energy-count').textContent=`${game.count} / 5 · ${charge} %`;
$('energy-scene').classList.toggle('energy-done',done);
$('energy-scene').classList.toggle('energy-calm',game.calm);
$('energy-scene').classList.toggle('energy-ready',!game.started&&!done);
$('energy-player').dataset.mood=mood;$('energy-player').setAttribute('aria-label',ENERGY_MOODS[mood]);
for(const pose of ['sleepy','awake','happy','cheer'])$('energy-'+pose).hidden=pose!==mood;
$('energy-start').hidden=done||game.running;$('energy-start').textContent=game.started?'Weiter':'Aufwecken!';
$('energy-start').setAttribute('aria-label',game.started?'Spiel fortsetzen':'Spiel starten');
$('energy-calm').hidden=game.calm||done;$('energy-again').hidden=!game.earned;$('energy-reward').hidden=!game.revealed;
$('energy-status').classList.toggle('sr-only',!done);
for(const drop of game.drops)drop.el.disabled=!game.running||drop.caught;
}
function startEnergy(progress,replay=false){
stopEnergy();const stored=progress===realOpened?realEnergyState:previewEnergyState;
const count=replay?0:stored?energyCount(stored.count):progress.has(9)?5:0;
const earned=progress.has(9)||Boolean(stored&&stored.earned)||count===5;
energyGame={progress,count,earned,revealed:earned,drops:[],nextId:0,running:false,started:false,calm:matchMedia('(prefers-reduced-motion:reduce)').matches,frame:null,last:null,spawnIn:0,timers:new Set(),animations:new Set()};
if(earned&&!progress.has(9)){progress.add(9);save(progress)}
$('energy-status').textContent=count===5?ENERGY_WIN:count?`${count} von 5 Batterien gespeichert.`:'';renderEnergy();
}
function placeEnergyDrop(game,drop){
const sway=game.calm||drop.caught?0:Math.sin(drop.phase)*3;
drop.el.style.left=(drop.x+sway)+'%';drop.el.style.top=drop.y+'%';drop.el.style.transform=`translate(-50%,-50%) scale(${drop.scale})`;
const reachable=drop.y>=12&&drop.y<=88&&!drop.caught;
if(!reachable&&document.activeElement===drop.el)$('energy-scene').focus({preventScroll:true});
drop.el.tabIndex=reachable?0:-1;drop.el.setAttribute('aria-hidden',String(!reachable));
}
function spawnEnergy(game){
if(energyGame!==game||!game.running||game.count===5||game.drops.filter(drop=>!drop.caught).length>=2||game.count+game.drops.filter(drop=>drop.caught).length>=5)return;
let x=14+Math.random()*72;if(game.calm&&game.drops.length&&Math.abs(x-game.drops[0].x)<30)x=game.drops[0].x>50?24:76;
const el=document.createElement('button');el.type='button';el.className='energy-drop';el.setAttribute('aria-label','Batterie fangen');
const img=document.createElement('img');img.src=ENERGY_BATTERY;img.alt='';img.draggable=false;el.appendChild(img);
const drop={id:++game.nextId,el,x,y:game.calm?33:-14,speed:18+Math.random()*9,phase:Math.random()*6,caught:false,travel:0,scale:1};
el.onpointerdown=event=>{if(event.button>0)return;event.preventDefault();grabEnergyDrop(game,drop)};el.onclick=()=>grabEnergyDrop(game,drop);
$('energy-drops').appendChild(el);game.drops.push(drop);placeEnergyDrop(game,drop);return drop;
}
function energyParticles(game,x,y,finale=false){
if(game.calm||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
const colors=['#ffc872','#f8ecd8','#c8e0a8','#e88a6a'];
for(let i=0;i<(finale?28:8);i++){
const node=document.createElement('i');node.className='energy-spark';node.style.left=(finale?Math.random()*100:x)+'%';node.style.top=(finale?-3:y)+'%';node.style.background=colors[i%colors.length];$('energy-effects').appendChild(node);
const angle=Math.random()*Math.PI*2,distance=16+Math.random()*30;
const frames=finale?[{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translateY(340px) rotate(${Math.random()*540}deg)`,opacity:0}]:[{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance}px) scale(.3)`,opacity:0}];
const animation=node.animate(frames,{duration:finale?1400+Math.random()*800:600+Math.random()*300,easing:'ease-out'});game.animations.add(animation);
animation.onfinish=()=>{node.remove();game.animations.delete(animation)};
}
}
function grabEnergyDrop(game,drop){
if(energyGame!==game||!game.running||drop.caught||!game.drops.includes(drop)||game.count+game.drops.filter(item=>item.caught).length>=5)return;
drop.caught=true;drop.el.disabled=true;drop.fromX=drop.x;drop.fromY=drop.y;drop.travel=0;energyParticles(game,drop.x,drop.y);
if(game.calm)arriveEnergyDrop(game,drop);
}
function arriveEnergyDrop(game,drop){
if(energyGame!==game||!game.running||!drop.caught||!game.drops.includes(drop)||game.count>=5)return;
const restoreFocus=document.activeElement===drop.el;removeEnergyDrop(game,drop);game.count++;
if(!game.calm){$('energy-player').classList.remove('energy-pulse');void $('energy-player').offsetWidth;$('energy-player').classList.add('energy-pulse');energyLater(game,()=>$('energy-player').classList.remove('energy-pulse'),220)}
energyParticles(game,50,72);persistEnergy(game);renderEnergy();
if(game.count===5){
game.earned=true;game.running=false;cancelAnimationFrame(game.frame);game.frame=null;
for(const remaining of [...game.drops])removeEnergyDrop(game,remaining);
game.progress.add(9);save(game.progress);persistEnergy(game);grid();$('energy-status').textContent=ENERGY_WIN;renderEnergy();energyParticles(game,50,35,true);
const reveal=()=>{game.revealed=true;renderEnergy();$('energy-reward').focus({preventScroll:true});$('energy-reward').scrollIntoView({block:'nearest'})};if(game.calm)reveal();else energyLater(game,reveal,700);
}else if(game.calm){spawnEnergy(game);if(restoreFocus&&game.drops[0])game.drops[0].el.focus({preventScroll:true})}
else if(restoreFocus){const next=game.drops.find(item=>!item.caught);if(next)next.el.focus({preventScroll:true});else $('energy-scene').focus({preventScroll:true})}
}
function stepEnergy(game,seconds){
if(energyGame!==game||!game.running||game.calm)return;
for(const drop of [...game.drops]){
if(drop.caught){drop.travel+=seconds;const p=Math.min(1,drop.travel/.32),ease=p*p;drop.x=drop.fromX+(50-drop.fromX)*ease;drop.y=drop.fromY+(73-drop.fromY)*ease;drop.scale=1-.7*ease;placeEnergyDrop(game,drop);if(p===1)arriveEnergyDrop(game,drop)}
else{drop.y+=drop.speed*seconds;drop.phase+=seconds*2;placeEnergyDrop(game,drop);if(drop.y>115)removeEnergyDrop(game,drop)}
}
if(!game.running)return;game.spawnIn-=seconds*1000;
if(game.spawnIn<=0&&game.drops.filter(drop=>!drop.caught).length<2){spawnEnergy(game);game.spawnIn=1100+Math.random()*700}
}
function runEnergyFrame(game,time){
if(energyGame!==game||!game.running||game.calm)return;
const seconds=game.last===null?0:Math.min(.05,Math.max(0,(time-game.last)/1000));game.last=time;stepEnergy(game,seconds);
if(game.running)game.frame=requestAnimationFrame(next=>runEnergyFrame(game,next));
}
function pauseEnergy(){
const game=energyGame;if(!game||!game.running)return;
game.running=false;cancelAnimationFrame(game.frame);game.frame=null;game.last=null;renderEnergy();$('energy-status').textContent='Pause. Dein Ladestand bleibt erhalten.';
}
function toggleEnergy(){
const game=energyGame;if(!game||game.count===5)return;
if(game.running)return;game.running=true;game.started=true;game.last=null;
if(game.calm){if(!game.drops.length){spawnEnergy(game);spawnEnergy(game)}}else game.frame=requestAnimationFrame(time=>runEnergyFrame(game,time));
$('energy-status').textContent=game.calm?'Die Batterien bleiben stehen. Wähle sie mit Tab und Enter.':'Los geht’s! Tippe auf die Batterien.';
renderEnergy();$('energy-play').scrollIntoView({block:'nearest'});
if(game.calm&&game.drops[0])game.drops[0].el.focus({preventScroll:true});else $('energy-scene').focus({preventScroll:true});
}
function initEnergy(){
$('energy-start').onclick=toggleEnergy;
$('energy-calm').onclick=()=>{const game=energyGame;if(!game||game.count===5)return;pauseEnergy();for(const drop of [...game.drops])removeEnergyDrop(game,drop);game.calm=true;renderEnergy();toggleEnergy()};
$('energy-again').onclick=()=>{const game=energyGame;if(!game)return;const progress=game.progress,calm=game.calm;startEnergy(progress,true);energyGame.calm=calm;persistEnergy(energyGame);renderEnergy();$('energy-start').focus({preventScroll:true});$('card').scrollTop=0};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseEnergy()});
}
