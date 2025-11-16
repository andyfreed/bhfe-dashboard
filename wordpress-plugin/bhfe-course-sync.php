<?php
/**
 * Plugin Name: BHFE Course Sync
 * Plugin URI: https://github.com/andyfreed/bhfe-dashboard
 * Description: Syncs active courses from WordPress to the BHFE Dashboard app via REST API
 * Version: 1.0.0
 * Author: BHFE
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bhfe-course-sync
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register REST API endpoint for active courses
 */
add_action('rest_api_init', function () {
    register_rest_route('bhfe/v1', '/active-courses', array(
        'methods' => 'GET',
        'callback' => 'bhfe_get_active_courses',
        'permission_callback' => 'bhfe_verify_api_key',
    ));
});

/**
 * Verify API key for REST endpoint
 */
function bhfe_verify_api_key($request) {
    $api_key = $request->get_header('X-BHFE-API-Key');
    $stored_key = get_option('bhfe_sync_api_key', '');
    
    // If no key is set, allow access (for initial setup)
    if (empty($stored_key)) {
        return true;
    }
    
    return !empty($api_key) && hash_equals($stored_key, $api_key);
}

/**
 * Get active courses from WordPress
 * 
 * Active courses are defined as:
 * - Post type: flms-courses
 * - Post status: publish
 * - NOT archived (bhfe_archived_course meta does NOT exist)
 * - NOT archived from versions (bhfe_archived_from_course_versions meta does NOT exist)
 * - NOT investigation processed (bhfe_course_investigation_processed meta does NOT exist)
 */
function bhfe_get_active_courses($request) {
    $args = array(
        'post_type'       => 'flms-courses',
        'post_status'     => 'publish',
        'posts_per_page'  => -1, // Get all active courses
        'meta_query' => array(
            'relation' => 'AND',
            array(
                'relation' => 'AND',
                array(
                    'key'     => 'bhfe_archived_course',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key'     => 'bhfe_archived_from_course_versions',
                    'compare' => 'NOT EXISTS',
                ),
            ),
            array(
                'key'     => 'bhfe_course_investigation_processed',
                'compare' => 'NOT EXISTS',
            ),
        ),
    );
    
    $query = new WP_Query($args);
    $courses = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            // Get course versions
            $version_content = get_post_meta($post_id, 'flms_version_content', true);
            $versions = array();
            
            if (is_array($version_content)) {
                foreach ($version_content as $version_key => $version_data) {
                    // Check if this version is archived
                    $is_archived = isset($version_data['archived']) && $version_data['archived'] === true;
                    $is_public = isset($version_data['public']) && $version_data['public'] === true;
                    
                    $versions[] = array(
                        'version_key' => $version_key,
                        'version_number' => isset($version_data['version']) ? $version_data['version'] : null,
                        'is_public' => $is_public,
                        'is_archived' => $is_archived,
                        'created_at' => isset($version_data['date']) ? $version_data['date'] : null,
                    );
                }
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
            
            $course = array(
                'id' => $post_id,
                'title' => get_the_title(),
                'slug' => get_post_field('post_name', $post_id),
                'permalink' => get_permalink($post_id),
                'excerpt' => get_the_excerpt(),
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
            
            $courses[] = $course;
        }
        wp_reset_postdata();
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'count' => count($courses),
        'courses' => $courses,
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
                            Set an API key to secure the endpoint. Leave empty to allow unauthenticated access (not recommended for production).
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
