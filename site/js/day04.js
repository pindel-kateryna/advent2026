// Adapted from the owner's ElixierSpiel: any ingredient order, automatic splash finale.
const ELIXIR_TITLE='Dein kleines Elixier ✨';
const ELIXIR_INGREDIENTS=[{id:'moon',name:'Mondtau',color:'#6ab8ff',rgb:[106,184,255]},{id:'star',name:'Sternenstaub',color:'#ffd36b',rgb:[255,211,107]},{id:'spark',name:'Zimtfunke',color:'#ff8aa8',rgb:[255,138,168]}];
let realElixirState=null,previewElixirState=null,elixirGame=null;
function readElixirState(value){if(!value||typeof value!=='object')return null;return{added:[...new Set(Array.isArray(value.added)?value.added.filter(id=>ELIXIR_INGREDIENTS.some(item=>item.id===id)):[])],earned:value.earned===true}}
try{realElixirState=readElixirState(JSON.parse(localStorage.getItem('adv26-day4')||'null'))}catch(error){}
function persistElixir(game){const state={added:[...game.added],earned:game.earned};if(game.progress===realOpened){realElixirState=state;try{localStorage.setItem('adv26-day4',JSON.stringify(state))}catch(error){}}else previewElixirState=state}
function stopElixir(){const game=elixirGame;if(game){persistElixir(game);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel())}elixirGame=null;$('elixir-effects').innerHTML='';$('elixir-scene').classList.remove('elixir-burst')}
function elixirLater(game,fn,delay){const timer=setTimeout(()=>{game.timers.delete(timer);if(elixirGame===game)fn()},delay);game.timers.add(timer)}
function renderElixir(){
const game=elixirGame;if(!game)return;
const count=game.added.size;
$('elixir-count').textContent=count+' / 3';
$('elixir-stage-label').setAttribute('aria-label',count===3?'Gefülltes magisches Elixier':`Elixier: ${count} von 3 Zutaten`);
ELIXIR_INGREDIENTS.forEach((item,index)=>{const used=game.added.has(item.id),button=$('elixir-ingredient-'+index);button.disabled=used||game.busy||game.done;button.classList.toggle('elixir-used',used);button.setAttribute('aria-label',item.name+(used?', hinzugefügt':', hinzufügen'));$('elixir-check-'+index).hidden=!used});
$('elixir-liquid').setAttribute('y',String([94,73,54,31][count]));
const colors=ELIXIR_INGREDIENTS.filter(item=>game.added.has(item.id)).map(item=>item.rgb);
const tint=count===3?'#b58cff':count?`rgb(${[0,1,2].map(channel=>Math.round(colors.reduce((sum,color)=>sum+color[channel],0)/count)).join(',')})`:'#6ab8ff';
$('elixir-liquid').setAttribute('fill',tint);
$('elixir-scene').classList.toggle('elixir-done',game.done);
$('elixir-scene').classList.toggle('elixir-busy',game.busy);
$('elixir-scene').setAttribute('aria-busy',String(game.busy));
$('elixir-result').hidden=!game.done;$('elixir-result').setAttribute('aria-hidden',String(!game.done));
$('elixir-again').hidden=!game.earned||game.busy;
$('elixir-status').textContent=game.done?'Plopp! Dein Elixier ist fertig.':game.busy&&count===3?'Voll! Die Magie sprudelt gleich heraus …':game.busy?'Die Zutat fließt hinein …':count?`Noch ${3-count===1?'eine Zutat':'zwei Zutaten'}. Du entscheidest die Reihenfolge.`:'Gib alle drei Zutaten hinein. Die Reihenfolge ist egal.';
}
function startElixir(progress,replay=false){
stopElixir();const state=progress===realOpened?realElixirState:previewElixirState;
const added=new Set(replay?[]:state?state.added:progress.has(4)?ELIXIR_INGREDIENTS.map(item=>item.id):[]);
const done=added.size===3;
elixirGame={progress,added,done,earned:progress.has(4)||Boolean(state&&state.earned)||done,busy:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,timers:new Set(),animations:new Set()};
if(done&&!progress.has(4)){progress.add(4);save(progress)}
$('elixir-scene').classList.toggle('elixir-restored',done);renderElixir();
}
function elixirParticles(game,burst,color){
if(game.reduced)return;
for(let i=0;i<(burst?32:7);i++){
const node=document.createElement('i');node.className=burst?'elixir-splash':'elixir-drop';node.style.left=47+Math.random()*6+'%';node.style.top=burst?'22%':'9%';node.style.background=burst?['#b58cff','#6ab8ff','#ff8aa8','#ffe9b0'][i%4]:color;$('elixir-effects').appendChild(node);
const dx=(Math.random()-.5)*(burst?260:25),height=burst?-40-Math.random()*80:80;
const animation=node.animate([{transform:'translate(0,0) scale(.5)',opacity:0},{transform:`translate(${dx*.7}px,${height}px) scale(1)`,opacity:1,offset:.4},{transform:`translate(${dx}px,${burst?150:140}px) scale(.3)`,opacity:0}],{duration:burst?1100+Math.random()*350:520,easing:'ease-out'});game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)};
}
}
async function addElixir(id){
const game=elixirGame,item=ELIXIR_INGREDIENTS.find(item=>item.id===id);if(!game||!item||game.done||game.busy||game.added.has(id))return;
game.busy=true;renderElixir();
try{const image=$('elixir-flask');if(image.decode)await image.decode()}catch(error){if(elixirGame===game){game.busy=false;renderElixir();$('elixir-status').textContent='Die Illustration lädt noch. Bitte versuch es gleich noch einmal.'}return}
if(elixirGame!==game)return;
game.added.add(id);persistElixir(game);renderElixir();elixirParticles(game,false,item.color);
const finish=()=>{game.busy=false;renderElixir();if(game.done)$('elixir-result').focus({preventScroll:true});else $('elixir-ingredient-'+ELIXIR_INGREDIENTS.findIndex(item=>!game.added.has(item.id))).focus({preventScroll:true})};
const win=()=>{game.done=true;game.earned=true;game.progress.add(4);save(game.progress);persistElixir(game);grid();renderElixir()};
if(game.reduced){if(game.added.size===3)win();finish();return}
if(game.added.size===3){elixirLater(game,()=>{$('elixir-scene').classList.add('elixir-burst');elixirParticles(game,true,item.color)},650);elixirLater(game,win,950);elixirLater(game,finish,1800)}else elixirLater(game,finish,600);
}
function initElixir(){ELIXIR_INGREDIENTS.forEach((item,index)=>{$('elixir-ingredient-'+index).onclick=()=>addElixir(item.id)});$('elixir-again').onclick=()=>{const game=elixirGame;if(!game||game.busy)return;const progress=game.progress;startElixir(progress,true);persistElixir(elixirGame);$('elixir-ingredient-0').focus({preventScroll:true})}}
