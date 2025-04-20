/**
 * Custom reCAPTCHA V3 script
 * ใส่ไฟล์นี้ในโฟลเดอร์ /js ของ child theme
 */
jQuery(document).ready(($) => {
    // ฟังก์ชั่นสำหรับเพิ่ม reCAPTCHA ให้กับฟอร์มที่ระบุ
    window.initRecaptcha = (selector = 'form') => {
        // ใช้ค่าเริ่มต้นเป็น 'form' (เลือกทุกฟอร์ม) ด้วย default parameter
        const formSelector = selector;
        
        // ประมวลผลฟอร์มที่เลือก
        $(formSelector).each(function() {
            // ต้องใช้ function แบบปกติเนื่องจากต้องการใช้ this
            const form = $(this);
            
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
            form.on('submit', (e) => {
                // ไม่ประมวลผลฟอร์มที่มี token อยู่แล้ว
                if (form.find('input[name="g-recaptcha-response"]').length > 0) {
                    return;
                }
                
                e.preventDefault();
                
                // รับ token จาก reCAPTCHA
                grecaptcha.ready(() => {
                    grecaptcha.execute(recaptcha_data.site_key, {action: 'submit'})
                        .then((token) => {
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
        window.initRecaptcha();
    }
});
