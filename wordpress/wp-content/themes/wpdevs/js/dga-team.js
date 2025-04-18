/**
 * DGA Team Member Script - Fixed Version
 * ไฟล์นี้ควรอยู่ที่: child-theme/js/dga-team.js
 * แก้ไขปัญหาความสูงไม่กลับมาที่ 480px เมื่อนำเมาส์ออก
 */
jQuery(document).ready(function($) {
    // สร้างส่วนข้อมูลแบบ card สำหรับแต่ละ member
    $('.dga-team-alternate').each(function() {
        const $card = $(this);
        const name = $card.data('name') || 'ชื่อ นามสกุล';
        const position = $card.data('position') || 'ตำแหน่ง';
        const phone = $card.data('phone') || '081-234-5678';
        
        // สร้าง tag แบบที่เห็นในภาพตัวอย่าง
        const $tag = $('<div class="dga-team-info-tag"></div>');
        $tag.html(`
            <span class="dga-team-title">${name}</span>
            <span class="dga-team-subtitle">${position}</span>
            <span class="dga-team-phone-overlay">${phone}</span>
        `);
        
        // เพิ่ม tag เข้าไปในการ์ด
        $card.find('.dga-team-image-container').append($tag);
    });
    
    // เพิ่ม animation class เมื่อโหลด
    $('.dga-team-member').each(function(index) {
        const $this = $(this);
        setTimeout(function() {
            $this.addClass('visible');
        }, index * 150); // ทำให้การแสดงผลของแต่ละคนเหลื่อมกัน
    });
    
    // เพิ่มเอฟเฟกต์เมื่อโฮเวอร์ตามภาพตัวอย่าง
    $('.dga-team-member').each(function() {
        const $member = $(this);
        const $halfImg = $member.find('.dga-team-image-half');
        const $fullImg = $member.find('.dga-team-image-full');
        const $container = $member.find('.dga-team-image-container');
        
        $member.on('mouseenter', function() {
            // ภาพครึ่งตัวจางออก
            $halfImg.css({
                'opacity': '0'
            });
            
            // ภาพเต็มตัวแสดงและขยายให้ศีรษะเลยออกมาจากกรอบ
            $fullImg.css({
                'transform': 'scale(1.2)',
                'opacity': '1',
                'transform-origin': 'center bottom',
                'z-index': '100'
            });
            
            // ทำให้ container สามารถแสดงเนื้อหาล้นกรอบได้และเพิ่มความสูง
            $container.css({
                'overflow': 'visible',
                'z-index': '10',
                'height': '550px'  // เพิ่มความสูงเป็น 550px ตามที่กำหนดใน CSS
            });
            
            // เพิ่ม z-index ให้กับการ์ดทั้งใบเพื่อให้อยู่เหนือ elements อื่นๆ
            $member.css('z-index', '50');
        }).on('mouseleave', function() {
            // คืนค่าภาพครึ่งตัว
            $halfImg.css({
                'opacity': '1'
            });
            
            // คืนค่าภาพเต็มตัว
            $fullImg.css({
                'transform': 'scale(1)',
                'opacity': '0',
                'z-index': '2'
            });
            
            // คืนค่า container
            $container.css({
                'overflow': 'hidden',
                'z-index': '1',
                'height': '480px'  // แก้ไขเป็น 480px ตามความสูงเริ่มต้นที่กำหนดใน CSS
            });
            
            // คืนค่า z-index ของการ์ด
            $member.css('z-index', '1');
        });
    });
    
    // เพิ่มเทคนิคการโหลดภาพแบบคมชัด
    $('.dga-team-member').each(function() {
        const $halfImg = $(this).find('.dga-team-image-half');
        const $fullImg = $(this).find('.dga-team-image-full');
        
        // ดึง URL ของรูปภาพ
        const halfSrc = $halfImg.css('background-image').replace(/url\(['"]?(.*?)['"]?\)/i, "$1");
        const fullSrc = $fullImg.css('background-image').replace(/url\(['"]?(.*?)['"]?\)/i, "$1");
        
        // โหลดภาพล่วงหน้าเพื่อความคมชัด
        if (halfSrc && halfSrc !== 'none') {
            const halfImgLoader = new Image();
            halfImgLoader.onload = function() {
                $halfImg.css('background-image', 'url(' + halfSrc + ')');
            };
            halfImgLoader.src = halfSrc;
        }
        
        if (fullSrc && fullSrc !== 'none') {
            const fullImgLoader = new Image();
            fullImgLoader.onload = function() {
                $fullImg.css('background-image', 'url(' + fullSrc + ')');
            };
            fullImgLoader.src = fullSrc;
        }
    });
    
    // ฟังก์ชันตรวจสอบว่า element อยู่ในหน้าจอหรือไม่
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // ตรวจสอบ elements เมื่อเลื่อนหน้าจอหรือปรับขนาดหน้าต่าง
    $(window).on('scroll resize', function() {
        $('.dga-team-member:not(.visible)').each(function() {
            if (isInViewport(this)) {
                $(this).addClass('visible');
            }
        });
    });
    
    // ทริกเกอร์การตรวจสอบทันทีเมื่อโหลดหน้า
    $(window).trigger('scroll');
    
    // เพิ่มคลาสสำหรับแสดงผลเป็นกลุ่ม (กริด)
    if ($('.dga-team-member').length > 1) {
        const $parent = $('.dga-team-member:first').parent();
        if (!$parent.hasClass('dga-team-grid') && 
            !$parent.hasClass('wp-block-gallery') && 
            !$parent.hasClass('wp-block-columns')) {
            $parent.addClass('dga-team-grid');
        }
    }
});