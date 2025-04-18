/**
 * DGA Application Form JavaScript
 * ใช้สำหรับจัดการฟอร์มสมัครเข้าร่วมเป็นสมาชิก
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        const $form = $('#dga-apv-form');
        const $notificationContainer = $('#dga-apv-notification');
        const $loadingIndicator = $('#dga-apv-loading');
        const $successMessage = $('#dga-apv-success');
        const $referenceNumber = $('#dga-apv-reference');

        // Form submission
        $form.on('submit', function(e) {
            e.preventDefault();

            // Validate form
            if (!validateForm()) {
                return false;
            }

            // Show loading indicator
            $loadingIndicator.fadeIn(300);
            $form.hide();

            // Collect form data
            const formData = {
                'action': 'dga_apv_submit',
                'nonce': dga_apv_ajax.nonce,
                'gapp_name': $('#gapp_name').val(),
                'gapp_dep': $('#gapp_dep').val(),
                'gapp_date': $('#gapp_date').val(),
                'gapp_email': $('#gapp_email').val()
            };

            // Send AJAX request
            $.ajax({
                type: 'POST',
                url: dga_apv_ajax.ajax_url,
                data: formData,
                success: function(response) {
                    $loadingIndicator.hide();

                    if (response.success) {
                        // Show success message
                        $referenceNumber.text(response.data.app_number);
                        $successMessage.fadeIn(300);
                        
                        // Add success animation
                        showSuccessAnimation();
                    } else {
                        // Show error message
                        showNotification('error', response.data);
                        $form.fadeIn(300);
                    }
                },
                error: function() {
                    $loadingIndicator.hide();
                    showNotification('error', 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
                    $form.fadeIn(300);
                }
            });
        });

        // Validate form
        function validateForm() {
            let isValid = true;
            const $department = $('#gapp_dep');

            // Reset previous error messages
            $('.dga-apv-error-message').remove();
            $('.dga-apv-field-error').removeClass('dga-apv-field-error');

            // Check if department is selected
            if (!$department.val()) {
                isValid = false;
                $department.addClass('dga-apv-field-error');
                $department.after('<span class="dga-apv-error-message">กรุณาเลือกแผนกที่ต้องการเข้าร่วม</span>');
            }

            return isValid;
        }

        // Show notification
        function showNotification(type, message) {
            $notificationContainer.removeClass('dga-apv-notification-success dga-apv-notification-error')
                .addClass('dga-apv-notification-' + type)
                .html(message)
                .fadeIn(300);

            // Auto-hide after 5 seconds
            setTimeout(function() {
                $notificationContainer.fadeOut(300);
            }, 5000);
        }

        // Show success animation
        function showSuccessAnimation() {
            const $container = $('.dga-apv-container');
            
            // Create success checkmark element
            const $checkmark = $('<div class="dga-apv-checkmark-container">' +
                '<svg class="dga-apv-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">' +
                '<circle class="dga-apv-checkmark-circle" cx="26" cy="26" r="25" fill="none" />' +
                '<path class="dga-apv-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />' +
                '</svg></div>');
            
            // Add to container temporarily
            $container.append($checkmark);
            
            // Remove after animation completes
            setTimeout(function() {
                $checkmark.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }

        // Focus first form field
        $('#gapp_dep').focus();
    });

})(jQuery);