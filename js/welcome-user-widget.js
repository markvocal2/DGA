/**
 * JavaScript สำหรับ Welcome User Widget
 */


jQuery(document).ready(function($) {
    // จัดการการคลิกปุ่มออกจากระบบ (สำหรับผู้ใช้ที่ล็อกอินแล้ว)
    $('#welcome-user-logout-btn').on('click', function(e) {
        e.preventDefault();
        
        // สร้างตัวแปรเก็บ URL ปัจจุบัน
        var currentURL = window.location.href;
        
        // ส่ง AJAX request เพื่อออกจากระบบ
        $.ajax({
            type: 'POST',
            url: welcome_user_widget_ajax.ajax_url,
            data: {
                action: 'welcome_user_logout',
                nonce: welcome_user_widget_ajax.logout_nonce
            },
            success: function(response) {
                // รีโหลดหน้าปัจจุบันไม่ว่าจะได้ response อะไรกลับมา
                window.location.href = currentURL;
            },
            error: function() {
                // กรณีมี error ก็ให้รีโหลดหน้าเว็บเช่นกัน
                console.log('AJAX error occurred during logout. Reloading page anyway.');
                window.location.href = currentURL;
            },
            // เพิ่ม timeout เพื่อป้องกันการรอนานเกินไป
            timeout: 5000
        });
        
        // เพิ่มการรีโหลดหน้าเว็บหลังจาก timeout (เผื่อกรณี AJAX มีปัญหา)
        setTimeout(function() {
            window.location.href = currentURL;
        }, 2000);
    });
    
    // จัดการการคลิกปุ่ม "ลงชื่อเข้าใช้งาน" (สำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน)
    $('#login-trigger-btn').on('click', function(e) {
        e.preventDefault();
        
        // ซ่อนปุ่มทั้งหมดใน guest-user-buttons
        $('.guest-user-buttons').hide();
        
        // แสดงฟอร์มล็อกอิน
        $('.login-form-container').fadeIn(200);
        
        // โฟกัสที่ช่องกรอกชื่อผู้ใช้
        $('#login-username').focus();
    });
    
    // จัดการการส่งฟอร์มล็อกอิน
    $('#ajax-login-form').on('submit', function(e) {
        e.preventDefault();
        
        // เก็บข้อมูลจากฟอร์ม
        var username = $('#login-username').val();
        var password = $('#login-password').val();
        
        // แสดงข้อความกำลังประมวลผล
        $('.login-message')
            .removeClass('error success')
            .text('กำลังเข้าสู่ระบบ...')
            .show();
        
        // ส่ง AJAX request เพื่อล็อกอิน
        $.ajax({
            type: 'POST',
            url: welcome_user_widget_ajax.ajax_url,
            data: {
                action: 'welcome_user_login',
                username: username,
                password: password,
                nonce: welcome_user_widget_ajax.login_nonce
            },
            success: function(response) {
                if (response.success) {
                    // แสดงข้อความสำเร็จ
                    $('.login-message')
                        .removeClass('error')
                        .addClass('success')
                        .text(response.data.message);
                    
                    // รีโหลดหน้าหลังจากล็อกอินสำเร็จ โดยเปลี่ยนเป็นการ redirect แทน
                    setTimeout(function() {
                        // ใช้ window.location.href แทน window.location.reload()
                        window.location.href = window.location.href.split('#')[0];
                    }, 1000);
                } else {
                    // แสดงข้อความผิดพลาด
                    $('.login-message')
                        .removeClass('success')
                        .addClass('error')
                        .text(response.data.message);
                }
            },
            error: function() {
                // แสดงข้อความผิดพลาดกรณีเกิดปัญหาการเชื่อมต่อ
                $('.login-message')
                    .removeClass('success')
                    .addClass('error')
                    .text('เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้งภายหลัง');
            }
        });
    });
    
    // ปิดฟอร์มล็อกอินเมื่อคลิกนอกพื้นที่ฟอร์ม
    $(document).on('click', function(e) {
        if (
            !$(e.target).closest('#ajax-login-form').length && 
            !$(e.target).closest('#login-trigger-btn').length && 
            $('.login-form-container').is(':visible')
        ) {
            // ซ่อนฟอร์มล็อกอิน
            $('.login-form-container').hide();
            
            // แสดงปุ่มทั้งหมดของผู้ใช้ที่ยังไม่ได้ล็อกอิน
            $('.guest-user-buttons').show();
        }
    });
});