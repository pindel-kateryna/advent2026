const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./helpers.cjs');

test('all 24 gifts use the same first-opening sequence without awarding unfinished games', () => {
  for (let day = 1; day <= 24; day++) {
    const game = setup({ reduced: false }); game.run(`openDay(${day})`);
    assert(game.ids.ov.classList.contains('gift-opening'), `day ${day}`);
    assert(game.ids.stage.classList.contains('wob'));
    assert(!game.ids.card.classList.contains('on'));
    const timers = game.run('openingTimers.slice()');
    assert.equal(game.timers.get(timers[0]).delay, 650);
    assert.equal(game.timers.get(timers[1]).delay, 1300);
    game.fire(timers[0]);
    assert(game.ids.stage.classList.contains('pop'));
    assert(!game.ids.card.classList.contains('on'));
    game.fire(timers[1]);
    assert(game.run('openingFlight !== null'));
    assert(game.ids.card.classList.contains('on'));
    assert(!game.ids.ov.classList.contains('gift-opening'));
    assert.equal(game.run(`opened.has(${day})`), ![2,3,4,5,7,8,9,10,11,12].includes(day));
    game.run(`opened.add(${day});closeOv();openDay(${day})`);
    assert(!game.ids.ov.classList.contains('gift-opening'));
    assert(game.ids.card.classList.contains('on'));
  }
});

test('reduced motion skips the shared opening and closing invalidates stale callbacks', () => {
  for (let day = 1; day <= 24; day++) {
    const game = setup(); game.run(`openDay(${day})`);
    assert(!game.ids.ov.classList.contains('gift-opening'));
    assert.equal(game.run('openingTimers.length'), 0);
    assert.equal(game.run('openingFlight'), null);
    assert(game.ids.card.classList.contains('on'));
    assert.equal(game.run(`opened.has(${day})`), ![2,3,4,5,7,8,9,10,11,12].includes(day));
  }
  const game = setup({ reduced: false }); game.run('openDay(4)');
  const stale = game.run('openingTimers.slice()').map(id => game.timers.get(id).fn);
  game.run('closeOv();openDay(8)');
  stale.forEach(callback => callback());
  assert(game.ids.ov.classList.contains('gift-opening'));
  assert(!game.ids.card.classList.contains('on'));
  assert(!game.ids.stage.classList.contains('pop'));
  assert.equal(game.run('opened.has(4)||opened.has(8)'), false);
});

test('calendar starts without loading any gift images and loads only the selected day', () => {
  const game = setup();
  assert.deepEqual(game.requests, []);
  game.run('openDay(1)');
  assert(game.requests.every(x => x.startsWith('assets/day-01/')));
  const firstCount = game.requests.length;
  game.run('closeOv();openDay(1)');
  assert.equal(game.requests.length, firstCount);
  game.run('closeOv();openDay(7)');
  assert(game.requests.slice(firstCount).every(x => x.startsWith('assets/day-07/')));
  assert(game.requests.includes('assets/day-07/couple-holding-v2.png'));
});

test('real dates still block future gifts and preview progress stays separate', () => {
  const game = setup({ preview: false });
  game.run('tap(7,document.createElement("button"))');
  assert.equal(game.run('movieGame'), null);
  assert.deepEqual(game.requests, []);
  game.ids.preview.onclick();
  game.ids['preview-code'].value = '6652';
  game.ids['preview-access'].onsubmit({ preventDefault() {} });
  game.run('openDay(1)');
  assert.equal(game.run('previewOpened.has(1)'), true);
  assert.equal(game.run('realOpened.has(1)'), false);
  assert.equal(game.writes.length, 0);
});

