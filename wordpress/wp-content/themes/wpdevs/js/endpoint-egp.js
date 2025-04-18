jQuery(document).ready(function($) {
    // Click handler for EGP items
    $('.egp-item').on('click', function() {
        const postId = $(this).data('id');
        const $content = $(this).find('.egp-content');
        
        // Toggle content visibility
        if ($content.hasClass('loading')) {
            return;
        }
        
        if (!$content.hasClass('loaded')) {
            $content.addClass('loading');
            
            // Fetch data from API
            $.ajax({
                url: egpData.ajaxurl,
                type: 'POST',
                data: {
                    action: 'egp_api_endpoint',
                    post_id: postId,
                    nonce: egpData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Update content with API data
                        const data = response.data;
                        let html = '';
                        
                        for (const [key, value] of Object.entries(data)) {
                            if (typeof value === 'string' || typeof value === 'number') {
                                html += `
                                    <div class="egp-field">
                                        <strong>${key}:</strong> ${value}
                                    </div>
                                `;
                            }
                        }
                        
                        $content.html(html);
                        $content.addClass('loaded');
                    }
                },
                error: function() {
                    $content.html('<p class="error">Error loading data</p>');
                },
                complete: function() {
                    $content.removeClass('loading');
                }
            });
        }
        
        $content.slideToggle();
    });
});