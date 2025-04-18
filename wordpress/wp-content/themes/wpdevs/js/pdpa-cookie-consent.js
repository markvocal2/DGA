/**
 * PDPA Cookie Consent JS
 * จัดการการทำงานของ PDPA Cookie Consent 
 */

(function($) {
    'use strict';
    
    // ฟังก์ชั่นสำหรับตรวจสอบว่า jQuery ทำงานถูกต้อง
    function checkJQuery() {
        if (typeof jQuery === 'undefined') {
            console.error('PDPA Consent: jQuery is not loaded. This script requires jQuery.');
            return false;
        }
        return true;
    }
    
    // ตรวจสอบความพร้อมของ jQuery
    if (!checkJQuery()) {
        return;
    }
    
    // ฟังก์ชันสำหรับดึงค่า cookie
    function getCookie(name) {
        let value = "; " + document.cookie;
        let parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return "";
    }
    
    // ฟังก์ชันตั้งค่า cookie ด้วย JavaScript (fallback)
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + "=" + value + ";expires=" + expires.toUTCString() + ";path=/;SameSite=Lax" + (location.protocol === 'https:' ? ';secure' : '');
    }
    
    // ตรวจสอบว่ามีการให้ความยินยอมแล้วหรือไม่
    function checkConsentStatus() {
        try {
            console.log('PDPA: Checking consent status');
            // เรียกใช้ pdpa_consent_data จาก WordPress
            const consentGiven = (typeof pdpa_consent_data !== 'undefined' && pdpa_consent_data.consent_given === 'yes') 
                || getCookie('pdpa_consent_given') === 'yes';
                
            if (pdpa_consent_data.debug) {
                console.log('PDPA debug - Consent given:', consentGiven);
                console.log('PDPA debug - Cookie value:', getCookie('pdpa_consent_given'));
                console.log('PDPA debug - Data value:', pdpa_consent_data.consent_given);
            }
                
            if (consentGiven) {
                // ซ่อน consent container ทั้งหมด
                $('#pdpa-cookie-consent .pdpa-consent-container').hide();
                
                // แสดงปุ่มตั้งค่าเท่านั้น
                $('#pdpa-reopen-consent').show();
                
                // โหลดสถานะ toggle จาก cookie
                if (getCookie('pdpa_analytics_cookies') === 'accepted') {
                    $('#analytics-cookies').prop('checked', true);
                } else {
                    $('#analytics-cookies').prop('checked', false);
                }
                
                if (getCookie('pdpa_marketing_cookies') === 'accepted') {
                    $('#marketing-cookies').prop('checked', true);
                } else {
                    $('#marketing-cookies').prop('checked', false);
                }
                
                if (getCookie('pdpa_functional_cookies') === 'accepted') {
                    $('#functional-cookies').prop('checked', true);
                } else {
                    $('#functional-cookies').prop('checked', false);
                }
                
                return true; // มีการให้ความยินยอมแล้ว
            } else {
                // ถ้ายังไม่มีการให้ความยินยอม แสดง consent container
                $('#pdpa-cookie-consent .pdpa-consent-container').show();
                $('#pdpa-reopen-consent').hide();
                // ซ่อนพาเนลการตั้งค่าเมื่อแสดงครั้งแรก (ไม่แสดงโดยอัตโนมัติ)
                $('#pdpa-settings-panel').hide();
                
                return false; // ยังไม่มีการให้ความยินยอม
            }
        } catch (error) {
            console.error('PDPA Consent: Error checking consent status', error);
            return false;
        }
    }
    
    // บันทึกการตั้งค่า cookie ผ่าน AJAX
    function saveCookieConsent(consentType, settings) {
        if (typeof pdpa_consent_data === 'undefined' || !pdpa_consent_data.ajax_url) {
            console.error('PDPA Consent: Missing AJAX configuration');
            return;
        }
        
        try {
            // ตั้งค่า client-side cookie ก่อนเพื่อความรวดเร็ว
            setCookie('pdpa_consent_given', 'yes', 30);
            
            // แสดง/ซ่อน UI elements ทันที
            $('#pdpa-cookie-consent .pdpa-consent-container').fadeOut(300);
            setTimeout(function() {
                $('#pdpa-reopen-consent').fadeIn(300);
            }, 300);
            
            // ส่งข้อมูลไปที่เซิร์ฟเวอร์เพื่อบันทึกอย่างถาวร
            $.ajax({
                url: pdpa_consent_data.ajax_url,
                type: 'POST',
                data: {
                    action: 'pdpa_save_cookie_consent',
                    nonce: pdpa_consent_data.nonce,
                    consent_type: consentType,
                    settings: settings
                },
                success: function(response) {
                    if (response.success) {
                        // แสดงข้อความแจ้งเตือน
                        showNotification(response.data);
                    } else {
                        console.error('PDPA Consent: Error saving consent:', response.data);
                        // แสดงข้อความข้อผิดพลาด
                        showNotification('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + response.data, 'error');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('PDPA Consent: AJAX Error:', error);
                    // แสดงข้อความข้อผิดพลาด
                    showNotification('เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์', 'error');
                }
            });
        } catch (error) {
            console.error('PDPA Consent: Error in saveCookieConsent', error);
            showNotification('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
        }
    }
    
    // แสดงการแจ้งเตือน
    function showNotification(message, type = 'success') {
        const bgColor = type === 'success' ? '#4caf50' : '#f44336';
        
        const notification = $('<div>', {
            class: 'pdpa-notification',
            text: message
        }).css({
            'position': 'fixed',
            'bottom': '20px',
            'right': '20px',
            'background-color': bgColor,
            'color': 'white',
            'padding': '10px 20px',
            'border-radius': '4px',
            'box-shadow': '0 2px 10px rgba(0,0,0,0.1)',
            'z-index': '10000',
            'opacity': '0',
            'transform': 'translateY(20px)'
        });
        
        $('body').append(notification);
        
        // แสดงการแจ้งเตือนด้วยการเคลื่อนไหว
        notification.animate({
            opacity: 1,
            transform: 'translateY(0)'
        }, 300);
        
        // ลบการแจ้งเตือนหลังจาก 3 วินาที
        setTimeout(function() {
            notification.animate({
                opacity: 0,
                transform: 'translateY(20px)'
            }, 300, function() {
                notification.remove();
            });
        }, 3000);
    }
    
    // ตรวจสอบความพร้อมของ DOM
    $(document).ready(function() {
        try {
            console.log('PDPA Consent: DOM ready');
            
            // ตรวจสอบว่า PDPA container มีอยู่หรือไม่
            if ($('#pdpa-cookie-consent').length === 0) {
                console.error('PDPA Consent: Container not found. Make sure the shortcode is included in the page.');
                return;
            }
            
            // ตรวจสอบสถานะความยินยอมเมื่อโหลดหน้า
            const hasConsent = checkConsentStatus();
            
            // การทำงานของปุ่มตั้งค่า - เปิด/ปิด พาเนลการตั้งค่า
            $('#pdpa-settings-button').off('click').on('click', function(e) {
                e.preventDefault();
                $('#pdpa-settings-panel').slideToggle(300);
            });
            
            // การทำงานของปุ่มยอมรับทั้งหมด
            $('#pdpa-accept-all').off('click').on('click', function(e) {
                e.preventDefault();
                // ตั้งค่าให้ทุก toggle เป็น checked
                $('#analytics-cookies, #marketing-cookies, #functional-cookies').prop('checked', true);
                saveCookieConsent('accept_all');
            });
            
            // การทำงานของปุ่มปฏิเสธทั้งหมด
            $('#pdpa-reject-all').off('click').on('click', function(e) {
                e.preventDefault();
                // ตั้งค่าให้ทุก toggle เป็น unchecked ยกเว้น necessary
                $('#analytics-cookies, #marketing-cookies, #functional-cookies').prop('checked', false);
                saveCookieConsent('reject_all');
            });
            
            // การทำงานของปุ่มบันทึกการตั้งค่า
            $('#pdpa-save-settings').off('click').on('click', function(e) {
                e.preventDefault();
                const settings = {
                    analytics: $('#analytics-cookies').is(':checked').toString(),
                    marketing: $('#marketing-cookies').is(':checked').toString(),
                    functional: $('#functional-cookies').is(':checked').toString()
                };
                
                saveCookieConsent('custom_settings', settings);
                
                // ซ่อนพาเนลการตั้งค่าหลังจากบันทึก
                $('#pdpa-settings-panel').slideUp(300);
            });
            
            // การทำงานของปุ่มเปิด dialog ใหม่
            $('#pdpa-reopen-consent').off('click').on('click', function(e) {
                e.preventDefault();
                $(this).hide();
                $('#pdpa-cookie-consent .pdpa-consent-container').fadeIn(300);
                // ซ่อนพาเนลการตั้งค่าเมื่อเปิด dialog ใหม่ (ต้องกดปุ่มตั้งค่าอีกครั้ง)
                $('#pdpa-settings-panel').hide();
            });
            
            console.log('PDPA Consent: Event handlers initialized');
        } catch (error) {
            console.error('PDPA Consent: Error in document.ready', error);
        }
    });
})(jQuery);

/**
 * ฟังก์ชันสำหรับตรวจสอบการยินยอม cookie
 * สามารถเรียกใช้จากที่อื่นในธีมได้
 */
function pdpaIsConsentGiven(cookieType) {
    if (cookieType === 'necessary') {
        return true; // คุกกี้ที่จำเป็นได้รับการยอมรับเสมอ
    }
    
    const cookieName = 'pdpa_' + cookieType + '_cookies';
    
    // ฟังก์ชันสำหรับดึงค่า cookie
    function getCookie(name) {
        let value = "; " + document.cookie;
        let parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return "";
    }
    
    if (getCookie('pdpa_consent_given') !== 'yes') {
        return false;
    }
    
    return getCookie(cookieName) === 'accepted';
}