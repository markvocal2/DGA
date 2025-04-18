/**
 * JavaScript สำหรับหน้ากำหนดสิทธิ์พิเศษ
 * ไฟล์นี้ควรบันทึกไว้ที่ child-theme/js/special-permissions.js
 */
jQuery(document).ready(function($) {
    // เปลี่ยนการแสดงฟอร์มตามตัวเลือกที่เลือก
    $('input[name="action_type"]').on('change', function() {
        var selectedValue = $('input[name="action_type"]:checked').val();
        
        if (selectedValue === 'create_new_role') {
            $('.special-permissions-existing-role').hide();
            $('.special-permissions-new-role').fadeIn();
        } else {
            $('.special-permissions-new-role').hide();
            $('.special-permissions-existing-role').fadeIn();
        }
    });
    
    // ตรวจสอบข้อมูลก่อนส่งฟอร์ม
    $('form').on('submit', function(e) {
        var selectedValue = $('input[name="action_type"]:checked').val();
        
        if (selectedValue === 'assign_to_existing') {
            var roleSelected = $('#role-name-select').val();
            if (!roleSelected) {
                e.preventDefault();
                alert('กรุณาเลือก Role ที่ต้องการกำหนดสิทธิ์');
                return false;
            }
        } else if (selectedValue === 'create_new_role') {
            var newRoleName = $('#new-role-name').val();
            var newRoleDisplay = $('#new-role-display').val();
            
            if (!newRoleName || !newRoleDisplay) {
                e.preventDefault();
                alert('กรุณากรอกข้อมูล Role ใหม่ให้ครบถ้วน');
                return false;
            }
            
            // ตรวจสอบรูปแบบ Role Name (slug)
            if (!/^[a-z0-9_]+$/.test(newRoleName)) {
                e.preventDefault();
                alert('Role Name ต้องประกอบด้วยตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และเครื่องหมายขีดล่างเท่านั้น');
                return false;
            }
        }
    });
    
    // เพิ่มเอฟเฟกต์เมื่อเลือก Role
    $('#role-name-select').on('change', function() {
        if ($(this).val()) {
            $(this).addClass('selected');
        } else {
            $(this).removeClass('selected');
        }
    });
});