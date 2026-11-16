const test=require('node:test');
const assert=require('node:assert/strict');
const {setup,html}=require('./helpers.cjs');
const clearMirror=game=>{for(let y=35;y<880&&!game.run('mirrorGame.done');y+=70)game.run(`wipeMirror(15,${y},625,${y})`)};

test('day 11 keeps the requested message hidden until wiping 60 percent',()=>{
const game=setup();game.run('openDay(11)');assert.deepEqual(game.requests,[]);
assert.equal(game.ids['mirror-message'].getAttribute('aria-hidden'),'true');assert.equal(game.run('opened.has(11)'),false);
assert.equal(game.ids['gift-default-actions'].hidden,true);
clearMirror(game);assert.equal(game.run('mirrorGame.done'),true);
assert(game.run('mirrorGame.seen.size/(MIRROR_COLS*MIRROR_ROWS)')>=.6);
assert.equal(game.run('opened.has(11)'),true);assert.equal(game.ids['mirror-message'].getAttribute('aria-hidden'),'false');
assert.equal(game.ids['mirror-skip'].hidden,true);assert.equal(game.ids['mirror-again'].hidden,false);
assert(html.includes('Man sieht es nicht,<br>aber man bemerkt es sofort.'));
assert(html.includes('Such dein Päckchen Nummer 11.'));
});

test('repeated wiping of the same spot cannot unlock the message',()=>{
const game=setup();game.run('openDay(11);wipeMirror(300,400,300,400)');const count=game.run('mirrorGame.seen.size');
for(let i=0;i<100;i++)game.run('wipeMirror(300,400,300,400)');
assert.equal(game.run('mirrorGame.seen.size'),count);assert.equal(game.run('mirrorGame.done'),false);
game.run('wipeMirror(NaN,0,Infinity,0)');assert.equal(game.run('mirrorGame.seen.size'),count);
});

test('partial stroke paths restore on reopen and work independently of viewport size',()=>{
const first=setup({preview:false});first.run('openDay(11);wipeMirror(20,220,620,220);wipeMirror(20,350,620,350);closeOv()');
const stored=JSON.parse(first.storage.get('adv26-day11'));assert.equal(stored.strokes.length,2);assert.equal(stored.done,false);
const second=setup({preview:false,storage:new Map(first.storage)});second.run('openDay(11)');
assert.equal(second.run('mirrorGame.strokes.length'),2);assert(second.run('mirrorGame.seen.size')>0);
assert.equal(second.run('mirrorGame.done'),false);clearMirror(second);assert.equal(second.run('mirrorGame.done'),true);
});

test('native reveal button supports reduced motion and replay keeps the received gift',()=>{
const storage=new Map([['adv26','[3]'],['adv26-day9','{"count":2}']]);const game=setup({preview:false,storage});game.run('openDay(11)');
game.ids['mirror-skip'].onclick();assert.equal(game.run('mirrorGame.done'),true);assert.equal(game.document.activeElement,game.ids['mirror-message']);
assert.equal(game.timers.size,0);assert.equal(game.run('mirrorGame.animations.size'),0);assert.equal(game.run('sound'),false);
game.ids['mirror-again'].onclick();assert.equal(game.run('mirrorGame.done'),false);assert.equal(game.run('mirrorGame.seen.size'),0);
assert.equal(game.run('opened.has(3)&&opened.has(11)'),true);assert.equal(storage.get('adv26-day9'),'{"count":2}');
game.run('closeOv();openDay(11)');assert.equal(game.run('mirrorGame.done'),false);
});

test('closing during the fade keeps the won gift and cancels the delayed focus',()=>{
const game=setup({reduced:false,preview:false});game.run('openDay(11)');game.ids['mirror-skip'].onclick();
assert.equal(game.run('opened.has(11)'),true);const callback=[...game.timers.values()].find(timer=>timer.delay===900).fn;
game.run('closeOv();openDay(6)');callback();assert.equal(game.run('mirrorGame'),null);assert.notEqual(game.document.activeElement,game.ids['mirror-message']);
const restored=setup({preview:false,storage:new Map(game.storage)});restored.run('openDay(11)');assert.equal(restored.run('mirrorGame.done'),true);assert.equal(restored.ids['mirror-message'].getAttribute('aria-hidden'),'false');
});

test('pointer events require an active gesture and preview never writes the real save',()=>{
const game=setup();game.run('openDay(11)');const fog=game.ids['mirror-fog'];
fog.listeners.pointermove.fn({pointerId:7,clientX:160,clientY:160});assert.equal(game.run('mirrorGame.seen.size'),0);
fog.listeners.pointerdown.fn({pointerId:7,clientX:160,clientY:160});assert(game.run('mirrorGame.seen.size')>0);
fog.listeners.pointermove.fn({pointerId:7,clientX:290,clientY:160});fog.listeners.pointerup.fn();assert.equal(game.run('mirrorGame.pointer'),null);
assert.equal(game.writes.length,0);game.run('closeOv()');game.ids.rs.onclick();game.run('openDay(11)');assert.equal(game.run('mirrorGame.strokes.length'),0);
const locked=setup({preview:false});locked.run('tap(11,document.createElement("button"))');assert.equal(locked.run('mirrorGame'),null);
});
