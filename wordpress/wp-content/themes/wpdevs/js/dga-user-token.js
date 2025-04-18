(function($) {
    $(document).ready(function() {
        initTokenWidget();
        
        function initTokenWidget() {
            // Modal elements
            const updateModal = $('#dga-token-modal');
            const deleteModal = $('#dga-delete-modal');
            const updateModalMessage = $('#dga-modal-message');
            const deleteModalMessage = $('#dga-delete-modal-message');
            const apiKeyInput = $('#dga-api-key');
            
            // Open update modal when button is clicked
            $(document).on('click', '#dga-update-token-btn', function() {
                openUpdateModal();
            });
            
            // Open delete modal when delete button is clicked
            $(document).on('click', '#dga-delete-token-btn', function() {
                openDeleteModal();
            });
            
            // Close modals when clicking the close button
            $('.dga-modal-close').on('click', function() {
                closeAllModals();
            });
            
            // Close modals when clicking outside the modal content
            $(window).on('click', function(event) {
                if ($(event.target).is(updateModal) || $(event.target).is(deleteModal)) {
                    closeAllModals();
                }
            });
            
            // Close update modal when cancel button is clicked
            $('#dga-cancel-token').on('click', function() {
                closeUpdateModal();
            });
            
            // Close delete modal when cancel button is clicked
            $('#dga-cancel-delete').on('click', function() {
                closeDeleteModal();
            });
            
            // Save API key when save button is clicked
            $('#dga-save-token').on('click', function() {
                saveApiKey();
            });
            
            // Delete API key when delete button is clicked
            $('#dga-confirm-delete').on('click', function() {
                deleteApiKey();
            });
            
            // Allow pressing Enter to save
            apiKeyInput.on('keypress', function(e) {
                if (e.which === 13) {
                    saveApiKey();
                    return false;
                }
            });
        }
        
        function openUpdateModal() {
            const updateModal = $('#dga-token-modal');
            const updateModalMessage = $('#dga-modal-message');
            const apiKeyInput = $('#dga-api-key');
            
            apiKeyInput.val('');
            updateModalMessage.html('').removeClass('dga-message-success dga-message-error').hide();
            updateModal.addClass('dga-modal-open');
            setTimeout(function() {
                apiKeyInput.focus();
            }, 100);
        }
        
        function closeUpdateModal() {
            $('#dga-token-modal').removeClass('dga-modal-open');
        }
        
        function openDeleteModal() {
            const deleteModal = $('#dga-delete-modal');
            const deleteModalMessage = $('#dga-delete-modal-message');
            
            deleteModalMessage.html('').removeClass('dga-message-success dga-message-error').hide();
            deleteModal.addClass('dga-modal-open');
        }
        
        function closeDeleteModal() {
            $('#dga-delete-modal').removeClass('dga-modal-open');
        }
        
        function closeAllModals() {
            closeUpdateModal();
            closeDeleteModal();
        }
        
        function saveApiKey() {
            const apiKey = $('#dga-api-key').val().trim();
            const updateModalMessage = $('#dga-modal-message');
            
            if (!apiKey) {
                showModalMessage(updateModalMessage, 'กรุณากรอก API KEY', 'error');
                return;
            }
            
            // Show loading state
            const saveBtn = $('#dga-save-token');
            const originalText = saveBtn.text();
            saveBtn.prop('disabled', true).text('กำลังบันทึก...');
            
            // Send AJAX request
            $.ajax({
                url: dgaUserToken.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'dga_update_user_api_key',
                    api_key: apiKey,
                    nonce: dgaUserToken.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showModalMessage(updateModalMessage, response.data.message, 'success');
                        
                        // Update widget content
                        updateWidgetContent(response.data.widget_content);
                        
                        // Close modal after successful update
                        setTimeout(function() {
                            closeUpdateModal();
                        }, 1500);
                    } else {
                        showModalMessage(updateModalMessage, response.data.message, 'error');
                    }
                },
                error: function() {
                    showModalMessage(updateModalMessage, 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ โปรดลองอีกครั้ง', 'error');
                },
                complete: function() {
                    saveBtn.prop('disabled', false).text(originalText);
                }
            });
        }
        
        function deleteApiKey() {
            const deleteModalMessage = $('#dga-delete-modal-message');
            
            // Show loading state
            const deleteBtn = $('#dga-confirm-delete');
            const originalText = deleteBtn.text();
            deleteBtn.prop('disabled', true).text('กำลังลบ...');
            
            // Send AJAX request
            $.ajax({
                url: dgaUserToken.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'dga_delete_user_api_key',
                    nonce: dgaUserToken.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showModalMessage(deleteModalMessage, response.data.message, 'success');
                        
                        // Update widget content
                        updateWidgetContent(response.data.widget_content);
                        
                        // Close modal after successful delete
                        setTimeout(function() {
                            closeDeleteModal();
                        }, 1500);
                    } else {
                        showModalMessage(deleteModalMessage, response.data.message, 'error');
                    }
                },
                error: function() {
                    showModalMessage(deleteModalMessage, 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ โปรดลองอีกครั้ง', 'error');
                },
                complete: function() {
                    deleteBtn.prop('disabled', false).text(originalText);
                }
            });
        }
        
        function updateWidgetContent(content) {
            $('.dga-user-token-content').html(content);
            
            // Add a quick animation to highlight the change
            $('.dga-user-token-content').addClass('dga-content-updated');
            setTimeout(function() {
                $('.dga-user-token-content').removeClass('dga-content-updated');
            }, 1000);
        }
        
        function refreshWidgetContent() {
            $.ajax({
                url: dgaUserToken.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'dga_refresh_token_widget',
                    nonce: dgaUserToken.nonce
                },
                success: function(response) {
                    if (response.success) {
                        updateWidgetContent(response.data.widget_content);
                    }
                }
            });
        }
        
        function showModalMessage(messageElement, message, type) {
            messageElement
                .removeClass('dga-message-success dga-message-error')
                .addClass('dga-message-' + type)
                .html(message)
                .fadeIn();
        }
    });
})(jQuery);