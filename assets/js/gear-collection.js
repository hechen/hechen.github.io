import { readFilters, queryCollection, filterSearch, collectionReturn } from './gear-collection-core.mjs';

const returnLink = document.querySelector('[data-gear-return]');
const previous = collectionReturn(document.referrer, location.origin);
if (returnLink && previous) {
  returnLink.href = previous.url;
  returnLink.querySelector('[data-gear-return-label]').textContent = previous.label;
}

const root = document.querySelector('[data-gear-collection]');
if (root) {
  const model = JSON.parse(document.getElementById('gear-public-data').textContent);
  if (model.schemaVersion !== 1) throw new Error('Unsupported public collection version');
  const tools = root.querySelector('[data-gear-tools]');
  const grid = root.querySelector('#gear-entries');
  const count = root.querySelector('[data-gear-count]');
  const empty = root.querySelector('[data-gear-empty]');
  const resets = [...root.querySelectorAll('[data-gear-reset]')];
  const cards = new Map([...grid.children].map(card => [card.dataset.gearId, card]));

  function render(filters, updateURL = true) {
    const matching = queryCollection(model.items, filters);
    const visible = new Set(matching.map(item => item.id));
    cards.forEach((card, id) => { card.hidden = !visible.has(id); });
    matching.forEach(item => grid.append(cards.get(item.id)));
    count.textContent = `${matching.length} of ${model.items.length} entries`;
    empty.hidden = matching.length > 0;
    grid.hidden = matching.length === 0;
    const search = filterSearch(filters);
    resets.forEach(button => { button.hidden = !search; });
    if (updateURL) history.replaceState(null, '', location.pathname + (search ? '?' + search : ''));
  }

  function restore() {
    const filters = readFilters(location.search, model.items);
    Object.entries(filters).forEach(([key, value]) => { tools.elements.namedItem(key).value = value; });
    render(filters, false);
  }

  function change() {
    render(Object.fromEntries(new FormData(tools)));
  }

  tools.addEventListener('submit', event => { event.preventDefault(); change(); });
  tools.elements.namedItem('q').addEventListener('input', change);
  [...tools.querySelectorAll('select')].forEach(select => select.addEventListener('change', change));
  resets.forEach(button => button.addEventListener('click', () => {
    const filters = readFilters('', model.items);
    Object.entries(filters).forEach(([key, value]) => { tools.elements.namedItem(key).value = value; });
    render(filters);
    tools.elements.namedItem('q').focus();
  }));
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
  tools.hidden = false;
}
