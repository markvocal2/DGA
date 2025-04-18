/**
 * Post Featured Images JavaScript
 */
(function($) {
    'use strict';
    
    // Wait for the document to be ready
    $(document).ready(function() {
        // จัดการกรณีที่ภาพโหลดไม่สำเร็จ
        $('.post-featured-image').on('error', function() {
            $(this).attr('src', 'https://standard.wpdevs.co/wp-content/uploads/2025/03/no-images-scaled-2.jpg');
            $(this).addClass('fallback-featured-image');
        });
    });
    
})(jQuery);