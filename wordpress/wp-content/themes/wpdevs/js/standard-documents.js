// /js/standard-documents.js

jQuery(document).ready(function($) {
    // เพิ่ม Loading State เมื่อกดดาวน์โหลด
    $('.download-button').on('click', function() {
        const $button = $(this);
        const originalText = $button.find('.button-text').text();
        
        $button.addClass('loading');
        $button.find('.button-text').text('กำลังดาวน์โหลด...');
        
        // คืนค่าปุ่มหลังจาก 2 วินาที
        setTimeout(function() {
            $button.removeClass('loading');
            $button.find('.button-text').text(originalText);
        }, 2000);
    });

    // เพิ่ม Keyboard Navigation
    $('.standard-docs-table').on('keydown', 'a', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
        }
    });

    // เพิ่ม Touch feedback สำหรับอุปกรณ์มือถือ
    $('.download-button').on('touchstart', function() {
        $(this).addClass('touch-active');
    }).on('touchend touchcancel', function() {
        $(this).removeClass('touch-active');
    });
});