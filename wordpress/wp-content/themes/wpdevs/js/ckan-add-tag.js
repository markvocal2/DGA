jQuery(document).ready(function($) {
    // เปิด modal เมื่อคลิกปุ่ม "เพิ่ม TAG"
    $('.ckan-add-tag-btn').on('click', function() {
        var postId = $(this).data('post-id');
        
        // โหลด terms ทั้งหมดผ่าน AJAX
        $.ajax({
            url: ckanTagData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_all_terms',
                nonce: ckanTagData.nonce,
                post_id: postId
            },
            beforeSend: function() {
                // แสดง loading indicator
                $('.ckan-modal-tags').html('<p>กำลังโหลด...</p>');
            },
            success: function(response) {
                if (response.success) {
                    var terms = response.data;
                    var tagsHtml = '';
                    
                    // สร้าง HTML สำหรับ tags
                    if (terms.length > 0) {
                        for (var i = 0; i < terms.length; i++) {
                            var selectedClass = terms[i].selected ? 'selected' : '';
                            tagsHtml += '<span class="ckan-modal-tag ' + selectedClass + '" data-term-id="' + terms[i].id + '">';
                            tagsHtml += terms[i].name;
                            tagsHtml += '</span>';
                        }
                    } else {
                        tagsHtml = '<p>ไม่พบ Tag ใด ๆ</p>';
                    }
                    
                    // อัพเดตเนื้อหาใน modal
                    $('.ckan-modal-tags').html(tagsHtml);
                    
                    // เก็บ post ID ไว้ใน modal เพื่อใช้ต่อ
                    $('#ckan-tag-modal').data('post-id', postId);
                    
                    // แสดง modal
                    $('#ckan-tag-modal').show();
                } else {
                    alert('เกิดข้อผิดพลาดในการโหลด Tag');
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    });
    
    // ปิด modal เมื่อคลิกปุ่มปิด
    $(document).on('click', '.ckan-modal-close', function() {
        $('#ckan-tag-modal').hide();
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่ modal
    $(window).on('click', function(event) {
        if ($(event.target).is('#ckan-tag-modal')) {
            $('#ckan-tag-modal').hide();
        }
    });
    
    // สลับการเลือกเมื่อคลิกที่ tag ใน modal
    $(document).on('click', '.ckan-modal-tag', function() {
        $(this).toggleClass('selected');
    });
    
    // จัดการคลิกปุ่มบันทึก
    $('.ckan-save-tags-btn').on('click', function() {
        var postId = $('#ckan-tag-modal').data('post-id');
        var selectedTermIds = [];
        
        // เก็บ ID ของ terms ที่เลือกทั้งหมด
        $('.ckan-modal-tag.selected').each(function() {
            selectedTermIds.push($(this).data('term-id'));
        });
        
        // อัพเดต terms ของโพสต์ผ่าน AJAX
        $.ajax({
            url: ckanTagData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_update_post_terms',
                nonce: ckanTagData.nonce,
                post_id: postId,
                term_ids: selectedTermIds
            },
            beforeSend: function() {
                $('.ckan-save-tags-btn').text('กำลังบันทึก...');
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดตการแสดง tags
                    var tagsHtml = '';
                    var terms = response.data.terms;
                    
                    for (var i = 0; i < terms.length; i++) {
                        tagsHtml += '<span class="ckan-tag" data-term-id="' + terms[i].id + '">';
                        tagsHtml += terms[i].name;
                        tagsHtml += '</span>';
                    }
                    
                    $('.ckan-tags-list').html(tagsHtml);
                    
                    // ปิด modal
                    $('#ckan-tag-modal').hide();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data.message);
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: function() {
                $('.ckan-save-tags-btn').text('บันทึก');
            }
        });
    });
});