const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, SITE, html, setup } = require('./helpers.cjs');

test('gift types keep the shared copy in the correct panel when switching days', () => {
  const game = setup();
  for (const [day, kind, slot] of [[1,'image','photo-copy'],[2,'game','memory-task'],[3,'animation','bear-task'],[4,'animation','shaker-task'],[5,'game','lotus-task'],[6,'image','gift-generic-task'],[7,'game','movie-task'],[8,'game','tree-task'],[3,'animation','bear-task']]) {
    game.run(`setCard(${day},opened)`);
    assert.equal(game.ids.card.dataset.kind, kind);
    assert.equal(game.ids.ch.parent.attrs.id, slot);
    assert.equal(game.ids['gift-default-actions'].hidden, day !== 1);
  }
});

test('every static and dynamic asset reference resolves inside the public site', () => {
  const paths = [...html.matchAll(/\b(?:data-src|src|href)="([^"]+)"/g)]
    .map(match => match[1]).filter(value => !/^(https?:|data:|#)/.test(value)).map(value => value.split('?')[0]);
  const game = setup();
  paths.push(...game.run('LOTUS_STAGES.concat(LOTUS_INGREDIENTS).map(name=>LOTUS_ROOT+name)'));
  paths.push(...['before', 'holding', 'cuddle'].map(pose => 'assets/day-07/couple-' + pose + '-v2.png'));
  for (const value of paths) {
    const resolved = path.resolve(SITE, value);
    assert(resolved.startsWith(SITE + path.sep), value);
    assert(fs.statSync(resolved).isFile(), value);
  }
});

test('the public folder contains only runtime files and prepared images', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/assets.json'), 'utf8'));
  const expected = new Set(['index.html', 'css/styles.css', 'js/content.js', 'js/app.js', 'js/day08.js', ...manifest.map(item => item.output.slice('site/'.length))]);
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else assert(expected.delete(path.relative(SITE, file)), file);
    }
  }
  walk(SITE); assert.equal(expected.size, 0);
  assert(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').includes('/references/'));
});

test('content loads before the app and every copy placeholder has a value', () => {
  assert(html.indexOf('defer src="js/content.js"') < html.indexOf('defer src="js/app.js?'));
  assert(!/<img\b[^>]*\ssrc=/.test(html));
  assert(!html.includes('rel="preload"'));
  const game = setup();
  for (const node of game.document.querySelectorAll('[data-copy]')) assert(node.textContent.length > 0, node.dataset.copy);
  const copy = game.run('COPY.movieInvitationCopy');
  assert.equal(copy, 'Du suchst den Film aus. Gekuschelt wird sowieso. Such dein Päckchen Nummer 07.');
});

test('document IDs are unique and the shaker mask still references the HTML document', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert(html.includes('id="shaker-body-clip"'));
  assert(html.includes('style="clip-path:url(#shaker-body-clip)"'));
  assert(!fs.readFileSync(path.join(SITE, 'css/styles.css'), 'utf8').includes('url(#shaker-body-clip)'));
});

test('transparent images retain PNG alpha and all PNG web copies fit the resolution budget', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/assets.json'), 'utf8'));
  assert.equal(manifest.length, 22);
  for (const item of manifest.filter(item => item.format === 'png')) {
    const png = fs.readFileSync(path.join(ROOT, item.output));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png[25], item.alpha === false ? 2 : 6, item.output);
    assert(Math.max(png.readUInt32BE(16), png.readUInt32BE(20)) <= item.maxSize, item.output);
  }
});
