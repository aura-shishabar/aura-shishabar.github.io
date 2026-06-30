// src/flip.js — wires StPageFlip (CDN global) to the rendered pages.
import { playFlip, toggleMute, isMuted } from './sound.js?v=2';

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }
}

function wireToolbar(pf) {
  const tb = document.getElementById('toolbar');
  if (!tb) return;
  const acts = {
    first: () => pf.flip(0),
    prev: () => pf.flipPrev(),
    home: () => pf.flip(1),
    next: () => pf.flipNext(),
    last: () => pf.flip(Math.max(0, pf.getPageCount() - 1)),
    mute: (b) => b.classList.toggle('muted', toggleMute()),
    full: () => toggleFullscreen(),
  };
  tb.querySelectorAll('button[data-act]').forEach((b) => {
    b.addEventListener('click', () => { const f = acts[b.dataset.act]; if (f) f(b); });
  });
  const mb = tb.querySelector('.mute');
  if (mb) mb.classList.toggle('muted', isMuted());
}

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

  // StPageFlip turns the page on ANY plain tap: its userStop runs `flip(clickPos)` whenever the
  // gesture wasn't a drag. That stacks with our own [data-jump] navigation below and overshoots
  // by one (tap SHISHA → lands on COCKTAILS). Suppress the tap-to-flip while keeping swipe/drag
  // (stopMove on real moves). Guarded; property names pinned to page-flip@2.0.7.
  if (typeof pf.userStop === 'function') {
    pf.userStop = function (point, skip) {
      if (this.isUserTouch) {
        this.isUserTouch = false;
        if (!skip && this.isUserMove && this.flipController) this.flipController.stopMove();
      }
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
  wireToolbar(pf);
  try { window.__pf = pf; } catch (e) { /* exposed for QA */ }
  return pf;
}
