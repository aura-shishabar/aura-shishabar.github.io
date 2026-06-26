// src/layout.js
export function pickColumns(n) {
  if (n <= 6) return 2;
  if (n <= 9) return 3;
  return 4;
}

export function splitTopRemainder(items, cols) {
  const arr = items.slice();
  const r = cols > 0 ? arr.length % cols : 0;
  const top = r ? arr.slice(0, r) : [];
  const rest = r ? arr.slice(r) : arr;
  return { top, rest, cols };
}
