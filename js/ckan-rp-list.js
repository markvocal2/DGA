/**
 * CKAN Repeater List JavaScript
 */
jQuery(document).ready(function($) {
    // Initialize
    var modal = $('#ckan-asset-modal');
    var form = $('#ckan-asset-form');
    var post_id = $('.ckan-assets-container').data('post-id') || 0;
    
    // Add asset button click
    $('.ckan-add-asset-btn').on('click', function() {
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
    });
    
    // Edit asset button click
    $(document).on('click', '.ckan-edit-btn', function() {
        var index = $(this).data('index');
        var item = $('.ckan-asset-item[data-index="' + index + '"]');
        var name = item.find('.ckan-asset-name').text();
        var description = item.find('.ckan-asset-description').text();
        var fileUrl = atob(item.find('.ckan-download-btn').data('url'));
        var fileName = fileUrl.split('/').pop();
        
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
    });
    
    // Delete asset button click
    $(document).on('click', '.ckan-delete-btn', function() {
        if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
            var index = $(this).data('index');
            var button = $(this);
            
            // Show loading state
            button.html('<i class="fa fa-spinner fa-spin"></i>');
            button.prop('disabled', true);
            
            // Send AJAX request
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
                    if (response.success) {
                        // Reload page to show updated list
                        location.reload();
                    } else {
                        alert('เกิดข้อผิดพลาด: ' + response.data);
                        // Reset button
                        button.html('<i class="fa fa-trash"></i>');
                        button.prop('disabled', false);
                    }
                },
                error: function() {
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                    // Reset button
                    button.html('<i class="fa fa-trash"></i>');
                    button.prop('disabled', false);
                }
            });
        }
    });
    
    // Download button click
    $(document).on('click', '.ckan-download-btn', function() {
        var encodedUrl = $(this).data('url');
        window.location.href = ckan_rp_list_ajax.ajax_url + '?action=ckan_download_file&nonce=' + ckan_rp_list_ajax.nonce + '&file=' + encodedUrl;
    });
    
    // Close modal
    $('.ckan-modal-close, .ckan-cancel-btn').on('click', function() {
        modal.removeClass('show');
    });
    
    // File input change - handle file upload immediately
    $('#ckan-asset-file').on('change', function() {
        if (this.files.length > 0) {
            var file = this.files[0];
            var statusDiv = $('.ckan-upload-status');
            
            // Show loading indicator
            statusDiv.html('<div class="ckan-upload-progress"><i class="fa fa-spinner fa-spin"></i> กำลังอัพโหลด...</div>');
            
            // Create form data
            var formData = new FormData();
            formData.append('action', 'ckan_upload_file');
            formData.append('nonce', ckan_rp_list_ajax.nonce);
            formData.append('file', file);
            
            // Upload file via AJAX
            $.ajax({
                url: ckan_rp_list_ajax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Store file info
                        $('#ckan-asset-file-id').val(response.data.file_id);
                        $('#ckan-asset-file-url').val(response.data.file_url);
                        
                        // Update UI
                        statusDiv.html('<div class="ckan-upload-success"><i class="fa fa-check"></i> อัพโหลดสำเร็จ: ' + response.data.file_name + '</div>');
                        
                        // If name field is empty, use file name as default
                        if ($('#ckan-asset-name').val() === '') {
                            // Remove file extension from the name
                            var nameWithoutExt = response.data.file_name.split('.').slice(0, -1).join('.');
                            $('#ckan-asset-name').val(nameWithoutExt);
                        }
                    } else {
                        statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ' + response.data + '</div>');
                    }
                },
                error: function() {
                    statusDiv.html('<div class="ckan-upload-error"><i class="fa fa-exclamation-circle"></i> ข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</div>');
                }
            });
        }
    });
    
    // Form submission
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        var name = $('#ckan-asset-name').val();
        var description = $('#ckan-asset-description').val();
        var fileUrl = $('#ckan-asset-file-url').val();
        var index = $('#ckan-asset-index').val();
        
        // Validate
        if (!name) {
            alert('กรุณาระบุชื่อไฟล์');
            return;
        }
        
        if (!fileUrl && index === '') {
            alert('กรุณาอัพโหลดไฟล์');
            return;
        }
        
        // Show loading state on submit button
        var submitBtn = $('.ckan-submit-btn');
        submitBtn.html('<i class="fa fa-spinner fa-spin"></i> กำลังบันทึก');
        submitBtn.prop('disabled', true);
        
        // Send AJAX request
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
                if (response.success) {
                    // Close modal
                    modal.removeClass('show');
                    
                    // Reload page to show updated list
                    location.reload();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + response.data);
                    // Reset submit button
                    submitBtn.html('บันทึก');
                    submitBtn.prop('disabled', false);
                }
            },
            error: function() {
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                // Reset submit button
                submitBtn.html('บันทึก');
                submitBtn.prop('disabled', false);
            }
        });
    });
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is(modal)) {
            modal.removeClass('show');
        }
    });
});