/**
 * JavaScript for Delete Post Modal
 * 
 * This script handles the modal popup functionality for post deletion.
 * File path: /js/ckan-delete-dataset.js
 */

(function($) {
    $(document).ready(function() {
        // Variables
        var modal = $('#cpd-delete-modal');
        var deleteBtn = $('.cpd-delete-post-btn');
        var closeBtn = $('.cpd-close');
        var cancelBtn = $('.cpd-cancel-btn');
        var confirmBtn = $('.cpd-confirm-delete-btn');
        
        // Open modal when delete button is clicked
        deleteBtn.on('click', function() {
            modal.addClass('cpd-show');
            $('body').addClass('cpd-modal-open');
            
            // Add animation classes
            setTimeout(function() {
                $('.cpd-modal-content').addClass('cpd-animate-in');
                $('.cpd-warning-icon').addClass('cpd-pulse');
            }, 100);
        });
        
        // Close modal functions
        function closeModal() {
            $('.cpd-modal-content').removeClass('cpd-animate-in');
            setTimeout(function() {
                modal.removeClass('cpd-show');
                $('body').removeClass('cpd-modal-open');
                $('.cpd-warning-icon').removeClass('cpd-pulse');
            }, 300);
        }
        
        // Close modal when X is clicked
        closeBtn.on('click', function() {
            closeModal();
        });
        
        // Close modal when Cancel is clicked
        cancelBtn.on('click', function() {
            closeModal();
        });
        
        // Close modal when clicking outside
        $(window).on('click', function(event) {
            if ($(event.target).is(modal)) {
                closeModal();
            }
        });
        
        // Handle delete confirmation
        confirmBtn.on('click', function() {
            // Show loading state
            confirmBtn.prop('disabled', true).text('Deleting...');
            confirmBtn.addClass('cpd-loading');
            
            // Send AJAX request to delete the post
            $.ajax({
                url: cpdDeleteVars.ajax_url,
                type: 'POST',
                data: {
                    action: 'cpd_delete_post',
                    post_id: cpdDeleteVars.post_id,
                    nonce: cpdDeleteVars.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Show success message
                        $('.cpd-modal-body').html('<div class="cpd-success-icon"><i class="dashicons dashicons-yes"></i></div><p>Post deleted successfully!</p>');
                        $('.cpd-modal-footer').html('<button class="cpd-redirect-btn">Return to Homepage</button>');
                        
                        // Redirect after a short delay
                        $('.cpd-redirect-btn').on('click', function() {
                            window.location.href = response.data.redirect;
                        });
                    } else {
                        // Show error message
                        $('.cpd-modal-body').html('<div class="cpd-error-icon"><i class="dashicons dashicons-no"></i></div><p>Error: ' + response.data + '</p>');
                        $('.cpd-modal-footer').html('<button class="cpd-close-btn">Close</button>');
                        
                        $('.cpd-close-btn').on('click', function() {
                            closeModal();
                        });
                    }
                },
                error: function() {
                    // Show error message
                    $('.cpd-modal-body').html('<div class="cpd-error-icon"><i class="dashicons dashicons-no"></i></div><p>A server error occurred. Please try again.</p>');
                    $('.cpd-modal-footer').html('<button class="cpd-close-btn">Close</button>');
                    
                    $('.cpd-close-btn').on('click', function() {
                        closeModal();
                    });
                }
            });
        });
    });
})(jQuery);