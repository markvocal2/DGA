/**
 * category-editor.js
 * Handles interactions for the category editor modal, including
 * loading, adding, editing, deleting categories, and managing images via WP Media Library.
 */

/**
 * Displays a notification message on the screen.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of notification ('success', 'error', 'warning').
 */
function showNotification(message, type = 'success') {
    // Ensure jQuery is available
    if (typeof jQuery === 'undefined') {
        console.error("jQuery is not available for showNotification.");
        return;
    }
    const $ = jQuery; // Use jQuery alias

    // Basic validation
    if (!message || typeof message !== 'string') {
        console.error("Invalid message provided to showNotification.");
        return;
    }
    const validTypes = ['success', 'error', 'warning', 'info']; // Added 'info' as a possibility
    const notificationType = validTypes.includes(type) ? type : 'info'; // Default to 'info' if type is invalid

    // Remove existing notification to prevent stacking
    $('.category-editor-notification').remove();

    // Create notification element
    const notification = $(`
        <div class="notification category-editor-notification ${notificationType}">
             <span class="notification-message">${message}</span>
             <button class="notification-close" title="Close">&times;</button>
        </div>
    `); // Added a close button

    $('body').append(notification);

    // Add close button functionality
    notification.find('.notification-close').on('click', function() {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300); // Match fade-out duration
    });

    // Show notification with animation (slight delay to ensure rendering)
    setTimeout(() => {
        notification.addClass('show');
    }, 50); // Reduced delay

    // Auto remove notification after 5 seconds (increased duration for readability)
    const autoRemoveTimeout = setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300); // Animation duration before removal
    }, 5000); // 5 seconds

    // Clear auto-remove if closed manually
    notification.find('.notification-close').on('click', function() {
        clearTimeout(autoRemoveTimeout);
    });
}