test('preview requires the code, ignores the old URL flag and locks again on exit or reload', () => {
  const game = setup({ preview: false });
  game.run('location.search="?vorschau"');
  assert.equal(game.run('preview'), false);
  game.ids.preview.onclick();
  assert.equal(game.ids['preview-access'].hidden, false);
  game.ids['preview-code'].value = '1234';
  game.ids['preview-access'].onsubmit({ preventDefault() {} });
  assert.equal(game.run('preview'), false);
  assert(game.ids['preview-error'].textContent.length > 0);
  game.ids['preview-code'].value = '6652';
  game.ids['preview-access'].onsubmit({ preventDefault() {} });
  assert.equal(game.run('preview'), true);
  assert.equal(game.ids['preview-access'].hidden, true);
  assert.equal(game.ids['preview-code'].value, '');
  game.ids.preview.onclick();
  assert.equal(game.run('preview'), false);
  assert.equal(setup({ preview: false, storage: game.storage }).run('preview'), false);
  assert.equal(game.writes.length, 0);
});

test('all four memory pairs are required to reveal day 2', () => {
  const game = setup(); game.run('openDay(2)');
  const deck = game.run('[...memoryGame.deck]');
  assert.equal(deck.length, 8);
  const other = deck.findIndex(x => x !== deck[0]);
  game.run(`flipMemory(memoryGame,0);flipMemory(memoryGame,0);flipMemory(memoryGame,${other})`);
  assert.equal(game.run('memoryGame.busy'), true);
  game.fire(game.run('memoryGame.timer'));
  assert.equal(game.ids.wh.classList.contains('on'), false);
  for (let symbol = 0; symbol < 4; symbol++) {
    const pair = deck.map((x, i) => x === symbol ? i : -1).filter(i => i >= 0);
    game.run(`flipMemory(memoryGame,${pair[0]});flipMemory(memoryGame,${pair[1]})`);
  }
  assert.equal(game.ids.wh.classList.contains('on'), true);
  assert.equal(game.run('previewOpened.has(2)'), true);
});

test('bear and shaker guard repeat clicks, complete once, and replay', () => {
  for (const [day, name, play, replay, state] of [[3, 'bear', 'bear-scene', 'bear-replay', 'bearGame'], [4, 'shaker', 'shaker-start', 'shaker-again', 'shakerGame']]) {
    const game = setup({ reduced: false }); game.run(`openDay(${day})`);
    game.ids[play].onclick(); const timer = game.run(`${state}.timer`);
    game.ids[play].onclick(); assert.equal(game.run(`${state}.timer`), timer);
    assert.equal(game.run(`previewOpened.has(${day})`), false);
    game.fire(timer); assert.equal(game.run(`previewOpened.has(${day})`), true);
    assert.equal(game.ids[replay].hidden, false);
    game.ids[replay].onclick(); assert.equal(game.run(`${state}.busy`), true);
    game.run('closeOv();openDay(1)'); assert.equal(game.run(state), null);
  }
});

test('massage keeps its caption below the full image without leaking into other days', () => {
  const game = setup(); game.run('openDay(6)');
  assert.equal(game.ids.massage.hidden, false); assert.equal(game.ids.ch.hidden, true);
  const caption = game.ids.massage.children.find(x => x.tag === 'figcaption');
  assert.equal(caption.textContent, 'Kopf aus. Gänsehaut an. 🤤');
  game.run('closeOv();openDay(1)'); assert.equal(game.ids.massage.hidden, true); assert.equal(game.ids.ch.hidden, false);
});

test('Lotus preserves ingredient order, rejects fast repeats, saves the voucher and allows replay', async () => {
  const game = setup({ reduced: false }); game.run('openDay(5)');
  await game.run('addLotus(2)'); assert.equal(game.run('lotusGame.step'), 0);
  assert.equal(game.ids['lotus-status'].textContent, 'Das passt hier noch nicht ganz. Probier eine andere Zutat!');
  for (let i = 0; i < 3; i++) {
    const first = game.run(`addLotus(${i})`); await game.run(`addLotus(${i})`); await first;
    assert.equal(game.run('lotusGame.step'), i + 1);
    await game.run(`addLotus(${Math.min(i + 1, 2)})`);
    assert.equal(game.run('lotusGame.step'), i + 1);
    game.fire(game.run('lotusGame.timer'));
  }
  assert.equal(game.ids['lotus-voucher'].hidden, false);
  assert.equal(game.ids['lotus-hint'].hidden, true);
  game.run('previewOpened.add(1);closeOv();openDay(5)'); assert.equal(game.run('lotusGame.step'), 3);
  game.ids['lotus-again'].onclick(); assert.equal(game.run('lotusGame.step'), 0);
  assert.equal(game.ids['lotus-voucher'].hidden, false); assert.equal(game.run('previewOpened.has(1)&&previewOpened.has(5)'), true);
});

