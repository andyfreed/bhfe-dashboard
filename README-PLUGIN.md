# BHFE Course Sync Plugin

This plugin syncs active courses from your WordPress site to the BHFE Dashboard app.

## WordPress Plugin Installation

1. Copy the `dashboard-plugin/bhfe-course-sync.php` file to your WordPress plugins directory:
   ```
   wp-content/plugins/bhfe-course-sync/bhfe-course-sync.php
   ```

2. Activate the plugin in WordPress admin under **Plugins**.

3. Configure the API key:
   - Go to **Settings > BHFE Course Sync**
   - Set an API key (optional but recommended for security)
   - Copy the API endpoint URL

## Active Course Definition

Active courses are defined as:
- Post type: `flms-courses`
- Post status: `publish`
- NOT archived (`bhfe_archived_course` meta does NOT exist)
- NOT archived from versions (`bhfe_archived_from_course_versions` meta does NOT exist)
- NOT investigation processed (`bhfe_course_investigation_processed` meta does NOT exist)

## API Endpoint

**GET** `/wp-json/bhfe/v1/active-courses`

### Headers (if API key is set)
```
X-BHFE-API-Key: your-api-key-here
```

### Response
```json
{
  "success": true,
  "count": 10,
  "courses": [
    {
      "id": 123,
      "title": "Course Title",
      "slug": "course-slug",
      "permalink": "https://yoursite.com/courses/course-slug",
      "excerpt": "Course excerpt...",
      "content": "Full course content...",
      "product_id": 456,
      "product_sku": "COURSE-001",
      "product_price": "99.00",
      "versions": [
        {
          "version_key": "v1",
          "version_number": 1,
          "is_public": true,
          "is_archived": false,
          "created_at": "2024-01-01T00:00:00+00:00"
        }
      ],
      "public_versions_count": 1,
      "archived_versions_count": 0,
      "updated_at": "2024-01-15T10:30:00+00:00",
      "created_at": "2024-01-01T00:00:00+00:00"
    }
  ]
}
```

## Dashboard App Usage

### Using the API Route

Call the Next.js API route from your dashboard:

```typescript
const response = await fetch('/api/sync/courses?wordpress_url=https://yoursite.com&api_key=your-key')
const data = await response.json()
```

### Using the Library Function

```typescript
import { syncCoursesFromWordPress } from '@/lib/wordpress-sync'

const courses = await syncCoursesFromWordPress(
  'https://yoursite.com',
  'your-api-key'
)
```

## Next Steps

1. Create a Supabase table to store synced courses (if needed)
2. Add a sync UI in the dashboard to trigger manual syncs
3. Set up automated syncs (cron job or scheduled function)
4. Handle course updates and deletions
