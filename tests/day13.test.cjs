const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const code=game=>game.run('setLockerDigit(0,1,true);setLockerDigit(1,5,true);setLockerDigit(2,0,true)');

test('day thirteen loads its painted door and only the correct combination opens it',async()=>{
const game=setup();game.run('openDay(13)');assert.equal(game.run('opened.has(13)'),false);assert.equal(game.ids.ch.parent.attrs.id,'locker-task');assert.equal(game.ids.card.dataset.kind,'game');assert.deepEqual(game.requests,['assets/day-13/locker-door-flat-v2.webp']);assert.equal(game.ids['locker-interior'].getAttribute('aria-hidden'),'true');
await game.run('submitLocker()');assert.equal(game.run('lockerGame.done'),false);code(game);await game.run('submitLocker()');assert.equal(game.run('opened.has(13)'),true);assert.equal(game.ids['locker-interior'].getAttribute('aria-hidden'),'false');assert.equal(game.ids['locker-go'].hidden,true);assert.equal(game.ids['locker-again'].hidden,false);assert.equal(game.timers.size,0);assert.equal(game.run('lockerGame.animations.size'),0);assert.equal(game.run('sound'),false);
});

test('wheel arrows wrap and keyboard digits, arrows, Home and End all work',()=>{
const game=setup();game.run('openDay(13)');game.ids['locker-down-0'].onclick();assert.equal(game.run('lockerGame.digits[0]'),9);game.ids['locker-up-0'].onclick();assert.equal(game.run('lockerGame.digits[0]'),0);
const press=key=>game.ids['locker-digit-1'].listeners.keydown.fn({key,preventDefault(){}});press('7');assert.equal(game.run('lockerGame.digits[1]'),7);press('ArrowDown');assert.equal(game.run('lockerGame.digits[1]'),6);press('Home');assert.equal(game.run('lockerGame.digits[1]'),0);press('End');assert.equal(game.run('lockerGame.digits[1]'),9);assert.equal(game.ids['locker-digit-1'].getAttribute('aria-valuenow'),'9');
});

test('hints toggle, three wrong guesses reveal the hint and attempts are unlimited',async()=>{
const game=setup();game.run('openDay(13)');game.ids['locker-tip'].onclick();assert.equal(game.ids['locker-hint'].hidden,false);game.ids['locker-tip'].onclick();assert.equal(game.ids['locker-hint'].hidden,true);
for(let i=0;i<15;i++)await game.run('submitLocker()');assert.equal(game.run('lockerGame.tries'),15);assert.equal(game.ids['locker-hint'].hidden,false);assert.equal(game.run('lockerGame.done'),false);assert.equal(game.ids['locker-go'].disabled,false);code(game);await game.run('submitLocker()');assert.equal(game.run('lockerGame.done'),true);
});

test('partial wheels and hints persist, completed door restores and replay retains all awards',async()=>{
const first=setup({preview:false,storage:new Map([['adv26','[7]']])});first.run('openDay(13);setLockerDigit(1,5,true)');first.ids['locker-tip'].onclick();first.run('closeOv()');
const next=setup({preview:false,storage:new Map(first.storage)});next.run('openDay(13)');assert.equal(next.run('lockerGame.digits[1]'),5);assert.equal(next.ids['locker-hint'].hidden,false);code(next);await next.run('submitLocker()');
const restored=setup({preview:false,storage:new Map(next.storage)});restored.run('openDay(13)');assert.equal(restored.run('lockerGame.done'),true);restored.ids['locker-again'].onclick();assert.equal(restored.run('lockerGame.digits.join("")'),'000');assert.equal(restored.run('lockerGame.hint'),false);assert.equal(restored.run('opened.has(13)&&opened.has(7)'),true);
});

test('swipes require pointer capture, cancel cleanly and cannot change a won combination',async()=>{
const game=setup();game.run('openDay(13)');const digit=game.ids['locker-digit-0'];digit.listeners.pointermove.fn({pointerId:3,clientY:50});assert.equal(game.run('lockerGame.digits[0]'),0);digit.listeners.pointerdown.fn({pointerId:3,clientY:150});digit.listeners.pointermove.fn({pointerId:3,clientY:120});assert.equal(game.run('lockerGame.digits[0]'),1);digit.listeners.pointercancel.fn();digit.listeners.pointermove.fn({pointerId:3,clientY:80});assert.equal(game.run('lockerGame.digits[0]'),1);code(game);await game.run('submitLocker()');game.run('setLockerDigit(0,1)');assert.equal(game.run('lockerGame.digits.join("")'),'150');
});

test('closing during door animation cancels stale callbacks and does not lose the gift',async()=>{
const game=setup({preview:false,reduced:false});game.run('startLocker(realOpened)');code(game);await game.run('submitLocker()');assert.equal(game.run('lockerGame.busy'),true);const finish=[...game.timers.values()].find(timer=>timer.delay===1000).fn;game.run('stopLocker();startElixir(realOpened)');finish();assert.notEqual(game.document.activeElement,game.ids['locker-interior']);assert.equal(game.run('realOpened.has(13)'),true);
});

test('decode failure, stale loading, old saves, preview and calendar gates stay safe',async()=>{
const game=setup();game.run('openDay(13)');code(game);game.ids['locker-art'].decode=()=>Promise.reject(Error('offline'));await game.run('submitLocker()');assert.equal(game.run('lockerGame.busy'),false);assert.equal(game.run('opened.has(13)'),false);game.ids['locker-art'].decode=()=>Promise.resolve();const pending=game.run('submitLocker()');game.run('closeOv()');await pending;assert.equal(game.run('opened.has(13)'),false);assert.equal(game.writes.length,0);game.ids.rs.onclick();game.run('openDay(13)');assert.equal(game.run('lockerGame.digits.join("")'),'000');
const old=setup({preview:false,storage:new Map([['adv26','[13]']])});old.run('openDay(13)');assert.equal(old.run('lockerGame.done'),true);
const locked=setup({preview:false});locked.run('tap(13,document.createElement("button"))');assert.equal(locked.run('lockerGame'),null);
});
