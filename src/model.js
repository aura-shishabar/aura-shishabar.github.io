// src/model.js
const truthy = v => /^(true|1|yes|ja|x)$/i.test(String(v ?? '').trim());

export function buildMenu(categoriesRows, itemsRows) {
  const categories = (categoriesRows || [])
    .filter(c => (c.Name || '').trim() !== '')
    .map(c => ({
      name: (c.Name || '').trim(),
      photo: (c.PhotoURL || '').trim(),
      price: (c.Price || '').trim(),
      priceNote: (c.PriceNote || '').trim(),
      layout: (c.Layout || '').trim().toLowerCase() === 'flavors' ? 'flavors' : 'list',
      featured: truthy(c.Featured),
      items: []
    }));
  const byName = new Map(categories.map(c => [c.name.toLowerCase(), c]));
  (itemsRows || []).forEach(it => {
    const cat = byName.get((it.Category || '').trim().toLowerCase());
    if (!cat) return;
    const avail = it.Available;
    if (avail !== undefined && String(avail).trim() !== '' && !truthy(avail)) return;
    const name = (it.Name || '').trim();
    if (!name) return;
    cat.items.push({
      name,
      price: (it.Price || '').trim(),
      description: (it.Description || '').trim()
    });
  });
  return { categories };
}
