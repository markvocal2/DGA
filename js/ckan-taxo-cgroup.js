jQuery(document).ready(function($) {
    // Handle select all checkbox
    $('#ckan-taxo-select-all').on('change', function() {
        var isChecked = $(this).prop('checked');
        $('.ckan-taxo-term-item input[type="checkbox"]').prop('checked', isChecked);
    });
    
    // Handle search functionality
    $('#ckan-taxo-search').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        
        $('.ckan-taxo-term-item').each(function() {
            var termText = $(this).text().toLowerCase();
            if (termText.indexOf(searchTerm) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    // Handle form submission
    $('#ckan-taxo-cgroup-form').on('submit', function(e) {
        e.preventDefault();
        
        // Show spinner
        $('.ckan-taxo-spinner').addClass('active');
        
        // Clear previous messages
        $('#ckan-taxo-message').removeClass('success error').html('');
        
        // Get selected terms
        var selectedTerms = [];
        $('input[name="ckan_taxo_terms[]"]:checked').each(function() {
            selectedTerms.push($(this).val());
        });
        
        // Get post ID
        var postID = $(this).data('post-id');
        
        // Send AJAX request
        $.ajax({
            url: ckan_taxo_cgroup_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_taxo_cgroup_update',
                nonce: ckan_taxo_cgroup_vars.nonce,
                post_id: postID,
                terms: selectedTerms
            },
            success: function(response) {
                // Hide spinner
                $('.ckan-taxo-spinner').removeClass('active');
                
                if (response.success) {
                    $('#ckan-taxo-message').addClass('success').html(response.data.message);
                } else {
                    $('#ckan-taxo-message').addClass('error').html(response.data.message);
                }
                
                // Hide message after 3 seconds
                setTimeout(function() {
                    $('#ckan-taxo-message').html('').removeClass('success error');
                }, 3000);
            },
            error: function() {
                // Hide spinner
                $('.ckan-taxo-spinner').removeClass('active');
                
                // Show error message
                $('#ckan-taxo-message').addClass('error').html('เกิดข้อผิดพลาดในการประมวลผลคำขอของคุณ');
                
                // Hide message after 3 seconds
                setTimeout(function() {
                    $('#ckan-taxo-message').html('').removeClass('success error');
                }, 3000);
            }
        });
    });
    
    // Check select all status when individual checkboxes change
    $(document).on('change', '.ckan-taxo-term-item input[type="checkbox"]', function() {
        var allChecked = $('.ckan-taxo-term-item input[type="checkbox"]:checked').length === $('.ckan-taxo-term-item input[type="checkbox"]').length;
        $('#ckan-taxo-select-all').prop('checked', allChecked);
    });
});