// /js/category-editor.js

// Global notification function
function showNotification(message, type = 'success') {
    const notification = jQuery(`
        <div class="notification ${type}">
            ${message}
        </div>
    `);
    
    jQuery('body').append(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.addClass('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

jQuery(document).ready(function($) {
    const modal = $('#categoryModal');
    const categoriesGrid = $('#categoriesGrid');
    let file_frame;
    
    // Open modal
    $('#openCategoryEditor').on('click', function() {
        modal.addClass('active');
        loadCategories();
    });
    
    // Close modal
    $('.close-modal').on('click', function() {
        modal.removeClass('active');
    });
    
    // Close on outside click
    $(window).on('click', function(e) {
        if ($(e.target).is(modal)) {
            modal.removeClass('active');
        }
    });
    
    // Load categories
    function loadCategories() {
        categoriesGrid.html(''); // Clear existing content
        
        // Add skeleton loading
        for (let i = 0; i < 6; i++) {
            categoriesGrid.append(`
                <div class="category-card skeleton">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-text"></div>
                </div>
            `);
        }
        
        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_tdep_categories',
                nonce: categoryEditorAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    categoriesGrid.empty();
                    response.data.forEach(function(category) {
                        appendCategoryCard(category);
                    });
                }
            }
        });
    }
    
    // Append category card
    function appendCategoryCard(category) {
        const card = $(`
            <div class="category-card" data-id="${category.id}">
                <div class="category-info">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-slug">Slug: ${category.slug}</p>
                </div>
                <div class="category-image">
                    ${category.image ? `<img src="${category.image}" alt="${category.name}">` : '<div class="no-image">No Image</div>'}
                    <div class="image-controls">
                        <button class="change-image-btn" data-card-id="${category.id}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                        <button class="remove-image-btn" data-card-id="${category.id}" title="ลบรูปภาพ"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="category-controls">
                    <button class="edit-category-btn" title="แก้ไขหมวดหมู่"><i class="fas fa-edit"></i></button>
                    <button class="delete-category-btn" title="ลบหมวดหมู่"><i class="fas fa-trash"></i></button>
                </div>
                <form class="edit-form hidden">
                    <div class="form-group">
                        <label>ชื่อหมวดหมู่:</label>
                        <input type="text" name="name" value="${category.name}" data-original-value="${category.name}" required>
                    </div>
                    <input type="hidden" name="image_id" class="category-image-id" value="">
                    <input type="hidden" name="current_image_id" value="${category.image_id || ''}">
                    <div class="form-controls">
                        <button type="submit" class="save-btn">บันทึก</button>
                        <button type="button" class="cancel-btn">ยกเลิก</button>
                    </div>
                </form>
            </div>
        `);
        
        categoriesGrid.append(card);
    }
    
    // Handle new category image upload
    $('#addCategoryForm .change-image-btn').on('click', function(e) {
        e.preventDefault();
        
        if (file_frame) {
            file_frame.open();
            return;
        }
        
        file_frame = wp.media({
            title: 'เลือกรูปภาพหมวดหมู่',
            button: {
                text: 'ใช้รูปภาพนี้'
            },
            multiple: false
        });
        
        file_frame.on('select', function() {
            const attachment = file_frame.state().get('selection').first().toJSON();
            
            // Update preview
            $('#addCategoryForm .preview-image').html(`
                <img src="${attachment.url}" alt="" style="max-width: 200px; height: auto;">
            `);
            
            // Update hidden input
            $('#addCategoryForm input[name="image_id"]').val(attachment.id);
        });
        
        file_frame.open();
    });
    
    // Add new category
    $('#addCategoryForm').on('submit', function(e) {
        e.preventDefault();
        const form = $(this);
        const submitBtn = form.find('button[type="submit"]');
        const name = form.find('input[name="name"]').val();
        const imageId = form.find('input[name="image_id"]').val();
        
        if (!name || name.trim() === '') {
            showNotification('กรุณาระบุชื่อหมวดหมู่', 'error');
            return;
        }
        
        // แสดง loading state
        submitBtn.prop('disabled', true).text('กำลังเพิ่มหมวดหมู่...');
        
        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'add_tdep_category',
                nonce: categoryEditorAjax.nonce,
                name: name,
                image_id: imageId
            },
            success: function(response) {
                if (response.success) {
                    showNotification(response.data.message, 'success');
                    form[0].reset();
                    form.find('.preview-image').empty();
                    form.find('input[name="image_id"]').val('');
                    loadCategories();
                } else {
                    showNotification(response.data.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่', 'error');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text('เพิ่มหมวดหมู่');
            }
        });
    });
    
    // Handle image upload for existing categories
    $(document).on('click', '.change-image-btn', function(e) {
        e.preventDefault();
        const cardId = $(this).data('card-id');
        const card = $(this).closest('.category-card');
        
        if (file_frame) {
            file_frame.open();
            return;
        }
        
        file_frame = wp.media({
            title: 'เลือกรูปภาพหมวดหมู่',
            button: {
                text: 'ใช้รูปภาพนี้'
            },
            multiple: false
        });
        
        file_frame.on('select', function() {
            const attachment = file_frame.state().get('selection').first().toJSON();
            
            // Update image preview
            card.find('.category-image').html(`
                <img src="${attachment.url}" alt="">
                <div class="image-controls">
                    <button class="change-image-btn" data-card-id="${cardId}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                    <button class="remove-image-btn" data-card-id="${cardId}" title="ลบรูปภาพ"><i class="fas fa-trash"></i></button>
                </div>
            `);
            
            // Update hidden input
            card.find('.category-image-id').val(attachment.id);
            
            // Send AJAX request to update image
            $.ajax({
                url: categoryEditorAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'update_tdep_category',
                    nonce: categoryEditorAjax.nonce,
                    term_id: cardId,
                    image_id: attachment.id
                },
                success: function(response) {
                    if (response.success) {
                        showNotification('อัพเดตรูปภาพเรียบร้อยแล้ว', 'success');
                    }
                }
            });
        });
        
        file_frame.open();
    });
    
    // Remove image
    $(document).on('click', '.remove-image-btn', function(e) {
        e.preventDefault();
        const cardId = $(this).data('card-id');
        const card = $(this).closest('.category-card');
        
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้?')) return;
        
        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_tdep_category',
                nonce: categoryEditorAjax.nonce,
                term_id: cardId,
                remove_image: true
            },
            success: function(response) {
                if (response.success) {
                    card.find('.category-image').html(`
                        <div class="no-image">No Image</div>
                        <div class="image-controls">
                            <button class="change-image-btn" data-card-id="${cardId}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                            <button class="remove-image-btn" data-card-id="${cardId}" title="ลบรูปภาพ"><i class="fas fa-trash"></i></button>
                        </div>
                    `);
                    card.find('.category-image-id').val('');
                    showNotification('ลบรูปภาพเรียบร้อยแล้ว', 'success');
                }
            }
        });
    });
    
    // Edit category handlers
    $(document).on('click', '.edit-category-btn', function() {
        const card = $(this).closest('.category-card');
        card.addClass('editing');
        card.find('.edit-form').removeClass('hidden');
        card.find('.category-info').addClass('hidden');
    });
    
    $(document).on('click', '.cancel-btn', function() {
        const card = $(this).closest('.category-card');
        card.removeClass('editing');
        card.find('.edit-form').addClass('hidden');
        card.find('.category-info').removeClass('hidden');
    });
    
    // Update category
    $(document).on('submit', '.edit-form', function(e) {
        e.preventDefault();
        const card = $(this).closest('.category-card');
        const form = $(this);
        const nameInput = form.find('input[name="name"]');
        const imageIdInput = form.find('.category-image-id');
        const currentImageId = form.find('input[name="current_image_id"]').val();
        const formData = new FormData();
        
        formData.append('action', 'update_tdep_category');
        formData.append('nonce', categoryEditorAjax.nonce);
        formData.append('term_id', card.data('id'));
        
        if (nameInput.val() !== nameInput.data('original-value')) {
            formData.append('name', nameInput.val());
        }
        
        const newImageId = imageIdInput.val();
        if (newImageId) {
            formData.append('image_id', newImageId);
        } else if (currentImageId) {
            formData.append('image_id', currentImageId);
        }
        
        const submitBtn = form.find('.save-btn');
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    if (response.data.name_updated) {
                        card.find('.category-name').text(response.data.new_name);
                        nameInput.data('original-value', response.data.new_name);
                    }
                    
                    if (response.data.image_updated) {
                        card.find('.category-image img').attr('src', response.data.new_image_url);
                    }
                    
                    if (response.data.image_removed) {
                        card.find('.category-image').html('<div class="no-image">No Image</div>');
                    }
                    
                    card.removeClass('editing');
                    form.addClass('hidden');
                    card.find('.category-info').removeClass('hidden');
                    
                    showNotification('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว', 'success');
                } else {
                    showNotification(response.data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text('บันทึก');
            }
        });
    });
    
    // Delete category
    $(document).on('click', '.delete-category-btn', function() {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
            return;
        }
        
        const card = $(this).closest('.category-card');
        const categoryName = card.find('.category-name').text();
        
        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_tdep_category',
                nonce: categoryEditorAjax.nonce,
                term_id: card.data('id')
            },
            beforeSend: function() {
                card.addClass('deleting');
            },
            success: function(response) {
                if (response.success) {
                    card.fadeOut(300, function() {
                        $(this).remove();
                        showNotification(`ลบหมวดหมู่ "${categoryName}" เรียบร้อยแล้ว`, 'success');
                        
                        // ถ้าไม่มีหมวดหมู่เหลือ แสดงข้อความ
                        if ($('.category-card').length === 0) {
                            categoriesGrid.html(`
                                <div class="no-categories">
                                    <p>ไม่พบหมวดหมู่</p>
                                    <p>คุณสามารถเพิ่มหมวดหมู่ใหม่ได้ด้านบน</p>
                                </div>
                            `);
                        }
                    });
                } else {
                    card.removeClass('deleting');
                    showNotification(response.data.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่', 'error');
                }
            },
            error: function() {
                card.removeClass('deleting');
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            }
        });
    });

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper function to validate image before upload
    function validateImage(file) {
        // ตรวจสอบประเภทไฟล์
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showNotification('กรุณาเลือกไฟล์รูปภาพที่มีนามสกุล .jpg, .png หรือ .gif เท่านั้น', 'error');
            return false;
        }

        // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showNotification(`ขนาดไฟล์ต้องไม่เกิน ${formatFileSize(maxSize)}`, 'error');
            return false;
        }

        return true;
    }

    // Add tooltips for controls
    function initTooltips() {
        $('.change-image-btn, .remove-image-btn, .edit-category-btn, .delete-category-btn').each(function() {
            const title = $(this).attr('title');
            if (title) {
                $(this).tooltip({
                    title: title,
                    placement: 'top',
                    trigger: 'hover',
                    container: 'body'
                });
            }
        });
    }

    // Initialize tooltips on page load
    initTooltips();

    // Re-initialize tooltips after loading categories
    // แก้ไขส่วนที่มีปัญหา
    $(document).ajaxComplete(function(event, xhr, settings) {
        // ตรวจสอบว่า settings.data เป็นประเภทข้อมูลอะไร
        if (settings.data) {
            // กรณีเป็น string
            if (typeof settings.data === 'string' && settings.data.indexOf('action=get_tdep_categories') !== -1) {
                initTooltips();
            }
            // กรณีเป็น FormData object
            else if (settings.data instanceof FormData) {
                const action = settings.data.get('action');
                if (action === 'get_tdep_categories') {
                    initTooltips();
                }
            }
            // กรณีเป็น object ทั่วไป
            else if (typeof settings.data === 'object' && settings.data.action === 'get_tdep_categories') {
                initTooltips();
            }
        }
    });
});