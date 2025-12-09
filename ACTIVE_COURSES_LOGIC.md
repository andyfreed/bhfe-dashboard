# How the Dashboard Decides Which Courses Are Active

This app does **not** decide activeness itself. It trusts the WordPress plugin in `dashboard-plugin/bhfe-course-sync.php`, which exposes `GET /wp-json/bhfe/v1/active-courses`. The dashboard simply proxies that endpoint and renders whatever it returns.

## Data Flow in the Dashboard
- UI at `app/dashboard/courses/page.tsx` calls `GET /api/sync/courses?wordpress_url=...&api_key=...`.
- That Next.js route (`app/api/sync/courses/route.ts`) calls `fetchActiveCoursesFromWordPress` in `lib/wordpress-sync.ts`, which hits `wp-json/bhfe/v1/active-courses` (optionally with `X-BHFE-API-Key`).
- The response is used as-is; there is no extra filtering for active vs inactive on the dashboard side.

## WordPress Source of Truth (active-courses endpoint)
Active courses are derived from published `flms-courses` posts with explicit archive flags:
- Base query: post type `flms-courses`, post status `publish`, all posts fetched then filtered in PHP.
- Excluded unless `include_all=true` is passed:
  - `bhfe_archived_from_course_versions === '1'` (archived when new versions were created).
  - `bhfe_archived_course === '1'` (explicitly archived).
- Version handling (from `flms_version_content` + `flms_course_active_version`):
  - Each version tracks `is_archived` and `is_public`.
  - If **all versions look archived but `flms_course_active_version` is set**, the course stays **included** (the active-version meta is authoritative).
  - If no version data exists, the course is assumed active for backward compatibility.
- Explicitly **not** used for exclusion:
  - `version_status: "archived"` on versions (too many false positives; active-version meta wins).
  - Titles containing “Retired”.
  - `flms_web_fodder_imported_content === '1'` (indicates import, not inactivity).

## Payload Shape Returned by WordPress
Each course includes (abbreviated):
- `id`, `title` (HTML entities normalized), `slug`, `permalink`, `excerpt`, `content`
- WooCommerce link fields when available: `product_id`, `product_sku`, `product_price`
- `versions`: array with `version_key`, `version_number`, `is_public`, `is_archived`, `is_active_version`, `created_at`, `version_status`
- Counts: `public_versions_count`, `archived_versions_count`
- Timestamps: `updated_at`, `created_at`
- Optional: when `list_meta=true`, all non-internal meta, standard post fields, featured image info, and taxonomies

## Other Helpful Endpoints
- `GET /api/sync/courses?...&endpoint=course-meta-keys` → lists meta keys from WordPress.
- `GET /api/sync/courses?...&endpoint=inspect-courses&ids=...` → dumps selected courses (useful to see why something is excluded).
- `include_all=true` on the WordPress endpoint bypasses archive filters for debugging; `list_meta=true` adds every meta field to each course.

## Quick Testing Steps
1) In the dashboard UI, enter the WordPress URL and (optionally) API key, then click “Sync Courses”.  
2) If a course is missing, call the WordPress endpoint directly with `include_all=true` to confirm whether an archive flag is set.  
3) Check meta flags `bhfe_archived_from_course_versions` and `bhfe_archived_course`; if either is `1`, the course is intentionally excluded.
