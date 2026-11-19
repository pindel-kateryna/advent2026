const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const orders=[['moon','star','spark'],['moon','spark','star'],['star','moon','spark'],['star','spark','moon'],['spark','moon','star'],['spark','star','moon']];

test('all six ingredient orders fill the flask and reveal parcel 04',async()=>{
for(const order of orders){const game=setup();game.run('openDay(4)');assert.equal(game.ids.card.dataset.kind,'game');assert(game.requests.every(path=>path==='assets/day-04/elixir-flask.webp'));assert.equal(game.run('opened.has(4)'),false);
for(let i=0;i<3;i++){await game.run(`addElixir('${order[i]}')`);assert.equal(game.run('elixirGame.added.size'),i+1);assert.equal(game.run('opened.has(4)'),i===2)}
assert.equal(game.ids['elixir-liquid'].getAttribute('y'),'31');assert.equal(game.ids['elixir-result'].hidden,false);assert.equal(game.ids['elixir-again'].hidden,false);assert.equal(game.timers.size,0);assert.equal(game.run('elixirGame.animations.size'),0);assert.equal(game.run('sound'),false);
}});

test('animation locks double clicks, used ingredients do not count again, finale waits for filling',async()=>{
const game=setup({reduced:false});game.run('startElixir(opened)');const first=game.run("addElixir('spark')");await game.run("addElixir('moon')");await first;assert.equal(game.run('elixirGame.added.size'),1);assert.equal(game.ids['elixir-ingredient-0'].disabled,true);
const settle=()=>{const entry=[...game.timers].find(([,value])=>value.delay===600);game.fire(entry[0])};settle();await game.run("addElixir('spark')");assert.equal(game.run('elixirGame.added.size'),1);await game.run("addElixir('star')");settle();await game.run("addElixir('moon')");assert.equal(game.run('opened.has(4)'),false);assert.equal(game.ids['elixir-again'].hidden,true);
const entry=[...game.timers].find(([,value])=>value.delay===950);game.fire(entry[0]);assert.equal(game.run('opened.has(4)'),true);assert.equal(game.run('elixirGame.done'),true);
});

test('partial ingredients restore, malformed duplicate IDs are sanitized, replay keeps gifts',async()=>{
const first=setup({preview:false,storage:new Map([['adv26','[7]'],['adv26-day4','{"added":["star","star","oops"],"earned":false}']])});first.run('openDay(4)');assert.equal(first.run('elixirGame.added.size'),1);await first.run("addElixir('spark')");first.run('closeOv()');
const next=setup({preview:false,storage:new Map(first.storage)});next.run('openDay(4)');assert.equal(next.run('elixirGame.added.size'),2);await next.run("addElixir('moon')");next.ids['elixir-again'].onclick();assert.equal(next.run('elixirGame.added.size'),0);assert.equal(next.run('realOpened.has(4)&&realOpened.has(7)'),true);
});

test('closing during the finale cancels stale callbacks and restores a full flask',async()=>{
const storage=new Map([['adv26-day4','{"added":["moon","spark"],"earned":false}']]);const game=setup({preview:false,reduced:false,storage});game.run('startElixir(realOpened)');await game.run("addElixir('star')");const finish=[...game.timers.values()].find(timer=>timer.delay===1800).fn;game.run('stopElixir();startMirror(realOpened)');finish();assert.notEqual(game.document.activeElement,game.ids['elixir-result']);
const next=setup({preview:false,storage:new Map(storage)});next.run('openDay(4)');assert.equal(next.run('elixirGame.done'),true);assert.equal(next.run('realOpened.has(4)'),true);
});

test('decode failures do not consume ingredients and closing while loading cannot award',async()=>{
const game=setup();game.run('openDay(4)');game.ids['elixir-flask'].decode=()=>Promise.reject(Error('offline'));await game.run("addElixir('moon')");assert.equal(game.run('elixirGame.added.size'),0);assert.equal(game.run('elixirGame.busy'),false);
let resolve;game.ids['elixir-flask'].decode=()=>new Promise(done=>resolve=done);const pending=game.run("addElixir('moon')");game.run('closeOv()');resolve();await pending;assert.equal(game.run('opened.has(4)'),false);
});

test('old shaker awards remain earned; preview, reset and dates stay isolated',async()=>{
const old=setup({preview:false,storage:new Map([['adv26','[4]']])});old.run('openDay(4)');assert.equal(old.run('elixirGame.done'),true);
const preview=setup();preview.run('openDay(4)');for(const id of orders[0])await preview.run(`addElixir('${id}')`);assert.equal(preview.writes.length,0);preview.run('closeOv()');preview.ids.rs.onclick();preview.run('openDay(4)');assert.equal(preview.run('elixirGame.added.size'),0);
const locked=setup({preview:false});locked.run('tap(4,document.createElement("button"))');assert.equal(locked.run('elixirGame'),null);
});
