jQuery(document).ready(function($) {
    // เปิด modal เมื่อคลิกปุ่ม "เพิ่ม TAG"
    $('.ckan-add-tag-btn').on('click', function() {
        const postId = $(this).data('post-id'); // Use const as postId is not reassigned

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
                    const terms = response.data; // Use const as terms is not reassigned
                    let tagsHtml = ''; // Use let as tagsHtml is reassigned in the loop/conditional

                    // สร้าง HTML สำหรับ tags
                    if (terms.length > 0) {
                        // Use for...of loop for better readability with arrays
                        for (const term of terms) { // Use const for term in loop if not reassigned inside
                            const selectedClass = term.selected ? 'selected' : ''; // Use const
                            tagsHtml += `<span class="ckan-modal-tag ${selectedClass}" data-term-id="${term.id}">`;
                            tagsHtml += term.name;
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
                    // Consider using a more user-friendly notification instead of alert
                    console.error('เกิดข้อผิดพลาดในการโหลด Tag:', response.data?.message || 'Unknown error');
                    $('.ckan-modal-tags').html('<p>เกิดข้อผิดพลาดในการโหลด Tag</p>'); // Show error in modal
                    // alert('เกิดข้อผิดพลาดในการโหลด Tag'); // Avoid using alert
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Log detailed error information
                console.error('AJAX Error:', textStatus, errorThrown);
                $('.ckan-modal-tags').html('<p>เกิดข้อผิดพลาดในการเชื่อมต่อ</p>'); // Show error in modal
                // alert('เกิดข้อผิดพลาดในการเชื่อมต่อ'); // Avoid using alert
            }
        });
    });

    // ปิด modal เมื่อคลิกปุ่มปิด
    // Use event delegation on a static parent if modal content is dynamic
    $(document).on('click', '.ckan-modal-close', function() {
        $('#ckan-tag-modal').hide();
    });

    // ปิด modal เมื่อคลิกนอกพื้นที่ modal
    $(window).on('click', function(event) {
        // Check if the click target is the modal background itself
        if ($(event.target).is('#ckan-tag-modal')) {
            $('#ckan-tag-modal').hide();
        }
    });

    // สลับการเลือกเมื่อคลิกที่ tag ใน modal
    // Use event delegation
    $(document).on('click', '.ckan-modal-tag', function() {
        $(this).toggleClass('selected');
    });

    // จัดการคลิกปุ่มบันทึก
    $('.ckan-save-tags-btn').on('click', function() {
        const postId = $('#ckan-tag-modal').data('post-id'); // Use const
        const selectedTermIds = []; // Use const, array contents can change

        // เก็บ ID ของ terms ที่เลือกทั้งหมด
        $('.ckan-modal-tag.selected').each(function() {
            // Ensure data attribute exists and push the value
             const termId = $(this).data('term-id');
             if (termId !== undefined) {
                selectedTermIds.push(termId);
             }
        });

        // อัพเดต terms ของโพสต์ผ่าน AJAX
        $.ajax({
            url: ckanTagData.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_update_post_terms',
                nonce: ckanTagData.nonce,
                post_id: postId,
                term_ids: selectedTermIds // Send the array
            },
            beforeSend: function() {
                // Disable button to prevent multiple clicks
                $('.ckan-save-tags-btn').prop('disabled', true).text('กำลังบันทึก...');
            },
            success: function(response) {
                if (response.success) {
                    let tagsHtml = ''; // Use let
                    const terms = response.data.terms || []; // Use const, default to empty array

                    // Generate HTML for the updated tags list
                    // Use map and join for a more concise way to build HTML string
                    if (terms.length > 0) {
                       tagsHtml = terms.map(term =>
                           `<span class="ckan-tag" data-term-id="${term.id}">${term.name}</span>`
                       ).join('');
                    } else {
                        tagsHtml = '<p>ไม่มี Tag ที่เลือก</p>'; // Or appropriate message
                    }


                    // Find the correct container for the post's tags and update it
                    // This might need adjustment based on your actual HTML structure
                    // Assuming there's a container specific to the post, e.g., using postId
                     $(`.ckan-tags-list[data-post-id="${postId}"]`).html(tagsHtml); // Example selector


                    // ปิด modal
                    $('#ckan-tag-modal').hide();
                } else {
                     console.error('เกิดข้อผิดพลาดในการบันทึก Tag:', response.data?.message || 'Unknown error');
                     alert('เกิดข้อผิดพลาด: ' + (response.data?.message || 'ไม่สามารถบันทึก Tag ได้')); // Provide feedback
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 console.error('AJAX Error:', textStatus, errorThrown);
                 alert('เกิดข้อผิดพลาดในการเชื่อมต่อ'); // Provide feedback
            },
            complete: function() {
                // Re-enable button regardless of success or error
                $('.ckan-save-tags-btn').prop('disabled', false).text('บันทึก');
            }
        });
    });
});
