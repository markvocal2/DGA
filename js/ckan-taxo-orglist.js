/**
 * CKAN Taxonomy Organization List JavaScript
 */
(function($) {
    $(document).ready(function() {
        // เพิ่ม class active เมื่อคลิก
        $('.ckan-taxo-item').on('click', function() {
            $('.ckan-taxo-item').removeClass('active');
            $(this).addClass('active');
        });
        
        // ทำให้ item ที่ตรงกับ URL ปัจจุบันเป็น active และเลื่อนไปที่ item นั้น
        function highlightActiveItem() {
            const currentUrl = window.location.href;
            $('.ckan-taxo-item-link').each(function() {
                const itemUrl = $(this).attr('href');
                if (currentUrl === itemUrl) {
                    const $item = $(this).parent();
                    $item.addClass('active');
                    
                    // เลื่อน item มาให้อยู่ตรงกลางของ container
                    const $container = $('.ckan-taxo-content');
                    const itemTop = $item.position().top;
                    const containerScrollTop = $container.scrollTop();
                    
                    $container.animate({
                        scrollTop: containerScrollTop + itemTop - $container.height()/2 + $item.height()/2
                    }, 300);
                }
            });
        }
        
        // ทำงานเมื่อโหลดหน้าเว็บ
        highlightActiveItem();
    });
})(jQuery);