// Save this as contact-form.js in your child theme's js folder

jQuery(document).ready(function($) {
    const form = $('#department-contact-form');
    const loadingOverlay = $('#loading-overlay');
    
    // Create toast notification container
    const toastContainer = $('<div/>', {
        class: 'toast-notification',
        role: 'alert',
        'aria-live': 'polite',
        css: { display: 'none' }
    }).appendTo('body');

    // Show toast notification function
    function showToast(message, type = 'success', duration = 3000) {
        const icon = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        
        toastContainer
            .html(icon + '<span>' + message + '</span>')
            .css({
                'display': 'flex',
                'background-color': type === 'success' ? 'var(--color-success)' : 'var(--color-error)'
            })
            .fadeIn();
        
        setTimeout(() => {
            toastContainer.fadeOut();
        }, duration);
    }

    // Form validation functions
    function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // ตรวจสอบเบื้องต้น: มี @ หนึ่งตัว และมีจุดหลัง @
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) {
        return false;
    }
    
    const domain = email.substring(atIndex + 1);
    const dotIndex = domain.indexOf('.');
    if (dotIndex === -1 || dotIndex === 0 || dotIndex === domain.length - 1) {
        return false;
    }
    
    // ตรวจสอบความยาวสูงสุด
    if (email.length > 254) {
        return false;
    }
    
    // ตรวจสอบขั้นสุดท้ายด้วย regex อย่างง่าย
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

    function showError(inputElement, message) {
        const errorElement = $(`#${inputElement.attr('id')}-error`);
        inputElement.addClass('error');
        errorElement.text(message);
    }

    function clearError(inputElement) {
        const errorElement = $(`#${inputElement.attr('id')}-error`);
        inputElement.removeClass('error');
        errorElement.text('');
    }

    // Input validation on blur
    form.find('input, textarea').on('blur', function() {
        const $input = $(this);
        const value = $input.val().trim();

        if ($input.prop('required') && !value) {
            showError($input, 'กรุณากรอกข้อมูลในช่องนี้');
        } else if ($input.attr('type') === 'email' && value && !validateEmail(value)) {
            showError($input, 'กรุณากรอกอีเมลให้ถูกต้อง');
        } else {
            clearError($input);
        }
    });

    // Clear error on input
    form.find('input, textarea').on('input', function() {
        clearError($(this));
    });

    // Handle form submission
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Validate all fields before submission
        let hasErrors = false;
        form.find('input, textarea').each(function() {
            const $input = $(this);
            const value = $input.val().trim();

            if ($input.prop('required') && !value) {
                showError($input, 'กรุณากรอกข้อมูลในช่องนี้');
                hasErrors = true;
            } else if ($input.attr('type') === 'email' && value && !validateEmail(value)) {
                showError($input, 'กรุณากรอกอีเมลให้ถูกต้อง');
                hasErrors = true;
            }
        });

        if (hasErrors) {
            return;
        }

        // Show loading overlay
        loadingOverlay.fadeIn();
        
        // Disable submit button
        const submitButton = form.find('button[type="submit"]');
        submitButton.prop('disabled', true);
        
        // Collect form data
        const formData = {
            action: 'contact_form_submit',
            contact_name: $('#contact_name').val().trim(),
            contact_email: $('#contact_email').val().trim(),
            contact_message: $('#contact_message').val().trim()
        };

        // Send AJAX request
        $.ajax({
            url: ajax_object.ajax_url,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.status === 'success') {
                    showToast(response.message, 'success');
                    form[0].reset();
                } else {
                    showToast(response.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
                }
            },
            error: function() {
                showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
            },
            complete: function() {
                // Hide loading overlay
                loadingOverlay.fadeOut();
                // Re-enable submit button
                submitButton.prop('disabled', false);
            }
        });
    });

    // Keyboard accessibility enhancements
    form.find('input, textarea, button').on('keydown', function(e) {
        // Enter key handling for inputs
        if (e.key === 'Enter' && !$(this).is('textarea')) {
            e.preventDefault();
            $(this).blur();
            // Move focus to next input
            const inputs = form.find('input, textarea, button');
            const nextInput = inputs.get(inputs.index(this) + 1);
            if (nextInput) {
                nextInput.focus();
            }
        }
    });

    // Add aria-invalid attribute when validation fails
    const updateAriaInvalid = function($input) {
        $input.attr('aria-invalid', $input.hasClass('error'));
    };

    form.find('input, textarea').on('blur input', function() {
        updateAriaInvalid($(this));
    });
});
