(function($) {
    'use strict';

    // --- Helper Functions ---

    /**
     * Displays a temporary success or error message.
     * @param {string} messageText - The message to display.
     * @param {string} type - 'success' or 'error'.
     * @param {number} duration - How long to show the message (ms).
     */
    function showTemporaryMessage(messageText, type = 'success', duration = 2500) {
        // Remove any existing messages first
        $('.wptax-message').remove();

        const messageClass = `wptax-${type}`; // wptax-success or wptax-error
        const message = $(`<div class="wptax-message ${messageClass}">${messageText}</div>`);

        $('body').append(message); // Append to body for global visibility

        // Fade in slightly after appending
        requestAnimationFrame(() => {
            message.css('opacity', 1);
        });


        // Set timer to fade out and remove
        setTimeout(() => {
            message.fadeOut(300, () => message.remove()); // Fade out then remove from DOM
        }, duration);
    }

    /**
     * Updates the displayed terms list after a successful save.
     * @param {jQuery} container - The main container element for the taxonomy display.
     * @param {Array} terms - Array of term objects {link: string, name: string}.
     */
    function displayUpdatedTerms(container, terms) {
        const $termsContainer = container.find('.wptax-terms-container');
        const $noTermSpan = container.find('.wptax-no-term');

        if (!terms || terms.length === 0) {
            // No terms selected or returned
            if ($noTermSpan.length === 0) {
                // Create the 'no term' span if it doesn't exist
                container.prepend('<span class="wptax-no-term">ไม่มีหมวดหมู่กำหนด</span>');
            }
            container.find('.wptax-no-term').show(); // Use the cached or newly created span
            $termsContainer.hide().empty(); // Hide and clear the terms container
        } else {
            // Terms selected
            const termLinks = terms.map(term =>
                // Ensure term properties exist and escape HTML for safety
                 `<a href="${term.link || '#'}" class="wptax-term-link">${$('<div>').text(term.name || 'N/A').html()}</a>`
            );

            if ($termsContainer.length === 0) {
                // Create the terms container if it doesn't exist
                container.prepend('<div class="wptax-terms-container">' + termLinks.join(', ') + '</div>');
            } else {
                // Update existing terms container
                $termsContainer.html(termLinks.join(', ')).show();
            }
            $noTermSpan.hide(); // Hide the 'no term' span
        }
    }

    /**
     * Handles the successful response from the AJAX update.
     * @param {object} response - The AJAX response object.
     * @param {jQuery} container - The main container element for the taxonomy display.
     */
    function handleUpdateSuccess(response, container) {
        console.log('AJAX Success Response:', response);
        if (response.success) {
            // Update the displayed terms
            displayUpdatedTerms(container, response.data?.terms || []); // Pass terms array, default to empty

            // Hide the edit form and show the edit button
            container.find('.wptax-edit-form').hide();
            container.find('.wptax-edit-btn').show();

            // Show success message
            showTemporaryMessage('บันทึกเรียบร้อย', 'success');
        } else {
            // Show error message from backend if available
            const errorMessage = response.data || 'เกิดข้อผิดพลาดในการบันทึก';
            showTemporaryMessage(`เกิดข้อผิดพลาด: ${errorMessage}`, 'error', 3500);
        }
    }

    /**
     * Handles errors during the AJAX update.
     * @param {jqXHR} xhr - The jQuery XHR object.
     * @param {string} status - The status string.
     * @param {string} error - The error thrown.
     * @param {jQuery} container - The main container element for the taxonomy display.
     */
    function handleUpdateError(xhr, status, error, container) {
        console.error('AJAX Error:', status, error, xhr.responseText);
        showTemporaryMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่', 'error');
    }

    /**
     * Actions to perform after the AJAX request completes (success or error).
     * @param {jQuery} container - The main container element for the taxonomy display.
     */
    function handleUpdateComplete(container) {
        container.removeClass('wptax-loading'); // Remove loading indicator
    }

    /**
     * Sends the AJAX request to update taxonomy terms for a post.
     * @param {string|number} postId - The ID of the post being updated.
     * @param {string} taxonomy - The taxonomy slug.
     * @param {Array<string>} termIds - Array of selected term IDs.
     * @param {jQuery} container - The main container element for the taxonomy display.
     */
    function updateTaxonomy(postId, taxonomy, termIds, container) {
        // Ensure wptaxAjax object and properties exist
        if (typeof wptaxAjax === 'undefined' || !wptaxAjax.ajaxurl || !wptaxAjax.nonce) {
             console.error('wptaxAjax object with ajaxurl and nonce is required.');
             showTemporaryMessage('เกิดข้อผิดพลาดในการตั้งค่าสคริปต์', 'error');
             return; // Stop execution if config is missing
        }

        console.log('Sending AJAX:', { postId, taxonomy, termIds });

        $.ajax({
            url: wptaxAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'wptax_update_taxonomy',
                nonce: wptaxAjax.nonce,
                post_id: postId,
                term_ids: termIds, // Send as an array
                taxonomy: taxonomy
            },
            dataType: 'json', // Expect JSON response from WordPress
            beforeSend: () => { // Use arrow function
                container.addClass('wptax-loading');
            },
            success: (response) => { // Use arrow function, pass container
                handleUpdateSuccess(response, container);
            },
            error: (xhr, status, error) => { // Use arrow function, pass container
                handleUpdateError(xhr, status, error, container);
            },
            complete: () => { // Use arrow function, pass container
                handleUpdateComplete(container);
            }
        });
    }


    // --- Event Handlers ---

    /**
     * Handles the click event for the 'Edit' button.
     * Shows the edit form.
     * @param {Event} event - The click event object.
     */
    function handleEditClick(event) {
        event.preventDefault();
        const container = $(event.currentTarget).closest('.wptax-term-display');
        container.find('.wptax-terms-container, .wptax-no-term').hide();
        container.find('.wptax-edit-btn').hide();
        container.find('.wptax-edit-form').fadeIn();
    }

    /**
     * Handles the click event for the 'Cancel' button.
     * Hides the edit form and shows the display elements.
     * @param {Event} event - The click event object.
     */
    function handleCancelClick(event) {
        event.preventDefault();
        const container = $(event.currentTarget).closest('.wptax-term-display');
        container.find('.wptax-edit-form').hide();
        container.find('.wptax-terms-container, .wptax-no-term').show();
        container.find('.wptax-edit-btn').show();
    }

    /**
     * Handles the click event for the 'Save' button.
     * Gathers selected term IDs and initiates the AJAX update.
     * @param {Event} event - The click event object.
     */
    function handleSaveClick(event) {
        event.preventDefault();
        const $button = $(event.currentTarget); // The save button itself
        const container = $button.closest('.wptax-term-display');
        const postId = container.data('post-id');
        const taxonomy = container.data('taxonomy');

        // Collect selected term IDs using map for conciseness
        const termIds = container.find('.wptax-term-checkbox:checked').map(function() {
            return $(this).val(); // 'this' refers to the checkbox DOM element here
        }).get(); // .get() converts jQuery object to a standard array

        console.log('Selected Term IDs:', termIds);

        // Initiate the AJAX update
        updateTaxonomy(postId, taxonomy, termIds, container);
    }


    // --- Document Ready ---
    $(document).ready(function() {
        // Use delegated event listeners attached to the document or a static parent container
        // This ensures they work even if content is loaded dynamically.
        $(document).on('click', '.wptax-edit-btn', handleEditClick);
        $(document).on('click', '.wptax-cancel-btn', handleCancelClick);
        $(document).on('click', '.wptax-save-btn', handleSaveClick);
    });

})(jQuery);
