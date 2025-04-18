/**
 * Organization Links - Complete JavaScript
 * แก้ไขปัญหาการเชื่อมต่อ AJAX
 */
(function($) {
    'use strict';
    
    // ========= VARIABLES =========
    
    // Frontend display
    var container, searchInput, autocompleteBox, typeFilter, viewButtons, contentArea, skeletonArea;
    var currentView = 'card';
    var currentFilter = 'all';
    var searchTimeout, debounceTimeout;
    
    // Modal popup
    var modal, backdrop, addButton, closeButton, cancelButton, form;
    var logoSelect, logoRemove, logoPreview, logoUrlInput;
    var mediaUploader;
    
    // Admin sortable
    var sortableList;

    // AJAX settings
    var ajaxUrl = (typeof org_links_data !== 'undefined' && org_links_data.ajax_url) ? 
                  org_links_data.ajax_url : 
                  (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
    
    var ajaxNonce = (typeof org_links_data !== 'undefined' && org_links_data.nonce) ? 
                   org_links_data.nonce : '';
    
    var adminNonce = (typeof org_links_data !== 'undefined' && org_links_data.admin_nonce) ? 
                    org_links_data.admin_nonce : ajaxNonce;
    
    // ========= INITIALIZATION =========
    
    // Main initialization function
    function init() {
        console.log('Organization Links JS initialized');
        
        // Check if AJAX URL is available
        if (!ajaxUrl) {
            console.error('AJAX URL not found. Organization Links may not work correctly.');
        }
        
        // Initialize frontend if elements exist
        initFrontend();
        
        // Initialize modal if elements exist
        initModal();
        
        // Initialize admin if on admin page
        initAdmin();
    }
    
    // ========= FRONTEND FUNCTIONS =========
    
    // Initialize frontend display
    function initFrontend() {
        container = $('.org-links-container');
        if (!container.length) {
            console.log('Frontend container not found');
            return;
        }
        
        console.log('Initializing frontend display');
        
        searchInput = $('#org-links-search-input');
        autocompleteBox = $('.org-links-autocomplete');
        typeFilter = $('#org-links-type-filter');
        viewButtons = $('.view-btn');
        contentArea = $('.org-links-items');
        skeletonArea = $('.org-links-skeleton');
        
        // Initial load
        loadItems();
        
        // Set up event listeners
        setupFrontendEvents();
    }
    
    // Setup frontend event listeners
    function setupFrontendEvents() {
        // View switcher
        viewButtons.on('click', function() {
            viewButtons.removeClass('active');
            $(this).addClass('active');
            
            currentView = $(this).data('view');
            loadItems();
        });
        
        // Type filter
        typeFilter.on('change', function() {
            currentFilter = $(this).val();
            loadItems();
        });
        
        // Search input
        searchInput.on('input', function() {
            var searchTerm = $(this).val();
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Show autocomplete if there's a search term
            if (searchTerm.length > 0) {
                searchTimeout = setTimeout(function() {
                    fetchAutocomplete(searchTerm);
                }, 300);
            } else {
                autocompleteBox.empty().hide();
                
                // Debounce the search to avoid too many requests
                if (debounceTimeout) {
                    clearTimeout(debounceTimeout);
                }
                
                debounceTimeout = setTimeout(function() {
                    loadItems();
                }, 300);
            }
        });
        
        // Submit search on Enter key
        searchInput.on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                autocompleteBox.empty().hide();
                loadItems();
            }
        });
        
        // Close autocomplete when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.org-links-search').length) {
                autocompleteBox.empty().hide();
            }
        });
    }
    
    // Fetch autocomplete suggestions
    function fetchAutocomplete(term) {
        if (!ajaxUrl || !ajaxNonce) {
            console.error('AJAX configuration missing for autocomplete');
            return;
        }
        
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'org_links_get_autocomplete',
                nonce: ajaxNonce,
                search: term
            },
            success: function(response) {
                if (response && response.success && response.data && response.data.items && response.data.items.length > 0) {
                    displayAutocomplete(response.data.items);
                } else {
                    autocompleteBox.empty().hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('Autocomplete AJAX error:', status, error);
                autocompleteBox.empty().hide();
            }
        });
    }
    
    // Display autocomplete suggestions
    function displayAutocomplete(items) {
        autocompleteBox.empty();
        
        items.forEach(function(item) {
            var element = $('<div class="autocomplete-item"></div>').text(item);
            
            element.on('click', function() {
                searchInput.val(item);
                autocompleteBox.empty().hide();
                loadItems();
            });
            
            autocompleteBox.append(element);
        });
        
        autocompleteBox.show();
    }
    
    // Load items from the server
    function loadItems() {
        if (!ajaxUrl || !ajaxNonce) {
            console.error('AJAX configuration missing for loading items');
            contentArea.html('<div class="org-links-error">เกิดข้อผิดพลาดในการกำหนดค่า AJAX</div>');
            skeletonArea.hide();
            return;
        }
        
        var searchTerm = searchInput.val();
        var type = container.data('type') || 'all';
        
        // If container type is 'all', use the filter value instead
        if (type === 'all') {
            type = currentFilter;
        }
        
        // Show skeleton
        contentArea.empty();
        skeletonArea.show();
        
        console.log('Loading items via AJAX:', {
            url: ajaxUrl,
            search: searchTerm,
            view: currentView,
            filter_type: type
        });
        
        // Make AJAX request
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'org_links_get_items',
                nonce: ajaxNonce,
                view: currentView,
                search: searchTerm,
                filter_type: type
            },
            success: function(response) {
                console.log('AJAX response received:', response);
                
                if (response && response.success && response.data && response.data.html) {
                    // Hide skeleton and show content with fade effect
                    skeletonArea.fadeOut(300, function() {
                        contentArea.html(response.data.html).fadeIn(300);
                    });
                } else {
                    // Invalid response format
                    skeletonArea.hide();
                    contentArea.html('<div class="org-links-error">รูปแบบข้อมูลไม่ถูกต้อง</div>');
                    console.error('Invalid response format:', response);
                }
            },
            error: function(xhr, status, error) {
                // AJAX error
                skeletonArea.hide();
                contentArea.html('<div class="org-links-error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>');
                console.error('AJAX error:', status, error, xhr.responseText);
                
                // Try to parse the response for more details
                try {
                    var errorDetails = xhr.responseText;
                    console.error('Error details:', errorDetails);
                } catch(e) {
                    console.error('Could not parse error details');
                }
            },
            timeout: 30000 // เพิ่มเวลา timeout เป็น 30 วินาที
        });
    }
    
    // ========= MODAL FUNCTIONS =========
    
    // Initialize modal popup
    function initModal() {
        // Elements
        modal = $('#orgLinksModal');
        backdrop = $('#orgLinksModalBackdrop');
        addButton = $('#orgLinksAddButton');
        closeButton = $('#orgLinksModalClose');
        cancelButton = $('#orgLinksModalCancel');
        form = $('#orgLinksForm');
        
        // Exit if modal doesn't exist
        if (!modal.length) {
            console.log('Modal not found');
            return;
        }
        
        // Logo elements
        logoSelect = $('#logoSelect');
        logoRemove = $('#logoRemove');
        logoPreview = $('#logoPreview');
        logoUrlInput = $('#logoUrl');
        
        // Exit if add button doesn't exist
        if (!addButton.length) {
            console.log('Add button not found');
            return;
        }
        
        console.log('Initializing modal');
        
        // Setup event listeners
        setupModalEvents();
    }
    
    // Setup modal event listeners
    function setupModalEvents() {
        // Open modal
        addButton.on('click', openModal);
        
        // Close modal
        closeButton.on('click', closeModal);
        cancelButton.on('click', closeModal);
        backdrop.on('click', closeModal);
        
        // Close on escape key
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && modal.hasClass('active')) {
                closeModal();
            }
        });
        
        // Logo select
        logoSelect.on('click', openMediaUploader);
        
        // Logo remove
        logoRemove.on('click', removeLogo);
        
        // Form submission
        form.on('submit', submitForm);
    }
    
    // Open modal
    function openModal() {
        resetForm();
        modal.addClass('active');
        backdrop.addClass('active');
        $('body').addClass('org-links-modal-open');
        
        // Focus first field
        setTimeout(function() {
            $('#title').focus();
        }, 100);
    }
    
    // Close modal
    function closeModal() {
        modal.removeClass('active');
        backdrop.removeClass('active');
        $('body').removeClass('org-links-modal-open');
    }
    
    // Reset form
    function resetForm() {
        form[0].reset();
        logoPreview.empty();
        logoUrlInput.val('');
        logoRemove.hide();
    }
    
    // Open media uploader
    function openMediaUploader(e) {
        e.preventDefault();
        
        // Check if wp.media is available
        if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
            alert('WordPress Media Library is not available. Please check if wp-includes/js/media-editor.js is loaded.');
            console.error('WordPress Media Library not available');
            return;
        }
        
        // If uploader exists, open it
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }
        
        // Create media uploader
        mediaUploader = wp.media({
            title: 'เลือกโลโก้หน่วยงาน',
            button: {
                text: 'ใช้โลโก้นี้'
            },
            multiple: false
        });
        
        // When image selected
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            
            // Set preview
            logoPreview.html('<img src="' + attachment.url + '" alt="">');
            
            // Set url
            logoUrlInput.val(attachment.url);
            
            // Show remove button
            logoRemove.show();
        });
        
        // Open media uploader
        mediaUploader.open();
    }
    
    // Remove logo
    function removeLogo(e) {
        e.preventDefault();
        
        logoPreview.empty();
        logoUrlInput.val('');
        logoRemove.hide();
    }
    
    // Submit form
    function submitForm(e) {
        e.preventDefault();
        
        if (!ajaxUrl) {
            alert('AJAX URL not available. Please refresh the page and try again.');
            console.error('AJAX URL not available for form submission');
            return;
        }
        
        // Check if form is valid
        if (!form[0].checkValidity()) {
            return;
        }
        
        // Check if logo is selected
        if (!logoUrlInput.val()) {
            alert('กรุณาเลือกโลโก้หน่วยงาน');
            return;
        }
        
        // Show loading
        var submitButton = form.find('.org-links-modal-submit');
        var originalText = submitButton.text();
        submitButton.prop('disabled', true).text('กำลังบันทึก...');
        
        // Get form data
        var formData = new FormData(form[0]);
        formData.append('action', 'org_links_add_item');
        
        console.log('Submitting form via AJAX:', {
            url: ajaxUrl,
            form_action: 'org_links_add_item'
        });
        
        // Submit via AJAX
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Form submission response:', response);
                
                if (response && response.success) {
                    // Show success message
                    showNotification('success', response.data.message || 'บันทึกข้อมูลเรียบร้อยแล้ว');
                    
                    // Close modal
                    closeModal();
                    
                    // Reload content if on frontend
                    if (container.length) {
                        loadItems();
                    } else {
                        // Reload page if on admin
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    }
                } else {
                    // Show error message
                    var errorMsg = response && response.data && response.data.message ? 
                                 response.data.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
                                 
                    showNotification('error', errorMsg);
                    
                    // Reset button
                    submitButton.prop('disabled', false).text(originalText);
                    
                    console.error('Form submission error:', response);
                }
            },
            error: function(xhr, status, error) {
                // Show error message
                showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                
                // Reset button
                submitButton.prop('disabled', false).text(originalText);
                
                console.error('Form submission AJAX error:', status, error, xhr.responseText);
                
                // Try to parse the response for more details
                try {
                    var errorDetails = xhr.responseText;
                    console.error('Error details:', errorDetails);
                } catch(e) {
                    console.error('Could not parse error details');
                }
            },
            timeout: 60000 // เพิ่มเวลา timeout เป็น 60 วินาที
        });
    }
    
    // Show notification
    function showNotification(type, message) {
        // Remove existing notifications
        $('.org-links-notification').remove();
        
        // Create notification
        var notification = $('<div class="org-links-notification ' + type + '">' + 
                             '<span>' + message + '</span>' +
                             '<button type="button" class="org-links-notification-close">' +
                             '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                             '</button>' +
                             '</div>');
        
        // Add to body
        $('body').append(notification);
        
        // Show notification
        setTimeout(function() {
            notification.addClass('active');
        }, 10);
        
        // Close button
        notification.find('.org-links-notification-close').on('click', function() {
            notification.removeClass('active');
            setTimeout(function() {
                notification.remove();
            }, 300);
        });
        
        // Auto close
        setTimeout(function() {
            notification.removeClass('active');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // ========= ADMIN FUNCTIONS =========
    
    // Initialize admin functionality
    function initAdmin() {
        // Check if on admin page
        if ($('.org-links-admin').length === 0) {
            console.log('Admin page not detected');
            return;
        }
        
        console.log('Initializing admin functionality');
        
        sortableList = $('#org-links-sortable');
        
        if (sortableList.length) {
            initSortable();
        } else {
            console.log('Sortable list not found');
        }
    }
    
    // Initialize sortable functionality
    function initSortable() {
        if (typeof $.fn.sortable === 'undefined') {
            console.error('jQuery UI Sortable is not available. Please check if it is loaded.');
            return;
        }
        
        console.log('Initializing sortable functionality');
        
        sortableList.sortable({
            handle: 'td:first-child',
            placeholder: 'ui-state-highlight',
            update: function(event, ui) {
                updateItemsOrder();
            }
        });
    }
    
    // Update items order
    function updateItemsOrder() {
        if (!ajaxUrl || !adminNonce) {
            console.error('AJAX configuration missing for updating order');
            showNotification('error', 'การกำหนดค่า AJAX ไม่ถูกต้อง');
            return;
        }
        
        var items = [];
        
        sortableList.find('tr').each(function() {
            items.push($(this).data('id'));
        });
        
        console.log('Updating items order via AJAX:', {
            url: ajaxUrl,
            items_count: items.length
        });
        
        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: {
                action: 'org_links_update_order',
                nonce: adminNonce,
                items: items
            },
            success: function(response) {
                console.log('Order update response:', response);
                
                if (response && response.success) {
                    showNotification('success', response.data.message || 'บันทึกการเรียงลำดับเรียบร้อยแล้ว');
                } else {
                    var errorMsg = response && response.data && response.data.message ? 
                                 response.data.message : 'เกิดข้อผิดพลาดในการบันทึกลำดับ';
                                 
                    showNotification('error', errorMsg);
                    console.error('Order update error:', response);
                }
            },
            error: function(xhr, status, error) {
                showNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                console.error('Order update AJAX error:', status, error, xhr.responseText);
                
                // Try to parse the response for more details
                try {
                    var errorDetails = xhr.responseText;
                    console.error('Error details:', errorDetails);
                } catch(e) {
                    console.error('Could not parse error details');
                }
            }
        });
    }
    
    // Document ready event
    $(document).ready(function() {
        init();
    });
    
})(jQuery);