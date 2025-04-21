jQuery(document).ready(function($) {

    // --- Helper Functions ---

    /**
     * Shows a notification message temporarily.
     * @param {string} message The message to display.
     */
    function showNotification(message) {
        // สร้าง notification element
        const notification = $('<div class="ckan-notification">' + message + '</div>');
        $('body').append(notification);

        // แสดง notification (ใช้ timeout เล็กน้อยเพื่อให้ CSS transition ทำงาน)
        setTimeout(() => {
            notification.addClass('show');
            // ตั้งเวลาซ่อนและลบ notification
            scheduleNotificationRemoval(notification);
        }, 10); // Delayเล็กน้อยเพื่อให้ browser render ก่อน add class 'show'
    }

    /**
     * Schedules the hiding and removal of a notification element.
     * @param {jQuery} notificationElement The notification element to remove.
     */
    function scheduleNotificationRemoval(notificationElement) {
        const hideDelay = 3000; // เวลาที่แสดง notification (ms)
        const removeDelay = 300; // เวลาสำหรับ fade out transition (ms)

        // ซ่อน notification หลังจาก hideDelay
        setTimeout(() => {
            notificationElement.removeClass('show');
            // ลบ notification ออกจาก DOM หลังจาก transition จบ
            removeNotificationAfterDelay(notificationElement, removeDelay);
        }, hideDelay);
    }

    /**
     * Removes the notification element from the DOM after a delay.
     * @param {jQuery} notificationElement The notification element to remove.
     * @param {number} delay The delay before removal (ms).
     */
    function removeNotificationAfterDelay(notificationElement, delay) {
        setTimeout(() => {
            notificationElement.remove();
        }, delay);
    }

    /**
     * Initializes a custom select element (placeholder for libraries like Select2).
     */
    function initCustomSelect() {
        // ปรับแต่ง select หากต้องการ (สามารถเพิ่ม plugin เช่น Select2 หรือ Chosen)
        // Example: $('#ckan-corg-select').select2();
    }

    /**
     * Populates the organization select dropdown.
     * @param {Array} terms Array of term objects {id, name, selected}.
     */
    function populateCorgSelect(terms) {
        let optionsHtml = '<option value="">-- เลือกองค์กร --</option>';
        if (terms && terms.length > 0) {
            terms.forEach(term => {
                const selected = term.selected ? ' selected="selected"' : '';
                optionsHtml += `<option value="${term.id}"${selected}>${term.name}</option>`;
            });
        }
        $('#ckan-corg-select').html(optionsHtml);
        initCustomSelect(); // Re-initialize custom select if needed
    }

    /**
     * Updates the displayed organization name on the page.
     * @param {string|null} termName The name of the organization or null/empty.
     */
    function updateDisplayedCorgName(termName) {
        const $corgNameElement = $('.ckan-corg-name'); // Cache selector
        if (termName) {
            $corgNameElement.text(termName).removeClass('ckan-corg-empty');
        } else {
            $corgNameElement.text('ยังไม่มีข้อมูลองค์กร').addClass('ckan-corg-empty');
        }
    }

    // --- AJAX Handlers ---

    /**
     * Handles the success response for getting CORG terms.
     * @param {object} response The AJAX success response.
     * @param {number} postId The ID of the post being edited.
     */
    function handleGetTermsSuccess(response, postId) {
        if (response.success) {
            populateCorgSelect(response.data.terms);
            // เก็บ post ID ไว้ใน modal เพื่อใช้ต่อ
            $('#ckan-corg-modal').data('post-id', postId);
            // แสดง modal ด้วย animation
            $('#ckan-corg-modal').fadeIn(300);
        } else {
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลองค์กร: ' + (response.data.message || 'Unknown error'));
            $('#ckan-corg-select').html('<option value="">-- ไม่สามารถโหลด --</option>'); // Update select on error
        }
    }

    /**
     * Handles the success response for updating the post's CORG term.
     * @param {object} response The AJAX success response.
     */
    function handleUpdateTermSuccess(response) {
        if (response.success) {
            updateDisplayedCorgName(response.data.term_name);
            showNotification(response.data.message || 'อัพเดตข้อมูลสำเร็จ');
            $('#ckan-corg-modal').fadeOut(200); // ปิด modal
        } else {
            alert('เกิดข้อผิดพลาดในการอัพเดต: ' + (response.data.message || 'Unknown error'));
        }
    }

    /**
     * Handles AJAX errors.
     */
    function handleAjaxError() {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }

    // --- Event Handlers ---

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
                handleGetTermsSuccess(response, postId);
            },
            error: handleAjaxError
        });
    });

    // ปิด modal เมื่อคลิกปุ่มปิด หรือ คลิกนอกพื้นที่ modal
    $(document).on('click', '.ckan-modal-close', function() {
        $('#ckan-corg-modal').fadeOut(200);
    });
    $(window).on('click', function(event) {
        // Check if the click is exactly on the modal background
        if ($(event.target).is('#ckan-corg-modal')) {
            $('#ckan-corg-modal').fadeOut(200);
        }
    });

    // จัดการคลิกปุ่มอัพเดต
    $('.ckan-update-corg-btn').on('click', function() {
        const postId = $('#ckan-corg-modal').data('post-id');
        const termId = $('#ckan-corg-select').val();
        const $updateButton = $(this); // Cache button selector

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
                $updateButton.prop('disabled', true).addClass('loading').text('กำลังอัพเดต...');
            },
            success: handleUpdateTermSuccess,
            error: handleAjaxError,
            complete: function() {
                $updateButton.prop('disabled', false).removeClass('loading').text('อัพเดตข้อมูล');
            }
        });
    });

});
