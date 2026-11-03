# Content

Edit these files to change what the pages say; no code changes needed. Rebuild (`npm run build`) to see the change.

| File | Page | What it holds |
|---|---|---|
| `register.json` | Manuscripts, the register | One row per bundle: `no` (Devanagari number), `title`, `branch` (Siddhānta, Saṃhitā or Horā), `mat` (material), `status` (`Being surveyed`, `Published`, `Awaiting a sponsor`, `Being photographed`). The row whose `no` is `४६४२` links to its record. |
| `journal.json` | Journal | One entry per note: `kind` (label shown), `k` (filter: Sky guides, From the collection, Explainers, News), `title`, `excerpt`, `read`, `href`, `daysAgo` (placeholder date until real dates are set). |
| `records/4642.catalogue.json` | Record of folio ४६४२ | The catalogue entry: `k` (field) and `v` (value). |
| `records/4642.reading.json` | Record of folio ४६४२ | The reading in four layers (`dev`, `iast`, `hi`, `en`): three lines each, the `lang`, and a source note. |

Text in square brackets is a placeholder for the family to fill. Keep "to be confirmed" notes until the family confirms.
