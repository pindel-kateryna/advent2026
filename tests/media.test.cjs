const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./helpers.cjs');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
const nativeImages=(game,section)=>{for(const img of game.ids[section].querySelectorAll('img'))img.decode=()=>Promise.resolve()};

test('slow scene stays hidden until every layer decodes; only its own images load',async()=>{
const game=setup();nativeImages(game,'movie');let release;game.ids['movie-couple'].decode=()=>new Promise(resolve=>release=resolve);game.run('openDay(7)');await flush();
assert.equal(game.ids.card.classList.contains('on'),false);assert.equal(game.ids['gift-loading'].hidden,false);assert.equal(game.ids['gift-loading'].getAttribute('aria-busy'),'true');assert(game.requests.every(path=>path.startsWith('assets/day-07/')));release();await flush();assert.equal(game.ids.card.classList.contains('on'),true);assert.equal(game.ids['gift-loading'].hidden,true);
});

test('opening animation and image readiness are separate gates',async()=>{
const game=setup({reduced:false});nativeImages(game,'bear');let release;const head=game.ids.bear.querySelectorAll('img')[0];head.decode=()=>new Promise(resolve=>release=resolve);game.run('openDay(3)');await flush();
for(const id of game.run('openingTimers.slice()'))game.fire(id);assert.equal(game.ids.card.classList.contains('on'),false);assert.equal(game.ids['gift-loading'].hidden,false);release();await flush();assert.equal(game.ids.card.classList.contains('on'),true);
});

test('image errors expose retry, recover cleanly and permit closing',async()=>{
const game=setup();nativeImages(game,'movie');game.ids['movie-couple'].decode=()=>Promise.reject(Error('offline'));game.run('openDay(7)');await flush();assert.equal(game.ids['gift-loading-retry'].hidden,false);assert.equal(game.ids.card.classList.contains('on'),false);
game.ids['movie-couple'].decode=()=>Promise.resolve();game.ids['gift-loading-retry'].onclick();await flush();assert.equal(game.ids.card.classList.contains('on'),true);game.ids.x.onclick();assert.equal(game.document.body.classList.contains('gift-scroll-locked'),false);
});

test('timed-out and closed requests cannot reveal a stale day',async()=>{
const game=setup();nativeImages(game,'movie');let release;game.ids['movie-couple'].decode=()=>new Promise(resolve=>release=resolve);game.run('openDay(7)');await flush();const timeout=[...game.timers].find(([,timer])=>timer.delay===15000);game.fire(timeout[0]);await flush();assert.equal(game.ids['gift-loading-retry'].hidden,false);game.ids['gift-loading-close'].onclick();game.run('openDay(11)');release();await flush();assert.equal(game.ids.ov.dataset.n,11);assert.equal(game.ids.mirror.hidden,false);assert.equal(game.ids['gift-loading'].hidden,true);assert.equal(game.ids.movie.hidden,true);
});

test('all five match sprites decode before showing the board',async()=>{
const game=setup();nativeImages(game,'match');let release;game.run("preloadedMedia.set(MATCH_ROOT+'bear-blue.webp',new Image())");const blue=game.run("preloadedMedia.get(MATCH_ROOT+'bear-blue.webp')");blue.src='assets/day-10/bear-blue.webp';blue.decode=()=>new Promise(resolve=>release=resolve);game.run('openDay(10)');await flush();assert.equal(game.ids.card.classList.contains('on'),false);assert.equal(game.run('preloadedMedia.size'),5);release();await flush();assert.equal(game.ids.card.classList.contains('on'),true);
});

test('background lock preserves scroll across day changes and restores it on close',()=>{
const game=setup();game.window.scrollY=640;game.window.scrollX=0;game.run('openDay(6)');assert.equal(game.document.body.style['--calendar-top'],'-640px');assert.equal(game.document.body.classList.contains('gift-scroll-locked'),true);assert.equal(game.document.documentElement.classList.contains('has-open-gift'),true);
game.window.scrollY=0;game.run('openDay(11)');assert.equal(game.document.body.style['--calendar-top'],'-640px');game.document.listeners.keydown({key:'Escape'});assert.equal(game.window.scrollY,640);assert.equal(game.document.body.classList.contains('gift-scroll-locked'),false);assert.equal(game.document.documentElement.classList.contains('has-open-gift'),false);game.run('closeOv()');assert.equal(game.window.scrollY,640);
});

test('already decoded layers reopen without reloading or a second loading screen',async()=>{
const game=setup();let decodes=0;for(const img of game.ids.bear.querySelectorAll('img'))img.decode=()=>{decodes++;return Promise.resolve()};game.run('openDay(3)');await flush();const first=decodes,requests=game.requests.length;game.run('closeOv();openDay(3)');assert.equal(game.ids.card.classList.contains('on'),true);assert.equal(game.ids['gift-loading'].hidden,true);assert.equal(decodes,first);assert.equal(game.requests.length,requests);
});
