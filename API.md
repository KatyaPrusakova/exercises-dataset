# Exercises API

Public HTTP API for the 1,324-exercise fitness dataset. Read-only, no auth.

**Base URL:** `https://exercises-dataset-silk.vercel.app`

- All responses are JSON with `Content-Type: application/json`.
- CORS is open (`Access-Control-Allow-Origin: *`).
- All exercise responses include **absolute** URLs in `image` and `gif_url` fields — the client can use them directly, no proxying.
- Instructions are English only.
- Media (`/videos/*.gif`, `/images/*.jpg`) is © Gym visual and served at `180×180`. **Apps must display the `attribution` field alongside the media.**

## Data model

Every exercise object has this shape:

```jsonc
{
  "id": "0025",                                    // 4-digit zero-padded string
  "name": "barbell bench press",
  "category": "chest",                             // mirrors body_part
  "body_part": "chest",                            // enum, see /api/exercises/bodyPartList
  "equipment": "barbell",                          // see /api/exercises/equipmentList
  "target": "pectorals",                           // primary muscle, see /api/exercises/targetList
  "muscle_group": "chest",
  "secondary_muscles": ["triceps", "shoulders"],
  "instructions": "Lie flat on your back...",      // English, single string
  "instruction_steps": ["Step 1...", "Step 2..."], // English, ordered array
  "media_id": "EIeI8Vf",
  "image": "https://exercises-dataset-silk.vercel.app/images/0025-EIeI8Vf.jpg",
  "gif_url": "https://exercises-dataset-silk.vercel.app/videos/0025-EIeI8Vf.gif",
  "attribution": "© Gym visual — https://gymvisual.com/"
}
```

Paginated list responses have this envelope:

```jsonc
{
  "total": 163,           // total matching after filters, before pagination
  "limit": 50,
  "offset": 0,
  "count": 50,            // items in this response
  "items": [ /* exercise objects */ ]
}
```

Error responses:

```jsonc
{ "error": "not_found", "id": "9999" }             // 404
```

## Endpoints

### `GET /api/exercises`
List/filter/paginate exercises.

| Query param | Type | Default | Notes |
|---|---|---|---|
| `limit` | int | 50 | Max 200 |
| `offset` | int | 0 | |
| `bodyPart` | string | — | Also accepts `body_part`. Exact match against enum. |
| `target` | string | — | Exact match. |
| `equipment` | string | — | Exact match. |
| `name` | string | — | Case-insensitive substring match on exercise name. Also accepts `q`. |

Multiple filters combine with AND.

**Example:** `GET /api/exercises?equipment=dumbbell&target=biceps&limit=5`

### `GET /api/exercises/:id`
Fetch a single exercise by 4-digit ID.

**Example:** `GET /api/exercises/0025` → single exercise object (no envelope), or `404 {"error":"not_found"}`.

### `GET /api/exercises/exercise/:id`
Alias for `/api/exercises/:id`. Same response shape. Provided for WorkoutX parity.

### `GET /api/exercises/bodyPart/:bodyPart`
List exercises for one body part. Same response shape as `/api/exercises`. Supports `?limit=&offset=`.

`:bodyPart` must be one of: `back`, `cardio`, `chest`, `lower arms`, `lower legs`, `neck`, `shoulders`, `upper arms`, `upper legs`, `waist`. Multi-word values must be URL-encoded (e.g. `upper%20legs`).

**Example:** `GET /api/exercises/bodyPart/chest?limit=10`

### `GET /api/exercises/target/:target`
List exercises for one target muscle. Same shape. Supports `?limit=&offset=`.

`:target` values: see `/api/exercises/targetList`. Common: `pectorals`, `biceps`, `triceps`, `lats`, `glutes`, `abs`, `quads`, `hamstrings`, `delts`, `calves`.

**Example:** `GET /api/exercises/target/biceps`

### `GET /api/exercises/equipment/:equipment`
List exercises for one equipment type. Same shape. Supports `?limit=&offset=`.

`:equipment` values: see `/api/exercises/equipmentList`. Common: `body weight`, `dumbbell`, `barbell`, `cable`, `kettlebell`, `band`, `smith machine`.

**Example:** `GET /api/exercises/equipment/dumbbell`

### `GET /api/exercises/name/:name`
Substring name search. Same shape. Supports `?limit=&offset=`.

**Example:** `GET /api/exercises/name/curl` → all exercises with "curl" in the name.

### `GET /api/exercises/search`
Multi-filter search. Same params as `/api/exercises` but takes only `bodyPart`, `target`, `equipment`, `name`, `limit`, `offset`.

**Example:** `GET /api/exercises/search?bodyPart=chest&equipment=dumbbell`

### `GET /api/exercises/bodyPartList`
Returns the sorted array of valid `body_part` values.

