/**
 * CKAN Metadata Fields Admin JavaScript
 * สำหรับผู้ดูแลระบบเพื่อแก้ไขข้อมูล
 * Version: 1.0.1 (Refactored for reduced nesting)
 */
jQuery(document).ready(function($) {
    'use strict';

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!ckanMetafieldAdmin || !ckanMetafieldAdmin.isAdmin) {
        console.warn('CKAN Admin JS: Not an admin or admin data missing.');
        return;
    }

    // ตัวแปรสำหรับเก็บข้อมูลโพสต์
    const postId = $('.ckan-metadata-container').data('post-id');
    if (!postId) {
        console.error('CKAN Admin JS: Post ID not found.');
        return; // Stop if post ID is missing
    }

    // --- Helper Functions ---

    /**
     * ฟังก์ชันช่วย - escape HTML entities
     * @param {string|null|undefined} str ข้อความที่ต้องการ escape
     * @returns {string} ข้อความที่ escape แล้ว
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * จัดรูปแบบข้อมูลสำหรับการแสดงผล (simplified version)
     * @param {*} value ค่าที่ต้องการจัดรูปแบบ
     * @param {string} type ประเภทข้อมูล (boolean, email, url, etc.)
     * @returns {string} HTML string สำหรับแสดงผล
     */
    function formatValue(value, type) {
        if (value === null || value === undefined || value === '') {
            return '<span class="ckan-empty-value">ไม่มีข้อมูล</span>';
        }

        switch (type) {
            case 'boolean':
                // More robust boolean check
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
                if (displayUrl.length > 50) {
                    displayUrl = displayUrl.substring(0, 47) + '...';
                }
                // Ensure URL has a protocol for the link
                const hrefUrl = /^(http|https):\/\//.test(escapedUrl) ? escapedUrl : `http://${escapedUrl}`;
                return `<a href="${hrefUrl}" target="_blank" rel="noopener noreferrer" title="${escapedUrl}">${displayUrl}</a>`;

            // Add cases for date/datetime formatting if needed here
            // case 'date':
            // case 'datetime':

            default:
                return escapeHtml(value);
        }
    }

    /**
     * แสดงข้อความสถานะชั่วคราว (เช่น สำเร็จ หรือ ผิดพลาด)
     * @param {jQuery} parentElement Element ที่จะใส่ข้อความสถานะ
     * @param {string} message ข้อความที่จะแสดง
     * @param {string} cssClass Class CSS สำหรับข้อความ (เช่น 'ckan-status-success', 'ckan-status-error')
     * @param {number} displayDuration ระยะเวลาที่จะแสดงข้อความ (ms)
     */
    function displayTemporaryMessage(parentElement, message, cssClass, displayDuration = 2000) {
        const messageElement = $(`<div class="ckan-status-message ${cssClass}"></div>`).html(message);
        parentElement.append(messageElement);
        scheduleMessageRemoval(messageElement, displayDuration);
    }

    /**
     * ตั้งเวลาเพื่อซ่อนและลบข้อความสถานะ
     * @param {jQuery} messageElement Element ของข้อความสถานะ
     * @param {number} displayDuration ระยะเวลาที่จะแสดงข้อความ (ms)
     */
    function scheduleMessageRemoval(messageElement, displayDuration) {
        const fadeDuration = 300;
        setTimeout(() => {
            messageElement.fadeOut(fadeDuration, function() {
                $(this).remove();
            });
        }, displayDuration);
    }

    // --- Editing Functions ---

    /**
     * เริ่มการแก้ไขในแถวที่กำหนด
     * @param {jQuery} row แถว (element .ckan-metadata-row) ที่จะแก้ไข
     */
    function startEditing(row) {
        // หยุดหากกำลังแก้ไขแถวอื่นอยู่
        if ($('.ckan-metadata-row.editing').length > 0 && !row.hasClass('editing')) {
            alert('กรุณาบันทึกหรือยกเลิกการแก้ไขที่กำลังดำเนินการก่อน');
            return;
        }

        const fieldName = row.data('field');
        const fieldType = row.data('type');
        const valueCell = row.find('.ckan-metadata-value');
        // Ensure original value is stored correctly, especially for boolean
        let originalValue = valueCell.data('original-value');
        if (fieldType === 'boolean') {
             originalValue = [true, 1, '1', 'true', 'yes'].includes(
                 typeof originalValue === 'string' ? originalValue.toLowerCase() : originalValue
             );
        }


        row.addClass('editing');

        let editorHtml = '<div class="ckan-field-editor">';
        let inputValue = originalValue ?? ''; // Use nullish coalescing for default

        switch (fieldType) {
            case 'boolean':
                const isChecked = originalValue === true; // Simplified check after normalization
                editorHtml += `<label><input type="checkbox" ${isChecked ? 'checked' : ''} /> ใช่</label>`;
                break;
            case 'text':
                editorHtml += `<input type="text" value="${escapeHtml(inputValue)}" />`;
                break;
            case 'email':
                editorHtml += `<input type="email" value="${escapeHtml(inputValue)}" />`;
                break;
            case 'url':
                editorHtml += `<input type="url" value="${escapeHtml(inputValue)}" />`;
                break;
            case 'date':
                let dateValue = inputValue;
                 // Check if it looks like a Unix timestamp (seconds)
                if (dateValue && /^\d{10,}$/.test(dateValue)) {
                    try {
                       const date = new Date(parseInt(dateValue, 10) * 1000);
                       if (!isNaN(date)) { // Check if date is valid
                           dateValue = date.toISOString().split('T')[0];
                       } else {
                            dateValue = ''; // Reset if timestamp was invalid
                       }
                    } catch(e) { dateValue = ''; } // Handle potential errors during parsing
                } else if (dateValue && typeof dateValue === 'string' && dateValue.includes('T')) {
                    // Handle if it's already an ISO string or similar from previous edits
                    dateValue = dateValue.split('T')[0];
                }
                editorHtml += `<input type="date" value="${escapeHtml(dateValue)}" />`;
                break;
            case 'datetime':
                let datetimeValue = inputValue;
                // Check if it looks like a Unix timestamp (seconds)
                if (datetimeValue && /^\d{10,}$/.test(datetimeValue)) {
                     try {
                        const datetime = new Date(parseInt(datetimeValue, 10) * 1000);
                        if (!isNaN(datetime)) { // Check if date is valid
                            // Format to YYYY-MM-DDTHH:mm (suitable for datetime-local)
                            const year = datetime.getFullYear();
                            const month = (datetime.getMonth() + 1).toString().padStart(2, '0');
                            const day = datetime.getDate().toString().padStart(2, '0');
                            const hours = datetime.getHours().toString().padStart(2, '0');
                            const minutes = datetime.getMinutes().toString().padStart(2, '0');
                            datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                        } else {
                             datetimeValue = ''; // Reset if timestamp was invalid
                        }
                     } catch(e) { datetimeValue = ''; } // Handle potential errors
                }
                editorHtml += `<input type="datetime-local" value="${escapeHtml(datetimeValue)}" />`;
                break;
            default: // Use textarea for unknown or complex types
                editorHtml += `<textarea rows="3">${escapeHtml(inputValue)}</textarea>`;
        }

        // Add buttons and status message container
        editorHtml += `
            <div class="ckan-edit-actions">
                <button class="ckan-edit-btn ckan-save-btn">${ckanMetafieldAdmin.saveText || 'บันทึก'}</button>
                <button class="ckan-edit-btn ckan-cancel-btn">${ckanMetafieldAdmin.cancelText || 'ยกเลิก'}</button>
            </div>
            <div class="ckan-status-message" style="display:none;"></div>
        </div>`;

        valueCell.html(editorHtml);
        valueCell.find('input, textarea').first().focus(); // Focus the first input/textarea

        // Add event listeners for the new buttons
        valueCell.find('.ckan-save-btn').on('click', function() {
            saveField(row, fieldName, fieldType);
        });
        valueCell.find('.ckan-cancel-btn').on('click', function() {
            cancelEditing(row);
        });
    }

    /**
     * ยกเลิกการแก้ไข
     * @param {jQuery} row แถวที่กำลังแก้ไข
     */
    function cancelEditing(row) {
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value'); // Get original value again
        const fieldType = row.data('type');

        // แสดงค่าเดิมที่จัดรูปแบบแล้ว
        valueCell.html(formatValue(originalValue, fieldType));
        row.removeClass('editing');
    }

    // --- AJAX Handlers ---

    /**
     * Handles the success response after saving a field.
     * @param {jQuery} row The table row element being edited.
     * @param {jQuery} valueCell The cell containing the value.
     * @param {object} responseData Data returned from the successful AJAX call.
     */
    function handleSaveSuccess(row, valueCell, responseData) {
        // อัปเดตค่าใน data attribute (ใช้ raw_value ที่ server ส่งกลับมา)
        valueCell.data('original-value', responseData.raw_value);

        // แสดงค่าที่ถูกจัดรูปแบบใหม่
        valueCell.html(responseData.formatted_value);

        // แสดงข้อความสำเร็จชั่วคราว
        displayTemporaryMessage(valueCell, ckanMetafieldAdmin.successText || 'บันทึกสำเร็จ', 'ckan-status-success');

        // ลบ class editing
        row.removeClass('editing');
    }

    /**
     * Handles the error response after attempting to save a field.
     * @param {jQuery} statusMessageElement The element to display the status message in.
     * @param {object|string|null} responseData Data returned from the failed AJAX call, or null.
     */
    function handleSaveError(statusMessageElement, responseData) {
        const errorMessage = (responseData && typeof responseData === 'string' ? responseData : ckanMetafieldAdmin.errorText) || 'เกิดข้อผิดพลาด';
        statusMessageElement.html(errorMessage)
            .removeClass('ckan-status-saving')
            .addClass('ckan-status-error')
            .show(); // Ensure it's visible
    }

    /**
     * บันทึกข้อมูลที่แก้ไขผ่าน AJAX
     * @param {jQuery} row แถวที่กำลังแก้ไข
     * @param {string} fieldName ชื่อฟิลด์
     * @param {string} fieldType ประเภทฟิลด์
     */
    function saveField(row, fieldName, fieldType) {
        const valueCell = row.find('.ckan-metadata-value');
        const editor = valueCell.find('.ckan-field-editor'); // Get the editor container
        const statusMessage = editor.find('.ckan-status-message'); // Find status within editor
        let fieldValue;

        // ดึงค่าจาก input ตามประเภท
        switch (fieldType) {
            case 'boolean':
                fieldValue = editor.find('input[type="checkbox"]').is(':checked'); // Simplified
                break;
            case 'text':
            case 'email':
            case 'url':
            case 'date':
            case 'datetime':
                fieldValue = editor.find('input').val();
                break;
            default:
                fieldValue = editor.find('textarea').val();
        }

        // แสดงสถานะกำลังบันทึก
        statusMessage.html(ckanMetafieldAdmin.editingText || 'กำลังบันทึก...')
            .removeClass('ckan-status-success ckan-status-error')
            .addClass('ckan-status-saving')
            .show();
        editor.find('.ckan-edit-btn').prop('disabled', true); // Disable buttons during save

        // ส่งข้อมูลไปยัง server ด้วย AJAX
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'ckan_update_field',
                nonce: ckanMetafieldAdmin.nonce,
                post_id: postId,
                field_name: fieldName,
                field_value: fieldValue,
                field_type: fieldType // Send type for potential server-side validation/conversion
            },
            success: function(response) {
                if (response.success) {
                    handleSaveSuccess(row, valueCell, response.data);
                } else {
                    handleSaveError(statusMessage, response.data); // Pass response data for specific error message
                }
            },
            error: function() {
                handleSaveError(statusMessage, null); // Pass null for generic error
            },
            complete: function() {
                // Re-enable buttons if they still exist (might have been replaced on success)
                 editor.find('.ckan-edit-btn').prop('disabled', false);
            }
        });
    }

    // --- Initialization ---

    /**
     * เริ่มต้นการทำงาน Editor - เพิ่ม event listener สำหรับไอคอนแก้ไข
     */
    function initEditor() {
        $('.ckan-metadata-container').on('click', '.ckan-edit-icon', function() {
            const row = $(this).closest('.ckan-metadata-row');
            startEditing(row);
        });
        // Add delegation for dynamically added cancel/save buttons if needed,
        // but binding inside startEditing() is generally fine here.
    }

    // เริ่มต้นการทำงาน
    initEditor();
});
