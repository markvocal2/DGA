/**
 * Custom reCAPTCHA V3 script
 * ใส่ไฟล์นี้ในโฟลเดอร์ /js ของ child theme
 * Version: 1.0.1 (Refactored for reduced nesting)
 */
(function($) {
    'use strict';

    // --- Helper Functions ---

    /**
     * Adds the reCAPTCHA token to the form and submits it.
     * @param {jQuery} form The form element to submit.
     * @param {string} token The reCAPTCHA token.
     */
    function addTokenAndSubmitForm(form, token) {
        // เพิ่ม token ลงในฟอร์มเป็น hidden input
        $('<input>').attr({
            type: 'hidden',
            name: 'g-recaptcha-response',
            value: token
        }).appendTo(form);

        // ส่งฟอร์ม (ต้อง unbind event 'submit' ก่อนเพื่อป้องกัน loop)
        form.off('submit.recaptcha').submit();
    }

    /**
     * Executes reCAPTCHA and handles the token retrieval.
     * @param {jQuery} form The form element being submitted.
     */
    function executeRecaptchaAndSubmit(form) {
        // Check if grecaptcha is available
        if (typeof grecaptcha === 'undefined' || typeof grecaptcha.ready !== 'function') {
            console.error('reCAPTCHA library (grecaptcha) is not loaded.');
            // Optionally display an error message to the user
            alert('เกิดข้อผิดพลาดในการโหลด reCAPTCHA กรุณาลองใหม่อีกครั้ง');
            // Re-enable form submission or provide feedback
            form.find(':submit').prop('disabled', false); // Example: Re-enable submit button
            return;
        }
         // Check if site key is available
        if (typeof recaptcha_data === 'undefined' || !recaptcha_data.site_key) {
            console.error('reCAPTCHA site key is not available (recaptcha_data.site_key).');
            alert('เกิดข้อผิดพลาดในการตั้งค่า reCAPTCHA');
            form.find(':submit').prop('disabled', false);
            return;
        }


        grecaptcha.ready(() => {
            grecaptcha.execute(recaptcha_data.site_key, { action: 'submit' })
                .then((token) => {
                    addTokenAndSubmitForm(form, token);
                })
                .catch((error) => {
                     console.error('reCAPTCHA execution error:', error);
                     alert('เกิดข้อผิดพลาดในการยืนยัน reCAPTCHA กรุณาลองใหม่อีกครั้ง');
                     // Re-enable form submission or provide feedback
                     form.find(':submit').prop('disabled', false); // Example: Re-enable submit button
                });
        });
    }

    /**
     * Handles the form submit event. Prevents default submission and initiates reCAPTCHA execution.
     * @param {Event} event The submit event object.
     * @param {jQuery} form The form element being submitted.
     */
    function handleFormSubmit(event, form) {
        // ไม่ประมวลผลฟอร์มที่มี token อยู่แล้ว (ป้องกันการส่งซ้ำซ้อน)
        if (form.find('input[name="g-recaptcha-response"]').length > 0) {
            console.log('reCAPTCHA token already exists. Allowing normal submission.');
            return; // Allow default submission if token exists
        }

        event.preventDefault(); // Prevent default form submission

        // Optionally disable submit button here to prevent double clicks
        form.find(':submit').prop('disabled', true);

        // รับ token จาก reCAPTCHA และส่งฟอร์ม
        executeRecaptchaAndSubmit(form);
    }


    // --- Initialization Function ---

    /**
     * Initializes reCAPTCHA for selected forms.
     * @param {string} [selector='form'] CSS selector for the forms to target.
     */
    window.initRecaptcha = (selector = 'form') => {
        const formSelector = selector;

        $(formSelector).each(function() {
            // ใช้ function แบบปกติเนื่องจากต้องการใช้ this
            const form = $(this);

            // ข้ามฟอร์มที่มี data-no-recaptcha="true"
            if (form.attr('data-no-recaptcha') === 'true') {
                console.log('Skipping reCAPTCHA for form (data-no-recaptcha="true"):', form);
                return; // equivalent to 'continue' in a loop
            }

            // ข้ามฟอร์มที่มีการเพิ่ม reCAPTCHA แล้ว (ใช้ class หรือ data attribute)
            if (form.data('recaptcha-processed')) {
                 console.log('Skipping already processed form:', form);
                return;
            }

            // เพิ่ม flag เพื่อบอกว่าฟอร์มได้รับการประมวลผลแล้ว
            form.data('recaptcha-processed', true);
            form.addClass('recaptcha-processed'); // Add class for potential styling/selection

            // เพิ่มตัวจัดการเหตุการณ์ submit (ใช้ namespace '.recaptcha' เพื่อให้ unbind ง่าย)
            // Bind the event handler, passing the form element
            form.on('submit.recaptcha', (event) => {
                handleFormSubmit(event, form);
            });

             if (typeof recaptcha_data !== 'undefined' && recaptcha_data.debug_mode) {
                 console.log('reCAPTCHA initialized for form:', form);
             }
        });
    };

    // --- Auto Initialization ---
    // ถ้ามีการตั้งค่า auto_init=true ให้เริ่มต้นการทำงานอัตโนมัติสำหรับทุกฟอร์ม
    if (typeof recaptcha_data !== 'undefined' && recaptcha_data.auto_init === true) {
        // Ensure grecaptcha is ready before initializing (important for async loading)
        if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
             grecaptcha.ready(() => {
                 console.log('Auto-initializing reCAPTCHA...');
                 window.initRecaptcha();
             });
        } else {
             console.warn('grecaptcha not ready for auto-init. Make sure reCAPTCHA script is loaded.');
             // Optional: Retry initialization after a delay
             // setTimeout(() => {
             //     if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
             //        grecaptcha.ready(() => window.initRecaptcha());
             //     }
             // }, 1000);
        }
    }

})(jQuery);
