/**
 * Custom reCAPTCHA V3 script
 * ใส่ไฟล์นี้ในโฟลเดอร์ /js ของ child theme
 */
jQuery(document).ready(function($) {
    // ฟังก์ชั่นสำหรับเพิ่ม reCAPTCHA ให้กับฟอร์มที่ระบุ
    window.initRecaptcha = function(selector) {
        // ถ้าไม่ได้ระบุตัวเลือก ใช้ 'form' (เลือกทุกฟอร์ม)
        var formSelector = selector || 'form';
        
        // ประมวลผลฟอร์มที่เลือก
        $(formSelector).each(function() {
            var form = $(this);
            
            // ข้ามฟอร์มที่มี data-no-recaptcha="true"
            if (form.attr('data-no-recaptcha') === 'true') {
                return;
            }
            
            // ข้ามฟอร์มที่มีการเพิ่ม reCAPTCHA แล้ว
            if (form.hasClass('recaptcha-processed')) {
                return;
            }
            
            // เพิ่มคลาสเพื่อบอกว่าฟอร์มได้รับการประมวลผลแล้ว
            form.addClass('recaptcha-processed');
            
            // เพิ่มตัวจัดการเหตุการณ์ submit
            form.on('submit', function(e) {
                // ไม่ประมวลผลฟอร์มที่มี token อยู่แล้ว
                if (form.find('input[name="g-recaptcha-response"]').length > 0) {
                    return;
                }
                
                e.preventDefault();
                
                // รับ token จาก reCAPTCHA
                grecaptcha.ready(function() {
                    grecaptcha.execute(recaptcha_data.site_key, {action: 'submit'}).then(function(token) {
                        // เพิ่ม token ลงในฟอร์ม
                        $('<input>').attr({
                            type: 'hidden',
                            name: 'g-recaptcha-response',
                            value: token
                        }).appendTo(form);
                        
                        // ส่งฟอร์ม
                        form.off('submit').submit();
                    });
                });
            });
        });
    };

    // ถ้ามีการตั้งค่า auto_init=true ให้เริ่มต้นการทำงานอัตโนมัติสำหรับทุกฟอร์ม
    if (typeof recaptcha_data !== 'undefined' && recaptcha_data.auto_init === true) {
        window.initRecaptcha('form');
    }
});