// บันทึกไฟล์นี้ที่ /js/tdep-cards.js ในธีมลูก

jQuery(document).ready(function($) {
    // Add smooth hover effect
    $('.tdep-card').hover(function() {
        $(this).find('.tdep-card-content').addClass('hover');
    }, function() {
        $(this).find('.tdep-card-content').removeClass('hover');
    });

    // Add click animation
    $('.tdep-card').on('click', function() {
        $(this).addClass('clicked');
        setTimeout(() => {
            $(this).removeClass('clicked');
        }, 200);
    });

    // Optional: Add lazy loading for images
    if ('IntersectionObserver' in window) {
        const cards = document.querySelectorAll('.tdep-card-inner');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const backgroundImage = card.style.backgroundImage;
                    if (backgroundImage.includes('data:image')) {
                        const actualImage = card.dataset.background;
                        card.style.backgroundImage = `url(${actualImage})`;
                    }
                    observer.unobserve(card);
                }
            });
        });

        cards.forEach(card => {
            imageObserver.observe(card);
        });
    }
});