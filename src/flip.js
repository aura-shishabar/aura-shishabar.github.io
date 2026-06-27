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

  // Fix StPageFlip 2.0.7 portrait backward-flip "slide". In portrait + BACK the engine's
  // HTMLRender.drawBottomPage() deliberately skips drawing the page underneath the turning
  // page, so on mobile the incoming page has nothing to fold over and just wipes in from the
  // left. Override it to always draw the bottom page (the way forward and landscape already
  // do), so a backward turn folds like a forward turn. Only the portrait+back path changes;
  // method/property names are pinned to page-flip@2.0.7 and guarded so a future bump no-ops.
  const render = pf.getRender && pf.getRender();
  if (render && typeof render.drawBottomPage === 'function') {
    render.drawBottomPage = function () {
      if (this.bottomPage === null) return;
      const density = this.flippingPage != null ? this.flippingPage.getDrawingDensity() : null;
      this.bottomPage.getElement().style.zIndex = (this.getSettings().startZIndex + 3).toString(10);
      this.bottomPage.draw(density);
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
