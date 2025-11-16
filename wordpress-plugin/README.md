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
   - **Subdirectory**: `wordpress-plugin`
   - **Slug**: `bhfe-course-sync`
5. Set the **Branch** to: `master` (or your preferred branch)
6. Click **Install Plugin**

### Manual Configuration (if needed):

If WP Pusher doesn't auto-detect the config:
- **Subdirectory**: `wordpress-plugin`
- **Plugin slug**: `bhfe-course-sync`

## Manual Installation

Alternatively, you can install manually:

1. Download or clone this repository
2. Copy the `wordpress-plugin` folder to your WordPress plugins directory:
   ```
   wp-content/plugins/bhfe-course-sync/
   ```
3. Activate the plugin in WordPress admin

## Configuration

After installation:

1. Go to **Settings > BHFE Course Sync**
2. Set an API key (recommended for security)
3. Copy the API endpoint URL for use in your dashboard app

## Requirements

- WordPress 5.0+
- PHP 7.4+
- WooCommerce (optional, for product linking)
