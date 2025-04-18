/**
 * Department Role Manager - JavaScript
 * จัดการบทบาทและสิทธิ์ของแผนกต่างๆ ใน WordPress
 * เวอร์ชัน: 1.0.1
 */
jQuery(document).ready(function($) {
    // ตัวแปรหลัก
    const tableWrapper = $('.roles-table-wrapper');
    let updateTimer = null;

    /**
 * กำหนด Event สำหรับปุ่มดูผู้ใช้
 */
$(document).on('click', '.view-users-btn', function() {
    const role = $(this).data('role');
    showUsersByRole(role);
});

/**
 * ดึงข้อมูลผู้ใช้ตามบทบาท
 */
function showUsersByRole(role) {
    $.ajax({
        url: departmentAjax.ajaxurl,
        type: 'POST',
        data: {
            action: 'get_users_by_role',
            role: role,
            nonce: departmentAjax.nonce
        },
        beforeSend: function() {
            // สร้าง Modal สำหรับแสดงข้อมูลผู้ใช้
            if (!$('#users-modal').length) {
                $('body').append(`
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
                `);
            }
            
            $('#users-content').html('<div class="loading-indicator">กำลังโหลดข้อมูล...</div>');
            $('#users-modal').attr('aria-hidden', 'false').addClass('modal-visible');
        },
        success: function(response) {
            if (response.success) {
                $('#users-content').html(response.data.html);
            } else {
                $('#users-content').html(`<div class="error-message">${response.data.message || departmentAjax.messages.generalError}</div>`);
                showToast(response.data.message || departmentAjax.messages.generalError, 'error');
            }
        },
        error: function() {
            $('#users-content').html(`<div class="error-message">${departmentAjax.messages.generalError}</div>`);
            showToast(departmentAjax.messages.generalError, 'error');
        }
    });
}

/**
 * ปุ่มปิด Modal ผู้ใช้
 */
$(document).on('click', '#users-modal .close-btn', function() {
    $('#users-modal')
        .attr('aria-hidden', 'true')
        .removeClass('modal-visible');
});

/**
 * ปิด Modal เมื่อคลิกที่พื้นหลัง
 */
$(document).on('click', '#users-modal', function(e) {
    if ($(e.target).is('#users-modal')) {
        $('#users-modal')
            .attr('aria-hidden', 'true')
            .removeClass('modal-visible');
    }
});
    
    // ========== ฟังก์ชั่นโหลดข้อมูล ==========
    
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
                if (response.success) {
                    tableWrapper.html(response.data.html);
                    initializeTableEvents();
                } else {
                    tableWrapper.html('<div class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>');
                    showToast(response.data.message || departmentAjax.messages.generalError, 'error');
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
    
    // โหลดข้อมูลตารางเมื่อเริ่มต้น
    if (tableWrapper.length) {
        loadTableContent();
    }
    
    /**
     * โหลดข้อมูลสิทธิ์ทั้งหมดสำหรับบทบาท
     */
    function loadPermissions(roleName) {
        // ลบข้อมูลสิทธิ์เก่า
        $('#post-type-permissions-container, #field-permissions-container, #field-group-permissions-container, #taxonomy-permissions-container').remove();
        
        // แสดงสถานะการโหลด
        const loadingHtml = '<div id="permissions-loading" class="loading-indicator">กำลังโหลดข้อมูลสิทธิ์...</div>';
        $('#edit-role-form .button-group').before(loadingHtml);
        
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
                if (response.success) {
                    // ลบสถานะการโหลด
                    $('#permissions-loading').remove();
                    
                    // สร้าง UI สำหรับแต่ละประเภทของสิทธิ์
                    createPostTypesUI(response.data.postTypes);
                    createFieldsUI(response.data.fields);
                    createFieldGroupsUI(response.data.fieldGroups);
                    createTaxonomiesUI(response.data.taxonomies);
                } else {
                    $('#permissions-loading').html('<div class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์</div>');
                    showToast(response.data.message || departmentAjax.messages.generalError, 'error');
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
    
    // ========== ฟังก์ชั่นสร้าง UI ==========
    
    /**
     * สร้าง UI สำหรับ Post Types
     */
    function createPostTypesUI(postTypes) {
        if (!postTypes || Object.keys(postTypes).length === 0) return;
        
        let html = '<div id="post-type-permissions-container" class="permissions-container">';
        html += '<h3>กำหนดสิทธิ์สำหรับประเภทเนื้อหา</h3>';
        
        $.each(postTypes, function(postType, data) {
            html += `
                <div class="permission-item">
                    <h4>${data.label || postType}</h4>
                    <div class="permission-options">
                        <label>
                            <input type="checkbox" name="pt_perms[${postType}][read]" ${data.permissions.read ? 'checked' : ''}>
                            <span>อ่าน</span>
                        </label>
                        <label>
                            <input type="checkbox" name="pt_perms[${postType}][edit]" ${data.permissions.edit ? 'checked' : ''}>
                            <span>แก้ไข</span>
                        </label>
                        <label>
                            <input type="checkbox" name="pt_perms[${postType}][delete]" ${data.permissions.delete ? 'checked' : ''}>
                            <span>ลบ</span>
                        </label>
                        <label>
                            <input type="checkbox" name="pt_perms[${postType}][write]" ${data.permissions.write ? 'checked' : ''}>
                            <span>เขียน</span>
                        </label>
                    </div>
                </div>
            `;
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
        
        $.each(fields, function(field, data) {
            html += `
                <div class="permission-item">
                    <h4>${data.label || field}</h4>
                    <div class="permission-options">
                        <label>
                            <input type="checkbox" name="field_perms[${field}][read]" ${data.permissions.read ? 'checked' : ''}>
                            <span>อ่าน</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_perms[${field}][edit]" ${data.permissions.edit ? 'checked' : ''}>
                            <span>แก้ไข</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_perms[${field}][delete]" ${data.permissions.delete ? 'checked' : ''}>
                            <span>ลบ</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_perms[${field}][write]" ${data.permissions.write ? 'checked' : ''}>
                            <span>เขียน</span>
                        </label>
                    </div>
                </div>
            `;
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
        
        $.each(fieldGroups, function(group, data) {
            html += `
                <div class="permission-item">
                    <h4>${data.label || group}</h4>
                    <div class="permission-options">
                        <label>
                            <input type="checkbox" name="field_group_perms[${group}][read]" ${data.permissions.read ? 'checked' : ''}>
                            <span>อ่าน</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_group_perms[${group}][edit]" ${data.permissions.edit ? 'checked' : ''}>
                            <span>แก้ไข</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_group_perms[${group}][delete]" ${data.permissions.delete ? 'checked' : ''}>
                            <span>ลบ</span>
                        </label>
                        <label>
                            <input type="checkbox" name="field_group_perms[${group}][write]" ${data.permissions.write ? 'checked' : ''}>
                            <span>เขียน</span>
                        </label>
                    </div>
                </div>
            `;
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
        
        $.each(taxonomies, function(taxonomy, data) {
            html += `
                <div class="permission-item">
                    <h4>${data.label || taxonomy}</h4>
                    <div class="permission-options">
                        <label>
                            <input type="checkbox" name="taxonomy_perms[${taxonomy}][read]" ${data.permissions.read ? 'checked' : ''}>
                            <span>อ่าน</span>
                        </label>
                        <label>
                            <input type="checkbox" name="taxonomy_perms[${taxonomy}][edit]" ${data.permissions.edit ? 'checked' : ''}>
                            <span>แก้ไข</span>
                        </label>
                        <label>
                            <input type="checkbox" name="taxonomy_perms[${taxonomy}][delete]" ${data.permissions.delete ? 'checked' : ''}>
                            <span>ลบ</span>
                        </label>
                        <label>
                            <input type="checkbox" name="taxonomy_perms[${taxonomy}][write]" ${data.permissions.write ? 'checked' : ''}>
                            <span>เขียน</span>
                        </label>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        $('#edit-role-form .button-group').before(html);
    }
    
    // ========== ฟังก์ชั่นจัดการเหตุการณ์ ==========
    
    /**
     * กำหนด Event สำหรับปุ่มในตาราง
     */
    function initializeTableEvents() {
        // ปุ่มแก้ไข - เปิด Modal
        $('.edit-role-btn').on('click', function() {
            const role = $(this).data('role');
            
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
            if (confirm(departmentAjax.messages.confirmDelete)) {
                const role = $(this).data('role');
                deleteRole(role);
            }
        });
    }
    
    /**
     * ฟอร์มสร้างบทบาทใหม่
     */
    $('#department-role-form').on('submit', function(e) {
        e.preventDefault();
        const name = $('#department_name').val();
        
        if (!name.trim()) {
            showToast('กรุณาระบุชื่อบทบาท', 'error');
            return;
        }
        
        $.ajax({
            url: departmentAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'create_department_role',
                department_name: name,
                nonce: departmentAjax.nonce
            },
            beforeSend: function() {
                $(e.target).find('button').prop('disabled', true);
                $(e.target).find('.submit-btn').addClass('loading');
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message);
                    e.target.reset();
                    loadTableContent();
                } else {
                    showToast(response.data.message, 'error');
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
    });
    
    /**
     * ฟอร์มแก้ไขบทบาท
     */
    $(document).on('submit', '#edit-role-form', function(e) {
        e.preventDefault();
        const oldRole = $('#original-role-name').val();
        const newRole = $('#edit-role-name').val();
        
        if (!newRole.trim()) {
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
                new_role: newRole,
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
                if (response.success) {
                    closeModal();
                    showToast(response.data.message);
                    loadTableContent();
                } else {
                    showToast(response.data.message, 'error');
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
    });
    
    /**
     * ปุ่มปิด Modal
     */
    $(document).on('click', '.cancel-btn', closeModal);
    
    /**
     * ปิด Modal เมื่อคลิกที่พื้นหลัง
     */
    $(document).on('click', '.modal', function(e) {
        if ($(e.target).is('.modal')) {
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
    
    // ========== ฟังก์ชั่นช่วย ==========
    
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
                $(`button[data-role="${role}"]`).prop('disabled', true);
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message);
                    loadTableContent();
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast(departmentAjax.messages.generalError, 'error');
            },
            complete: function() {
                $(`button[data-role="${role}"]`).prop('disabled', false);
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
     * เก็บข้อมูลสิทธิ์จาก checkboxes
     */
    function getPermissionsData(prefix) {
        const permissions = {};
        
        $(`input[name^="${prefix}"]`).each(function() {
            const inputName = $(this).attr('name');
            const matches = inputName.match(/\[(.*?)\]\[(.*?)\]/);
            
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
     * แสดง Toast notification
     */
    let toastTimeout;
    function showToast(message, type = 'success') {
        if (!$('#toast').length) {
            $('body').append('<div id="toast" class="toast" aria-hidden="true"></div>');
        }
        
        const toast = $('#toast');
        clearTimeout(toastTimeout);
        
        toast.text(message)
            .removeClass('toast-success toast-error')
            .addClass(`toast-${type} toast-visible`)
            .attr('aria-hidden', 'false');

        toastTimeout = setTimeout(() => {
            toast.removeClass('toast-visible')
                .attr('aria-hidden', 'true');
        }, 3000);
    }
    
    // ========== ฟังก์ชั่นปรับปรุง UX ==========
    
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
     * เช่น ถ้าเลือก "แก้ไข" ให้เลือก "อ่าน" ด้วย
     */
    $(document).on('change', 'input[name$="[edit]"], input[name$="[delete]"], input[name$="[write]"]', function() {
        if ($(this).is(':checked')) {
            // ถ้าเลือก แก้ไข/ลบ/เขียน ให้เลือก "อ่าน" ด้วย
            const name = $(this).attr('name');
            const readName = name.replace(/\[(edit|delete|write)\]$/, '[read]');
            $(`input[name="${readName}"]`).prop('checked', true);
        }
    });
    
    /**
     * ยกเลิกสิทธิ์ที่เกี่ยวข้องโดยอัตโนมัติ
     * เช่น ถ้ายกเลิก "อ่าน" ให้ยกเลิก "แก้ไข", "ลบ", "เขียน" ด้วย
     */
    $(document).on('change', 'input[name$="[read]"]', function() {
        if (!$(this).is(':checked')) {
            const name = $(this).attr('name');
            const baseName = name.replace(/\[read\]$/, '');
            $(`input[name="${baseName}[edit]"], input[name="${baseName}[delete]"], input[name="${baseName}[write]"]`).prop('checked', false);
        }
    });
    
    /**
     * ตั้งค่าสีพื้นหลังสำหรับแต่ละแถวเพื่อให้อ่านง่ายขึ้น
     */
    function alternateRowColors() {
        $('.permission-item:odd').addClass('alternate');
    }
    
    // ตั้งค่าสีพื้นหลังสำหรับแต่ละแถวเมื่อโหลดข้อมูลสิทธิ์เสร็จ
    $(document).ajaxComplete(function() {
        alternateRowColors();
    });
});