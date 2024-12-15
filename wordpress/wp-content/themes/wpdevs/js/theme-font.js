// /js/theme-font.js
jQuery(document).ready(function($) {
    $('.font-family-select, .font-weight-select').on('change', function() {
        const element = $(this).data('element');
        const fontFamily = $(`.font-family-select[data-element="${element}"]`).val();
        const fontWeight = $(`.font-weight-select[data-element="${element}"]`).val();
        
        // อัพเดตการแสดงผลทันที
        $(element + '.preview-text').css({
            'font-family': fontFamily,
            'font-weight': fontWeight
        });
        
        // บันทึกค่าอัตโนมัติ
        $.ajax({
            url: themeSettings.ajaxurl,
            type: 'POST',
            data: {
                action: 'save_font_settings',
                nonce: themeSettings.nonce,
                element: element,
                font_family: fontFamily,
                font_weight: fontWeight
            },
            success: function(response) {
                console.log('Saved settings for ' + element);
            }
        });
    });
});