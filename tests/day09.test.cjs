const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const tapOne=game=>game.run('if(!energyGame.drops.some(drop=>!drop.caught))spawnEnergy(energyGame);grabEnergyDrop(energyGame,energyGame.drops.find(drop=>!drop.caught));stepEnergy(energyGame,.32)');
const reveal=game=>{for(const [id,timer] of [...game.timers])if(timer.delay===700)game.fire(id)};

test('day 9 loads existing room plus four poses lazily, and needs five tapped batteries',()=>{
const game=setup({reduced:false});assert.deepEqual(game.requests,[]);game.run('openDay(9)');
assert(game.requests.every(path=>path.startsWith('assets/day-09/')||path==='assets/day-07/room-light-on.webp'));
assert(game.requests.includes('assets/day-09/andre-cheer.webp'));
assert.equal(game.ids['gift-default-actions'].hidden,true);
for(const id of game.run('openingTimers.slice()'))game.fire(id);
assert.equal(game.run('opened.has(9)'),false);assert.equal(game.frames.size,0);
game.ids['energy-start'].onclick();
for(let i=1;i<=5;i++){
tapOne(game);assert.equal(game.run('energyGame.count'),i);assert.equal(game.run('opened.has(9)'),i===5);
assert.equal(game.ids['energy-player'].dataset.mood,i<2?'sleepy':i<4?'awake':i<5?'happy':'cheer');
}
assert.equal(game.ids['energy-reward'].hidden,true);reveal(game);
assert.equal(game.ids['energy-reward'].hidden,false);assert.equal(game.frames.size,0);
assert.equal(game.ids['energy-meter'].getAttribute('aria-valuenow'),'5');
assert.equal(game.ids['energy-status'].textContent,'');
assert.equal(game.document.activeElement,game.ids['energy-reward']);
});

test('tapping reserves a battery once and flies it to Andre over 320ms before counting',()=>{
const game=setup({reduced:false});game.run('openDay(9);toggleEnergy();spawnEnergy(energyGame);energyGame.drops[0].x=20;energyGame.drops[0].y=10');
const drop=game.run('energyGame.drops[0]');drop.el.onpointerdown({button:0,preventDefault(){}});drop.el.onclick();
assert.equal(game.run('energyGame.count'),0);assert.equal(drop.caught,true);assert.equal(drop.el.disabled,true);
game.run('stepEnergy(energyGame,.16)');assert.equal(drop.x,27.5);assert.equal(drop.y,25.75);assert.equal(game.run('energyGame.count'),0);
game.run('stepEnergy(energyGame,.16)');assert.equal(game.run('energyGame.count'),1);
drop.el.onclick();assert.equal(game.run('energyGame.count'),1);
game.run('for(let i=0;i<10;i++)spawnEnergy(energyGame)');
assert.equal(game.run('energyGame.drops.filter(drop=>!drop.caught).length'),2);
});

test('misses have no penalty; pause freezes flight and closing cancels frames and effects',()=>{
const game=setup({reduced:false});game.run('openDay(9);toggleEnergy();spawnEnergy(energyGame);energyGame.drops[0].y=114;stepEnergy(energyGame,1)');
assert.equal(game.run('energyGame.count'),0);
game.run('spawnEnergy(energyGame);grabEnergyDrop(energyGame,energyGame.drops[0]);pauseEnergy()');
const y=game.run('energyGame.drops[0].y');game.run('stepEnergy(energyGame,5)');assert.equal(game.run('energyGame.drops[0].y'),y);
assert.equal(game.frames.size,0);game.run('toggleEnergy()');const stale=[...game.frames.values()][0];
game.run('closeOv()');assert.equal(game.frames.size,0);assert.equal(game.timers.size,0);stale(10000);
assert.equal(game.run('energyGame'),null);assert.equal(game.ids['energy-drops'].children.length,0);
});

