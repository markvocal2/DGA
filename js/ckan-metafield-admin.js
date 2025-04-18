/**
 * CKAN Metafield Admin JS
 * 
 * JavaScript สำหรับการแก้ไขข้อมูล CKAN Metadata สำหรับผู้ดูแลระบบ
 * ใช้ร่วมกับ ckan-metafield.js
 */

jQuery(document).ready(function($) {
    // ตัวแปรสำหรับเก็บข้อมูลระหว่างการแก้ไข
    let activeEdits = {};
    
    /**
     * เพิ่มฟังก์ชันการทำงานสำหรับปุ่มแก้ไข
     */
    $('.ckan-metadata-admin .ckan-edit-icon').on('click', function(e) {
        e.preventDefault();
        
        // หาองค์ประกอบที่เกี่ยวข้อง
        const row = $(this).closest('.ckan-metadata-row');
        const valueContainer = row.find('.ckan-metadata-value');
        const fieldName = row.data('field');
        const fieldType = row.data('type');
        const originalValue = valueContainer.data('original-value');
        
        // ตรวจสอบว่ากำลังแก้ไขอยู่หรือไม่
        if (row.hasClass('editing')) {
            return;
        }
        
        // กำหนดว่ากำลังแก้ไข
        row.addClass('editing');
        
        // เก็บค่าเดิมไว้
        activeEdits[fieldName] = {
            originalHtml: valueContainer.html(),
            originalValue: originalValue,
            fieldType: fieldType
        };
        
        // สร้างฟอร์มสำหรับแก้ไข
        let inputHtml = createEditInput(fieldName, fieldType, originalValue);
        let controlsHtml = `
            <div class="ckan-edit-controls">
                <button class="ckan-save-btn">${ckanMetafieldAdmin.saveText}</button>
                <button class="ckan-cancel-btn">${ckanMetafieldAdmin.cancelText}</button>
            </div>
        `;
        
        // แทนที่เนื้อหาด้วย input
        valueContainer.html(inputHtml + controlsHtml);
        
        // โฟกัสที่ input
        const input = valueContainer.find('input, select, textarea').first();
        input.focus();
        
        // เพิ่มการทำงานสำหรับปุ่มบันทึกและยกเลิก
        valueContainer.find('.ckan-save-btn').on('click', function() {
            saveEdit(row, fieldName, fieldType);
        });
        
        valueContainer.find('.ckan-cancel-btn').on('click', function() {
            cancelEdit(row, fieldName);
        });
        
        // เพิ่มการทำงานสำหรับการกด Enter และ Escape
        input.on('keydown', function(e) {
            if (e.key === 'Enter' && fieldType !== 'textarea') {
                e.preventDefault();
                saveEdit(row, fieldName, fieldType);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(row, fieldName);
            }
        });
    });
    
    /**
     * สร้าง input element ตามประเภทข้อมูล
     */
    function createEditInput(fieldName, fieldType, value) {
        let inputHtml = '';
        
        switch (fieldType) {
            case 'boolean':
                // สร้าง dropdown สำหรับค่า boolean
                inputHtml = `
                    <select name="${fieldName}" class="ckan-edit-input">
                        <option value="1" ${value ? 'selected' : ''}>ใช่</option>
                        <option value="0" ${!value ? 'selected' : ''}>ไม่ใช่</option>
                    </select>
                `;
                break;
                
            case 'date':
                // สร้าง date input
                inputHtml = `<input type="date" name="${fieldName}" class="ckan-edit-input" value="${formatDateForInput(value)}">`;
                break;
                
            case 'datetime':
                // สร้าง datetime-local input
                inputHtml = `<input type="datetime-local" name="${fieldName}" class="ckan-edit-input" value="${formatDateTimeForInput(value)}">`;
                break;
                
            case 'email':
                // สร้าง email input
                inputHtml = `<input type="email" name="${fieldName}" class="ckan-edit-input" value="${value || ''}">`;
                break;
                
            case 'url':
                // สร้าง url input
                inputHtml = `<input type="url" name="${fieldName}" class="ckan-edit-input" value="${value || ''}">`;
                break;
                
            case 'textarea':
                // สร้าง textarea สำหรับข้อความยาว
                inputHtml = `<textarea name="${fieldName}" class="ckan-edit-input" rows="4">${value || ''}</textarea>`;
                break;
                
            default:
                // สร้าง text input สำหรับประเภทอื่นๆ
                inputHtml = `<input type="text" name="${fieldName}" class="ckan-edit-input" value="${value || ''}">`;
        }
        
        return inputHtml;
    }
    
    /**
     * บันทึกการแก้ไข
     */
    function saveEdit(row, fieldName, fieldType) {
        const valueContainer = row.find('.ckan-metadata-value');
        const input = valueContainer.find('input, select, textarea').first();
        const postId = $('.ckan-metadata-container').data('post-id');
        let newValue = input.val();
        
        // แสดงสถานะกำลังบันทึก
        valueContainer.html(`<span class="ckan-saving">${ckanMetafieldAdmin.editingText}</span>`);
        
        // ส่งข้อมูลไปยังเซิร์ฟเวอร์ด้วย AJAX
        $.ajax({
            url: ckanMetafieldAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'ckan_update_field',
                nonce: ckanMetafieldAdmin.nonce,
                post_id: postId,
                field_name: fieldName,
                field_value: newValue,
                field_type: fieldType
            },
            success: function(response) {
                if (response.success) {
                    // อัปเดตค่าที่แสดงผล
                    valueContainer.html(response.data.formatted_value);
                    valueContainer.data('original-value', response.data.raw_value);
                    
                    // แสดงแจ้งเตือนบันทึกสำเร็จ
                    showNotification(row, 'success', ckanMetafieldAdmin.successText);
                } else {
                    // กรณีเกิดข้อผิดพลาด ให้กลับไปใช้ค่าเดิม
                    valueContainer.html(activeEdits[fieldName].originalHtml);
                    showNotification(row, 'error', ckanMetafieldAdmin.errorText);
                }
                
                // ลบคลาส editing
                row.removeClass('editing');
                // ลบข้อมูลการแก้ไขออกจาก activeEdits
                delete activeEdits[fieldName];
            },
            error: function() {
                // กรณีเกิดข้อผิดพลาดกับ AJAX
                valueContainer.html(activeEdits[fieldName].originalHtml);
                showNotification(row, 'error', ckanMetafieldAdmin.errorText);
                
                // ลบคลาส editing
                row.removeClass('editing');
                // ลบข้อมูลการแก้ไขออกจาก activeEdits
                delete activeEdits[fieldName];
            }
        });
    }
    
    /**
     * ยกเลิกการแก้ไข
     */
    function cancelEdit(row, fieldName) {
        // หาองค์ประกอบที่เกี่ยวข้อง
        const valueContainer = row.find('.ckan-metadata-value');
        
        // คืนค่าเดิม
        valueContainer.html(activeEdits[fieldName].originalHtml);
        
        // ลบคลาส editing
        row.removeClass('editing');
        
        // ลบข้อมูลการแก้ไขออกจาก activeEdits
        delete activeEdits[fieldName];
    }
    
    /**
     * แสดงแจ้งเตือน
     */
    function showNotification(row, type, message) {
        // สร้างองค์ประกอบสำหรับการแจ้งเตือน
        const notification = $(`<div class="ckan-notification ckan-notification-${type}">${message}</div>`);
        
        // เพิ่มการแจ้งเตือนลงในแถว
        row.append(notification);
        
        // ซ่อนการแจ้งเตือนหลังจาก 2 วินาที
        setTimeout(function() {
            notification.fadeOut(300, function() {
                notification.remove();
            });
        }, 2000);
    }
    
    /**
     * แปลงวันที่ให้อยู่ในรูปแบบที่ใช้กับ input type="date"
     */
    function formatDateForInput(dateValue) {
        if (!dateValue) return '';
        
        // หากเป็น timestamp (ตัวเลข)
        if (!isNaN(dateValue)) {
            dateValue = new Date(dateValue * 1000);
        } else {
            // หากเป็น string แปลงเป็น Date object
            dateValue = new Date(dateValue);
        }
        
        // ตรวจสอบว่าวันที่ถูกต้อง
        if (isNaN(dateValue.getTime())) {
            return '';
        }
        
        // แปลงเป็นรูปแบบ YYYY-MM-DD
        return dateValue.toISOString().split('T')[0];
    }
    
    /**
     * แปลงวันที่และเวลาให้อยู่ในรูปแบบที่ใช้กับ input type="datetime-local"
     */
    function formatDateTimeForInput(dateValue) {
        if (!dateValue) return '';
        
        // หากเป็น timestamp (ตัวเลข)
        if (!isNaN(dateValue)) {
            dateValue = new Date(dateValue * 1000);
        } else {
            // หากเป็น string แปลงเป็น Date object
            dateValue = new Date(dateValue);
        }
        
        // ตรวจสอบว่าวันที่ถูกต้อง
        if (isNaN(dateValue.getTime())) {
            return '';
        }
        
        // แปลงเป็นรูปแบบ YYYY-MM-DDThh:mm
        return dateValue.toISOString().slice(0, 16);
    }
});