(function($) {
    'use strict';

    $(document).ready(function() {
        // Iterate over each post count widget on the page
        $('.post-count-widget').each(function() {
            // Use 'const' as $widget is assigned once per iteration
            // Keep 'function' here to maintain the correct context for $(this)
            const $widget = $(this);

            // Use 'const' for data attributes as they are read once per iteration
            const postType = $widget.data('posttype');
            const taxonomy = $widget.data('taxonomy');
            const term = $widget.data('term');

            // Optional: Add a loading indicator
            $widget.html('<span class="post-count-loading">Loading...</span>');

            // Send AJAX request to get the post count
            $.ajax({
                url: postCountData.ajax_url, // Ensure postCountData is available via wp_localize_script
                type: 'POST',
                data: {
                    action: 'get_post_count', // The WordPress AJAX action hook
                    nonce: postCountData.nonce, // Nonce for security
                    posttype: postType,
                    taxonomy: taxonomy,
                    term: term
                },
                dataType: 'json', // Expect a JSON response
                success: (response) => { // Use arrow function for success callback
                    // Check if the request was successful and data is available
                    if (response && response.success && response.data && typeof response.data.count !== 'undefined') {
                        // Display the count
                        $widget.html(`<span class="post-count-number">${response.data.count}</span>`);
                    } else {
                        // Display error message from response or a default one
                        const errorMessage = response?.data?.message || 'Error'; // Use optional chaining
                        console.warn('Post count request failed:', errorMessage, { postType, taxonomy, term });
                        $widget.html(`<span class="post-count-error">${errorMessage}</span>`);
                    }
                },
                error: (jqXHR, textStatus, errorThrown) => { // Use arrow function for error callback
                    console.error('Post count AJAX error:', textStatus, errorThrown);
                    // Display a generic error message on AJAX failure
                    $widget.html('<span class="post-count-error">Error</span>');
                }
                // Optional: Add a complete callback to remove loading indicator even on error
                // complete: () => {
                //     $widget.find('.post-count-loading').remove();
                // }
            });
        });
    });

})(jQuery);
