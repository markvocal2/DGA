// Reset Password JavaScript
jQuery(document).ready(function($) {
    // Function to show success notification
    function showSuccessNotification() {
        $('#notification-container').fadeIn(300);
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            $('#notification-container').fadeOut(300);
        }, 10000);
    }
    
    // Function to show error notification
    function showErrorNotification() {
        $('#error-notification-container').fadeIn(300);
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            $('#error-notification-container').fadeOut(300);
        }, 10000);
    }
    
    // Close notification on button click
    $('.notification-close').on('click', function() {
        $(this).closest('.notification-container, #notification-container, #error-notification-container').fadeOut(300);
    });
});