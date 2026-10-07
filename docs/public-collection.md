# Keeps on the blog

`/gear/` is the public Collection viewer. `/gear/setups/` groups the same entries
into curated setups. Existing gear-note URLs remain the item detail pages.

Hugo creates `/gear/collection.v1.json` through the explicit allowlist in
`layouts/partials/gear/public-collection.html`. Its contract is
`static/schemas/keeps-public-collection.v1.json`. It contains display fields already
approved for the blog: names, categories, tags, public summaries, cover photos,
status, quantity, note/product links, and dates. Prices, receipts, identifiers,
warranty information, raw private notes and use histories are not exported as
fields. Existing public summaries can mention a purchase story or price.

This version uses blog front matter as its source. A future Keeps export should
create this public projection from explicitly selected items and reviewed public
summaries/photos. A Keeps backup is not a public collection export. There is no
CloudKit connection, private import, account or write API in this viewer.

An entry defaults to `ownershipStatus: in-use`; set `sold` or `retired` when its
public record changes. `quantity` defaults to 1 and counts copies of the entry.
UI counts are entry counts, rather than a sum of physical units. Publication
dates remain distinct from `purchased` dates, including the Studio Display.

`data/gear-setups.yaml` names setups and references stable item IDs derived from
gear-note URLs. A missing referenced item fails the build. Create matching pages
under `content/gear/setups/` with a `setupID` and `layout: setup`. An item can occur
in multiple setups. Keep grouping claims supported by its public note.

Search/category/status/sort choices live in the Collection URL. Reloading or
browser Back restores them. Gear-note breadcrumbs return to a same-origin
Collection or Setup referrer, including its filters; a direct visit returns to
Collection. The viewer uses semantic links and native form controls.

Validation after a Hugo build:

```sh
node --test scripts/test_gear_collection.mjs
```

This checks combined filtering, URL restoration, safe return navigation, public
schema keys, published links, setup membership, and the approved ownership facts.
