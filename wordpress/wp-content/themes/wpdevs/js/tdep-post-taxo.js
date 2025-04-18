jQuery(document).ready(function($) {
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
        
        $.ajax({
            url: tdepAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'tdep_update_taxonomy',
                nonce: tdepAjax.nonce,
                post_id: postId,
                term_id: termId
            },
            beforeSend: function() {
                container.addClass('tdep-loading');
            },
            success: function(response) {
                if (response.success) {
                    const termLink = container.find('.tdep-term-link');
                    termLink.text(response.data.term_name);
                    termLink.attr('href', response.data.term_link);
                    
                    container.find('.tdep-edit-form').hide();
                    termLink.show();
                    container.find('.tdep-edit-btn').show();
                    
                    // Show success message
                    const message = $('<div class="tdep-message tdep-success">บันทึกเรียบร้อย</div>');
                    container.append(message);
                    setTimeout(() => message.fadeOut(() => message.remove()), 2000);
                }
            },
            error: function() {
                // Show error message
                const message = $('<div class="tdep-message tdep-error">เกิดข้อผิดพลาด กรุณาลองใหม่</div>');
                container.append(message);
                setTimeout(() => message.fadeOut(() => message.remove()), 2000);
            },
            complete: function() {
                container.removeClass('tdep-loading');
            }
        });
    });
});