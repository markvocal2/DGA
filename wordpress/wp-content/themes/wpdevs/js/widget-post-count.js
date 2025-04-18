(function($) {
    'use strict';
    
    $(document).ready(function() {
        $('.post-count-widget').each(function() {
            var $widget = $(this);
            var postType = $widget.data('posttype');
            var taxonomy = $widget.data('taxonomy');
            var term = $widget.data('term');
            
            // Send AJAX request
            $.ajax({
                url: postCountData.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_post_count',
                    nonce: postCountData.nonce,
                    posttype: postType,
                    taxonomy: taxonomy,
                    term: term
                },
                success: function(response) {
                    if (response.success) {
                        $widget.html('<span class="post-count-number">' + response.data.count + '</span>');
                    } else {
                        $widget.html('<span class="post-count-error">Error</span>');
                    }
                },
                error: function() {
                    $widget.html('<span class="post-count-error">Error</span>');
                }
            });
        });
    });
    
})(jQuery);