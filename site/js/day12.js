// Three taps, growing cracks, two cookie halves and the parcel number.
const COOKIE_STEPS=['Ein knuspriger Fund. Tipp drauf!','Es knackt schon …','Noch ein Tipp!','Knack! Da war was drin.'];
let realCookieState=null,previewCookieState=null,cookieGame=null;
function readCookieState(value){return value&&typeof value==='object'?{count:Number.isFinite(value.count)?Math.max(0,Math.min(3,Math.floor(value.count))):0,earned:value.earned===true}:null}
try{realCookieState=readCookieState(JSON.parse(localStorage.getItem('adv26-day12')||'null'))}catch(error){}
function persistCookie(game){const state={count:game.count,earned:game.earned};if(game.progress===realOpened){realCookieState=state;try{localStorage.setItem('adv26-day12',JSON.stringify(state))}catch(error){}}else previewCookieState=state}
function stopCookie(){const game=cookieGame;if(game){persistCookie(game);game.timers.forEach(clearTimeout);game.animations.forEach(animation=>animation.cancel())}cookieGame=null;$('cookie-crumbs').innerHTML=''}
function renderCookie(){
const game=cookieGame;if(!game)return;
$('cookie-stage').className='cookie-stage cookie-level-'+game.count+(game.count===3?' cookie-broken':'');
$('cookie-status').textContent=COOKIE_STEPS[game.count];
$('cookie-tap').disabled=game.count===3;
$('cookie-tap').setAttribute('aria-label',`Keks antippen: ${game.count} von 3`);
$('cookie-message').setAttribute('aria-hidden',String(game.count!==3));
$('cookie-again').hidden=!game.earned||game.busy;
}
function cookieCrunch(big){
if(!sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const length=big?.18:.09,buffer=actx.createBuffer(1,actx.sampleRate*length,actx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,big?2:4);const source=actx.createBufferSource(),filter=actx.createBiquadFilter(),gain=actx.createGain();source.buffer=buffer;filter.type='highpass';filter.frequency.value=big?900:1800;gain.gain.value=big?.35:.2;source.connect(filter).connect(gain).connect(actx.destination);source.start()}catch(error){}
}
function cookieCrumbs(game,big){
if(game.reduced)return;
for(let i=0;i<(big?24:6);i++){const node=document.createElement('i'),size=5+Math.random()*7;node.className='cookie-crumb';node.style.width=size+'px';node.style.height=size*.8+'px';node.style.left=50+(Math.random()-.5)*(big?55:30)+'%';node.style.top=46+Math.random()*12+'%';$('cookie-crumbs').appendChild(node);const dx=(Math.random()-.5)*90;const animation=node.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx}px,130px) rotate(${Math.random()*360}deg)`,opacity:0}],{duration:700+Math.random()*500,easing:'cubic-bezier(.4,0,.9,.6)'});game.animations.add(animation);animation.onfinish=()=>{node.remove();game.animations.delete(animation)}}
}
function tapCookie(){
const game=cookieGame;if(!game||game.count>=3||game.busy)return;
game.count++;cookieCrunch(game.count===3);cookieCrumbs(game,game.count===3);
if(!game.reduced){const animation=$('cookie-tap').animate([{transform:'scale(1)'},{transform:`scale(.93) rotate(${game.count%2?-2:2}deg)`},{transform:'scale(1)'}],{duration:180});game.animations.add(animation);animation.onfinish=()=>game.animations.delete(animation)}
if(game.count===3){game.busy=!game.reduced;game.earned=true;game.progress.add(12);save(game.progress);grid()}
persistCookie(game);renderCookie();
if(game.count===3){const finish=()=>{if(cookieGame!==game)return;game.busy=false;renderCookie();$('cookie-message').focus({preventScroll:true})};if(game.reduced)finish();else{const timer=setTimeout(()=>{game.timers.delete(timer);finish()},900);game.timers.add(timer)}}
}
function startCookie(progress,replay=false){
stopCookie();const state=progress===realOpened?realCookieState:previewCookieState;
const count=replay?0:state?state.count:progress.has(12)?3:0,earned=progress.has(12)||Boolean(state&&state.earned)||count===3;
cookieGame={progress,count,earned,busy:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,timers:new Set(),animations:new Set()};
if(earned&&!progress.has(12)){progress.add(12);save(progress)}
$('cookie-stage').classList.remove('cookie-restored');renderCookie();if(count===3)$('cookie-stage').classList.add('cookie-restored');
}
function initCookie(){
$('cookie-tap').onclick=tapCookie;
$('cookie-again').onclick=()=>{const game=cookieGame;if(!game||game.busy)return;const progress=game.progress;startCookie(progress,true);persistCookie(cookieGame);$('cookie-tap').focus({preventScroll:true})};
}
