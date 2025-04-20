/**
 * JavaScript สำหรับ Welcome User Widget
 */
jQuery(document).ready(function($) {

    // Cache frequently used selectors
    const $guestButtons = $('.guest-user-buttons');
    const $loginFormContainer = $('.login-form-container');
    const $loginForm = $('#ajax-login-form');
    const $loginUsername = $('#login-username');
    const $loginPassword = $('#login-password');
    const $loginMessage = $('.login-message');

    // --- Logout Handler ---
    // จัดการการคลิกปุ่มออกจากระบบ (สำหรับผู้ใช้ที่ล็อกอินแล้ว)
    $('#welcome-user-logout-btn').on('click', (e) => { // Use arrow function
        e.preventDefault();

        // สร้างตัวแปรเก็บ URL ปัจจุบัน (ใช้ const เพราะกำหนดค่าครั้งเดียว)
        const currentURL = window.location.href;

        // Add visual feedback (optional)
        $(e.currentTarget).text('กำลังออกจากระบบ...').prop('disabled', true);

        // ส่ง AJAX request เพื่อออกจากระบบ
        $.ajax({
            type: 'POST',
            url: welcome_user_widget_ajax.ajax_url, // Ensure this object is available
            data: {
                action: 'welcome_user_logout',
                nonce: welcome_user_widget_ajax.logout_nonce // Ensure nonce is correct
            },
            dataType: 'json', // Expect a JSON response from WordPress AJAX
            timeout: 8000, // Increase timeout slightly
            // success/error are less critical here as we always reload
            // success: (response) => {
            //     console.log('Logout successful:', response);
            // },
            // error: (jqXHR, textStatus, errorThrown) => {
            //     console.error('AJAX error during logout:', textStatus, errorThrown);
            // },
            complete: () => { // Use complete callback to ensure reload happens once
                // รีโหลดหน้าปัจจุบันเสมอหลังจาก AJAX request เสร็จสิ้น (สำเร็จหรือล้มเหลว)
                // Using href assignment might be slightly cleaner than reload()
                window.location.href = currentURL;
                // Failsafe reload in case href assignment doesn't work immediately in some browsers
                // setTimeout(() => { window.location.reload(); }, 100);
            }
        });

        // Removed the potentially problematic setTimeout reload here
        // The 'complete' callback is more reliable.
    });

    // --- Login Trigger ---
    // จัดการการคลิกปุ่ม "ลงชื่อเข้าใช้งาน" (สำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน)
    $('#login-trigger-btn').on('click', (e) => { // Use arrow function
        e.preventDefault();

        // ซ่อนปุ่มทั้งหมดใน guest-user-buttons
        $guestButtons.hide();

        // แสดงฟอร์มล็อกอิน
        $loginFormContainer.fadeIn(200);

        // โฟกัสที่ช่องกรอกชื่อผู้ใช้
        // Use setTimeout to ensure focus happens after fadeIn completes
        setTimeout(() => {
             $loginUsername.focus();
        }, 210);
    });

    // --- Login Form Submission ---
    // จัดการการส่งฟอร์มล็อกอิน
    $loginForm.on('submit', (e) => { // Use arrow function
        e.preventDefault();

        // เก็บข้อมูลจากฟอร์ม (ใช้ const)
        const username = $loginUsername.val();
        const password = $loginPassword.val();

        // Basic validation (optional but recommended)
        if (!username || !password) {
             $loginMessage
                .removeClass('success')
                .addClass('error')
                .text('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
                .show();
             return;
        }

        // แสดงข้อความกำลังประมวลผล และ disable form elements
        $loginMessage
            .removeClass('error success')
            .text('กำลังเข้าสู่ระบบ...')
            .show();
        $loginForm.find('input, button').prop('disabled', true);

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
            dataType: 'json', // Expect JSON response
            success: (response) => { // Use arrow function
                if (response && response.success) {
                    // แสดงข้อความสำเร็จ
                    $loginMessage
                        .removeClass('error')
                        .addClass('success')
                        .text(response.data?.message || 'เข้าสู่ระบบสำเร็จ กำลังรีเฟรช...'); // Use optional chaining and default text

                    // รีโหลดหน้าหลังจากล็อกอินสำเร็จ
                    setTimeout(() => {
                        // ใช้ window.location.href เพื่อลบ hash (ถ้ามี) และรีโหลด
                        window.location.href = window.location.href.split('#')[0];
                    }, 1000); // Delay for user to see the message
                } else {
                    // แสดงข้อความผิดพลาด
                    $loginMessage
                        .removeClass('success')
                        .addClass('error')
                        .text(response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); // Use optional chaining and default text
                    // Re-enable form on error
                    $loginForm.find('input, button').prop('disabled', false);
                     $loginPassword.val(''); // Clear password field on error
                     $loginUsername.select().focus(); // Focus username again
                }
            },
            error: (jqXHR, textStatus, errorThrown) => { // Use arrow function
                console.error("Login AJAX Error:", textStatus, errorThrown);
                // แสดงข้อความผิดพลาดกรณีเกิดปัญหาการเชื่อมต่อ
                $loginMessage
                    .removeClass('success')
                    .addClass('error')
                    .text('เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้งภายหลัง');
                // Re-enable form on error
                $loginForm.find('input, button').prop('disabled', false);
            }
        });
    });

    // --- Close Login Form on Outside Click ---
    // ปิดฟอร์มล็อกอินเมื่อคลิกนอกพื้นที่ฟอร์ม
    $(document).on('click', (e) => { // Use arrow function
        // Check if the click is outside the form container AND outside the trigger button
        if (
            !$(e.target).closest($loginFormContainer).length &&
            !$(e.target).closest('#login-trigger-btn').length &&
            $loginFormContainer.is(':visible')
        ) {
            // ซ่อนฟอร์มล็อกอิน
            $loginFormContainer.hide();
            $loginMessage.hide().text(''); // Hide and clear message
            $loginForm.find('input, button').prop('disabled', false); // Ensure form is enabled

            // แสดงปุ่มทั้งหมดของผู้ใช้ที่ยังไม่ได้ล็อกอิน
            $guestButtons.show();
        }
    });
});
