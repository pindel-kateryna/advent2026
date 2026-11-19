// A small DOM harness for logic tests. This does not render CSS or replace browser QA.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const code = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match => fs.readFileSync(path.join(SITE, match[1].split('?')[0]), 'utf8')).join('\n');

function setup({ reduced = true, preview = true, storage = new Map() } = {}) {
  const ids = {}, requests = [], writes = [], timers = new Map(), frames = new Map();
  const state = { reduced, failImage: false, now: '2026-11-13T12:00:00Z' };
  let nextTimer = 0, document;
  function element(tag = 'div') {
    const classes = new Set();
    const node = {
      tag, attrs: {}, dataset: {}, style: { setProperty(key, value) { this[key] = String(value); }, removeProperty(key) { delete this[key]; } }, children: [], listeners: {}, hidden: false,
      get className() { return [...classes].join(' '); },
      set className(value) { classes.clear(); String(value).split(/\s+/).filter(Boolean).forEach(x => classes.add(x)); },
      classList: {
        add(...values) { values.forEach(x => classes.add(x)); },
        remove(...values) { values.forEach(x => classes.delete(x)); },
        contains(value) { return classes.has(value); },
        toggle(value, force) { const on = force === undefined ? !classes.has(value) : force; on ? classes.add(value) : classes.delete(value); return on; }
      },
      get src() { return this.attrs.src || ''; },
      set src(value) { this.attrs.src = value; if (tag === 'img') requests.push(value); },
      get innerHTML() { return this._html || ''; },
      set innerHTML(value) { this._html = value; this.children = []; },
      get textContent() { return this._text || ''; },
      set textContent(value) { this._text = value; this.children = []; },
      offsetWidth: 300,
      setAttribute(key, value) {
        this.attrs[key] = String(value);
        if (key === 'class') this.className = value;
        if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      },
      getAttribute(key) { return this.attrs[key] ?? null; },
      removeAttribute(key) {
        delete this.attrs[key];
        if (key.startsWith('data-')) delete this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
      },
      appendChild(child) { if (child.parent) child.parent.children = child.parent.children.filter(x => x !== child); child.parent = this; this.children.push(child); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); },
      addEventListener(type, fn, options) { this.listeners[type] = { fn, options }; },
      focus() { document.activeElement = this; },
      scrollIntoView() {},
      setPointerCapture() {},
      animate() { return { onfinish: null, cancel() {} }; },
      getBoundingClientRect() { return { left: 10, right: 310, top: 10, bottom: 310, width: 300, height: 300 }; },
      querySelectorAll(selector) {
        const matches = item => selector === '[data-copy]' ? 'copy' in item.dataset : selector === 'img[data-src]' ? item.tag === 'img' && 'src' in item.dataset : selector === 'img' ? item.tag === 'img' : false;
        const found = [];
        function walk(parent) { for (const child of parent.children) { if (matches(child)) found.push(child); walk(child); } }
        walk(this); return found;
      }
    };
    return node;
  }
  const root = element('document'), stack = [root];
  const voidTags = new Set(['img', 'meta', 'link', 'input', 'br', 'hr', 'source']);
  for (const match of html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
    const raw = match[0], tag = match[1].toLowerCase();
    if (raw.startsWith('</')) { while (stack.length > 1) { if (stack.pop().tag === tag) break; } continue; }
    const node = element(tag);
    const attrText = raw.slice(match[1].length + 1, -1);
    for (const a of attrText.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)) node.setAttribute(a[1], a[2] ?? a[3] ?? '');
    node.hidden = Object.hasOwn(node.attrs, 'hidden');
    if (node.attrs.id) ids[node.attrs.id] = node;
    stack.at(-1).appendChild(node);
    if (!voidTags.has(tag) && !raw.endsWith('/>')) stack.push(node);
  }
  document = {
    documentElement:root.children[0], activeElement: null, listeners: {}, body: root.children[0].children.find(x => x.tag === 'body'),
    getElementById(id) { if(!id)return null; if(ids[id])return ids[id]; const find=node=>{if(node.id===id)return node;for(const child of node.children){const found=find(child);if(found)return found}return null};return find(root); }, createElement: element,
    querySelectorAll(selector) { return root.querySelectorAll(selector); },
    addEventListener(type, fn) { const previous=this.listeners[type]; this.listeners[type] = previous ? (...args)=>{previous(...args);fn(...args);} : fn; }
  };
  document.documentElement.clientWidth=390;
  const browserWindow={scrollX:0,scrollY:0,innerWidth:390,scrollTo(x,y){this.scrollX=x;this.scrollY=y;}};
  const context = {
    window:browserWindow,
    console, Intl, Math,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [state.now])); } },
    location: { search: preview ? '?vorschau' : '' }, document,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) { storage.set(key, value); writes.push({ key, value }); } },
    matchMedia: () => ({ matches: state.reduced }),
    Image: class { set src(value) { this._src = value; requests.push(value); } get src() { return this._src; } decode() { return state.failImage ? Promise.reject(Error('offline')) : Promise.resolve(); } },
    setInterval() {},
    requestAnimationFrame(fn) { frames.set(++nextTimer, fn); return nextTimer; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, delay) { timers.set(++nextTimer, { fn, delay }); return nextTimer; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.createContext(context); vm.runInContext(code, context);
  if (preview) {
    ids['preview-code'].value = '6652';
    ids['preview-access'].onsubmit({ preventDefault() {} });
  }
  return {
    ids, requests, writes, timers, frames, state, storage, document, window:browserWindow,
    run(source) { return vm.runInContext(source, context); },
    fire(id) { const timer = timers.get(id); if (!timer) throw Error('Missing timer: ' + id); timers.delete(id); timer.fn(); }
  };
}
module.exports = { ROOT, SITE, html, code, setup };
