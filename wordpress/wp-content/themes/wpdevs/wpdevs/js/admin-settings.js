jQuery(document).ready(function($) {
    // Tab switching
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');
        
        $('.tab-content').hide();
        $($(this).attr('href')).show();
    });

    // Lazy loading toggle
    $('#lazy-loading-toggle').on('change', function() {
        $.ajax({
            url: themeSettings.ajaxurl,
            type: 'POST',
            data: {
                action: 'save_lazy_loading',
                nonce: themeSettings.nonce,
                enabled: this.checked
            },
            success: function(response) {
                if (response.success) {
                    alert('Lazy loading setting saved');
                }
            }
        });
    });
});