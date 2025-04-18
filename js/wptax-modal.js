/**
 * Modal Popup บังคับกำหนดหมวดหมู่สำหรับ Post
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        initWptaxCategoryModal();
    });

    function initWptaxCategoryModal() {
        const $modal = $('#wptax-category-modal');
        
        // ถ้าไม่พบ Modal ให้ return
        if ($modal.length === 0) {
            return;
        }
        
        // เริ่มต้นกำหนดค่าต่างๆ
        const postId = $modal.data('post-id');
        let isProcessing = false;
        
        // แสดง Modal อัตโนมัติ
        setTimeout(function() {
            openModal();
        }, 500);
        
        // Event Handlers
        $('.wptax-modal-close, .wptax-cancel-btn, .wptax-modal-overlay').on('click', function(e) {
            e.preventDefault();
            closeModal();
        });
        
        // ป้องกันการปิด Modal เมื่อคลิกที่ Modal Container
        $('.wptax-modal-container').on('click', function(e) {
            e.stopPropagation();
        });
        
        // กดปุ่ม ESC เพื่อปิด Modal
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $modal.hasClass('wptax-modal-active')) {
                closeModal();
            }
        });
        
        // บันทึกหมวดหมู่
        $('.wptax-save-btn').on('click', function(e) {
            e.preventDefault();
            
            if (isProcessing) {
                return;
            }
            
            // เก็บค่า terms จากทุก select
            const terms = {};
            let hasSelection = false;
            
            $('.wptax-taxonomy-section').each(function() {
                const taxonomy = $(this).data('taxonomy');
                const termId = $(this).find('.wptax-term-select').val();
                
                if (termId) {
                    terms[taxonomy] = termId;
                    hasSelection = true;
                }
            });
            
            // ถ้าไม่มีการเลือกหมวดหมู่
            if (!hasSelection) {
                showMessage('กรุณาเลือกอย่างน้อย 1 หมวดหมู่', 'error');
                return;
            }
            
            // ส่งข้อมูลไปบันทึกผ่าน AJAX
            saveTerms(terms);
        });
        
        /**
         * ฟังก์ชั่นบันทึกหมวดหมู่
         */
        function saveTerms(terms) {
            isProcessing = true;
            
            // เพิ่ม loading state
            $('.wptax-modal-container').addClass('wptax-loading');
            
            $.ajax({
                url: wptaxModal.ajaxurl,
                type: 'POST',
                data: {
                    action: 'wptax_save_category_terms',
                    post_id: postId,
                    terms: terms,
                    nonce: wptaxModal.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(response.data.message, 'success');
                        
                        // หน่วงเวลา 1.5 วินาที ก่อนปิด Modal
                        setTimeout(function() {
                            closeModal();
                            // รีเฟรชหน้าเพื่อให้เห็นการเปลี่ยนแปลง
                            window.location.reload();
                        }, 1500);
                    } else {
                        showMessage(response.data.message, 'error');
                    }
                },
                error: function() {
                    showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่', 'error');
                },
                complete: function() {
                    isProcessing = false;
                    $('.wptax-modal-container').removeClass('wptax-loading');
                }
            });
        }
        
        /**
         * ฟังก์ชั่นแสดง Modal
         */
        function openModal() {
            $modal.addClass('wptax-modal-active');
            $('body').addClass('wptax-modal-open');
        }
        
        /**
         * ฟังก์ชั่นปิด Modal
         */
        function closeModal() {
            $modal.removeClass('wptax-modal-active');
            $('body').removeClass('wptax-modal-open');
        }
        
        /**
         * ฟังก์ชั่นแสดงข้อความ
         */
        function showMessage(message, type) {
            const $messageContainer = $('.wptax-message-container');
            const messageClass = type === 'success' ? 'wptax-success-message' : 'wptax-error-message';
            
            $messageContainer.html(`
                <div class="wptax-message ${messageClass}">
                    ${message}
                </div>
            `);
            
            // ทำให้ข้อความหายไปหลังจาก 5 วินาที (กรณี error)
            if (type === 'error') {
                setTimeout(function() {
                    $messageContainer.find('.wptax-message').fadeOut(300, function() {
                        $(this).remove();
                    });
                }, 5000);
            }
        }
        
        // ปรับขนาด Modal ให้พอดีกับหน้าจอ
        $(window).on('resize', function() {
            adjustModalHeight();
        });
        
        function adjustModalHeight() {
            const windowHeight = $(window).height();
            const $modalBody = $('.wptax-modal-body');
            const headerHeight = $('.wptax-modal-header').outerHeight();
            const footerHeight = $('.wptax-modal-footer').outerHeight();
            const padding = 40; // padding รวม
            
            const maxBodyHeight = windowHeight - headerHeight - footerHeight - padding;
            $modalBody.css('max-height', maxBodyHeight + 'px');
        }
        
        // เรียกใช้งานครั้งแรก
        adjustModalHeight();
    }

})(jQuery);