**Response:** `["back", "cardio", "chest", "lower arms", ...]`

### `GET /api/exercises/targetList`
Returns the sorted array of valid `target` values.

### `GET /api/exercises/equipmentList`
Returns the sorted array of valid `equipment` values.

### `GET /api/exercises/:id/similar`
Exercises ranked by similarity to `:id`. Same list envelope. Supports `?limit=&offset=`. Default `limit=20`.

Ranking score per candidate: `4×(same target) + 2×(same body_part) + 1×(same equipment) + 1×(same muscle_group) + 1×(each shared secondary_muscle)`. Only candidates with score > 0 are returned, sorted descending.

**Example:** `GET /api/exercises/0025/similar?limit=5`

### `GET /api/exercises/:id/alternatives`
Same-target exercises using **different** equipment than `:id`. Same list envelope. Default `limit=20`.

| Query param | Notes |
|---|---|
| `equipment` | Restrict alternatives to this specific equipment (still excludes source's equipment). |
| `excludeEquipment` | Comma-separated list of additional equipment to exclude. |
| `limit`, `offset` | Standard pagination. |

**Example:** `GET /api/exercises/0025/alternatives` — dumbbell/cable/machine variants of the barbell bench press.

### `GET /api/facets`
Everything you need to build filter UI.

**Response:**
```jsonc
{
  "categories":    ["back", "cardio", ...],       // mirrors body_parts
  "body_parts":    ["back", "cardio", ...],        // 10 values
  "equipment":     ["assisted", "band", ...],      // 28 values
  "targets":       ["abductors", "abs", ...],      // 19 values
  "muscle_groups": ["abs", "adductors", ...]       // 29 values
}
```

Optional `?type=body_parts|targets|equipment|categories|muscle_groups` returns just that array.

### `GET /api/workouts`
List preset workout sessions. Time-based (not sets/reps): every exercise is 45s work + 15s rest.

**Response:**
```jsonc
{
  "count": 9,
  "workouts": [
    {
      "id": "chest",
      "name": "Chest Workout",
      "body_part": "chest",
      "work_seconds": 45,
      "rest_seconds": 15,
      "exercise_count": 3,
      "total_seconds": 180
    },
    // ... 8 more
  ]
}
```

Nine workouts, one per body part (`chest`, `back`, `shoulders`, `upper-arms`, `lower-arms`, `upper-legs`, `lower-legs`, `waist`, `cardio`). `neck` is excluded — the dataset only has 2 neck exercises.

### `GET /api/workouts/:id`
Full workout with expanded exercise details.

**Response:**
```jsonc
{
  "id": "chest",
  "name": "Chest Workout",
  "body_part": "chest",
  "work_seconds": 45,
  "rest_seconds": 15,
  "exercise_count": 3,
  "total_seconds": 180,
  "exercises": [
    { /* full exercise object with absolute media URLs */ },
    { /* ... */ },
    { /* ... */ }
  ]
}
```

`:id` is one of the workout IDs from `/api/workouts` (e.g. `chest`, `upper-arms`, `cardio`). Returns `404 {"error":"not_found"}` for unknown IDs.

## Static media

Serve GIFs and thumbnails directly from the CDN:

- `https://exercises-dataset-silk.vercel.app/videos/{id}-{media_id}.gif`
- `https://exercises-dataset-silk.vercel.app/images/{id}-{media_id}.jpg`

Both are cached `max-age=31536000, immutable`. Prefer using the `image` and `gif_url` fields on exercise objects — they're already absolute URLs, and they insulate the client from filename convention changes.

## Caching

| Path | Cache-Control |
|---|---|
| `/videos/*`, `/images/*` | `public, max-age=31536000, immutable` |
| `/api/*` | `public, s-maxage=300, stale-while-revalidate=600` (edge cache) |
| `/data/*.json` | `public, s-maxage=3600, stale-while-revalidate=86400` (edge cache) |

Clients don't need to send `If-Modified-Since` / `ETag` — Vercel's edge handles it.

## Limits & gotchas

- **Hobby plan**: 8 serverless functions in use (Vercel's cap is 12). Several endpoint paths are `vercel.json` rewrites onto the same underlying function.
- **Bandwidth**: Hobby plan has 100 GB/month. Static-media requests are the dominant cost — the CDN caches aggressively but a viral moment could burn the quota.
- **No multi-language**: instructions are English only. If you need other languages, fetch `data/exercises.json` (17 MB, 10 languages) directly.
- **No workout generator**: `/api/workouts` returns a fixed curated set. If you need dynamic goal-based programming (e.g. "push day, 40 min, intermediate"), that's not built.
- **No `sortMethod` / `effortLevel` / `mechanics`**: those fields don't exist in the underlying dataset. Sorting is dataset-order (ID-ascending) only.
