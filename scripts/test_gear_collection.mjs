import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { normalizeSearch, readFilters, queryCollection, filterSearch, collectionReturn } from '../assets/js/gear-collection-core.mjs';

const model = JSON.parse(readFileSync(new URL('../public/gear/collection.v1.json', import.meta.url)));
const schema = JSON.parse(readFileSync(new URL('../static/schemas/keeps-public-collection.v1.json', import.meta.url)));
const base = readFilters('', model.items);
const fixtures = [
  { id: 'white', name: 'White Belkin foldable', summary: '', category: 'Charging & cables', status: 'in-use', tags: ['qi2'], notedAt: '2026-10-06' },
  { id: 'sand', name: 'Sand Belkin dock', summary: '', category: 'Charging & cables', status: 'in-use', tags: ['qi2'], notedAt: '2026-10-05' },
  { id: 'camera', name: 'Camera', summary: '', category: 'Camera', status: 'in-use', tags: [], notedAt: '2026-05-18' },
  { id: 'sold', name: 'Old camera', summary: '', category: 'Camera', status: 'sold', tags: [], notedAt: '2026-03-03' },
];

test('status and category intersect; sold gear is excluded from the default collection', () => {
  assert.equal(queryCollection(fixtures, base).length, 3);
  assert.deepEqual(queryCollection(fixtures, { ...base, category: 'Camera', status: 'sold' }).map(x => x.id), ['sold']);
  assert.deepEqual(queryCollection(fixtures, { ...base, category: 'Camera' }).map(x => x.id), ['camera']);
});

test('search handles case, accents and multiple terms, including empty results', () => {
  assert.equal(normalizeSearch('  CAFÉ '), 'cafe');
  assert.deepEqual(queryCollection(fixtures, { ...base, q: 'WHITE BELKIN' }).map(x => x.id), ['white']);
  assert.equal(queryCollection(fixtures, { ...base, q: 'no-such-gear' }).length, 0);
});

test('filters round-trip special characters and ignore invalid URL choices', () => {
  const filters = { ...base, q: 'white & foldable', category: 'Charging & cables', status: 'all', sort: 'name' };
  assert.deepEqual(readFilters(filterSearch(filters), fixtures), filters);
  assert.deepEqual(readFilters('?category=private&status=unknown&sort=price', fixtures), base);
});

test('return navigation accepts filtered collection/setup links, never external or credentialed links', () => {
  assert.equal(collectionReturn('https://example.com/gear/?q=white', 'https://example.com').url, '/gear/?q=white');
  assert.equal(collectionReturn('https://example.com/gear/setups/desk/', 'https://example.com').label, 'Setup');
  for (const url of ['https://other.example/gear/', 'javascript:alert(1)', 'https://user:pass@example.com/gear/', 'https://example.com/gear/sony-a7-v/', 'https://example.com/gear/%2f%2fother.example/']) assert.equal(collectionReturn(url, 'https://example.com'), null);
});

test('the public export has only schema-approved fields and unique approved note identities', () => {
  assert.equal(model.schemaVersion, 1);
  assert.ok(model.items.length > 0);
  assert.equal(new Set(model.items.map(x => x.id)).size, model.items.length);
  const definitions = [[model, schema], [model.collection, schema.properties.collection], ...model.items.flatMap(x => [[x, schema.$defs.item], [x.image, schema.$defs.item.properties.image]]), ...model.setups.map(x => [x, schema.$defs.setup])];
  for (const [value, definition] of definitions) {
    assert.ok(Object.keys(value).every(key => key in definition.properties));
    for (const field of definition.required) assert.ok(field in value, field);
  }
  for (const item of model.items) {
    assert.ok(existsSync(new URL('../public' + item.noteURL + 'index.html', import.meta.url)));
    assert.ok(existsSync(new URL('../public' + item.image.url, import.meta.url)));
    assert.ok(item.image.alt);
  }
  for (const setup of model.setups) {
    assert.equal(new Set(setup.itemIDs).size, setup.itemIDs.length);
    assert.ok(setup.itemIDs.every(id => model.items.some(item => item.id === id)));
    assert.ok(!setup.itemIDs.includes('osmo-pocket-3'));
    assert.ok(existsSync(new URL('../public' + setup.url + 'index.html', import.meta.url)));
  }
  const display = model.items.find(x => x.id === 'apple-studio-display');
  assert.equal(display.purchased, '2023-04-15');
  const arm = model.items.find(x => x.id === 'ergotron-lx-pro');
  assert.equal(arm.quantity, 2);
  assert.match(arm.image.url, /product-white\.jpg$/);
  assert.equal(model.items.find(x => x.id === 'osmo-pocket-3').status, 'sold');
  assert.equal(existsSync(new URL('../public/post/studio-display-applecare-repair/index.html', import.meta.url)), false);
});