jQuery(document).ready(function($) {
    // --- Cache DOM Elements ---
    const $modal = $('#categoryModal');
    const $categoriesGrid = $('#categoriesGrid');
    const $addCategoryForm = $('#addCategoryForm');
    const $openEditorBtn = $('#openCategoryEditor');
    const $closeModalBtn = $('.close-modal'); // Cache close button selector

    // --- State Variables ---
    let mediaFrame; // Stores the WP Media frame instance

    // --- Helper Functions ---

    /**
     * Formats file size from bytes to a readable string.
     * @param {number} bytes - The file size in bytes.
     * @returns {string} Formatted file size (e.g., "1.23 MB").
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; // Added TB
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        // Ensure index is within bounds
        const index = Math.min(i, sizes.length - 1);
        return parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index];
    }

    /**
     * Validates an image file based on type and size.
     * @param {File} file - The file object to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    function validateImage(file) {
        if (!file) return false;

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Added webp
        if (!validTypes.includes(file.type)) {
            showNotification('กรุณาเลือกไฟล์รูปภาพที่มีนามสกุล .jpg, .png, .gif หรือ .webp เท่านั้น', 'error');
            return false;
        }

        // Check file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showNotification(`ขนาดไฟล์ต้องไม่เกิน ${formatFileSize(maxSize)}`, 'error');
            return false;
        }

        return true;
    }

    /**
     * Initializes tooltips for dynamically added elements within the grid.
     * Requires Bootstrap's tooltip component or similar.
     */
    function initTooltips() {
        // Ensure tooltip function exists
        if ($.fn.tooltip) {
            // Remove existing tooltips first to prevent duplicates
            $categoriesGrid.find('.category-controls button, .image-controls button').tooltip('dispose');

            // Initialize new tooltips
            $categoriesGrid.find('.category-controls button, .image-controls button').each(function() {
                const $button = $(this);
                const title = $button.attr('title');
                if (title) {
                    $button.tooltip({
                        title: title,
                        placement: 'top',
                        trigger: 'hover',
                        container: 'body' // Append tooltip to body to avoid layout issues
                    });
                }
            });
        } else {
            console.warn("Tooltip function not found. Skipping tooltip initialization.");
        }
    }

    /**
     * Appends a category card to the grid.
     * @param {object} category - The category data object.
     */
    function appendCategoryCard(category) {
        // Basic validation of category data
        if (!category || typeof category !== 'object' || !category.id || !category.name) {
            console.error("Invalid category data provided to appendCategoryCard:", category);
            return;
        }

        const imageUrl = category.image || ''; // Default to empty string if no image
        const imageId = category.image_id || ''; // Default to empty string if no image ID

        const cardHtml = `
            <div class="category-card" data-id="${category.id}">
                <div class="category-info">
                    <h3 class="category-name">${$('<div>').text(category.name).html()}</h3> <p class="category-slug">Slug: ${$('<div>').text(category.slug || 'N/A').html()}</p> </div>
                <div class="category-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${$('<div>').text(category.name).html()}">` : '<div class="no-image">No Image</div>'}
                    <div class="image-controls">
                        <button class="change-image-btn" data-card-id="${category.id}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                        ${imageUrl ? `<button class="remove-image-btn" data-card-id="${category.id}" title="ลบรูปภาพ"><i class="fas fa-trash"></i></button>` : ''} </div>
                </div>
                <div class="category-controls">
                    <button class="edit-category-btn" title="แก้ไขหมวดหมู่"><i class="fas fa-edit"></i></button>
                    <button class="delete-category-btn" title="ลบหมวดหมู่"><i class="fas fa-trash"></i></button>
                </div>
                <form class="edit-form hidden">
                    <div class="form-group">
                        <label for="edit-name-${category.id}">ชื่อหมวดหมู่:</label>
                        <input type="text" id="edit-name-${category.id}" name="name" value="${$('<div>').text(category.name).html()}" data-original-value="${$('<div>').text(category.name).html()}" required>
                    </div>
                    <input type="hidden" name="image_id" class="category-image-id" value="">
                    <input type="hidden" name="current_image_id" value="${imageId}">
                    <div class="form-controls">
                        <button type="submit" class="save-btn">บันทึก</button>
                        <button type="button" class="cancel-btn">ยกเลิก</button>
                    </div>
                </form>
            </div>
        `;
        $categoriesGrid.append(cardHtml);
    }

    /**
     * Loads categories from the server via AJAX and displays them.
     */
    function loadCategories() {
        $categoriesGrid.html(''); // Clear existing content immediately

        // Add skeleton loading placeholders
        for (let i = 0; i < 6; i++) {
            $categoriesGrid.append(`
                <div class="category-card skeleton">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text short"></div>
                </div>
            `);
        }

        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'get_tdep_categories',
                nonce: categoryEditorAjax.nonce
            },
            success: function(response) {
                $categoriesGrid.empty(); // Clear skeletons
                if (response.success && Array.isArray(response.data)) {
                    if (response.data.length > 0) {
                        response.data.forEach(appendCategoryCard);
                        initTooltips(); // Initialize tooltips after cards are added
                    } else {
                        $categoriesGrid.html('<div class="no-categories"><p>ไม่พบหมวดหมู่ คุณสามารถเพิ่มหมวดหมู่ใหม่ได้ด้านบน</p></div>');
                    }
                } else {
                    showNotification(response.data?.message || 'ไม่สามารถโหลดหมวดหมู่ได้', 'error');
                    $categoriesGrid.html('<div class="no-categories error"><p>เกิดข้อผิดพลาดในการโหลดหมวดหมู่</p></div>');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX Error loading categories:", textStatus, errorThrown);
                $categoriesGrid.empty(); // Clear skeletons
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อขณะโหลดหมวดหมู่', 'error');
                $categoriesGrid.html('<div class="no-categories error"><p>เกิดข้อผิดพลาดในการเชื่อมต่อ</p></div>');
            }
        });
    }

    /**
     * Opens the WP Media frame for selecting an image.
     * @param {Function} onSelectCallback - Function to execute when an image is selected.
     */
    function openMediaFrame(onSelectCallback) {
        // If the media frame already exists, reopen it.
        if (mediaFrame) {
            mediaFrame.open();
            return;
        }

        // Create the media frame.
        mediaFrame = wp.media({
            title: 'เลือกหรืออัพโหลดรูปภาพหมวดหมู่', // More descriptive title
            button: {
                text: 'ใช้รูปภาพนี้'
            },
            library: { // Specify image library
                type: 'image'
            },
            multiple: false // Only allow single selection
        });

        // When an image is selected, run the callback.
        mediaFrame.on('select', function() {
            // Get the selected attachment details.
            const attachment = mediaFrame.state().get('selection').first().toJSON();
            if (typeof onSelectCallback === 'function') {
                onSelectCallback(attachment);
            }
        });

        // Finally, open the modal.
        mediaFrame.open();
    }

    // --- Event Handlers ---

    // Open modal
    $openEditorBtn.on('click', function() {
        $modal.addClass('active');
        $('body').addClass('modal-open'); // Prevent body scroll
        loadCategories(); // Load categories when modal opens
    });

    // Close modal via button
    $closeModalBtn.on('click', function() {
        $modal.removeClass('active');
        $('body').removeClass('modal-open');
    });

    // Close modal via overlay click
    $modal.on('click', function(e) { // Attach to modal itself
        if ($(e.target).is($modal)) { // Check if the click target IS the modal background
            $modal.removeClass('active');
            $('body').removeClass('modal-open');
        }
    });

    // --- Add New Category ---

    // Handle image selection for the "Add New Category" form
    $addCategoryForm.find('.change-image-btn').on('click', function(e) {
        e.preventDefault();
        openMediaFrame(function(attachment) {
            // Validate the selected image (optional, WP media usually handles this)
            // if (!validateImage(attachment)) return; // Attachment might not be a File object here

            // Update preview
            $addCategoryForm.find('.preview-image').html(`
                <img src="${attachment.sizes?.thumbnail?.url || attachment.url}" alt="ตัวอย่าง" style="max-width: 150px; height: auto; display: block; margin-top: 5px;">
                <button type="button" class="remove-new-image-btn" title="ลบรูปภาพนี้">×</button>
            `); // Added remove button

            // Update hidden input
            $addCategoryForm.find('input[name="image_id"]').val(attachment.id);
        });
    });

     // Handle image removal for the "Add New Category" form
    $addCategoryForm.on('click', '.remove-new-image-btn', function() {
        $addCategoryForm.find('.preview-image').empty();
        $addCategoryForm.find('input[name="image_id"]').val('');
    });


    // Handle form submission for adding a new category
    $addCategoryForm.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');
        const name = $form.find('input[name="name"]').val().trim();
        const imageId = $form.find('input[name="image_id"]').val();

        if (!name) {
            showNotification('กรุณาระบุชื่อหมวดหมู่', 'error');
            $form.find('input[name="name"]').focus();
            return;
        }

        // Show loading state
        $submitBtn.prop('disabled', true).html('<span class="spinner"></span> กำลังเพิ่ม...'); // Added spinner class possibility

        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'add_tdep_category',
                nonce: categoryEditorAjax.nonce,
                name: name,
                image_id: imageId
            },
            success: function(response) {
                if (response.success) {
                    showNotification(response.data?.message || 'เพิ่มหมวดหมู่เรียบร้อยแล้ว', 'success');
                    $form[0].reset(); // Reset form fields
                    $form.find('.preview-image').empty(); // Clear preview
                    $form.find('input[name="image_id"]').val(''); // Clear hidden input
                    loadCategories(); // Reload the category list
                } else {
                    showNotification(response.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่', 'error');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: function() {
                // Restore button state
                $submitBtn.prop('disabled', false).text('เพิ่มหมวดหมู่');
            }
        });
    });

    // --- Edit Existing Category (Event Delegation) ---

    // Handle clicking the "Edit" button on a category card
    $categoriesGrid.on('click', '.edit-category-btn', function() {
        const $card = $(this).closest('.category-card');
        // Reset any other editing cards first
        $categoriesGrid.find('.category-card.editing').each(function() {
            const $otherCard = $(this);
            $otherCard.removeClass('editing');
            $otherCard.find('.edit-form').addClass('hidden');
            $otherCard.find('.category-info').removeClass('hidden');
            // Optional: Reset input value to original if needed
             const $nameInput = $otherCard.find('.edit-form input[name="name"]');
             $nameInput.val($nameInput.data('original-value'));
        });
        // Show edit form for the clicked card
        $card.addClass('editing');
        $card.find('.edit-form').removeClass('hidden');
        $card.find('.category-info').addClass('hidden');
        $card.find('.edit-form input[name="name"]').focus(); // Focus the name input
    });

    // Handle clicking the "Cancel" button in the edit form
    $categoriesGrid.on('click', '.cancel-btn', function() {
        const $card = $(this).closest('.category-card');
        const $form = $card.find('.edit-form');
        const $nameInput = $form.find('input[name="name"]');

        // Reset name to original value
        $nameInput.val($nameInput.data('original-value'));

        // Hide form, show info
        $card.removeClass('editing');
        $form.addClass('hidden');
        $card.find('.category-info').removeClass('hidden');
    });

    // Handle image change for an existing category card
    $categoriesGrid.on('click', '.change-image-btn', function(e) {
        e.preventDefault();
        const $button = $(this);
        const $card = $button.closest('.category-card');
        const cardId = $card.data('id');

        openMediaFrame(function(attachment) {
            const newImageUrl = attachment.sizes?.thumbnail?.url || attachment.url;
            const newImageId = attachment.id;

            // Show loading/spinner state on the image area maybe?
            const $imageContainer = $card.find('.category-image');
            $imageContainer.addClass('loading'); // Add a class for styling

            // AJAX request to update just the image
            $.ajax({
                url: categoryEditorAjax.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'update_tdep_category',
                    nonce: categoryEditorAjax.nonce,
                    term_id: cardId,
                    image_id: newImageId // Send the new image ID
                },
                success: function(response) {
                    if (response.success) {
                        // Update image preview on success
                        $imageContainer.html(`
                            <img src="${newImageUrl}" alt="${$('<div>').text($card.find('.category-name').text()).html()}">
                            <div class="image-controls">
                                <button class="change-image-btn" data-card-id="${cardId}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                                <button class="remove-image-btn" data-card-id="${cardId}" title="ลบรูปภาพ"><i class="fas fa-trash"></i></button> </div>
                        `);
                        // Update the hidden field storing the *current* image ID for the form
                        $card.find('input[name="current_image_id"]').val(newImageId);
                         // Clear the 'newly selected' image ID field in the edit form if it's open
                        $card.find('input[name="image_id"]').val('');
                        showNotification('อัพเดตรูปภาพเรียบร้อยแล้ว', 'success');
                        initTooltips(); // Re-init tooltips for the new buttons
                    } else {
                        showNotification(response.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตรูปภาพ', 'error');
                    }
                },
                error: function() {
                    showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อขณะอัพเดตรูปภาพ', 'error');
                },
                complete: function() {
                     $imageContainer.removeClass('loading'); // Remove loading state
                }
            });
        });
    });


    // Handle image removal for an existing category card
    $categoriesGrid.on('click', '.remove-image-btn', function(e) {
        e.preventDefault();
        const $button = $(this);
        const $card = $button.closest('.category-card');
        const cardId = $card.data('id');

        // Confirmation dialog
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้?')) {
            return;
        }

        const $imageContainer = $card.find('.category-image');
        $imageContainer.addClass('loading'); // Add loading state

        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'update_tdep_category', // Use the update action
                nonce: categoryEditorAjax.nonce,
                term_id: cardId,
                remove_image: true // Send flag to remove image
            },
            success: function(response) {
                if (response.success) {
                    // Update UI to show "No Image"
                    $imageContainer.html(`
                        <div class="no-image">No Image</div>
                        <div class="image-controls">
                            <button class="change-image-btn" data-card-id="${cardId}" title="เปลี่ยนรูปภาพ"><i class="fas fa-camera"></i></button>
                            </div>
                    `);
                    // Clear the hidden input storing the *current* image ID
                    $card.find('input[name="current_image_id"]').val('');
                    // Clear the 'newly selected' image ID field in the edit form if it's open
                    $card.find('input[name="image_id"]').val('');
                    showNotification('ลบรูปภาพเรียบร้อยแล้ว', 'success');
                    initTooltips(); // Re-init tooltips for the remaining button
                } else {
                    showNotification(response.data?.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ', 'error');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อขณะลบรูปภาพ', 'error');
            },
            complete: function() {
                $imageContainer.removeClass('loading'); // Remove loading state
            }
        });
    });


    // Handle submission of the edit form
    $categoriesGrid.on('submit', '.edit-form', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $card = $form.closest('.category-card');
        const cardId = $card.data('id');
        const $nameInput = $form.find('input[name="name"]');
        const $submitBtn = $form.find('.save-btn');

        const originalName = $nameInput.data('original-value');
        const newName = $nameInput.val().trim();
        // Note: Image is updated via separate AJAX calls on button clicks, not during name save.
        // We only need to potentially update the name here.

        if (!newName) {
            showNotification('ชื่อหมวดหมู่ต้องไม่ว่างเปล่า', 'error');
            $nameInput.focus();
            return;
        }

        // Only send AJAX if the name has actually changed
        if (newName === originalName) {
            // If name hasn't changed, just close the edit form
            $card.removeClass('editing');
            $form.addClass('hidden');
            $card.find('.category-info').removeClass('hidden');
            // showNotification('ไม่มีการเปลี่ยนแปลงชื่อ', 'info'); // Optional info message
            return;
        }

        $submitBtn.prop('disabled', true).html('<span class="spinner"></span> กำลังบันทึก...');

        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'update_tdep_category',
                nonce: categoryEditorAjax.nonce,
                term_id: cardId,
                name: newName // Only send the name
                // Image ID is handled separately by its own button/AJAX call
            },
            success: function(response) {
                if (response.success) {
                    // Update the displayed name and the original value data attribute
                    $card.find('.category-name').text(response.data.new_name || newName);
                    $nameInput.data('original-value', response.data.new_name || newName);
                    $nameInput.val(response.data.new_name || newName); // Ensure input matches saved value

                    // Close the edit form
                    $card.removeClass('editing');
                    $form.addClass('hidden');
                    $card.find('.category-info').removeClass('hidden');

                    showNotification('บันทึกชื่อหมวดหมู่เรียบร้อยแล้ว', 'success');
                } else {
                    showNotification(response.data?.message || 'เกิดข้อผิดพลาดในการบันทึกชื่อ', 'error');
                    // Optionally revert input value on failure
                    // $nameInput.val(originalName);
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อขณะบันทึกชื่อ', 'error');
                 // Optionally revert input value on failure
                 // $nameInput.val(originalName);
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text('บันทึก');
            }
        });
    });


    // --- Delete Category (Event Delegation) ---

    $categoriesGrid.on('click', '.delete-category-btn', function() {
        const $button = $(this);
        const $card = $button.closest('.category-card');
        const cardId = $card.data('id');
        const categoryName = $card.find('.category-name').text(); // Get name for confirmation message

        // Confirmation dialog
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${categoryName}"?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }

        // Add visual indication of deletion in progress
        $card.addClass('deleting');
        // Disable buttons on the card during delete
        $card.find('button').prop('disabled', true);

        $.ajax({
            url: categoryEditorAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'delete_tdep_category',
                nonce: categoryEditorAjax.nonce,
                term_id: cardId
            },
            success: function(response) {
                if (response.success) {
                    // Remove the card from the DOM with animation
                    $card.fadeOut(300, function() {
                        $(this).remove();
                        showNotification(`ลบหมวดหมู่ "${categoryName}" เรียบร้อยแล้ว`, 'success');

                        // Check if any categories remain
                        if ($categoriesGrid.find('.category-card').length === 0) {
                            $categoriesGrid.html('<div class="no-categories"><p>ไม่พบหมวดหมู่ คุณสามารถเพิ่มหมวดหมู่ใหม่ได้ด้านบน</p></div>');
                        }
                    });
                } else {
                    // Deletion failed, remove deleting state and re-enable buttons
                    $card.removeClass('deleting');
                    $card.find('button').prop('disabled', false);
                    showNotification(response.data?.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่', 'error');
                }
            },
            error: function() {
                 // Deletion failed, remove deleting state and re-enable buttons
                $card.removeClass('deleting');
                $card.find('button').prop('disabled', false);
                showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อขณะลบหมวดหมู่', 'error');
            }
            // No 'complete' needed here as success handles removal, error handles restoration
        });
    });

}); // End jQuery(document).ready
