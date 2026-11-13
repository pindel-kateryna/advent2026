// Day 8 keeps its saved set separate from other games and from preview mode.
const TREE_IDS = TREE_STARS.map(star => star.id);
const validTreeFound = value => [...new Set(Array.isArray(value) ? value.filter(id => TREE_IDS.includes(id)) : [])];
let realTreeState = null, previewTreeState = null, treeGame = null;

try {
  const saved = JSON.parse(localStorage.getItem('adv26-day8') || 'null');
  if (saved && Array.isArray(saved.found)) {
    realTreeState = { found: validTreeFound(saved.found), earned: saved.earned === true };
  }
} catch (error) {}

function persistTree(game) {
  const state = { found: [...game.found], earned: game.earned };
  if (game.progress === realOpened) {
    realTreeState = state;
    try { localStorage.setItem('adv26-day8', JSON.stringify(state)); } catch (error) {}
  } else previewTreeState = state;
}

function treeLater(game, fn, delay) {
  const id = setTimeout(() => {
    game.timers.delete(id);
    if (treeGame === game) fn();
  }, delay);
  game.timers.add(id);
  return id;
}

function stopTree() {
  if (treeGame) treeGame.timers.forEach(clearTimeout);
  treeGame = null;
  $('tree-sparks').innerHTML = '';
  for (const id of TREE_IDS) $('tree-star-' + id).classList.remove('tree-hint', 'tree-flash');
}

function renderTree() {
  const game = treeGame;
  if (!game) return;
  const complete = game.found.size === 3;
  $('tree-scene').classList.toggle('tree-complete', complete);
  $('tree-count').textContent = game.found.size + ' / 3';
  $('tree-count').setAttribute('aria-label', game.found.size + ' von 3 Sternen gefunden');
  $('tree-help').hidden = complete;
  $('tree-tip').hidden = complete;
  $('tree-again').hidden = !game.earned;
  $('ch').hidden = complete;
  $('ch').textContent = TREE_TITLE;
  $('tree-status').textContent = complete ? TREE_WIN : game.message;
  for (const star of TREE_STARS) {
    const found = game.found.has(star.id), button = $('tree-star-' + star.id);
    button.classList.toggle('tree-found', found);
    button.setAttribute('aria-disabled', String(found));
    button.setAttribute('aria-label', found ? star.foundLabel : star.label);
    $('tree-light-' + star.id).classList.toggle('is-on', found);
    if (found) button.classList.remove('tree-hint');
  }
}

function startTree(progress) {
  stopTree();
  const stored = progress === realOpened ? realTreeState : previewTreeState;
  // Existing earned day-8 records can also restore a finished tree.
  // A replay explicitly saves an empty set, so it never takes this fallback.
  const found = new Set(stored ? validTreeFound(stored.found) : progress.has(8) ? TREE_IDS : []);
  treeGame = {
    found, progress, earned: Boolean(stored && stored.earned) || progress.has(8) || found.size === 3,
    timers: new Set(), hintTimer: null,
    message: found.size && found.size < 3 ? found.size + ' von 3 Sternen gefunden.' : ''
  };
  if (treeGame.earned && !progress.has(8)) { progress.add(8); save(progress); }
  if (found.size === 3 && (!stored || !stored.earned)) persistTree(treeGame);
  renderTree();
}

function sparkleTree(star, finale = false) {
  const game = treeGame;
  if (!game || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  for (let i = 0; i < (finale ? 10 : 6); i++) {
    const particle = document.createElement('span');
    particle.className = 'tree-spark';
    particle.style.left = (finale ? 42 + Math.random() * 16 : star.x) + '%';
    particle.style.top = (finale ? 7 + Math.random() * 8 : star.y) + '%';
    particle.style.setProperty('--spark-x', (Math.random() * 32 - 16) + 'px');
    particle.style.setProperty('--spark-y', (-10 - Math.random() * 20) + 'px');
    particle.style.animationDelay = (i * .025) + 's';
    $('tree-sparks').appendChild(particle);
    treeLater(game, () => particle.remove(), 1000);
  }
}

function discoverTree(id) {
  const game = treeGame, star = TREE_STARS.find(star => star.id === id);
  if (!game || !star || game.found.has(id)) return;
  // Award synchronously before scheduling visual effects: fast taps count once.
  game.found.add(id);
  game.message = game.found.size + ' von 3 Sternen gefunden.';
  if (game.found.size === 3) {
    game.earned = true;
    game.progress.add(8);
    save(game.progress);
  }
  persistTree(game);
  renderTree();
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $('tree-star-' + id).classList.add('tree-flash');
    treeLater(game, () => $('tree-star-' + id).classList.remove('tree-flash'), 450);
    sparkleTree(star);
    if (game.found.size === 3) sparkleTree(star, true);
  }
}

function initTree() {
for (const star of TREE_STARS) {
  const button = $('tree-star-' + star.id), light = $('tree-light-' + star.id);
  button.style.setProperty('--star-x', star.x + '%');
  button.style.setProperty('--star-y', star.y + '%');
  // Each bulb has an opaque core and a feathered halo; their union follows the cord.
  // The three unions are separated vertically and never illuminate another strand.
  const mask = TREE_BULBS[star.id].map(([x, y]) =>
    `radial-gradient(ellipse 7% 5% at ${x}% ${y}%,#000 48%,transparent 100%)`
  ).join(',');
  light.style.maskImage = mask;
  light.style.webkitMaskImage = mask;
  button.onclick = () => discoverTree(star.id);
}

$('tree-tip').onclick = () => {
  const game = treeGame;
  if (!game) return;
  const star = TREE_STARS.find(star => !game.found.has(star.id));
  if (!star) return;
  clearTimeout(game.hintTimer);
  game.timers.delete(game.hintTimer);
  for (const id of TREE_IDS) $('tree-star-' + id).classList.remove('tree-hint');
  $('tree-star-' + star.id).classList.add('tree-hint');
  game.message = 'Ein kleiner Tipp: Achte auf den goldenen Schimmer.';
  $('tree-status').textContent = game.message;
  game.hintTimer = treeLater(game, () => $('tree-star-' + star.id).classList.remove('tree-hint'), 1600);
};

$('tree-again').onclick = () => {
  const game = treeGame;
  if (!game) return;
  const progress = game.progress, state = { found: [], earned: game.earned || progress.has(8) };
  if (progress === realOpened) realTreeState = state;
  else previewTreeState = state;
  startTree(progress);
  persistTree(treeGame);
  $('tree-star-upper').focus();
};

}
