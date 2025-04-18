/**
 * Modern Auth Buttons JavaScript
 * Path: /wp-content/themes/your-child-theme/js/modern-auth-buttons.js
 */

jQuery(document).ready(function($) {
    const authButtons = $('.auth-button');
    
    // Add hover effect
    authButtons.on('mousemove', function(e) {
        const button = $(this);
        const rect = button[0].getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update hover effect position
        const effect = button.find('.hover-effect');
        effect.css({
            background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 70%)`
        });
    });

    // Add click animation
    authButtons.on('click', function() {
        const button = $(this);
        const icon = button.find('.icon-wrapper');
        
        // Add ripple effect
        icon.find('.icon-ripple').css({
            transform: 'scale(2)',
            opacity: 0,
            transition: 'all 0.5s ease'
        });

        // Reset ripple effect
        setTimeout(() => {
            icon.find('.icon-ripple').css({
                transform: 'scale(0)',
                opacity: 1,
                transition: 'none'
            });
        }, 500);

        // Add loading state
        button.addClass('loading');
        
        // Remove loading state after navigation starts
        setTimeout(() => {
            button.removeClass('loading');
        }, 300);
    });

    // Improve accessibility
    authButtons.on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this)[0].click();
        }
    });

    // Add smooth scroll to top before navigation
    authButtons.on('click', function(e) {
        if (window.scrollY > 0) {
            e.preventDefault();
            const href = $(this).attr('href');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                window.open(href, '_blank');
            }, 500);
        }
    });
});