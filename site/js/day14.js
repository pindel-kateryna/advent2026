// Stationary pop-up attention game. No falling objects or character movement.
const SNACK_TITLE='Eine kleine Snack-Mission';
const SNACK_GOAL=5;
const SNACK_ART={crunch:'assets/day-05/ingredient-biscuits-illustrated.png',schoko:'assets/day-14/chocolate.png',hantel:'assets/day-14/dumbbell.png'};
const SNACK_LABELS={crunch:'Knusper-Keks sammeln',schoko:'Schokostück sammeln',hantel:'Hantel – heute Pause'};
const SNACK_PATTERN=['crunch','schoko','hantel','crunch','schoko','crunch','hantel','schoko'];
const SNACK_SLOTS=[[17,25],[50,25],[83,25],[17,75],[50,75],[83,75]];
let realSnackState=null,previewSnackState=null,snackGame=null;
function readSnackState(value){if(!value||typeof value!=='object')return null;const number=n=>Number.isInteger(n)&&n>=0&&n<=5?n:0;return{crunch:number(value.crunch),schoko:number(value.schoko),earned:value.earned===true}}
try{realSnackState=readSnackState(JSON.parse(localStorage.getItem('adv26-day14')||'null'))}catch(error){}
function persistSnack(game){const state={crunch:game.crunch,schoko:game.schoko,earned:game.earned};if(game.progress===realOpened){realSnackState=state;try{localStorage.setItem('adv26-day14',JSON.stringify(state))}catch(error){}}else previewSnackState=state}
function snackLater(game,fn,delay){const timer=setTimeout(()=>{game.timers.delete(timer);if(snackGame===game)fn()},delay);game.timers.add(timer);return timer}
function clearSnackActivity(game){game.timers.forEach(clearTimeout);game.timers.clear();game.animations.forEach(animation=>animation.cancel());game.animations.clear();for(const item of [...game.items])removeSnackItem(game,item);$('snack-effects').innerHTML=''}
function stopSnack(){const game=snackGame;if(game){game.running=false;persistSnack(game);clearSnackActivity(game)}snackGame=null}
function renderSnack(){
const game=snackGame;if(!game)return;
for(const kind of ['crunch','schoko']){const meter=$('snack-meter-'+kind);meter.setAttribute('aria-valuenow',String(game[kind]));meter.setAttribute('aria-valuetext',`${game[kind]} von 5`);$('snack-fill-'+kind).style.width=game[kind]*20+'%';$('snack-count-'+kind).textContent=game[kind]+' / 5';meter.classList.toggle('snack-full',game[kind]===5)}
$('snack-scene').classList.toggle('snack-done',game.done);$('snack-scene').classList.toggle('snack-restored',game.restored);$('snack-scene').classList.toggle('snack-calm',game.calm);
$('snack-scene').classList.toggle('snack-ready',!game.started&&!game.done);
$('snack-thoughtful').hidden=game.done;$('snack-happy').hidden=!game.done;$('snack-thought').hidden=game.done;
$('snack-intro').hidden=game.done||game.running;$('snack-instruction').hidden=game.done;$('snack-reward').hidden=!game.done;
$('snack-start-actions').hidden=game.running||game.done;
$('snack-start').hidden=game.running||game.done;$('snack-start').disabled=game.loading;$('snack-start').textContent=game.started?'Weiter':'Los geht’s!';
$('snack-calm').hidden=game.done||game.calm;$('snack-calm').disabled=game.loading;$('snack-again').hidden=!game.earned||game.running||game.loading;
}
function startSnack(progress,replay=false){
stopSnack();const state=progress===realOpened?realSnackState:previewSnackState;
const fallback=progress.has(14)?5:0,crunch=replay?0:state?state.crunch:fallback,schoko=replay?0:state?state.schoko:fallback,done=crunch===5&&schoko===5;
snackGame={progress,crunch,schoko,done,earned:done||progress.has(14)||Boolean(state?.earned),running:false,loading:false,started:false,restored:done,calm:matchMedia('(prefers-reduced-motion:reduce)').matches,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,items:[],cursor:0,lastSlot:-1,timers:new Set(),animations:new Set()};
if(done&&!progress.has(14)){progress.add(14);save(progress)}
$('snack-package').innerHTML=art(13);$('snack-status').textContent=done?'Crunch und Schoko sind komplett.':crunch||schoko?'Dein Fortschritt ist gespeichert. Bereit für den Rest?':'';renderSnack();
}
function removeSnackItem(game,item){if(item.expiry){clearTimeout(item.expiry);game.timers.delete(item.expiry)}if(document.activeElement===item.el)$('snack-field').focus({preventScroll:true});item.el.remove();game.items=game.items.filter(other=>other!==item)}
function expireSnackItem(game,item){if(!game.running||!game.items.includes(item))return;if(document.activeElement===item.el){item.expiry=snackLater(game,()=>expireSnackItem(game,item),1000);return}removeSnackItem(game,item)}
function snackKind(game){let kind=SNACK_PATTERN[game.cursor++%SNACK_PATTERN.length];if(kind!=='hantel'){if(game[kind]===5)kind=kind==='crunch'?'schoko':'crunch';if(Math.abs(game.crunch-game.schoko)>=2)kind=game.crunch<game.schoko?'crunch':'schoko'}return kind}
function spawnSnack(game,forced){
if(snackGame!==game||!game.running||game.done||game.items.length>=3)return null;
let kind=forced||snackKind(game);if(!SNACK_ART[kind])return null;if(kind==='hantel'&&game.calm&&game.items.some(item=>item.kind==='hantel'))kind=game.crunch<=game.schoko?'crunch':'schoko';if(kind!=='hantel'&&game[kind]===5)kind=kind==='crunch'?'schoko':'crunch';
const slots=SNACK_SLOTS.map((_,index)=>index).filter(index=>!game.items.some(item=>item.slot===index));const varied=slots.filter(index=>index!==game.lastSlot),choices=varied.length?varied:slots,slot=choices[Math.floor(Math.random()*choices.length)];game.lastSlot=slot;
const el=document.createElement('button');el.type='button';el.className='snack-item snack-item-'+kind;el.setAttribute('aria-label',SNACK_LABELS[kind]);el.style.left=SNACK_SLOTS[slot][0]+'%';el.style.top=SNACK_SLOTS[slot][1]+'%';
const image=document.createElement('img');image.src=SNACK_ART[kind];image.alt='';image.draggable=false;el.appendChild(image);
const item={el,kind,slot,taken:false,expiry:null};el.onclick=()=>collectSnack(game,item);$('snack-field').appendChild(el);game.items.push(item);
if(!game.calm){const total=game.crunch+game.schoko;item.expiry=snackLater(game,()=>expireSnackItem(game,item),total<5?5200:total<8?4600:4000)}return item;
}
function scheduleSnack(game){if(!game.running||game.calm||game.done)return;const total=game.crunch+game.schoko;snackLater(game,()=>{spawnSnack(game);scheduleSnack(game)},total<5?3000:total<8?2700:2400)}
function snackSparks(game,finale=false,slot=1){if(game.reduced)return;for(let i=0;i<(finale?18:6);i++){const node=document.createElement('i');node.className='snack-spark';node.style.left=(finale?68:SNACK_SLOTS[slot][0])+'%';node.style.top=(finale?74:SNACK_SLOTS[slot][1]*.45)+'%';$('snack-effects').appendChild(node);const dx=(Math.random()-.5)*(finale?140:50),dy=-20-Math.random()*(finale?90:30);const animation=node.animate([{opacity:1,transform:'translate(0,0) rotate(0)'},{opacity:0,transform:`translate(${dx}px,${dy}px) rotate(100deg) scale(.2)`}],{duration:finale?1100:550,easing:'ease-out'});game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)}}}
function winSnack(game){
if(snackGame!==game||game.done||game.crunch!==5||game.schoko!==5)return;
game.done=true;game.earned=true;game.restored=false;game.running=false;clearSnackActivity(game);game.progress.add(14);save(game.progress);persistSnack(game);grid();renderSnack();snackSparks(game,true);
$('snack-status').textContent='Geschafft! Crunch und Schoko: jeweils 5 von 5.';$('snack-reward').focus({preventScroll:true});$('snack-reward').scrollIntoView({block:'nearest'});
}
function collectSnack(game,item){
if(snackGame!==game||!game.running||game.done||item.taken||!game.items.includes(item))return;
item.taken=true;const restoreFocus=document.activeElement===item.el;item.el.disabled=true;removeSnackItem(game,item);
if(item.kind==='hantel'){
const kind=game.crunch>=game.schoko?'crunch':'schoko';const deducted=game[kind]>0;if(deducted)game[kind]--;
$('snack-status').textContent=deducted?`Die Hantel hat Pause! ${kind==='crunch'?'Crunch':'Schoko'} minus eins. Weiter geht’s!`:'Die Hantel hat Pause. Alles gut – weiter geht’s!';
if(!game.reduced){const animation=$('snack-meters').animate([{transform:'translateX(0)'},{transform:'translateX(-3px)',background:'#e88a6a33'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:260});game.animations.add(animation);animation.onfinish=()=>game.animations.delete(animation)}
}else{game[item.kind]=Math.min(5,game[item.kind]+1);$('snack-status').textContent=`${item.kind==='crunch'?'Crunch':'Schoko'}: ${game[item.kind]} von 5.`;snackSparks(game,false,item.slot)}
persistSnack(game);renderSnack();if(game.crunch===5&&game.schoko===5){winSnack(game);return}
if(game.calm)spawnSnack(game);if(restoreFocus){const next=game.items.find(item=>item.kind!=='hantel')||game.items[0];if(next)next.el.focus({preventScroll:true});else $('snack-field').focus({preventScroll:true})}
}
function pauseSnack(){const game=snackGame;if(!game||!game.running)return;game.running=false;clearSnackActivity(game);persistSnack(game);renderSnack();$('snack-status').textContent='Dein Fortschritt bleibt gespeichert. Weiter, wenn du bereit bist.'}
async function beginSnack(){
const game=snackGame;if(!game||game.done||game.running||game.loading)return;game.loading=true;renderSnack();
try{await Promise.all(['snack-thoughtful','snack-happy','snack-preload-crunch','snack-preload-schoko','snack-preload-hantel'].map(id=>{const img=$(id);return img.decode?img.decode():Promise.resolve()}))}catch(error){if(snackGame===game){game.loading=false;renderSnack();$('snack-status').textContent='Die Bilder laden noch. Bitte versuch es gleich noch einmal.'}return}
if(snackGame!==game)return;game.loading=false;game.running=true;game.started=true;renderSnack();
if(game.calm){for(const kind of ['crunch','schoko','hantel'])spawnSnack(game,kind)}else{spawnSnack(game);scheduleSnack(game)}
$('snack-status').textContent=game.calm?'Die Gegenstände bleiben stehen. Sammle in deinem Tempo.':'Sammle Crunch und Schoko. Die Hanteln haben heute Pause!';
if(game.calm&&game.items[0])game.items[0].el.focus({preventScroll:true});else $('snack-field').focus({preventScroll:true});
}
function initSnack(){
$('snack-start').onclick=beginSnack;
$('snack-calm').onclick=()=>{const game=snackGame;if(!game||game.done||game.loading)return;pauseSnack();game.calm=true;renderSnack();beginSnack()};
$('snack-again').onclick=()=>{const game=snackGame;if(!game||game.loading)return;const progress=game.progress;startSnack(progress,true);persistSnack(snackGame);$('snack-start').focus({preventScroll:true});$('card').scrollTop=0};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseSnack()});
}
