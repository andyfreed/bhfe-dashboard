# BHFE Course Sync Plugin

WordPress plugin for syncing active courses to the BHFE Dashboard app.

## WP Pusher Installation

This plugin is fully compatible with WP Pusher. The repository includes a `.wppusher.json` configuration file for automatic setup.

### Quick Install via WP Pusher:

1. Install the **WP Pusher** plugin in WordPress (if not already installed)
2. Go to **WP Pusher > Install Plugin**
3. Enter the repository URL: `https://github.com/andyfreed/bhfe-dashboard`
4. WP Pusher will automatically detect the `.wppusher.json` file and configure:
   - **Type**: Plugin
   - **Subdirectory**: `dashboard-plugin`
   - **Slug**: `bhfe-course-sync`
5. Set the **Branch** to: `master` (or your preferred branch)
6. Click **Install Plugin**

### Manual Configuration (if needed):

If WP Pusher doesn't auto-detect the config:
- **Subdirectory**: `dashboard-plugin`
- **Plugin slug**: `bhfe-course-sync`

## Manual Installation

Alternatively, you can install manually:

1. Download or clone this repository
2. Copy the `dashboard-plugin` folder to your WordPress plugins directory:
   ```
   wp-content/plugins/bhfe-course-sync/
   ```
3. Activate the plugin in WordPress admin

## Configuration

After installation:

1. Go to **Settings > BHFE Course Sync**
2. Set an API key (recommended for security)
3. Copy the API endpoint URL for use in your dashboard app

## Course Filtering Logic

The plugin filters out archived/inactive courses using **explicit meta fields** that WordPress uses to mark courses as archived. This ensures accuracy and avoids false positives.

### Courses Excluded:

1. **`bhfe_archived_from_course_versions: 1`** - Courses that were archived when new versions were created
2. **`bhfe_archived_course: 1`** - Courses that are explicitly marked as archived

### Why Not Filter By:

- **`version_status: "archived"`** - Many active courses have archived versions in their history, but WordPress uses `flms_course_active_version` to mark which version is currently active
- **"Retired" in title** - Title-based filtering is unreliable and inconsistent
- **`flms_web_fodder_imported_content: 1`** - This flag only indicates a course was imported, not that it's archived. Many imported courses are still active

### The Lesson:

**Use explicit flags, not inferred status.** WordPress provides explicit meta fields (`bhfe_archived_from_course_versions`, `bhfe_archived_course`) to mark courses as archived. These are the authoritative source of truth, not version status, titles, or import flags.

## Requirements

- WordPress 5.0+
- PHP 7.4+
- WooCommerce (optional, for product linking)
