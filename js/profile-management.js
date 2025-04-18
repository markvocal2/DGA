// /js/profile-management.js
jQuery(document).ready(function($) {
    // Cache DOM elements
    const profileForm = $('#profile-editor-form');
    const passwordForm = $('#password-reset-form');
    const toast = $('#toast-notification');
    const avatarUpload = $('#avatar-upload');
    const avatarPreview = $('#profile-avatar-preview');
    const resetPasswordBtn = $('#reset-password-button');
    const passwordResetModal = $('#password-reset-modal');
    const logoutConfirmModal = $('#logout-confirm-modal');
    
    // Show toast notification
    function showToast(message, type = 'success') {
        toast.text(message)
            .removeClass('success error')
            .addClass(type)
            .addClass('show');
            
        setTimeout(() => {
            toast.removeClass('show');
        }, 3000);
    }
    
    // Handle modal visibility
    function showModal(modal) {
        modal.addClass('show');
        $('body').addClass('modal-open');
    }
    
    function hideModal(modal) {
        modal.removeClass('show');
        $('body').removeClass('modal-open');
    }
    
    function hideAllModals() {
        $('.modal').removeClass('show');
        $('body').removeClass('modal-open');
    }
    
    // Modal event listeners
    resetPasswordBtn.on('click', function() {
        showModal(passwordResetModal);
        $('#new-password').focus();
    });
    
    $('.modal-close, .modal-overlay').on('click', function() {
        hideAllModals();
    });
    
    $('.modal-container').on('click', function(e) {
        e.stopPropagation();
    });
    
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
    
    // Handle avatar upload preview
    avatarUpload.on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showToast('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น (.jpg, .png, .gif)', 'error');
                avatarUpload.val('');
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showToast('ขนาดไฟล์ต้องไม่เกิน 2MB', 'error');
                avatarUpload.val('');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle profile form submission
    profileForm.on('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('action', 'update_profile');
        formData.append('nonce', profileAjax.nonce);
        formData.append('first_name', $('#first-name').val());
        formData.append('last_name', $('#last-name').val());
        
        // Append avatar file if selected
        const avatarFile = avatarUpload[0].files[0];
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        // Show loading state
        const submitBtn = profileForm.find('button[type="submit"]');
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        $.ajax({
            url: profileAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message);
                    if (response.data.avatar_url) {
                        avatarPreview.attr('src', response.data.avatar_url);
                    }
                    avatarUpload.val('');
                } else {
                    showToast(response.data || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                }
            },
            error: function() {
                showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Handle password reset form
    passwordForm.on('submit', function(e) {
        e.preventDefault();
        
        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();
        
        // Validate password match
        if (newPassword !== confirmPassword) {
            showToast('รหัสผ่านไม่ตรงกัน กรุณาลองใหม่อีกครั้ง', 'error');
            return;
        }
        
        // Show logout confirmation modal
        hideModal(passwordResetModal);
        showModal(logoutConfirmModal);
    });
    
    // Handle logout decisions
    $('#logout-all-devices').on('click', function() {
        updatePassword(true);
    });
    
    $('#stay-logged-in').on('click', function() {
        updatePassword(false);
    });
    
    // Function to update password
    function updatePassword(logoutAll) {
        const newPassword = $('#new-password').val();
        
        const formData = new FormData();
        formData.append('action', 'reset_password');
        formData.append('nonce', profileAjax.nonce);
        formData.append('new_password', newPassword);
        formData.append('logout_all', logoutAll);
        
        $.ajax({
            url: profileAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    if (response.data.redirect) {
                        showToast(response.data.message);
                        setTimeout(() => {
                            window.location.href = '/login/';
                        }, 1500);
                    } else {
                        showToast(response.data.message);
                        hideAllModals();
                        passwordForm[0].reset();
                    }
                } else {
                    showToast(response.data || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                }
            },
            error: function() {
                showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
            }
        });
    }
});