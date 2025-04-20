jQuery(document).ready(function($) {
    // เปิด modal เมื่อคลิกปุ่ม "แก้ไขข้อมูล"
    $('.ckan-edit-corg-btn').on('click', function() {
        const postId = $(this).data('post-id');
        
        // โหลด terms ทั้งหมดผ่าน AJAX
        $.ajax({
            url: ckanCorgData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_all_corg_terms',
                nonce: ckanCorgData.nonce,
                post_id: postId
            },
            beforeSend: function() {
                // เตรียม select
                $('#ckan-corg-select').html('<option value="">กำลังโหลด...</option>');
            },
            success: function(response) {
                if (response.success) {
                    const terms = response.data.terms;
                    const currentTermId = response.data.current_term_id;
                    let optionsHtml = '<option value="">-- เลือกองค์กร --</option>';
                    
                    // สร้าง options สำหรับ select
                    if (terms.length > 0) {
                        for (let i = 0; i < terms.length; i++) {
                            const selected = terms[i].selected ? ' selected="selected"' : '';
                            optionsHtml += '<option value="' + terms[i].id + '"' + selected + '>' + terms[i].name + '</option>';
                        }
                    }
                    
                    // อัพเดต select element
                    $('#ckan-corg-select').html(optionsHtml);
                    
                    // เก็บ post ID ไว้ใน modal เพื่อใช้ต่อ
                    $('#ckan-corg-modal').data('post-id', postId);
                    
                    // แสดง modal ด้วย animation
                    $('#ckan-corg-modal').fadeIn(300);
                    
                    // ทำให้ select มี style สวยงาม (ถ้าต้องการใช้ custom select)
                    initCustomSelect();
                } else {
                    alert('เกิดข้อผิดพลาดในการโหลดข้อมูลองค์กร');
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    });
    
    // Function เพื่อกำหนด custom select (ถ้าต้องการ)
    function initCustomSelect() {
        // ปรับแต่ง select หากต้องการ (สามารถเพิ่ม plugin เช่น Select2 หรือ Chosen)
    }
    
    // ปิด modal เมื่อคลิกปุ่มปิด
    $(document).on('click', '.ckan-modal-close', function() {
        $('#ckan-corg-modal').fadeOut(200);
    });
    
    // ปิด modal เมื่อคลิกนอกพื้นที่ modal
    $(window).on('click', function(event) {
        if ($(event.target).is('#ckan-corg-modal')) {
            $('#ckan-corg-modal').fadeOut(200);
        }
    });
    
    // จัดการคลิกปุ่มอัพเดต
    $('.ckan-update-corg-btn').on('click', function() {
        const postId = $('#ckan-corg-modal').data('post-id');
        const termId = $('#ckan-corg-select').val();
        
        // อัพเดต term ของโพสต์ผ่าน AJAX
        $.ajax({
            url: ckanCorgData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_update_post_corg',
                nonce: ckanCorgData.nonce,
                post_id: postId,
                term_id: termId
            },
            beforeSend: function() {
                $('.ckan-update-corg-btn').addClass('loading').text('กำลังอัพเดต...');
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดตการแสดงชื่อองค์กร
                    if (response.data.term_name) {
                        $('.ckan-corg-name').text(response.data.term_name).removeClass('ckan-corg-empty');
                    } else {
                        $('.ckan-corg-name').text('ยังไม่มีข้อมูลองค์กร').addClass('ckan-corg-empty');
                    }
                    
                    // แสดงข้อความแจ้งเตือนว่าอัพเดตสำเร็จ
                    showNotification(response.data.message);
                    
                    // ปิด modal
                    $('#ckan-corg-modal').fadeOut(200);
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data.message);
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: function() {
                $('.ckan-update-corg-btn').removeClass('loading').text('อัพเดตข้อมูล');
            }
        });
    });
    
    // Function สำหรับแสดงการแจ้งเตือน
    function showNotification(message) {
        // สร้าง notification element
        const notification = $('<div class="ckan-notification">' + message + '</div>');
        $('body').append(notification);
        
        // แสดง notification
        setTimeout(function() {
            notification.addClass('show');
            
            // ซ่อนและลบ notification หลังจาก 3 วินาที
            setTimeout(function() {
                notification.removeClass('show');
                setTimeout(function() {
                    notification.remove();
                }, 300);
            }, 3000);
        }, 10);
    }
});
