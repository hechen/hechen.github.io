export function normalizeSearch(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en').trim();
}

export function readFilters(search, items) {
  const params = new URLSearchParams(search);
  const category = params.get('category') || '';
  const status = params.get('status') || 'in-use';
  return {
    q: (params.get('q') || '').trim(),
    category: items.some(item => item.category === category) ? category : '',
    status: status === 'all' || items.some(item => item.status === status) ? status : 'in-use',
    sort: params.get('sort') === 'name' ? 'name' : 'recent',
  };
}

export function queryCollection(items, filters) {
  const terms = normalizeSearch(filters.q).split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    const text = normalizeSearch([item.name, item.category, item.summary, item.status, ...item.tags].join(' '));
    return terms.every(term => text.includes(term));
  }).sort((a, b) => filters.sort === 'name'
    ? a.name.localeCompare(b.name, 'en')
    : b.notedAt.localeCompare(a.notedAt));
}

export function filterSearch(filters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.status !== 'in-use') params.set('status', filters.status);
  if (filters.sort !== 'recent') params.set('sort', filters.sort);
  return params.toString();
}

export function collectionReturn(referrer, origin) {
  try {
    const url = new URL(referrer);
    if (url.origin !== origin || url.username || url.password) return null;
    if (!/^\/gear\/(?:setups\/(?:[a-z0-9-]+\/)?)?$/.test(url.pathname)) return null;
    return {
      url: url.pathname + url.search + url.hash,
      label: url.pathname === '/gear/' ? 'Collection' : url.pathname === '/gear/setups/' ? 'Setups' : 'Setup',
    };
  } catch {
    return null;
  }
}
