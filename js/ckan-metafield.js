/**
 * CKAN Metadata Fields Admin JavaScript
 * สำหรับผู้ดูแลระบบเพื่อแก้ไขข้อมูล
 * Version: 1.0.2 (Refactored for Complexity in startEditing)
 */
jQuery(document).ready(function($) {
    'use strict';

    // --- Configuration Check ---
    if (!ckanMetafieldAdmin || !ckanMetafieldAdmin.isAdmin || !ckanMetafieldAdmin.ajaxurl || !ckanMetafieldAdmin.nonce) {
        console.warn('CKAN Admin JS: Admin data (ckanMetafieldAdmin) is missing or incomplete.');
        // Optionally disable edit icons if config is missing
        // $('.ckan-edit-icon').hide();
        return;
    }

    // --- Cache Post ID ---
    const postId = $('.ckan-metadata-container').data('post-id');
    if (!postId) {
        console.error('CKAN Admin JS: Post ID not found in .ckan-metadata-container');
        return; // Stop if post ID is missing
    }

    // --- Helper Functions ---

    /**
     * Escapes HTML entities in a string.
     * @param {string|null|undefined} str The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        // Basic escaping, consider a more robust library if complex HTML is expected.
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Formats a value for display based on its type.
     * @param {*} value The value to format.
     * @param {string} type The field type ('boolean', 'email', 'url', 'date', 'datetime', etc.).
     * @returns {string} HTML string for display.
     */
    function formatValue(value, type) {
        if (value === null || value === undefined || value === '') {
            return '<span class="ckan-empty-value">ไม่มีข้อมูล</span>';
        }

        switch (type) {
            case 'boolean':
                const isTrue = [true, 1, '1', 'true', 'yes'].includes(
                    typeof value === 'string' ? value.toLowerCase() : value
                );
                return isTrue ? '<span class="boolean-true">ใช่</span>' : '<span class="boolean-false">ไม่ใช่</span>';

            case 'email':
                const escapedEmail = escapeHtml(value);
                return `<a href="mailto:${escapedEmail}">${escapedEmail}</a>`;

            case 'url':
                const escapedUrl = escapeHtml(value);
                let displayUrl = escapedUrl;
                // Basic URL validation and protocol addition
                let hrefUrl = escapedUrl;
                if (!/^(?:f|ht)tps?:\/\//i.test(hrefUrl)) {
                    hrefUrl = `http://${hrefUrl}`;
                }
                 // Truncate long URLs for display
                if (displayUrl.length > 50) {
                    displayUrl = displayUrl.substring(0, 47) + '...';
                }
                return `<a href="${hrefUrl}" target="_blank" rel="noopener noreferrer" title="${escapedUrl}">${displayUrl}</a>`;

            case 'date':
                 // Attempt to format potential timestamp or existing date string
                 try {
                    let date = null;
                    if (value && /^\d{10,}$/.test(value)) { // Looks like Unix timestamp (seconds)
                        date = new Date(parseInt(value, 10) * 1000);
                    } else if (value) { // Try parsing as is
                         date = new Date(value);
                    }
                    if (date && !isNaN(date)) {
                         // Format to a locale-friendly date string (e.g., DD/MM/YYYY or YYYY-MM-DD)
                         // Adjust locale and options as needed
                         return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                         // Or use ISO format: return date.toISOString().split('T')[0];
                    }
                 } catch (e) { /* Ignore parsing errors, fall through */ }
                 return escapeHtml(value); // Fallback to escaped original value

            case 'datetime':
                 // Attempt to format potential timestamp or existing datetime string
                 try {
                    let datetime = null;
                    if (value && /^\d{10,}$/.test(value)) { // Looks like Unix timestamp (seconds)
                        datetime = new Date(parseInt(value, 10) * 1000);
                    } else if (value) { // Try parsing as is
                         datetime = new Date(value);
                    }
                    if (datetime && !isNaN(datetime)) {
                         // Format to a locale-friendly date and time string
                         return datetime.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
                         // Or use ISO-like format: return datetime.toISOString().slice(0, 16).replace('T', ' ');
                    }
                 } catch (e) { /* Ignore parsing errors, fall through */ }
                 return escapeHtml(value); // Fallback

            default:
                // Escape potentially harmful HTML in default text display
                return escapeHtml(value);
        }
    }

    /**
     * Displays a temporary status message within a parent element.
     * @param {jQuery} parentElement The element to append the message to.
     * @param {string} message The message text.
     * @param {string} cssClass The CSS class for styling ('ckan-status-success', 'ckan-status-error', 'ckan-status-saving').
     * @param {number|null} [displayDuration=2000] Duration in ms to show the message. Null keeps it visible.
     */
    function displayTemporaryMessage(parentElement, message, cssClass, displayDuration = 2000) {
        // Remove existing message within the specific parent first
        parentElement.find('.ckan-status-message').remove();

        const messageElement = $(`<div class="ckan-status-message ${cssClass}"></div>`).html(message); // Use html() if message can contain HTML
        parentElement.append(messageElement);

        if (displayDuration !== null) {
             scheduleMessageRemoval(messageElement, displayDuration);
        }
    }

    /**
     * Schedules the removal of a message element.
     * @param {jQuery} messageElement The message element.
     * @param {number} displayDuration Duration in ms before starting fade out.
     */
    function scheduleMessageRemoval(messageElement, displayDuration) {
        const fadeDuration = 300;
        // Clear existing timer if any
        clearTimeout(messageElement.data('removalTimer'));

        const timer = setTimeout(() => {
            messageElement.fadeOut(fadeDuration, function() {
                $(this).remove();
            });
        }, displayDuration);
        messageElement.data('removalTimer', timer); // Store timer ID
    }


    // --- Input Generation Helper Functions ---

    function generateBooleanInputHtml(currentValue) {
        const isChecked = currentValue === true; // Assumes value is already normalized boolean
        return `<label class="ckan-input-boolean"><input type="checkbox" ${isChecked ? 'checked' : ''} /> ใช่</label>`;
    }

    function generateTextInputHtml(currentValue) {
        return `<input type="text" value="${escapeHtml(currentValue)}" class="ckan-input-text" />`;
    }

    function generateEmailInputHtml(currentValue) {
        return `<input type="email" value="${escapeHtml(currentValue)}" class="ckan-input-email" />`;
    }

    function generateUrlInputHtml(currentValue) {
        return `<input type="url" value="${escapeHtml(currentValue)}" class="ckan-input-url" placeholder="https://example.com" />`;
    }

    function generateDateInputHtml(currentValue) {
        let dateValue = currentValue;
        // Convert timestamp (seconds) or existing valid date string to YYYY-MM-DD
        if (dateValue) {
             try {
                let date = null;
                if (/^\d{10,}$/.test(dateValue)) { // Unix timestamp (seconds)
                    date = new Date(parseInt(dateValue, 10) * 1000);
                } else { // Try parsing as date string
                     date = new Date(dateValue);
                }
                if (date && !isNaN(date)) {
                     dateValue = date.toISOString().split('T')[0];
                } else {
                     dateValue = ''; // Reset if invalid
                }
             } catch(e) { dateValue = ''; }
        } else {
            dateValue = '';
        }
        return `<input type="date" value="${escapeHtml(dateValue)}" class="ckan-input-date" />`;
    }

    function generateDateTimeInputHtml(currentValue) {
        let datetimeValue = currentValue;
        // Convert timestamp (seconds) or existing valid datetime string to YYYY-MM-DDTHH:mm
        if (datetimeValue) {
             try {
                let datetime = null;
                if (/^\d{10,}$/.test(datetimeValue)) { // Unix timestamp (seconds)
                    datetime = new Date(parseInt(datetimeValue, 10) * 1000);
                } else { // Try parsing as datetime string
                     datetime = new Date(datetimeValue);
                }
                if (datetime && !isNaN(datetime)) {
                    // Format for datetime-local input: YYYY-MM-DDTHH:mm
                    const year = datetime.getFullYear();
                    const month = (datetime.getMonth() + 1).toString().padStart(2, '0');
                    const day = datetime.getDate().toString().padStart(2, '0');
                    const hours = datetime.getHours().toString().padStart(2, '0');
                    const minutes = datetime.getMinutes().toString().padStart(2, '0');
                    datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                } else {
                     datetimeValue = ''; // Reset if invalid
                }
             } catch(e) { datetimeValue = ''; }
        } else {
            datetimeValue = '';
        }
        return `<input type="datetime-local" value="${escapeHtml(datetimeValue)}" class="ckan-input-datetime" />`;
    }

    function generateTextareaHtml(currentValue) {
        return `<textarea rows="3" class="ckan-input-textarea">${escapeHtml(currentValue)}</textarea>`;
    }

    // Map field types to their generator functions
    const inputGenerators = {
        'boolean': generateBooleanInputHtml,
        'text': generateTextInputHtml,
        'email': generateEmailInputHtml,
        'url': generateUrlInputHtml,
        'date': generateDateInputHtml,
        'datetime': generateDateTimeInputHtml,
        'textarea': generateTextareaHtml // Explicitly map textarea if used as a type
        // Add other types as needed
    };


    // --- Editing Functions (Refactored startEditing) ---

    /**
     * Starts the editing process for a specific metadata row.
     * @param {jQuery} row The metadata row element (.ckan-metadata-row).
     */
    function startEditing(row) {
        // Prevent editing multiple rows simultaneously
        const $currentlyEditing = $('.ckan-metadata-row.editing');
        if ($currentlyEditing.length > 0 && !$currentlyEditing.is(row)) {
            alert(ckanMetafieldAdmin.messages?.already_editing || 'กรุณาบันทึกหรือยกเลิกการแก้ไขที่กำลังดำเนินการก่อน');
            return;
        }
         // Prevent re-entering edit mode if already editing this row
        if (row.hasClass('editing')) {
            return;
        }


        const fieldName = row.data('field');
        const fieldType = row.data('type') || 'text'; // Default to text if type is missing
        const valueCell = row.find('.ckan-metadata-value');
        let originalValue = valueCell.data('original-value'); // Keep original format for cancel

        // Normalize boolean value for input generation
        if (fieldType === 'boolean') {
             originalValue = [true, 1, '1', 'true', 'yes'].includes(
                 typeof originalValue === 'string' ? originalValue.toLowerCase() : originalValue
             );
        }
        // Use nullish coalescing for a default empty string
        const currentValueForInput = originalValue ?? '';

        row.addClass('editing');

        // Get the appropriate input generator function, default to textarea
        const generatorFunction = inputGenerators[fieldType] || inputGenerators['textarea'];
        const inputHtml = generatorFunction(currentValueForInput);

        // Build the editor HTML
        const editorHtml = `
            <div class="ckan-field-editor">
                ${inputHtml}
                <div class="ckan-edit-actions">
                    <button class="ckan-edit-btn ckan-save-btn">${ckanMetafieldAdmin.saveText || 'บันทึก'}</button>
                    <button class="ckan-edit-btn ckan-cancel-btn">${ckanMetafieldAdmin.cancelText || 'ยกเลิก'}</button>
                </div>
                <div class="ckan-status-message" style="display:none;"></div>
            </div>`;

        valueCell.html(editorHtml);
        valueCell.find('input, textarea').first().focus().select(); // Focus and select content

        // Add event listeners for the new buttons within this specific editor instance
        const editorElement = valueCell.find('.ckan-field-editor');
        editorElement.find('.ckan-save-btn').on('click.ckanEdit', () => saveField(row, fieldName, fieldType));
        editorElement.find('.ckan-cancel-btn').on('click.ckanEdit', () => cancelEditing(row));
         // Add keydown listener for Enter/Escape within the editor
         editorElement.find('input, textarea').on('keydown.ckanEdit', (e) => {
            if (e.key === 'Enter' && fieldType !== 'textarea') { // Save on Enter (except for textarea)
                 e.preventDefault();
                 saveField(row, fieldName, fieldType);
            } else if (e.key === 'Escape' || e.key === 'Esc') { // Cancel on Escape
                 cancelEditing(row);
            }
         });
    }

    /**
     * Cancels editing for a specific row.
     * @param {jQuery} row The metadata row element.
     */
    function cancelEditing(row) {
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value'); // Get original stored value
        const fieldType = row.data('type');

        // Restore original formatted value and remove editing class
        valueCell.html(formatValue(originalValue, fieldType));
        row.removeClass('editing');
        // Remove specific event listeners for this editor instance
        valueCell.find('.ckan-field-editor').off('.ckanEdit');
    }

    // --- AJAX Handlers ---

    /**
     * Handles the successful response after saving a field.
     * @param {jQuery} row The table row element being edited.
     * @param {jQuery} valueCell The cell containing the value.
     * @param {object} responseData Data returned from the successful AJAX call.
     */
    function handleSaveSuccess(row, valueCell, responseData) {
        // Update the stored original value with the newly saved raw value
        valueCell.data('original-value', responseData.raw_value);

        // Display the newly formatted value returned from the server
        valueCell.html(responseData.formatted_value);

        // Show temporary success message within the value cell
        displayTemporaryMessage(valueCell, ckanMetafieldAdmin.successText || 'บันทึกสำเร็จ', 'ckan-status-success');

        // Clean up editing state
        row.removeClass('editing');
        // Remove specific event listeners for this editor instance
        valueCell.find('.ckan-field-editor').off('.ckanEdit'); // Should be gone anyway after .html()
    }

    /**
     * Handles the error response after attempting to save a field.
     * @param {jQuery} statusMessageElement The element to display the status message in.
     * @param {object|string|null} responseData Data returned from the failed AJAX call, or null/string.
     */
    function handleSaveError(statusMessageElement, responseData) {
        // Try to get specific error from response, fallback to generic message
        const errorMessage = (responseData && typeof responseData === 'string')
                           ? responseData
                           : (ckanMetafieldAdmin.errorText || 'เกิดข้อผิดพลาด');
        statusMessageElement.html(errorMessage) // Use html() if error can contain HTML
            .removeClass('ckan-status-saving')
            .addClass('ckan-status-error')
            .show(); // Make sure the error is visible
        // Keep buttons enabled so user can retry or cancel
        statusMessageElement.closest('.ckan-field-editor').find('.ckan-edit-btn').prop('disabled', false);
    }

    /**
     * Saves the edited field value via AJAX.
     * @param {jQuery} row The metadata row element.
     * @param {string} fieldName The name of the field being saved.
     * @param {string} fieldType The type of the field.
     */
    function saveField(row, fieldName, fieldType) {
        const valueCell = row.find('.ckan-metadata-value');
        const editor = valueCell.find('.ckan-field-editor');
        const statusMessage = editor.find('.ckan-status-message');
        let fieldValue;

        // Get value from the correct input type
        switch (fieldType) {
            case 'boolean':
                fieldValue = editor.find('input[type="checkbox"]').is(':checked');
                break;
            case 'text':
            case 'email':
            case 'url':
            case 'date':
            case 'datetime':
                fieldValue = editor.find('input').val();
                break;
            default: // Includes 'textarea' or unknown types
                fieldValue = editor.find('textarea').val();
        }

        // Show saving status and disable buttons
        statusMessage.html(ckanMetafieldAdmin.editingText || 'กำลังบันทึก...')
            .removeClass('ckan-status-success ckan-status-error')
            .addClass('ckan-status-saving')
            .show();
        editor.find('.ckan-edit-btn').prop('disabled', true);

        // Send AJAX request
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'ckan_update_field',
                nonce: ckanMetafieldAdmin.nonce,
                post_id: postId,
                field_name: fieldName,
                field_value: fieldValue,
                field_type: fieldType
            },
            success: function(response) {
                if (response && response.success) {
                    handleSaveSuccess(row, valueCell, response.data);
                } else {
                    // Pass potential error message from response.data
                    handleSaveError(statusMessage, response ? response.data : null);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 console.error("Save Field AJAX Error:", textStatus, errorThrown);
                 // Pass null to indicate a generic connection/server error
                handleSaveError(statusMessage, null);
            },
            complete: function() {
                // Re-enable buttons ONLY if an error occurred (handleSaveSuccess removes the editor)
                if (statusMessage.hasClass('ckan-status-error')) {
                     editor.find('.ckan-edit-btn').prop('disabled', false);
                }
            }
        });
    }

    // --- Initialization ---

    /**
     * Initializes the editor by attaching the main edit icon click listener.
     */
    function initEditor() {
        // Use event delegation on the container for the edit icons
        $('.ckan-metadata-container').on('click', '.ckan-edit-icon', function() {
            const row = $(this).closest('.ckan-metadata-row');
            startEditing(row);
        });
    }

    // Start the editor functionality
    initEditor();

}); // End document ready
