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
    usePortrait: single, mobileScrollSupport: false, disableFlipByClick: true, drawShadow: false, flippingTime: 600
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

  // Portrait backward-flip "slide", part 2. In portrait + BACK the engine assigns BOTH the
  // flipping page and the bottom page to pages[e-1] (the incoming page), so the current page is
  // never drawn beneath the turn and the incoming page wipes in over nothing. Return the current
  // page as the bottom page for portrait+BACK so the incoming page folds *over* it. Combined with
  // the drawBottomPage override above, a backward turn now folds like a forward turn.
  const pc = pf.getPageCollection && pf.getPageCollection();
  if (pc && typeof pc.getBottomPage === 'function' && pc.render && pc.render.getOrientation) {
    const origGetBottom = pc.getBottomPage.bind(pc);
    pc.getBottomPage = function (dir) {
      if (this.render.getOrientation() === 'portrait' && dir === 1 /* FlipDirection.BACK */) {
        return this.pages[this.currentSpreadIndex] || origGetBottom(dir);
      }
      return origGetBottom(dir);
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
  // On touch, mobileScrollSupport:false makes the engine preventDefault() touchstart, which
  // suppresses the synthesized click — so the click handler above never fires on a phone, and
  // tapping a category did nothing. Detect a stationary tap and run the same data-jump jump;
  // real drags/swipes set tMoved and fall through to the engine's flip handling.
  let txs = 0, tys = 0, tMoved = false;
  bookEl.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]; txs = t.clientX; tys = t.clientY; tMoved = false;
  }, { passive: true });
  bookEl.addEventListener('touchmove', (e) => {
    const t = e.changedTouches[0];
    if (Math.abs(t.clientX - txs) > 10 || Math.abs(t.clientY - tys) > 10) tMoved = true;
  }, { passive: true });
  bookEl.addEventListener('touchend', (e) => {
    if (tMoved) return;
    const j = e.target.closest && e.target.closest('[data-jump]');
    if (j) { e.preventDefault(); pf.flip(parseInt(j.getAttribute('data-jump'), 10)); }
  }, { passive: false });
  return pf;
}
