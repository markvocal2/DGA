// ไฟล์ js/admin-shortcode.js
jQuery(document).ready(function($) {
    // แก้ไข Shortcode
    $('.edit-shortcode').click(function() {
        var id = $(this).data('id');
        var name = $(this).data('name');
        var description = $(this).data('description');
        var usage = $(this).data('usage');
        
        $('input[name="shortcode_id"]').val(id);
        $('#shortcode_name').val(name);
        $('#description').val(description);
        $('#usage_example').val(usage);
        
        $('#cancel-edit').show();
        $('html, body').animate({
            scrollTop: $("#shortcode-form").offset().top
        }, 500);
    });
    
    // ยกเลิกการแก้ไข
    $('#cancel-edit').click(function() {
        $('#shortcode-form')[0].reset();
        $('input[name="shortcode_id"]').val('');
        $(this).hide();
    });
    
    // ลบ Shortcode
    $('.delete-shortcode').click(function() {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ Shortcode นี้?')) {
            return;
        }
        
        var id = $(this).data('id');
        
        $.ajax({
            url: shortcodeAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_shortcode',
                shortcode_id: id,
                nonce: shortcodeAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data);
                }
            }
        });
    });
    
    // บันทึก Shortcode
    $('#shortcode-form').submit(function(e) {
        e.preventDefault();
        
        $.ajax({
            url: shortcodeAjax.ajaxurl,
            type: 'POST',
            data: $(this).serialize() + '&action=save_shortcode&nonce=' + shortcodeAjax.nonce,
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data);
                }
            }
        });
    });

    // เพิ่มฟังก์ชันแสดงข้อความแจ้งเตือน
    function showNotification(message, type = 'success') {
        var notification = $('<div/>')
            .addClass('notice notice-' + type + ' is-dismissible')
            .append($('<p/>').text(message));
            
        $('.wrap h1').after(notification);
        
        // Auto dismiss after 3 seconds
        setTimeout(function() {
            notification.fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }
});