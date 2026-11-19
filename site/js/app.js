// Classic deferred scripts keep double-click/file previews working without fetch/import.
function applyGiftCopy(){
document.querySelectorAll('[data-copy]').forEach(element=>{element.textContent=COPY[element.dataset.copy]});
}
const preloadedMedia=new Map();
function loadDayMedia(day){return prepareGiftMedia(day)}

let theme='g';
const ART={};
const TX=(x,y,s,f,t,a='middle')=>`<text x='${x}' y='${y}' text-anchor='${a}' font-size='${s}' fill='${f}' style='font-family:var(--df)'>${t}</text>`;
const PG2=[['#e8493f','#ffd36b'],['#2fa7a0','#fff1c9'],['#7b62d1','#ffd36b'],['#f5a623','#c9473f'],['#4a90e2','#fff1c9'],['#e8609a','#fff1c9'],['#3fae6a','#ffd36b'],['#ffd36b','#e8493f']];
ART.g=i=>{const[c,r]=PG2[(i*5)%8],m=i%4,w=m===1?68:m===2?46:56,h=m===2?54:m===1?36:46,x=50-w/2,y=88-h,ly=y-11;
const dots=m===3?[[0,0],[1,1],[2,0],[0,2],[2,2],[1,3]].map(p=>`<circle cx='${x+9+p[0]*19}' cy='${y+8+p[1]*10}' r='3.2' fill='${r}'/>`).join(''):'';
const vr=m===3?'':`<rect x='44' y='${y}' width='12' height='${h}' fill='${r}'/>`,hr=m===1||m===3?`<rect x='${x}' y='${y+h*.45}' width='${w}' height='9' fill='${r}'/>`:'';
return `<svg viewBox='0 0 100 100'><g class='body'><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='2' fill='${c}'/><rect x='${x}' y='${y}' width='8' height='${h}' fill='#fff3'/><rect x='${x+w-6}' y='${y}' width='6' height='${h}' fill='#0002'/>${dots}${vr}${hr}<rect x='38' y='89' width='24' height='10' rx='2' fill='#0005'/>${TX(50,97,9,'#ffc872',z(i+1))}</g><g class='lid'><rect x='${x-4}' y='${ly}' width='${w+8}' height='13' rx='2' fill='${c}'/><rect x='${x-4}' y='${ly}' width='${w+8}' height='3' fill='#fff4'/><rect x='${x-4}' y='${y-2}' width='${w+8}' height='4' fill='#0003'/>${m===3?'':`<rect x='44' y='${ly}' width='12' height='13' fill='${r}'/>`}<path d='M50 ${ly}Q35 ${ly-22} 29 ${ly-10}Q34 ${ly+2} 50 ${ly}ZM50 ${ly}Q65 ${ly-22} 71 ${ly-10}Q66 ${ly+2} 50 ${ly}Z' fill='${r}'/><path d='M50 ${ly}Q40 ${ly-12} 34 ${ly-8}' fill='none' stroke='#0003' stroke-width='1.5'/><circle cx='50' cy='${ly}' r='4.5' fill='${r}' stroke='#0003' stroke-width='1.5'/></g></svg>`};
const art=i=>ART.g(i);
// ---------- Texte ----------
// ---------- Zustand ----------
let preview=false,sound=false,actx;
const realOpened=new Set(),previewOpened=new Set();
try{JSON.parse(localStorage.getItem('adv26')||'[]').forEach(n=>realOpened.add(n))}catch(e){}
let opened=preview?previewOpened:realOpened;
const save=(progress=opened)=>{if(progress!==realOpened)return;try{localStorage.setItem('adv26',JSON.stringify([...progress]))}catch(e){}};
const $=id=>document.getElementById(id),z=n=>String(n).padStart(2,'0');
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
function berlin(){const o={};new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>o[x.type]=+x.value);return o}
function clock(){const b=berlin(),k=b.year*10000+b.month*100+b.day;
const day=preview?24:k<20261201?0:k>20261224?25:b.day;
const now=Date.UTC(b.year,b.month-1,b.day,b.hour,b.minute,b.second);
const tgt=day===0?Date.UTC(2026,11,1):day<24?Date.UTC(2026,11,day+1):null;
return{day,ms:tgt?tgt-now:null}}
// ---------- Kalender ----------
function grid(){const {day}=clock();const G=$('grid');G.innerHTML='';let cur=null,ri=-1;const rows=theme==='b'?[1,2,3,4,5,6,3]:null;if(rows)G.insertAdjacentHTML('beforeend','<svg class="star" viewBox="0 0 7 6" shape-rendering="crispEdges" aria-hidden="true"><path fill="#ffd36b" d="M3 0h1v1H3zM2 1h3v1H2zM0 2h7v1H0zM1 3h5v1H1zM1 4h2v1H1zM4 4h2v1H4z"/></svg>');
for(let n=1;n<=24;n++){const i=n-1,b=document.createElement('button');
const st=n>day?'lock':opened.has(n)?'done':'ready';
b.className='tile px '+st;b.dataset.n=n;
b.setAttribute('aria-label',st==='lock'?`Fundstück ${n}, noch gesperrt`:st==='done'?`Fundstück ${n}, schon geöffnet`:`Fundstück ${n}, bereit zum Öffnen`);
b.innerHTML=`<span class="num">${z(n)}</span>`+art(i);
b.onclick=()=>tap(n,b);if(rows){if(!cur||cur.children.length>=rows[ri]){ri++;cur=document.createElement('div');cur.className='row';G.appendChild(cur)}cur.appendChild(b)}else G.appendChild(b)}}
function tick(){const {day,ms}=clock(),lab=$('lab'),s=$('segs');
if(preview){lab.className='lab';lab.textContent='Vorschau · Alle 24 Päckchen zum Ausprobieren';s.innerHTML='';return}
if(day===25){lab.className='fin';lab.textContent=FIN;s.innerHTML='';return}
if(day===24){lab.className='fin';lab.textContent='Heute öffnet sich das allerletzte Türchen. Das große Finale, Honey.';s.innerHTML='';return}
lab.className='lab';lab.textContent=day===0?'Noch bis zum Start des Abenteuers (1. Dezember):':'Noch bis zum nächsten Türchen:';
let t=Math.max(0,Math.floor(ms/1000));const v=[[Math.floor(t/86400),'Tage'],[Math.floor(t%86400/3600),'Std'],[Math.floor(t%3600/60),'Min'],[t%60,'Sek']];
s.innerHTML=v.map(a=>`<div class="seg px"><b>${z(a[0])}</b><i>${a[1]}</i></div>`).join('')}
let toastT;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2400)}
function tap(n,b){const {day}=clock();
if(n>day){b.classList.remove('shk');void b.offsetWidth;b.classList.add('shk');toast(`Noch nicht, Honey. Dieses Fundstück wartet bis zum ${n}. Dezember.`);return}
openDay(n)}
// ---------- Öffnen ----------
function beep(f,d,t=0){if(!sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.05,actx.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+t+d);o.connect(g).connect(actx.destination);o.start(actx.currentTime+t);o.stop(actx.currentTime+t+d)}catch(e){}}
function burst(){const st=$('stage'),cols=['#ffd36b','#ff8fab','#8fe0d4','#b9a6f5','#fff'];
for(let k=0;k<22;k++){const e=document.createElement('i');e.className='spk';e.style.background=cols[k%5];const a=Math.random()*6.28,r=60+Math.random()*60,s=4+Math.floor(Math.random()*3)*2;e.style.width=e.style.height=s+'px';st.appendChild(e);
e.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r-24}px) scale(.3)`,opacity:0}],{duration:800+Math.random()*400,easing:'steps(7)'}).onfinish=()=>e.remove()}}
let memoryGame=null,openingTimers=[],openingFlight=null;
function stopMemory(){if(memoryGame){clearTimeout(memoryGame.timer);memoryGame=null}}
function startMemory(progress){
stopMemory();
const deck=[0,0,1,1,2,2,3,3];
for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
const game=memoryGame={deck,buttons:[],first:null,busy:false,pairs:0,timer:null,progress};
$('memory-grid').innerHTML='';$('memory-status').textContent='0 von 4 Paaren gefunden';$('memory-status').classList.add('sr-only');$('memory-progress').textContent='0 / 4';
deck.forEach((symbol,index)=>{
const button=document.createElement('button');button.type='button';button.className='memory-tile';
button.setAttribute('aria-label',`Karte ${index+1}, verdeckt`);button.setAttribute('aria-pressed','false');
button.innerHTML=`<span class="memory-inner" aria-hidden="true"><span class="memory-face memory-back">?</span><span class="memory-face memory-front">${MEMORY_SYMBOLS[symbol][0]}</span></span>`;
button.onclick=()=>flipMemory(game,index);game.buttons.push(button);$('memory-grid').appendChild(button);
})}
function flipMemory(game,index){
if(memoryGame!==game||game.busy)return;
const button=game.buttons[index];if(button.classList.contains('flipped'))return;
button.classList.add('flipped');button.setAttribute('aria-pressed','true');
button.setAttribute('aria-label',`Karte ${index+1}: ${MEMORY_SYMBOLS[game.deck[index]][1]}`);
if(game.first===null){game.first=index;return}
const first=game.first;game.first=null;
if(game.deck[first]===game.deck[index]){
for(const i of [first,index]){game.buttons[i].classList.add('matched');game.buttons[i].setAttribute('aria-disabled','true')}
game.pairs++;$('memory-progress').textContent=game.pairs+' / 4';$('memory-status').classList.toggle('sr-only',game.pairs<4);beep(784,.12);
$('memory-status').textContent=`${game.pairs} von 4 Paaren gefunden`;
if(game.pairs===4){
game.busy=true;game.progress.add(2);save(game.progress);grid();
$('ch').textContent='Gut gespielt, Andre! Aber das war erst die Aufwärmrunde. Dein Geschenk wartet …';
$('memory-status').textContent='Alle vier Paare gefunden! Dein Geschenk ist freigeschaltet.';
$('wh').classList.add('on');beep(1046,.2);
}
}else{
game.busy=true;$('memory-status').classList.remove('sr-only');$('memory-status').textContent='Kein Paar. Versuch es noch einmal!';
game.timer=setTimeout(()=>{
if(memoryGame!==game)return;
for(const i of [first,index]){game.buttons[i].classList.remove('flipped');game.buttons[i].setAttribute('aria-pressed','false');game.buttons[i].setAttribute('aria-label',`Karte ${i+1}, verdeckt`)}
game.busy=false;$('memory-status').classList.add('sr-only');$('memory-status').textContent=`${game.pairs} von 4 Paaren gefunden`;
},1000);
}}
let bearGame=null;
function stopBear(){
if(bearGame)clearTimeout(bearGame.timer);
bearGame=null;$('bear-scene').classList.remove('bear-running','bear-done');
$('bear-scene').setAttribute('aria-disabled','false');$('bear-scene').setAttribute('aria-busy','false');
$('bear-replay').hidden=true;$('bear-start').hidden=false;$('bear-start').setAttribute('aria-disabled','false');$('bear-status').textContent='';
}
function startBear(progress){
stopBear();bearGame={progress,busy:false,done:false,timer:null};
$('ch').textContent=BEAR_INTRO;$('bear-scene').setAttribute('aria-label','Schokoladenbär antippen');
}
function playBear(){
const game=bearGame;if(!game||game.busy||game.done)return;
game.busy=true;$('bear-start').setAttribute('aria-disabled','true');$('bear-scene').setAttribute('aria-disabled','true');$('bear-scene').setAttribute('aria-busy','true');
const finish=()=>{
if(bearGame!==game)return;
game.busy=false;game.done=true;
$('bear-scene').classList.remove('bear-running');$('bear-scene').classList.add('bear-done');
$('bear-scene').setAttribute('aria-busy','false');$('bear-scene').setAttribute('aria-label','Katya im Schokoladenbären');
$('ch').textContent=BEAR_REVEAL;$('bear-status').textContent=BEAR_REVEAL;$('bear-start').hidden=true;
$('bear-replay').hidden=false;game.progress.add(3);save(game.progress);grid();
if(document.activeElement===$('bear-scene')||document.activeElement===$('bear-start'))$('bear-replay').focus();
};
if(matchMedia('(prefers-reduced-motion:reduce)').matches){finish();return}
$('bear-scene').classList.add('bear-running');game.timer=setTimeout(finish,1800);
}
$('bear-scene').onclick=playBear;$('bear-start').onclick=playBear;
$('bear-replay').onclick=()=>{
if(!bearGame||bearGame.busy)return;
const progress=bearGame.progress;startBear(progress);$('bear-scene').focus();
// The next frame starts a new CSS animation after the previous classes are removed.
void $('bear-scene').offsetWidth;playBear();
};
// Day 5 configuration: enter the actual hiding-place hint here when ready.
// The previous D[4] breakfast text is not a location for the new Lotus gift.
let lotusGame=null,lotusDrag=null;
function endLotusDrag(){
const drag=lotusDrag;if(drag){clearTimeout(drag.hold);if(drag.ghost)drag.ghost.remove()}
lotusDrag=null;$('lotus-plate').classList.remove('lotus-over');
}
function stopLotus(){
endLotusDrag();if(lotusGame){clearTimeout(lotusGame.timer);clearTimeout(lotusGame.effectsTimer)}
lotusGame=null;$('lotus-effects').innerHTML='';$('lotus-plate').removeAttribute('data-effect');$('lotus-plate').setAttribute('aria-busy','false');
}
function renderLotus(){
const game=lotusGame;if(!game)return;
$('lotus-image').src=LOTUS_ROOT+LOTUS_STAGES[game.step];$('lotus-image').alt=LOTUS_ALTS[game.step];
$('ch').textContent=LOTUS_TITLE;$('lotus-help').hidden=false;
$('lotus-status').textContent=game.busy?'Ein kleiner Moment — dein Cheesecake wird verfeinert.':game.step===3?LOTUS_WIN:`${game.step} von 3 Zutaten hinzugefügt.`;
$('lotus-status').classList.toggle('sr-only',game.step!==3||game.busy);
for(let i=0;i<3;i++){
const used=i<game.step,button=$('lotus-ingredient-'+i),progress=$('lotus-progress-'+i);
button.classList.toggle('lotus-used',used);
button.setAttribute('aria-disabled',String(used||game.busy||game.step===3));
button.setAttribute('aria-label',LOTUS_NAMES[i]+(used?', hinzugefügt':''));
button.draggable=!used&&!game.busy&&game.step<3;
progress.classList.toggle('lotus-complete',used);progress.textContent=used?'✓':String(i+1);
progress.setAttribute('aria-label',`Schritt ${i+1}${used?', geschafft':''}`);
if(i===game.step)progress.setAttribute('aria-current','step');else progress.removeAttribute('aria-current');
}
$('lotus-voucher').hidden=!game.earned;$('lotus-again').hidden=!game.earned;$('lotus-again').setAttribute('aria-disabled',String(game.busy));
const hint=LOTUS_CONFIG.giftHint.trim();$('lotus-hint').hidden=!game.earned||!hint;$('lotus-hint-text').textContent=hint;
}
function startLotus(progress,replay=false){
stopLotus();const earned=progress.has(5);
lotusGame={progress,step:earned&&!replay?3:0,earned,busy:false,timer:null,effectsTimer:null,suppressClickUntil:0};renderLotus();
// Ingredient placement must not give away the recipe order.
const order=[0,1,2];for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
if(order.every((value,index)=>value===index))order.push(order.shift());
for(const index of order)$('lotus-ingredients').appendChild($('lotus-ingredient-'+index));
}
function lotusParticles(kind){
if(matchMedia('(prefers-reduced-motion:reduce)').matches||!lotusGame)return;
const game=lotusGame;clearTimeout(game.effectsTimer);$('lotus-effects').innerHTML='';
for(let i=0;i<(kind==='heart'?5:10);i++){
const particle=document.createElement('span');particle.className='lotus-particle '+kind;
particle.style.left=(22+Math.random()*56)+'%';particle.style.top=(kind==='heart'?42+Math.random()*26:22+Math.random()*16)+'%';
particle.style.animationDelay=(i*.025)+'s';if(kind==='heart')particle.textContent='♥';$('lotus-effects').appendChild(particle);
}
game.effectsTimer=setTimeout(()=>{if(lotusGame===game)$('lotus-effects').innerHTML=''},1150);
}
async function addLotus(index){
const game=lotusGame;if(!game||game.busy||game.step===3)return;
if(index<game.step){$('lotus-status').classList.remove('sr-only');$('lotus-status').textContent='Die Zutat ist schon dabei. Probier eine andere!';return}
if(index!==game.step){$('lotus-status').classList.remove('sr-only');$('lotus-status').textContent='Das passt hier noch nicht ganz. Probier eine andere Zutat!';return}
endLotusDrag();clearTimeout(game.effectsTimer);game.effectsTimer=null;$('lotus-effects').innerHTML='';game.busy=true;renderLotus();$('lotus-plate').setAttribute('aria-busy','true');
const next=game.step+1,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
// Keep the previous full state visible until the incoming full PNG has decoded.
const image=new Image();image.src=LOTUS_ROOT+LOTUS_STAGES[next];
try{await image.decode()}catch(error){if(lotusGame===game){game.busy=false;renderLotus();$('lotus-plate').setAttribute('aria-busy','false');$('lotus-status').classList.remove('sr-only');$('lotus-status').textContent='Das Bild konnte gerade nicht laden. Tippe die Zutat bitte noch einmal an.'}return}
if(lotusGame!==game)return;
game.step=next;renderLotus();$('lotus-plate').setAttribute('data-effect',reduced?'':next===2?'cream':next===1?'crumb':'caramel');
if(!reduced&&next!==2)lotusParticles(next===1?'crumb':'caramel');
const finish=()=>{
if(lotusGame!==game)return;
game.busy=false;$('lotus-plate').setAttribute('aria-busy','false');$('lotus-plate').removeAttribute('data-effect');
if(game.step===3){game.earned=true;game.progress.add(5);save(game.progress);grid()}
renderLotus();if(game.step===3&&!reduced)lotusParticles('heart');
};
if(reduced)finish();else game.timer=setTimeout(finish,700);
}
function lotusDropContains(x,y){const rect=$('lotus-plate').getBoundingClientRect();return x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom}
function canDragLotus(index){return lotusGame&&!lotusGame.busy&&lotusGame.step<3&&index>=lotusGame.step}
function moveLotusTouch(touch){
const drag=lotusDrag;if(!drag||!drag.active)return;
drag.x=touch.clientX;drag.y=touch.clientY;drag.ghost.style.left=drag.x+'px';drag.ghost.style.top=drag.y+'px';
$('lotus-plate').classList.toggle('lotus-over',lotusDropContains(drag.x,drag.y));
}
for(let index=0;index<3;index++){
const button=$('lotus-ingredient-'+index);
button.onclick=event=>{if(event&&event.detail&&lotusGame&&Date.now()<lotusGame.suppressClickUntil)return;addLotus(index)};
button.ondragstart=event=>{
if(!canDragLotus(index)||(lotusDrag&&lotusDrag.type==='touch')){event.preventDefault();return}
endLotusDrag();lotusDrag={game:lotusGame,index,type:'mouse',active:true};
event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('text/plain',String(index));
};
button.ondragend=()=>{if(lotusGame)lotusGame.suppressClickUntil=Date.now()+400;endLotusDrag()};
button.addEventListener('contextmenu',event=>{if(lotusDrag&&lotusDrag.type==='touch')event.preventDefault()});
button.addEventListener('touchstart',event=>{
if(event.touches.length!==1||!canDragLotus(index))return;
endLotusDrag();const touch=event.touches[0],game=lotusGame;
const drag=lotusDrag={game,index,type:'touch',id:touch.identifier,x:touch.clientX,y:touch.clientY,startX:touch.clientX,startY:touch.clientY,active:false,hold:null,ghost:null};
// A short stationary hold arms dragging. Ordinary swipes still scroll normally.
drag.hold=setTimeout(()=>{
if(lotusDrag!==drag||lotusGame!==game||game.busy)return;
drag.active=true;drag.ghost=document.createElement('img');drag.ghost.src=LOTUS_ROOT+LOTUS_INGREDIENTS[index];
drag.ghost.alt='';drag.ghost.setAttribute('aria-hidden','true');drag.ghost.className='lotus-drag-ghost';document.body.appendChild(drag.ghost);
moveLotusTouch({clientX:drag.x,clientY:drag.y});
},180);
},{passive:true});
button.addEventListener('touchmove',event=>{
const drag=lotusDrag;if(!drag||drag.type!=='touch'||drag.index!==index)return;
if(event.touches.length!==1){endLotusDrag();return}
const touch=Array.from(event.touches).find(t=>t.identifier===drag.id);if(!touch)return;
if(!drag.active){if(Math.hypot(touch.clientX-drag.startX,touch.clientY-drag.startY)>8)endLotusDrag();return}
if(event.cancelable)event.preventDefault();moveLotusTouch(touch);
},{passive:false});
button.addEventListener('touchend',event=>{
const drag=lotusDrag;if(!drag||drag.type!=='touch'||drag.index!==index)return;
const touch=Array.from(event.changedTouches).find(t=>t.identifier===drag.id);if(!touch)return;
const active=drag.active,game=drag.game,inside=lotusDropContains(touch.clientX,touch.clientY);
if(active){if(event.cancelable)event.preventDefault();game.suppressClickUntil=Date.now()+500}
endLotusDrag();if(active&&inside&&lotusGame===game)addLotus(index);
},{passive:false});
button.addEventListener('touchcancel',endLotusDrag,{passive:true});
}
$('lotus-plate').ondragover=event=>{if(lotusDrag&&lotusDrag.type==='mouse'&&lotusDrag.game===lotusGame){event.preventDefault();event.dataTransfer.dropEffect='copy';$('lotus-plate').classList.add('lotus-over')}};
$('lotus-plate').ondragleave=()=>{$('lotus-plate').classList.remove('lotus-over')};
$('lotus-plate').ondrop=event=>{
const drag=lotusDrag;if(!drag||drag.type!=='mouse'||drag.game!==lotusGame)return;
event.preventDefault();drag.game.suppressClickUntil=Date.now()+500;const index=drag.index;endLotusDrag();addLotus(index);
};
$('lotus-again').onclick=()=>{if(!lotusGame||lotusGame.busy)return;const progress=lotusGame.progress;startLotus(progress,true);$('lotus-ingredient-0').focus({preventScroll:true});$('card').scrollTop=0};
const blankMovie=()=>({lampOff:false,tvOn:false,mugsTaken:false,finished:false,earned:false});
let realMovieState=blankMovie(),previewMovieState=blankMovie(),movieGame=null;
try{
const saved=JSON.parse(localStorage.getItem('adv26-day7')||'null');
if(saved&&typeof saved==='object')for(const key of [...MOVIE_KEYS,'finished','earned'])realMovieState[key]=saved[key]===true;
}catch(error){}
function persistMovie(game){
const state={};for(const key of MOVIE_KEYS)state[key]=game.flags[key];state.finished=game.finished;state.earned=game.earned;
if(game.progress===realOpened){realMovieState=state;try{localStorage.setItem('adv26-day7',JSON.stringify(state))}catch(error){}}
else previewMovieState=state;
}
function movieLater(game,fn,delay){
const id=setTimeout(()=>{game.timers.delete(id);if(movieGame===game)fn()},delay);game.timers.add(id);return id;
}
function stopMovie(){
if(movieGame)movieGame.timers.forEach(clearTimeout);movieGame=null;
for(const key of MOVIE_KEYS)$('movie-'+key).classList.remove('movie-hint');
}
function renderMovie(){
const game=movieGame;if(!game)return;
const room=$('movie-room'),count=MOVIE_KEYS.filter(key=>game.flags[key]).length;
room.classList.toggle('lamp-off',game.flags.lampOff);room.classList.toggle('tv-on',game.flags.tvOn);
room.classList.toggle('movie-taking',game.mugsAnimating);room.classList.toggle('has-mugs',game.flags.mugsTaken&&!game.mugsAnimating);
room.classList.toggle('movie-finished',game.finishing||game.finished);
const pose=game.flags.mugsTaken&&!game.mugsAnimating?'holding':'before';
if($('movie-couple').dataset.pose!==pose){$('movie-couple').src=MOVIE_ROOT+'couple-'+pose+'-v2.webp';$('movie-couple').dataset.pose=pose}
$('movie-mugs').hidden=game.flags.mugsTaken&&!game.mugsAnimating;
$('movie-count').textContent=count+' / 3';$('movie-count').setAttribute('aria-label',count+' von 3 Handgriffen gefunden');
for(const key of MOVIE_KEYS){const button=$('movie-'+key);button.setAttribute('aria-disabled',String(game.flags[key]));button.setAttribute('aria-label',MOVIE_LABELS[key][game.flags[key]?1:0]);if(game.flags[key])button.classList.remove('movie-hint')}
$('movie-tip').hidden=count===3;
$('movie-invitation').hidden=!game.earned;$('movie-again').hidden=!game.earned;
$('movie-again').setAttribute('aria-disabled',String(game.pending.size>0||game.finishing));
}
function finishMovieIfReady(){
const game=movieGame;if(!game||game.finished||game.finishing||game.pending.size||!MOVIE_KEYS.every(key=>game.flags[key]))return;
game.finishing=true;renderMovie();
const finish=()=>{
game.finishing=false;game.finished=true;game.earned=true;game.progress.add(7);save(game.progress);persistMovie(game);grid();renderMovie();
$('movie-status').textContent='';
};
if(matchMedia('(prefers-reduced-motion:reduce)').matches)finish();else movieLater(game,finish,650);
}
function startMovie(progress){
stopMovie();const stored=progress===realOpened?realMovieState:previewMovieState;
const flags={};for(const key of MOVIE_KEYS)flags[key]=stored[key]===true;
const finished=stored.finished&&MOVIE_KEYS.every(key=>flags[key]);
movieGame={flags,progress,finished,earned:stored.earned||progress.has(7),finishing:false,mugsAnimating:false,pending:new Set(),timers:new Set(),hintTimer:null};
$('movie-status').textContent='';renderMovie();finishMovieIfReady();
}
function discoverMovie(key){
const game=movieGame;if(!game||!MOVIE_KEYS.includes(key)||game.flags[key]||game.finishing||game.finished)return;
game.flags[key]=true;$('movie-status').textContent=MOVIE_MESSAGES[key]+' '+MOVIE_KEYS.filter(k=>game.flags[k]).length+' von 3.';
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
if(!reduced){
game.pending.add(key);if(key==='mugsTaken')game.mugsAnimating=true;
movieLater(game,()=>{game.pending.delete(key);if(key==='mugsTaken')game.mugsAnimating=false;renderMovie();finishMovieIfReady()},key==='mugsTaken'?450:key==='lampOff'?500:350);
}
persistMovie(game);renderMovie();finishMovieIfReady();
}
for(const key of MOVIE_KEYS)$('movie-'+key).onclick=()=>discoverMovie(key);
$('movie-tip').onclick=()=>{
const game=movieGame;if(!game)return;const key=MOVIE_KEYS.find(key=>!game.flags[key]);if(!key)return;
clearTimeout(game.hintTimer);game.timers.delete(game.hintTimer);for(const other of MOVIE_KEYS)$('movie-'+other).classList.remove('movie-hint');
$('movie-'+key).classList.add('movie-hint');
$('movie-status').textContent={lampOff:'Ein kleiner Tipp: Schau mal zur Lampe.',tvOn:'Ein kleiner Tipp: Schau mal zum Fernseher.',mugsTaken:'Ein kleiner Tipp: Da warten zwei Tassen auf uns.'}[key];
game.hintTimer=movieLater(game,()=>{$('movie-'+key).classList.remove('movie-hint')},1600);
};
$('movie-again').onclick=()=>{
const game=movieGame;if(!game||game.pending.size||game.finishing)return;
const progress=game.progress,earned=game.earned||progress.has(7),state={...blankMovie(),earned};
if(progress===realOpened){realMovieState=state;try{localStorage.setItem('adv26-day7',JSON.stringify(state))}catch(error){}}else previewMovieState=state;
startMovie(progress);$('movie-lampOff').focus();
};
function arrangeGift(day){
const kind=[6].includes(day)?'image':[3].includes(day)?'animation':[1,2,4,5,7,8,9,10,11,12,13,14,15,17,18].includes(day)?'game':'message';
const slots={1:'pirate-task',2:'memory-task',3:'bear-task',4:'elixir-task',5:'lotus-task',7:'movie-task',8:'tree-task',9:'energy-task',10:'match-task',11:'mirror-task',12:'cookie-task',13:'locker-task',14:'snack-task',15:'tail-task',17:'syrniki-task',18:'rocket-task'};
const slot=$(slots[day]||'gift-generic-task');slot.appendChild($('ch'));slot.hidden=$('ch').hidden;
$('card').dataset.kind=kind;$('card').dataset.day=String(day);$('card').dataset.hasTitle=String(!$('ch').hidden);
$('ov').classList.toggle('gift-layout',(day<=15||day===17||day===18));
$('gift-default-actions').hidden=$('yes').style.display==='none';
}
function setCard(n,progress){
stopPirate();stopMemory();stopBear();stopElixir();stopLotus();stopMovie();stopTree();stopEnergy();stopMatch();stopMirror();stopCookie();stopLocker();stopSnack();stopTail();stopSyrniki();stopRocket();$('tree').hidden=n!==8;$('energy').hidden=n!==9;$('match').hidden=n!==10;$('mirror').hidden=n!==11;$('cookie').hidden=n!==12;$('locker').hidden=n!==13;$('snack').hidden=n!==14;$('tail').hidden=n!==15;$('syrniki').hidden=n!==17;$('rocket').hidden=n!==18;$('movie').hidden=n!==7;$('massage').hidden=n!==6;$('ch').hidden=n===6||n===7;$('lotus').hidden=n!==5;$('pirate').hidden=n!==1;$('bear').hidden=n!==3;$('elixir').hidden=n!==4;
$('cn').textContent=z(n);
$('ch').textContent=n===1?PIRATE_TITLE:n===2?'Das nächste Geschenk musst du dir erspielen. Finde alle vier Paare!':n===3?BEAR_INTRO:n===4?ELIXIR_TITLE:n===5?LOTUS_TITLE:n===7?MOVIE_TITLE:n===8?TREE_TITLE:n===9?ENERGY_TITLE:n===10?MATCH_TITLE:n===11?MIRROR_TITLE:n===12?COOKIE_TITLE:n===13?LOCKER_TITLE:n===14?SNACK_TITLE:n===15?TAIL_TITLE:n===17?SYRNIKI_TITLE:n===18?ROCKET_TITLE:D[n-1][0];
$('wh').innerHTML=`<b>Dein Fund</b>${D[n-1][1]}`;$('wh').classList.remove('on');
$('yes').style.display=n===1||n===2||n===3||n===4||n===5||n===6||n===7||n===8||n===9||n===10||n===11||n===12||n===13||n===14||n===15||n===17||n===18?'none':'block';$('memory').hidden=n!==2;
if(n===1)startPirate(progress);if(n===2)startMemory(progress);if(n===3)startBear(progress);if(n===4)startElixir(progress);if(n===5)startLotus(progress);if(n===7)startMovie(progress);if(n===8)startTree(progress);if(n===9)startEnergy(progress);if(n===10)startMatch(progress);if(n===11)startMirror(progress);if(n===12)startCookie(progress);if(n===13)startLocker(progress);if(n===14)startSnack(progress);if(n===15)startTail(progress);if(n===17)startSyrniki(progress);if(n===18)startRocket(progress);arrangeGift(n);
}
function openDay(n){lockCalendarScroll();const media=loadDayMedia(n);let mediaDone=!media,mediaError=false,openingDone=false;const i=n-1,ov=$('ov'),st=$('stage'),cd=$('card'),progress=opened,first=!progress.has(n),earnsOnOpen=![1,2,3,4,5,7,8,9,10,11,12,13,14,15,17,18].includes(n);
openingTimers.forEach(clearTimeout);openingTimers=[];
if(openingFlight){openingFlight.cancel();openingFlight=null}
const activeOpening=openingTimers;
$('gift-loading').hidden=true;$('gift-loading-retry').hidden=true;ov.classList.remove('gift-loading');
st.className='stage';st.innerHTML=art(i);cd.classList.remove('on');setCard(n,progress);ov.classList.toggle('memory-mode',n===2);ov.classList.toggle('photo-mode',n===1);ov.classList.toggle('bear-mode',n===3);ov.classList.toggle('shaker-mode',n===4);ov.classList.toggle('lotus-mode',n===5);ov.classList.toggle('massage-mode',n===6);ov.classList.toggle('movie-mode',n===7);ov.classList.toggle('tree-mode',n===8);ov.classList.add('on');ov.dataset.n=n;
const show=()=>{
const origin=ov.classList.contains('gift-opening')&&!RM?st.getBoundingClientRect():null;
openingDone=true;ov.classList.remove('gift-opening');st.classList.add('small','pop');
if(!mediaDone||mediaError){ov.classList.add('gift-loading');$('gift-loading').hidden=false;$('gift-loading-retry').hidden=!mediaError;$('gift-loading-message').textContent=mediaError?'Die Bilder konnten nicht geladen werden. Bitte versuch es noch einmal.':'Dein Fundstück lädt …';$('gift-loading').setAttribute('aria-busy',String(!mediaError));$('gift-loading-close').focus({preventScroll:true});return}
ov.classList.remove('gift-loading');$('gift-loading').hidden=true;cd.classList.add('on');
if(origin){const target=st.getBoundingClientRect();openingFlight=st.animate([{transform:`translate(${origin.left-target.left}px,${origin.top-target.top}px)`},{transform:'translate(0,0)'}],{duration:500,easing:'cubic-bezier(.22,.68,0,1)'})}
$('x').focus()
};
if(media)media.then(()=>{if(openingTimers!==activeOpening)return;mediaDone=true;if(openingDone)show()},()=>{if(openingTimers!==activeOpening)return;mediaError=true;if(openingDone)show()});
if(!first||RM){if(first&&earnsOnOpen){progress.add(n);save(progress)}show();grid();return}
ov.classList.add('gift-opening');beep(330,.1);st.classList.add('wob');
openingTimers.push(setTimeout(()=>{if(openingTimers!==activeOpening)return;st.classList.add('pop');burst();beep(660,.1);beep(880,.1,.1);beep(1320,.2,.2)},650));
openingTimers.push(setTimeout(()=>{if(openingTimers!==activeOpening)return;show();if(earnsOnOpen){progress.add(n);save(progress)}grid()},1300))}
function closeOv(){openingTimers.forEach(clearTimeout);openingTimers=[];if(openingFlight){openingFlight.cancel();openingFlight=null}stopPirate();stopMemory();stopBear();stopElixir();stopLotus();stopMovie();stopTree();stopEnergy();stopMatch();stopMirror();stopCookie();stopLocker();stopSnack();stopTail();stopSyrniki();stopRocket();$('ov').classList.remove('on','gift-opening','memory-mode','photo-mode','bear-mode','shaker-mode','lotus-mode','massage-mode','movie-mode','tree-mode','gift-loading');$('gift-loading').hidden=true;unlockCalendarScroll()}
$('x').onclick=closeOv;$('gift-loading-close').onclick=closeOv;$('gift-loading-retry').onclick=()=>openDay(Number($('ov').dataset.n));
$('ov').addEventListener('click',e=>{if(e.target.id==='ov'&&$('card').classList.contains('on'))closeOv()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOv()});
$('yes').onclick=()=>{if(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','17','18'].includes($('ov').dataset.n))return;$('wh').classList.add('on');$('yes').style.display='none';beep(784,.12)};
$('snd').onclick=()=>{sound=!sound;$('snd').setAttribute('aria-pressed',sound);$('snd').innerHTML=sound?'TON<br>AN':'TON<br>AUS';beep(660,.1)};
// ---------- Vorschau-Steuerung ----------
function updatePreview(){
opened=preview?previewOpened:realOpened;
$('preview').setAttribute('aria-label',preview?'Vorschau beenden':'Einstellungen');
$('preview').textContent=preview?'Vorschau beenden':'⚙';
$('preview-access').hidden=true;$('preview').setAttribute('aria-expanded','false');
$('preview-code').value='';$('preview-error').textContent='';
$('preview-note').hidden=!preview;$('rs').hidden=!preview;
grid();tick();
}
$('preview').onclick=()=>{
if(preview){preview=false;closeOv();updatePreview();return}
const form=$('preview-access');form.hidden=!form.hidden;
$('preview').setAttribute('aria-expanded',String(!form.hidden));
$('preview-error').textContent='';if(!form.hidden)$('preview-code').focus();
};
$('preview-access').onsubmit=e=>{
e.preventDefault();
if($('preview-code').value!=='6652'){
$('preview-error').textContent='Der Code stimmt leider nicht. Versuch es noch einmal.';
$('preview-code').setAttribute('aria-invalid','true');$('preview-code').value='';$('preview-code').focus();return;
}
$('preview-code').removeAttribute('aria-invalid');preview=true;closeOv();updatePreview();$('preview').focus();
};
$('rs').onclick=()=>{previewOpened.clear();previewMovieState=blankMovie();previewTreeState=null;previewEnergyState=null;previewMatchState=null;previewMirrorState=null;previewCookieState=null;previewPirateState=null;previewElixirState=null;previewLockerState=null;previewSnackState=null;previewTailState=null;previewSyrnikiState=null;previewRocketState=null;grid()};
function boot(){document.body.dataset.t='g';document.body.classList.add('v');
$('gl').innerHTML=Array.from({length:14},(_,k)=>`<i style="--c:${['#ffc872','#ffe9b0','#e88a6a','#fff'][k%4]};animation-delay:${(k%4)*.4}s"></i>`).join('');
for(let k=0;k<26;k++){const e=document.createElement('i');e.className='fl';const z=3+k%3*2;e.style.cssText=`left:${Math.random()*100}%;width:${z}px;height:${z}px;background:#fff;opacity:${.35+Math.random()*.5};animation-name:fall;animation-duration:${7+Math.random()*9}s;animation-delay:-${Math.random()*14}s`;document.body.appendChild(e)}
grid()}
applyGiftCopy();initPirate();initElixir();initTree();initEnergy();initMatch();initMirror();initCookie();initLocker();initSnack();initTail();initSyrniki();initRocket();boot();updatePreview();setInterval(tick,1000);
