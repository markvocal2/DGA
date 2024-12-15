<?php

if (!defined('ABSPATH')) exit;

function wpdevs_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('automatic-feed-links');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
	add_theme_support('menus');  // เพิ่มบรรทัดนี้
    
    // แก้ไขเส้นทางการอ้างอิงภาพ Cover
    $header_image_path = get_stylesheet_directory_uri() . '/images/wpdevs.png';
    
    add_theme_support('custom-header', array(
        'default-image' => $header_image_path,
        'width' => 1920,
        'height' => 1080,
        'flex-width' => true,
        'flex-height' => true,
        'header-text' => false,
        'uploads' => true,
    ));

    // ลงทะเบียนภาพ default ด้วยเส้นทางที่ถูกต้อง
    register_default_headers(array(
        'default-image' => array(
            'url'           => $header_image_path,
            'thumbnail_url' => $header_image_path,
            'description'   => __('Default Header Image', 'wp-devs')
        )
    ));
}
add_action('after_setup_theme', 'wpdevs_setup');





// install elementor


if (!defined('ABSPATH')) exit;

function auto_install_elementor_plugins() {
    // ตรวจสอบว่ามีการติดตั้ง Plugin Installer หรือไม่
    if (!function_exists('get_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    
    // ติดตั้ง Elementor Free
    if (!is_plugin_active('elementor/elementor.php')) {
        // ข้อมูลของ plugin Elementor จาก WordPress.org
        $plugin = 'elementor';
        
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        
        $api = plugins_api('plugin_information', array(
            'slug' => $plugin,
            'fields' => array(
                'short_description' => false,
                'sections' => false,
                'requires' => false,
                'rating' => false,
                'ratings' => false,
                'downloaded' => false,
                'last_updated' => false,
                'added' => false,
                'tags' => false,
                'compatibility' => false,
                'homepage' => false,
                'donate_link' => false,
            ),
        ));

        // ติดตั้ง Elementor Free
        if (!is_wp_error($api)) {
            $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
            $installed = $upgrader->install($api->download_link);
            
            if ($installed) {
                activate_plugin('elementor/elementor.php');
            }
        }
    }
    
    // ติดตั้ง Elementor Pro
    if (!is_plugin_active('elementor-pro/elementor-pro.php')) {
        $pro_plugin_url = 'https://wpdevs.co/insplg/Elementor.zip';
        $upload_dir = wp_upload_dir();
        $plugin_dir = WP_PLUGIN_DIR;
        
        // ดาวน์โหลดไฟล์ ZIP
        $temp_file = download_url($pro_plugin_url);
        
        if (!is_wp_error($temp_file)) {
            include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            
            // ติดตั้ง Elementor Pro
            $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
            $installed = $upgrader->install($temp_file);
            
            // ลบไฟล์ชั่วคราว
            @unlink($temp_file);
            
            if ($installed) {
                activate_plugin('elementor-pro/elementor-pro.php');
            }
        }
    }
}


// AUTO SETTING

if (!defined('ABSPATH')) exit;

function auto_configure_wordpress_settings() {
    // กำหนดข้อมูลหน้าต่างๆ ที่ต้องการสร้าง
    $pages = array(
        'home' => array(
            'post_title'    => 'Home',
            'post_content'  => '<!-- wp:paragraph --><p>ยินดีต้อนรับสู่เว็บไซต์</p><!-- /wp:paragraph -->',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'post_author'   => 1,
        ),
        'contact' => array(
            'post_title'    => 'Contact',
            'post_content'  => '<!-- wp:paragraph --><p>ติดต่อหน่วยงาน</p><!-- /wp:paragraph -->',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'post_author'   => 1,
        ),
        'about' => array(
            'post_title'    => 'About',
            'post_content'  => '<!-- wp:paragraph --><p>เกี่ยวกับหน่วยงาน</p><!-- /wp:paragraph -->',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'post_author'   => 1,
        )
    );

    // วนลูปสร้างหน้าทั้งหมด
    foreach ($pages as $key => $page_data) {
        $existing_page = get_page_by_title($page_data['post_title']);
        if (!$existing_page) {
            $page_id = wp_insert_post($page_data);
            // เก็บ ID ของหน้า Home เพื่อตั้งเป็นหน้าแรก
            if ($key === 'home') {
                $home_page_id = $page_id;
            }
        } else {
            // ถ้าหน้ามีอยู่แล้ว เก็บ ID ของหน้า Home
            if ($key === 'home') {
                $home_page_id = $existing_page->ID;
            }
        }
    }

    // General Settings
    update_option('blogname', 'กรุณากรอกชื่อหน่วยงาน');
    update_option('blogdescription', 'ข้อมูลหน่วยงานแบบสั้น');
    update_option('users_can_register', 1);
    update_option('WPLANG', 'th');
    update_option('timezone_string', 'Asia/Bangkok');
    update_option('date_format', 'd/m/Y');
    update_option('time_format', 'H:i');

    // Reading Settings
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_page_id);

    // บันทึก Transient เพื่อแสดงข้อความแจ้งเตือน
    set_transient('theme_settings_updated', true, 5);

    // Flush rewrite rules
    flush_rewrite_rules();
}

// เรียกใช้ฟังก์ชันเมื่อ Theme ถูก Activate
function theme_activation_settings() {
    auto_configure_wordpress_settings();
}
add_action('after_switch_theme', 'theme_activation_settings');

// แสดงข้อความแจ้งเตือนหลังจากตั้งค่าเสร็จ
function settings_admin_notice() {
    if (get_transient('theme_settings_updated')) {
        ?>
        <div class="notice notice-success is-dismissible">
            <p>ตั้งค่า WordPress เริ่มต้นเรียบร้อยแล้ว</p>
            <ul style="list-style-type: disc; margin-left: 20px;">
                <li>ชื่อเว็บไซต์: กรุณากรอกชื่อหน่วยงาน</li>
                <li>คำอธิบายเว็บไซต์: ข้อมูลหน่วยงานแบบสั้น</li>
                <li>เปิดให้สมัครสมาชิก: เปิดใช้งาน</li>
                <li>ภาษา: ไทย</li>
                <li>เขตเวลา: กรุงเทพฯ</li>
                <li>รูปแบบวันที่: d/m/Y</li>
                <li>รูปแบบเวลา: H:i</li>
                <li>หน้าแรก: หน้า Home (สร้างใหม่)</li>
            </ul>
        </div>
        <?php
        delete_transient('theme_settings_updated');
    }
}
add_action('admin_notices', 'settings_admin_notice');

// ตรวจสอบและเปลี่ยนภาษาเว็บไซต์
function check_and_update_locale() {
    $current_locale = get_locale();
    if ($current_locale !== 'th') {
        update_option('WPLANG', 'th');
        load_default_textdomain('th');
    }
}
add_action('init', 'check_and_update_locale');

// เพิ่มการตรวจสอบการติดตั้งภาษาไทย
function check_thai_language_pack() {
    if (!is_dir(WP_LANG_DIR) || !file_exists(WP_LANG_DIR . '/th.mo')) {
        require_once(ABSPATH . 'wp-admin/includes/translation-install.php');
        wp_download_language_pack('th');
    }
}
add_action('after_switch_theme', 'check_thai_language_pack');


/******* อัพเดต DASHBOARD ************/

// ป้องกันการเข้าถึงไฟล์โดยตรง
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue Scripts & Styles
function enqueue_shortcode_assets($hook) {
    if ('toplevel_page_shortcode-manager' !== $hook && 'index.php' !== $hook) {
        return;
    }
    
    // เพิ่ม CSS
    wp_enqueue_style(
        'shortcode-manager-style', 
        get_template_directory_uri() . '/css/admin-shortcode.css',
        array(),
        '1.0.0'
    );
    
    // เพิ่ม JavaScript
    wp_enqueue_script(
        'shortcode-manager-script', 
        get_template_directory_uri() . '/js/admin-shortcode.js',
        array('jquery'),
        '1.0.0',
        true
    );
    
    // ส่งค่าไปยัง JavaScript
    wp_localize_script(
        'shortcode-manager-script',
        'shortcodeAjax',
        array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('shortcode-manager-nonce')
        )
    );
}
add_action('admin_enqueue_scripts', 'enqueue_shortcode_assets');




