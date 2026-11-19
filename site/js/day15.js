// A closed, angular tail silhouette; hit areas stay separate even at 320px viewport.
const TAIL_TITLE='Eine funkelnde Spur';
const TAIL_POINTS=[[125,30],[225,90],[165,165],[215,215],[135,295],[175,345],[95,425],[35,365],[85,315],[35,265],[115,190],[65,140]];
const TAIL_PATH='M'+TAIL_POINTS.map(point=>point.join(',')).join('L')+'Z';
const TAIL_LENGTHS=TAIL_POINTS.map((point,index)=>{const next=TAIL_POINTS[(index+1)%TAIL_POINTS.length];return Math.hypot(next[0]-point[0],next[1]-point[1])});
const TAIL_LENGTH=TAIL_LENGTHS.reduce((sum,length)=>sum+length,0);
let realTailState=null,previewTailState=null,tailGame=null;
function readTailState(value){return value&&Number.isInteger(value.count)&&value.count>=0&&value.count<=TAIL_POINTS.length?{count:value.count,earned:value.earned===true}:null}
try{realTailState=readTailState(JSON.parse(localStorage.getItem('adv26-day15')||'null'))}catch(error){}
function persistTail(game){const state={count:game.count,earned:game.earned};if(game.progress===realOpened){realTailState=state;try{localStorage.setItem('adv26-day15',JSON.stringify(state))}catch(error){}}else previewTailState=state}
function stopTail(){if(!tailGame)return;persistTail(tailGame);tailGame.timers.forEach(clearTimeout);tailGame.animations.forEach(animation=>animation.cancel());$('tail-effects').innerHTML='';tailGame=null}
function tailLater(game,fn,delay){const timer=setTimeout(()=>{game.timers.delete(timer);if(tailGame===game)fn()},delay);game.timers.add(timer)}
function renderTail(){
const game=tailGame;if(!game)return;
const done=game.count===TAIL_POINTS.length;
$('tail-scene').classList.toggle('tail-done',done);$('tail-scene').classList.toggle('tail-restored',game.restored);
const distance=done?TAIL_LENGTH:TAIL_LENGTHS.slice(0,Math.max(0,game.count-1)).reduce((sum,length)=>sum+length,0);
$('tail-line').style.strokeDashoffset=String(100-distance/TAIL_LENGTH*100);
$('tail-progress').textContent=game.count+' / '+TAIL_POINTS.length;
$('tail-intro').hidden=done;
$('tail-reward').hidden=!done;$('tail-again').hidden=!game.earned;
for(let index=0;index<TAIL_POINTS.length;index++){
const button=$('tail-point-'+index);button.disabled=index<game.count||done;button.classList.toggle('tail-found',index<game.count);button.classList.toggle('tail-current',!done&&index===game.count);
button.setAttribute('aria-label',`Punkt ${index+1}${index<game.count?' verbunden':' verbinden'}`);
}
}
function startTail(progress,replay=false){
stopTail();const state=progress===realOpened?realTailState:previewTailState;
const count=replay?0:state?state.count:progress.has(15)?TAIL_POINTS.length:0;
tailGame={progress,count,earned:progress.has(15)||Boolean(state?.earned)||count===TAIL_POINTS.length,restored:true,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,timers:new Set(),animations:new Set()};
if(count===TAIL_POINTS.length&&!progress.has(15)){progress.add(15);save(progress)}
$('tail-package').innerHTML=art(14);$('tail-status').textContent=count===TAIL_POINTS.length?'Die geheime Form ist entdeckt.':`Weiter mit Punkt ${count+1}.`;
// Reset without a backwards drawing transition, including during an unfinished finale.
$('tail-line').style.transition='none';renderTail();void $('tail-line').offsetWidth;$('tail-line').style.transition='';
}
function tailSparks(game){if(game.reduced)return;for(let index=0;index<14;index++){
const spark=document.createElement('i');spark.className='tail-spark';spark.style.left=(20+Math.random()*60)+'%';spark.style.top=(12+Math.random()*68)+'%';$('tail-effects').appendChild(spark);
const animation=spark.animate([{opacity:0,transform:'scale(.4)'},{opacity:1,offset:.25},{opacity:0,transform:`translate(${(Math.random()-.5)*65}px,-25px) scale(.2)`}],{duration:850,easing:'ease-out',delay:index*25});game.animations.add(animation);animation.onfinish=()=>{spark.remove();game.animations.delete(animation)};
}}
function connectTail(index){
const game=tailGame;if(!game||game.count===TAIL_POINTS.length||index<game.count)return;
if(index!==game.count){$('tail-status').textContent=`Fast! Weiter geht’s mit Punkt ${game.count+1}.`;if(!game.reduced){const animation=$('tail-point-'+index).animate([{background:'#e88a6a55'},{background:'transparent'}],{duration:320});game.animations.add(animation);animation.onfinish=()=>game.animations.delete(animation)}return}
game.count++;game.restored=false;
if(game.count===TAIL_POINTS.length){game.earned=true;game.progress.add(15);save(game.progress);grid();tailSparks(game);$('tail-status').textContent='Alle zwölf Punkte verbunden. Die Überraschung ist freigeschaltet!'}else $('tail-status').textContent=`${game.count} von 12 Punkten verbunden. Weiter mit Punkt ${game.count+1}.`;
persistTail(game);renderTail();
if(game.count===TAIL_POINTS.length){if(game.reduced){$('tail-reward').focus({preventScroll:true});$('tail-reward').scrollIntoView({block:'nearest'})}else tailLater(game,()=>{$('tail-reward').focus({preventScroll:true});$('tail-reward').scrollIntoView({block:'nearest'})},900)}
else $('tail-point-'+game.count).focus({preventScroll:true});
}
function initTail(){
$('tail-line').setAttribute('d',TAIL_PATH);$('tail-fill').setAttribute('d',TAIL_PATH);
TAIL_POINTS.forEach((point,index)=>{const button=document.createElement('button');button.id='tail-point-'+index;button.type='button';button.className='tail-point';button.style.left=point[0]/260*100+'%';button.style.top=point[1]/460*100+'%';button.textContent=String(index+1);button.onclick=()=>connectTail(index);$('tail-points').appendChild(button)});
$('tail-again').onclick=()=>{if(!tailGame)return;const progress=tailGame.progress;startTail(progress,true);persistTail(tailGame);$('tail-point-0').focus({preventScroll:true});$('card').scrollTop=0};
}
