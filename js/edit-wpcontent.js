/**
 * JavaScript สำหรับการแก้ไขเนื้อหา WordPress ด้วย AJAX
 * Version: 1.0.1 (Refactored for reduced nesting)
 */
jQuery(document).ready(function($) {
    'use strict';

    // --- Configuration Check ---
    if (typeof editWpContent === 'undefined' || !editWpContent.ajaxurl || !editWpContent.messages) {
        console.error('editWpContent object is missing or incomplete. AJAX editing will not work.');
        // Optionally disable edit buttons if config is missing
        // $('.edit-wpcontent-button').hide();
        return;
    }

    // --- Helper Functions ---

    /**
     * Displays a temporary notification message within the container.
     * @param {jQuery} container The main container element for the editable content.
     * @param {string} message The message to display.
     * @param {string} type 'success' or 'error'.
     */
    function displayNotification(container, message, type) {
        // Remove any existing notification first
        container.find('.edit-wpcontent-notification').remove();

        const notification = $('<div class="edit-wpcontent-notification"></div>')
            .addClass(type) // Add 'success' or 'error' class
            .text(message) // Use .text() for security unless HTML is intended
            .appendTo(container); // Append inside the container

        // Schedule removal
        scheduleNotificationRemoval(notification);
    }

    /**
     * Schedules the removal of a notification element after a delay.
     * @param {jQuery} notificationElement The notification element jQuery object.
     */
    function scheduleNotificationRemoval(notificationElement) {
        const displayDuration = 3000; // How long the message stays visible (ms)
        const fadeDuration = 300;    // Duration of the fade-out effect (ms)

        setTimeout(() => {
            notificationElement.fadeOut(fadeDuration, function() {
                // `this` refers to the notificationElement here
                $(this).remove();
            });
        }, displayDuration);
    }

    /**
     * Switches the view from editing form back to content display.
     * @param {jQuery} container The main container element.
     */
    function switchToContentView(container) {
        container.find('.edit-wpcontent-form').hide();
        container.find('.edit-wpcontent-content').fadeIn();
        container.find('.edit-wpcontent-button').fadeIn(); // Show the edit button again
    }

    /**
     * Switches the view from content display to the editing form.
     * @param {jQuery} container The main container element.
     */
    function switchToEditView(container) {
        container.find('.edit-wpcontent-content').hide();
        container.find('.edit-wpcontent-form').fadeIn();
        container.find('.edit-wpcontent-button').hide(); // Hide the edit button
        container.find('.edit-wpcontent-textarea').focus(); // Focus the textarea
    }


    // --- AJAX Handlers ---

    /**
     * Handles the successful response from the save AJAX call.
     * @param {jQuery} container The main container element.
     * @param {object} responseData The 'data' object from the successful AJAX response.
     */
    function handleSaveSuccess(container, responseData) {
        // Update the displayed content safely (assuming formatted_content is safe HTML)
        container.find('.edit-wpcontent-content').html(responseData.formatted_content || '');
        // Optionally update the textarea value as well, in case user cancels later
        container.find('.edit-wpcontent-textarea').val(responseData.raw_content || '');

        switchToContentView(container);
        displayNotification(container, editWpContent.messages.success || 'บันทึกสำเร็จ', 'success');
    }

    /**
     * Handles errors during the save AJAX call (network error or server error).
     * @param {jQuery} container The main container element.
     * @param {object|null} responseData The 'data' object from the AJAX response if available (for server errors).
     */
    function handleSaveError(container, responseData) {
        const message = (responseData && responseData.message) ? responseData.message : (editWpContent.messages.error || 'เกิดข้อผิดพลาด');
        // Don't switch view, keep the form open so user can retry or copy content
        displayNotification(container, message, 'error');
    }


    // --- Event Handlers ---

    // เปิดฟอร์มแก้ไข
    $(document).on('click', '.edit-wpcontent-button', function(e) {
        e.preventDefault();
        const container = $(this).closest('.edit-wpcontent-container');
        // Store original content in textarea in case of cancel? Or assume textarea already has it.
        // For simplicity, we assume the textarea is populated correctly when the page loads or via PHP.
        switchToEditView(container);
    });

    // ยกเลิกการแก้ไข
    $(document).on('click', '.edit-wpcontent-cancel', function(e) {
        e.preventDefault();
        const container = $(this).closest('.edit-wpcontent-container');
        // Reset textarea value to original content if needed (requires storing it)
        // Example: container.find('.edit-wpcontent-textarea').val(container.find('.edit-wpcontent-content').data('original-html'));
        switchToContentView(container);
        container.find('.edit-wpcontent-notification').remove(); // Remove any lingering notifications
    });

    // บันทึกการแก้ไข
    $(document).on('click', '.edit-wpcontent-save', function(e) {
        e.preventDefault();
        const saveButton = $(this);
        const container = saveButton.closest('.edit-wpcontent-container');
        const content = container.find('.edit-wpcontent-textarea').val();
        const postId = container.data('id');
        const field = container.data('field'); // e.g., 'post_content' or a meta field key
        const nonce = container.data('nonce');

        // Basic validation
        if (!postId || !field || !nonce) {
             console.error('Missing data attributes (id, field, or nonce) on container:', container);
             displayNotification(container, editWpContent.messages.error || 'ข้อมูลไม่ครบถ้วน', 'error');
             return;
        }

        // แสดงสถานะกำลังโหลด
        saveButton.text(editWpContent.messages.saving || 'กำลังบันทึก...');
        saveButton.prop('disabled', true);
        container.find('.edit-wpcontent-cancel').prop('disabled', true); // Disable cancel too
        container.find('.edit-wpcontent-notification').remove(); // Clear previous notifications

        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: editWpContent.ajaxurl,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'edit_wpcontent_save',
                post_id: postId,
                content: content,
                field: field,
                _ajax_nonce: nonce // Often WP uses _ajax_nonce
            },
            success: function(response) {
                // Check if response is valid and has a success property
                if (response && typeof response.success !== 'undefined') {
                    if (response.success) {
                        handleSaveSuccess(container, response.data);
                    } else {
                        handleSaveError(container, response.data); // Pass response data for specific error message
                    }
                } else {
                    // Handle unexpected response format
                    console.error('Invalid AJAX response format:', response);
                    handleSaveError(container, { message: editWpContent.messages.error || 'การตอบกลับไม่ถูกต้อง' });
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Handle network/server errors
                console.error('AJAX Error:', textStatus, errorThrown);
                handleSaveError(container, null); // Indicate a general AJAX error
            },
            complete: function() {
                // คืนค่าปุ่มบันทึกและยกเลิก (re-enable)
                saveButton.text(editWpContent.messages.save || 'บันทึก');
                saveButton.prop('disabled', false);
                container.find('.edit-wpcontent-cancel').prop('disabled', false);
            }
        });
    });

    // อนุญาตให้กด Escape เพื่อยกเลิกการแก้ไข
    $(document).keyup(function(e) {
        // Check if any edit form is visible before triggering cancel
        if (e.key === "Escape" || e.key === "Esc") { // Check for modern 'key' property
            const visibleCancelButton = $('.edit-wpcontent-cancel:visible').first();
            if (visibleCancelButton.length) {
                 visibleCancelButton.trigger('click');
            }
        }
    });

    // อนุญาตให้กด Ctrl+Enter หรือ Cmd+Enter เพื่อบันทึก
    $(document).on('keydown', '.edit-wpcontent-textarea', function(e) {
        // Check for Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.keyCode === 13)) {
             e.preventDefault(); // Prevent default Enter behavior (new line)
            // Find the save button within the same container and trigger click
            $(this).closest('.edit-wpcontent-container').find('.edit-wpcontent-save').trigger('click');
        }
    });

});
