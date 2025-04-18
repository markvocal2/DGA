jQuery(document).ready(function($) {
    // ฟังก์ชันสำหรับตำแหน่งสามเหลี่ยมของเมนูย่อย
    function positionTriangle($menuItem, $subMenu) {
        var $triangle = $subMenu.find('.sub-menu-arrow');
        var itemPosition = $menuItem.offset().left;
        var menuPosition = $subMenu.parent().offset().left;
        var trianglePosition = itemPosition - menuPosition + ($menuItem.width() / 2) - 8; // 8 คือครึ่งหนึ่งของความกว้างของสามเหลี่ยม
        
        if ($subMenu.parent().hasClass('sub-menu')) {
            // สำหรับเมนูย่อยระดับที่ 3 หรือลึกกว่า
            $triangle.css('top', '15px');
            $triangle.css('left', '-8px');
        } else {
            // สำหรับเมนูย่อยระดับที่ 2
            $triangle.css('left', trianglePosition + 'px');
        }
    }
    
    // จัดการการแสดงเมนูย่อยสำหรับ desktop
    if ($(window).width() > 768) {
        $('.custom-main-menu li.has-children').hover(
            function() {
                var $menuItem = $(this);
                var $subMenu = $menuItem.children('.sub-menu');
                
                $subMenu.stop(true, true).fadeIn(200);
                positionTriangle($menuItem, $subMenu);
            },
            function() {
                $(this).children('.sub-menu').stop(true, true).fadeOut(200);
            }
        );
        
        // จัดการเมนูย่อยซ้อนกัน
        $('.sub-menu li.has-children').hover(
            function() {
                var $menuItem = $(this);
                var $subMenu = $menuItem.children('.sub-menu');
                
                $subMenu.stop(true, true).fadeIn(200);
                positionTriangle($menuItem, $subMenu);
            },
            function() {
                $(this).children('.sub-menu').stop(true, true).fadeOut(200);
            }
        );
    } else {
        // สำหรับการเปิด/ปิดเมนูบนมือถือ
        $('.custom-main-menu li.has-children > a').on('click', function(e) {
            var $menuItem = $(this).parent();
            
            if ($menuItem.children('.sub-menu').is(':visible')) {
                $menuItem.children('.sub-menu').slideUp(200);
                $menuItem.removeClass('expanded');
            } else {
                $menuItem.children('.sub-menu').slideDown(200);
                $menuItem.addClass('expanded');
            }
            
            e.preventDefault();
        });
    }
});