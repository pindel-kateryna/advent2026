const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const BOARD=['red','yellow','red','green','blue','green','red','blue','yellow','purple','yellow','blue','purple','red','green','blue','purple','green','yellow','red','purple','green','yellow','blue','yellow','red','yellow','blue','purple','green'];
const setBoard=game=>game.run('matchGame.board='+JSON.stringify(BOARD)+';renderMatch()');
const plain=(game,expression)=>JSON.parse(game.run('JSON.stringify('+expression+')'));

test('day 10 starts locked by date and loads only its own images when opened',()=>{
const locked=setup({preview:false});locked.run('tap(10,document.createElement("button"))');assert.equal(locked.run('matchGame'),null);assert.deepEqual(locked.requests,[]);
const game=setup();assert.deepEqual(game.requests,[]);game.run('openDay(10)');assert(game.requests.every(path=>path.startsWith('assets/day-10/')));
assert.equal(game.run('matchGame.buttons.length'),30);assert.equal(game.ids['gift-default-actions'].hidden,true);assert.equal(game.run('opened.has(10)'),false);
assert.equal(game.ids['match-goal-red'].textContent,'0 / 5');assert.equal(game.ids['match-goal-yellow'].textContent,'0 / 10');
});

test('generated boards have no free matches and always offer a move',()=>{
const game=setup();for(let i=0;i<100;i++){
game.run('globalBoard=makeMatchBoard()');assert.equal(game.run('globalBoard.length'),30);assert.equal(game.run('findMatchLines(globalBoard).size'),0);assert(game.run('matchMoves(globalBoard).length')>0);
}
assert.equal(game.run('matchAdjacent(4,5)'),false);assert.equal(game.run('matchAdjacent(0,5)'),true);assert.equal(game.run('matchAdjacent(0,29)'),false);
});

test('horizontal and vertical cross matches count their shared bear only once',()=>{
const game=setup();game.run('cross='+JSON.stringify(BOARD)+';cross[13]="blue";for(const i of [6,10,11,12,16])cross[i]="red"');
assert.deepEqual(plain(game,'[...findMatchLines(cross)].sort((a,b)=>a-b)'),[6,10,11,12,16]);
game.run('diagonal='+JSON.stringify(BOARD)+';diagonal[12]="red"');assert.equal(game.run('findMatchLines(diagonal).size'),0);
});

test('collapse keeps survivors in column order and cascades produce a stable playable board',()=>{
const game=setup();game.run('source='+JSON.stringify(BOARD)+';collapsed=collapseMatchBoard(source,new Set([5,10,15]))');
assert.equal(game.run('collapsed.board[15]'),'red');assert.equal(game.run('collapsed.distances[15]'),3);
assert.equal(game.run('collapsed.board[20]'),'purple');assert.equal(game.run('collapsed.board[25]'),'red');
for(let i=0;i<30;i++)if(i%5!==0)assert.equal(game.run('collapsed.board['+i+']'),BOARD[i]);
game.run('[source[1],source[6]]=[source[6],source[1]];plan=planMatchCascades(source)');
assert(game.run('plan.waves.length')>=1);assert.equal(game.run('findMatchLines(plan.board).size'),0);assert(game.run('matchMoves(plan.board).length')>0);
assert.equal(game.run('plan.gains.red'),game.run('plan.waves.reduce((sum,wave)=>sum+wave.matched.filter(i=>wave.before[i]==="red").length,0)'));
});

test('invalid and distant swaps do not add progress; valid swaps collect and cap targets',()=>{
const game=setup();game.run('openDay(10)');setBoard(game);game.run('tryMatchSwap(0,29)');assert.deepEqual(plain(game,'matchGame.board'),BOARD);
game.run('tryMatchSwap(0,1)');assert.equal(game.run('matchGame.busy'),false);assert.deepEqual(plain(game,'matchGame.board'),BOARD);assert.deepEqual(plain(game,'matchGame.collected'),{red:0,yellow:0});
game.run('matchGame.collected={red:4,yellow:10};tryMatchSwap(1,6)');
assert.deepEqual(plain(game,'matchGame.collected'),{red:5,yellow:10});assert.equal(game.run('opened.has(10)'),true);assert.equal(game.ids['match-reward'].hidden,false);
});

