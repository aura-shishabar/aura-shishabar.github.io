// src/flip.js — wires StPageFlip (CDN global) to the rendered pages.
import { playFlip } from './sound.js';

export function initFlipbook(bookEl, pagesHtml, opts = {}) {
  bookEl.innerHTML = pagesHtml.join('');
  const PF = (window.St && window.St.PageFlip) ? window.St.PageFlip : window.PageFlip;
  if (!PF) throw new Error('StPageFlip not loaded');
  const iw = Math.max(window.innerWidth || 0, 320);
  // ?mode=single|two forces the layout (QA); otherwise auto by viewport width.
  const _mode = (typeof location !== 'undefined' && location.search)
    ? new URLSearchParams(location.search).get('mode') : '';
  const single = _mode === 'single' ? true : (_mode === 'two' ? false : iw < (opts.singleBreakpoint || 700));
  const wide = Math.min(iw - 24, opts.maxWidth || 860);
  const pw = Math.max(single ? Math.min(iw - 28, 440) : Math.floor(wide / 2), 200);
  const ph = Math.round(pw * 1.5);
  const pf = new PF(bookEl, {
    width: pw, height: ph, size: 'fixed', showCover: true,
    usePortrait: single, mobileScrollSupport: true, drawShadow: false, flippingTime: 600
  });
  pf.loadFromHTML(bookEl.querySelectorAll('.page'));
  pf.on('changeState', (e) => { if (e.data === 'flipping') playFlip(); });
  let lock = false;
  bookEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (lock) return;
    lock = true; setTimeout(() => { lock = false; }, 680);
    if (e.deltaY > 0) pf.flipNext(); else pf.flipPrev();
  }, { passive: false });
  bookEl.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (j) pf.flip(parseInt(j.getAttribute('data-jump'), 10));
  });
  try { window.__pf = pf; } catch (e) { /* exposed for QA */ }
  return pf;
}