// ทำงานเมื่อ Theme ถูก Activate
function theme_activation() {
    auto_install_elementor_plugins();
}
add_action('after_switch_theme', 'theme_activation');

// เพิ่มการแจ้งเตือนหลังจากติดตั้ง
function installation_admin_notice() {
    if (get_transient('elementor_plugins_installed')) {
        ?>
        <div class="notice notice-success is-dismissible">
            <p>ติดตั้งและเปิดใช้งาน Elementor และ Elementor Pro เรียบร้อยแล้ว</p>
        </div>
        <?php
        delete_transient('elementor_plugins_installed');
    }
}
add_action('admin_notices', 'installation_admin_notice');

// ตั้งค่า timeout สำหรับการดาวน์โหลด
function extend_upload_time_limit($time) {
    return 300; // 5 นาที
}
add_filter('http_request_timeout', 'extend_upload_time_limit');

// เพิ่มการตรวจสอบ license Elementor Pro (ถ้าจำเป็น)
function activate_elementor_pro_license() {
    // เพิ่มโค้ดสำหรับ activate license ที่นี่ (ถ้ามี)
}
add_action('after_switch_theme', 'activate_elementor_pro_license');



// Custom Post Type - งานประมูล
function create_auction_post_type() {
    $labels = array(
        'name'                  => 'งานประมูล',
        'singular_name'         => 'งานประมูล',
        'menu_name'            => 'งานประมูล',
        'add_new'              => 'เพิ่มงานประมูล',
        'add_new_item'         => 'เพิ่มงานประมูลใหม่',
        'edit_item'            => 'แก้ไขงานประมูล',
        'new_item'             => 'งานประมูลใหม่',
        'view_item'            => 'ดูงานประมูล',
        'search_items'         => 'ค้นหางานประมูล',
        'not_found'            => 'ไม่พบงานประมูล',
        'not_found_in_trash'   => 'ไม่พบงานประมูลในถังขยะ'
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'query_var'           => true,
        'rewrite'             => array('slug' => 'auction'),
        'capability_type'     => 'post',
        'has_archive'         => true,
        'hierarchical'        => false,
        'menu_position'       => 5,
        'menu_icon'           => 'dashicons-hammer',
        'supports'            => array('title', 'editor', 'thumbnail')
    );

    register_post_type('auction', $args);
}
add_action('init', 'create_auction_post_type');

