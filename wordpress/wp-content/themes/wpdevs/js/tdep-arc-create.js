jQuery(document).ready(function($) {
    // DOM Elements
    const modal = $('#tdep-modal');
    const modalContent = $('.tdep-modal-content');
    const createBtn = $('#tdep-create-btn');
    const closeBtn = $('.tdep-close');
    const form = $('#tdep-arc-create-form');
    const nameInput = $('#tdep-name');
    const slugInput = $('#tdep-slug');
    const submitBtn = form.find('button[type="submit"]');

    // แสดง Loading
    function showLoading() {
        const loadingHTML = '<div class="tdep-loading-overlay"><div class="tdep-spinner"></div></div>';
        modalContent.append(loadingHTML);
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');
    }

    // ซ่อน Loading
    function hideLoading() {
        $('.tdep-loading-overlay').remove();
        submitBtn.prop('disabled', false).text('บันทึก');
    }

    // แสดงข้อความ Error
    function showMessage(title, text, icon = 'error') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: text,
                icon: icon,
                confirmButtonColor: '#007bff'
            });
        } else {
            alert(text);
        }
    }

    // ดึงข้อมูล Slug URL ล่าสุด
    async function fetchLatestSlug() {
        try {
            showLoading();
            const response = await $.ajax({
                url: tdepArcAjax.ajax_url,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'tdep_arc_preview_slug',
                    security: tdepArcAjax.security
                }
            });

            hideLoading();
            
            if (response.success && response.data.slug) {
                slugInput.val(response.data.slug);
            } else {
                showMessage('ข้อผิดพลาด', response.data.message || 'ไม่สามารถดึงข้อมูล Slug URL ได้');
            }
        } catch (error) {
            hideLoading();
            console.error('Error fetching slug:', error);
            showMessage('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    }

    // เปิด Modal
    createBtn.on('click', function(e) {
        e.preventDefault();
        modal.fadeIn(300);
        nameInput.val('');
        fetchLatestSlug();
    });

    // ปิด Modal
    function closeModal() {
        modal.fadeOut(300);
        form[0].reset();
        hideLoading();
    }

    closeBtn.on('click', closeModal);

    // ปิด Modal เมื่อคลิกพื้นหลัง
    $(window).on('click', function(e) {
        if ($(e.target).is(modal)) {
            closeModal();
        }
    });

    // จัดการการ Submit Form
    form.on('submit', async function(e) {
        e.preventDefault();
        
        const name = nameInput.val().trim();
        const slug = slugInput.val().trim();

        if (!name) {
            showMessage('ข้อผิดพลาด', 'กรุณากรอกชื่อหมวดหมู่');
            return;
        }

        showLoading();

        try {
            const response = await $.ajax({
                url: tdepArcAjax.ajax_url,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'tdep_arc_create_category',
                    security: tdepArcAjax.security,
                    name: name,
                    slug: slug
                }
            });

            if (response.success) {
                showMessage('สำเร็จ', 'สร้างหมวดหมู่เรียบร้อยแล้ว', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                hideLoading();
                showMessage('ข้อผิดพลาด', response.data.message || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่');
            }
        } catch (error) {
            hideLoading();
            console.error('Error creating category:', error);
            showMessage('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    });

    // ปิด Modal ด้วย ESC
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && modal.is(':visible')) {
            closeModal();
        }
    });
});