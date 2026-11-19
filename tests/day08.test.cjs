const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, SITE, html, setup } = require('./helpers.cjs');
const ids = ['upper', 'middle', 'lower'];
const orders = [['upper','middle','lower'],['upper','lower','middle'],['middle','upper','lower'],['middle','lower','upper'],['lower','upper','middle'],['lower','middle','upper']];

test('day 8 loads only its two scene assets on demand and starts without any lights', () => {
  assert(html.indexOf('defer src="js/day08.js"') < html.indexOf('defer src="js/app.js?'));
  const game = setup(); assert.deepEqual(game.requests, []); game.run('openDay(8)');
  assert.equal(game.ids.tree.hidden, false); assert.equal(game.ids['tree-count'].textContent, '0 / 3');
  assert.equal(game.ids['tree-scene'].classList.contains('tree-complete'), false);
  assert.equal(game.ids['tree-again'].hidden, true); assert.equal(game.ids['tree-tip'].hidden, false);
  assert.deepEqual([...new Set(game.requests)].sort(), ['assets/day-08/tree-lit.webp', 'assets/day-08/tree-unlit.webp']);
  for (const id of ids) assert.equal(game.ids['tree-light-' + id].classList.contains('is-on'), false);
  assert.equal(game.run('previewOpened.has(8)'), false);
});

test('each isolated finding turns on only its own light mask', () => {
  for (const chosen of ids) {
    const game = setup(); game.run(`openDay(8);discoverTree('${chosen}')`);
    assert.equal(game.ids['tree-count'].textContent, '1 / 3');
    for (const id of ids) assert.equal(game.ids['tree-light-' + id].classList.contains('is-on'), chosen === id);
    assert.equal(game.ids['tree-scene'].classList.contains('tree-complete'), false);
    assert.equal(game.ids['tree-status'].textContent, '1 von 3 Sternen gefunden.');
  }
});

test('all six orders complete the tree, and repeated taps never award twice', () => {
  for (const order of orders) {
    const game = setup({ preview: false }); game.run('openDay(8)');
    for (let i = 0; i < 3; i++) {
      game.ids['tree-star-' + order[i]].onclick();
      const writes = game.writes.length;
      game.ids['tree-star-' + order[i]].onclick();
      assert.equal(game.writes.length, writes);
      assert.equal(game.ids['tree-count'].textContent, (i + 1) + ' / 3');
      assert.equal(game.ids['tree-scene'].classList.contains('tree-complete'), i === 2);
    }
    assert.equal(game.run('realOpened.has(8)'), true);
    assert.equal(game.ids['tree-tip'].hidden, true); assert.equal(game.ids['tree-again'].hidden, false);
    assert.equal(game.ids['tree-status'].textContent, 'Viel besser! Jetzt darfst du Päckchen Nr. 8 öffnen. 🤎');
    assert.deepEqual(JSON.parse(game.storage.get('adv26-day8')).found.sort(), [...ids].sort());
    assert.equal(game.timers.size, 0); // reduced motion: no particles or delayed rewards
  }
});

test('found IDs restore exactly across reloads; a finished tree restores the permission', () => {
  const first = setup({ preview: false }); first.run('openDay(8);discoverTree("lower")');
  const second = setup({ preview: false, storage: new Map(first.storage) }); second.run('openDay(8)');
  assert.equal(second.run('treeGame.found.has("lower")'), true);
  assert.equal(second.run('treeGame.found.has("upper")'), false);
  assert.equal(second.ids['tree-count'].textContent, '1 / 3');
  second.run('discoverTree("middle");discoverTree("upper")');
  const third = setup({ preview: false, storage: new Map(second.storage) }); third.run('openDay(8)');
  assert.equal(third.ids['tree-count'].textContent, '3 / 3');
  assert.equal(third.ids['tree-scene'].classList.contains('tree-complete'), true);
  assert.equal(third.run('realOpened.has(8)'), true);
});

test('invalid or duplicate saved IDs do not turn into extra stars', () => {
  const storage = new Map([['adv26-day8', JSON.stringify({ found: ['middle', 'middle', 'wrong', 3], earned: false })]]);
  const game = setup({ preview: false, storage }); game.run('openDay(8)');
  assert.equal(game.ids['tree-count'].textContent, '1 / 3');
  assert.equal(game.run('treeGame.found.size'), 1);
  assert.equal(game.ids['tree-light-middle'].classList.contains('is-on'), true);
});

test('the optional hint briefly highlights one remaining star without counting it', () => {
  const game = setup(); game.run('openDay(8);discoverTree("upper")'); game.ids['tree-tip'].onclick();
  assert.equal(game.ids['tree-star-upper'].classList.contains('tree-hint'), false);
  assert.equal(game.ids['tree-star-middle'].classList.contains('tree-hint'), true);
  assert.equal(game.ids['tree-star-lower'].classList.contains('tree-hint'), false);
  assert.equal(game.ids['tree-count'].textContent, '1 / 3');
  game.fire(game.run('treeGame.hintTimer'));
  assert.equal(game.ids['tree-star-middle'].classList.contains('tree-hint'), false);
});

