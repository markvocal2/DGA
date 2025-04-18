// Save this file to your child theme's /js/footer-template-manager.js

jQuery(document).ready(function($) {
    $('.activate-template').on('click', function(e) {
        e.preventDefault();
        
        const button = $(this);
        const templateId = button.data('template-id');
        const container = button.closest('.template-item');
        
        // Disable button during request
        button.prop('disabled', true);
        
        // Add loading state
        container.addClass('loading');
        
        $.ajax({
            url: footerManager.ajaxUrl,
            type: 'POST',
            data: {
                action: 'activate_footer_template',
                template_id: templateId,
                nonce: footerManager.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Update UI
                    $('.template-item').removeClass('active');
                    container.addClass('active');
                    
                    // Show success message
                    const message = $('<div class="success-message">Template activated successfully!</div>');
                    container.append(message);
                    setTimeout(() => message.fadeOut('slow', function() { $(this).remove(); }), 3000);
                    
                    // Reload page to show changes
                    setTimeout(() => location.reload(), 1000);
                } else {
                    // Show error message
                    const message = $('<div class="error-message">Failed to activate template</div>');
                    container.append(message);
                    setTimeout(() => message.fadeOut('slow', function() { $(this).remove(); }), 3000);
                }
            },
            error: function() {
                // Show error message
                const message = $('<div class="error-message">Server error occurred</div>');
                container.append(message);
                setTimeout(() => message.fadeOut('slow', function() { $(this).remove(); }), 3000);
            },
            complete: function() {
                // Re-enable button and remove loading state
                button.prop('disabled', false);
                container.removeClass('loading');
            }
        });
    });
});