test('Lotus is a sequence puzzle without recipe hints or a highlighted answer', async () => {
  const game = setup(); game.run('openDay(5)');
  const order = game.ids['lotus-ingredients'].children.filter(node => node.tag === 'button').map(node => node.attrs.id);
  assert.equal(order.length, 3);
  assert.notDeepEqual(order, [0,1,2].map(index => 'lotus-ingredient-' + index));
  assert.equal(game.ids['lotus-step'], undefined);
  for (let step = 0; step < 3; step++) {
    for (let index = 0; index < 3; index++) {
      assert.equal(game.ids['lotus-ingredient-' + index].classList.contains('lotus-needed'), false);
      assert(!game.ids['lotus-ingredient-' + index].getAttribute('aria-label').includes('jetzt'));
      assert(!game.ids['lotus-progress-' + index].textContent.includes('Kekse'));
    }
    await game.run(`addLotus(${step === 2 ? 0 : 2})`);
    assert.equal(game.run('lotusGame.step'), step);
    assert(!/Keksboden|Crem|Aufstrich/.test(game.ids['lotus-status'].textContent));
    await game.run(`addLotus(${step})`);
  }
  assert.equal(game.run('lotusGame.step'), 3);
  assert.equal(game.ids['lotus-voucher'].hidden, false);
});

test('Lotus retains the previous state if the next image cannot decode', async () => {
  const game = setup(); game.run('openDay(5)'); game.state.failImage = true;
  await game.run('addLotus(0)'); assert.equal(game.run('lotusGame.step'), 0); assert.equal(game.run('lotusGame.busy'), false);
  game.state.failImage = false; await game.run('addLotus(0)'); assert.equal(game.run('lotusGame.step'), 1);
});

test('Lotus mouse drop and held touch drag use the same step gate; ordinary swipes remain scrollable', async () => {
  const mouse = setup(); mouse.run('openDay(5)');
  let prevented = 0; const e = { preventDefault() { prevented++; }, dataTransfer: { setData() {} } };
  mouse.ids['lotus-ingredient-0'].ondragstart(e); mouse.ids['lotus-plate'].ondragover(e); mouse.ids['lotus-plate'].ondrop(e);
  await new Promise(setImmediate); assert.equal(mouse.run('lotusGame.step'), 1); assert(prevented >= 2);
  const touch = setup(); touch.run('openDay(5)'); const button = touch.ids['lotus-ingredient-0']; let blocked = 0;
  const event = (x, y) => ({ touches: [{ identifier: 7, clientX: x, clientY: y }], changedTouches: [{ identifier: 7, clientX: x, clientY: y }], cancelable: true, preventDefault() { blocked++; } });
  button.listeners.touchstart.fn(event(400, 400)); button.listeners.touchmove.fn(event(400, 420));
  assert.equal(touch.run('lotusDrag'), null); assert.equal(blocked, 0);
  button.listeners.touchstart.fn(event(400, 400)); touch.fire(touch.run('lotusDrag.hold'));
  button.listeners.touchmove.fn(event(100, 100)); button.listeners.touchend.fn(event(100, 100));
  await new Promise(setImmediate); assert.equal(touch.run('lotusGame.step'), 1); assert.equal(blocked, 2);
});