test('replaying clears only this scene and retains day 8 access, other gifts and the movie save', () => {
  const movieSave = JSON.stringify({ tvOn: true, lampOff: false, mugsTaken: false, earned: false });
  const storage = new Map([['adv26', '[1,5,7]'], ['adv26-day7', movieSave]]);
  const game = setup({ preview: false, storage }); game.run('openDay(8);discoverTree("upper");discoverTree("middle");discoverTree("lower")');
  game.ids['tree-again'].onclick();
  assert.equal(game.ids['tree-count'].textContent, '0 / 3');
  assert.equal(game.ids['tree-scene'].classList.contains('tree-complete'), false);
  assert.equal(game.run('[1,5,7,8].every(n=>realOpened.has(n))'), true);
  assert.equal(game.storage.get('adv26-day7'), movieSave);
  assert.deepEqual(JSON.parse(game.storage.get('adv26-day8')), { found: [], earned: true });
  const reload = setup({ preview: false, storage: new Map(game.storage) }); reload.run('openDay(8)');
  assert.equal(reload.ids['tree-count'].textContent, '0 / 3'); assert.equal(reload.run('realOpened.has(8)'), true);
});

test('preview is isolated and its reset does not touch the real tree', () => {
  const realState = JSON.stringify({ found: ['middle'], earned: false });
  const game = setup({ storage: new Map([['adv26-day8', realState]]) });
  game.run('openDay(8);discoverTree("upper");closeOv()');
  assert.equal(game.writes.length, 0); assert.equal(game.storage.get('adv26-day8'), realState);
  game.ids.rs.onclick(); game.run('openDay(8)'); assert.equal(game.ids['tree-count'].textContent, '0 / 3');
  game.run('closeOv();preview=false;updatePreview();openDay(8)'); assert.equal(game.run('treeGame.found.has("middle")'), true);
});

test('closing cancels sparks and hints without losing a finding; normal dates remain enforced', () => {
  const game = setup({ reduced: false }); game.run('openDay(8);discoverTree("upper")'); game.ids['tree-tip'].onclick();
  assert(game.ids['tree-sparks'].children.length > 0); assert(game.timers.size > 0);
  const stale = [...game.timers.values()][0].fn;
  game.run('closeOv()'); assert.equal(game.timers.size, 0); game.run('openDay(6)'); stale();
  assert.equal(game.run('treeGame'), null); assert.equal(game.ids.tree.hidden, true); assert.equal(game.timers.size, 2); // day 6's existing opening animation
  assert.equal(game.ids.massage.hidden, false);
  game.run('closeOv();openDay(8)'); assert.equal(game.ids['tree-count'].textContent, '1 / 3');
  const gated = setup({ preview: false }); gated.run('tap(8,document.createElement("button"))');
  assert.equal(gated.run('treeGame'), null); assert.deepEqual(gated.requests, []);
});

test('star buttons use native keyboard semantics and non-overlapping 44px touch targets', () => {
  const game = setup();
  const stars = JSON.parse(game.run('JSON.stringify(TREE_STARS)'));
  for (const width of [180, 220, 260, 306]) {
    const centers = stars.map(star => ({ x: star.x / 100 * width, y: star.y / 100 * width * 4 / 3 }));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      assert(Math.abs(centers[i].x - centers[j].x) >= 44 || Math.abs(centers[i].y - centers[j].y) >= 44);
    }
  }
  for (const star of stars) {
    const button = game.ids['tree-star-' + star.id];
    assert.equal(button.tag, 'button'); assert.equal(button.attrs.type, 'button');
    assert.equal(button.attrs['aria-label'], star.label); assert.equal(typeof button.onclick, 'function');
    assert.equal(button.style['--star-x'], star.x + '%');
  }
});

test('soft masks cover every bulb on their own strand and leave the other strands off', () => {
  const game = setup(); const bulbs = JSON.parse(game.run('JSON.stringify(TREE_BULBS)'));
  function alpha(id, x, y) {
    return 1 - bulbs[id].reduce((remaining, [cx, cy]) => {
      const radius = Math.hypot((x - cx) / 7, (y - cy) / 5);
      const opacity = radius <= .48 ? 1 : radius >= 1 ? 0 : (1 - radius) / .52;
      return remaining * (1 - opacity);
    }, 1);
  }
  for (const id of ids) {
    assert(game.ids['tree-light-' + id].style.maskImage.includes('radial-gradient'));
    assert.equal(game.ids['tree-light-' + id].style.maskImage, game.ids['tree-light-' + id].style.webkitMaskImage);
    for (const [x, y] of bulbs[id]) assert.equal(alpha(id, x, y), 1);
    for (const other of ids.filter(other => other !== id)) for (const [x, y] of bulbs[other]) assert.equal(alpha(id, x, y), 0);
    assert.equal(alpha(id, 50, 80), 0); // stand/floor never receives a partial-light overlay
  }
});

test('the tree canvases keep their full dimensions after optimization and reveal no package contents', () => {
  const section = html.slice(html.indexOf('<section class="tree '), html.indexOf('<section class="movie '));
  const dayCode = fs.readFileSync(path.join(SITE, 'js/day08.js'), 'utf8');
  assert(!/Bär|bear|ornament|Anhänger|Spielzeug|Versteck|Zimmer/i.test(section + dayCode));
  assert(!dayCode.includes('beep('));
  assert(section.includes('>08</text>'));
  assert(!section.includes('Dein Geschenk'));
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/assets.json'),'utf8'));
  for (const name of ['tree-unlit.webp', 'tree-lit.webp']) {
    const web = fs.readFileSync(path.join(SITE, 'assets/day-08', name));
    assert.equal(web.toString('ascii',8,12),'WEBP');
    const entry=manifest.find(item=>item.output==='site/assets/day-08/'+name);
    assert.equal(entry.width,1086);assert.equal(entry.height,1448);
    const original=path.join(ROOT,'references/original-assets/day-08',name.replace('.webp','.png'));
    if(fs.existsSync(original)){const png=fs.readFileSync(original);assert.equal(png.readUInt32BE(16),1086);assert.equal(png.readUInt32BE(20),1448);}
  }
});
