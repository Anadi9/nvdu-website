// Reading light (Night or Paper, remembered) and the glossary popover. Ported from the prototype's read.js.
export function initReading(defaultPaper: boolean): void {
  const root = document.querySelector<HTMLElement>('.vroot'); if (!root) return;
  let on = defaultPaper;
  try { const v = localStorage.getItem('nv-read'); if (v) on = v === 'paper'; } catch { /* storage blocked */ }
  const apply = () => {
    root.classList.toggle('paper', on);
    document.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.mode === 'paper') === on)));
  };
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    on = b.dataset.mode === 'paper'; apply();
    try { localStorage.setItem('nv-read', on ? 'paper' : 'night'); } catch { /* storage blocked */ }
  }));
  apply();
}

const GL: Record<string, [string, string, string]> = {
  patra: ['पत्र', 'patra · PUT-ruh', 'A leaf of a manuscript. A pothi is a stack of them, kept loose between two boards.'],
  pothi: ['पोथी', 'pothī · POH-tee', 'A manuscript of loose leaves, wrapped in cloth and tied with a cord.'],
  suchi: ['सूची', 'sūcī · SOO-chee', 'A list or register. Here, the Vedshala’s register of every bundle by its number.'],
  danda: ['दण्ड', 'daṇḍa · DUN-duh', 'The upright stroke that closes a phrase. Two of them, ॥, close a verse.'],
  tithi: ['तिथि', 'tithi · TI-thee', 'A lunar day: the time the Moon takes to gain 12° on the Sun. Thirty make a lunar month.'],
  nakshatra: ['नक्षत्र', 'nakṣatra · NUCK-shuh-truh', 'One of the 27 mansions of the Moon, each 13° 20′ of the sky, marked by a junction star.'],
  amavasya: ['अमावस्या', 'amāvasyā · uh-MAA-vus-yaa', 'The new Moon, when the Moon and Sun stand together. The darkest nights of the month.'],
  panchanga: ['पञ्चाङ्ग', 'pañcāṅga · PUN-chaang', 'The almanac: its five limbs are tithi, weekday, nakshatra, yoga and karaṇa.'],
  purnima: ['पूर्णिमा', 'pūrṇimā · POOR-ni-maa', 'The full Moon, when the Moon stands opposite the Sun.'],
};

// a dotted term opens its meaning beside it; Esc or a tap elsewhere closes it, and focus returns to the term
export function initGlossary(): void {
  const root = document.querySelector<HTMLElement>('.vroot'), pop = document.querySelector<HTMLElement>('.gpop'); if (!root || !pop) return;
  let open: HTMLElement | null = null;
  const close = () => { if (open) open.setAttribute('aria-expanded', 'false'); open = null; pop.hidden = true; };
  const show = (b: HTMLElement) => {
    const g = GL[b.dataset.gt || '']; if (!g) return;
    if (open === b) { close(); return; } close(); open = b; b.setAttribute('aria-expanded', 'true');
    pop.querySelector('.gpop-d')!.textContent = g[0]; pop.querySelector('.gpop-i')!.textContent = g[1]; pop.querySelector('.gpop-m')!.textContent = g[2];
    pop.hidden = false;
    const rb = root.getBoundingClientRect(), bb = b.getBoundingClientRect(), w = pop.offsetWidth;
    const x = Math.max(16, Math.min(rb.width - w - 16, bb.left - rb.left + bb.width / 2 - w / 2));
    pop.style.left = x + 'px'; pop.style.top = (bb.bottom - rb.top + 10) + 'px';
  };
  root.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null, b = t && t.closest<HTMLElement>('.gt');
    if (b) { e.preventDefault(); show(b); } else if (!(t && t.closest('.gpop'))) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { const b = open; close(); b.focus(); } });
}
