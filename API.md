# Exercises API

Public HTTP API for a merged **4,566-exercise** fitness dataset:

- **1,324 media-rich exercises** — 180×180 GIF + thumbnail + English instructions per exercise. Numeric IDs (`0001`–`3655`). Sourced from the Gym-visual dataset.
- **3,242 functional-fitness exercises** — no media, no instructions, but with rich classification metadata (kettlebell, clubbell, macebell, gymnastic rings, Olympic lifts, etc.). IDs prefixed `ff-` (e.g. `ff-0177`).

Read-only, no auth.

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
  // Core identity
  "id": "0025",                                    // "NNNN" for media-rich, "ff-NNNN" for functional-fitness
  "name": "barbell bench press",

  // Anatomy / equipment
  "category": "chest",                             // mirrors body_part
  "body_part": "chest",                            // enum, see /api/exercises/bodyPartList
  "body_region": "Upper Body",                     // Core | Lower Body | Upper Body | Full Body
  "equipment": "barbell",                          // see /api/exercises/equipmentList
  "target": "pectorals",                           // primary muscle, see /api/exercises/targetList
  "muscle_group": "chest",
  "secondary_muscles": ["triceps", "shoulders"],

  // Instructions (empty string for functional-fitness records)
  "instructions": "Lie flat on your back...",
  "instruction_steps": ["Step 1...", "Step 2..."],

  // Local media (empty strings when has_media=false; media-rich records only)
  "media_id": "EIeI8Vf",
  "image":   "https://exercises-dataset-silk.vercel.app/images/0025-EIeI8Vf.jpg",
  "gif_url": "https://exercises-dataset-silk.vercel.app/videos/0025-EIeI8Vf.gif",
  "attribution": "© Gym visual — https://gymvisual.com/",
  "has_media": true,                               // false → image/gif_url/instructions are ""

  // YouTube videos (populated for ~62% of ff-* records; empty for media-rich records)
  "video_url":       "https://youtu.be/5jDEulwWs04",   // short demonstration
  "explanation_url": "https://youtu.be/Sa4ZWmnSC5o",   // in-depth tutorial (may be empty)
  "has_video": true,                                    // true iff video_url is populated

  // Classification (auto-derived heuristically for media-rich records; sourced for ff-records)
  "classification": "Powerlifting",                // see /api/exercises/classificationList
  "difficulty":     "Intermediate",                // see /api/exercises/difficultyList
  "mechanics":      "Compound",                    // Compound | Isolation

  // Movement analysis (populated for ff-records; empty for media-rich records)
  "laterality":       "Bilateral",                 // Bilateral | Unilateral | Contralateral | Ipsilateral
  "force_type":       "Push",                      // Push | Pull | Other | Unsorted
  "posture":          "Supine",                    // Standing | Seated | Supine | Prone | Bridge | Quadruped | ...
  "grip":             "Overhand",
  "movement_patterns": ["Horizontal Push"],        // up to 3
  "planes_of_motion":  ["Sagittal Plane"]          // up to 3
}
```

**Important for mobile apps**:
- `has_media` — GIF/thumbnail + English instructions available. True for the 1,324 numeric-ID records, false for all `ff-*` records.
- `has_video` — YouTube video URL available. True for ~2,013 of the `ff-*` records, false for the media-rich records.
- Use `?has_media=true` if your UI must show a GIF; use `?has_video=true` to only get records with embeddable YouTube videos.
- To render the YouTube video in a mobile app, embed the `video_url` in a `WebView` or use a native YouTube-player SDK. The URLs use the `youtu.be` short form and are directly embeddable via `https://www.youtube.com/embed/<id>`.

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
| `bodyRegion` | string | — | `Core` / `Lower Body` / `Upper Body` / `Full Body`. Case-insensitive. |
| `target` | string | — | Exact match. |
| `equipment` | string | — | Exact match. |
| `classification` | string | — | Case-insensitive. E.g. `Powerlifting`, `Bodybuilding`, `Calisthenics`. |
| `difficulty` | string | — | Case-insensitive. E.g. `Beginner`, `Intermediate`, `Advanced`. |
| `mechanics` | string | — | `Compound` / `Isolation`. |
| `has_media` | bool | — | `true` returns only media-rich records; `false` only ff-records. Also accepts `hasMedia`. |
| `has_video` | bool | — | `true` returns only records with a YouTube `video_url`. Also accepts `hasVideo`. |
| `name` | string | — | Case-insensitive substring match on exercise name. Also accepts `q`. |

Multiple filters combine with AND.

**Examples:**
- `GET /api/exercises?equipment=dumbbell&target=biceps&limit=5`
- `GET /api/exercises?classification=Powerlifting&has_media=true` — Powerlifting exercises that have a GIF
- `GET /api/exercises?bodyRegion=Core&difficulty=Beginner&limit=20`

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

### `GET /api/exercises/classificationList`
Returns the sorted array of valid `classification` values (e.g. `Bodybuilding`, `Calisthenics`, `Powerlifting`, `Olympic Weightlifting`, `Plyometric`, `Ballistics`, `Mobility`, `Postural`, `Balance`, `Animal Flow`, `Grinds`, `Unsorted`).

### `GET /api/exercises/difficultyList`
Returns the sorted array of valid `difficulty` values (`Beginner`, `Novice`, `Intermediate`, `Advanced`, `Expert`, `Master`, `Grand Master`, `Legendary`).

### `GET /api/exercises/bodyRegionList`
Returns the sorted array of `body_region` values (`Core`, `Full Body`, `Lower Body`, `Upper Body`).

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
  "categories":      ["back", "cardio", ...],       // mirrors body_parts
  "body_parts":      ["back", "cardio", ...],       // 10 values
  "body_regions":    ["Core", "Full Body", ...],    // 4 values
  "equipment":       ["barbell", "bodyweight", ...],// 51 values
  "targets":         ["abductors", "abs", ...],     // 27 values
  "muscle_groups":   ["abs", "adductors", ...],     // 50 values
  "classifications": ["Animal Flow", ...],          // 12 values
  "difficulties":    ["Advanced", "Beginner", ...], // 8 values
  "mechanics":       ["Compound", "Isolation", ...] // 2–3 values
}
```

Optional `?type=body_parts|targets|equipment|categories|muscle_groups|classifications|difficulties|body_regions|mechanics` returns just that array.

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
- **No multi-language**: instructions are English only. If you need other languages, fetch `data/exercises.json` (17 MB, 10 languages) directly. Note: the ff-* records have no instructions in any language.
- **No workout generator**: `/api/workouts` returns a fixed curated set. If you need dynamic goal-based programming, that's not built.
- **Classification on media-rich records is heuristic**: the original 1,324 records didn't ship with `classification`/`difficulty`/`mechanics` values, so those are derived from equipment + name patterns (barbell squat/deadlift/bench → Powerlifting, etc.). Treat them as approximate; the values on `ff-*` records are authoritative from the source.
- **`sort`**: not supported. Results come back in dataset order (`0001`… then `ff-0001`…).
