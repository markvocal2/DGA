jQuery(document).ready(function($) {
    // Click handler for News items
    $('.news-item').on('click', function() {
        const postId = $(this).data('id');
        const $content = $(this).find('.news-content');
        
        // Toggle content visibility
        if ($content.hasClass('loading')) {
            return;
        }
        
        if (!$content.hasClass('loaded')) {
            $content.addClass('loading');
            
            // Fetch data from API
            $.ajax({
                url: newsData.ajaxurl,
                type: 'POST',
                data: {
                    action: 'news_api_endpoint',
                    post_id: postId,
                    nonce: newsData.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Update content with API data
                        const data = response.data;
                        let html = '';
                        
                        for (const [key, value] of Object.entries(data)) {
                            if (typeof value === 'string' || typeof value === 'number') {
                                html += `
                                    <div class="news-field">
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