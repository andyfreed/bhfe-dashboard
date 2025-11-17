<?php
/**
 * Plugin Name: BHFE Course Sync
 * Plugin URI: https://github.com/andyfreed/bhfe-dashboard
 * Description: Syncs active courses from WordPress to the BHFE Dashboard app via REST API
 * Version: 1.0.3
 * Author: BHFE
 * Author URI: https://github.com/andyfreed
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bhfe-course-sync
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Network: false
 * 
 * WP Pusher compatible - Install from: https://github.com/andyfreed/bhfe-dashboard
 * Subdirectory: wordpress-plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add CORS headers to allow requests from dashboard app
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-BHFE-API-Key');
        
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            status_header(200);
            exit();
        }
        
        return $value;
    });
}, 15);

/**
 * Register REST API endpoint for active courses
 */
add_action('rest_api_init', function () {
    register_rest_route('bhfe/v1', '/active-courses', array(
        'methods' => 'GET',
        'callback' => 'bhfe_get_active_courses',
        'permission_callback' => 'bhfe_verify_api_key',
        'args' => array(
            'include_all' => array(
                'validate_callback' => function($param) {
                    return in_array($param, array('true', 'false', ''), true);
                },
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'list_meta' => array(
                'validate_callback' => function($param) {
                    return in_array($param, array('true', 'false', ''), true);
                },
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Endpoint to list all available meta keys
    register_rest_route('bhfe/v1', '/course-meta-keys', array(
        'methods' => 'GET',
        'callback' => 'bhfe_list_course_meta_keys',
        'permission_callback' => 'bhfe_verify_api_key',
    ));
});

/**
 * Verify API key for REST endpoint
 */
function bhfe_verify_api_key($request) {
    $api_key = $request->get_header('X-BHFE-API-Key');
    $stored_key = get_option('bhfe_sync_api_key', '');
    
    // If no key is configured, deny access for security
    if (empty($stored_key)) {
        return new WP_Error(
            'api_key_required',
            'API key must be configured in WordPress admin settings.',
            array('status' => 401)
        );
    }
    
    // If key is configured but not provided, deny access
    if (empty($api_key)) {
        return new WP_Error(
            'api_key_missing',
            'API key is required. Include X-BHFE-API-Key header.',
            array('status' => 401)
        );
    }
    
    // Verify the keys match using timing-safe comparison
    if (!hash_equals($stored_key, $api_key)) {
        return new WP_Error(
            'api_key_invalid',
            'Invalid API key.',
            array('status' => 403)
        );
    }
    
    return true;
}

/**
 * Get active courses from WordPress
 * 
 * Active courses are defined as:
 * - Post type: flms-courses
 * - Post status: publish
 * - NOT explicitly archived (bhfe_archived_course meta != '1')
 * 
 * Query parameter: include_all=true to get all published courses (for debugging)
 */
function bhfe_get_active_courses($request) {
    // Rate limiting: Check if too many requests
    $rate_limit_key = 'bhfe_api_rate_limit_' . $_SERVER['REMOTE_ADDR'];
    $rate_limit_count = get_transient($rate_limit_key);
    
    if ($rate_limit_count === false) {
        set_transient($rate_limit_key, 1, 60); // 1 minute window
    } else {
        if ($rate_limit_count >= 30) { // Max 30 requests per minute
            return new WP_Error(
                'rate_limit_exceeded',
                'Too many requests. Please try again later.',
                array('status' => 429)
            );
        }
        set_transient($rate_limit_key, $rate_limit_count + 1, 60);
    }
    
    // Allow optional parameter to include all courses (for debugging)
    $include_all = $request->get_param('include_all') === 'true';
    $list_meta = $request->get_param('list_meta') === 'true';
    
    $args = array(
        'post_type'       => 'flms-courses',
        'post_status'     => 'publish',
        'posts_per_page'  => -1, // Get all active courses
    );
    
    // Only apply meta_query filters if not including all courses
    // For now, let's get ALL published courses and filter in PHP to see what we're working with
    if (!$include_all) {
        // Simplified: only exclude courses that are explicitly marked as archived
        $args['meta_query'] = array(
            array(
                'relation' => 'OR',
                array(
                    'key'     => 'bhfe_archived_course',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key'     => 'bhfe_archived_course',
                    'value'   => '1',
                    'compare' => '!=',
                ),
            ),
        );
    }
    
    $query = new WP_Query($args);
    $courses = array();
    
    $debug_info = array(
        'posts_found' => $query->found_posts,
        'posts_in_loop' => 0,
        'courses_added' => 0,
        'courses_skipped' => 0,
        'skip_reasons' => array(),
    );
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            $debug_info['posts_in_loop']++;
            
            // Get course versions
            $version_content = get_post_meta($post_id, 'flms_version_content', true);
            $versions = array();
            $has_active_public_version = false;
            
            if (is_array($version_content) && !empty($version_content)) {
                foreach ($version_content as $version_key => $version_data) {
                    // Check if this version is archived
                    $is_archived = isset($version_data['archived']) && $version_data['archived'] === true;
                    $is_public = isset($version_data['public']) && $version_data['public'] === true;
                    
                    // Track if we have at least one active public version
                    if ($is_public && !$is_archived) {
                        $has_active_public_version = true;
                    }
                    
                    $versions[] = array(
                        'version_key' => $version_key,
                        'version_number' => isset($version_data['version']) ? $version_data['version'] : null,
                        'is_public' => $is_public,
                        'is_archived' => $is_archived,
                        'created_at' => isset($version_data['date']) ? $version_data['date'] : null,
                    );
                }
            } else {
                // If no version data exists, assume the course is active (for backward compatibility)
                // This handles courses that might not use the version system
                $has_active_public_version = true;
            }
            
            // Temporarily disable ALL filtering to debug - only exclude if explicitly archived
            // TODO: Re-enable filtering once we understand what makes courses "active" on the live site
            // For now, we'll only exclude courses explicitly marked as archived via meta
            $explicitly_archived = get_post_meta($post_id, 'bhfe_archived_course', true);
            if (!$include_all && $explicitly_archived === '1') {
                continue;
            }
            
            // Get the title and decode HTML entities
            $course_title = get_the_title();
            
            // Decode HTML entities properly (including numeric entities like &#8211;)
            // Use WordPress function first, then handle numeric entities
            $decoded_title = $course_title;
            if (function_exists('wp_kses_decode_entities')) {
                $decoded_title = wp_kses_decode_entities($decoded_title);
            } else {
                $decoded_title = html_entity_decode($decoded_title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            // Handle numeric entities that might not be decoded (hex and decimal)
            $decoded_title = preg_replace_callback('/&#x([0-9a-fA-F]+);/i', function($matches) {
                return mb_chr(hexdec($matches[1]), 'UTF-8');
            }, $decoded_title);
            $decoded_title = preg_replace_callback('/&#(\d+);/', function($matches) {
                return mb_chr(intval($matches[1]), 'UTF-8');
            }, $decoded_title);
            
            // Fix common smart quote/apostrophe issues
            // Replace smart quotes and apostrophes with regular ones
            $decoded_title = str_replace(
                array(''', ''', ''', ''', '…', '–', '—'),
                array("'", "'", '"', '"', '...', '-', '-'),
                $decoded_title
            );
            
            // Also handle any remaining non-UTF-8 characters by converting to UTF-8
            if (!mb_check_encoding($decoded_title, 'UTF-8')) {
                $decoded_title = mb_convert_encoding($decoded_title, 'UTF-8', 'UTF-8');
            }
            
            // Only filter out courses that explicitly have "Retired" at the START of the title
            // (not just anywhere in the title, to avoid false positives)
            if (!$include_all && (stripos(trim($course_title), 'retired') === 0 || stripos(trim($decoded_title), 'retired') === 0)) {
                $debug_info['courses_skipped']++;
                $debug_info['skip_reasons']['retired_in_title'] = ($debug_info['skip_reasons']['retired_in_title'] ?? 0) + 1;
                continue;
            }
            
            if (!$include_all && $explicitly_archived === '1') {
                $debug_info['courses_skipped']++;
                $debug_info['skip_reasons']['explicitly_archived'] = ($debug_info['skip_reasons']['explicitly_archived'] ?? 0) + 1;
                continue;
            }
            
            // Get associated WooCommerce product
            $product_id = null;
            $product_sku = null;
            $product_price = null;
            
            // Try to find linked product
            $linked_products = get_post_meta($post_id, '_product_ids', true);
            if (empty($linked_products)) {
                // Try alternative meta keys that might link courses to products
                $linked_products = get_post_meta($post_id, 'flms_product_id', true);
            }
            
            if (!empty($linked_products)) {
                if (is_array($linked_products)) {
                    $product_id = $linked_products[0];
                } else {
                    $product_id = $linked_products;
                }
                
                if ($product_id && function_exists('wc_get_product')) {
                    $product = wc_get_product($product_id);
                    if ($product) {
                        $product_sku = $product->get_sku();
                        $product_price = $product->get_price();
                    }
                }
            }
            
            // Decode excerpt HTML entities (title already decoded above)
            $course_excerpt = get_the_excerpt();
            $decoded_excerpt = $course_excerpt;
            if (function_exists('wp_kses_decode_entities')) {
                $decoded_excerpt = wp_kses_decode_entities($decoded_excerpt);
            } else {
                $decoded_excerpt = html_entity_decode($decoded_excerpt, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            // Handle numeric entities that might not be decoded (hex and decimal)
            $decoded_excerpt = preg_replace_callback('/&#x([0-9a-fA-F]+);/i', function($matches) {
                return mb_chr(hexdec($matches[1]), 'UTF-8');
            }, $decoded_excerpt);
            $decoded_excerpt = preg_replace_callback('/&#(\d+);/', function($matches) {
                return mb_chr(intval($matches[1]), 'UTF-8');
            }, $decoded_excerpt);
            
            // Fix common smart quote/apostrophe issues in excerpt too
            $decoded_excerpt = str_replace(
                array(''', ''', ''', ''', '…', '–', '—'),
                array("'", "'", '"', '"', '...', '-', '-'),
                $decoded_excerpt
            );
            
            // Also handle any remaining non-UTF-8 characters by converting to UTF-8
            if (!mb_check_encoding($decoded_excerpt, 'UTF-8')) {
                $decoded_excerpt = mb_convert_encoding($decoded_excerpt, 'UTF-8', 'UTF-8');
            }
            
            $course = array(
                'id' => $post_id,
                'title' => $decoded_title,
                'slug' => get_post_field('post_name', $post_id),
                'permalink' => get_permalink($post_id),
                'excerpt' => $decoded_excerpt,
                'content' => get_the_content(),
                'product_id' => $product_id,
                'product_sku' => $product_sku,
                'product_price' => $product_price,
                'versions' => $versions,
                'public_versions_count' => count(array_filter($versions, function($v) { return $v['is_public'] && !$v['is_archived']; })),
                'archived_versions_count' => count(array_filter($versions, function($v) { return $v['is_archived']; })),
                'updated_at' => get_post_modified_time('c', false, $post_id),
                'created_at' => get_post_time('c', false, $post_id),
            );
            
            // If list_meta is true, include all custom meta fields
            if ($list_meta) {
                $all_meta = get_post_meta($post_id);
                $course['all_meta_fields'] = array();
                
                foreach ($all_meta as $meta_key => $meta_values) {
                    // Skip WordPress internal meta keys (they start with _)
                    // But include some useful ones
                    if (strpos($meta_key, '_edit_') === 0 || 
                        strpos($meta_key, '_wp_') === 0 ||
                        $meta_key === '_thumbnail_id') {
                        continue;
                    }
                    
                    // Get the meta value (handle arrays)
                    $meta_value = get_post_meta($post_id, $meta_key, true);
                    
                    // Store the meta key and value
                    $course['all_meta_fields'][$meta_key] = array(
                        'value' => $meta_value,
                        'is_array' => is_array($meta_value),
                        'is_object' => is_object($meta_value),
                        'type' => gettype($meta_value),
                    );
                }
                
                // Also include standard post fields
                $post = get_post($post_id);
                $course['standard_fields'] = array(
                    'post_author' => $post->post_author,
                    'post_status' => $post->post_status,
                    'comment_status' => $post->comment_status,
                    'ping_status' => $post->ping_status,
                    'post_parent' => $post->post_parent,
                    'menu_order' => $post->menu_order,
                    'post_type' => $post->post_type,
                );
                
                // Featured image
                $thumbnail_id = get_post_thumbnail_id($post_id);
                if ($thumbnail_id) {
                    $course['featured_image'] = array(
                        'id' => $thumbnail_id,
                        'url' => wp_get_attachment_image_url($thumbnail_id, 'full'),
                        'thumbnail_url' => wp_get_attachment_image_url($thumbnail_id, 'thumbnail'),
                    );
                }
                
                // Taxonomies
                $taxonomies = get_object_taxonomies('flms-courses');
                $course['taxonomies'] = array();
                foreach ($taxonomies as $taxonomy) {
                    $terms = wp_get_post_terms($post_id, $taxonomy);
                    $course['taxonomies'][$taxonomy] = array_map(function($term) {
                        return array(
                            'id' => $term->term_id,
                            'name' => $term->name,
                            'slug' => $term->slug,
                        );
                    }, $terms);
                }
            }
            
            $courses[] = $course;
            $debug_info['courses_added']++;
        }
        wp_reset_postdata();
    }
    
    // Get total count for comparison
    $total_args = array(
        'post_type'       => 'flms-courses',
        'post_status'     => 'publish',
        'posts_per_page'  => -1,
    );
    $total_query = new WP_Query($total_args);
    $total_count = $total_query->found_posts;
    wp_reset_postdata();
    
    $filtered_count = count($courses);
    
    return new WP_REST_Response(array(
        'success' => true,
        'count' => $filtered_count,
        'total_published' => $total_count,
        'filtered_out' => $total_count - $filtered_count,
        'debug' => $debug_info,
        'courses' => $courses,
    ), 200);
}

/**
 * List all unique meta keys used by courses
 */
function bhfe_list_course_meta_keys($request) {
    $args = array(
        'post_type'       => 'flms-courses',
        'post_status'     => 'publish',
        'posts_per_page'  => -1,
    );
    
    $query = new WP_Query($args);
    $all_meta_keys = array();
    $meta_keys_with_samples = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            $meta = get_post_meta($post_id);
            
            foreach ($meta as $meta_key => $meta_values) {
                // Skip WordPress internal meta keys
                if (strpos($meta_key, '_edit_') === 0 || 
                    strpos($meta_key, '_wp_') === 0) {
                    continue;
                }
                
                if (!in_array($meta_key, $all_meta_keys)) {
                    $all_meta_keys[] = $meta_key;
                    
                    // Get a sample value
                    $sample_value = get_post_meta($post_id, $meta_key, true);
                    $meta_keys_with_samples[$meta_key] = array(
                        'type' => gettype($sample_value),
                        'is_array' => is_array($sample_value),
                        'is_object' => is_object($sample_value),
                        'sample_value' => is_array($sample_value) || is_object($sample_value) 
                            ? 'Array/Object (see full data with list_meta=true)' 
                            : (is_string($sample_value) && strlen($sample_value) > 100 
                                ? substr($sample_value, 0, 100) . '...' 
                                : $sample_value),
                    );
                }
            }
        }
        wp_reset_postdata();
    }
    
    // Get taxonomies
    $taxonomies = get_object_taxonomies('flms-courses');
    
    return new WP_REST_Response(array(
        'success' => true,
        'total_courses_checked' => $query->found_posts,
        'unique_meta_keys' => count($all_meta_keys),
        'meta_keys' => $meta_keys_with_samples,
        'taxonomies' => $taxonomies,
        'note' => 'Use ?list_meta=true on /active-courses endpoint to see full values for all fields',
    ), 200);
}

/**
 * Add admin settings page for API key
 */
add_action('admin_menu', function() {
    add_options_page(
        'BHFE Course Sync Settings',
        'BHFE Course Sync',
        'manage_options',
        'bhfe-course-sync',
        'bhfe_course_sync_settings_page'
    );
});

/**
 * Settings page callback
 */
function bhfe_course_sync_settings_page() {
    if (isset($_POST['bhfe_sync_api_key']) && check_admin_referer('bhfe_sync_settings')) {
        update_option('bhfe_sync_api_key', sanitize_text_field($_POST['bhfe_sync_api_key']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_key = get_option('bhfe_sync_api_key', '');
    $endpoint_url = rest_url('bhfe/v1/active-courses');
    
    ?>
    <div class="wrap">
        <h1>BHFE Course Sync Settings</h1>
        <form method="post" action="">
            <?php wp_nonce_field('bhfe_sync_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="bhfe_sync_api_key">API Key</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="bhfe_sync_api_key" 
                               name="bhfe_sync_api_key" 
                               value="<?php echo esc_attr($api_key); ?>" 
                               class="regular-text" />
                        <p class="description">
                            <strong>Required:</strong> Set an API key to secure the endpoint. The endpoint will deny access without a valid API key.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">API Endpoint</th>
                    <td>
                        <code><?php echo esc_url($endpoint_url); ?></code>
                        <p class="description">
                            Use this endpoint in your dashboard app to fetch active courses.
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <h2>Usage</h2>
        <p>To fetch active courses from your dashboard app, make a GET request to:</p>
        <pre><?php echo esc_url($endpoint_url); ?></pre>
        
        <?php if (!empty($api_key)): ?>
        <p>Include the API key in the request header:</p>
        <pre>X-BHFE-API-Key: <?php echo esc_html($api_key); ?></pre>
        <?php endif; ?>
    </div>
    <?php
}
