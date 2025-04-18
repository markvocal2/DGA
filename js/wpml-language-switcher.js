jQuery(document).ready(function($) {
    // Handle language selection
    $('.wpml-ls-languages a').on('click', function(e) {
        e.preventDefault();
        const selectedLang = $(this).data('lang');
        const currentUrl = window.location.href;
        
        // Save language preference
        $.ajax({
            url: wpmlVars.ajaxurl,
            type: 'POST',
            data: {
                action: 'save_language_preference',
                language: selectedLang,
                nonce: wpmlVars.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Construct new URL with language parameter
                    let newUrl = new URL(currentUrl, window.location.origin);
                    newUrl.searchParams.set('lang', selectedLang);
                    
                    // Redirect to the new URL
                    window.location.href = newUrl.toString();
                }
            }
        });
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.wpml-language-switcher').length) {
            $('.wpml-ls-languages').hide();
        }
    });

    // Show dropdown on click (mobile-friendly)
    $('.wpml-ls-current-language').on('click', function(e) {
        e.stopPropagation();
        $('.wpml-ls-languages').toggle();
    });

    // Set default language if not set
    if (!getCookie('wpml_language_preference')) {
        const defaultLang = wpmlVars.defaultLang || 'th';
        document.cookie = `wpml_language_preference=${defaultLang};path=/;max-age=${30 * 24 * 60 * 60}`;
    }

    // Helper function to get cookie value
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
});