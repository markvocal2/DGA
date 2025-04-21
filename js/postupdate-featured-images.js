/**
 * JavaScript สำหรับการแก้ไข Featured Image ของโพสต์ด้วย AJAX (PostUpdate)
 * Version: 1.0.1 (Refactored for reduced nesting)
 */
(function($) {
    'use strict';

    // สร้างตัวแปรสำหรับเก็บข้อมูลการอัพโหลด (ควรเป็น instance-specific ถ้ามีหลายอันในหน้าเดียว)
    // For simplicity, using global-like vars, but consider scoping per instance if needed.
    let currentFile = null;
    let currentAttachmentId = null;

    // --- Helper Functions ---

    /**
     * แสดงข้อความสถานะ
     * @param {jQuery} $statusMsg Element ที่จะแสดงข้อความ
     * @param {string} message ข้อความ
     * @param {string} [type] ประเภทข้อความ ('success' หรือ 'error')
     */
    function showStatus($statusMsg, message, type) {
        console.log('Status:', message, type);
        $statusMsg.removeClass('is-success is-error').empty();
        if (type) {
            $statusMsg.addClass('is-' + type);
        }
        $statusMsg.text(message).show(); // Ensure it's visible
    }

    /**
     * ซ่อนข้อความสถานะ
     * @param {jQuery} $statusMsg Element ที่จะซ่อนข้อความ
     */
    function hideStatus($statusMsg) {
         $statusMsg.hide().empty().removeClass('is-success is-error');
    }


    /**
     * ดึง attachment ID จาก URL (ถ้าเป็นไปได้)
     * @param {string} url URL ของรูปภาพ
     * @returns {number|null} Attachment ID หรือ null ถ้าไม่พบ
     */
    function getAttachmentIdFromUrl(url) {
        if (!url) return null;
        console.log('Attempting to get attachment ID from URL:', url);
        // Example matching common WP upload paths, adjust if needed
        const matches = url.match(/\/uploads\/.*?(\d{4}\/\d{2}\/)?(?:id_(\d+)_)?.*\.(?:jpe?g|png|gif|webp)/i);
        if (matches && matches[2]) { // Check group 2 for potential ID like id_123_
            return parseInt(matches[2], 10);
        }
        // Add other patterns if necessary
        return null;
    }

    /**
     * ตั้งเวลาสำหรับ Reload หน้าเว็บ
     * @param {number} delay ระยะเวลา (ms) ก่อน reload
     */
    function schedulePageReload(delay = 1500) {
         console.log(`Scheduling page reload in ${delay}ms`);
         setTimeout(() => {
             window.location.reload();
         }, delay);
    }


    // --- Modal Functions ---

    /**
     * เปิด Modal พร้อม animation
     * @param {jQuery} $modal Modal element
     */
    function openModal($modal) {
        console.log('Opening modal');
        $('body').addClass('postupdate-modal-open');
        $modal.css({
            'display': 'flex',
            'opacity': '0'
        }).attr('aria-hidden', 'false');

        // Force reflow before adding transition class/styles if needed
        // $modal.height();

        setTimeout(() => { // Use timeout to allow display:flex to apply before transition
            $modal.css('opacity', '1');
            $modal.find('.postupdate-modal-container').css('transform', 'scale(1)');
            // Focus the first focusable element or title after transition
            setTimeout(() => {
                 $modal.find('.postupdate-modal-title, button, input, [tabindex]').not('[tabindex="-1"]').first().focus();
            }, 300); // Adjust timing based on transition duration
        }, 50); // Small delay
    }

    /**
     * ปิด Modal พร้อม animation
     * @param {jQuery} $modal Modal element
     */
    function closeModal($modal) {
        console.log('Closing modal');
        $modal.css('opacity', '0');
        $modal.find('.postupdate-modal-container').css('transform', 'scale(0.9)');
        $('body').removeClass('postupdate-modal-open');

        setTimeout(() => {
            $modal.css('display', 'none').attr('aria-hidden', 'true');
             // Reset status message inside modal on close
             hideStatus($modal.find('.postupdate-status'));
             // Optionally reset progress bar
             $modal.find('.postupdate-progress-wrap').hide();
             $modal.find('.postupdate-progress-bar').css('width', '0%');
        }, 300); // Match transition duration
    }

    // --- Upload and Update Functions ---

    /**
     * จัดการกับการเลือกไฟล์ (จาก input หรือ drag/drop)
     * @param {Event} e Event object
     * @param {jQuery} $uploadZone พื้นที่อัพโหลด
     * @param {jQuery} $uploadPreview พื้นที่แสดงตัวอย่าง
     * @param {jQuery} $updateBtn ปุ่มอัพเดต
     * @param {jQuery} $statusMsg พื้นที่แสดงสถานะ
     */
    function handleFileSelect(e, $uploadZone, $uploadPreview, $updateBtn, $statusMsg) {
        const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
        if (!file) {
            console.log('No file selected or event structure incorrect');
            return;
        }

        console.log('File selected:', file.name, file.type);
        hideStatus($statusMsg); // Clear previous status

        if (!file.type.match('image.*')) {
            showStatus($statusMsg, postupdateData?.strings?.invalid_file || 'กรุณาเลือกไฟล์ภาพเท่านั้น', 'error');
            return;
        }

        // Reset global vars for the new file
        currentFile = file;
        currentAttachmentId = null; // Reset attachment ID until upload completes

        const reader = new FileReader();
        reader.onload = function(event) {
            console.log('File preview loaded');
            $uploadPreview.find('img').attr('src', event.target.result).data('attachment-id', null); // Clear old ID
            $uploadPreview.show();
            $uploadZone.addClass('has-preview');
            $updateBtn.prop('disabled', true); // Disable update until upload finishes

            // Upload immediately to get attachment ID
            uploadToMediaLibrary(file, $uploadZone, $statusMsg, (attachmentId) => {
                if (attachmentId) {
                    console.log('Attachment ID received:', attachmentId);
                    currentAttachmentId = attachmentId;
                    $updateBtn.prop('disabled', false); // Enable update button now
                     // Store ID on the image element if needed elsewhere
                    $uploadPreview.find('img').data('attachment-id', attachmentId);
                } else {
                    // Handle upload failure within uploadToMediaLibrary
                     $updateBtn.prop('disabled', true); // Keep disabled if upload failed
                }
            });
        };
        reader.onerror = function() {
             console.error("FileReader error");
             showStatus($statusMsg, postupdateData?.strings?.file_read_error || 'ไม่สามารถอ่านไฟล์ได้', 'error');
        };
        reader.readAsDataURL(file);
    }

    /**
     * อัพโหลดไฟล์ไปยัง WordPress Media Library ผ่าน AJAX handler ของเรา
     * @param {File} file ไฟล์ที่จะอัพโหลด
     * @param {jQuery} $uploadZone พื้นที่อัพโหลด (สำหรับ progress bar)
     * @param {jQuery} $statusMsg พื้นที่แสดงสถานะ
     * @param {function(number|null)} callback ฟังก์ชันที่จะเรียกเมื่ออัพโหลดเสร็จ (ส่ง attachment ID หรือ null)
     */
    function uploadToMediaLibrary(file, $uploadZone, $statusMsg, callback) {
        console.log('Uploading to media library via custom handler');
        const ajax_url = postupdateData?.ajax_url || ajaxurl || '/wp-admin/admin-ajax.php';
        const nonce = postupdateData?.nonce || '';

        if (!ajax_url || !nonce) {
             console.error('AJAX URL or Nonce is missing for upload.');
             showStatus($statusMsg, postupdateData?.strings?.config_error || 'ตั้งค่า AJAX ไม่ถูกต้อง', 'error');
             callback(null);
             return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'postupdate_handle_file_upload');
        formData.append('_wpnonce', nonce);

        const $progressWrap = $uploadZone.find('.postupdate-progress-wrap');
        const $progressBar = $uploadZone.find('.postupdate-progress-bar');
        $progressBar.css('width', '0%'); // Reset progress
        $progressWrap.show();
        showStatus($statusMsg, postupdateData?.strings?.uploading || 'กำลังอัพโหลด...', ''); // Neutral status

        $.ajax({
            url: ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json', // Expect JSON
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        $progressBar.css('width', percent + '%');
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                $progressWrap.hide();
                console.log('Upload response:', response);
                if (response && response.success && response.data && response.data.id) {
                    showStatus($statusMsg, postupdateData?.strings?.upload_success || 'อัพโหลดไฟล์สำเร็จ', 'success');
                    // Update preview with potentially optimized URL from server
                    if (response.data.url) {
                         $uploadZone.find('.postupdate-upload-preview img').attr('src', response.data.url);
                    }
                    callback(response.data.id); // Pass the ID back
                } else {
                    const errorMsg = (response && response.data && response.data.message)
                                   ? response.data.message
                                   : (postupdateData?.strings?.upload_error || 'เกิดข้อผิดพลาดในการอัพโหลด');
                    showStatus($statusMsg, errorMsg, 'error');
                    callback(null); // Indicate failure
                    // Optionally try WP Media Uploader as fallback here if needed
                    // tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback);
                }
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', status, error);
                $progressWrap.hide();
                let errorMsg = postupdateData?.strings?.upload_error || 'เกิดข้อผิดพลาดในการอัพโหลด';
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.data && response.data.message) {
                        errorMsg += ': ' + response.data.message;
                    } else {
                        errorMsg += ': ' + error;
                    }
                } catch (e) { errorMsg += ': ' + error; }
                showStatus($statusMsg, errorMsg, 'error');
                callback(null); // Indicate failure
                 // Optionally try WP Media Uploader as fallback here if needed
                 // tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback);
            }
        });
    }

    /**
     * ลองใช้ WordPress Media API สำหรับอัพโหลด (วิธีสำรอง - อาจไม่จำเป็นถ้า AJAX handler ทำงานได้ดี)
     */
    function tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback) {
        if (typeof wp === 'undefined' || !wp.media) {
            console.warn('WordPress Media API not available.');
            // Provide a mock ID only if in debug mode and explicitly needed for testing flow
            if (postupdateData?.debug_mode) {
                 const mockId = Date.now(); // Simple timestamp as mock ID
                 console.log('Debug mode: Using mock attachment ID:', mockId);
                 callback(mockId);
            } else {
                 callback(null); // Indicate failure properly
            }
            return;
        }

        console.log('Trying WordPress Media API (requires user interaction)');
        showStatus($statusMsg, postupdateData?.strings?.use_media_lib || 'กำลังเปิด Media Library...', '');

        // This approach relies on the standard WP media uploader flow
        // It might not be suitable for automatic background upload
        // Consider if this fallback is truly desired or if fixing the AJAX handler is better.

        // Placeholder: This needs a more robust implementation if used.
        // Typically involves creating a media frame, handling selection etc.
        // For now, just log and provide mock ID in debug.
         if (postupdateData?.debug_mode) {
             const mockId = Date.now();
             console.log('Debug mode: Using mock attachment ID from WP Media API attempt:', mockId);
             callback(mockId);
         } else {
             callback(null);
         }
    }

    /**
     * อัพเดต Featured Image ของโพสต์
     */
    function updateFeaturedImage($progressWrap, $progressBar, $statusMsg, postId, $modal) {
        console.log('Updating featured image for post ID:', postId);

        // Use the currentAttachmentId obtained from uploadToMediaLibrary
        if (!currentAttachmentId) {
             // Check if there's an existing image ID (user didn't upload a new one)
            const $img = $modal.find('.postupdate-upload-preview img');
            const existingId = $img.data('attachment-id');
            if (existingId) {
                 currentAttachmentId = existingId;
                 console.log('Using existing attachment ID:', currentAttachmentId);
            } else {
                console.error('No attachment ID available (new file not uploaded/failed, or no existing image).');
                showStatus($statusMsg, postupdateData?.strings?.no_file_selected || 'ไม่มีภาพที่เลือกหรืออัพโหลด', 'error');
                return;
            }
        }


        const processingMsg = postupdateData?.strings?.processing || 'กำลังประมวลผล...';
        showStatus($statusMsg, processingMsg, ''); // Neutral status
        $progressBar.css('width', '0%'); // Reset progress
        $progressWrap.show(); // Show progress indicator

        const ajax_url = postupdateData?.ajax_url || ajaxurl || '/wp-admin/admin-ajax.php';
        const nonce = postupdateData?.nonce || '';

        if (!ajax_url || !nonce) {
             console.error('AJAX URL or Nonce is missing for update.');
             showStatus($statusMsg, postupdateData?.strings?.config_error || 'ตั้งค่า AJAX ไม่ถูกต้อง', 'error');
             $progressWrap.hide();
             return;
        }


        // Simulate progress for the update step
        $progressBar.animate({ width: '50%' }, 200);

        $.ajax({
            url: ajax_url,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'postupdate_set_featured_image',
                post_id: postId,
                attachment_id: currentAttachmentId,
                nonce: nonce // Use the correct nonce key if different
            },
            success: function(response) {
                $progressBar.animate({ width: '100%' }, 100, function() {
                    $progressWrap.hide();
                    if (response && response.success) {
                        console.log('Update success:', response);
                        showStatus($statusMsg, postupdateData?.strings?.update_success || 'อัพเดตภาพหน้าปกสำเร็จ', 'success');
                        // Update the main featured image display outside the modal
                        const $mainImageWrap = $(`.postupdate-featured-wrap[data-post-id="${postId}"] .postupdate-featured-image`);
                        if ($mainImageWrap.length && response.data && response.data.new_image_html) {
                             $mainImageWrap.html(response.data.new_image_html);
                        }
                        // Close modal after a short delay
                        setTimeout(() => closeModal($modal), 1000);
                         // Optionally reload if necessary, but updating in place is better UX
                         // schedulePageReload(1500);
                    } else {
                        const errorMsg = (response && response.data && response.data.message)
                                       ? response.data.message
                                       : (postupdateData?.strings?.update_error || 'เกิดข้อผิดพลาดในการอัพเดต');
                        showStatus($statusMsg, errorMsg, 'error');
                    }
                });
            },
            error: function(xhr, status, error) {
                 console.error('Update error:', status, error);
                 $progressWrap.hide();
                 showStatus($statusMsg, postupdateData?.strings?.update_error || 'เกิดข้อผิดพลาดในการอัพเดต', 'error');
            }
        });
    }


    // --- Remove Image Functions (Refactored) ---

     /**
     * Handles the successful response after removing the featured image.
     * @param {jQuery} $statusMsg The status message element.
     */
    function handleRemoveSuccess($statusMsg) {
        showStatus($statusMsg, postupdateData?.strings?.remove_success || 'ลบภาพหน้าปกสำเร็จ', 'success');
        schedulePageReload(1500); // Reload after success message
    }

    /**
     * Simulates success and reloads the page (for debug mode).
     * @param {jQuery} $statusMsg The status message element.
     */
    function simulateSuccessAndReload($statusMsg) {
         console.log('Debug mode: Simulating success despite error');
         // Show simulation message first
         setTimeout(() => {
             showStatus($statusMsg, 'ทดสอบ: ลบภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...', 'success');
             // Then schedule the reload
             schedulePageReload(1500);
         }, 1000); // Delay before showing simulation message
    }


    /**
     * Handles errors during the remove image AJAX call.
     * @param {jQuery} $statusMsg The status message element.
     * @param {object|string|null} responseData Response data or error string.
     */
    function handleRemoveError($statusMsg, responseData) {
        const errorMsg = (responseData && typeof responseData === 'object' && responseData.message)
                       ? responseData.message
                       : (typeof responseData === 'string' ? responseData : (postupdateData?.strings?.remove_error || 'เกิดข้อผิดพลาดในการลบภาพหน้าปก'));
        showStatus($statusMsg, errorMsg, 'error');

        // Simulate success in debug mode if configured
        if (postupdateData?.debug_mode) {
            simulateSuccessAndReload($statusMsg);
        }
    }


    /**
     * ลบ Featured Image ของโพสต์
     */
    function removeImage($uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId) {
        console.log('Removing featured image for post ID:', postId);

        // --- UI Reset ---
        $uploadPreview.find('img').attr('src', '');
        $uploadPreview.hide();
        $uploadZone.removeClass('has-preview');
        currentFile = null;
        currentAttachmentId = null;
        $updateBtn.prop('disabled', true);
        hideStatus($statusMsg); // Clear status initially

        // --- AJAX Call (if postId exists) ---
        if (postId) {
            const ajax_url = postupdateData?.ajax_url || ajaxurl || '/wp-admin/admin-ajax.php';
            const nonce = postupdateData?.nonce || '';

            if (!ajax_url || !nonce) {
                 console.error('AJAX URL or Nonce is missing for remove.');
                 showStatus($statusMsg, postupdateData?.strings?.config_error || 'ตั้งค่า AJAX ไม่ถูกต้อง', 'error');
                 return;
            }

            showStatus($statusMsg, postupdateData?.strings?.removing || 'กำลังลบภาพหน้าปก...', ''); // Neutral status

            $.ajax({
                url: ajax_url,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'postupdate_remove_featured_image',
                    post_id: postId,
                    nonce: nonce // Use the correct nonce key if different
                },
                success: function(response) {
                    console.log('Remove response:', response);
                    if (response && response.success) {
                        handleRemoveSuccess($statusMsg);
                    } else {
                        handleRemoveError($statusMsg, response ? response.data : null);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Remove error:', status, error);
                    handleRemoveError($statusMsg, `AJAX Error: ${error}`);
                }
                // No 'complete' needed here unless re-enabling buttons etc.
            });
        } else {
            // If no postId, just confirm removal from preview
            showStatus($statusMsg, postupdateData?.strings?.preview_removed || 'ลบภาพออกจากตัวอย่างแล้ว', 'success');
        }
    }


    // --- Initialization ---

    /**
     * ตั้งค่าสำหรับรูปภาพที่มีอยู่แล้วเมื่อโหลดหน้า
     */
    function initializeExistingImage($uploadPreview, $uploadZone, $updateBtn) {
        const $img = $uploadPreview.find('img');
        const currentImageSrc = $img.attr('src');

        if (currentImageSrc && $uploadPreview.is(':visible')) {
            $uploadZone.addClass('has-preview');
            $updateBtn.prop('disabled', false); // Enable update if image exists

            // Try to get existing attachment ID
            const attachmentId = $img.data('attachment-id') || getAttachmentIdFromUrl(currentImageSrc);
            if (attachmentId) {
                 console.log('Found existing attachment ID on init:', attachmentId);
                 // Store it globally or on the element for later use if needed
                 $img.data('attachment-id', attachmentId);
                 // Set the global var only if needed for immediate update without re-upload
                 // currentAttachmentId = attachmentId;
            }
        } else {
             $updateBtn.prop('disabled', true); // Disable if no image
        }
    }

    /**
     * ตั้งค่า Event Listeners สำหรับ Modal
     */
    function setupModalEvents($openBtn, $closeBtn, $cancelBtn, $modal) {
        $openBtn.on('click', (e) => { e.preventDefault(); openModal($modal); });
        $closeBtn.on('click', (e) => { e.preventDefault(); closeModal($modal); });
        $cancelBtn.on('click', (e) => { e.preventDefault(); closeModal($modal); });

        // Close on overlay click
        $modal.on('click', function(e) {
            if ($(e.target).is($modal)) { // Check if the click is directly on the modal overlay
                closeModal($modal);
            }
        });

        // Close on Escape key
        // Use a single delegated handler for better performance if many modals exist
        // $(document).on('keydown.postupdateModal', function(e) { ... });
        // For simplicity, assuming one modal or few modals:
         $(document).on('keydown', function(e) {
             if ((e.key === 'Escape' || e.key === 'Esc') && $modal.is(':visible')) {
                 closeModal($modal);
             }
         });
    }

    /**
     * ตั้งค่า Event Listeners สำหรับการอัพโหลดไฟล์ (Click, Change)
     */
    function setupUploadEvents($uploadPrompt, $uploadZone, $fileInput, $uploadPreview, $updateBtn, $statusMsg) {
        // Trigger file input click
        $uploadPrompt.add($uploadZone).on('click', function(e) {
             // Prevent triggering if clicking on preview or remove button
            if (!$(e.target).closest('.postupdate-upload-preview, .postupdate-remove-image').length) {
                 e.preventDefault();
                 $fileInput.trigger('click');
            }
        });

        // Handle file selection
        $fileInput.on('change', function(e) {
            handleFileSelect(e, $uploadZone, $uploadPreview, $updateBtn, $statusMsg);
            // Reset input value to allow selecting the same file again
            $(this).val('');
        });
    }

    /**
     * ตั้งค่า Drag & Drop Events
     */
    function setupDragAndDropEvents($uploadZone, $uploadPreview, $updateBtn, $statusMsg) {
        $uploadZone.on({
            dragenter: function(e) {
                e.preventDefault(); e.stopPropagation(); $(this).addClass('is-dragover');
            },
            dragover: function(e) {
                e.preventDefault(); e.stopPropagation(); $(this).addClass('is-dragover'); // Keep class while over
            },
            dragleave: function(e) {
                e.preventDefault(); e.stopPropagation();
                 // Check if leaving to a child element before removing class
                 if (!$(e.relatedTarget).closest($uploadZone).length) {
                     $(this).removeClass('is-dragover');
                 }
            },
            drop: function(e) {
                e.preventDefault(); e.stopPropagation();
                $(this).removeClass('is-dragover');
                const files = e.originalEvent?.dataTransfer?.files;
                if (files && files.length) {
                    // Simulate file selection event object
                    handleFileSelect({ target: { files: files } }, $uploadZone, $uploadPreview, $updateBtn, $statusMsg);
                }
            }
        });
    }

    /**
     * ตั้งค่า Event สำหรับปุ่มลบรูปภาพ
     */
    function setupRemoveButtonEvent($removeBtn, $uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId) {
        $removeBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent triggering upload zone click
            const confirmMsg = postupdateData?.strings?.confirm_delete || 'คุณต้องการลบภาพนี้ใช่หรือไม่?';
            if (window.confirm(confirmMsg)) { // Use window.confirm for simplicity
                removeImage($uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId);
            }
        });
    }

    /**
     * ตั้งค่า Event สำหรับปุ่มอัพเดตรูปภาพ
     */
    function setupUpdateButtonEvent($updateBtn, $progressWrap, $progressBar, $statusMsg, postId, $modal) {
        $updateBtn.on('click', function(e) {
            e.preventDefault();
            updateFeaturedImage($progressWrap, $progressBar, $statusMsg, postId, $modal);
        });
    }

    /**
     * ตั้งค่า event handlers สำหรับแต่ละ instance ของ image updater
     */
    function setupImageUpdaterInstance() {
        const $wrapper = $(this);
        // Prevent double initialization
        if ($wrapper.data('postupdate-initialized')) {
            return;
        }

        const $modal = $wrapper.find('.postupdate-modal');
        const $openBtn = $wrapper.find('.postupdate-featured-btn');
        const $closeBtn = $wrapper.find('.postupdate-modal-close');
        const $cancelBtn = $wrapper.find('.postupdate-cancel-btn');
        const $updateBtn = $wrapper.find('.postupdate-update-btn');
        const $uploadZone = $wrapper.find('.postupdate-upload-zone');
        const $fileInput = $wrapper.find('.postupdate-file-input');
        const $removeBtn = $wrapper.find('.postupdate-remove-image');
        const $uploadPrompt = $wrapper.find('.postupdate-upload-prompt');
        const $uploadPreview = $wrapper.find('.postupdate-upload-preview');
        const $progressWrap = $wrapper.find('.postupdate-progress-wrap');
        const $progressBar = $wrapper.find('.postupdate-progress-bar');
        const $statusMsg = $wrapper.find('.postupdate-status');
        const postId = $wrapper.data('post-id');

        if (!postId) {
             console.error('Post ID missing for wrapper:', $wrapper);
             return;
        }
        if (!$modal.length || !$openBtn.length /* ... add checks for other essential elements */) {
             console.error('Essential elements missing within wrapper for post ID:', postId);
             return;
        }

        console.log('Initializing postupdate for post ID:', postId);

        initializeExistingImage($uploadPreview, $uploadZone, $updateBtn);
        setupModalEvents($openBtn, $closeBtn, $cancelBtn, $modal);
        setupUploadEvents($uploadPrompt, $uploadZone, $fileInput, $uploadPreview, $updateBtn, $statusMsg);
        setupDragAndDropEvents($uploadZone, $uploadPreview, $updateBtn, $statusMsg);
        setupRemoveButtonEvent($removeBtn, $uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId);
        setupUpdateButtonEvent($updateBtn, $progressWrap, $progressBar, $statusMsg, postId, $modal);

        $wrapper.data('postupdate-initialized', true); // Mark as initialized
    }

    /**
     * เริ่มต้นการทำงานของ featured image updater ทั้งหมดในหน้า
     */
    function initFeaturedImageUpdater() {
        const $wrappers = $('.postupdate-featured-wrap');
        if ($wrappers.length === 0) {
            if (postupdateData?.debug_mode) {
                 console.log('PostUpdate Featured Images: No .postupdate-featured-wrap elements found.');
            }
            return;
        }
        if (postupdateData?.debug_mode) {
             console.log(`PostUpdate Featured Images: Found ${$wrappers.length} wrapper elements.`);
        }
        $wrappers.each(setupImageUpdaterInstance);
    }

    // --- Document Ready ---
    // Check ajaxurl definition
    if (typeof ajaxurl === 'undefined' && typeof postupdateData !== 'undefined' && postupdateData.ajax_url) {
        window.ajaxurl = postupdateData.ajax_url; // Define globally if needed elsewhere
    }

    initFeaturedImageUpdater();

    if (postupdateData?.debug_mode) {
        console.log('PostUpdate Featured Images: Script loaded and initialized.');
    }

})(jQuery);
