/**
 * CKAN Metadata Fields Admin JavaScript
 * สำหรับผู้ดูแลระบบเพื่อแก้ไขข้อมูล
 * Version: 1.0.4 (Security Fixes for Email Validation)
 */
jQuery(document).ready(function($) {
    'use strict';

    // --- Configuration Check ---
    // ตรวจสอบว่าตัวแปร ckanMetafieldAdmin ที่ส่งมาจาก PHP มีครบหรือไม่
    if (!window.ckanMetafieldAdmin || !ckanMetafieldAdmin.isAdmin || !ckanMetafieldAdmin.ajaxurl || !ckanMetafieldAdmin.nonce || !ckanMetafieldAdmin.messages) {
        console.warn('CKAN Admin JS: Admin data (ckanMetafieldAdmin) is missing or incomplete. Check localization object.');
        // Optionally hide edit icons if config is missing entirely
        // $('.ckan-edit-icon').hide();
        return; // หยุดการทำงานหากข้อมูลไม่ครบ
    }

    // --- Cache Post ID ---
    // ดึง Post ID จาก data attribute ของ container หลัก
    const postId = $('.ckan-metadata-container').data('post-id');
    if (!postId) {
        console.error('CKAN Admin JS: Post ID not found in .ckan-metadata-container data-post-id attribute.');
        return; // หยุดการทำงานหากไม่พบ Post ID
    }

    // --- Base Helper Function ---

    /**
     * Escapes HTML entities in a string to prevent XSS.
     * @param {string|null|undefined} str The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        // Use jQuery's text() method for robust escaping
        return $('<div>').text(str).html();
        /* // Manual escaping (less robust than jQuery's method)
         return String(str)
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
        */
    }

    // --- Formatting Helper Functions (Extracted from original switch) ---

    /** Returns HTML for empty values */
    function formatEmptyValue() {
        // ใช้ข้อความจาก localized object ถ้ามี
        return `<span class="ckan-empty-value">${escapeHtml(ckanMetafieldAdmin.messages?.no_data || 'ไม่มีข้อมูล')}</span>`;
    }

    /** Formats boolean values */
    function formatBooleanValue(value) {
        // Normalize various truthy/falsy representations
        const isTrue = [true, 1, '1', 'true', 'yes', 'on'].includes(
            typeof value === 'string' ? value.toLowerCase().trim() : value
        );
         // ใช้ข้อความจาก localized object ถ้ามี
        const trueText = escapeHtml(ckanMetafieldAdmin.messages?.boolean_true || 'ใช่');
        const falseText = escapeHtml(ckanMetafieldAdmin.messages?.boolean_false || 'ไม่ใช่');
        return isTrue ? `<span class="boolean-true">${trueText}</span>` : `<span class="boolean-false">${falseText}</span>`;
    }

    /** 
     * Safely validates and formats email values as mailto links
     * Use simple validation to prevent ReDoS attacks
     * @param {*} value The email value to format
     * @returns {string} HTML string with formatted email
     */
    function formatEmailValue(value) {
        const trimmedValue = String(value || '').trim();
        if (!trimmedValue) return formatEmptyValue();
        
        const escapedEmail = escapeHtml(trimmedValue);
        
        // 1. จำกัดความยาวอีเมลก่อนตรวจสอบ (ตามมาตรฐาน RFC)
        if (trimmedValue.length > 254) {
            return escapedEmail;
        }
        
        // 2. ตรวจสอบรูปแบบอีเมลพื้นฐานโดยไม่ใช้ regex ที่ซับซ้อน
        const atIndex = trimmedValue.indexOf('@');
        if (atIndex <= 0 || atIndex === trimmedValue.length - 1) {
            return escapedEmail;
        }
        
        const dotIndex = trimmedValue.lastIndexOf('.');
        if (dotIndex <= atIndex + 1 || dotIndex === trimmedValue.length - 1) {
            return escapedEmail;
        }
        
        // 3. ตรวจสอบว่ามีอักขระไม่พึงประสงค์หรือไม่
        const localPart = trimmedValue.substring(0, atIndex);
        const domainPart = trimmedValue.substring(atIndex + 1);
        
        // ตรวจสอบอักขระพิเศษที่ไม่ควรมีในส่วน domain
        if (/[\s<>()[\]\\.,;:@"']/.test(domainPart)) {
            return escapedEmail;
        }
        
        // ตรวจสอบว่า domain มีส่วนย่อยอย่างน้อย 2 ส่วน
        const domainParts = domainPart.split('.');
        if (domainParts.length < 2 || domainParts.some(part => part === '')) {
            return escapedEmail;
        }
        
        return `<a href="mailto:${escapedEmail}">${escapedEmail}</a>`;
    }

    /** Formats URL values as links, adding protocol and truncating */
    function formatUrlValue(value) {
        const trimmedValue = String(value || '').trim();
        if (!trimmedValue) return formatEmptyValue();

        const escapedUrl = escapeHtml(trimmedValue);
        let displayUrl = escapedUrl;
        let hrefUrl = trimmedValue; // Use original for protocol check

        // Add 'http://' if no protocol is present (simplistic check)
        if (!/^(?:f|ht)tps?:\/\//i.test(hrefUrl)) {
            hrefUrl = `http://${hrefUrl}`;
        }
        // Truncate long URLs for display text
        const maxLength = 50;
        if (displayUrl.length > maxLength) {
            displayUrl = displayUrl.substring(0, maxLength - 3) + '...';
        }
        return `<a href="${escapeHtml(hrefUrl)}" target="_blank" rel="noopener noreferrer" title="${escapedUrl}">${displayUrl}</a>`;
    }

    /** Helper to parse date/timestamp */
    function parseDate(value) {
        if (!value) return null;
        try {
            let date = null;
            const trimmedValue = String(value).trim();
            // Check for Unix timestamp (seconds, at least 10 digits)
            if (/^\d{10,}$/.test(trimmedValue)) {
                date = new Date(parseInt(trimmedValue, 10) * 1000);
            } else { // Try parsing standard date/datetime strings
                date = new Date(trimmedValue);
            }
            // Check if the parsed date is valid
            return (date && !isNaN(date.getTime())) ? date : null;
        } catch (e) {
            return null; // Return null on parsing errors
        }
    }

    /** Formats date values */
    function formatDateValue(value) {
        const date = parseDate(value);
        if (date) {
            // Format to Thai locale date string (e.g., 21 เมษายน 2568)
            return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' });
             // Alternative ISO format: return date.toISOString().split('T')[0];
        }
        // Fallback for unparseable or invalid dates
        return value ? escapeHtml(value) : formatEmptyValue();
    }

    /** Formats datetime values */
    function formatDateTimeValue(value) {
        const datetime = parseDate(value);
        if (datetime) {
            // Format to Thai locale date and time string (e.g., 21 เม.ย. 2568, 23:37 น.)
             return datetime.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
             // Alternative ISO-like format: return datetime.toISOString().slice(0, 16).replace('T', ' ');
        }
         // Fallback for unparseable or invalid dates/times
         return value ? escapeHtml(value) : formatEmptyValue();
    }

    /** Default formatter (escapes HTML) for text/textarea */
    function formatDefaultValue(value) {
        // Preserve line breaks for display in text areas, otherwise just escape
         const escaped = escapeHtml(value);
         // Simple check, adjust if more complex HTML is needed in display
         // For textarea-like display, replace newlines with <br>
         // return escaped.replace(/\n/g, '<br>');
         return escaped; // Default: just escaped text
    }

    // --- Value Formatter Map (Replaces Switch) ---
    // Maps field types to their dedicated formatting functions
    const valueFormatters = {
        'boolean': formatBooleanValue,
        'email': formatEmailValue,
        'url': formatUrlValue,
        'date': formatDateValue,
        'datetime': formatDateTimeValue,
        'text': formatDefaultValue, // Explicitly map 'text'
        'textarea': formatDefaultValue, // Explicitly map 'textarea'
        // Add other specific types here if needed
    };

    /**
     * Formats a value for display based on its type. (Refactored for Complexity)
     * Uses a map to delegate formatting to specific helper functions.
     * @param {*} value The raw value to format.
     * @param {string} type The field type (e.g., 'boolean', 'email', 'date').
     * @returns {string} HTML string ready for display.
     */
    function formatValue(value, type) {
        // Handle empty values universally first
        // Use `!= null` to catch both null and undefined
        if (value == null || value === '') {
            return formatEmptyValue();
        }

        // Normalize type to lowercase just in case
        const normalizedType = String(type || 'text').toLowerCase();

        // Find the appropriate formatter function from the map
        // Fallback to the default formatter if the type is not specifically mapped
        const formatter = valueFormatters[normalizedType] || formatDefaultValue;

        // Call the selected formatter function with the value
        return formatter(value);
    }


    // --- UI Feedback Helper Functions ---

    /**
     * Displays a temporary status message within a parent element.
     * @param {jQuery} parentElement The element to append the message to.
     * @param {string} message The message text (HTML allowed).
     * @param {string} cssClass CSS class for styling ('ckan-status-success', 'ckan-status-error', 'ckan-status-saving').
     * @param {number|null} [displayDuration=2500] Duration in ms to show the message. Null keeps it visible.
     */
    function displayTemporaryMessage(parentElement, message, cssClass, displayDuration = 2500) {
        // Ensure parent element exists
        if (!parentElement || parentElement.length === 0) return;

        // Find or create the status message container within the parent
        let messageContainer = parentElement.find('.ckan-edit-status-container');
        if (messageContainer.length === 0) {
             // Append if not found (e.g., after successful save)
             messageContainer = $('<div class="ckan-edit-status-container"></div>').appendTo(parentElement);
        }

        // Remove previous message content and timer
        messageContainer.empty();
        clearTimeout(messageContainer.data('removalTimer'));

        // Add the new message
        const messageElement = $(`<div class="ckan-status-message"></div>`)
            .addClass(cssClass)
            .html(message) // Use html() as messages might contain simple formatting
            .appendTo(messageContainer)
            .hide() // Start hidden for fade-in effect
            .fadeIn(200);

        // Schedule removal if duration is provided
        if (displayDuration !== null && displayDuration > 0) {
            scheduleMessageRemoval(messageElement, displayDuration);
        }
    }

    /**
     * Schedules the removal of a message element with a fade-out effect.
     * @param {jQuery} messageElement The message element to remove.
     * @param {number} displayDuration Duration in ms before starting fade out.
     */
    function scheduleMessageRemoval(messageElement, displayDuration) {
        const fadeDuration = 400;
        const timer = setTimeout(() => {
            messageElement.fadeOut(fadeDuration, function() {
                // Remove the inner message div, not necessarily the container
                $(this).remove();
                 // Optional: Remove the container if it's empty after removal
                 // if ($(this).parent().is('.ckan-edit-status-container') && $(this).parent().is(':empty')) {
                 //     $(this).parent().remove();
                 // }
            });
        }, displayDuration);
        // Store timer ID on the element to allow cancellation
        messageElement.closest('.ckan-edit-status-container').data('removalTimer', timer);
    }

    // --- Input Generation Helper Functions ---

    /** Generates HTML for a boolean (checkbox) input */
    function generateBooleanInputHtml(currentValue) {
        // Ensure currentValue is a strict boolean for the input state
        const isChecked = currentValue === true || String(currentValue).toLowerCase() === 'true' || currentValue === 1 || String(currentValue) === '1';
        const labelText = escapeHtml(ckanMetafieldAdmin.messages?.boolean_true || 'ใช่');
        // Add a hidden input to ensure a value (0) is sent even when unchecked
        return `
            <input type="hidden" value="0" />
            <label class="ckan-input-boolean">
                <input type="checkbox" value="1" ${isChecked ? 'checked' : ''} /> ${labelText}
            </label>`;
    }

    /** Generates HTML for a standard text input */
    function generateTextInputHtml(currentValue) {
        return `<input type="text" value="${escapeHtml(currentValue ?? '')}" class="ckan-input-text" />`;
    }

    /** Generates HTML for an email input */
    function generateEmailInputHtml(currentValue) {
        return `<input type="email" value="${escapeHtml(currentValue ?? '')}" class="ckan-input-email" placeholder="example@domain.com" />`;
    }

    /** Generates HTML for a URL input */
    function generateUrlInputHtml(currentValue) {
        return `<input type="url" value="${escapeHtml(currentValue ?? '')}" class="ckan-input-url" placeholder="https://example.com" />`;
    }

    /** Generates HTML for a date input, converting value to YYYY-MM-DD */
    function generateDateInputHtml(currentValue) {
        let dateValue = '';
        const date = parseDate(currentValue); // Reuse parsing logic
        if (date) {
            // Format for <input type="date"> which requires YYYY-MM-DD
            dateValue = date.toISOString().split('T')[0];
        }
        return `<input type="date" value="${escapeHtml(dateValue)}" class="ckan-input-date" />`;
    }

    /** Generates HTML for a datetime-local input, converting value to YYYY-MM-DDTHH:mm */
    function generateDateTimeInputHtml(currentValue) {
        let datetimeValue = '';
        const datetime = parseDate(currentValue); // Reuse parsing logic
        if (datetime) {
            // Format for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
            // Need to handle timezone offset carefully if the original value wasn't local
            // This assumes the parsed date is in the browser's local time for input display
            const year = datetime.getFullYear();
            const month = (datetime.getMonth() + 1).toString().padStart(2, '0');
            const day = datetime.getDate().toString().padStart(2, '0');
            const hours = datetime.getHours().toString().padStart(2, '0');
            const minutes = datetime.getMinutes().toString().padStart(2, '0');
            datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        return `<input type="datetime-local" value="${escapeHtml(datetimeValue)}" class="ckan-input-datetime" />`;
    }

    /** Generates HTML for a textarea input */
    function generateTextareaHtml(currentValue) {
        // Use text() for setting textarea value to handle special characters correctly
        const $textarea = $('<textarea rows="4" class="ckan-input-textarea"></textarea>');
        $textarea.text(currentValue ?? ''); // Set value using text()
        return $textarea.prop('outerHTML'); // Return the HTML string
    }

    // --- Input Generator Map ---
    // Maps field types to their corresponding input generation functions
    const inputGenerators = {
        'boolean': generateBooleanInputHtml,
        'text': generateTextInputHtml,
        'email': generateEmailInputHtml,
        'url': generateUrlInputHtml,
        'date': generateDateInputHtml,
        'datetime': generateDateTimeInputHtml,
        'textarea': generateTextareaHtml, // Explicitly map textarea
        // Add other input types as needed (e.g., select, number)
    };


    // --- Editing Core Functions ---

    /**
     * Starts the editing process for a specific metadata row.
     * Handles UI changes to show input field and action buttons.
     * @param {jQuery} row The metadata row element (.ckan-metadata-row).
     */
    function startEditing(row) {
        // 1. Prevent editing multiple rows simultaneously
        const $currentlyEditing = $('.ckan-metadata-row.editing');
        if ($currentlyEditing.length > 0 && !$currentlyEditing.is(row)) {
            // Use localized message
            alert(ckanMetafieldAdmin.messages?.already_editing || 'กรุณาบันทึกหรือยกเลิกการแก้ไขที่กำลังดำเนินการก่อน');
            return;
        }
        // 2. Prevent re-entering edit mode if already editing this row
        if (row.hasClass('editing')) {
            return;
        }

        // 3. Get field details from data attributes
        const fieldName = row.data('field');
        const fieldType = String(row.data('type') || 'text').toLowerCase(); // Default to text
        const valueCell = row.find('.ckan-metadata-value');

        // 4. Store original raw value if not already stored (first edit)
        if (valueCell.data('original-value-raw') === undefined) {
             // Attempt to get raw value from a hidden span/data-attribute if available,
             // otherwise, use the current text/html as a fallback (less ideal)
             let rawValue = row.find('.ckan-raw-value').text(); // Example: <span class="ckan-raw-value" style="display:none;">raw data</span>
             if (rawValue === undefined) {
                 // Fallback: try a data attribute on the value cell itself
                 rawValue = valueCell.data('raw-value');
             }
             if (rawValue === undefined) {
                 // Worst case fallback: use current formatted text (might not be suitable for editing)
                 // console.warn(`CKAN Admin JS: Raw value not found for field '${fieldName}'. Using formatted text as fallback.`);
                 // For safety, let's assume it might be the intended raw value if no other source found
                 // This needs careful handling in the backend or specific raw value provision
                 rawValue = valueCell.text(); // Be cautious with this fallback
             }
             valueCell.data('original-value-raw', rawValue);
        }
        // 5. Get the current raw value for input generation
        let currentValueForInput = valueCell.data('original-value-raw') ?? '';


        // 6. Add editing class and clear previous content
        row.addClass('editing');
        valueCell.empty(); // Clear the display value cell

        // 7. Get the appropriate input generator function
        const generatorFunction = inputGenerators[fieldType] || inputGenerators['textarea']; // Default to textarea
        const inputHtml = generatorFunction(currentValueForInput);

        // 8. Build the editor HTML structure
        // Use localized button texts
        const saveText = escapeHtml(ckanMetafieldAdmin.messages?.save || 'บันทึก');
        const cancelText = escapeHtml(ckanMetafieldAdmin.messages?.cancel || 'ยกเลิก');
        const editorHtml = `
            <div class="ckan-field-editor">
                <div class="ckan-input-wrapper">
                    ${inputHtml}
                </div>
                <div class="ckan-edit-actions">
                    <button type="button" class="ckan-edit-btn ckan-save-btn">${saveText}</button>
                    <button type="button" class="ckan-edit-btn ckan-cancel-btn">${cancelText}</button>
                </div>
                <div class="ckan-edit-status-container"></div>
            </div>`;

        // 9. Append editor and focus the input
        valueCell.html(editorHtml);
        // Find the first focusable element (input or textarea)
        const $inputElement = valueCell.find('input:not([type="hidden"]), textarea').first();
        if ($inputElement.length) {
            $inputElement.focus().select();
        }


        // 10. Add event listeners specific to *this* editor instance (namespaced)
        const editorElement = valueCell.find('.ckan-field-editor');
        editorElement.find('.ckan-save-btn').on('click.ckanEdit', () => saveField(row, fieldName, fieldType));
        editorElement.find('.ckan-cancel-btn').on('click.ckanEdit', () => cancelEditing(row));

        // Add keydown listener for Enter/Escape within the editor's input/textarea
        editorElement.find('.ckan-input-wrapper').find('input:not([type="hidden"]), textarea').on('keydown.ckanEdit', (e) => {
            if (e.key === 'Enter' && fieldType !== 'textarea') { // Save on Enter (but not for textarea)
                e.preventDefault();
                saveField(row, fieldName, fieldType);
            } else if (e.key === 'Escape' || e.key === 'Esc') { // Cancel on Escape
                cancelEditing(row);
            }
        });
    }

    /**
     * Cancels editing for a specific row, restoring the original value.
     * @param {jQuery} row The metadata row element (.ckan-metadata-row).
     */
    function cancelEditing(row) {
        if (!row.hasClass('editing')) return; // Do nothing if not editing

        const valueCell = row.find('.ckan-metadata-value');
        const originalValueRaw = valueCell.data('original-value-raw'); // Get original stored raw value
        const fieldType = String(row.data('type') || 'text').toLowerCase();

        // Restore original formatted value using the raw data
        valueCell.html(formatValue(originalValueRaw, fieldType)); // Re-format the raw value

        // Clean up
        row.removeClass('editing');
        // Remove specific event listeners (already done by .html(), but good practice)
        valueCell.find('.ckan-field-editor').off('.ckanEdit');
        // No need to remove data('original-value-raw') - keep it for next edit
    }

    // --- AJAX Handlers ---

    /**
     * Handles the successful response after saving a field via AJAX.
     * Updates the display and provides user feedback.
     * @param {jQuery} row The table row element being edited.
     * @param {jQuery} valueCell The cell containing the value.
     * @param {object} responseData Data returned from the successful AJAX call (should contain raw_value and formatted_value).
     */
    function handleSaveSuccess(row, valueCell, responseData) {
        // 1. Update the stored original raw value with the newly saved raw value from server
        // Ensure responseData.raw_value exists, otherwise keep old value? Or clear? Let's update.
         valueCell.data('original-value-raw', responseData.raw_value);

        // 2. Display the newly formatted value returned from the server
        // Use formatValue as a fallback if server doesn't provide formatted_value
        const displayHtml = responseData.formatted_value !== undefined
                           ? responseData.formatted_value
                           : formatValue(responseData.raw_value, row.data('type'));
        valueCell.html(displayHtml);

        // 3. Show temporary success message within the value cell's status container
        // Use localized message
        const successMsg = escapeHtml(ckanMetafieldAdmin.messages?.success || 'บันทึกสำเร็จ');
        displayTemporaryMessage(valueCell, successMsg, 'ckan-status-success');

        // 4. Clean up editing state
        row.removeClass('editing');
        // Event listeners are removed by .html()
    }

    /**
     * Handles error responses (AJAX or application-level) during save attempts.
     * Displays an error message to the user.
     * @param {jQuery} editorElement The main editor container element.
     * @param {object|string|null} responseData Data returned from the failed AJAX call, or null/string.
     */
    function handleSaveError(editorElement, responseData) {
        const statusContainer = editorElement.find('.ckan-edit-status-container');
        if (statusContainer.length === 0) return; // Should not happen if structure is correct

        // Try to get specific error message from response, fallback to generic messages
        let errorMessage = ckanMetafieldAdmin.messages?.error || 'เกิดข้อผิดพลาด'; // Generic default

        if (responseData && typeof responseData === 'string') {
             errorMessage = responseData; // Use error string directly from response.data
        } else if (responseData && typeof responseData === 'object' && responseData.message) {
             errorMessage = responseData.message; // Use message property if it's an object
        } else if (responseData === null) {
            // Explicitly null suggests a connection/server error
             errorMessage = ckanMetafieldAdmin.messages?.ajax_error || 'การเชื่อมต่อล้มเหลว';
        }

        // Display the error message (keep it visible until next action)
        displayTemporaryMessage(statusContainer, errorMessage, 'ckan-status-error', null); // null duration = stays visible

        // Re-enable buttons so user can retry or cancel
        editorElement.find('.ckan-edit-btn').prop('disabled', false);
    }

    /**
     * Saves the edited field value via AJAX.
     * Collects value, sends request, and delegates response handling.
     * @param {jQuery} row The metadata row element (.ckan-metadata-row).
     * @param {string} fieldName The name (meta_key) of the field being saved.
     * @param {string} fieldType The type of the field ('text', 'boolean', etc.).
     */
    function saveField(row, fieldName, fieldType) {
        const valueCell = row.find('.ckan-metadata-value');
        const editorElement = valueCell.find('.ckan-field-editor');
        const statusContainer = editorElement.find('.ckan-edit-status-container');
        const inputWrapper = editorElement.find('.ckan-input-wrapper');
        let fieldValue;

        // 1. Get value from the correct input type within the wrapper
        switch (fieldType) {
            case 'boolean':
                // Find the checkbox *within the wrapper*
                fieldValue = inputWrapper.find('input[type="checkbox"]').is(':checked') ? '1' : '0';
                break;
            case 'text':
            case 'email':
            case 'url':
            case 'date':
            case 'datetime':
                 // Find the corresponding input *within the wrapper*
                 fieldValue = inputWrapper.find(`input[type="${fieldType === 'datetime' ? 'datetime-local' : fieldType}"]`).val();
                 break;
            case 'textarea':
                 fieldValue = inputWrapper.find('textarea').val();
                 break;
            default: // Fallback for potentially unknown types treated as text
                console.warn(`CKAN Admin JS: Unknown field type '${fieldType}' for saving. Treating as text.`);
                fieldValue = inputWrapper.find('input[type="text"], textarea').first().val(); // Try finding generic input
        }

        // 2. Show "Saving..." status and disable buttons
        // Use localized message
        const savingMsg = escapeHtml(ckanMetafieldAdmin.messages?.saving || 'กำลังบันทึก...');
        displayTemporaryMessage(statusContainer, savingMsg, 'ckan-status-saving', null); // Keep saving message visible
        editorElement.find('.ckan-edit-btn').prop('disabled', true);

        // 3. Send AJAX request
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            dataType: 'json', // Expect JSON response from WordPress AJAX handler
            data: {
                action: 'ckan_update_field', // Matches the WordPress action hook
                nonce: ckanMetafieldAdmin.nonce, // Security nonce
                post_id: postId,
                field_name: fieldName,
                field_value: fieldValue, // Send the raw value from the input
                field_type: fieldType      // Send type for potential server-side validation/handling
            },
            success: function(response) {
                // Check WordPress standard AJAX response format
                if (response && response.success === true && response.data) {
                    handleSaveSuccess(row, valueCell, response.data);
                } else {
                    // Handle application-level errors (success: false or missing data)
                    handleSaveError(editorElement, response ? response.data : null); // Pass error data if available
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 // Handle AJAX transport errors (network, server error, etc.)
                console.error("CKAN Save Field AJAX Error:", textStatus, errorThrown, jqXHR.responseText);
                handleSaveError(editorElement, null); // Pass null to indicate transport error
            },
            // complete: function() {
            //     // Re-enable buttons only if an error occurred.
            //     // handleSaveError already does this, so complete might be redundant here.
            // }
        });
    }

    // --- Initialization ---

    /**
     * Initializes the editor by attaching the main edit icon click listener using event delegation.
     */
    function initEditor() {
        const container = $('.ckan-metadata-container');

        // Store original raw values on load if provided via hidden elements
        container.find('.ckan-metadata-row').each(function() {
            const $row = $(this);
            const $valueCell = $row.find('.ckan-metadata-value');
            const $rawValueEl = $row.find('.ckan-raw-value'); // Example: <span class="ckan-raw-value" style="display:none;">raw data</span>
            if ($rawValueEl.length > 0) {
                $valueCell.data('original-value-raw', $rawValueEl.text());
            } else if ($valueCell.data('raw-value') !== undefined) {
                 $valueCell.data('original-value-raw', $valueCell.data('raw-value'));
            }
            // No fallback here - raw value should ideally be provided by backend
        });


        // Use event delegation on the main container for edit icon clicks
        container.on('click', '.ckan-edit-icon', function(e) {
            e.preventDefault(); // Prevent default anchor behavior if it's a link
            const row = $(this).closest('.ckan-metadata-row');
            if (row.length) {
                startEditing(row);
            }
        });

         console.log('CKAN Admin JS Initialized for Post ID:', postId);
    }

    // Start the editor functionality only if we have a Post ID and Admin capabilities
    if (postId && ckanMetafieldAdmin && ckanMetafieldAdmin.isAdmin) {
        initEditor();
    } else if (!ckanMetafieldAdmin || !ckanMetafieldAdmin.isAdmin) {
         console.log('CKAN Admin JS: Not admin or config missing, editor not initialized.');
    }

}); // End document ready
