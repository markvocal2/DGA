/**
 * CKAN Access Permission JavaScript
 *
 * Handles UI interactions for the CKAN permission settings page,
 * including tabs, search, bulk actions, and status updates.
 *
 * Requires jQuery.
 * Expects localized data via wp_localize_script handle 'ckan-allow-permission-admin-script'
 * with object name 'ckan_permission_data' containing at least:
 * - roles: Object containing WordPress roles (wp_roles()->roles)
 * - ajax_url: WordPress admin-ajax.php URL for AJAX operations
 * - nonce: Security nonce for AJAX operations
 * - current_tab: Currently active tab (if any)
 * - admin_url: Base admin URL for the form
 * - success_message: Localized success message
 * - error_message: Localized error message
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        // Check if we're on the correct page
        if (!$('.ckan-permission-settings-wrap').length) {
            return;
        }

        // --- Tab Navigation ---
        // Handle URL-based tab navigation and direct links
        $('.nav-tab').on('click', function(e) {
            var targetTab = $(this).data('tab');
            if (targetTab) {
                // If it's a link with href, let it handle navigation normally
                if ($(this).attr('href') && $(this).attr('href') !== '#') {
                    // Update hidden input before form navigates away
                    $('#current_tab_input').val(targetTab);
                    return true;
                }
                
                e.preventDefault();
                switchToTab(targetTab);
            }
        });

        /**
         * Switch to a specific tab
         * @param {string} tabId The tab identifier to switch to
         */
        function switchToTab(tabId) {
            // Update active tab status in UI
            $('.nav-tab').removeClass('nav-tab-active');
            $('.nav-tab[data-tab="' + tabId + '"]').addClass('nav-tab-active');

            // Show/hide tab content
            $('.tab-content').hide();
            $('#tab-' + tabId).show();

            // Update hidden input
            $('#current_tab_input').val(tabId);

            // Save active tab to localStorage
            try {
                localStorage.setItem('ckanPermissionActiveTab', tabId);
            } catch (error) {
                console.warn("Could not save active tab to localStorage:", error);
            }
        }

        // Check URL for tab parameter
        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            var results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }

        // Initialize tabs - priority: 1) URL param, 2) current_tab from PHP, 3) localStorage, 4) first tab
        var urlTab = getUrlParameter('tab');
        var phpTab = ckan_permission_data && ckan_permission_data.current_tab ? ckan_permission_data.current_tab : '';
        var storageTab = '';
        
        try {
            storageTab = localStorage.getItem('ckanPermissionActiveTab') || '';
        } catch (error) {
            console.warn("Could not access localStorage:", error);
        }
        
        // Determine which tab to show
        var tabToShow = '';
        if (urlTab && $('.nav-tab[data-tab="' + urlTab + '"]').length) {
            tabToShow = urlTab;
        } else if (phpTab && $('.nav-tab[data-tab="' + phpTab + '"]').length) {
            tabToShow = phpTab;
        } else if (storageTab && $('.nav-tab[data-tab="' + storageTab + '"]').length) {
            tabToShow = storageTab;
        } else if ($('.nav-tab:first').length) {
            tabToShow = $('.nav-tab:first').data('tab');
        }
        
        // Switch to the determined tab
        if (tabToShow) {
            switchToTab(tabToShow);
        }


        // --- Search Functionality ---
        $('.search-terms').on('input', function() {
            var searchTerm = $(this).val().toLowerCase().trim();
            // Find parent tab content to limit search scope
            var $tabContent = $(this).closest('.tab-content');
            var $termsContainer = $tabContent.find('.terms-container');

            $termsContainer.find('.term-card').each(function() {
                var $card = $(this);
                var termName = $card.data('term-name') ? $card.data('term-name').toLowerCase() : '';
                var termIdText = $card.find('.term-id').text() ? $card.find('.term-id').text().toLowerCase() : '';

                // Show card if search is empty or matches term name or ID
                if (searchTerm === '' || termName.includes(searchTerm) || termIdText.includes(searchTerm)) {
                    $card.show();
                } else {
                    $card.hide();
                }
            });
        });

        // --- Select/Deselect All Buttons (Affects Visible Terms Only) ---
        $('.select-all-btn').on('click', function() {
            var taxonomy = $(this).data('taxonomy');
            // Select checkboxes only in visible cards in this tab
            $('#tab-' + taxonomy + ' .term-card:visible .role-checkbox').prop('checked', true).trigger('change');
        });

        $('.deselect-all-btn').on('click', function() {
            var taxonomy = $(this).data('taxonomy');
            // Deselect checkboxes only in visible cards in this tab
            $('#tab-' + taxonomy + ' .term-card:visible .role-checkbox').prop('checked', false).trigger('change');
        });

        // --- Save Single Term via AJAX ---
        $('.ckan-permission-settings-wrap').on('click', '.save-term-btn', function() {
            var $button = $(this);
            var termId = $button.data('term-id');
            var taxonomy = $button.data('taxonomy');
            var $card = $button.closest('.term-card');
            
            saveTermSettings($button, termId, taxonomy, $card);
        });
        
        // --- Save Entire Taxonomy Tab via AJAX ---
        $('.save-taxonomy-btn').on('click', function() {
            var $button = $(this);
            var taxonomy = $button.data('taxonomy');
            saveTaxonomySettings($button, taxonomy);
        });
        
        /**
         * Save settings for a single term via AJAX
         * @param {jQuery} $button The button element that triggered the save
         * @param {number} termId The term ID to save
         * @param {string} taxonomy The taxonomy slug
         * @param {jQuery} $card The term card element
         */
        function saveTermSettings($button, termId, taxonomy, $card) {
            if ($button.hasClass('is-saving')) {
                return; // Prevent duplicate submissions
            }
            
            // Show loading state
            var originalButtonText = $button.text();
            $button.addClass('is-saving').html('<span class="ckan-spinner"></span> กำลังบันทึก...');
            
            // Collect all selected roles for this term
            var selectedRoles = [];
            $card.find('.role-checkbox:checked').each(function() {
                selectedRoles.push($(this).data('role-key'));
            });
            
            // Send AJAX request
            $.ajax({
                url: ckan_permission_data.ajax_url,
                type: 'POST',
                data: {
                    action: 'save_ckan_permissions',
                    nonce: ckan_permission_data.nonce,
                    taxonomy: taxonomy,
                    term_id: termId,
                    roles: selectedRoles
                },
                success: function(response) {
                    if (response.success) {
                        showStatusMessage(response.data.message, 'success');
                        updateTermStatusDisplay($card.find('.role-checkbox').first());
                    } else {
                        showStatusMessage(response.data.message || ckan_permission_data.error_message, 'error');
                    }
                },
                error: function() {
                    showStatusMessage(ckan_permission_data.error_message, 'error');
                },
                complete: function() {
                    // Restore button state
                    $button.removeClass('is-saving').text(originalButtonText);
                }
            });
        }
        
        /**
         * Save settings for an entire taxonomy tab via AJAX
         * @param {jQuery} $button The button element that triggered the save
         * @param {string} taxonomy The taxonomy slug
         */
        function saveTaxonomySettings($button, taxonomy) {
            if ($button.hasClass('is-saving')) {
                return; // Prevent duplicate submissions
            }
            
            // Show loading state
            var originalButtonText = $button.text();
            $button.addClass('is-saving').html('<span class="ckan-spinner"></span> กำลังบันทึก...');
            
            // Get all term cards in this taxonomy tab
            var $cards = $('#tab-' + taxonomy + ' .term-card');
            var totalCards = $cards.length;
            var processedCards = 0;
            var hasErrors = false;
            
            // If no cards, show message and return
            if (totalCards === 0) {
                showStatusMessage('ไม่พบ Term ที่จะบันทึก', 'warning');
                $button.removeClass('is-saving').text(originalButtonText);
                return;
            }
            
            // Process each card sequentially
            $cards.each(function(index) {
                var $card = $(this);
                var termId = $card.data('term-id');
                
                // Collect all selected roles for this term
                var selectedRoles = [];
                $card.find('.role-checkbox:checked').each(function() {
                    selectedRoles.push($(this).data('role-key'));
                });
                
                // Send AJAX request for this term
                $.ajax({
                    url: ckan_permission_data.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'save_ckan_permissions',
                        nonce: ckan_permission_data.nonce,
                        taxonomy: taxonomy,
                        term_id: termId,
                        roles: selectedRoles
                    },
                    success: function(response) {
                        if (!response.success) {
                            hasErrors = true;
                        }
                        updateTermStatusDisplay($card.find('.role-checkbox').first());
                    },
                    error: function() {
                        hasErrors = true;
                    },
                    complete: function() {
                        processedCards++;
                        
                        // Check if all cards have been processed
                        if (processedCards === totalCards) {
                            // All done, restore button and show status
                            $button.removeClass('is-saving').text(originalButtonText);
                            
                            if (hasErrors) {
                                showStatusMessage('เกิดข้อผิดพลาดขณะบันทึกข้อมูลบางส่วน โปรดตรวจสอบและลองอีกครั้ง', 'error');
                            } else {
                                showStatusMessage('บันทึกการตั้งค่าสำหรับ ' + taxonomy + ' เรียบร้อยแล้ว', 'success');
                            }
                        }
                    }
                });
            });
        }

        /**
         * Display status message to the user
         * @param {string} message Message to display
         * @param {string} type Message type ('success', 'error', 'warning')
         */
        function showStatusMessage(message, type) {
            var $status = $('#ckan-permission-status');
            var $message = $('#ckan-permission-status-message');
            
            // Set message and styling
            $message.text(message);
            $status.removeClass('status-success status-error status-warning')
                   .addClass('status-' + type)
                   .fadeIn();
            
            // Auto-hide after delay
            setTimeout(function() {
                $status.fadeOut();
            }, 5000);
        }

        // --- Update Term Status on Checkbox Change ---
        $('.ckan-permission-settings-wrap').on('change', '.role-checkbox', function() {
            updateTermStatusDisplay($(this));
        });

        // --- Initial Status Update on Page Load ---
        $('.role-checkbox').each(function() {
            updateTermStatusDisplay($(this));
        });

        /**
         * Update the visual status indicator for a term card
         * @param {jQuery} $checkbox A checkbox element within the term card
         */
        function updateTermStatusDisplay($checkbox) {
            var $termCard = $checkbox.closest('.term-card');
            // Check if card exists
            if (!$termCard.length) {
                console.warn("Could not find parent .term-card for checkbox:", $checkbox);
                return;
            }

            var $statusIndicator = $termCard.find('.status-indicator');
            var $statusText = $termCard.find('.status-text');

            // Check if status elements exist
            if (!$statusIndicator.length || !$statusText.length) {
                 console.warn("Could not find status elements in card:", $termCard);
                 return;
            }

            // Count total and checked checkboxes
            var $checkboxesInCard = $termCard.find('.role-checkbox');
            var totalCheckboxes = $checkboxesInCard.length;
            var checkedCheckboxes = $checkboxesInCard.filter(':checked').length;
            var guestIsChecked = $termCard.find('.role-checkbox[data-role-key="guest"]').is(':checked');

            // Calculate total possible roles (WP roles + 1 for guest)
            var totalPossibleRoles = 0;
            if (typeof ckan_permission_data !== 'undefined' && typeof ckan_permission_data.roles === 'object') {
                 totalPossibleRoles = Object.keys(ckan_permission_data.roles).length + 1; // +1 for guest
            } else {
                 // Fallback if localized data is missing
                 console.warn("Localized 'ckan_permission_data.roles' not found. Status calculation might be inaccurate.");
                 totalPossibleRoles = totalCheckboxes;
            }

            var statusClass = 'restricted'; // Default status: restricted
            var statusText = 'จำกัดทั้งหมด';

            if (checkedCheckboxes > 0) {
                // Check if all WP roles (excluding guest) are selected
                var allWpRolesChecked = true;
                $checkboxesInCard.each(function() {
                    if ($(this).data('role-key') !== 'guest' && !$(this).is(':checked')) {
                        allWpRolesChecked = false;
                        return false; // Exit .each loop early
                    }
                });

                // Set status based on guest and other roles
                if (guestIsChecked && allWpRolesChecked) {
                    statusClass = 'public'; // Status: public to everyone
                    statusText = 'เปิดให้ทุกคน';
                } else if (guestIsChecked && checkedCheckboxes === 1) {
                    statusClass = 'public_guest'; // Status: guest only
                    statusText = 'เฉพาะ Guest';
                } else {
                    statusClass = 'partial'; // Status: partially restricted
                    statusText = 'จำกัดบางส่วน';
                }
            }

            // Update status indicator classes and text
            $statusIndicator.removeClass('status-public status-public_guest status-partial status-restricted')
                           .addClass('status-' + statusClass);
            $statusText.text(statusText);
        }

        // --- Form Submit Handler ---
        $('#ckan-permission-form').on('submit', function() {
            var $submitButton = $('#ckan_permission_submit');
            
            // Store the active tab in hidden input
            var activeTab = $('.nav-tab-active').data('tab');
            if (activeTab) {
                $('#current_tab_input').val(activeTab);
            }
            
            // Disable button and change text to prevent duplicate submissions
            $submitButton.prop('disabled', true).val('กำลังบันทึก...').addClass('is-saving');
            
            // Form will submit normally
            return true;
        });
        
        // Re-enable submit button if page was refreshed or back button used
        window.onpageshow = function(event) {
            if (event.persisted) {
                // Page was loaded from cache (back/forward button)
                $('#ckan_permission_submit').prop('disabled', false)
                                           .val('บันทึกการตั้งค่าทั้งหมด')
                                           .removeClass('is-saving');
            }
        };

    }); // End document ready

})(jQuery); // End jQuery wrapper