const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');

test('three taps crack the day-five illustration and unlock only day twelve',()=>{
const game=setup();game.run('openDay(12)');
assert.equal(game.ids.card.dataset.kind,'game');assert.equal(game.ids.ch.parent.attrs.id,'cookie-task');
assert(game.requests.every(path=>path==='assets/day-05/ingredient-biscuits-illustrated.png'));
assert.equal(game.ids['gift-default-actions'].hidden,true);
for(let count=1;count<=3;count++){game.ids['cookie-tap'].onclick();assert.equal(game.run('cookieGame.count'),count);assert.equal(game.run('opened.has(12)'),count===3)}
assert.equal(game.ids['cookie-message'].getAttribute('aria-hidden'),'false');assert.equal(game.ids['cookie-tap'].disabled,true);
for(let i=0;i<10;i++)game.ids['cookie-tap'].onclick();assert.equal(game.run('cookieGame.count'),3);
assert.equal(game.run('sound'),false);assert.equal(game.run('cookieGame.animations.size'),0);
});

test('partial taps persist across reload; replay keeps earned gifts and other games',()=>{
const first=setup({preview:false,storage:new Map([['adv26','[5]'],['adv26-day11','{"done":true,"earned":true}']])});first.run('openDay(12);tapCookie();tapCookie();closeOv()');
assert.equal(JSON.parse(first.storage.get('adv26-day12')).count,2);
const next=setup({preview:false,storage:new Map(first.storage)});next.run('openDay(12)');assert.equal(next.run('cookieGame.count'),2);next.run('tapCookie()');next.ids['cookie-again'].onclick();assert.equal(next.run('cookieGame.count'),0);assert.equal(next.run('opened.has(12)&&opened.has(5)'),true);
assert.equal(next.storage.get('adv26-day11'),first.storage.get('adv26-day11'));
const final=setup({preview:false,storage:new Map(next.storage)});final.run('openDay(12)');assert.equal(final.run('cookieGame.earned'),true);assert.equal(final.run('cookieGame.count'),0);
});

test('closing during the break keeps completion and cancels stale focus callbacks',()=>{
const game=setup({preview:false,reduced:false});game.run('startCookie(realOpened);tapCookie();tapCookie();tapCookie()');
assert.equal(game.run('cookieGame.busy'),true);const finish=[...game.timers.values()].find(timer=>timer.delay===900).fn;
game.run('stopCookie();startMirror(realOpened)');finish();assert.notEqual(game.document.activeElement,game.ids['cookie-message']);
const next=setup({preview:false,storage:new Map(game.storage)});next.run('openDay(12)');assert.equal(next.run('cookieGame.count'),3);assert.equal(next.ids['cookie-again'].hidden,false);
});

test('preview is isolated, reset clears trial taps and locked dates stay locked',()=>{
const game=setup();game.run('openDay(12);tapCookie();tapCookie();tapCookie()');assert.equal(game.writes.length,0);game.run('closeOv()');game.ids.rs.onclick();game.run('openDay(12)');assert.equal(game.run('cookieGame.count'),0);
const locked=setup({preview:false});locked.run('tap(12,document.createElement("button"))');assert.equal(locked.run('cookieGame'),null);
});
