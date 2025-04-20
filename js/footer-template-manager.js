// Save this file to your child theme's /js/footer-template-manager.js
jQuery(document).ready(($) => {
    // Event listener สำหรับปุ่มเปิดใช้งานเทมเพลต
    $('.activate-template').on('click', handleTemplateActivation);
    
    /**
     * จัดการการคลิกปุ่มเปิดใช้งานเทมเพลต
     */
    function handleTemplateActivation(e) {
        e.preventDefault();
        
        const button = $(this);
        const templateId = button.data('template-id');
        const container = button.closest('.template-item');
        
        // เตรียมสถานะ UI ก่อนส่งคำขอ
        setupRequestState(button, container);
        
        // สร้าง config สำหรับ AJAX request
        const ajaxConfig = createAjaxConfig(templateId, container, button);
        
        // ส่งคำขอ AJAX
        $.ajax(ajaxConfig);
    }
    
    /**
     * ตั้งค่าสถานะ UI ก่อนส่งคำขอ
     */
    function setupRequestState(button, container) {
        // ปิดการใช้งานปุ่มระหว่างส่งคำขอ
        button.prop('disabled', true);
        
        // เพิ่มสถานะ loading
        container.addClass('loading');
    }
    
    /**
     * สร้าง configuration สำหรับ AJAX request
     */
    function createAjaxConfig(templateId, container, button) {
        return {
            url: footerManager.ajaxUrl,
            type: 'POST',
            data: {
                action: 'activate_footer_template',
                template_id: templateId,
                nonce: footerManager.nonce
            },
            success: (response) => handleSuccess(response, container),
            error: () => handleError(container),
            complete: () => restoreUIState(button, container)
        };
    }
    
    /**
     * จัดการกรณี AJAX สำเร็จ
     */
    function handleSuccess(response, container) {
        if (response.success) {
            // อัปเดต UI
            $('.template-item').removeClass('active');
            container.addClass('active');
            
            // แสดงข้อความสำเร็จ
            showMessage(container, 'success', 'Template activated successfully!');
            
            // รีโหลดหน้าเพื่อแสดงการเปลี่ยนแปลง
            setTimeout(() => location.reload(), 1000);
        } else {
            // แสดงข้อความผิดพลาด
            showMessage(container, 'error', 'Failed to activate template');
        }
    }
    
    /**
     * จัดการกรณี AJAX ผิดพลาด
     */
    function handleError(container) {
        showMessage(container, 'error', 'Server error occurred');
    }
    
    /**
     * คืนค่าสถานะ UI หลังจาก AJAX เสร็จสิ้น
     */
    function restoreUIState(button, container) {
        // เปิดใช้งานปุ่มอีกครั้ง และลบสถานะ loading
        button.prop('disabled', false);
        container.removeClass('loading');
    }
    
    /**
     * แสดงข้อความแจ้งเตือน
     */
    function showMessage(container, type, text) {
        const message = $(`<div class="${type}-message">${text}</div>`);
        container.append(message);
        
        // ซ่อนและลบข้อความหลังจาก 3 วินาที
        setTimeout(() => {
            message.fadeOut('slow', function() {
                $(this).remove();
            });
        }, 3000);
    }
});
