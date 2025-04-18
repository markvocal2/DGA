/**
 * Post Status Toggle JavaScript
 * จัดการการทำงานของ Toggle Switch และส่ง AJAX request
 */
(function($) {
    $(document).ready(function() {
        $('.at-status-toggle-switch').on('click', function() {
            var container = $(this).closest('.at-status-toggle-container');
            var postId = container.data('post-id');
            var toggleSwitch = $(this);
            var messageBox = container.find('.at-status-toggle-message');
            var labelBox = container.find('.at-status-toggle-label');
            
            // กำหนดสถานะใหม่จากคลาสปัจจุบัน
            var currentStatus = toggleSwitch.hasClass('active') ? 'active' : 'inactive';
            var newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            // แสดงสถานะกำลังโหลด
            toggleSwitch.addClass('loading');
            messageBox.html('กำลังอัพเดต...');
            
            // ส่ง AJAX request
            $.ajax({
                url: atStatusToggle.ajaxurl,
                type: 'POST',
                data: {
                    action: 'at_status_toggle',
                    post_id: postId,
                    status: newStatus,
                    nonce: atStatusToggle.nonce
                },
                success: function(response) {
                    toggleSwitch.removeClass('loading');
                    
                    if (response.success) {
                        // อัพเดตรูปแบบของ switch
                        toggleSwitch.removeClass('active inactive').addClass(newStatus);
                        
                        // แปลงสถานะให้ขึ้นต้นด้วยตัวใหญ่
                        var displayStatus = newStatus === 'active' ? 'Active' : 'Inactive';
                        labelBox.text(displayStatus);
                        
                        // แสดงข้อความสำเร็จ
                        messageBox.html('<span class="success">อัพเดตสำเร็จ!</span>');
                        
                        // ล้างข้อความหลังจาก 2 วินาที
                        setTimeout(function() {
                            messageBox.html('');
                        }, 2000);
                    } else {
                        // แสดงข้อความผิดพลาด
                        messageBox.html('<span class="error">' + response.data.message + '</span>');
                        
                        // ล้างข้อความหลังจาก 3 วินาที
                        setTimeout(function() {
                            messageBox.html('');
                        }, 3000);
                    }
                },
                error: function() {
                    toggleSwitch.removeClass('loading');
                    messageBox.html('<span class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</span>');
                    
                    setTimeout(function() {
                        messageBox.html('');
                    }, 3000);
                }
            });
        });
    });
})(jQuery);