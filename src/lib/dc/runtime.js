// The prototype's template runtime, ported from design/prototype/support.js so every page
// renders and behaves exactly as it did on the canvas. Used twice:
//   at build time (Node, with linkedom's DOMParser) to write the page's HTML, and
//   in the browser, where it mounts the page's component and takes over.
// Template language: {{path}} bindings, <sc-for list as>, <sc-if value>, <dc-import name>, ref, on*.

export class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(s) { const n = typeof s === 'function' ? s(this.state) : s; Object.assign(this.state, n); if (this.__rerender) this.__rerender(); }
  forceUpdate() { if (this.__rerender) this.__rerender(); }
}

const svgNS = 'http://www.w3.org/2000/svg';

// a board is a template element plus its component class and prop defaults
export function parseBoard(DOMParserImpl, html, makeClass) {
  const doc = new DOMParserImpl().parseFromString('<!doctype html><html><body><x-dc>' + html + '</x-dc></body></html>', 'text/html');
  const tpl = doc.querySelector('x-dc');
  return { tpl, Cls: makeClass(DCLogic), defaults: {} };
}

function lookup(path, scope) {
  path = path.trim();
  if (path === 'true') return true; if (path === 'false') return false;
  const parts = path.split('.'); let v;
  for (let i = scope.length - 1; i >= 0; i--) if (scope[i] && parts[0] in scope[i]) { v = scope[i][parts[0]]; break; }
  for (let j = 1; j < parts.length && v != null; j++) v = v[parts[j]];
  return v;
}
function interp(s, scope) { return s.replace(/\{\{([^}]+)\}\}/g, (_, p) => { const v = lookup(p, scope); return v == null ? '' : String(v); }); }

// virtual tree: {t:'text',v} | {tag, ns, attrs, on, ref, kids} | {comp, props}
function build(node, scope, out, ns) {
  if (node.nodeType === 3) { out.push({ t: 'text', v: interp(node.nodeValue, scope) }); return; }
  if (node.nodeType !== 1) return;
  const tag = node.tagName.toLowerCase();
  if (tag === 'sc-for') {
    const list = lookup(node.getAttribute('list').replace(/[{}]/g, ''), scope) || [], as = node.getAttribute('as');
    list.forEach((item, i) => { const s = { $index: i }; s[as] = item; node.childNodes.forEach((c) => build(c, scope.concat([s]), out, ns)); });
    return;
  }
  if (tag === 'sc-if') { if (lookup(node.getAttribute('value').replace(/[{}]/g, ''), scope)) node.childNodes.forEach((c) => build(c, scope, out, ns)); return; }
  if (tag === 'dc-import') {
    const p = {}; Array.from(node.attributes).forEach((a) => { if (a.name !== 'name' && a.name.indexOf('hint-') !== 0) p[a.name] = interp(a.value, scope); });
    out.push({ comp: node.getAttribute('name'), props: p }); return;
  }
  const nns = (tag === 'svg' || ns === svgNS) ? svgNS : null;
  const v = { tag: node.tagName, ns: nns, attrs: {}, on: {}, ref: null, kids: [] };
  Array.from(node.attributes).forEach((a) => {
    if (a.name.indexOf('hint-') === 0) return;
    const m = a.value.match(/^\s*\{\{([^}]+)\}\}\s*$/);
    if (a.name === 'ref') { v.ref = m ? lookup(m[1], scope) : null; return; }
    if (/^on[a-z]+$/.test(a.name)) { const fn = m && lookup(m[1], scope); if (typeof fn === 'function') v.on[a.name.slice(2)] = fn; return; }
    v.attrs[a.name] = interp(a.value, scope);
  });
  node.childNodes.forEach((c) => build(c, scope, v.kids, nns));
  out.push(v);
}

