// src/render.js
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MEDI = '<img class="medi-logo" src="assets/logo.jpeg?v=2" alt="AURA Shishabar">';
const LOGO_BIG = '<img class="logo logo-lg" src="assets/logo.jpeg?v=2" alt="AURA Shishabar">';
const LOGO_SM = '<img class="logo logo-sm" src="assets/logo.jpeg?v=2" alt="AURA Shishabar">';

function imgFor(url, name, cls, w, h) {
  if (!url) return '';
  const fb = `https://picsum.photos/seed/${encodeURIComponent(name)}/${w}/${h}?grayscale`;
  return `<img class="${cls}" src="${escapeHtml(url)}" onerror="this.onerror=null;this.src='${fb}'" alt="">`;
}

export function renderCover() {
  return `<div class="page page-cover" data-density="hard"><div class="pg cover">` +
    LOGO_BIG +
    `<div class="cap">Getränke &amp; Shishakarte</div>` +
    `<div class="tap">scroll · drag · swipe</div></div></div>`;
}

export function renderBack() {
  return `<div class="page page-cover" data-density="hard"><div class="pg cover">` +
    LOGO_BIG +
    `<div class="cap">Vielen Dank</div></div></div>`;
}

function circle(cat, jumpIndex) {
  const img = imgFor(cat.photo, cat.name, 'circ-img', 300, 300);
  return `<div class="circ" data-jump="${jumpIndex}">${img}<span class="lb">${escapeHtml(cat.name)}</span></div>`;
}

export function renderIndex(menu, helpers) {
  const featured = menu.categories.find(c => c.featured);
  const grid = menu.categories.filter(c => c !== featured);
  const cols = helpers.pickColumns(grid.length);
  const { top, rest } = helpers.splitTopRemainder(grid, cols);
  const pageIndex = cat => menu.categories.indexOf(cat) + 2; // cover=0, index=1
  const feat = featured
    ? `<div class="feat" data-jump="${pageIndex(featured)}">` +
      `${imgFor(featured.photo, featured.name, 'circ-img', 400, 400)}` +
      `<span class="t">${escapeHtml(featured.name)}</span></div>`
    : '';
  const topHtml = top.length
    ? `<div class="toprow">${top.map(c => circle(c, pageIndex(c))).join('')}</div>` : '';
  const gridHtml = `<div class="grid grid-c${cols}">${rest.map(c => circle(c, pageIndex(c))).join('')}</div>`;
  return `<div class="page" data-density="hard"><div class="pg home">` +
    LOGO_SM +
    `<div class="hti">WÄHLE EINE KATEGORIE</div>${feat}${topHtml}${gridHtml}</div></div>`;
}

export function renderCategoryPage(cat) {
  const photo = imgFor(cat.photo, cat.name, 'photoimg', 600, 900);
  const price = cat.price
    ? `<div class="price">${escapeHtml(cat.price)}${cat.priceNote ? `<small>${escapeHtml(cat.priceNote)}</small>` : ''}</div>`
    : '';
  let body;
  if (cat.layout === 'flavors') {
    body = `<div class="flavs">` +
      cat.items.map(it => `<div class="flav"><span class="dot"></span>${escapeHtml(it.name)}</div>`).join('') +
      `</div>`;
  } else {
    body = `<div class="list">` +
      cat.items.map(it =>
        `<div class="row"><div class="t"><span class="nm">${escapeHtml(it.name)}</span>` +
        `${it.price ? `<span class="pr">${escapeHtml(it.price)}</span>` : ''}</div>` +
        `${it.description ? `<div class="ds">${escapeHtml(it.description)}</div>` : ''}</div>`).join('') +
      `</div>`;
  }
  return `<div class="page" data-density="hard"><div class="pg">${photo}<div class="vign"></div>` +
    `<div class="phead">${MEDI}<span class="backpill" data-jump="1">‹ ZURÜCK ZUR STARTSEITE</span>${MEDI}</div>` +
    `<div class="ttl">${escapeHtml(cat.name)}</div>${price}${body}</div></div>`;
}

export function renderPages(menu, helpers) {
  const pages = [renderCover(), renderIndex(menu, helpers)];
  menu.categories.forEach(c => pages.push(renderCategoryPage(c)));
  pages.push(renderBack());
  return pages;
}
