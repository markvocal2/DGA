/**
 * CKAN Secret Toggle - JavaScript
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Toggle switch click handler
        $('.ckan-secret-toggle').on('click', function() {
            var container = $(this).closest('.ckan-secret-toggle-container');
            var postId = container.data('post-id');
            var isCurrentlySecret = $(this).hasClass('is-secret');
            var newState = !isCurrentlySecret;
            
            // แสดงสถานะกำลังโหลด
            container.addClass('is-loading');
            
            // ส่ง AJAX request เพื่ออัปเดต term
            $.ajax({
                url: ckanSecretData.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_secret_update_term',
                    nonce: ckanSecretData.nonce,
                    post_id: postId,
                    is_secret: newState
                },
                success: function(response) {
                    if (response.success) {
                        // อัปเดต UI
                        if (newState) {
                            container.find('.ckan-secret-toggle').removeClass('is-public').addClass('is-secret');
                            container.find('.status-text').text('ข้อมูลลับ');
                        } else {
                            container.find('.ckan-secret-toggle').removeClass('is-secret').addClass('is-public');
                            container.find('.status-text').text('ข้อมูลสาธารณะ');
                        }
                        
                        // แสดงการแจ้งเตือนสำเร็จ
                        showNotification(container, 'success', 'อัปเดตสถานะเรียบร้อยแล้ว');
                    } else {
                        // แสดงการแจ้งเตือนข้อผิดพลาด
                        showNotification(container, 'error', 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
                        console.error('Error:', response.data);
                    }
                },
                error: function(xhr, status, error) {
                    // แสดงการแจ้งเตือนข้อผิดพลาด
                    showNotification(container, 'error', 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
                    console.error('AJAX Error:', error);
                },
                complete: function() {
                    // ลบสถานะกำลังโหลด
                    container.removeClass('is-loading');
                }
            });
        });
        
        // ฟังก์ชันสำหรับแสดงการแจ้งเตือน
        function showNotification(container, type, message) {
            var notification = $('<div class="ckan-notification ' + type + '">' + message + '</div>');
            container.append(notification);
            
            // ลบการแจ้งเตือนอัตโนมัติหลังจาก 3 วินาที
            setTimeout(function() {
                notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
})(jQuery);