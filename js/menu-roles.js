jQuery(($) => { // Use shorthand for document ready
    'use strict';

    // --- Configuration Check ---
    if (typeof menuRolesAjax === 'undefined' || !menuRolesAjax.ajaxurl || !menuRolesAjax.nonce) {
        console.error('menuRolesAjax object is missing or incomplete. Menu role saving will not work.');
        // Optionally disable selects if config is missing
        // $('.menu-role-select').prop('disabled', true);
        return;
    }

    // --- Helper Functions ---

    /**
     * Displays a status message (success or error) and schedules its removal.
     * @param {jQuery} $messageElement The jQuery object for the message display area.
     * @param {string} message The message text.
     * @param {boolean} isSuccess True for success message, false for error message.
     */
    function displayStatusMessage($messageElement, message, isSuccess) {
        const messageClass = isSuccess ? 'success-message' : 'error-message';
        const color = isSuccess ? 'green' : 'red';

        $messageElement
            .html(message)
            .removeClass('success-message error-message') // Remove previous classes
            .addClass(messageClass)
            .css('color', color) // Apply color directly (or use classes)
            .show(); // Ensure it's visible before scheduling removal

        scheduleMessageRemoval($messageElement);
    }

    /**
     * Schedules the removal of the status message element after a delay.
     * @param {jQuery} $messageElement The jQuery object for the message display area.
     */
    function scheduleMessageRemoval($messageElement) {
        const displayDuration = 3000; // ms
        const fadeDuration = 300;    // ms

        // Clear any existing timer associated with this element to prevent conflicts
        clearTimeout($messageElement.data('removalTimer'));

        const timerId = setTimeout(() => {
            $messageElement.fadeOut(fadeDuration, function() {
                // Reset the element after fading out
                $(this).html('').removeClass('success-message error-message').css('color', '').show();
            });
        }, displayDuration);

        // Store the timer ID on the element so it can be cleared if needed
        $messageElement.data('removalTimer', timerId);
    }

    // --- AJAX Handlers ---

    /**
     * Handles the successful response from the update_menu_role AJAX call.
     * @param {object} response The AJAX success response object.
     * @param {jQuery} $messageElement The jQuery object for the message display area.
     */
    function handleUpdateSuccess(response, $messageElement) {
        const message = (response.data && response.data.message) ? response.data.message : 'Roles updated successfully.';
        displayStatusMessage($messageElement, message, true);
    }

    /**
     * Handles errors from the update_menu_role AJAX call.
     * @param {object|string|null} responseData The response data (if available) or null for network errors.
     * @param {jQuery} $messageElement The jQuery object for the message display area.
     */
    function handleUpdateError(responseData, $messageElement) {
        // Prioritize server error message, then fallback
        const message = (responseData && typeof responseData === 'string')
                      ? responseData
                      : 'Error updating roles.';
        displayStatusMessage($messageElement, message, false);
    }


    // --- Initialization and Event Handlers ---

    // Initialize Select2 for all role selects
    $('.menu-role-select').each(function() {
        const $select = $(this);
        // Prevent double initialization
        if ($select.data('select2')) {
            return;
        }
        $select.select2({
            placeholder: "Select roles",
            allowClear: true,
            width: '100%' // Ensure it takes available width
        });
    });


    // Handle role selection changes using event delegation for potentially dynamic elements
    $(document).on('change', '.menu-role-select', function() {
        const $select = $(this);
        // Find related elements relative to the select element
        const $itemContainer = $select.closest('li, div'); // Adjust selector based on your HTML structure
        const $spinner = $itemContainer.find('.spinner');
        const $message = $itemContainer.find('.status-message');
        const itemId = $select.data('item-id');
        let selectedRoles = $select.val() || []; // Ensure it's always an array

        // Validate item ID
        if (typeof itemId === 'undefined') {
             console.error('Menu item ID (data-item-id) is missing from:', $select);
             displayStatusMessage($message, 'Configuration error (missing item ID).', false);
             return;
        }

        // Handle "All Users" selection logic
        const includesAll = selectedRoles.includes('all');
        const allOptionSelected = $select.find('option[value="all"]').prop('selected');

        if (includesAll && selectedRoles.length > 1) {
            // If 'all' is selected along with others, force 'all' only
            selectedRoles = ['all'];
            $select.val(['all']).trigger('change.select2'); // Update Select2 display
            // Note: This might trigger the 'change' event again, handle potential recursion if necessary
            // For this case, we'll proceed with the AJAX call assuming the re-trigger doesn't cause issues.
        } else if (!includesAll && allOptionSelected) {
             // If 'all' was selected but now isn't, ensure it's deselected (should be handled by Select2, but belt-and-suspenders)
             $select.find('option[value="all"]').prop('selected', false);
             // $select.trigger('change.select2'); // Might not be needed here
        }


        // Show spinner and reset message
        if ($spinner.length) {
            $spinner.addClass('is-active');
        }
        if ($message.length) {
            // Clear previous timer and hide message immediately
            clearTimeout($message.data('removalTimer'));
            $message.html('').removeClass('error-message success-message').hide();
        } else {
            console.warn('Status message element not found for item ID:', itemId);
        }


        // Send AJAX request
        $.ajax({
            url: menuRolesAjax.ajaxurl,
            type: 'POST',
            dataType: 'json', // Expect JSON
            data: {
                action: 'update_menu_role',
                nonce: menuRolesAjax.nonce,
                item_id: itemId,
                roles: selectedRoles // Send the potentially modified array
            },
            success: (response) => {
                // Check if response is valid
                if (response && typeof response.success !== 'undefined') {
                    if (response.success) {
                        handleUpdateSuccess(response, $message);
                    } else {
                        handleUpdateError(response.data, $message); // Pass server error message
                    }
                } else {
                     console.error('Invalid response format:', response);
                     handleUpdateError('Invalid server response.', $message);
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error('AJAX Error:', textStatus, errorThrown);
                handleUpdateError('AJAX request failed.', $message); // General AJAX error
            },
            complete: () => {
                // Always hide spinner
                if ($spinner.length) {
                    $spinner.removeClass('is-active');
                }
                // Message hiding is now handled by displayStatusMessage/scheduleMessageRemoval
            }
        });
    });

}); // End document ready
