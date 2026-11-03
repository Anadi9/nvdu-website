// Tag Devanagari runs with lang="sa" for screen readers and line breaking, as the prototype does at runtime.
// Hindi pages (html lang="hi") are left alone. Hand-set lang attributes always win.
export function tagDevanagari(): void {
  const DV = /[ऀ-ॿ]/g, base = document.documentElement.lang || 'en';
  if (base === 'hi') return;
  document.querySelectorAll('h1,h2,h3,p,span,b,i,dt,dd,li,a,button,figcaption,label,td,th').forEach((el) => {
    const up = el.parentElement && el.parentElement.closest('[lang]');
    if (el.hasAttribute('lang') || (up && up !== document.documentElement)) return;
    let t = ''; el.childNodes.forEach((n) => { if (n.nodeType === 3) t += n.textContent; });
    t = t.replace(/[\s·॥।,.:;()\-–—0-9०-९]/g, '');
    if (t && (t.match(DV) || []).length / t.length > 0.6) el.setAttribute('lang', 'sa');
  });
}