export function renderTree(board, props, comps) {
  const inst = new board.Cls(Object.assign({}, board.defaults, props));
  const v = inst.renderVals(), out = [];
  board.tpl.childNodes.forEach((c) => build(c, [v], out, null));
  return expand(out, comps);
}
// imported components are rendered in place (at build time they have no behaviour of their own)
function expand(list, comps) {
  const res = [];
  for (const v of list) {
    if (v.comp) { const c = comps[v.comp]; if (c) res.push(...renderTree(c, v.props, comps)); }
    else { if (v.kids) v.kids = expand(v.kids, comps); res.push(v); }
  }
  return res;
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
export function toHTML(list) {
  let h = '';
  for (const v of list) {
    if (v.t === 'text') { h += esc(v.v); continue; }
    const tag = v.ns ? v.tag : v.tag.toLowerCase();
    h += '<' + tag + Object.entries(v.attrs).map(([k, a]) => ' ' + k + '="' + escA(a) + '"').join('') + '>';
    if (!v.ns && VOID.has(tag)) continue;
    h += toHTML(v.kids) + '</' + tag + '>';
  }
  return h;
}

// ---- browser: create, patch, mount (unchanged from the prototype runtime) ----
function create(v, comps) {
  if (v.t === 'text') return document.createTextNode(v.v);
  if (v.comp) { const c = comps[v.comp]; const w = document.createElement('span'); w.style.display = 'contents'; w.__comp = v.comp; if (c) w.__inst = mount(c, v.props, w, comps); return w; }
  const el = v.ns ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag.toLowerCase());
  el.__h = {}; patchEl(el, v, comps); return el;
}
function patchEl(el, v, comps) {
  const old = el.__a || {};
  Object.keys(old).forEach((k) => { if (!(k in v.attrs)) el.removeAttribute(k); });
  Object.keys(v.attrs).forEach((k) => { if (old[k] !== v.attrs[k]) el.setAttribute(k, v.attrs[k]); });
  el.__a = v.attrs;
  el.__h = el.__h || {};
  Object.keys(v.on).forEach((t) => { if (!(t in el.__h)) el.addEventListener(t, (e) => { if (el.__h[t]) el.__h[t](e); }); el.__h[t] = v.on[t]; });
  Object.keys(el.__h).forEach((t) => { if (!v.on[t]) el.__h[t] = null; });
  if (v.ref) { if (typeof v.ref === 'function') v.ref(el); else v.ref.current = el; }
  patchKids(el, v.kids, comps);
}
function same(n, v) { if (v.t === 'text') return n.nodeType === 3; if (v.comp) return n.__comp === v.comp; return n.nodeType === 1 && !n.__comp && n.tagName.toLowerCase() === v.tag.toLowerCase(); }
function patchKids(el, kids, comps) {
  const nodes = Array.from(el.childNodes);
  kids.forEach((v, i) => {
    const n = nodes[i];
    if (n && same(n, v)) {
      if (v.t === 'text') { if (n.nodeValue !== v.v) n.nodeValue = v.v; }
      else if (v.comp) { if (n.__inst) { n.__inst.props = Object.assign({}, comps[v.comp].defaults, v.props); n.__inst.__rerender(); } }
      else patchEl(n, v, comps);
    } else {
      const c = create(v, comps);
      if (n) el.replaceChild(c, n); else el.appendChild(c);
    }
  });
  for (let j = nodes.length - 1; j >= kids.length; j--) if (nodes[j].parentNode === el) el.removeChild(nodes[j]);
}
export function mount(board, props, wrap, comps) {
  const inst = new board.Cls(Object.assign({}, board.defaults, props));
  const draw = () => { const v = inst.renderVals(), out = []; board.tpl.childNodes.forEach((c) => build(c, [v], out, null)); patchKids(wrap, out, comps); };
  inst.__rerender = () => { draw(); if (inst.componentDidUpdate) inst.componentDidUpdate(); };
  draw();
  setTimeout(() => { if (inst.componentDidMount) inst.componentDidMount(); }, 0);
  return inst;
}