// Custom Fields สำหรับงานประมูล
function add_auction_meta_boxes() {
    add_meta_box(
        'auction_details',
        'รายละเอียดงานประมูล',
        'auction_details_callback',
        'auction',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'add_auction_meta_boxes');

// Callback function สำหรับแสดง Custom Fields
function auction_details_callback($post) {
    wp_nonce_field('auction_details_nonce', 'auction_details_nonce');
    
    // ดึงค่าที่บันทึกไว้
    $start_date = get_post_meta($post->ID, '_auction_start_date', true);
    $end_date = get_post_meta($post->ID, '_auction_end_date', true);
    $project_content = get_post_meta($post->ID, '_project_content', true);
    $document_url = get_post_meta($post->ID, '_document_url', true);
    $document_path = get_post_meta($post->ID, '_document_path', true);
    $responsible_person = get_post_meta($post->ID, '_responsible_person', true);
    ?>
    
    <style>
        .auction-meta-row { margin-bottom: 15px; }
        .auction-meta-row label { display: block; margin-bottom: 5px; font-weight: bold; }
        .auction-meta-row input[type="date"], 
        .auction-meta-row input[type="text"] { width: 100%; }
        .auction-meta-row textarea { width: 100%; height: 150px; }
    </style>

    <div class="auction-meta-row">
        <label for="auction_start_date">วันที่เปิดประมูล:</label>
        <input type="date" id="auction_start_date" name="auction_start_date" value="<?php echo esc_attr($start_date); ?>">
    </div>

    <div class="auction-meta-row">
        <label for="auction_end_date">วันที่ปิดประมูล:</label>
        <input type="date" id="auction_end_date" name="auction_end_date" value="<?php echo esc_attr($end_date); ?>">
    </div>

    <div class="auction-meta-row">
        <label for="project_content">เนื้อหาโครงการ:</label>
        <?php
        wp_editor($project_content, 'project_content', array(
            'media_buttons' => true,
            'textarea_name' => 'project_content',
            'textarea_rows' => 10
        ));
        ?>
    </div>

    <div class="auction-meta-row">
        <label for="document_upload">แนบไฟล์เอกสาร:</label>
        <input type="text" id="document_url" name="document_url" value="<?php echo esc_url($document_url); ?>" readonly>
        <input type="hidden" id="document_path" name="document_path" value="<?php echo esc_attr($document_path); ?>">
        <input type="button" id="upload_document_button" class="button" value="เลือกไฟล์">
        <?php if ($document_url) : ?>
            <a href="<?php echo esc_url($document_url); ?>" target="_blank" class="button">ดูไฟล์</a>
        <?php endif; ?>
    </div>

    <div class="auction-meta-row">
        <label for="responsible_person">ชื่อผู้รับผิดชอบ:</label>
        <input type="text" id="responsible_person" name="responsible_person" value="<?php echo esc_attr($responsible_person); ?>">
    </div>

    <script>
    jQuery(document).ready(function($) {
        $('#upload_document_button').click(function(e) {
            e.preventDefault();
            var custom_uploader = wp.media({
                title: 'เลือกไฟล์เอกสาร',
                button: { text: 'เลือกไฟล์' },
                multiple: false
            });

            custom_uploader.on('select', function() {
                var attachment = custom_uploader.state().get('selection').first().toJSON();
                $('#document_url').val(attachment.url);
                $('#document_path').val(attachment.id);
            });

            custom_uploader.open();
        });
    });
    </script>
    <?php
}

// บันทึกข้อมูล Custom Fields
function save_auction_details($post_id) {
    if (!isset($_POST['auction_details_nonce']) || 
        !wp_verify_nonce($_POST['auction_details_nonce'], 'auction_details_nonce')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    // บันทึกข้อมูล
    if (isset($_POST['auction_start_date'])) {
        update_post_meta($post_id, '_auction_start_date', sanitize_text_field($_POST['auction_start_date']));
    }
    if (isset($_POST['auction_end_date'])) {
        update_post_meta($post_id, '_auction_end_date', sanitize_text_field($_POST['auction_end_date']));
    }
    if (isset($_POST['project_content'])) {
        update_post_meta($post_id, '_project_content', wp_kses_post($_POST['project_content']));
    }
    if (isset($_POST['document_url'])) {
        update_post_meta($post_id, '_document_url', esc_url_raw($_POST['document_url']));
    }
    if (isset($_POST['document_path'])) {
        update_post_meta($post_id, '_document_path', sanitize_text_field($_POST['document_path']));
    }
    if (isset($_POST['responsible_person'])) {
        update_post_meta($post_id, '_responsible_person', sanitize_text_field($_POST['responsible_person']));
    }
}
add_action('save_post_auction', 'save_auction_details');

// เพิ่ม columns ในหน้า list posts
function add_auction_columns($columns) {
    $new_columns = array();
    foreach($columns as $key => $value) {
        if ($key == 'date') {
            $new_columns['start_date'] = 'วันที่เปิดประมูล';
            $new_columns['end_date'] = 'วันที่ปิดประมูล';
            $new_columns['responsible'] = 'ผู้รับผิดชอบ';
        }
        $new_columns[$key] = $value;
    }
    return $new_columns;
}
add_filter('manage_auction_posts_columns', 'add_auction_columns');

// แสดงข้อมูลใน columns
function show_auction_columns($column, $post_id) {
    switch ($column) {
        case 'start_date':
            $date = get_post_meta($post_id, '_auction_start_date', true);
            echo $date ? date('d/m/Y', strtotime($date)) : '-';
            break;
        case 'end_date':
            $date = get_post_meta($post_id, '_auction_end_date', true);
            echo $date ? date('d/m/Y', strtotime($date)) : '-';
            break;
        case 'responsible':
            echo get_post_meta($post_id, '_responsible_person', true);
            break;
    }
}
add_action('manage_auction_posts_custom_column', 'show_auction_columns', 10, 2);


// Add menu page
function theme_settings_menu() {
    add_menu_page(
        'Theme Settings',
        'Theme Settings',
        'manage_options',
        'theme-settings',
        'theme_settings_page',
        'dashicons-admin-generic'
    );
}
add_action('admin_menu', 'theme_settings_menu');

// Register settings
function theme_settings_init() {
    register_setting('theme_settings', 'lazy_loading_enabled');
}
add_action('admin_init', 'theme_settings_init');

// Enqueue admin assets
function theme_settings_assets($hook) {
    if ($hook !== 'toplevel_page_theme-settings') return;
    
    wp_enqueue_style(
        'theme-settings-style',
        get_template_directory_uri() . '/css/admin-settings.css'
    );
    
    wp_enqueue_script(
        'theme-settings-script',
        get_template_directory_uri() . '/js/admin-settings.js',
        array('jquery'),
        '1.0',
        true
    );
    
    wp_localize_script('theme-settings-script', 'themeSettings', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('theme_settings_nonce')
    ));
}
add_action('admin_enqueue_scripts', 'theme_settings_assets');

// Settings page HTML
function theme_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('theme_settings');
            do_settings_sections('theme_settings');
            ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Lazy Loading Images</th>
                    <td>
                        <label class="switch">
                            <input type="checkbox" name="lazy_loading_enabled" 
                                id="lazy-loading-toggle" 
                                value="1" 
                                <?php checked(get_option('lazy_loading_enabled'), 1); ?>>
                            <span class="slider"></span>
                        </label>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// AJAX handler
function save_lazy_loading_setting() {
    check_ajax_referer('theme_settings_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized');
    }
    
    $enabled = isset($_POST['enabled']) ? (bool) $_POST['enabled'] : false;
    update_option('lazy_loading_enabled', $enabled);
    wp_send_json_success();
}
add_action('wp_ajax_save_lazy_loading', 'save_lazy_loading_setting');



