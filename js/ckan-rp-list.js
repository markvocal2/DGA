/**
 * CKAN Repeater List JavaScript
 */
jQuery(document).ready(function($) {
    // Initialize
    const modal = $('#ckan-asset-modal');
    const form = $('#ckan-asset-form');
    const post_id = $('.ckan-assets-container').data('post-id') || 0;
    
    // ------------ Event Bindings ------------
    
    // Add asset button click
    $('.ckan-add-asset-btn').on('click', handleAddAssetClick);
    
    // Edit asset button click
    $(document).on('click', '.ckan-edit-btn', handleEditAssetClick);
    
    // Delete asset button click
    $(document).on('click', '.ckan-delete-btn', handleDeleteAssetClick);
    
    // Download button click
    $(document).on('click', '.ckan-download-btn', handleDownloadClick);
    
    // Close modal
    $('.ckan-modal-close, .ckan-cancel-btn').on('click', handleCloseModal);
    
    // File input change - handle file upload immediately
    $('#ckan-asset-file').on('change', handleFileUpload);
    
    // Form submission
    form.on('submit', handleFormSubmit);
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is(modal)) {
            modal.removeClass('show');
        }
    });
    
    // ------------ Event Handlers ------------
    
    /**
     * Handle add asset button click
     */
    function handleAddAssetClick() {
        // Reset form
        form[0].reset();
        $('#ckan-asset-index').val('');
        $('#ckan-asset-file-id').val('');
        $('#ckan-asset-file-url').val('');
        $('#ckan-current-file').text('');
        $('.ckan-current-file-container').hide();
        $('.ckan-upload-status').empty();
        $('.ckan-modal-title').text('เพิ่มรายการไฟล์');
        
        // Show modal
        modal.addClass('show');
    }
    
    /**
     * Handle edit asset button click
     */
    function handleEditAssetClick() {
        const index = $(this).data('index');
        const item = $('.ckan-asset-item[data-index="' + index + '"]');
        const name = item.find('.ckan-asset-name').text();
        const description = item.find('.ckan-asset-description').text();
        const fileUrl = atob(item.find('.ckan-download-btn').data('url'));
        const fileName = fileUrl.split('/').pop();
        
        // Reset upload status
        $('.ckan-upload-status').empty();
        
        // Set form values
        $('#ckan-asset-index').val(index);
        $('#ckan-asset-name').val(name);
        $('#ckan-asset-description').val(description);
        $('#ckan-asset-file-url').val(fileUrl);
        $('#ckan-current-file').text(fileName);
        $('.ckan-current-file-container').show();
        $('.ckan-modal-title').text('แก้ไขรายการไฟล์');
        
        // Show modal
        modal.addClass('show');
    }
    
    /**
     * Handle delete asset button click
     */
    function handleDeleteAssetClick() {
        if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
            return;
        }
        
        const index = $(this).data('index');
        const button = $(this);
        
        // Show loading state
        button.html('<i class="fa fa-spinner fa-spin"></i>');
        button.prop('disabled', true);
        
        deleteAsset(index, button);
    }
    
    /**
     * Delete asset via AJAX
     */
    function deleteAsset(index, button) {
        $.ajax({
            url: ckan_rp_list_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_delete_asset',
                nonce: ckan_rp_list_ajax.nonce,
                post_id: post_id,
                index: index
            },
            success: function(response) {
                handleDeleteAssetResponse(response, button);
            },
            error: function() {
                handleDeleteAssetError(button);
            }
        });
    }
    
    /**
     * Handle delete asset response
     */
    function handleDeleteAssetResponse(response, button) {
        if (response.success) {
            // Reload page to show updated list
            location.reload();
        } else {
            alert('เกิดข้อผิดพลาด: ' + response.data);
            // Reset button
            resetDeleteButton(button);
        }
    }
    
    /**
     * Handle delete asset error
     */
    function handleDeleteAssetError(button) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        // Reset button
        resetDeleteButton(button);
    }
    
    /**
     * Reset delete button state
     */
    function resetDeleteButton(button) {
        button.html('<i class="fa fa-trash"></i>');
        button.prop('disabled', false);
    }
    
    /**
     * Handle download button click
     */
    function handleDownloadClick() {
        const encodedUrl = $(this).data('url');
        window.location.href = ckan_rp_list_ajax.ajax_url + 
                               '?action=ckan_download_file&nonce=' + 
                               ckan_rp_list_ajax.nonce + 
                               '&file=' + encodedUrl;
    }
    
    /**
     * Handle close modal
     */
    function handleCloseModal() {
        modal.removeClass('show');
    }
    
    /**
     * Handle file upload
     */
    function handleFileUpload() {
        if (this.files.length === 0) {
            return;
        }
        
        const file = this.files[0];
        const statusDiv = $('.ckan-upload-status');
        
        // Show loading indicator
        statusDiv.html('<div class="ckan-upload-progress"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด...</div>');
        
        uploadFile(file, statusDiv);
    }
    
    /**
     * Upload file via AJAX
     */
    function uploadFile(file, statusDiv) {
        // Create form data
        const formData = new FormData();
        formData.append('action', 'ckan_upload_file');
        formData.append('nonce', ckan_rp_list_ajax.nonce);
        formData.append('file', file);
        
        $.ajax({
            url: ckan_rp_list_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                handleFileUploadResponse(response, statusDiv);
            },
            error: function() {
                handleFileUploadError(statusDiv);
            }
        });
    }
    
    /**
     * Handle file upload response
     */
    function handleFileUploadResponse(response, statusDiv) {
        if (response.success) {
            // Store file info
            $('#ckan-asset-file-id').val(response.data.file_id);
            $('#ckan-asset-file-url').val(response.data.file_url);
            
            // Update UI
            statusDiv.html('<div class="ckan-upload-success"><i class="fa fa-check"></i> อัพโหลดสำเร็จ: ' + response.data.file_name + '</div>');
            
            // If name field is empty, use file name as default
            if ($('#ckan-asset-name').val() === '') {
                // Remove file extension from the name
                const nameWithoutExt = response.data.file_name.split('.').slice(0, -1).join('.');
                $('#ckan-asset-name').val(nameWithoutExt);
            }
        } else {
            statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + response.data + '</div>');
        }
    }
    
    /**
     * Handle file upload error
     */
    function handleFileUploadError(statusDiv) {
        statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</div>');
    }
    
    /**
     * Handle form submit
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const name = $('#ckan-asset-name').val();
        const description = $('#ckan-asset-description').val();
        const fileUrl = $('#ckan-asset-file-url').val();
        const index = $('#ckan-asset-index').val();
        
        if (!validateForm(name, fileUrl, index)) {
            return;
        }
        
        // Show loading state on submit button
        const submitBtn = $('.ckan-submit-btn');
        submitBtn.html('<i class="fa fa-spinner fa-spin"></i> กำลังบันทึก');
        submitBtn.prop('disabled', true);
        
        saveAsset(name, description, fileUrl, index, submitBtn);
    }
    
    /**
     * Validate form
     */
    function validateForm(name, fileUrl, index) {
        if (!name) {
            alert('กรุณาระบุชื่อไฟล์');
            return false;
        }
        
        if (!fileUrl && index === '') {
            alert('กรุณาอัพโหลดไฟล์');
            return false;
        }
        
        return true;
    }
    
    /**
     * Save asset via AJAX
     */
    function saveAsset(name, description, fileUrl, index, submitBtn) {
        $.ajax({
            url: ckan_rp_list_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_save_asset',
                nonce: ckan_rp_list_ajax.nonce,
                post_id: post_id,
                index: index,
                name: name,
                description: description,
                file_url: fileUrl
            },
            success: function(response) {
                handleSaveAssetResponse(response, submitBtn);
            },
            error: function() {
                handleSaveAssetError(submitBtn);
            }
        });
    }
    
    /**
     * Handle save asset response
     */
    function handleSaveAssetResponse(response, submitBtn) {
        if (response.success) {
            // Close modal
            modal.removeClass('show');
            
            // Reload page to show updated list
            location.reload();
        } else {
            alert('เกิดข้อผิดพลาด: ' + response.data);
            // Reset submit button
            resetSubmitButton(submitBtn);
        }
    }
    
    /**
     * Handle save asset error
     */
    function handleSaveAssetError(submitBtn) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        // Reset submit button
        resetSubmitButton(submitBtn);
    }
    
    /**
     * Reset submit button state
     */
    function resetSubmitButton(submitBtn) {
        submitBtn.html('บันทึก');
        submitBtn.prop('disabled', false);
    }
});
