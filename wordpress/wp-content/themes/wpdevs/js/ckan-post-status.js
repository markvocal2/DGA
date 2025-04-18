/**
 * CKAN Post Status Toggle Script
 *
 * Handles the AJAX request to toggle post status (publish/pending)
 * Works with the PHP code provided in ckan_post_status_php_v2.
 *
 * Requires jQuery.
 * Expects localized variables via wp_localize_script:
 * - ckanPostStatus.ajax_url
 * - ckanPostStatus.nonce
 * - ckanPostStatus.post_id (Note: PHP provides this, but it's better practice to get it from the element data attribute if multiple toggles could exist)
 */
jQuery(document).ready(function($) {

    // Event listener for the toggle switch(es)
    // Use event delegation in case the toggle is added dynamically,
    // though with the current PHP structure, it's likely loaded once.
    $(document).on('change', '.ckan-status-toggle', function(e) {

        const $toggle = $(this); // The checkbox input element
        const $wrapper = $toggle.closest('.ckan-post-status-wrapper'); // Find the main container
        const $statusLabel = $wrapper.find('.ckan-status-label'); // Find the label span
        const $messageDiv = $wrapper.find('.ckan-post-status-message'); // Find the message div

        // Get the post ID from the data attribute of the wrapper
        const postId = $wrapper.data('post-id');
        // Get the new status (true if checked, false if not)
        const newStatus = $toggle.is(':checked');

        // Basic check
        if (typeof postId === 'undefined') {
            console.error('CKAN Post Status: Post ID not found on wrapper element.');
            $messageDiv.text('ข้อผิดพลาด: ไม่พบ Post ID').css('color', 'red');
            return; // Stop if post ID is missing
        }

        // Disable toggle and show loading state
        $toggle.prop('disabled', true);
        $statusLabel.text('กำลังอัปเดต...'); // Update label to show loading
        $messageDiv.text('').removeClass('ckan-status-success ckan-status-error'); // Clear previous messages

        // --- AJAX Request ---
        $.ajax({
            url: ckanPostStatus.ajax_url, // Get AJAX URL from localized script
            type: 'POST',
            data: {
                action: 'ckan_post_status_change', // Action hook in PHP (wp_ajax_*)
                nonce: ckanPostStatus.nonce,       // Security nonce
                post_id: postId,                   // Post ID from data attribute
                status: newStatus.toString()       // Send status as 'true' or 'false' string
            },
            dataType: 'json', // Expect JSON response from server

            success: function(response) {
                if (response.success) {
                    // --- Success ---
                    $statusLabel.text(response.data.statusLabel); // Update status label text
                    $messageDiv.text(response.data.message)       // Show success message
                               .addClass('ckan-status-success')
                               .css('color', 'green');
                    // Update the 'checked' property based on the *actual* new status returned
                    $toggle.prop('checked', response.data.newStatus === 'publish');
                } else {
                    // --- Error reported by WordPress/PHP ---
                    $statusLabel.text('เกิดข้อผิดพลาด'); // Update label
                    $messageDiv.text(response.data.message || 'เกิดข้อผิดพลาด ไม่ทราบสาเหตุ') // Show error message
                               .addClass('ckan-status-error')
                               .css('color', 'red');
                    // Revert toggle to its previous state since the update failed
                    $toggle.prop('checked', !newStatus);
                }
            },

            error: function(jqXHR, textStatus, errorThrown) {
                // --- AJAX Communication Error ---
                console.error("CKAN Post Status AJAX Error:", textStatus, errorThrown);
                $statusLabel.text('เกิดข้อผิดพลาด'); // Update label
                $messageDiv.text('เกิดข้อผิดพลาดในการสื่อสารกับ Server') // Show generic error
                           .addClass('ckan-status-error')
                           .css('color', 'red');
                // Revert toggle to its previous state
                $toggle.prop('checked', !newStatus);
            },

            complete: function() {
                // --- Always runs after success or error ---
                // Re-enable the toggle
                $toggle.prop('disabled', false);
                // Optional: Hide the message after a few seconds
                setTimeout(function() {
                    $messageDiv.text('').removeClass('ckan-status-success ckan-status-error');
                }, 5000); // Hide after 5 seconds
            }
        });
        // --- End AJAX Request ---
    });
});
