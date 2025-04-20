/**
 * JavaScript สำหรับการแก้ไขเนื้อหา WordPress ด้วย AJAX
 */
jQuery(document).ready(function($) {
    // เปิดฟอร์มแก้ไข
    $(document).on('click', '.edit-wpcontent-button', function(e) {
        e.preventDefault();
        const container = $(this).closest('.edit-wpcontent-container');
        container.find('.edit-wpcontent-content').hide();
        container.find('.edit-wpcontent-form').fadeIn();
        container.find('.edit-wpcontent-button').hide();
        container.find('.edit-wpcontent-textarea').focus();
    });
    
    // ยกเลิกการแก้ไข
    $(document).on('click', '.edit-wpcontent-cancel', function(e) {
        e.preventDefault();
        const container = $(this).closest('.edit-wpcontent-container');
        container.find('.edit-wpcontent-form').hide();
        container.find('.edit-wpcontent-content').fadeIn();
        container.find('.edit-wpcontent-button').fadeIn();
    });
    
    // บันทึกการแก้ไข
    $(document).on('click', '.edit-wpcontent-save', function(e) {
        e.preventDefault();
        const container = $(this).closest('.edit-wpcontent-container');
        const saveButton = $(this);
        const content = container.find('.edit-wpcontent-textarea').val();
        const postId = container.data('id');
        const field = container.data('field');
        const nonce = container.data('nonce');
        
        // แสดงสถานะกำลังโหลด
        saveButton.text('กำลังบันทึก...');
        saveButton.prop('disabled', true);
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: editWpContent.ajaxurl,
            type: 'POST',
            data: {
                action: 'edit_wpcontent_save',
                post_id: postId,
                content: content,
                field: field,
                nonce: nonce
            },
            success: function(response) {
                if (response.success) {
                    // อัปเดตเนื้อหาที่แสดง
                    container.find('.edit-wpcontent-content').html(response.data.formatted_content);
                    
                    // แสดงข้อความสำเร็จ
                    const notification = $('<div class="edit-wpcontent-notification success">' + editWpContent.messages.success + '</div>');
                    container.append(notification);
                    
                    // ซ่อนฟอร์ม แสดงเนื้อหา
                    container.find('.edit-wpcontent-form').hide();
                    container.find('.edit-wpcontent-content').fadeIn();
                    container.find('.edit-wpcontent-button').fadeIn();
                    
                    // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
                    setTimeout(function() {
                        notification.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 3000);
                } else {
                    // แสดงข้อความผิดพลาด
                    const notification = $('<div class="edit-wpcontent-notification error">' + editWpContent.messages.error + '</div>');
                    container.append(notification);
                    
                    // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
                    setTimeout(function() {
                        notification.fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 3000);
                }
            },
            error: function() {
                // แสดงข้อความผิดพลาด
                const notification = $('<div class="edit-wpcontent-notification error">' + editWpContent.messages.error + '</div>');
                container.append(notification);
                
                // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
                setTimeout(function() {
                    notification.fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 3000);
            },
            complete: function() {
                // คืนค่าปุ่มบันทึก
                saveButton.text('บันทึก');
                saveButton.prop('disabled', false);
            }
        });
    });
    
    // อนุญาตให้กด Escape เพื่อยกเลิกการแก้ไข
    $(document).keyup(function(e) {
        if (e.key === "Escape") {
            $('.edit-wpcontent-cancel:visible').trigger('click');
        }
    });
    
    // อนุญาตให้กด Ctrl+Enter เพื่อบันทึก
    $(document).on('keydown', '.edit-wpcontent-textarea', function(e) {
        if (e.ctrlKey && e.keyCode === 13) {
            $(this).closest('.edit-wpcontent-container').find('.edit-wpcontent-save').trigger('click');
        }
    });
});
