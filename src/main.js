// src/main.js
import { CONFIG } from './config.js';
import { fetchSheetCsv } from './sheet.js';
import { parseCsv } from './csv.js';
import { buildMenu } from './model.js';
import { pickColumns, splitTopRemainder } from './layout.js';
import { renderPages } from './render.js?v=5';
import { initFlipbook } from './flip.js?v=7';

async function loadMenu() {
  if (CONFIG.sheetId) {
    try {
      const [catsCsv, itemsCsv] = await Promise.all([
        fetchSheetCsv(CONFIG.sheetId, CONFIG.tabs.categories),
        fetchSheetCsv(CONFIG.sheetId, CONFIG.tabs.items)
      ]);
      return buildMenu(parseCsv(catsCsv), parseCsv(itemsCsv));
    } catch (e) {
      console.warn('Sheet load failed, using bundled fallback:', e);
    }
  }
  const res = await fetch(CONFIG.fallbackUrl);
  const data = await res.json();
  return buildMenu(data.categories, data.items);
}

async function main() {
  const book = document.getElementById('book');
  try {
    const menu = await loadMenu();
    const pages = renderPages(menu, { pickColumns, splitTopRemainder });
    initFlipbook(book, pages);
  } catch (e) {
    console.error(e);
    book.innerHTML = '<p style="color:#e6c878;text-align:center;padding:48px">Menü konnte nicht geladen werden.</p>';
  }
}
main();
