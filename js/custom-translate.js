jQuery(document).ready(function($) {
    // ฟังก์ชั่นเพื่อตรวจสอบเมื่อ Google Translate โหลดเสร็จ
    function checkGoogleTranslate() {
        if (typeof google !== 'undefined' && typeof google.translate !== 'undefined') {
            console.log('Google Translate API loaded');
            
            // ตรวจสอบการโหลดของ dropdown
            const checkDropdown = setInterval(function() {
                const dropdown = $('.goog-te-combo');
                if (dropdown.length) {
                    clearInterval(checkDropdown);
                    console.log('Translate dropdown found');
                    
                    // แสดงชื่อภาษาในภาษาต้นฉบับ
                    customizeLanguageNames();
                }
            }, 300);
        } else {
            console.log('Waiting for Google Translate API...');
            setTimeout(checkGoogleTranslate, 500);
        }
    }
    
    // ฟังก์ชั่นเพื่อปรับแต่งชื่อภาษา
    function customizeLanguageNames() {
        // Native language names
        const nativeNames = {
            'en': 'English',
            'zh-CN': '中文',
            'ja': '日本語',
            'ko': '한국어',
            'vi': 'Tiếng Việt',
            'ms': 'Bahasa Melayu',
            'id': 'Bahasa Indonesia',
            'fr': 'Français',
            'de': 'Deutsch',
            'th': 'ไทย'
        };
        
        // ปรับชื่อภาษาในตัวเลือก
        $('.goog-te-combo option').each(function() {
            const langCode = $(this).val();
            if (nativeNames[langCode]) {
                $(this).text(nativeNames[langCode]);
            }
        });
        
        console.log('Language names customized');
    }
    
    // เริ่มต้นตรวจสอบ Google Translate
    setTimeout(checkGoogleTranslate, 1000);
    
    // เพิ่ม event listener สำหรับการเปลี่ยนภาษา
    $(document).on('change', '.goog-te-combo', function() {
        console.log('Language changed to: ' + $(this).val());
    });
});
