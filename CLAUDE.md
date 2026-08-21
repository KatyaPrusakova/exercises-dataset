# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **static exercise dataset** plus a small **Vercel-hosted JSON API** built on top of it. Content:

- `data/exercises.json` — the canonical dataset (17 MB, 1,324 records, single JSON array, 10 languages)
- `data/exercises.schema.json` — JSON Schema (Draft 2020-12) that fully describes and validates each record
- `images/` — 1,324 × 180×180 JPG thumbnails
- `videos/` — 1,324 × 180×180 animation GIFs
- `index.html` — standalone client-side browser (see caveat below)
- `setup.html` — developer setup guide (DB SQL, API snippets, LLM prompt)
- `api/` — Vercel serverless routes (`GET /api/exercises`, `GET /api/exercises/:id`, `GET /api/facets`)
- `scripts/build-api-data.mjs` — build step that derives the API's slim data files from the canonical JSON

## Common commands

```bash
npm install                  # install @vercel/node + typescript types (dev only)
npm run build                # regenerate data/exercises.en.json + data/facets.en.json from data/exercises.json
npm run dev                  # `vercel dev` — local API + static server at :3000 (runs build first)
```

- `index.html` — open directly in a browser (works from `file://`); the dataset is embedded inline, no server needed.
- `setup.html` — the "generate SQL" action `fetch()`s `data/exercises.json`, so it needs an HTTP server. Use `npm run dev` or `python3 -m http.server 8000`.

## Validating changes to the dataset

The schema is authoritative — validate `data/exercises.json` against `data/exercises.schema.json` after any edit:

```bash
# uses ajv-cli; install once with: npm i -g ajv-cli ajv-formats
ajv validate -s data/exercises.schema.json -d data/exercises.json --spec=draft2020 -c ajv-formats
```

## Architecture notes that aren't obvious from a file listing

### The API's data files are derived, not canonical

`data/exercises.en.json` (~1.7 MB, English-only, ~90% smaller than the source) and `data/facets.en.json` are **generated** by `scripts/build-api-data.mjs` from `data/exercises.json`. They are `.gitignore`d and rebuilt on every Vercel deploy via `vercel.json`'s `buildCommand`. Never edit them by hand — edit `data/exercises.json` (the canonical source) and rerun `npm run build`.

The API routes bundle these files at build time via TypeScript JSON imports (`import exercises from '../data/exercises.en.json'`) — this is why esbuild ends up shipping them with the serverless function; do not switch to `fs.readFile` without also adding an `includeFiles` glob to `vercel.json`.

### Absolute media URLs in API responses

Every exercise the API returns has its `image` and `gif_url` rewritten to absolute URLs using the request's `Host` header (or `PUBLIC_BASE_URL` env var if set). This lets the mobile app consume URLs directly. If you change how media is served (e.g. move to Vercel Blob), update `withAbsoluteMedia` in `api/exercises.ts` and the equivalent in `api/exercises/[id].ts`.

### Cache headers matter for cost

`vercel.json` sets `Cache-Control: public, max-age=31536000, immutable` on `/videos/*` and `/images/*` — media filenames include a content hash (`media_id`), so they can be cached forever. API JSON gets `s-maxage=300, stale-while-revalidate=600` at Vercel's edge. If you introduce mutable media paths or per-user data, revisit these headers before you accidentally cache stale content for a year.

### `index.html` embeds the entire dataset inline

Around line 1172, `index.html` contains `const EXERCISES = [ ... ]` with the full 1,324-record array pasted in. That is why the file is ~16 MB. Consequences:

- **Do not `Read` the whole file** — read a range, or grep first to find what you need.
- **`data/exercises.json` and the inline copy in `index.html` are duplicates.** If you change one, you must regenerate the other or they will drift. `setup.html` reads the JSON file at runtime; `index.html` does not.
- Editing UI/CSS in `index.html` is fine — the embedded data blob is a single long line before the `</script>` tag; leave it alone.

### Media filename convention

Every media file is named `{id}-{media_id}.{ext}` — the same `id` and `media_id` from the exercise record, joined by a hyphen (e.g. record `id: "0001", media_id: "2gPfomN"` → `images/0001-2gPfomN.jpg` + `videos/0001-2gPfomN.gif`). The `image` and `gif_url` fields in each record must match the on-disk filename exactly. When adding an exercise you must add both the JPG and the GIF and update both path fields.

### `category` vs `body_part`

They are semantically the same, but the schema treats them differently: `body_part` is a fixed enum (`back`, `cardio`, `chest`, `lower arms`, `lower legs`, `neck`, `shoulders`, `upper arms`, `upper legs`, `waist`), `category` is a free-form string that mirrors it. Keep the two in sync.

### Multilingual fields

`instructions` and `instruction_steps` **must** contain all ten language keys: `en, es, it, tr, ru, zh, hi, pl, ko, fr`. The schema `required` list enforces this; partial-language additions will fail validation. `instruction_steps.<lang>` is the same text as `instructions.<lang>` split into an ordered array of steps.

### Records are `additionalProperties: false`

The exercise object rejects unknown fields — do not add ad-hoc metadata to a record without also adding it to `data/exercises.schema.json`.

## Licensing constraint that affects code changes

Exercise **media** (`images/`, `videos/`) is © Gym visual, redistributed here **only at 180×180** and only with attribution. Do not:
- resize, re-encode, or upscale the media,
- drop the `attribution` field from records,
- remove the `© Gym visual — https://gymvisual.com/` notice from `NOTICE.md` / `LICENSE` / UI.

The MIT license in `LICENSE` covers only code, dataset structure, and instruction text — see `NOTICE.md` and the "MEDIA EXCEPTION" section of `LICENSE`.
