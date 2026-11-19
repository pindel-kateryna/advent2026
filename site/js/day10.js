const MATCH_COLS=5,MATCH_ROWS=6,MATCH_SIZE=MATCH_COLS*MATCH_ROWS;
const MATCH_COLORS=['red','yellow','green','blue','purple'];
const MATCH_GOALS={red:5,yellow:10};
const MATCH_NAMES={red:'rotes',yellow:'gelbes',green:'grünes',blue:'blaues',purple:'lila'};
let realMatchState=null,previewMatchState=null,matchGame=null;
const matchRandomColor=()=>MATCH_COLORS[Math.floor(Math.random()*MATCH_COLORS.length)];
function findMatchLines(board){
const found=new Set();
for(let row=0;row<MATCH_ROWS;row++)for(let col=0;col<MATCH_COLS;){
const start=col,color=board[row*MATCH_COLS+col];while(col<MATCH_COLS&&board[row*MATCH_COLS+col]===color)col++;
if(color&&col-start>=3)for(let x=start;x<col;x++)found.add(row*MATCH_COLS+x);
}
for(let col=0;col<MATCH_COLS;col++)for(let row=0;row<MATCH_ROWS;){
const start=row,color=board[row*MATCH_COLS+col];while(row<MATCH_ROWS&&board[row*MATCH_COLS+col]===color)row++;
if(color&&row-start>=3)for(let y=start;y<row;y++)found.add(y*MATCH_COLS+col);
}
return found;
}
function matchAdjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<MATCH_SIZE&&b<MATCH_SIZE&&Math.abs(Math.floor(a/MATCH_COLS)-Math.floor(b/MATCH_COLS))+Math.abs(a%MATCH_COLS-b%MATCH_COLS)===1}
function matchMoves(board){
const moves=[];
for(let a=0;a<MATCH_SIZE;a++)for(const b of [a+1,a+MATCH_COLS]){
if(!matchAdjacent(a,b)||board[a]===board[b])continue;
const swapped=board.slice();[swapped[a],swapped[b]]=[swapped[b],swapped[a]];
const lines=findMatchLines(swapped);if(lines.has(a)||lines.has(b))moves.push([a,b]);
}
return moves;
}
function makeMatchBoard(){
for(let attempt=0;attempt<100;attempt++){
const board=[];
for(let i=0;i<MATCH_SIZE;i++){
const choices=MATCH_COLORS.filter(color=>!(i%MATCH_COLS>=2&&board[i-1]===color&&board[i-2]===color)&&!(i>=MATCH_COLS*2&&board[i-MATCH_COLS]===color&&board[i-MATCH_COLS*2]===color));
board.push(choices[Math.floor(Math.random()*choices.length)]);
}
if(matchMoves(board).length)return board;
}
// Stable fallback with a guaranteed red match after swapping row 1, col 2 down.
return ['red','yellow','red','green','blue','green','red','blue','yellow','purple','yellow','blue','purple','red','green','blue','purple','green','yellow','red','purple','green','yellow','blue','yellow','red','yellow','blue','purple','green'];
}
function collapseMatchBoard(board,matched){
const next=Array(MATCH_SIZE),distances=Array(MATCH_SIZE).fill(0);
for(let col=0;col<MATCH_COLS;col++){
let target=MATCH_ROWS-1;
for(let row=MATCH_ROWS-1;row>=0;row--){const source=row*MATCH_COLS+col;if(matched.has(source))continue;const index=target*MATCH_COLS+col;next[index]=board[source];distances[index]=target-row;target--}
const empty=target+1;
for(;target>=0;target--){const index=target*MATCH_COLS+col;next[index]=matchRandomColor();distances[index]=empty}
}
return{board:next,distances};
}
function planMatchCascades(board){
let current=board.slice();const waves=[],gains={red:0,yellow:0};let reshuffled=false;
for(let wave=0;wave<30;wave++){
const matched=findMatchLines(current);if(!matched.size)break;
const gained={red:0,yellow:0};for(const i of matched)if(current[i] in gained)gained[current[i]]++;
gains.red+=gained.red;gains.yellow+=gained.yellow;
const next=collapseMatchBoard(current,matched);waves.push({before:current,matched:[...matched],after:next.board,distances:next.distances,gained});current=next.board;
}
if(findMatchLines(current).size||!matchMoves(current).length){current=makeMatchBoard();reshuffled=true}
return{board:current,waves,gains,reshuffled};
}
function readMatchState(value){
if(!value||typeof value!=='object')return null;
const collected={};for(const color of ['red','yellow'])collected[color]=Number.isInteger(value.collected&&value.collected[color])&&value.collected[color]>=0&&value.collected[color]<=MATCH_GOALS[color]?value.collected[color]:0;
const valid=Array.isArray(value.board)&&value.board.length===MATCH_SIZE&&value.board.every(color=>MATCH_COLORS.includes(color));
const board=valid&&!findMatchLines(value.board).size&&matchMoves(value.board).length?value.board.slice():makeMatchBoard();
return{board,collected,earned:value.earned===true};
}
try{realMatchState=readMatchState(JSON.parse(localStorage.getItem('adv26-day10')||'null'))}catch(error){}
function persistMatch(game){
const state={board:game.board.slice(),collected:{...game.collected},earned:game.earned};
if(game.progress===realOpened){realMatchState=state;try{localStorage.setItem('adv26-day10',JSON.stringify(state))}catch(error){}}else previewMatchState=state;
}
function matchComplete(counts){return counts.red>=MATCH_GOALS.red&&counts.yellow>=MATCH_GOALS.yellow}
function matchLater(game,fn,delay){const id=setTimeout(()=>{game.timers.delete(id);if(matchGame===game)fn()},delay);game.timers.add(id);return id}
function stopMatch(){
if(matchGame){matchGame.timers.forEach(clearTimeout);matchGame.animations.forEach(animation=>animation.cancel());matchGame.drag=null}
matchGame=null;
}
function matchAnimate(game,node,frames,options){
if(game.reduced)return;
const animation=node.animate(frames,options);game.animations.add(animation);animation.onfinish=()=>game.animations.delete(animation);
}
function renderMatch(){
const game=matchGame;if(!game)return;
const board=game.viewBoard||game.board,counts=game.viewCounts||game.collected,finished=matchComplete(game.collected)&&!game.busy;
$('ch').hidden=false;$('ch').textContent=MATCH_TITLE;
for(const color of ['red','yellow']){
$('match-goal-'+color).textContent=counts[color]+' / '+MATCH_GOALS[color];
$('match-target-'+color).classList.toggle('is-complete',counts[color]>=MATCH_GOALS[color]);
}
$('match-board').setAttribute('aria-busy',String(game.busy));
for(let i=0;i<MATCH_SIZE;i++){
const button=game.buttons[i],selected=game.selected===i;
if(button.dataset.color!==board[i]){button.dataset.color=board[i];game.images[i].src=MATCH_ROOT+'bear-'+board[i]+'.webp'}
button.setAttribute('aria-label',`Zeile ${Math.floor(i/MATCH_COLS)+1}, Spalte ${i%MATCH_COLS+1}: ${MATCH_NAMES[board[i]]} Gummibärchen`);
button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-disabled',String(game.busy||finished));
button.tabIndex=game.focus===i?0:-1;button.classList.toggle('match-selected',selected);button.classList.toggle('match-removing',game.removing.has(i));button.classList.toggle('match-hinted',game.hint.includes(i));
}
$('match-tip').hidden=finished;$('match-tip').setAttribute('aria-disabled',String(game.busy));
$('match-again').hidden=!game.earned;$('match-reward').hidden=!game.showReward;
}
function buildMatchGrid(game){
$('match-board').innerHTML='';
for(let row=0;row<MATCH_ROWS;row++){
const line=document.createElement('div');line.className='match-row';line.setAttribute('role','row');$('match-board').appendChild(line);
for(let col=0;col<MATCH_COLS;col++){
const index=row*MATCH_COLS+col,cell=document.createElement('div'),button=document.createElement('button'),img=document.createElement('img');
cell.setAttribute('role','gridcell');cell.className='match-cell';button.type='button';button.className='match-bear';button.id='match-bear-'+index;
img.alt='';img.draggable=false;button.appendChild(img);cell.appendChild(button);line.appendChild(cell);
game.buttons.push(button);game.images.push(img);
button.onclick=event=>{if(matchGame!==game)return;if(event&&event.detail&&Date.now()<game.suppressClickUntil)return;selectMatch(index)};
button.addEventListener('focus',()=>{if(matchGame===game){game.focus=index;for(let i=0;i<MATCH_SIZE;i++)game.buttons[i].tabIndex=i===index?0:-1}});
button.addEventListener('keydown',event=>matchKey(game,index,event));
button.addEventListener('pointerdown',event=>{if(matchGame!==game||game.busy||matchComplete(game.collected)||event.button>0)return;game.drag={index,id:event.pointerId,x:event.clientX,y:event.clientY};button.setPointerCapture(event.pointerId)});
button.addEventListener('pointermove',event=>{
const drag=game.drag;if(matchGame!==game||!drag||drag.id!==event.pointerId)return;
const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;
game.drag=null;game.swipeId=event.pointerId;game.suppressClickUntil=Date.now()+500;
const target=Math.abs(dx)>Math.abs(dy)?index+(dx>0?1:-1):index+(dy>0?MATCH_COLS:-MATCH_COLS);
if(matchAdjacent(index,target)){if(event.cancelable)event.preventDefault();tryMatchSwap(index,target)}
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{if(event&&game.swipeId===event.pointerId)game.suppressClickUntil=Date.now()+500;game.swipeId=null;game.drag=null});
}
}
}
function startMatch(progress,replay=false){
stopMatch();const stored=progress===realOpened?realMatchState:previewMatchState;
const earned=progress.has(10)||Boolean(stored&&stored.earned);
const collected=replay?{red:0,yellow:0}:stored?{...stored.collected}:earned?{...MATCH_GOALS}:{red:0,yellow:0};
matchGame={progress,board:replay||!stored?makeMatchBoard():stored.board.slice(),collected,earned:earned||matchComplete(collected),showReward:earned||matchComplete(collected),viewBoard:null,viewCounts:null,selected:null,focus:0,busy:false,removing:new Set(),hint:[],drag:null,suppressClickUntil:0,buttons:[],images:[],timers:new Set(),animations:new Set(),reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};
if(matchGame.earned&&!progress.has(10)){progress.add(10);save(progress)}
buildMatchGrid(matchGame);$('match-status').textContent='';renderMatch();
}
function selectMatch(index){
const game=matchGame;if(!game||game.busy||matchComplete(game.collected))return;
game.focus=index;game.hint=[];
$('match-play').scrollIntoView({block:'nearest'});
if(game.selected===null||!matchAdjacent(game.selected,index)){game.selected=game.selected===index?null:index;renderMatch();return}
tryMatchSwap(game.selected,index);
}
function matchKey(game,index,event){
if(matchGame!==game)return;
const row=Math.floor(index/MATCH_COLS),col=index%MATCH_COLS;
const positions={ArrowLeft:col>0?index-1:index,ArrowRight:col<MATCH_COLS-1?index+1:index,ArrowUp:row>0?index-MATCH_COLS:index,ArrowDown:row<MATCH_ROWS-1?index+MATCH_COLS:index,Home:row*MATCH_COLS,End:row*MATCH_COLS+MATCH_COLS-1};
if(event.key in positions){event.preventDefault();game.focus=positions[event.key];renderMatch();game.buttons[game.focus].focus()}
if(event.key==='Escape'){event.preventDefault();game.selected=null;renderMatch()}
}
function animateMatchSwap(game,a,b){
if(game.reduced)return;
const ar=game.buttons[a].getBoundingClientRect(),br=game.buttons[b].getBoundingClientRect();
for(const [index,dx,dy] of [[a,br.left-ar.left,br.top-ar.top],[b,ar.left-br.left,ar.top-br.top]])matchAnimate(game,game.images[index],[{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:150,easing:'ease-in-out'});
}
function finishMatchPlan(game,plan){
game.viewBoard=null;game.viewCounts=null;game.removing.clear();game.busy=false;
const complete=matchComplete(game.collected);if(complete)game.showReward=true;
$('match-status').textContent=complete?'Beide Sammelziele erreicht!':plan.reshuffled?'Neu gemischt – deine gesammelten Bärchen bleiben erhalten.':'Schön kombiniert!';
renderMatch();
if(complete){$('match-reward').focus({preventScroll:true});$('match-reward').scrollIntoView({block:'nearest'})}
}
function playMatchWave(game,plan,index,counts){
if(matchGame!==game)return;
if(index===plan.waves.length){finishMatchPlan(game,plan);return}
const wave=plan.waves[index];game.viewBoard=wave.before;game.viewCounts={...counts};game.removing=new Set(wave.matched);renderMatch();
matchLater(game,()=>{
game.viewBoard=wave.after;game.removing.clear();const nextCounts={red:Math.min(5,counts.red+wave.gained.red),yellow:Math.min(10,counts.yellow+wave.gained.yellow)};game.viewCounts=nextCounts;renderMatch();
for(let i=0;i<MATCH_SIZE;i++)if(wave.distances[i]){
const distance=wave.distances[i]*game.buttons[i].getBoundingClientRect().height;
matchAnimate(game,game.images[i],[{transform:`translateY(${-distance}px)`,opacity:.35},{transform:'translateY(0)',opacity:1}],{duration:200,easing:'ease-out'});
}
matchLater(game,()=>playMatchWave(game,plan,index+1,nextCounts),220);
},170);
}
function tryMatchSwap(a,b){
const game=matchGame;if(!game||game.busy||matchComplete(game.collected)||!matchAdjacent(a,b))return;
game.busy=true;game.selected=null;game.hint=[];game.drag=null;game.focus=b;$('match-status').textContent='';
const previous=game.board.slice();[game.board[a],game.board[b]]=[game.board[b],game.board[a]];renderMatch();animateMatchSwap(game,a,b);
$('match-play').scrollIntoView({block:'nearest'});
const resolve=()=>{
if(!findMatchLines(game.board).size){
game.board=previous;renderMatch();animateMatchSwap(game,a,b);
const release=()=>{game.busy=false;$('match-status').textContent='Noch keine Reihe. Versuch zwei andere Nachbarn!';renderMatch()};
if(game.reduced)release();else matchLater(game,release,160);return;
}
const counts={...game.collected},plan=planMatchCascades(game.board);
game.board=plan.board;game.collected={red:Math.min(5,counts.red+plan.gains.red),yellow:Math.min(10,counts.yellow+plan.gains.yellow)};
if(matchComplete(game.collected)){game.earned=true;game.progress.add(10);save(game.progress);grid()}
// Save a complete stable transaction before playing its visual cascade.
persistMatch(game);
if(game.reduced){finishMatchPlan(game,plan);return}
playMatchWave(game,plan,0,counts);
};
if(game.reduced)resolve();else matchLater(game,resolve,160);
}
function initMatch(){
$('match-tip').onclick=()=>{
const game=matchGame;if(!game||game.busy||matchComplete(game.collected))return;
const move=matchMoves(game.board)[0];if(!move)return;
game.hint=move;game.selected=null;$('match-status').textContent='Diese beiden Nachbarn könntest du tauschen.';renderMatch();
matchLater(game,()=>{game.hint=[];renderMatch()},1400);
};
$('match-again').onclick=()=>{
const game=matchGame;if(!game)return;
startMatch(game.progress,true);persistMatch(matchGame);$('card').scrollTop=0;matchGame.buttons[0].focus({preventScroll:true});
};
}
