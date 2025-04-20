/**
 * CKAN Metadata Fields Admin JavaScript
 * สำหรับผู้ดูแลระบบเพื่อแก้ไขข้อมูล
 * Version: 1.0.0
 */
jQuery(document).ready(function($) {
    'use strict';
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!ckanMetafieldAdmin.isAdmin) {
        return;
    }
    
    // ตัวแปรสำหรับเก็บข้อมูลโพสต์
    const postId = $('.ckan-metadata-container').data('post-id');
    
    // เริ่มต้นการทำงาน Editor
    function initEditor() {
        // เพิ่ม event listener สำหรับไอคอนแก้ไข
        $('.ckan-edit-icon').on('click', function() {
            const row = $(this).closest('.ckan-metadata-row');
            
            // หยุดหากกำลังแก้ไขแถวอื่นอยู่
            if ($('.ckan-metadata-row.editing').length > 0 && !row.hasClass('editing')) {
                alert('กรุณาบันทึกหรือยกเลิกการแก้ไขที่กำลังดำเนินการก่อน');
                return;
            }
            
            // เปลี่ยนโหมดเป็นการแก้ไข
            startEditing(row);
        });
    }
    
    // เริ่มการแก้ไขในแถวที่กำหนด
    function startEditing(row) {
        // เก็บข้อมูลที่จำเป็น
        const fieldName = row.data('field');
        const fieldType = row.data('type');
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value');
        
        // เพิ่ม class ให้รู้ว่ากำลังแก้ไข
        row.addClass('editing');
        
        // สร้าง form ตามประเภทของข้อมูล
        let editorHtml = '<div class="ckan-field-editor">';
        
        switch (fieldType) {
            case 'boolean':
                // Checkbox สำหรับข้อมูล boolean
                const isChecked = (originalValue === true || originalValue === 1 || originalValue === '1' || 
                                  originalValue === 'true' || originalValue === 'yes') ? 'checked' : '';
                editorHtml += `<label><input type="checkbox" ${isChecked} /> ใช่</label>`;
                break;
                
            case 'text':
                // Input สำหรับข้อความทั่วไป
                editorHtml += `<input type="text" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'email':
                // Input สำหรับอีเมล
                editorHtml += `<input type="email" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'url':
                // Input สำหรับ URL
                editorHtml += `<input type="url" value="${escapeHtml(originalValue || '')}" />`;
                break;
                
            case 'date':
                // Input สำหรับวันที่
                let dateValue = originalValue;
                if (dateValue && !isNaN(dateValue)) {
                    // แปลง timestamp เป็นรูปแบบ yyyy-mm-dd
                    const date = new Date(parseInt(dateValue) * 1000);
                    dateValue = date.toISOString().split('T')[0];
                }
                editorHtml += `<input type="date" value="${escapeHtml(dateValue || '')}" />`;
                break;
                
            case 'datetime':
                // Input สำหรับวันที่และเวลา
                let datetimeValue = originalValue;
                if (datetimeValue && !isNaN(datetimeValue)) {
                    // แปลง timestamp เป็นรูปแบบ yyyy-mm-ddThh:mm
                    const datetime = new Date(parseInt(datetimeValue) * 1000);
                    datetimeValue = datetime.toISOString().slice(0, 16);
                }
                editorHtml += `<input type="datetime-local" value="${escapeHtml(datetimeValue || '')}" />`;
                break;
                
            default:
                // ข้อความทั่วไปสำหรับประเภทที่ไม่รองรับ
                editorHtml += `<textarea rows="3">${escapeHtml(originalValue || '')}</textarea>`;
        }
        
        // เพิ่มปุ่มบันทึกและยกเลิก
        editorHtml += `
            <div class="ckan-edit-actions">
                <button class="ckan-edit-btn ckan-save-btn">${ckanMetafieldAdmin.saveText}</button>
                <button class="ckan-edit-btn ckan-cancel-btn">${ckanMetafieldAdmin.cancelText}</button>
            </div>
            <div class="ckan-status-message" style="display:none;"></div>
        </div>`;
        
        // แทนที่เนื้อหาเดิมด้วย editor
        valueCell.html(editorHtml);
        
        // โฟกัสที่ input แรก
        valueCell.find('input, textarea').first().focus();
        
        // เพิ่ม event listener สำหรับปุ่มบันทึกและยกเลิก
        valueCell.find('.ckan-save-btn').on('click', function() {
            saveField(row, fieldName, fieldType);
        });
        
        valueCell.find('.ckan-cancel-btn').on('click', function() {
            cancelEditing(row);
        });
    }
    
    // บันทึกข้อมูลที่แก้ไข
    function saveField(row, fieldName, fieldType) {
        const valueCell = row.find('.ckan-metadata-value');
        const statusMessage = valueCell.find('.ckan-status-message');
        let fieldValue;
        
        // ดึงค่าจาก input ตามประเภท
        switch (fieldType) {
            case 'boolean':
                fieldValue = valueCell.find('input[type="checkbox"]').is(':checked') ? true : false;
                break;
            case 'text':
            case 'email':
            case 'url':
                fieldValue = valueCell.find('input').val();
                break;
            case 'date':
            case 'datetime':
                fieldValue = valueCell.find('input').val();
                break;
            default:
                fieldValue = valueCell.find('textarea').val();
        }
        
        // แสดงสถานะกำลังบันทึก
        statusMessage.html(ckanMetafieldAdmin.editingText)
            .removeClass('ckan-status-success ckan-status-error')
            .addClass('ckan-status-saving')
            .show();
        
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
                field_type: fieldType
            },
            success: function(response) {
                if (response.success) {
                    // อัปเดตค่าใน data attribute
                    valueCell.data('original-value', response.data.raw_value);
                    
                    // แสดงค่าที่ถูกจัดรูปแบบ
                    valueCell.html(response.data.formatted_value);
                    
                    // แสดงข้อความสำเร็จและซ่อนหลังจาก 2 วินาที
                    valueCell.append(`<div class="ckan-status-message ckan-status-success">${ckanMetafieldAdmin.successText}</div>`);
                    setTimeout(function() {
                        valueCell.find('.ckan-status-message').fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 2000);
                    
                    // ลบ class editing
                    row.removeClass('editing');
                } else {
                    // แสดงข้อความผิดพลาด
                    statusMessage.html(response.data || ckanMetafieldAdmin.errorText)
                        .removeClass('ckan-status-saving')
                        .addClass('ckan-status-error');
                }
            },
            error: function() {
                // แสดงข้อความผิดพลาด
                statusMessage.html(ckanMetafieldAdmin.errorText)
                    .removeClass('ckan-status-saving')
                    .addClass('ckan-status-error');
            }
        });
    }
    
    // ยกเลิกการแก้ไข
    function cancelEditing(row) {
        const valueCell = row.find('.ckan-metadata-value');
        const originalValue = valueCell.data('original-value');
        const fieldType = row.data('type');
        
        // แสดงค่าเดิม
        valueCell.html(formatValue(originalValue, fieldType));
        
        // ลบ class editing
        row.removeClass('editing');
    }
    
    // จัดรูปแบบข้อมูลสำหรับการแสดงผล (simplified version)
    function formatValue(value, type) {
        if (value === null || value === undefined || value === '') {
            return '<span class="ckan-empty-value">ไม่มีข้อมูล</span>';
        }
        
        switch (type) {
            case 'boolean':
                if (value === true || value === 1 || value === '1' || value === 'true' || value === 'yes') {
                    return '<span class="boolean-true">ใช่</span>';
                } else {
                    return '<span class="boolean-false">ไม่ใช่</span>';
                }
                
            case 'email':
                return '<a href="mailto:' + escapeHtml(value) + '">' + escapeHtml(value) + '</a>';
                
            case 'url':
                let displayUrl = escapeHtml(value);
                if (displayUrl.length > 50) {
                    displayUrl = displayUrl.substring(0, 47) + '...';
                }
                return '<a href="' + escapeHtml(value) + '" target="_blank" title="' + escapeHtml(value) + '">' + displayUrl + '</a>';
                
            default:
                return escapeHtml(value);
        }
    }
    
    // ฟังก์ชันช่วย - escape HTML entities
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // เริ่มต้นการทำงาน
    initEditor();
});
