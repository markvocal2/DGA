jQuery(document).ready(function($) {
    // Handle edit button click
    $(document).on('click', '.wptax-edit-btn', function(e) {
        e.preventDefault();
        const container = $(this).closest('.wptax-term-display');
        container.find('.wptax-terms-container, .wptax-no-term').hide();
        container.find('.wptax-edit-btn').hide();
        container.find('.wptax-edit-form').fadeIn();
    });
    
    // Handle cancel button click
    $(document).on('click', '.wptax-cancel-btn', function(e) {
        e.preventDefault();
        const container = $(this).closest('.wptax-term-display');
        container.find('.wptax-edit-form').hide();
        container.find('.wptax-terms-container, .wptax-no-term').show();
        container.find('.wptax-edit-btn').show();
    });
    
    // Handle save button click
    $(document).on('click', '.wptax-save-btn', function(e) {
        e.preventDefault();
        const container = $(this).closest('.wptax-term-display');
        const postId = container.data('post-id');
        const taxonomy = container.data('taxonomy');
        
        // เก็บค่า term IDs ที่ถูกเลือกทั้งหมด
        let termIds = [];
        container.find('.wptax-term-checkbox:checked').each(function() {
            termIds.push($(this).val());
        });
        
        console.log('Selected Term IDs:', termIds); // ตรวจสอบค่าที่เลือก
        
        $.ajax({
            url: wptaxAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'wptax_update_taxonomy',
                nonce: wptaxAjax.nonce,
                post_id: postId,
                term_ids: termIds,
                taxonomy: taxonomy
            },
            beforeSend: function() {
                container.addClass('wptax-loading');
            },
            success: function(response) {
                console.log('AJAX Response:', response); // แสดงค่าตอบกลับ
                
                if (response.success) {
                    // สร้าง HTML สำหรับแสดง terms ที่ถูกเลือก
                    if (response.data.terms.length === 0) {
                        // No terms selected
                        if (container.find('.wptax-no-term').length === 0) {
                            container.prepend('<span class="wptax-no-term">ไม่มีหมวดหมู่กำหนด</span>');
                        }
                        container.find('.wptax-no-term').show();
                        container.find('.wptax-terms-container').hide();
                    } else {
                        // Terms selected
                        const termLinks = response.data.terms.map(function(term) {
                            return '<a href="' + term.link + '" class="wptax-term-link">' + term.name + '</a>';
                        });
                        
                        if (container.find('.wptax-terms-container').length === 0) {
                            container.prepend('<div class="wptax-terms-container">' + termLinks.join(', ') + '</div>');
                        } else {
                            container.find('.wptax-terms-container').html(termLinks.join(', ')).show();
                        }
                        container.find('.wptax-no-term').hide();
                    }
                    
                    container.find('.wptax-edit-form').hide();
                    container.find('.wptax-edit-btn').show();
                    
                    // Show success message
                    const message = $('<div class="wptax-message wptax-success">บันทึกเรียบร้อย</div>');
                    $('body').append(message);
                    setTimeout(() => message.fadeOut(() => message.remove()), 2000);
                } else if (response.data) {
                    // Show error message with details
                    const message = $('<div class="wptax-message wptax-error">เกิดข้อผิดพลาด: ' + response.data + '</div>');
                    $('body').append(message);
                    setTimeout(() => message.fadeOut(() => message.remove()), 3000);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error, xhr.responseText);
                // Show error message
                const message = $('<div class="wptax-message wptax-error">เกิดข้อผิดพลาด กรุณาลองใหม่</div>');
                $('body').append(message);
                setTimeout(() => message.fadeOut(() => message.remove()), 2000);
            },
            complete: function() {
                container.removeClass('wptax-loading');
            }
        });
    });
});