/****** THEME FONT SIZE *******/

function enqueue_font_size_assets() {
    wp_enqueue_style('font-size-controls', get_template_directory_uri() . '/css/font-size-controls.css');
    wp_enqueue_script('font-size-controls', get_template_directory_uri() . '/js/font-size-controls.js', array('jquery'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_font_size_assets');

function font_size_shortcode($atts, $content = null) {
    ob_start();
    ?>
    <div class="font-size-control">
        <span class="font-size-label">ขนาดตัวอักษร</span>
        <button type="button" class="font-size-btn decrease-font" onclick="adjustFontSize('small')">-ก</button>
        <button type="button" class="font-size-btn reset-font" onclick="adjustFontSize('normal')">ก</button>
        <button type="button" class="font-size-btn increase-font" onclick="adjustFontSize('large')">+ก</button>
    </div>
    <?php
    $controls = ob_get_clean();
    return $controls;
}
add_shortcode('font_size', 'font_size_shortcode');


/**** THEME CONTRAST MODE ************/

function enqueue_contrast_mode_assets() {
    wp_enqueue_style('contrast-mode', get_template_directory_uri() . '/css/contrast-mode.css');
    wp_enqueue_script('contrast-mode', get_template_directory_uri() . '/js/contrast-mode.js', array('jquery'), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_contrast_mode_assets');

function contrast_mode_shortcode() {
    return '<div class="contrast-control">
        <button type="button" class="contrast-btn normal" onclick="setContrast(\'normal\')">ก</button>
        <button type="button" class="contrast-btn white" onclick="setContrast(\'white\')">ก</button>
        <button type="button" class="contrast-btn black" onclick="setContrast(\'black\')">ก</button>
    </div>';
}
add_shortcode('contrast_mode', 'contrast_mode_shortcode');



/***** ฟังก์ชั่นสร้างหน้าใหม่ **********/


// Enqueue necessary scripts and styles
function enqueue_page_category_assets() {
    // Enqueue styles
    wp_enqueue_style(
        'create-page-style',
        get_template_directory_uri() . '/css/create-page.css',
        array(),
        '1.0.1'
    );

    // Enqueue scripts
    wp_enqueue_script(
        'create-page-script',
        get_template_directory_uri() . '/js/create-page.js',
        array('jquery'),
        '1.0.1',
        true
    );

    // Localize script
    wp_localize_script(
        'create-page-script',
        'createPageVars',
        array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'categoryNonce' => wp_create_nonce('category_nonce'),
            'isLoggedIn' => is_user_logged_in()
        )
    );
}
add_action('wp_enqueue_scripts', 'enqueue_page_category_assets');

// AJAX Handler สำหรับจัดการ Category
function handle_category_ajax() {
	add_action('wp_ajax_move_and_delete_category', 'ajax_move_and_delete_category');
    add_action('wp_ajax_delete_category_with_content', 'ajax_delete_category_with_content');
    add_action('wp_ajax_create_new_category', 'ajax_create_category');
    add_action('wp_ajax_nopriv_create_new_category', 'ajax_create_category');
    add_action('wp_ajax_delete_category', 'ajax_delete_category');
    add_action('wp_ajax_nopriv_delete_category', 'ajax_delete_category');
}
add_action('init', 'handle_category_ajax');


function create_page_form_shortcode() {
    if (!current_user_can('publish_pages')) {
        return 'คุณไม่มีสิทธิ์ในการสร้างหน้า';
    }

    // ตรวจสอบการส่งฟอร์ม
    if (isset($_POST['create_page_submit']) && isset($_POST['page_nonce'])) {
        if (!wp_verify_nonce($_POST['page_nonce'], 'create_page_action')) {
            return 'การตรวจสอบความปลอดภัยล้มเหลว';
        }

        $page_title = sanitize_text_field($_POST['page_title']);
        
        $page_data = array(
            'post_title'    => $page_title,
            'post_content'  => '',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'post_author'   => get_current_user_id(),
        );

        $page_id = wp_insert_post($page_data);

        if (!is_wp_error($page_id)) {
            // จัดการหมวดหมู่
            if (!empty($_POST['page_category'])) {
                wp_set_object_terms($page_id, array(intval($_POST['page_category'])), 'category');
            }

            // เก็บข้อมูลสำหรับ Modal
            if (!session_id()) session_start();
            $_SESSION['page_created'] = array(
                'id' => $page_id,
                'title' => $page_title,
                'view_url' => get_permalink($page_id),
                'edit_url' => add_query_arg(
                    array(
                        'post'   => $page_id,
                        'action' => 'elementor'
                    ),
                    admin_url('post.php')
                )
            );
        }
    }

    // ดึงรายการหมวดหมู่
    $categories = get_categories(array(
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC'
    ));

    // สร้าง Output เริ่มต้น
    $output = '';

    // สร้าง Modal สำหรับการสร้างหน้าสำเร็จ
    if (isset($_SESSION['page_created'])) {
        $page_data = $_SESSION['page_created'];
        $output .= sprintf('
            <div id="successModal" class="modal">
                <div class="modal-content">
                    <h2>สร้างหน้าสำเร็จ</h2>
                    <p>สร้างหน้า "%s" เรียบร้อยแล้ว</p>
                    <div class="modal-buttons">
                        <a href="%s" class="modal-button view-button">ดูหน้านี้</a>
                        <a href="%s" class="modal-button edit-button">แก้ไขหน้านี้</a>
                    </div>
                </div>
            </div>',
            esc_html($page_data['title']),
            esc_url($page_data['view_url']),
            esc_url($page_data['edit_url'])
        );
        unset($_SESSION['page_created']);
    }

    // สร้าง Modal สำหรับการลบหมวดหมู่
    $output .= '
    <div id="deleteCategoryModal" class="modal">
        <div class="modal-content">
            <h2>ไม่สามารถลบหมวดหมู่</h2>
            <p class="error-message">เกิดข้อผิดพลาดในการลบหมวดหมู่: ไม่สามารถลบหมวดหมู่ที่มีเนื้อหาอยู่</p>
            
            <div class="category-move-section">
                <p>กรุณาเลือกหมวดหมู่ที่ต้องการย้ายเนื้อหาไป:</p>
                <select id="moveToCategory" class="category-select">
                    <option value="">เลือกหมวดหมู่</option>';

    foreach ($categories as $category) {
        if ($category->term_id != 1) {
            $output .= sprintf(
                '<option value="%d">%s</option>',
                $category->term_id,
                esc_html($category->name)
            );
        }
    }

    $output .= '
                </select>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="move-content-btn" onclick="moveAndDeleteCategory()">
                    ย้ายเนื้อหาและลบหมวดหมู่
                </button>
                <button type="button" class="delete-all-btn" onclick="deleteWithContent()">
                    ลบหมวดหมู่และเนื้อหาทั้งหมด
                </button>
                <button type="button" class="cancel-btn" onclick="closeDeleteModal()">
                    ยกเลิก
                </button>
            </div>
        </div>
    </div>';

    // สร้างฟอร์มหลัก
    $output .= '
    <div class="create-page-form-wrapper">
        <form method="post" class="create-page-form">
            ' . wp_nonce_field('create_page_action', 'page_nonce', true, false) . '
            
            <div class="form-group">
                <label for="page_title">ชื่อหน้า:</label>
                <input type="text" name="page_title" id="page_title" required>
            </div>
            
            <div class="form-group category-section">
                <label for="page_category">หมวดหมู่:</label>
                <div class="category-wrapper">
                    <select name="page_category" id="page_category">
                        <option value="">เลือกหมวดหมู่</option>';

    foreach ($categories as $category) {
        $output .= sprintf(
            '<option value="%d" data-has-delete="%s">%s</option>',
            $category->term_id,
            $category->term_id != 1 ? 'true' : 'false',
            esc_html($category->name)
        );
    }

    $output .= '
                    </select>
                    <button type="button" class="add-category-btn" onclick="toggleNewCategoryForm()">+</button>
                    <span id="delete-category-btn-wrapper"></span>
                </div>
                
                <div id="new-category-form" style="display: none;">
                    <div class="new-category-inputs">
                        <input type="text" id="new-category-name" placeholder="ชื่อหมวดหมู่ใหม่">
                        <button type="button" class="save-category-btn" onclick="saveNewCategory()">บันทึก</button>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <button type="submit" name="create_page_submit" class="submit-button">สร้างหน้าใหม่</button>
            </div>
        </form>
    </div>';

    return $output;
}
add_shortcode('create_page_form', 'create_page_form_shortcode');


function ajax_move_and_delete_category() {
    if (!check_ajax_referer('category_nonce', 'nonce', false)) {
        wp_send_json_error('Invalid security token');
        wp_die();
    }

    if (!current_user_can('manage_categories')) {
        wp_send_json_error('ไม่มีสิทธิ์ในการจัดการหมวดหมู่');
        wp_die();
    }

    $from_category = intval($_POST['from_category']);
    $to_category = intval($_POST['to_category']);

    // ย้ายโพสต์ทั้งหมดไปยังหมวดหมู่ใหม่
    $posts = get_posts(array(
        'category' => $from_category,
        'numberposts' => -1,
        'post_type' => array('post', 'page')
    ));

    foreach ($posts as $post) {
        wp_remove_object_terms($post->ID, $from_category, 'category');
        wp_set_object_terms($post->ID, $to_category, 'category', true);
    }

    // ลบหมวดหมู่เก่า
    $result = wp_delete_term($from_category, 'category');
    
    if (is_wp_error($result)) {
        wp_send_json_error($result->get_error_message());
        wp_die();
    }

    wp_send_json_success('ย้ายเนื้อหาและลบหมวดหมู่สำเร็จ');
    wp_die();
}


function ajax_delete_category_with_content() {
    if (!check_ajax_referer('category_nonce', 'nonce', false)) {
        wp_send_json_error('Invalid security token');
        wp_die();
    }

    if (!current_user_can('manage_categories')) {
        wp_send_json_error('ไม่มีสิทธิ์ในการจัดการหมวดหมู่');
        wp_die();
    }

    $category_id = intval($_POST['category_id']);

    // ลบโพสต์ทั้งหมดในหมวดหมู่
    $posts = get_posts(array(
        'category' => $category_id,
        'numberposts' => -1,
        'post_type' => array('post', 'page')
    ));

    foreach ($posts as $post) {
        wp_delete_post($post->ID, true);
    }

    // ลบหมวดหมู่
    $result = wp_delete_term($category_id, 'category');
    
    if (is_wp_error($result)) {
        wp_send_json_error($result->get_error_message());
        wp_die();
    }

    wp_send_json_success('ลบหมวดหมู่และเนื้อหาทั้งหมดสำเร็จ');
    wp_die();
}


function ajax_delete_category() {
    // ตรวจสอบ nonce
    if (!check_ajax_referer('category_nonce', 'nonce', false)) {
        wp_send_json_error('Invalid security token');
        wp_die();
    }

    // ตรวจสอบสิทธิ์
    if (!current_user_can('manage_categories')) {
        wp_send_json_error('ไม่มีสิทธิ์ในการจัดการหมวดหมู่');
        wp_die();
    }

    $category_id = intval($_POST['category_id']);
    
    // ตรวจสอบว่าเป็น Uncategorized หรือไม่
    if ($category_id === 1) {
        wp_send_json_error('ไม่สามารถลบหมวดหมู่ Uncategorized ได้');
        wp_die();
    }

    // ตรวจสอบว่ามีโพสต์ในหมวดหมู่หรือไม่
    $posts = get_posts(array(
        'category' => $category_id,
        'numberposts' => 1,
        'post_type' => array('post', 'page')
    ));

    if (!empty($posts)) {
        wp_send_json_error('ไม่สามารถลบหมวดหมู่ที่มีเนื้อหาอยู่');
        wp_die();
    }

    $result = wp_delete_term($category_id, 'category');
    
    if (is_wp_error($result)) {
        wp_send_json_error($result->get_error_message());
        wp_die();
    }

    wp_send_json_success('ลบหมวดหมู่สำเร็จ');
    wp_die();
}


// แก้ไขฟังก์ชัน ajax_create_category
function ajax_create_category() {
    // ตรวจสอบ nonce
    if (!check_ajax_referer('category_nonce', 'nonce', false)) {
        wp_send_json_error('Invalid security token');
        exit;
    }

    // ตรวจสอบสิทธิ์
    if (!current_user_can('manage_categories')) {
        wp_send_json_error('ไม่มีสิทธิ์ในการจัดการหมวดหมู่');
        exit;
    }

    // ตรวจสอบข้อมูลที่ส่งมา
    if (empty($_POST['category_name'])) {
        wp_send_json_error('กรุณากรอกชื่อหมวดหมู่');
        exit;
    }
    
    $cat_name = sanitize_text_field($_POST['category_name']);
    $random_slug = 'cat_' . rand(1000, 9999);
    
    $new_cat = wp_insert_term(
        $cat_name,
        'category',
        array('slug' => $random_slug)
    );

    if (is_wp_error($new_cat)) {
        wp_send_json_error($new_cat->get_error_message());
        exit;
    }

    wp_send_json_success(array(
        'id' => $new_cat['term_id'],
        'name' => $cat_name
    ));
    exit;
}