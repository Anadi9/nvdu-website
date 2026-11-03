// The cursor: a brass bead with the kalava thread trailing behind it.
// Ported from the prototype's cursorInit; mouse and pen only, and still when motion is reduced.
export function initCursor(): void {
  const root = document.querySelector<HTMLElement>('.vroot');
  const svg = document.querySelector<SVGSVGElement>('.cur-svg');
  if (!root || !svg || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const q = <T extends Element>(s: string) => svg.querySelector<T>(s)!;
  const red = q<SVGPathElement>('.cur-red'), yel = q<SVGPathElement>('.cur-yel'), glow = q<SVGPathElement>('.cur-glow');
  const bead = q<SVGGElement>('.cur-bead'), ring = q<SVGCircleElement>('.cur-ring'), pulseC = q<SVGCircleElement>('.cur-pulse');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches, N = 28;
  const P = Array.from({ length: N }, () => ({ x: -99, y: -99 }));
  const m = { x: -99, y: -99, on: false, hov: false, text: false };
  let rg = 0, pulse = 0, px = -99, py = -99;
  document.body.classList.add('c-on');
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    m.x = e.clientX; m.y = e.clientY;
    if (!m.on) { m.on = true; for (const p of P) { p.x = m.x; p.y = m.y; } }
    const t = e.target instanceof Element ? e.target : null;
    m.text = !!(t && t.closest('input:not([type=range]):not([type=checkbox]),textarea'));
    m.hov = !!(t && t.closest('a,button,summary,label,[role=tab],[role=radio],input[type=range],input[type=checkbox]'));
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => { pulse = 1; px = e.clientX; py = e.clientY; }, { passive: true });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) m.on = false; });
  const loop = () => {
    const k = calm ? 1 : 0.36;
    P[0].x = m.x; P[0].y = m.y;
    for (let i = 1; i < N; i++) { P[i].x += (P[i - 1].x - P[i].x) * k; P[i].y += (P[i - 1].y - P[i].y) * k; }
    let d = 'M' + P[0].x.toFixed(1) + ' ' + P[0].y.toFixed(1);
    for (let i = 1; i < N - 1; i++) d += ' Q' + P[i].x.toFixed(1) + ' ' + P[i].y.toFixed(1) + ' ' + ((P[i].x + P[i + 1].x) / 2).toFixed(1) + ' ' + ((P[i].y + P[i + 1].y) / 2).toFixed(1);
    red.setAttribute('d', d); yel.setAttribute('d', d); glow.setAttribute('d', d);
    rg += ((m.hov ? 1 : 0) - rg) * (calm ? 1 : 0.2);
    bead.setAttribute('transform', 'translate(' + m.x.toFixed(1) + ' ' + m.y.toFixed(1) + ') scale(' + (1 - rg * 0.25).toFixed(3) + ')');
    ring.setAttribute('r', (7 + rg * 15).toFixed(2)); ring.setAttribute('opacity', (rg * 0.85).toFixed(2));
    pulseC.setAttribute('cx', String(px)); pulseC.setAttribute('cy', String(py)); pulseC.setAttribute('r', (8 + (1 - pulse) * 34).toFixed(1)); pulseC.setAttribute('opacity', (pulse * 0.9).toFixed(2));
    pulse *= calm ? 0 : 0.9;
    svg.style.opacity = m.on && !m.text ? '1' : '0';
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
