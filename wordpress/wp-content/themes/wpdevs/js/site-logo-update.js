// site-logo-update.js
jQuery(document).ready(function($) {
    // Variables
    var mediaUploader;
    var activeTab = 'white'; // Default tab is white background
    
    // Maps for background types
    var backgroundIdMap = {
        'white': '#site-logo-image-white',
        'dark': '#site-logo-image-dark',
        'transparent': '#site-logo-image-transparent'
    };
    
    var placeholderIdMap = {
        'white': '#site-logo-placeholder-white',
        'dark': '#site-logo-placeholder-dark',
        'transparent': '#site-logo-placeholder-transparent'
    };
    
    var containerIdMap = {
        'white': '#site-logo-container-white',
        'dark': '#site-logo-container-dark',
        'transparent': '#site-logo-container-transparent'
    };
    
    var previewAreaIdMap = {
        'white': '#site-logo-preview-white',
        'dark': '#site-logo-preview-dark',
        'transparent': '#site-logo-preview-transparent'
    };
    
    var selectButtonIdMap = {
        'white': '#site-logo-select-white',
        'dark': '#site-logo-select-dark',
        'transparent': '#site-logo-select-transparent'
    };
    
    var saveButtonIdMap = {
        'white': '#site-logo-save-white',
        'dark': '#site-logo-save-dark',
        'transparent': '#site-logo-save-transparent'
    };
    
    var backgroundNameMap = {
        'white': 'ขาว',
        'dark': 'สีเข้ม',
        'transparent': 'โปร่งใส'
    };
    
    var shortcodeModeMap = {
        'white': 'dark',
        'dark': 'light',
        'transparent': 'transparent'
    };
    
    // Initialize functionality
    initTabSwitching();
    initSelectButtons();
    initSaveButtons();
    initDragAndDrop();
    
    // Function to initialize tab switching
    function initTabSwitching() {
        $('.site-logo-tab').on('click', function() {
            var tabId = $(this).data('tab');
            
            // Update active tab
            $('.site-logo-tab').removeClass('active');
            $(this).addClass('active');
            
            // Update active content
            $('.site-logo-content').removeClass('active');
            $('.site-logo-content[data-content="' + tabId + '"]').addClass('active');
            
            // Update active tab variable
            activeTab = tabId;
        });
    }
    
    // Function to initialize select buttons
    function initSelectButtons() {
        // Initialize select buttons for each background type
        Object.keys(selectButtonIdMap).forEach(function(bgType) {
            $(selectButtonIdMap[bgType]).on('click', function() {
                openMediaUploader(bgType);
            });
            
            // Make preview area clickable to select logo
            $(previewAreaIdMap[bgType]).on('click', function() {
                openMediaUploader(bgType);
            });
        });
    }
    
    // Function to open media uploader for specific background type
    function openMediaUploader(bgType) {
        // Set active tab to match background type
        $('.site-logo-tab[data-tab="' + bgType + '"]').click();
        
        // Create media uploader if not exists
        if (!mediaUploader) {
            mediaUploader = wp.media({
                title: 'เลือกโลโก้สำหรับพื้นหลัง' + backgroundNameMap[bgType],
                button: {
                    text: 'ใช้เป็นโลโก้'
                },
                multiple: false,
                library: {
                    type: 'image'
                }
            });
            
            // When an image is selected
            mediaUploader.on('select', function() {
                var attachment = mediaUploader.state().get('selection').first().toJSON();
                updateLogoPreview(bgType, attachment);
            });
        } else {
            // Update title
            mediaUploader.uploader.uploader.param('post_id', null);
            mediaUploader.options.title = 'เลือกโลโก้สำหรับพื้นหลัง' + backgroundNameMap[bgType];
            mediaUploader.options.button.text = 'ใช้เป็นโลโก้';
        }
        
        // Open the uploader dialog
        mediaUploader.open();
    }
    
    // Function to update logo preview
    function updateLogoPreview(bgType, attachment) {
        // Update the image
        if ($(backgroundIdMap[bgType]).length) {
            $(backgroundIdMap[bgType]).attr('src', attachment.url);
        } else {
            $(placeholderIdMap[bgType]).remove();
            
            // Create container if not exists
            if (!$(containerIdMap[bgType]).length) {
                $(previewAreaIdMap[bgType]).append('<div class="site-logo-image-container" id="' + containerIdMap[bgType].substring(1) + '"></div>');
            }
            
            // Add image to container
            $(containerIdMap[bgType]).html('<img src="' + attachment.url + '" alt="โลโก้พื้นหลัง' + backgroundNameMap[bgType] + '" id="' + backgroundIdMap[bgType].substring(1) + '" />');
            
            // Add overlay if not exists
            if (!$(previewAreaIdMap[bgType] + ' .site-logo-overlay').length) {
                $(previewAreaIdMap[bgType]).append('<div class="site-logo-overlay"><span>โลโก้สำหรับพื้นหลัง' + backgroundNameMap[bgType] + '</span></div>');
            }
        }
        
        // Store the attachment ID
        $(containerIdMap[bgType]).data('attachment-id', attachment.id);
        
        // Enable save button
        $(saveButtonIdMap[bgType]).prop('disabled', false);
    }
    
    // Function to initialize save buttons
    function initSaveButtons() {
        // Initialize save buttons for each background type
        Object.keys(saveButtonIdMap).forEach(function(bgType) {
            $(saveButtonIdMap[bgType]).on('click', function() {
                saveLogoForBackground(bgType);
            });
        });
    }
    
    // Function to save logo for specific background
    function saveLogoForBackground(bgType) {
        var $container = $(containerIdMap[bgType]);
        
        if (!$container.length || !$container.data('attachment-id')) {
            showMessage('กรุณาเลือกรูปภาพก่อน', 'error');
            return;
        }
        
        var attachmentId = $container.data('attachment-id');
        
        // Show loading state
        var $saveButton = $(saveButtonIdMap[bgType]);
        $saveButton.prop('disabled', true).text('กำลังบันทึก...');
        
        // Send AJAX request
        $.ajax({
            url: siteLogoUpdateData.ajax_url,
            type: 'POST',
            data: {
                action: 'site_logo_update',
                attachment_id: attachmentId,
                nonce: siteLogoUpdateData.nonce,
                background_type: bgType
            },
            success: function(response) {
                if (response.success) {
                    // Show success message
                    showMessage('บันทึกโลโก้สำหรับพื้นหลัง' + backgroundNameMap[bgType] + 'เรียบร้อยแล้ว', 'success');
                    
                    // Create success banner with shortcode info
                    var successBanner = '<div class="site-logo-success-banner">';
                    successBanner += '<span>ใช้งานด้วย</span>';
                    successBanner += '<code>' + response.data.shortcode + '</code>';
                    successBanner += '</div>';
                    
                    // Add success banner after save button
                    if (!$($saveButton).next('.site-logo-success-banner').length) {
                        $($saveButton).after(successBanner);
                    } else {
                        $($saveButton).next('.site-logo-success-banner').replaceWith(successBanner);
                    }
                    
                    // Reset the button
                    $saveButton.text('บันทึกเรียบร้อย!');
                    
                    // After 2 seconds, reset the button text
                    setTimeout(function() {
                        $saveButton.text('บันทึกโลโก้').prop('disabled', false);
                    }, 2000);
                } else {
                    showMessage(response.data, 'error');
                    $saveButton.prop('disabled', false).text('บันทึกโลโก้');
                }
            },
            error: function() {
                showMessage('เกิดข้อผิดพลาด โปรดลองอีกครั้ง', 'error');
                $saveButton.prop('disabled', false).text('บันทึกโลโก้');
            }
        });
    }
    
    // Function to initialize drag and drop
    function initDragAndDrop() {
        $('.site-logo-preview-area').each(function() {
            var $dropArea = $(this);
            var bgType = $dropArea.data('content') || $dropArea.attr('id').replace('site-logo-preview-', '');
            
            // Prevent default behaviors for drag events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                $dropArea.on(eventName, preventDefaults);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Highlight drop area when dragging over it
            ['dragenter', 'dragover'].forEach(eventName => {
                $dropArea.on(eventName, function() {
                    $dropArea.addClass('highlight');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                $dropArea.on(eventName, function() {
                    $dropArea.removeClass('highlight');
                });
            });
            
            // Handle dropped files
            $dropArea.on('drop', function(e) {
                const dt = e.originalEvent.dataTransfer;
                const files = dt.files;
                
                if (files.length > 0) {
                    uploadFile(files[0], bgType);
                }
            });
        });
    }
    
    // Function to upload file
    function uploadFile(file, bgType) {
        // Only accept images
        if (!file.type.match('image.*')) {
            showMessage('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น', 'error');
            return;
        }
        
        // Create FormData
        var formData = new FormData();
        formData.append('action', 'upload-attachment');
        formData.append('_wpnonce', siteLogoUpdateData.nonce);
        formData.append('async-upload', file);
        
        // Show loading state
        var $dropArea = $(previewAreaIdMap[bgType]);
        $dropArea.addClass('loading');
        showMessage('กำลังอัพโหลดรูปภาพ...', 'info');
        
        // Upload the file
        $.ajax({
            url: ajaxurl || '/wp-admin/admin-ajax.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    var attachment = {
                        id: response.data.id,
                        url: response.data.url
                    };
                    updateLogoPreview(bgType, attachment);
                } else {
                    showMessage('การอัพโหลดล้มเหลว โปรดลองอีกครั้ง', 'error');
                }
                $dropArea.removeClass('loading');
            },
            error: function() {
                showMessage('เกิดข้อผิดพลาดระหว่างการอัพโหลด โปรดลองอีกครั้ง', 'error');
                $dropArea.removeClass('loading');
            }
        });
    }
    
    // Function to show messages
    function showMessage(message, type) {
        var $messageArea = $('#site-logo-update-message');
        $messageArea.removeClass('success error info').addClass(type).text(message).fadeIn();
        
        // Auto hide after 5 seconds
        setTimeout(function() {
            $messageArea.fadeOut();
        }, 5000);
    }
    
    // Set existing logos if available
    if (siteLogoUpdateData.white_logo_url && siteLogoUpdateData.white_logo_id) {
        updateLogoPreview('white', {
            id: siteLogoUpdateData.white_logo_id,
            url: siteLogoUpdateData.white_logo_url
        });
    }
    
    if (siteLogoUpdateData.dark_logo_url && siteLogoUpdateData.dark_logo_id) {
        updateLogoPreview('dark', {
            id: siteLogoUpdateData.dark_logo_id,
            url: siteLogoUpdateData.dark_logo_url
        });
    }
    
    if (siteLogoUpdateData.transparent_logo_url && siteLogoUpdateData.transparent_logo_id) {
        updateLogoPreview('transparent', {
            id: siteLogoUpdateData.transparent_logo_id,
            url: siteLogoUpdateData.transparent_logo_url
        });
    }
});