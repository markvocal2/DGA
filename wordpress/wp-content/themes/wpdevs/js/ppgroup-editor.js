jQuery(document).ready(function($) {
    let saveTimeout;
    const editor = $('.ppgroup-editor');
    
    // ฟังก์ชันสำหรับอัพเดต Terms
    function updateTerms() {
        const postId = editor.data('post-id');
        const selectedTerms = [];
        
        // รวบรวม terms ที่เลือก
        editor.find('input[name="ppgroup_terms[]"]:checked').each(function() {
            selectedTerms.push($(this).val());
        });
        
        // แสดงสถานะกำลังบันทึก
        editor.find('.save-status')
            .html('<span class="saving">กำลังบันทึก...</span>')
            .fadeIn();
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: ppgroupEditor.ajaxurl,
            type: 'POST',
            data: {
                action: 'ppgroup_editor_update',
                nonce: ppgroupEditor.nonce,
                post_id: postId,
                term_ids: selectedTerms
            },
            success: function(response) {
                if (response.success) {
                    editor.find('.save-status')
                        .html('<span class="saved">✓ ' + response.data.message + '</span>')
                        .delay(2000)
                        .fadeOut();
                } else {
                    editor.find('.save-status')
                        .html('<span class="error">เกิดข้อผิดพลาด: ' + response.data + '</span>');
                }
            },
            error: function() {
                editor.find('.save-status')
                    .html('<span class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ</span>');
            }
        });
    }
    
    // จัดการ Event เมื่อมีการเปลี่ยนแปลง checkbox
    editor.on('change', 'input[type="checkbox"]', function() {
        // ยกเลิก timeout เดิม
        clearTimeout(saveTimeout);
        
        // ตั้ง timeout ใหม่
        saveTimeout = setTimeout(updateTerms, 500);
        
        // เพิ่ม Animation
        $(this).closest('.ppgroup-term-checkbox')
            .addClass('changed')
            .delay(300)
            .queue(function(next) {
                $(this).removeClass('changed');
                next();
            });
    });
    
    // เพิ่ม Animation เมื่อโหลดหน้า
    editor.find('.ppgroup-term-checkbox').each(function(index) {
        $(this).css({
            'animation-delay': (index * 0.05) + 's'
        }).addClass('fade-in');
    });
});