// Save this as thai-date-views.js in your child theme's js folder

jQuery(document).ready(function($) {
    // Add smooth hover effect
    $('.thai-date-views span').hover(
        function() {
            $(this).find('i').css('transform', 'scale(1.1)');
        },
        function() {
            $(this).find('i').css('transform', 'scale(1)');
        }
    );
    
    // Animate view count on page load
    $('.post-views').each(function() {
        const $this = $(this);
        const viewCount = parseInt($this.text());
        $({ Counter: 0 }).animate({
            Counter: viewCount
        }, {
            duration: 1000,
            easing: 'swing',
            step: function() {
                $this.find('span').text(Math.ceil(this.Counter));
            }
        });
    });
});