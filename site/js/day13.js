// Adapted from the owner's SpindSpiel, with accessible wheels and isolated progress.
const LOCKER_TITLE='Die Umkleide 🔐';
const LOCKER_CONFIG={code:'150',hint:'Dein Rekord im Bankdrücken. In Kilogramm. Dein ganzer Stolz.'};
const LOCKER_WRONG=['Klick. Aber nicht dein Rekord.','Zu leicht. Denk an die Hantel.','Nein, so schwer war es nicht.','Fast. Oder doch nicht? Versuch es nochmal.'];
let realLockerState=null,previewLockerState=null,lockerGame=null;
function readLockerState(value){if(!value||typeof value!=='object')return null;return{digits:Array.from({length:3},(_,i)=>Number.isInteger(value.digits?.[i])&&value.digits[i]>=0&&value.digits[i]<=9?value.digits[i]:0),tries:Number.isInteger(value.tries)?Math.max(0,Math.min(1000000,value.tries)):0,hint:value.hint===true,done:value.done===true,earned:value.earned===true}}
try{realLockerState=readLockerState(JSON.parse(localStorage.getItem('adv26-day13')||'null'))}catch(error){}
function persistLocker(game){const state={digits:game.digits.slice(),tries:game.tries,hint:game.hint,done:game.done,earned:game.earned};if(game.progress===realOpened){realLockerState=state;try{localStorage.setItem('adv26-day13',JSON.stringify(state))}catch(error){}}else previewLockerState=state}
function stopLocker(){const game=lockerGame;if(game){persistLocker(game);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel())}lockerGame=null;$('locker-confetti').innerHTML='';$('locker-scene').classList.remove('locker-wrong')}
function renderLocker(){
const game=lockerGame;if(!game)return;
for(let i=0;i<3;i++){const digit=$('locker-digit-'+i);digit.textContent=String(game.digits[i]);digit.setAttribute('aria-valuenow',String(game.digits[i]));digit.setAttribute('aria-disabled',String(game.done||game.busy));digit.setAttribute('tabindex',game.done?'-1':'0');$('locker-up-'+i).disabled=game.done||game.busy;$('locker-down-'+i).disabled=game.done||game.busy}
$('locker-scene').classList.toggle('locker-open',game.done);$('locker-scene').classList.toggle('locker-restored',game.restored);
$('locker-door').setAttribute('aria-hidden',String(game.done));
$('locker-interior').setAttribute('aria-hidden',String(!game.done));
$('locker-go').hidden=game.done;$('locker-go').disabled=game.busy;
$('locker-tip').hidden=game.done;$('locker-tip').setAttribute('aria-expanded',String(game.hint));
$('locker-hint').hidden=!game.hint||game.done;$('locker-hint').textContent=LOCKER_CONFIG.hint;
$('locker-again').hidden=!game.earned||game.busy;
$('locker-status').textContent=game.done?'Klack! Die Umkleide ist offen.':game.message||'Stell den Code ein: mit den Pfeilen oder per Wischen.';
}
function startLocker(progress,replay=false){
stopLocker();const state=progress===realOpened?realLockerState:previewLockerState;
const done=!replay&&(state?state.done:progress.has(13));
lockerGame={progress,digits:replay?[0,0,0]:state?state.digits.slice():[0,0,0],tries:replay?0:state?.tries||0,hint:!replay&&Boolean(state?.hint),done,earned:done||progress.has(13)||Boolean(state?.earned),busy:false,restored:done,message:'',reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,drag:null,timers:new Set(),animations:new Set()};
if(done&&!progress.has(13)){progress.add(13);save(progress)}renderLocker();
}
function setLockerDigit(index,delta,absolute=false){
const game=lockerGame;if(!game||game.done||game.busy||!Number.isInteger(index)||index<0||index>2||!Number.isInteger(delta))return;
game.digits[index]=((absolute?delta:game.digits[index]+delta)%10+10)%10;game.message='';persistLocker(game);renderLocker();
if(!game.reduced){const animation=$('locker-digit-'+index).animate([{transform:`translateY(${delta>0?10:-10}px)`,opacity:.3},{transform:'none',opacity:1}],{duration:150});game.animations.add(animation);animation.onfinish=()=>game.animations.delete(animation)}
}
function lockerConfetti(game){if(game.reduced)return;for(let i=0;i<28;i++){const node=document.createElement('i');node.className='locker-confetto';node.style.left=35+Math.random()*30+'%';node.style.top='42%';node.style.background=['#ffc872','#e88a6a','#c8e0a8','#fff1d6','#b58cff'][i%5];$('locker-confetti').appendChild(node);const dx=(Math.random()-.5)*230;const animation=node.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx*.7}px,-95px) rotate(180deg)`,opacity:1,offset:.35},{transform:`translate(${dx}px,180px) rotate(480deg)`,opacity:0}],{duration:1300+Math.random()*500,easing:'ease-out'});game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)}}}
async function submitLocker(){
const game=lockerGame;if(!game||game.done||game.busy)return;
if(game.digits.join('')!==LOCKER_CONFIG.code){game.message=LOCKER_WRONG[game.tries%LOCKER_WRONG.length];game.tries=Math.min(1000000,game.tries+1);if(game.tries>=3)game.hint=true;persistLocker(game);renderLocker();if(!game.reduced){$('locker-scene').classList.remove('locker-wrong');void $('locker-scene').offsetWidth;$('locker-scene').classList.add('locker-wrong')}return}
game.busy=true;game.drag=null;renderLocker();
try{const image=$('locker-art');if(image.decode)await image.decode()}catch(error){if(lockerGame===game){game.busy=false;game.message='Die Illustration lädt noch. Bitte versuch es gleich noch einmal.';renderLocker()}return}
if(lockerGame!==game)return;
game.done=true;game.earned=true;game.restored=false;game.progress.add(13);save(game.progress);persistLocker(game);grid();renderLocker();lockerConfetti(game);
const finish=()=>{if(lockerGame!==game)return;game.busy=false;renderLocker();$('locker-interior').focus({preventScroll:true})};
if(game.reduced)finish();else{const timer=setTimeout(()=>{game.timers.delete(timer);finish()},1000);game.timers.add(timer)}
}
function initLocker(){
for(let i=0;i<3;i++){
$('locker-up-'+i).onclick=()=>setLockerDigit(i,1);$('locker-down-'+i).onclick=()=>setLockerDigit(i,-1);
const digit=$('locker-digit-'+i);
digit.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)||/^[0-9]$/.test(event.key)){event.preventDefault();if(event.key==='ArrowUp')setLockerDigit(i,1);else if(event.key==='ArrowDown')setLockerDigit(i,-1);else setLockerDigit(i,event.key==='Home'?0:event.key==='End'?9:Number(event.key),true)}else if(event.key==='Enter'){event.preventDefault();submitLocker()}});
digit.addEventListener('pointerdown',event=>{const game=lockerGame;if(!game||game.busy||game.done||event.button>0)return;game.drag={index:i,id:event.pointerId,y:event.clientY};digit.setPointerCapture(event.pointerId)});
digit.addEventListener('pointermove',event=>{const game=lockerGame,drag=game?.drag;if(!drag||drag.id!==event.pointerId||drag.index!==i)return;const dy=event.clientY-drag.y;if(Math.abs(dy)>18){setLockerDigit(i,dy<0?1:-1);drag.y=event.clientY}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])digit.addEventListener(type,()=>{if(lockerGame)lockerGame.drag=null});
}
$('locker-go').onclick=submitLocker;
$('locker-tip').onclick=()=>{const game=lockerGame;if(!game||game.done)return;game.hint=!game.hint;persistLocker(game);renderLocker()};
$('locker-again').onclick=()=>{const game=lockerGame;if(!game||game.busy)return;const progress=game.progress;startLocker(progress,true);persistLocker(lockerGame);$('locker-digit-0').focus({preventScroll:true})};
}
