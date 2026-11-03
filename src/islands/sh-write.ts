// Devanagari headings write themselves: the headline bar first, then the word beneath it.
// Ported from the prototype's shInit; with reduced motion they are simply shown.
export function initShWrite(): void {
  const root = document.querySelector<HTMLElement>('.vroot');
  if (!root || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('js-io');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute('data-in', '1'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  // only headings already on the page are held back; any drawn later simply appear
  root.querySelectorAll('.sh').forEach((el) => { el.setAttribute('data-w', '1'); io.observe(el); });
  const sweep = () => root.querySelectorAll('.sh[data-w="1"]:not([data-in])').forEach((el) => { const b = el.getBoundingClientRect(); if (b.top < window.innerHeight * 0.95 && b.bottom > 0) el.setAttribute('data-in', '1'); });
  window.addEventListener('scroll', sweep, { passive: true });
  setTimeout(sweep, 600);
}
