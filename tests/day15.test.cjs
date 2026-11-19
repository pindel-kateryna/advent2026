const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const finish=game=>{for(let i=0;i<12;i++)game.run(`connectTail(${i})`)};
test('ordered dots ignore errors and duplicates, award only on the last point',()=>{
const game=setup();game.run('openDay(15)');assert.equal(game.document.getElementById('tail-point-0').disabled,false);game.run('connectTail(4)');assert.equal(game.run('tailGame.count'),0);
for(let i=0;i<11;i++){game.run(`connectTail(${i});connectTail(${i})`);assert.equal(game.run('tailGame.count'),i+1);assert(!game.run('opened.has(15)'))}
assert.equal(game.ids['tail-reward'].hidden,true);game.run('connectTail(11)');assert(game.run('opened.has(15)'));assert.equal(game.ids['tail-reward'].hidden,false);assert.equal(game.ids['tail-line'].style.strokeDashoffset,'0');assert.equal(game.run('tailGame.animations.size'),0);
});
test('partial and finished states persist and replay retains gifts and other progress',()=>{
const game=setup({preview:false,storage:new Map([['adv26','[7]']])});game.run('openDay(15)');game.run('connectTail(0);connectTail(1);closeOv()');
const next=setup({preview:false,storage:new Map(game.storage)});next.run('openDay(15)');assert.equal(next.run('tailGame.count'),2);for(let i=2;i<12;i++)next.run(`connectTail(${i})`);next.run('closeOv();openDay(15)');assert.equal(next.run('tailGame.count'),12);
next.ids['tail-again'].onclick();assert.equal(next.run('tailGame.count'),0);assert(next.run('opened.has(15)&&opened.has(7)'));assert.equal(next.ids['tail-reward'].hidden,true);finish(next);assert.equal(next.run('tailGame.count'),12);
});
test('closing during finale cancels timers and preview stays separate from real storage',()=>{
const game=setup({reduced:false});game.run('startTail(opened)');finish(game);const callback=[...game.timers.values()][0].fn;game.run('closeOv();openDay(6)');callback();assert.equal(game.run('tailGame'),null);assert.equal(game.writes.length,0);game.run('closeOv()');game.ids.rs.onclick();game.run('openDay(15)');assert.equal(game.run('tailGame.count'),0);
const locked=setup({preview:false});locked.run('tap(15,document.createElement("button"))');assert.equal(locked.run('tailGame'),null);
});
test('twelve targets fit without intersecting at the narrowest supported field',()=>{
const game=setup(),points=game.run('TAIL_POINTS');assert.equal(points.length,12);
const scale=236/260;for(let i=0;i<points.length;i++){const [x,y]=points[i];assert(x*scale>=22&&(260-x)*scale>=22&&y*scale>=22&&(460-y)*scale>=22);for(let j=0;j<i;j++){assert(Math.abs(x-points[j][0])*scale>=44||Math.abs(y-points[j][1])*scale>=44,`${i},${j}`)}}
});