const orders = [['lampOff','tvOn','mugsTaken'],['lampOff','mugsTaken','tvOn'],['tvOn','lampOff','mugsTaken'],['tvOn','mugsTaken','lampOff'],['mugsTaken','lampOff','tvOn'],['mugsTaken','tvOn','lampOff']];
test('movie completes in all six orders, guards duplicates and runs the finale only once', () => {
  for (const order of orders) {
    const game = setup({ reduced: false }); game.run('openDay(7)');
    for (let i = 0; i < 3; i++) { game.ids['movie-' + order[i]].onclick(); game.ids['movie-' + order[i]].onclick(); assert.equal(game.ids['movie-count'].textContent, (i + 1) + ' / 3'); }
    for (const [id] of [...game.timers].sort((a, b) => a[1].delay - b[1].delay)) game.fire(id);
    assert.equal(game.run('movieGame.finishing'), true); assert.equal(game.timers.size, 1);
    game.fire([...game.timers.keys()][0]); assert.equal(game.run('movieGame.finished'), true);
    assert.equal(game.ids['movie-invitation'].hidden, false);
    for (const key of order) game.ids['movie-' + key].onclick();
    assert.equal(game.timers.size, 0);
  }
});

test('movie restores partial progress across sessions and replay retains the earned invitation', () => {
  const first = setup({ preview: false }); first.run('openDay(7);discoverMovie("tvOn")');
  assert.equal(first.run('realOpened.has(7)'), false);
  const second = setup({ preview: false, storage: new Map(first.storage) }); second.run('openDay(7)');
  assert.equal(second.ids['movie-count'].textContent, '1 / 3');
  second.run('discoverMovie("lampOff");discoverMovie("mugsTaken")'); assert.equal(second.run('realOpened.has(7)'), true);
  const third = setup({ preview: false, storage: new Map(second.storage) }); third.run('openDay(7)');
  assert.equal(third.run('movieGame.finished'), true); assert.equal(third.ids['movie-invitation'].hidden, false);
  assert.equal(third.ids['movie-invitation-title'].textContent, 'Unser Filmabend ist bereit 🤎');
  third.ids['movie-again'].onclick(); assert.equal(third.ids['movie-count'].textContent, '0 / 3');
  assert.equal(third.ids['movie-invitation'].hidden, false); assert.equal(third.run('realOpened.has(7)'), true);
});

test('movie hint highlights only one unfound target; taking cups first does not cuddle early', () => {
  const game = setup({ reduced: false }); game.run('openDay(7)'); game.ids['movie-tip'].onclick();
  assert.equal(game.ids['movie-lampOff'].classList.contains('movie-hint'), true); assert.equal(game.ids['movie-count'].textContent, '0 / 3');
  game.run('discoverMovie("mugsTaken")'); assert.equal(game.ids['movie-mugs'].hidden, false);
  const [id] = [...game.timers].find(([, timer]) => timer.delay === 450); game.fire(id);
  assert.equal(game.ids['movie-mugs'].hidden, true); assert(game.ids['movie-couple'].src.endsWith('couple-holding-v2.png'));
  assert.equal(game.ids['movie-room'].classList.contains('movie-finished'), false);
});

test('saved gifts use the same storage keys and reduced motion adds no scene animation timers', async () => {
  const storage = new Map([['adv26', '[1,5,7]'], ['adv26-day7', JSON.stringify({ lampOff: true, tvOn: true, mugsTaken: true, finished: true, earned: true })]]);
  const game = setup({ preview: false, storage }); game.run('openDay(5)'); assert.equal(game.run('lotusGame.step'), 3);
  game.run('closeOv();openDay(7)'); assert.equal(game.run('movieGame.finished'), true);
  game.run('closeOv();openDay(3);playBear()'); assert.equal(game.run('bearGame.done'), true);
  game.run('closeOv();openDay(4);playShaker()'); assert.equal(game.run('shakerGame.done'), true);
  assert.equal(game.timers.size, 0); assert.equal(game.run('realOpened.has(1)&&realOpened.has(5)&&realOpened.has(7)'), true);
});
