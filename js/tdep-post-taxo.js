jQuery(document).ready(($) => {
    // ฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
    function showMessage(container, isSuccess) {
        const messageClass = isSuccess ? 'tdep-success' : 'tdep-error';
        const messageText = isSuccess ? 'บันทึกเรียบร้อย' : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        
        const message = $(`<div class="tdep-message ${messageClass}">${messageText}</div>`);
        container.append(message);
        
        setTimeout(() => {
            message.fadeOut(() => message.remove());
        }, 2000);
    }
    
    // ฟังก์ชันสำหรับอัพเดตการแสดงผลหลังจากบันทึกสำเร็จ
    function updateTermDisplay(container, responseData) {
        const termLink = container.find('.tdep-term-link');
        termLink.text(responseData.term_name);
        termLink.attr('href', responseData.term_link);
        
        container.find('.tdep-edit-form').hide();
        termLink.show();
        container.find('.tdep-edit-btn').show();
        
        // แสดงข้อความสำเร็จ
        showMessage(container, true);
    }
    
    // ฟังก์ชันสำหรับจัดการกับผลลัพธ์จาก AJAX
    function handleAjaxResponse(response, container) {
        if (response.success) {
            updateTermDisplay(container, response.data);
        } else {
            showMessage(container, false);
        }
    }
    
    // ฟังก์ชันสำหรับจัดการกับข้อผิดพลาดจาก AJAX
    function handleAjaxError(container) {
        showMessage(container, false);
    }
    
    // ฟังก์ชันสำหรับส่งคำขอ AJAX อัพเดตข้อมูล
    function updateTaxonomy(container, postId, termId) {
        // แสดงสถานะกำลังโหลด
        container.addClass('tdep-loading');
        
        $.ajax({
            url: tdepAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'tdep_update_taxonomy',
                nonce: tdepAjax.nonce,
                post_id: postId,
                term_id: termId
            },
            success: (response) => handleAjaxResponse(response, container),
            error: () => handleAjaxError(container),
            complete: () => container.removeClass('tdep-loading')
        });
    }

    // Handle edit button click
    $('.tdep-edit-btn').on('click', function(e) {
        e.preventDefault();
        const container = $(this).closest('.tdep-term-display');
        container.find('.tdep-term-link').hide();
        container.find('.tdep-edit-btn').hide();
        container.find('.tdep-edit-form').fadeIn();
    });
    
    // Handle cancel button click
    $('.tdep-cancel-btn').on('click', function(e) {
        e.preventDefault();
        const container = $(this).closest('.tdep-term-display');
        container.find('.tdep-edit-form').hide();
        container.find('.tdep-term-link').show();
        container.find('.tdep-edit-btn').show();
    });
    
    // Handle save button click
    $('.tdep-save-btn').on('click', function(e) {
        e.preventDefault();
        const container = $(this).closest('.tdep-term-display');
        const postId = container.data('post-id');
        const termId = container.find('.tdep-term-select').val();
        
        updateTaxonomy(container, postId, termId);
    });
});