test('busy swaps are guarded and closing mid-cascade restores the complete saved transaction',()=>{
const game=setup({reduced:false,preview:false});game.run('openDay(10)');setBoard(game);game.run('matchGame.collected={red:4,yellow:10};tryMatchSwap(1,6)');
assert.equal(game.run('matchGame.busy'),true);const before=plain(game,'matchGame.board');game.run('tryMatchSwap(0,1)');assert.deepEqual(plain(game,'matchGame.board'),before);
const resolve=[...game.timers].find(([,timer])=>timer.delay===160)[0];game.fire(resolve);
const saved=JSON.parse(game.storage.get('adv26-day10'));assert.equal(saved.earned,true);assert.equal(game.ids['match-reward'].hidden,true);
game.run('closeOv()');assert.equal(game.timers.size,0);
const restored=setup({preview:false,storage:new Map(game.storage)});restored.run('openDay(10)');
assert.deepEqual(plain(restored,'matchGame.board'),saved.board);assert.deepEqual(plain(restored,'matchGame.collected'),{red:5,yellow:10});assert.equal(restored.ids['match-reward'].hidden,false);
});

test('keyboard selection, arrow focus and a swipe activate the same swap mechanic',()=>{
const game=setup();game.run('openDay(10)');setBoard(game);
const first=game.run('matchGame.buttons[1]');first.onclick({detail:0});assert.equal(game.run('matchGame.selected'),1);
let prevented=0;first.listeners.keydown.fn({key:'ArrowDown',preventDefault(){prevented++}});assert.equal(game.run('matchGame.focus'),6);assert.equal(prevented,1);
game.run('matchGame.buttons[6].onclick({detail:0})');assert(game.run('matchGame.collected.red')>=3);
const swipe=setup();swipe.run('openDay(10)');setBoard(swipe);const button=swipe.run('matchGame.buttons[1]');
button.listeners.pointerdown.fn({pointerId:7,button:0,clientX:50,clientY:50});button.listeners.pointermove.fn({pointerId:7,clientX:50,clientY:85,cancelable:true,preventDefault(){}});
assert(swipe.run('matchGame.collected.red')>=3);assert.equal(swipe.run('matchGame.drag'),null);
});

test('dead boards reshuffle without charges, hints reveal a legal move and preview stays isolated',()=>{
const game=setup();const dead=Array.from({length:30},(_,i)=>['red','yellow','green','blue','purple'][(Math.floor(i/5)*2+i%5)%5]);
game.run('dead='+JSON.stringify(dead));assert.equal(game.run('matchMoves(dead).length'),0);
game.run('repair=readMatchState({board:dead,collected:{red:2,yellow:7},earned:false})');assert.deepEqual(plain(game,'repair.collected'),{red:2,yellow:7});assert(game.run('matchMoves(repair.board).length')>0);
game.run('openDay(10)');game.ids['match-tip'].onclick();assert.equal(game.run('matchGame.hint.length'),2);assert.equal(game.writes.length,0);
game.run('closeOv()');game.ids.rs.onclick();game.run('openDay(10)');assert.deepEqual(plain(game,'matchGame.collected'),{red:0,yellow:0});
});

test('replay retains the gift, other games and the same storage keys',()=>{
const other='{"found":["upper"],"earned":false}';const storage=new Map([['adv26','[3,10]'],['adv26-day8',other]]);
const game=setup({preview:false,storage});game.run('openDay(10)');assert.equal(game.ids['match-reward'].hidden,false);
game.ids['match-again'].onclick();assert.deepEqual(plain(game,'matchGame.collected'),{red:0,yellow:0});assert.equal(game.run('opened.has(3)&&opened.has(10)'),true);assert.equal(game.ids['match-reward'].hidden,false);assert.equal(storage.get('adv26-day8'),other);
const restored=setup({preview:false,storage:new Map(storage)});restored.run('openDay(10)');assert.deepEqual(plain(restored,'matchGame.collected'),{red:0,yellow:0});assert.equal(restored.run('matchGame.earned'),true);
});
