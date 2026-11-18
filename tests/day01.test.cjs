const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');

test('day one is a hat transformation game, and reduced motion reveals immediately',async()=>{
const game=setup();game.run('openDay(1)');assert.equal(game.run('opened.has(1)'),false);
assert.equal(game.ids.card.dataset.kind,'game');assert.equal(game.ids['pirate-after'].hidden,true);
assert.equal(game.ids['pirate-result'].hidden,true);assert(game.requests.every(path=>path.startsWith('assets/day-01/')));
await game.run('transformPirate()');assert.equal(game.run('opened.has(1)'),true);assert.equal(game.ids['pirate-after'].hidden,false);assert.equal(game.ids['pirate-result'].hidden,false);assert.equal(game.run('pirateGame.animations.size'),0);
});

test('magic guards rapid taps, awards once under the cloud and restores after closing mid-animation',async()=>{
const game=setup({preview:false,reduced:false});game.run('startPirate(realOpened)');
const first=game.run('transformPirate()');await game.run('transformPirate()');await first;
assert.equal(game.run('pirateGame.busy'),true);assert.equal(game.run('realOpened.has(1)'),false);
const reveal=[...game.timers.values()].find(timer=>timer.delay===850).fn;const finish=[...game.timers.values()].find(timer=>timer.delay===1800).fn;reveal();assert.equal(game.run('realOpened.has(1)'),true);
game.run('stopPirate();startCookie(realOpened)');finish();assert.notEqual(game.document.activeElement,game.ids['pirate-result']);
const next=setup({preview:false,storage:new Map(game.storage)});next.run('openDay(1)');assert.equal(next.run('pirateGame.done'),true);assert.equal(next.ids['pirate-result'].hidden,false);
});

test('replay preserves the award, other days and existing older day-one saves',async()=>{
const game=setup({preview:false,storage:new Map([['adv26','[1,5]'],['adv26-day11','{"earned":true,"done":true}']])});game.run('openDay(1)');assert.equal(game.run('pirateGame.done'),true);game.ids['pirate-again'].onclick();assert.equal(game.run('pirateGame.done'),false);assert.equal(game.run('realOpened.has(1)&&realOpened.has(5)'),true);await game.run('transformPirate()');assert.equal(game.storage.get('adv26-day11'),'{"earned":true,"done":true}');
});

test('dragging off-target resets the hat and successful drop uses the same gate',async()=>{
const game=setup();game.run('openDay(1)');const hat=game.ids['pirate-hat'];
hat.listeners.pointerdown.fn({pointerId:2,clientX:100,clientY:400});hat.listeners.pointermove.fn({pointerId:2,clientX:500,clientY:500});hat.listeners.pointerup.fn({pointerId:2,clientX:500,clientY:500});assert.equal(game.run('pirateGame.busy'),false);assert.equal(hat.style.transform,'');
hat.listeners.pointerdown.fn({pointerId:3,clientX:100,clientY:400});hat.listeners.pointermove.fn({pointerId:3,clientX:160,clientY:160});hat.listeners.pointerup.fn({pointerId:3,clientX:160,clientY:160});await Promise.resolve();await Promise.resolve();assert.equal(game.run('pirateGame.done'),true);assert.equal(game.writes.length,0);
});

test('closing while assets load prevents a stale reveal; date rules and preview reset stay intact',async()=>{
const game=setup();game.run('openDay(1)');const pending=game.run('transformPirate()');game.run('closeOv();openDay(6)');await pending;assert.equal(game.run('opened.has(1)'),false);game.ids.rs.onclick();game.run('openDay(1)');assert.equal(game.run('pirateGame.done'),false);
const locked=setup({preview:false});locked.run('tap(1,document.createElement("button"))');assert.equal(locked.run('pirateGame'),null);
});