test('partial charge restores and replay retains the gift and other days',()=>{
const first=setup({reduced:false,preview:false});first.run('openDay(9);toggleEnergy()');for(let i=0;i<2;i++)tapOne(first);
const stored=JSON.parse(first.storage.get('adv26-day9'));assert.equal(stored.count,2);assert.equal(stored.version,2);
const second=setup({reduced:false,preview:false,storage:new Map(first.storage)});second.run('openDay(9)');
assert.equal(second.run('energyGame.count'),2);assert.equal(second.run('energyGame.running'),false);second.run('toggleEnergy()');
for(let i=0;i<3;i++)tapOne(second);reveal(second);second.run('opened.add(3);save()');const other=second.storage.get('adv26');
second.ids['energy-again'].onclick();assert.equal(second.run('energyGame.count'),0);assert.equal(second.run('opened.has(3)&&opened.has(9)'),true);
assert.equal(second.ids['energy-reward'].hidden,false);assert.equal(second.storage.get('adv26'),other);
const third=setup({preview:false,storage:new Map(second.storage)});third.run('openDay(9)');assert.equal(third.run('energyGame.count'),0);assert.equal(third.run('energyGame.earned'),true);
});

test('calm mode is stationary and supports native button collection without frames or sound',()=>{
const game=setup();game.run('openDay(9);toggleEnergy()');assert.equal(game.run('energyGame.calm'),true);assert.equal(game.frames.size,0);
for(let i=0;i<5;i++){const drop=game.run('energyGame.drops[0]');assert.equal(drop.y,33);drop.el.onclick()}
assert.equal(game.run('energyGame.count'),5);assert.equal(game.run('sound'),false);assert.equal(game.ids['energy-reward'].hidden,false);
assert.equal(game.run('energyGame.animations.size'),0);assert.equal(game.run('energyGame.drops.length'),0);
});

test('legacy saves migrate proportionally; preview, invalid data and normal date gates stay isolated',()=>{
const legacy=setup({preview:false,storage:new Map([['adv26-day9','{"count":4,"earned":false}']])});legacy.run('openDay(9)');assert.equal(legacy.run('energyGame.count'),2);
const corrupt=setup({preview:false,storage:new Map([['adv26-day9','{"version":2,"count":999,"earned":false}']])});corrupt.run('openDay(9)');assert.equal(corrupt.run('energyGame.count'),0);assert.equal(corrupt.run('opened.has(9)'),false);
const preview=setup();preview.run('openDay(9);toggleEnergy();energyGame.drops[0].el.onclick()');assert.equal(preview.writes.length,0);
preview.run('closeOv()');preview.ids.rs.onclick();preview.run('openDay(9)');assert.equal(preview.run('energyGame.count'),0);
const locked=setup({preview:false});locked.run('tap(9,document.createElement("button"))');assert.equal(locked.run('energyGame'),null);
});

test('two simultaneous catches cannot overfill the last slot; hidden tabs pause',()=>{
const game=setup({reduced:false});game.run('openDay(9);toggleEnergy();energyGame.count=4;spawnEnergy(energyGame);spawnEnergy(energyGame)');
const drops=game.run('energyGame.drops.slice()');drops[0].el.onclick();drops[1].el.onclick();
assert.equal(drops[0].caught,true);assert.equal(drops[1].caught,false);
game.run('stepEnergy(energyGame,.32)');assert.equal(game.run('energyGame.count'),5);
game.run('closeOv();opened.delete(9);previewEnergyState=null;openDay(9);toggleEnergy()');
game.document.hidden=true;game.document.listeners.visibilitychange();assert.equal(game.run('energyGame.running'),false);assert.equal(game.frames.size,0);
game.ids['energy-calm'].onclick();assert.equal(game.run('energyGame.calm'),true);assert.equal(game.run('energyGame.running'),true);
});

test('closing during the final celebration preserves the won gift and cancels delayed reveal',()=>{
const game=setup({reduced:false,preview:false});game.run('openDay(9);toggleEnergy()');
for(let i=0;i<5;i++)tapOne(game);
assert.equal(game.ids['energy-reward'].hidden,true);assert.equal(game.run('opened.has(9)'),true);
game.run('closeOv()');assert.equal(game.timers.size,0);assert.equal(game.frames.size,0);
const restored=setup({preview:false,storage:new Map(game.storage)});restored.run('openDay(9)');
assert.equal(restored.run('energyGame.count'),5);assert.equal(restored.ids['energy-reward'].hidden,false);
});
