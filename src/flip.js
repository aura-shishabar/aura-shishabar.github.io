// src/flip.js — wires StPageFlip (CDN global) to the rendered pages.
import { playFlip } from './sound.js';

export function initFlipbook(bookEl, pagesHtml, opts = {}) {
  bookEl.innerHTML = pagesHtml.join('');
  const PF = (window.St && window.St.PageFlip) ? window.St.PageFlip : window.PageFlip;
  if (!PF) throw new Error('StPageFlip not loaded');
  const iw = Math.max(window.innerWidth || 0, 320);
  const single = iw < (opts.singleBreakpoint || 700);
  const wide = Math.min(iw - 24, opts.maxWidth || 860);
  const pw = Math.max(single ? Math.min(iw - 28, 440) : Math.floor(wide / 2), 200);
  const ph = Math.round(pw * 1.5);
  const pf = new PF(bookEl, {
    width: pw, height: ph, size: 'fixed', showCover: true,
    usePortrait: single, mobileScrollSupport: true, drawShadow: false, flippingTime: 600
  });
  pf.loadFromHTML(bookEl.querySelectorAll('.page'));

  // Fix StPageFlip 2.0.7 portrait backward-flip. The engine's flipPrev grabs the fold at
  // x:10, assuming the page block starts at x=0. That holds in landscape (rect.left===0) but
  // not in portrait (rect.left<0), so on mobile the backward fold starts off-page and the
  // page slides in instead of folding. Mirror flipNext's geometry by adding rect.left.
  // In landscape rect.left===0, so this is identical to the original (no desktop regression).
  // Guarded: no-ops if the (version-pinned) internals ever change.
  const fc = pf.flipController;
  if (fc && fc.render && typeof fc.flip === 'function') {
    fc.flipPrev = function (corner) {
      const r = this.render.getRect();
      this.flip({ x: r.left + 10, y: corner === 'top' ? 1 : r.height - 2 });
    };
  }

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
  return pf;
}
