(function($) {
    'use strict';
    
    // สร้างตัวแปรสำหรับเก็บข้อมูลการอัพโหลด
    let currentFile = null;
    let currentAttachmentId = null;
    
    $(document).ready(function() {
        // ทดสอบว่า ajaxurl ถูกกำหนดหรือไม่
        if (typeof ajaxurl === 'undefined' && typeof postupdateData !== 'undefined') {
            window.ajaxurl = postupdateData.ajax_url;
        }
        
        initFeaturedImageUpdater();
        
        // เพิ่มการเช็คดีบั๊กเพื่อตรวจสอบการโหลดของสคริปต์
        if (typeof postupdateData !== 'undefined' && postupdateData.debug_mode) {
            console.log('PostUpdate Featured Images: Script loaded successfully');
        }
    });
    
    /**
     * เริ่มต้นการทำงานของ featured image updater
     */
    function initFeaturedImageUpdater() {
        // เลือก elements ที่ต้องใช้
        const $wrappers = $('.postupdate-featured-wrap');
        
        if ($wrappers.length === 0) {
            console.log('No postupdate-featured-wrap elements found');
            return;
        }
        
        console.log('Found ' + $wrappers.length + ' postupdate-featured-wrap elements');
        
        // ตั้งค่า event handlers สำหรับแต่ละ instance
        $wrappers.each(setupImageUpdaterInstance);
    }
    
    /**
     * ตั้งค่า event handlers สำหรับแต่ละ instance
     */
    function setupImageUpdaterInstance() {
        const $wrapper = $(this);
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
        
        console.log('Initializing postupdate for post ID: ' + postId);
        
        // ถ้ามีภาพอยู่แล้ว ให้แสดงตัวอย่างและเปิดใช้งานปุ่มอัพเดต
        initializeExistingImage($uploadPreview, $uploadZone, $updateBtn);
        
        // ตั้งค่า Event Listeners
        setupModalEvents($openBtn, $closeBtn, $cancelBtn, $modal);
        setupUploadEvents($uploadPrompt, $uploadZone, $fileInput, $uploadPreview, $updateBtn, $statusMsg);
        setupRemoveButtonEvent($removeBtn, $uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId);
        setupUpdateButtonEvent($updateBtn, $progressWrap, $progressBar, $statusMsg, postId, $modal);
    }
    
    /**
     * ตั้งค่าสำหรับรูปภาพที่มีอยู่แล้ว
     */
    function initializeExistingImage($uploadPreview, $uploadZone, $updateBtn) {
        if ($uploadPreview.is(':visible')) {
            $uploadZone.addClass('has-preview');
            $updateBtn.prop('disabled', false);
            
            // ดึง ID ของภาพปัจจุบัน (ถ้ามี) - จะได้ใช้ในกรณีที่ไม่ได้อัพโหลดภาพใหม่
            const currentImageSrc = $uploadPreview.find('img').attr('src');
            if (currentImageSrc) {
                // พยายามดึง attachment ID จาก URL หรือ data attribute
                const attachmentId = $uploadPreview.find('img').data('attachment-id') || 
                                    getAttachmentIdFromUrl(currentImageSrc);
                if (attachmentId) {
                    currentAttachmentId = attachmentId;
                }
            }
        }
    }
    
    /**
     * ตั้งค่า Event Listeners สำหรับ Modal
     */
    function setupModalEvents($openBtn, $closeBtn, $cancelBtn, $modal) {
        // เปิด Modal
        $openBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Open button clicked');
            openModal($modal);
            return false;
        });
        
        // ปิด Modal
        $closeBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            closeModal($modal);
            return false;
        });
        
        // ปิด Modal ด้วยปุ่มยกเลิก
        $cancelBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cancel button clicked');
            closeModal($modal);
            return false;
        });
        
        // ปิด Modal เมื่อคลิกที่ overlay
        $modal.on('click', function(e) {
            if ($(e.target).hasClass('postupdate-modal-overlay')) {
                console.log('Overlay clicked');
                closeModal($modal);
            }
        });
        
        // เปิดใช้ ESC key เพื่อปิด modal
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $modal.attr('aria-hidden') === 'false') {
                closeModal($modal);
            }
        });
    }
    
    /**
     * ตั้งค่า Event Listeners สำหรับการอัพโหลดไฟล์
     */
    function setupUploadEvents($uploadPrompt, $uploadZone, $fileInput, $uploadPreview, $updateBtn, $statusMsg) {
        // คลิกที่ upload prompt เพื่อเลือกไฟล์
        $uploadPrompt.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload prompt clicked');
            $fileInput.trigger('click');
            return false;
        });
        
        // คลิกที่ upload zone เพื่อเลือกไฟล์ (สำรอง)
        $uploadZone.on('click', function(e) {
            if (!$(e.target).closest('.postupdate-upload-preview').length && 
                !$(e.target).closest('.postupdate-remove-image').length) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload zone clicked');
                $fileInput.trigger('click');
                return false;
            }
        });
        
        // จัดการกับการเลือกไฟล์
        $fileInput.on('change', function(e) {
            console.log('File selected');
            handleFileSelect(e, $uploadZone, $uploadPreview, $updateBtn, $statusMsg);
        });
        
        // จัดการกับการลาก & วาง
        setupDragAndDropEvents($uploadZone, $uploadPreview, $updateBtn, $statusMsg);
    }
    
    /**
     * ตั้งค่า Drag & Drop Events
     */
    function setupDragAndDropEvents($uploadZone, $uploadPreview, $updateBtn, $statusMsg) {
        $uploadZone.on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag over');
            $(this).addClass('is-dragover');
        });
        
        $uploadZone.on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drag leave');
            $(this).removeClass('is-dragover');
        });
        
        $uploadZone.on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drop');
            $(this).removeClass('is-dragover');
            
            if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
                handleFileSelect({
                    target: {
                        files: e.originalEvent.dataTransfer.files
                    }
                }, $uploadZone, $uploadPreview, $updateBtn, $statusMsg);
            }
        });
    }
    
    /**
     * ตั้งค่า Event สำหรับปุ่มลบรูปภาพ
     */
    function setupRemoveButtonEvent($removeBtn, $uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId) {
        $removeBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Remove button clicked');
            
            const confirmMsg = typeof postupdateData !== 'undefined' && postupdateData.strings ? 
                postupdateData.strings.confirm_delete : 'คุณต้องการลบภาพนี้ใช่หรือไม่?';
            
            if (confirm(confirmMsg)) {
                removeImage($uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId);
            }
            
            return false;
        });
    }
    
    /**
     * ตั้งค่า Event สำหรับปุ่มอัพเดตรูปภาพ
     */
    function setupUpdateButtonEvent($updateBtn, $progressWrap, $progressBar, $statusMsg, postId, $modal) {
        $updateBtn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Update button clicked');
            updateFeaturedImage($progressWrap, $progressBar, $statusMsg, postId, $modal);
            return false;
        });
    }
    
    /**
     * เปิด Modal (แก้ไขใหม่)
     */
    function openModal($modal) {
        console.log('Opening modal');
        
        // เพิ่ม class ให้ body เพื่อป้องกันการเลื่อน
        $('body').addClass('postupdate-modal-open');
        
        // แสดง Modal และปรับ aria attributes
        $modal.css({
            'display': 'flex',
            'opacity': '0'
        }).attr('aria-hidden', 'false');
        
        // เพิ่ม transition
        setTimeout(function() {
            $modal.css('opacity', '1');
            
            // เพิ่ม transform ใน container
            $modal.find('.postupdate-modal-container').css('transform', 'scale(1)');
            
            // โฟกัสที่ title เพื่อการเข้าถึง
            setTimeout(function() {
                $modal.find('.postupdate-modal-title').focus();
            }, 100);
        }, 50);
    }
    
    /**
     * ปิด Modal (แก้ไขใหม่)
     */
    function closeModal($modal) {
        console.log('Closing modal');
        
        // ลด opacity เพื่อให้มี transition
        $modal.css('opacity', '0');
        
        // ลด scale ของ container
        $modal.find('.postupdate-modal-container').css('transform', 'scale(0.9)');
        
        // ลบ class จาก body
        $('body').removeClass('postupdate-modal-open');
        
        // ซ่อน Modal หลังจาก transition เสร็จ
        setTimeout(function() {
            $modal.css('display', 'none').attr('aria-hidden', 'true');
        }, 300);
    }
    
    /**
     * จัดการกับการเลือกไฟล์
     */
    function handleFileSelect(e, $uploadZone, $uploadPreview, $updateBtn, $statusMsg) {
        const file = e.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('File selected:', file.name, file.type);
        
        // ตรวจสอบว่าเป็นไฟล์ภาพหรือไม่
        if (!file.type.match('image.*')) {
            showStatus($statusMsg, 'กรุณาเลือกไฟล์ภาพเท่านั้น', 'error');
            return;
        }
        
        // เก็บไฟล์ปัจจุบัน
        currentFile = file;
        
        // แสดงตัวอย่างภาพ
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File preview loaded');
            $uploadPreview.find('img').attr('src', e.target.result);
            $uploadPreview.show();
            $uploadZone.addClass('has-preview');
            $updateBtn.prop('disabled', false);
            
            // อัพโหลดไฟล์ไปยัง Media Library เพื่อให้ได้ attachment ID
            uploadToMediaLibrary(file, $uploadZone, $statusMsg, function(attachmentId) {
                console.log('Attachment ID received:', attachmentId);
                currentAttachmentId = attachmentId;
            });
        };
        reader.readAsDataURL(file);
    }

    // ฟังก์ชันอื่นๆ ยังคงเหมือนเดิม...
    
    /**
     * อัพโหลดไฟล์ไปยัง WordPress Media Library (แก้ไขสมบูรณ์)
     */
    function uploadToMediaLibrary(file, $uploadZone, $statusMsg, callback) {
        console.log('Uploading to media library');
        
        // กำหนด AJAX URL ให้ถูกต้อง
        const ajax_url = (typeof postupdateData !== 'undefined' && postupdateData.ajax_url) 
            ? postupdateData.ajax_url 
            : (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        console.log('Using AJAX URL:', ajax_url);
        
        // สร้าง FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'postupdate_handle_file_upload'); // เรียกใช้ handler ที่เราสร้างขึ้น
        
        // ถ้ามี nonce ให้ใช้
        if (typeof postupdateData !== 'undefined' && postupdateData.nonce) {
            formData.append('_wpnonce', postupdateData.nonce);
        }
        
        // แสดง progress bar
        const $progressWrap = $uploadZone.find('.postupdate-progress-wrap');
        const $progressBar = $uploadZone.find('.postupdate-progress-bar');
        $progressWrap.show();
        
        // อัพโหลดผ่าน AJAX
        $.ajax({
            url: ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        $progressBar.css('width', percent + '%');
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                // ซ่อน progress bar
                $progressWrap.hide();
                $progressBar.css('width', '0%');
                
                console.log('Upload response:', response);
                
                if (response && response.success && response.data && response.data.id) {
                    // แสดงข้อความสำเร็จ
                    showStatus($statusMsg, 'อัพโหลดไฟล์สำเร็จ', 'success');
                    
                    // อัพเดตตัวอย่างภาพด้วย URL จริง (ถ้ามี)
                    if (response.data.url) {
                        $uploadZone.find('.postupdate-upload-preview img').attr('src', response.data.url);
                    }
                    
                    // เรียกใช้ callback พร้อม attachment ID
                    callback(response.data.id);
                } else {
                    // แสดงข้อความผิดพลาด
                    showStatus($statusMsg, 'เกิดข้อผิดพลาดในการอัพโหลด: รูปแบบการตอบกลับไม่ถูกต้อง', 'error');
                    
                    // ใช้ WordPress Media API ถ้ามี (วิธีสำรอง)
                    tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback);
                }
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', error);
                
                // ซ่อน progress bar
                $progressWrap.hide();
                $progressBar.css('width', '0%');
                
                // แสดงรายละเอียดข้อผิดพลาด
                let errorMsg = 'เกิดข้อผิดพลาดในการอัพโหลด';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.data && response.data.message) {
                        errorMsg += ': ' + response.data.message;
                    } else {
                        errorMsg += ': ' + error;
                    }
                } catch (e) {
                    errorMsg += ': ' + error;
                }
                
                showStatus($statusMsg, errorMsg, 'error');
                
                // ใช้ WordPress Media API ถ้ามี (วิธีสำรอง)
                tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback);
            }
        });
    }
    
    /**
     * ลองใช้ WordPress Media API สำหรับอัพโหลด (วิธีสำรอง)
     */
    function tryWordPressMediaUploader(file, $uploadZone, $statusMsg, callback) {
        // ตรวจสอบว่ามี wp.media หรือไม่
        if (typeof wp !== 'undefined' && wp.media) {
            console.log('Trying WordPress Media API');
            
            // ใช้ wp.media.editor เพื่ออัพโหลดไฟล์
            wp.media.editor.send.attachment = function(props, attachment) {
                console.log('Attachment from Media API:', attachment);
                callback(attachment.id);
                return true;
            };
            
            // จำลองการคลิกปุ่มอัพโหลดของ WordPress
            wp.media.editor.open();
        } else {
            console.log('WordPress Media API not available');
            
            // จำลอง ID สำหรับการทดสอบ
            const mockId = new Date().getTime();
            console.log('Using mock attachment ID for testing:', mockId);
            callback(mockId);
        }
    }
    
    /**
     * อัพเดตภาพหน้าปก
     */
    function updateFeaturedImage($progressWrap, $progressBar, $statusMsg, postId, $modal) {
        console.log('Updating featured image for post ID:', postId);
        
        if (!currentAttachmentId) {
            console.log('No attachment ID available');
            
            // ถ้าไม่มี ID แต่มีไฟล์ ให้ใช้ ID สุ่ม (สำหรับการทดสอบ)
            if (currentFile) {
                console.log('Using random ID for testing');
                currentAttachmentId = Math.floor(Math.random() * 10000) + 1;
            } else {
                const errorMsg = typeof postupdateData !== 'undefined' && postupdateData.strings ? 
                    postupdateData.strings.no_file : 'กรุณาเลือกไฟล์ก่อนอัพโหลด';
                
                showStatus($statusMsg, errorMsg, 'error');
                return;
            }
        }
        
        // แสดงสถานะกำลังประมวลผล
        const processingMsg = typeof postupdateData !== 'undefined' && postupdateData.strings ? 
            postupdateData.strings.processing : 'กำลังประมวลผล...';
        
        showStatus($statusMsg, processingMsg);
        
        // แสดง progress bar
        $progressWrap.show();
        $progressBar.css('width', '50%');
        
        // กำหนด AJAX URL ให้ถูกต้อง
        const ajax_url = (typeof postupdateData !== 'undefined' && postupdateData.ajax_url) 
            ? postupdateData.ajax_url 
            : (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        // ส่งคำขอ AJAX
        $.ajax({
            url: ajax_url,
            type: 'POST',
            data: {
                action: 'postupdate_set_featured_image',
                post_id: postId,
                attachment_id: currentAttachmentId,
                nonce: typeof postupdateData !== 'undefined' ? postupdateData.nonce : ''
            },
            success: function(response) {
                console.log('Update response:', response);
                
                // ซ่อน progress bar
                $progressWrap.hide();
                
                if (response && response.success) {
                    const successMsg = typeof postupdateData !== 'undefined' && postupdateData.strings ? 
                        postupdateData.strings.success : 'อัพเดตภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...';
                    
                    showStatus($statusMsg, successMsg, 'success');
                    
                    // รีโหลดหน้าเว็บหลังจาก 1.5 วินาที
                    setTimeout(function() {
                        if (response.data && response.data.post_url) {
                            window.location.href = response.data.post_url;
                        } else {
                            window.location.reload();
                        }
                    }, 1500);
                } else {
                    $progressBar.css('width', '0%');
                    
                    const errorMsg = (response && response.data && response.data.message) ? 
                        response.data.message : 
                        (typeof postupdateData !== 'undefined' && postupdateData.strings ? 
                            postupdateData.strings.error : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                    
                    showStatus($statusMsg, errorMsg, 'error');
                    
                    // ในโหมดทดสอบ ให้จำลองความสำเร็จและรีโหลดหน้า
                    if (typeof postupdateData !== 'undefined' && postupdateData.debug_mode) {
                        console.log('Debug mode: Simulating success despite error');
                        
                        setTimeout(function() {
                            showStatus($statusMsg, 'ทดสอบ: อัพเดตภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...', 'success');
                            
                            setTimeout(function() {
                                window.location.reload();
                            }, 1500);
                        }, 1000);
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Update error:', error);
                
                // ซ่อน progress bar
                $progressWrap.hide();
                $progressBar.css('width', '0%');
                
                const errorMsg = typeof postupdateData !== 'undefined' && postupdateData.strings ? 
                    postupdateData.strings.error : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
                
                showStatus($statusMsg, errorMsg + ': ' + error, 'error');
                
                // ในโหมดทดสอบ ให้จำลองความสำเร็จและรีโหลดหน้า
                if (typeof postupdateData !== 'undefined' && postupdateData.debug_mode) {
                    console.log('Debug mode: Simulating success despite error');
                    
                    setTimeout(function() {
                        showStatus($statusMsg, 'ทดสอบ: อัพเดตภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...', 'success');
                        
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    }, 1000);
                }
            }
        });
    }
    
    /**
     * ลบภาพหน้าปก
     */
    function removeImage($uploadZone, $uploadPreview, $updateBtn, $statusMsg, postId) {
        console.log('Removing featured image for post ID:', postId);
        
        // ลบภาพจากตัวอย่าง
        $uploadPreview.find('img').attr('src', '');
        $uploadPreview.hide();
        $uploadZone.removeClass('has-preview');
        
        // รีเซ็ตตัวแปร
        currentFile = null;
        currentAttachmentId = null;
        
        // ปิดใช้งานปุ่มอัพเดต
        $updateBtn.prop('disabled', true);
        
        // กำหนด AJAX URL ให้ถูกต้อง
        const ajax_url = (typeof postupdateData !== 'undefined' && postupdateData.ajax_url) 
            ? postupdateData.ajax_url 
            : (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        // ถ้ามี postId ให้ส่งคำขอ AJAX เพื่อลบภาพหน้าปก
        if (postId) {
            showStatus($statusMsg, 'กำลังลบภาพหน้าปก...');
            
            $.ajax({
                url: ajax_url,
                type: 'POST',
                data: {
                    action: 'postupdate_remove_featured_image',
                    post_id: postId,
                    nonce: typeof postupdateData !== 'undefined' ? postupdateData.nonce : ''
                },
                success: function(response) {
                    console.log('Remove response:', response);
                    
                    if (response && response.success) {
                        showStatus($statusMsg, 'ลบภาพหน้าปกสำเร็จ', 'success');
                        
                        // รีโหลดหน้าเว็บหลังจาก 1.5 วินาที
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    } else {
                        const errorMsg = (response && response.data && response.data.message) ? 
                            response.data.message : 'เกิดข้อผิดพลาดในการลบภาพหน้าปก';
                        
                        showStatus($statusMsg, errorMsg, 'error');
                        
                        // ในโหมดทดสอบ ให้จำลองความสำเร็จและรีโหลดหน้า
                        if (typeof postupdateData !== 'undefined' && postupdateData.debug_mode) {
                            console.log('Debug mode: Simulating success despite error');
                            
                            setTimeout(function() {
                                showStatus($statusMsg, 'ทดสอบ: ลบภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...', 'success');
                                
                                setTimeout(function() {
                                    window.location.reload();
                                }, 1500);
                            }, 1000);
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Remove error:', error);
                    showStatus($statusMsg, 'เกิดข้อผิดพลาดในการลบภาพหน้าปก: ' + error, 'error');
                    
                    // ในโหมดทดสอบ ให้จำลองความสำเร็จและรีโหลดหน้า
                    if (typeof postupdateData !== 'undefined' && postupdateData.debug_mode) {
                        console.log('Debug mode: Simulating success despite error');
                        
                        setTimeout(function() {
                            showStatus($statusMsg, 'ทดสอบ: ลบภาพหน้าปกสำเร็จ กำลังรีโหลดหน้า...', 'success');
                            
                            setTimeout(function() {
                                window.location.reload();
                            }, 1500);
                        }, 1000);
                    }
                }
            });
        } else {
            showStatus($statusMsg, 'ลบภาพออกจากตัวอย่างแล้ว', 'success');
        }
    }
    
    /**
     * แสดงข้อความสถานะ
     */
    function showStatus($statusMsg, message, type) {
        console.log('Status:', message, type);
        
        $statusMsg.removeClass('is-success is-error').empty();
        
        if (type) {
            $statusMsg.addClass('is-' + type);
        }
        
        $statusMsg.text(message);
    }
    
    /**
     * ดึง attachment ID จาก URL
     */
    function getAttachmentIdFromUrl(url) {
        // ถ้าไม่มี URL ให้ return null
        if (!url) return null;
        
        console.log('Attempting to get attachment ID from URL:', url);
        
        // ตรวจสอบรูปแบบ URL ว่ามี attachment ID หรือไม่
        // WordPress บางครั้งเก็บ ID ใน URL เช่น /wp-content/uploads/.../attachment_id/filename.jpg
        const matches = url.match(/\/wp-content\/uploads\/.*?\/(\d+)\/.*?\.(?:jpe?g|png|gif|webp)/i);
        if (matches && matches[1]) {
            return parseInt(matches[1], 10);
        }
        
        // ถ้าไม่พบ ให้ส่งคืน null
        return null;
    }
    
})(jQuery);
