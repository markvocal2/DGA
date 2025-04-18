/**
 * CKAN Form Add JavaScript
 * ckan-fadd.js
 */

(function($) {
    'use strict';
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Show skeleton loader initially
        $('.ckan-fadd-form-content').hide();
        $('.ckan-fadd-form-skeleton').show();
        
        // Simulate loading taxonomy data
        setTimeout(function() {
            $('.ckan-fadd-form-skeleton').hide();
            $('.ckan-fadd-form-content').fadeIn(300);
            
            // Initialize Select2 for multiple select fields
            initSelect2();
        }, 800);
        
        // Initialize Thai datepicker
        initThaiDatepicker();
        
        // Form submission
        $('#ckan-fadd-form').on('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                showStatus('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
                return false;
            }
            
            // Show loading state
            const submitBtn = $('.ckan-fadd-submit-btn');
            const originalText = submitBtn.text();
            submitBtn.prop('disabled', true).text('กำลังบันทึกข้อมูล...');
            
            // Gather form data
            const formData = {
                dataset_name: $('#dataset_name').val(),
                dataset_type: $('#dataset_type').val(),
                gd_agree: $('input[name="gd_agree"]:checked').val(),
                contact_name: $('#contact_name').val(),
                contact_email: $('#contact_email').val(),
                objective: $('#objective').val(),
                frequency_unit: $('#frequency_unit').val(),
                frequency_value: $('#frequency_value').val(),
                geographic_area: $('#geographic_area').val(),
                source: $('#source').val(),
                data_format: $('#data_format').val(),
                data_governance: $('#data_governance').val(),
                url: $('#url').val(),
                language: $('#language').val(),
                creation_date: $('#creation_date').val(),
                last_update_date: $('#last_update_date').val()
            };
            
            // Send AJAX request
            $.ajax({
                url: ckan_fadd_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_fadd_submit',
                    nonce: ckan_fadd_ajax.nonce,
                    form_data: formData
                },
                success: function(response) {
                    if (response.success) {
                        // Show success message
                        showStatus(response.data.message, 'success');
                        
                        // Reset form
                        $('#ckan-fadd-form')[0].reset();
                        
                        // Reset Select2 fields
                        $('.ckan-select2').val(null).trigger('change');
                        
                        // Optional: Redirect to the new post
                        setTimeout(function() {
                            window.location.href = response.data.post_url;
                        }, 2000);
                    } else {
                        // Show error message
                        showStatus(response.data.message, 'error');
                    }
                },
                error: function() {
                    // Show generic error message
                    showStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
                },
                complete: function() {
                    // Reset button state
                    submitBtn.prop('disabled', false).text(originalText);
                }
            });
        });
        
        // Tooltips
        initTooltips();
    });
    
    /**
     * Initialize Select2 for multiple select fields
     */
    function initSelect2() {
        if ($.fn.select2) {
            $('.ckan-select2').select2({
                placeholder: "เลือกรายการ...",
                allowClear: true,
                language: {
                    noResults: function() {
                        return "ไม่พบข้อมูล";
                    }
                }
            });
        } else {
            console.warn('Select2 plugin not found. Falling back to normal select.');
        }
    }
    
    /**
     * Initialize Thai Buddhist Era datepicker
     */
    function initThaiDatepicker() {
        // Check if jQuery UI datepicker is available
        if ($.datepicker) {
            $.datepicker.regional['th'] = {
                closeText: 'ปิด',
                prevText: 'ก่อนหน้า',
                nextText: 'ถัดไป',
                currentText: 'วันนี้',
                monthNames: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
                monthNamesShort: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
                dayNames: ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'],
                dayNamesShort: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
                dayNamesMin: ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'],
                weekHeader: 'สัปดาห์',
                dateFormat: 'dd/mm/yy',
                firstDay: 0,
                isRTL: false,
                showMonthAfterYear: false,
                yearSuffix: ''
            };
            
            $.datepicker.setDefaults($.datepicker.regional['th']);
            
            $('.thai-datepicker').datepicker({
                changeMonth: true,
                changeYear: true,
                dateFormat: 'dd/mm/yy',
                yearRange: '-100:+0',
                beforeShow: function() {
                    setTimeout(function(){
                        $('.ui-datepicker').css('z-index', 99999);
                    }, 0);
                },
                onSelect: function(dateText, inst) {
                    // Convert to Thai Buddhist Era (BE = CE + 543)
                    const parts = dateText.split('/');
                    const day = parts[0];
                    const month = parts[1];
                    const year = parseInt(parts[2]) + 543;
                    $(this).val(day + '/' + month + '/' + year);
                }
            });
            
            // Set current date as default for both date fields
            const today = new Date();
            const day = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear() + 543;
            const thaiDate = day + '/' + month + '/' + year;
            
            $('#creation_date').val(thaiDate);
            $('#last_update_date').val(thaiDate);
        } else {
            // Fallback if jQuery UI datepicker is not available
            console.warn('jQuery UI Datepicker not found. Using native date input.');
            $('.thai-datepicker').attr('type', 'date');
        }
    }
    
    /**
     * Initialize tooltips
     */
    function initTooltips() {
        // Add custom tooltip behavior if needed
        $('.tooltip-icon').on('click', function(e) {
            e.preventDefault();
        });
    }
    
    /**
     * Validate the form
     * @returns {boolean} Whether the form is valid
     */
    function validateForm() {
        let isValid = true;
        
        // Remove all error classes first
        $('.ckan-fadd-field').removeClass('error');
        
        // Check required fields (except for select2 multiple)
        $('#ckan-fadd-form input[required], #ckan-fadd-form textarea[required], #ckan-fadd-form select[required]:not([multiple])').each(function() {
            if ($(this).val() === '' || $(this).val() === null) {
                $(this).closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        });
        
        // Check select2 multiple fields
        $('#ckan-fadd-form select[multiple][required]').each(function() {
            if ($(this).val() === null || $(this).val().length === 0) {
                $(this).closest('.ckan-fadd-field').addClass('error');
                isValid = false;
            }
        });
        
        // Check radio buttons
        if (!$('input[name="gd_agree"]:checked').length) {
            $('input[name="gd_agree"]').closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        // Validate email format
        const emailField = $('#contact_email');
        if (emailField.val() !== '' && !isValidEmail(emailField.val())) {
            emailField.closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        // Validate URL format
        const urlField = $('#url');
        if (urlField.val() !== '' && !isValidUrl(urlField.val())) {
            urlField.closest('.ckan-fadd-field').addClass('error');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Validate an email address
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    function isValidEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    /**
     * Validate a URL
     * @param {string} url - The URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    /**
     * Show a status message
     * @param {string} message - The message to display
     * @param {string} type - The message type ('success' or 'error')
     */
    function showStatus(message, type) {
        const statusEl = $('.ckan-fadd-status');
        statusEl.removeClass('success error').addClass(type);
        $('.ckan-fadd-status-message').text(message);
        statusEl.show();
        
        // Scroll to status message
        $('html, body').animate({
            scrollTop: statusEl.offset().top - 100
        }, 300);
        
        // Hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(function() {
                statusEl.fadeOut(300);
            }, 5000);
        }
    }
    
})(jQuery);