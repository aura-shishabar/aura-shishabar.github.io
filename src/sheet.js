// src/sheet.js
export function gvizCsvUrl(sheetId, tab) {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

async function defaultFetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchSheetCsv(sheetId, tab, fetchText = defaultFetchText) {
  return fetchText(gvizCsvUrl(sheetId, tab));
}
