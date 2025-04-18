/*
 * ckan-edit-taxo-term.js
 * Handles editing and deleting terms for the 'ckan' post type via AJAX
 * from the [ckan_edit_taxo_term] shortcode.
 * Also triggers an update for the [ckan-edit-log] shortcode if present.
 */
jQuery(document).ready(function($) {

    // Get the main wrapper for the term editor table(s)
    const wrapper = $('.ckan-taxo-term-editor-wrapper');
    // Get the div where AJAX messages will be displayed (within the editor wrapper)
    const messageDiv = $('#ckan-ajax-messages'); // Make sure this ID exists in your shortcode's HTML output

    // Check if localized data is available (should be from wp_localize_script)
    if (typeof ckan_taxo_term_ajax === 'undefined') {
        console.error('CKAN Term Editor Error: Localized script data (ckan_taxo_term_ajax) is missing.');
        // Optionally display an error to the user in the messageDiv
        if (messageDiv.length) {
             showMessage('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลสำคัญ กรุณาลองรีเฟรชหน้า');
        }
        return; // Stop execution if essential data is missing
    }

    // --- Display AJAX Messages ---
    function showMessage(type, text) {
        if (!messageDiv.length) return; // Don't try to show if div doesn't exist

        const messageClass = type === 'success' ? 'notice-success' : (type === 'error' ? 'notice-error' : 'notice-info');
        const message = $(`<div class="notice ${messageClass}">${text}<span class="dismiss-notice" title="ปิด">×</span></div>`);

        messageDiv.html(message); // Replace previous message
        message.find('.dismiss-notice').on('click', function() {
            $(this).parent().fadeOut(300, function() { $(this).remove(); });
        });

        // Auto-dismiss success messages after 5 seconds
        if (type === 'success') {
            setTimeout(function() {
                message.fadeOut(500, function() { $(this).remove(); });
            }, 5000);
        }
         // Scroll to messages if they are out of view? (Optional)
         // $('html, body').animate({ scrollTop: messageDiv.offset().top - 50 }, 500);
    }

    // --- Add/Remove Loading State ---
    function setLoadingState(termRow, isLoading) {
        if (!termRow || !termRow.length) return;
        if (isLoading) {
            termRow.addClass('term-row-loading');
            termRow.find('button').prop('disabled', true);
        } else {
            termRow.removeClass('term-row-loading');
            termRow.find('button').prop('disabled', false);
        }
    }

    // --- Trigger Log Update Function ---
    function triggerLogUpdate() {
        // Check if the log container from the OTHER shortcode exists on the page
        if ($('#ckan-log-container').length) {
            console.log('Triggering ckanLogNeedsUpdate event.');
            $(document).trigger('ckanLogNeedsUpdate');
        } else {
            console.log('Log container #ckan-log-container not found, skipping log update trigger.');
        }
    }


    // --- Edit Term (using Event Delegation) ---
    wrapper.on('click', '.ckan-edit-term', function(e) {
        e.preventDefault();
        const button = $(this);
        const termRow = button.closest('tr');
        const termId = button.data('term-id');
        const taxonomy = button.data('taxonomy');
        const currentName = button.data('term-name'); // Use current name as default in prompt

        if (!termId || !taxonomy) {
            console.error('Edit Term Error: Missing term-id or taxonomy data attribute.');
            showMessage('error', ckan_taxo_term_ajax.error_generic || 'ข้อมูลสำหรับแก้ไขไม่ครบถ้วน');
            return;
        }

        // Simple prompt for new name (Consider replacing with a modal for better UX)
        const newName = prompt(ckan_taxo_term_ajax.enter_new_name || 'กรุณาใส่ชื่อ Term ใหม่:', currentName);

        // Validate the input from prompt
        if (newName === null) {
            // User cancelled
            return;
        }
        const trimmedNewName = newName.trim();
        if (trimmedNewName === '' || trimmedNewName === currentName) {
            // User entered nothing, or the name hasn't changed
            // Optionally provide feedback: showMessage('info', 'ชื่อ Term ไม่มีการเปลี่ยนแปลง');
            return;
        }

        setLoadingState(termRow, true);
        showMessage('info', 'กำลังบันทึกการแก้ไข...'); // Optional: show info message

        $.ajax({
            url: ckan_taxo_term_ajax.ajax_url,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'ckan_edit_term_action',    // Matches PHP action hook
                nonce: ckan_taxo_term_ajax.nonce,   // Security nonce from localize_script
                term_id: termId,
                taxonomy: taxonomy,
                new_name: trimmedNewName             // Send the trimmed new name
            },
            success: function(response) {
                if (response && response.success) {
                    // --- Update successful ---
                    const updatedTerm = response.data.term;

                    // Update the term name in the table cell
                    termRow.find('td.column-name .term-name').text(updatedTerm.name);

                    // Update the data attribute on the button itself for subsequent edits
                    button.data('term-name', updatedTerm.name);

                    // Optionally update slug if displayed and returned in response
                    // if (updatedTerm.slug && termRow.find('td.column-slug').length) {
                    //    termRow.find('td.column-slug').text(updatedTerm.slug);
                    // }

                    showMessage('success', response.data.message || ckan_taxo_term_ajax.success_edit);

                    // --- Trigger the log update ---
                    triggerLogUpdate();

                } else {
                    // --- Update failed (server responded with success: false) ---
                    const errorMsg = (response && response.data && response.data.message) ? response.data.message : ckan_taxo_term_ajax.error_generic;
                    showMessage('error', errorMsg);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // --- AJAX request itself failed ---
                console.error("Edit Term AJAX Error:", textStatus, errorThrown, jqXHR.responseText);
                let errorMsg = ckan_taxo_term_ajax.error_generic;
                // Try to get more specific error from responseJSON if available
                if (jqXHR.responseJSON && jqXHR.responseJSON.data && jqXHR.responseJSON.data.message) {
                    errorMsg = jqXHR.responseJSON.data.message;
                } else if (jqXHR.statusText) {
                    errorMsg += ` (${jqXHR.statusText})`;
                }
                showMessage('error', errorMsg);
            },
            complete: function() {
                // Always remove loading state, regardless of success or error
                setLoadingState(termRow, false);
            }
        });
    });

    // --- Delete Term (using Event Delegation) ---
    wrapper.on('click', '.ckan-delete-term', function(e) {
        e.preventDefault();
        const button = $(this);
        const termRow = button.closest('tr');
        const termId = button.data('term-id');
        const taxonomy = button.data('taxonomy');
        const termName = button.data('term-name') || 'รายการนี้'; // Fallback name for confirmation

        if (!termId || !taxonomy) {
            console.error('Delete Term Error: Missing term-id or taxonomy data attribute.');
            showMessage('error', ckan_taxo_term_ajax.error_generic || 'ข้อมูลสำหรับลบไม่ครบถ้วน');
            return;
        }

        // Confirmation dialog using localized string
        const confirmMessage = (ckan_taxo_term_ajax.delete_confirm || 'คุณแน่ใจหรือไม่ว่าต้องการลบ "%s"? การกระทำนี้ไม่สามารถย้อนกลับได้').replace('%s', termName);
        if (!confirm(confirmMessage)) {
            return; // User cancelled
        }

        setLoadingState(termRow, true);
        showMessage('info', 'กำลังลบ...'); // Optional: show info message

        $.ajax({
            url: ckan_taxo_term_ajax.ajax_url,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'ckan_delete_term_action', // Matches PHP action hook
                nonce: ckan_taxo_term_ajax.nonce,   // Security nonce
                term_id: termId,
                taxonomy: taxonomy
            },
            success: function(response) {
                if (response && response.success) {
                    // --- Deletion successful ---
                    showMessage('success', response.data.message || ckan_taxo_term_ajax.success_delete);

                    // Remove the term row from the table visually
                    termRow.fadeOut(400, function() {
                        const tbody = $(this).closest('tbody');
                        $(this).remove();
                        // Optional: Check if the table body is now empty and show a message
                        if(tbody.children('tr').length === 0) {
                            // You might need a more specific selector if multiple tables exist
                            tbody.html('<tr><td colspan="' + tbody.closest('table').find('thead th').length + '">ไม่มีข้อมูล Term</td></tr>');
                        }
                    });

                    // --- Trigger the log update ---
                    triggerLogUpdate();

                } else {
                     // --- Deletion failed (server responded with success: false) ---
                    const errorMsg = (response && response.data && response.data.message) ? response.data.message : ckan_taxo_term_ajax.error_generic;
                    showMessage('error', errorMsg);
                    // Only remove loading state on error for delete, as success removes the row
                    setLoadingState(termRow, false);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 // --- AJAX request itself failed ---
                 console.error("Delete Term AJAX Error:", textStatus, errorThrown, jqXHR.responseText);
                 let errorMsg = ckan_taxo_term_ajax.error_generic;
                 if (jqXHR.responseJSON && jqXHR.responseJSON.data && jqXHR.responseJSON.data.message) {
                    errorMsg = jqXHR.responseJSON.data.message;
                 } else if (jqXHR.statusText) {
                     errorMsg += ` (${jqXHR.statusText})`;
                 }
                 showMessage('error', errorMsg);
                 setLoadingState(termRow, false); // Remove loading state on error
            }
            // No 'complete' needed here usually, as success removes the row.
            // If you need something to happen always *after* success/error (even if row removed), add it here.
        });
    });

    // --- Dismiss messages via button ---
    // Use event delegation in case messages are added dynamically
     if (messageDiv.length) {
        messageDiv.on('click', '.dismiss-notice', function() {
            $(this).parent().fadeOut(300, function() { $(this).remove(); });
        });
     }

});