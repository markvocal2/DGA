/* ckan-activity-popup.js */
jQuery(document).ready(function($) {
    
    // Initialize the dialog
    $("#ckan-activity-dialog").dialog({
        autoOpen: false,
        modal: true,
        width: 800,
        height: 500,
        draggable: true,
        resizable: true,
        closeOnEscape: true,
        buttons: [{
            text: ckan_activity.close_text,
            click: function() {
                $(this).dialog("close");
            }
        }],
        open: function() {
            // Override dialog title with term name once loaded
            $('.ui-dialog-content').css('padding', '0.5em 1em');
        }
    });
    
    // Handle click on activity icon
    $(document).on('click', '.ckan-activity-icon', function(e) {
        e.preventDefault();
        
        const termId = $(this).data('term-id');
        const taxonomy = $(this).data('taxonomy');
        const dialog = $("#ckan-activity-dialog");
        const contentDiv = dialog.find('.ckan-activity-content');
        const loader = dialog.find('.ckan-activity-loader');
        
        // Open dialog with loading indicator
        dialog.dialog('option', 'title', ckan_activity.title_text);
        contentDiv.empty();
        loader.show();
        dialog.dialog('open');
        
        // Load activity content via AJAX
        $.ajax({
            url: ckan_activity.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_term_activity',
                nonce: ckan_activity.nonce,
                term_id: termId,
                taxonomy: taxonomy,
                paged: 1
            },
            success: function(response) {
                if (response.success) {
                    dialog.dialog('option', 'title', ckan_activity.title_text + ': ' + response.data.term_name);
                    contentDiv.html(response.data.html);
                    setupPagination(contentDiv, termId, taxonomy);
                } else {
                    contentDiv.html('<p class="error">' + response.data.message + '</p>');
                }
            },
            error: function() {
                contentDiv.html('<p class="error">' + ckan_activity.error_text + '</p>');
            },
            complete: function() {
                loader.hide();
            }
        });
    });
    
    // Setup pagination for the activity dialog
    function setupPagination(container, termId, taxonomy) {
        container.on('click', '.ckan-log-pagination a.page-numbers', function(e) {
            e.preventDefault();
            
            const link = $(this);
            if (link.hasClass('current')) {
                return; // Do nothing if clicking the current page
            }
            
            const url = new URL(link.attr('href'), window.location.origin);
            const page = url.searchParams.get('paged') || 1;
            
            const loader = $("#ckan-activity-dialog").find('.ckan-activity-loader');
            loader.show();
            container.css('opacity', 0.5);
            
            // Load the requested page
            $.ajax({
                url: ckan_activity.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_get_term_activity',
                    nonce: ckan_activity.nonce,
                    term_id: termId,
                    taxonomy: taxonomy,
                    paged: parseInt(page, 10)
                },
                success: function(response) {
                    if (response.success) {
                        container.html(response.data.html);
                    } else {
                        container.html('<p class="error">' + response.data.message + '</p>');
                    }
                },
                error: function() {
                    container.html('<p class="error">' + ckan_activity.error_text + '</p>');
                },
                complete: function() {
                    loader.hide();
                    container.css('opacity', 1);
                }
            });
        });
    }
    
});