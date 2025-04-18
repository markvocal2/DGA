jQuery(document).ready(function($) {
    // ตรวจสอบว่ามีฟอร์มล็อกอินในหน้านี้หรือไม่
    if ($('#modern-login-form').length === 0) {
        return; // ถ้าไม่มีฟอร์ม ออกจากสคริปต์โดยไม่ทำงาน
    }
    
    let currentUsername = '';
    
    // Initialize form
    initializeForm();
    
    function initializeForm() {
        // ตรวจสอบและตั้งค่าขั้นตอนเริ่มต้น
        goToStep(1);
        
        // ถ้ามีการจดจำชื่อผู้ใช้ในครั้งก่อนหน้า
        if (localStorage.getItem('remember_username')) {
            $('#username').val(localStorage.getItem('remember_username'));
            $('.input-group').addClass('focused');
        }
        
        // เพิ่ม animation effect เมื่อกรอกข้อมูล
        $('.input-group input').each(function() {
            if ($(this).val().trim() !== '') {
                $(this).closest('.input-group').addClass('focused');
            }
        });
    }
    
    // Handle Enter key press
    $('#username').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('.next-step-button').click();
        }
    });

    $('#password').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            $('.login-button').click();
        }
    });

    // Step navigation - ไปยังขั้นตอนถัดไป
    $('.next-step-button').on('click', function() {
        const username = $('#username').val().trim();
        if (!username) {
            showError('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
            return;
        }

        // Check if username exists via AJAX
        $.ajax({
            url: modernLoginAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'check_username',
                security: modernLoginAjax.security,
                username: username
            },
            success: function(response) {
                if (response.success) {
                    currentUsername = username;
                    goToStep(2);
                    $('.username-display').text(username);
                } else {
                    showError('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
                }
            },
            error: function() {
                showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    });

    // Change user button - กลับไปยังขั้นตอนแรก
    $('.change-user').on('click', function() {
        goToStep(1);
    });

    // ฟังก์ชันควบคุมการแสดงขั้นตอน
    function goToStep(step) {
        // ซ่อนทุกขั้นตอนก่อน
        $('.step-content').hide();
        
        // แสดงขั้นตอนที่ต้องการ
        $(`.step-content[data-step="${step}"]`).fadeIn(300);
        
        // อัพเดท step indicators ถ้ามี
        if ($('.step-indicator').length > 0) {
            $('.step').removeClass('active completed');
            
            // กำหนดขั้นตอนปัจจุบันเป็น active
            $(`.step[data-step="${step}"]`).addClass('active');
            
            // ทำเครื่องหมาย completed สำหรับขั้นตอนก่อนหน้า
            for (let i = 1; i < step; i++) {
                $(`.step[data-step="${i}"]`).addClass('completed');
            }
        }

        // ล้างข้อความแจ้งเตือนเก่า
        $('.login-message').removeClass('error success').hide();
    }

    // Toggle password visibility
    $('.toggle-password').on('click', function() {
        const passwordInput = $(this).closest('.input-group').find('input');
        const icon = $(this).find('i');
        
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Handle form submission
    $('#modern-login-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const submitButton = form.find('.login-button');
        const loader = submitButton.find('.loader');
        
        // Disable form and show loader
        submitButton.prop('disabled', true);
        submitButton.find('span').css('opacity', '0');
        loader.css('display', 'block');

        // Collect form data
        const formData = {
            action: 'modern_login',
            security: modernLoginAjax.security,
            username: currentUsername,
            password: form.find('#password').val(),
            remember: form.find('#remember').is(':checked')
        };

        // Send AJAX request
        $.ajax({
            url: modernLoginAjax.ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showSuccess(response.data.message);
                    
                    // Redirect after success message
                    setTimeout(function() {
                        window.location.href = response.data.redirect_url;
                    }, 1500);
                } else {
                    showError(response.data.message);
                    resetSubmitButton();
                }
            },
            error: function() {
                showError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
                resetSubmitButton();
            }
        });
    });

    // แสดงข้อความแจ้งเตือนข้อผิดพลาด
    function showError(message) {
        $('.login-message')
            .removeClass('success')
            .addClass('error')
            .html(message)
            .fadeIn();
    }

    // แสดงข้อความแจ้งเตือนสำเร็จ
    function showSuccess(message) {
        $('.login-message')
            .removeClass('error')
            .addClass('success')
            .html(message)
            .fadeIn();
    }

    // รีเซ็ตปุ่มส่งฟอร์ม
    function resetSubmitButton() {
        const submitButton = $('.login-button');
        submitButton.prop('disabled', false);
        submitButton.find('span').css('opacity', '1');
        submitButton.find('.loader').css('display', 'none');
    }

    // Input animation effects
    $('.input-group input').on('focus', function() {
        $(this).closest('.input-group').addClass('focused');
    }).on('blur', function() {
        if (!$(this).val()) {
            $(this).closest('.input-group').removeClass('focused');
        }
    });

    // จัดการการจดจำชื่อผู้ใช้
    $('#modern-login-form').on('submit', function() {
        if ($('#remember').is(':checked')) {
            localStorage.setItem('remember_username', currentUsername);
        } else {
            localStorage.removeItem('remember_username');
        }
    });
});