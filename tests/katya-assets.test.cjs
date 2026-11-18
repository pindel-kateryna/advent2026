const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./helpers.cjs');

test('day 3 uses an illustrated Katya head over a stationary illustrated bear body and replays', () => {
  const game = setup();
  game.run('openDay(3)');
  assert(game.requests.includes('assets/day-03/katya-head-illustrated.png'));
  assert(game.requests.includes('assets/day-03/chocolate-bear-illustrated.png'));
  assert(!game.requests.includes('assets/day-03/katya-bear-reveal.png'));
  game.state.reduced = false;
  game.ids['bear-scene'].onclick();
  assert.equal(game.ids['bear-scene'].classList.contains('bear-running'), true);
  game.fire(game.run('bearGame.timer'));
  assert.equal(game.ids['bear-scene'].classList.contains('bear-done'), true);
  game.ids['bear-replay'].onclick();
  assert.equal(game.ids['bear-scene'].classList.contains('bear-done'), false);
  assert.equal(game.ids['bear-scene'].classList.contains('bear-running'), true);
  game.fire(game.run('bearGame.timer'));
  assert.equal(game.ids['bear-scene'].classList.contains('bear-done'), true);
});

test('day 7 uses all three v2 states and restores them when the scene is replayed', () => {
  const game = setup();
  game.run('openDay(7)');
  assert(game.ids['movie-couple'].src.endsWith('couple-before-v2.png'));
  assert(game.requests.includes('assets/day-07/couple-holding-v2.png'));
  assert(game.requests.includes('assets/day-07/couple-cuddle-v2.png'));
  game.run('discoverMovie("mugsTaken")');
  assert(game.ids['movie-couple'].src.endsWith('couple-holding-v2.png'));
  game.run('discoverMovie("lampOff");discoverMovie("tvOn")');
  assert.equal(game.ids['movie-room'].classList.contains('movie-finished'), true);
  game.ids['movie-again'].onclick();
  assert(game.ids['movie-couple'].src.endsWith('couple-before-v2.png'));
  assert.equal(game.ids['movie-room'].classList.contains('movie-finished'), false);
  game.run('discoverMovie("tvOn");discoverMovie("mugsTaken");discoverMovie("lampOff")');
  assert(game.ids['movie-couple'].src.endsWith('couple-holding-v2.png'));
  assert.equal(game.ids['movie-room'].classList.contains('movie-finished'), true);
});
