/**
 * Department Role Manager - JavaScript
 * จัดการบทบาทและสิทธิ์ของแผนกต่างๆ ใน WordPress
 * เวอร์ชัน: 1.0.2
 */
jQuery(document).ready(function($) {
    // ตัวแปรหลัก
    const tableWrapper = $('.roles-table-wrapper');
    
    // ========== Event Handlers ==========
    
    /**
     * กำหนด Event สำหรับปุ่มดูผู้ใช้ - ใช้ delegation เพื่อประสิทธิภาพ
     */
    $(document).on('click', '.view-users-btn', function() {
        if ($(this).data('role')) {
            const role = $(this).data('role');
            showUsersByRole(role);
        }
    });
    
    /**
     * ปุ่มปิด Modal ผู้ใช้
     */
    $(document).on('click', '#users-modal .close-btn', function() {
        closeUserModal();
    });
    
    /**
     * ปิด Modal เมื่อคลิกที่พื้นหลัง - ระบุ target ที่ชัดเจน
     */
    $(document).on('click', '#users-modal', function(e) {
        if (e.target === this) {
            closeUserModal();
        }
    });
    
    /**
     * ฟอร์มสร้างบทบาทใหม่
     */
    $('#department-role-form').on('submit', function(e) {
        e.preventDefault();
        handleCreateRoleSubmission(e);
    });
    
    /**
     * ฟอร์มแก้ไขบทบาท - ใช้ delegation
     */
    $(document).on('submit', '#edit-role-form', function(e) {
        e.preventDefault();
        handleEditRoleSubmission(e);
    });
    
    /**
     * ปุ่มปิด Modal
     */
    $(document).on('click', '.cancel-btn', closeModal);
    
    /**
     * ปิด Modal เมื่อคลิกที่พื้นหลัง
     */
    $(document).on('click', '.modal', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    /**
     * ปิด Modal เมื่อกด ESC
     */
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('.modal-visible').length) {
            closeModal();
        }
    });
    
    /**
     * เลือกทุก checkbox ในกลุ่มเดียวกัน
     */
    $(document).on('change', '.select-all-permissions', function() {
        const isChecked = $(this).is(':checked');
        const container = $(this).closest('.permissions-container');
        container.find('input[type="checkbox"]').prop('checked', isChecked);
    });
    
    /**
     * สลับการแสดงส่วนของสิทธิ์ (พับ/กาง)
     */
    $(document).on('click', '.permissions-container h3', function() {
        $(this).closest('.permissions-container').toggleClass('collapsed');
    });
    
    /**
     * เลือกทั้งหมดในแถวเดียวกัน
     */
    $(document).on('change', '.select-all-row', function() {
        const isChecked = $(this).is(':checked');
        $(this).closest('.permission-item').find('input[type="checkbox"]').prop('checked', isChecked);
    });
    
    /**
     * กำหนดสิทธิ์ที่เกี่ยวข้องโดยอัตโนมัติ
     */
    $(document).on('change', 'input[name$="[edit]"], input[name$="[delete]"], input[name$="[write]"]', function() {
        if ($(this).is(':checked')) {
            const name = $(this).attr('name');
            if (name) {
                const readName = name.replace(/\[(edit|delete|write)\]$/, '[read]');
                $(`input[name="${readName}"]`).prop('checked', true);
            }
        }
    });
    
    /**
     * ยกเลิกสิทธิ์ที่เกี่ยวข้องโดยอัตโนมัติ
     */
    $(document).on('change', 'input[name$="[read]"]', function() {
        if (!$(this).is(':checked')) {
            const name = $(this).attr('name');
            if (name) {
                const baseName = name.replace(/\[read\]$/, '');
                $(`input[name="${baseName}[edit]"], input[name="${baseName}[delete]"], input[name="${baseName}[write]"]`).prop('checked', false);
            }
        }
    });
    
    // ========== Main Functions ==========
    
    /**
     * จัดการการส่งแบบฟอร์มสร้างบทบาทใหม่
     */
    function handleCreateRoleSubmission(e) {
        const name = $('#department_name').val();
        
        if (!name || !name.trim()) {
            showToast('กรุณาระบุชื่อบทบาท', 'error');
            return;
        }
        
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'create_department_role',
                department_name: name.trim(),
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                $(e.target).find('button').prop('disabled', true);
                $(e.target).find('.submit-btn').addClass('loading');
            },
            success: function(response) {
                if (response && response.success) {
                    showToast(response.data && response.data.message ? response.data.message : 'บันทึกข้อมูลสำเร็จ');
                    e.target.reset();
                    loadTableContent();
                } else {
                    showToast(response && response.data && response.data.message ? response.data.message : 'เกิดข้อผิดพลาด', 'error');
                }
            },
            error: function() {
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                $(e.target).find('button').prop('disabled', false);
                $(e.target).find('.submit-btn').removeClass('loading');
            }
        });
    }
    
    /**
     * จัดการการส่งแบบฟอร์มแก้ไขบทบาท
     */
    function handleEditRoleSubmission(e) {
        const oldRole = $('#original-role-name').val();
        const newRole = $('#edit-role-name').val();
        
        if (!newRole || !newRole.trim()) {
            showToast('กรุณาระบุชื่อบทบาท', 'error');
            return;
        }
        
        // เก็บข้อมูลสิทธิ์ต่างๆ
        const postTypePermissions = getPermissionsData('pt_perms');
        const fieldPermissions = getPermissionsData('field_perms');
        const fieldGroupPermissions = getPermissionsData('field_group_perms');
        const taxonomyPermissions = getPermissionsData('taxonomy_perms');

        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'edit_role',
                old_role: oldRole,
                new_role: newRole.trim(),
                post_type_permissions: postTypePermissions,
                field_permissions: fieldPermissions,
                field_group_permissions: fieldGroupPermissions,
                taxonomy_permissions: taxonomyPermissions,
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                $(e.target).find('button').prop('disabled', true);
                $(e.target).find('.save-btn').addClass('loading');
            },
            success: function(response) {
                if (response && response.success) {
                    closeModal();
                    showToast(response.data && response.data.message ? response.data.message : 'บันทึกข้อมูลสำเร็จ');
                    loadTableContent();
                } else {
                    showToast(response && response.data && response.data.message ? response.data.message : 'เกิดข้อผิดพลาด', 'error');
                }
            },
            error: function() {
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                $(e.target).find('button').prop('disabled', false);
                $(e.target).find('.save-btn').removeClass('loading');
            }
        });
    }
    
    /**
     * ดึงข้อมูลผู้ใช้ตามบทบาท
     */
    function showUsersByRole(role) {
        // สร้าง Modal สำหรับแสดงข้อมูลผู้ใช้ถ้ายังไม่มี
        createUserModalIfNeeded();
        
        // แสดง Modal และตั้งค่าเริ่มต้น
        $('#users-content').html('<div class="loading-indicator">กำลังโหลดข้อมูล...</div>');
        $('#users-modal').attr('aria-hidden', 'false').addClass('modal-visible');
        
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_users_by_role',
                role: role,
                nonce: departmentAjax.nonce
            },
            success: function(response) {
                if (response && response.success && response.data) {
                    $('#users-content').html(sanitizeHTML(response.data.html || ''));
                } else {
                    $('#users-content').html(`<div class="error-message">${sanitizeHTML(response.data && response.data.message ? response.data.message : departmentAjax.messages.generalError)}</div>`);
                    showToast(response.data && response.data.message ? response.data.message : departmentAjax.messages.generalError, 'error');
                }
            },
            error: function() {
                $('#users-content').html(`<div class="error-message">${sanitizeHTML(departmentAjax.messages.generalError)}</div>`);
                showToast(departmentAjax.messages.generalError, 'error');
            }
        });
    }
    
    /**
     * โหลดข้อมูลตารางบทบาท
     */
    function loadTableContent() {
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_roles_table',
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                tableWrapper.addClass('loading');
                tableWrapper.html('<div class="loading-indicator">กำลังโหลดข้อมูล...</div>');
            },
            success: function(response) {
                if (response && response.success && response.data) {
                    tableWrapper.html(sanitizeHTML(response.data.html || ''));
                    initializeTableEvents();
                } else {
                    tableWrapper.html('<div class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>');
                    showToast(response.data && response.data.message ? response.data.message : departmentAjax.messages.generalError, 'error');
                }
            },
            error: function() {
                tableWrapper.html('<div class="error-message">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</div>');
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                tableWrapper.removeClass('loading');
            }
        });
    }
    
    /**
     * โหลดข้อมูลสิทธิ์ทั้งหมดสำหรับบทบาท
     */
    function loadPermissions(roleName) {
        // ลบข้อมูลสิทธิ์เก่า
        $('#post-type-permissions-container, #field-permissions-container, #field-group-permissions-container, #taxonomy-permissions-container').remove();
        
        // แสดงสถานะการโหลด
        createLoadingIndicator();
        
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_post_type_permissions',
                role: roleName,
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                $('#edit-role-form').addClass('loading');
            },
            success: function(response) {
                if (response && response.success && response.data) {
                    // ลบสถานะการโหลด
                    $('#permissions-loading').remove();
                    
                    // สร้าง UI สำหรับแต่ละประเภทของสิทธิ์
                    if (response.data.postTypes) createPostTypesUI(response.data.postTypes);
                    if (response.data.fields) createFieldsUI(response.data.fields);
                    if (response.data.fieldGroups) createFieldGroupsUI(response.data.fieldGroups);
                    if (response.data.taxonomies) createTaxonomiesUI(response.data.taxonomies);
                    
                    // ตั้งค่าสีพื้นหลังสำหรับแต่ละแถว
                    alternateRowColors();
                } else {
                    $('#permissions-loading').html('<div class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์</div>');
                    showToast(response.data && response.data.message ? response.data.message : departmentAjax.messages.generalError, 'error');
                }
            },
            error: function() {
                $('#permissions-loading').html('<div class="error-message">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</div>');
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                $('#edit-role-form').removeClass('loading');
            }
        });
    }
    
    // ========== Helper Functions ==========
    
    /**
     * กำหนด Event สำหรับปุ่มในตาราง
     */
    function initializeTableEvents() {
        // ปุ่มแก้ไข - เปิด Modal
        $('.edit-role-btn').on('click', function() {
            const role = $(this).data('role');
            if (!role) return;
            
            // กรอกข้อมูลเดิมลงใน Modal
            $('#original-role-name').val(role);
            $('#edit-role-name').val(role);
            
            // โหลดข้อมูลสิทธิ์
            loadPermissions(role);
            
            // แสดง Modal
            $('#edit-role-modal').attr('aria-hidden', 'false').addClass('modal-visible');
        });

        // ปุ่มลบบทบาท
        $('.delete-role-btn').on('click', function() {
            const role = $(this).data('role');
            if (!role) return;
            
            if (confirm(departmentAjax.messages.confirmDelete)) {
                deleteRole(role);
            }
        });
    }
    
    /**
     * ลบบทบาท
     */
    function deleteRole(role) {
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_role',
                role: role,
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                $(`button[data-role="${sanitizeAttribute(role)}"]`).prop('disabled', true);
            },
            success: function(response) {
                if (response && response.success) {
                    showToast(response.data && response.data.message ? response.data.message : 'ลบบทบาทสำเร็จ');
                    loadTableContent();
                } else {
                    showToast(response.data && response.data.message ? response.data.message : 'เกิดข้อผิดพลาด', 'error');
                }
            },
            error: function() {
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                $(`button[data-role="${sanitizeAttribute(role)}"]`).prop('disabled', false);
            }
        });
    }
    
    /**
     * ปิด Modal แก้ไขบทบาท
     */
    function closeModal() {
        $('.modal')
            .attr('aria-hidden', 'true')
            .removeClass('modal-visible');
    }
    
    /**
     * ปิด Modal ผู้ใช้
     */
    function closeUserModal() {
        $('#users-modal')
            .attr('aria-hidden', 'true')
            .removeClass('modal-visible');
    }
    
    /**
     * เก็บข้อมูลสิทธิ์จาก checkboxes
     */
    function getPermissionsData(prefix) {
    const permissions = {};
    
    $(`input[name^="${prefix}"]`).each(function() {
        const inputName = $(this).attr('name');
        if (!inputName) return;
        
        // ใช้ regex ที่เฉพาะเจาะจงมากขึ้นและจำกัดการทำงาน
        // ตัวอักษรที่ไม่ใช่ [ หรือ ] ได้เท่านั้น
        const matches = inputName.match(/\[([^\[\]]+)\]\[([^\[\]]+)\]/);
        
        if (matches && matches.length === 3) {
            const itemName = matches[1];
            const permType = matches[2];
            
            if (!permissions[itemName]) {
                permissions[itemName] = {};
            }
            
            permissions[itemName][permType] = $(this).is(':checked');
        }
    });
    
    return permissions;
}
    
    /**
     * สร้าง Modal ข้อมูลผู้ใช้ถ้ายังไม่มี
     */
    function createUserModalIfNeeded() {
        if (!$('#users-modal').length) {
            const modalHtml = `
                <div id="users-modal" class="modal" aria-hidden="true">
                    <div class="modal-content">
                        <h2>ข้อมูลผู้ใช้</h2>
                        <div id="users-content">
                            <div class="loading-indicator">กำลังโหลดข้อมูล...</div>
                        </div>
                        <div class="form-group button-group">
                            <button type="button" class="close-btn">ปิด</button>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);
        }
    }
    
    /**
     * สร้างตัวแสดงสถานะการโหลดสำหรับข้อมูลสิทธิ์
     */
    function createLoadingIndicator() {
        const loadingHtml = '<div id="permissions-loading" class="loading-indicator">กำลังโหลดข้อมูลสิทธิ์...</div>';
        $('#edit-role-form .button-group').before(loadingHtml);
    }
    
    /**
     * สร้าง UI สำหรับ Post Types
     */
    function createPostTypesUI(postTypes) {
        if (!postTypes || Object.keys(postTypes).length === 0) return;
        
        let html = '<div id="post-type-permissions-container" class="permissions-container">';
        html += '<h3>กำหนดสิทธิ์สำหรับประเภทเนื้อหา</h3>';
        
        Object.keys(postTypes).forEach(function(postType) {
            const data = postTypes[postType];
            html += generatePermissionItemHtml(postType, data, 'pt_perms');
        });
        
        html += '</div>';
        $('#edit-role-form .button-group').before(html);
    }
    
    /**
     * สร้าง UI สำหรับ Fields
     */
    function createFieldsUI(fields) {
        if (!fields || Object.keys(fields).length === 0) return;
        
        let html = '<div id="field-permissions-container" class="permissions-container">';
        html += '<h3>กำหนดสิทธิ์สำหรับ Fields</h3>';
        
        Object.keys(fields).forEach(function(field) {
            const data = fields[field];
            html += generatePermissionItemHtml(field, data, 'field_perms');
        });
        
        html += '</div>';
        $('#edit-role-form .button-group').before(html);
    }
    
    /**
     * สร้าง UI สำหรับ Field Groups
     */
    function createFieldGroupsUI(fieldGroups) {
        if (!fieldGroups || Object.keys(fieldGroups).length === 0) return;
        
        let html = '<div id="field-group-permissions-container" class="permissions-container">';
        html += '<h3>กำหนดสิทธิ์สำหรับกลุ่มฟิลด์</h3>';
        
        Object.keys(fieldGroups).forEach(function(group) {
            const data = fieldGroups[group];
            html += generatePermissionItemHtml(group, data, 'field_group_perms');
        });
        
        html += '</div>';
        $('#edit-role-form .button-group').before(html);
    }
    
    /**
     * สร้าง UI สำหรับ Taxonomies
     */
    function createTaxonomiesUI(taxonomies) {
        if (!taxonomies || Object.keys(taxonomies).length === 0) return;
        
        let html = '<div id="taxonomy-permissions-container" class="permissions-container">';
        html += '<h3>กำหนดสิทธิ์สำหรับ Taxonomies</h3>';
        
        Object.keys(taxonomies).forEach(function(taxonomy) {
            const data = taxonomies[taxonomy];
            html += generatePermissionItemHtml(taxonomy, data, 'taxonomy_perms');
        });
        
        html += '</div>';
        $('#edit-role-form .button-group').before(html);
    }
    
    /**
     * สร้าง HTML สำหรับรายการสิทธิ์
     */
    function generatePermissionItemHtml(key, data, prefix) {
        const safeKey = sanitizeAttribute(key);
        const safeLabel = sanitizeHTML(data.label || key);
        
        return `
            <div class="permission-item">
                <h4>${safeLabel}</h4>
                <div class="permission-options">
                    <label>
                        <input type="checkbox" name="${prefix}[${safeKey}][read]" ${data.permissions.read ? 'checked' : ''}>
                        <span>อ่าน</span>
                    </label>
                    <label>
                        <input type="checkbox" name="${prefix}[${safeKey}][edit]" ${data.permissions.edit ? 'checked' : ''}>
                        <span>แก้ไข</span>
                    </label>
                    <label>
                        <input type="checkbox" name="${prefix}[${safeKey}][delete]" ${data.permissions.delete ? 'checked' : ''}>
                        <span>ลบ</span>
                    </label>
                    <label>
                        <input type="checkbox" name="${prefix}[${safeKey}][write]" ${data.permissions.write ? 'checked' : ''}>
                        <span>เขียน</span>
                    </label>
                </div>
            </div>
        `;
    }
    
    /**
     * แสดง Toast notification
     */
    let toastTimeout;
    function showToast(message, type = 'success') {
        if (!message) return;
        
        if (!$('#toast').length) {
            $('body').append('<div id="toast" class="toast" aria-hidden="true"></div>');
        }
        
        const toast = $('#toast');
        clearTimeout(toastTimeout);
        
        toast.text(sanitizeHTML(message))
            .removeClass('toast-success toast-error')
            .addClass(`toast-${type} toast-visible`)
            .attr('aria-hidden', 'false');

        toastTimeout = setTimeout(() => {
            toast.removeClass('toast-visible')
                .attr('aria-hidden', 'true');
        }, 3000);
    }
    
    /**
     * ตั้งค่าสีพื้นหลังสำหรับแต่ละแถวเพื่อให้อ่านง่ายขึ้น
     */
    function alternateRowColors() {
        $('.permission-item:odd').addClass('alternate');
    }
    
    /**
     * Sanitize HTML เพื่อความปลอดภัย
     */
    function sanitizeHTML(html) {
        // หมายเหตุ: ในการใช้งานจริง ควรใช้ไลบรารีหรือฟังก์ชัน sanitize ที่แข็งแกร่งกว่านี้
        // เช่น DOMPurify หรือ sanitize-html
        if (!html || typeof html !== 'string') return '';
        
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Sanitize ค่าสำหรับใช้ใน attribute
     */
    function sanitizeAttribute(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/[^\w\-]/g, '');
    }
    
    // ========== Initialization ==========
    
    // โหลดข้อมูลตารางเมื่อเริ่มต้น
    if (tableWrapper.length) {
        loadTableContent();
    }
});
