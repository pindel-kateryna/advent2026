const test=require('node:test');
const assert=require('node:assert/strict');
const {setup,html}=require('./helpers.cjs');
const grab=(game,kind)=>{let item=game.run(`snackGame.items.find(item=>item.kind==='${kind}')`);if(!item){game.run('snackGame.items.slice().forEach(item=>removeSnackItem(snackGame,item))');item=game.run(`spawnSnack(snackGame,'${kind}')`)}item.el.onclick();return item};

test('day fourteen keeps the gift secret, uses illustrated items and awards only two full meters',async()=>{
const game=setup();game.run('openDay(14)');assert.equal(game.run('opened.has(14)'),false);assert.equal(game.ids.card.dataset.kind,'game');assert.equal(game.ids['snack-happy'].hidden,true);assert.equal(game.ids['snack-reward'].hidden,true);
assert(game.requests.includes('assets/day-14/andre-thoughtful.png'));assert(!game.requests.some(path=>/wrapper|waffle|protein/i.test(path)));
await game.run('beginSnack()');for(let i=0;i<5;i++)grab(game,'crunch');assert.equal(game.run('snackGame.crunch'),5);assert.equal(game.run('snackGame.done'),false);for(let i=0;i<5;i++)grab(game,'schoko');assert.equal(game.run('snackGame.done'),true);assert.equal(game.run('opened.has(14)'),true);assert.equal(game.run('snackGame.items.length'),0);assert.equal(game.ids['snack-happy'].hidden,false);assert.equal(game.ids['snack-reward'].hidden,false);assert.equal(game.frames.size,0);assert.equal(game.timers.size,0);assert.equal(game.run('snackGame.animations.size'),0);
assert(html.includes('Ein bisschen Crunch, ein bisschen Schoko — ganz viel Honey-Power!'));assert(html.includes('Jetzt darfst du Päckchen Nr. 14 öffnen. 🤎'));
});

test('normal paced perfect round lasts about 30–45 seconds, targets stay still and at most three appear',async()=>{
const game=setup({reduced:false});game.run('openDay(14)');await game.run('beginSnack()');let elapsed=0;const due=new Map();
for(let step=0;step<100&&!game.run('snackGame.done');step++){
const items=game.run('snackGame.items.slice()');assert(items.length<=3);for(const item of items)if(item.kind!=='hantel')item.el.onclick();
if(game.run('snackGame.done'))break;
for(const id of [...due.keys()])if(!game.timers.has(id))due.delete(id);
for(const [id,timer] of game.timers)if(!due.has(id))due.set(id,elapsed+timer.delay);
const [id,time]=[...due].sort((a,b)=>a[1]-b[1])[0];elapsed=time;due.delete(id);game.fire(id);
}
assert.equal(game.run('snackGame.done'),true);assert(elapsed>=30000&&elapsed<=45000,elapsed);assert.equal(game.frames.size,0);
});

test('dumbbells remove only one existing point, never go below zero and full meters remain capped',async()=>{
const game=setup();game.run('openDay(14)');await game.run('beginSnack()');grab(game,'hantel');assert.equal(game.run('snackGame.crunch+snackGame.schoko'),0);
for(let i=0;i<5;i++)grab(game,'crunch');const old=game.run("snackGame.items.find(item=>item.kind==='crunch')");if(old){old.el.onclick();assert.equal(game.run('snackGame.crunch'),5)}
grab(game,'hantel');assert.equal(game.run('snackGame.crunch'),4);assert.equal(game.run('snackGame.schoko'),0);const before=game.run('snackGame.crunch');const repeated=grab(game,'crunch');repeated.el.onclick();assert.equal(game.run('snackGame.crunch'),Math.min(5,before+1));
});

test('calm mode cannot fill the field with decoys and positions are unique',async()=>{
const game=setup();game.run('openDay(14)');await game.run('beginSnack()');
for(let i=0;i<20&&!game.run('snackGame.done');i++){
const items=game.run('snackGame.items.slice()');assert(items.length<=3);assert.equal(new Set(items.map(item=>item.slot)).size,items.length);assert(items.filter(item=>item.kind==='hantel').length<=1);const target=items.find(item=>item.kind!=='hantel');assert(target);target.el.onclick();
}
assert.equal(game.run('snackGame.done'),true);
});

test('partial progress restores and replay keeps obtained gifts and other days',async()=>{
const first=setup({preview:false,storage:new Map([['adv26','[4]'],['adv26-day13','{"done":true,"earned":true}']])});first.run('openDay(14)');await first.run('beginSnack()');grab(first,'crunch');grab(first,'schoko');first.run('closeOv()');
const next=setup({preview:false,storage:new Map(first.storage)});next.run('openDay(14)');assert.equal(next.run('snackGame.crunch'),1);assert.equal(next.run('snackGame.schoko'),1);await next.run('beginSnack()');for(let i=0;i<4;i++){grab(next,'crunch');grab(next,'schoko')}assert.equal(next.run('opened.has(14)'),true);next.ids['snack-again'].onclick();assert.equal(next.run('snackGame.crunch+snackGame.schoko'),0);assert.equal(next.run('opened.has(14)&&opened.has(4)'),true);assert.equal(next.storage.get('adv26-day13'),first.storage.get('adv26-day13'));
});

test('closing and visibility pause cancel timers and stale item handlers; focused targets wait',async()=>{
const game=setup({reduced:false});game.run('startSnack(opened)');await game.run('beginSnack()');const item=game.run('snackGame.items[0]');item.el.focus();game.run('expireSnackItem(snackGame,snackGame.items[0])');assert.equal(game.run('snackGame.items.length'),1);
game.document.hidden=true;game.document.listeners.visibilitychange();assert.equal(game.run('snackGame.running'),false);assert.equal(game.timers.size,0);item.el.onclick();assert.equal(game.run('snackGame.crunch'),0);await game.run('beginSnack()');const stale=[...game.timers.values()][0].fn;game.run('closeOv();openDay(6)');stale();assert.equal(game.run('snackGame'),null);
});

test('assets must decode before play, repeated starts are guarded and preview reset is isolated',async()=>{
const game=setup();game.run('openDay(14)');game.ids['snack-thoughtful'].decode=()=>Promise.reject(Error('offline'));await game.run('beginSnack()');assert.equal(game.run('snackGame.running'),false);assert.equal(game.run('snackGame.loading'),false);delete game.ids['snack-thoughtful'].decode;
const start=game.run('beginSnack()');await game.run('beginSnack()');await start;assert.equal(game.run('snackGame.items.length'),3);grab(game,'crunch');assert.equal(game.writes.length,0);game.run('closeOv()');game.ids.rs.onclick();game.run('openDay(14)');assert.equal(game.run('snackGame.crunch'),0);
const locked=setup({preview:false});locked.run('tap(14,document.createElement("button"))');assert.equal(locked.run('snackGame'),null);
const old=setup({preview:false,storage:new Map([['adv26','[14]']])});old.run('openDay(14)');assert.equal(old.run('snackGame.done'),true);
});
