jQuery(document).ready(function($) {
    let currentPage = 1;
    let isLoading = false;
    let slideIntervals = {};
    let maxPages = 1;

    // Load initial posts
    loadPosts();

    // Infinite scroll
    $(window).scroll(function() {
        if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
            if(!isLoading && currentPage < maxPages) {
                currentPage++;
                loadPosts();
            }
        }
    });

    function loadPosts() {
        if(isLoading) return;
        
        isLoading = true;
        showLoader();

        $.ajax({
            url: event_post_ajax.ajaxurl,
            type: 'POST',
            data: {
                action: 'event_post_load_gallery',
                page: currentPage
            },
            success: function(response) {
                if(response.success && response.data) {
                    $('.event-post-skeleton').remove();
                    response.data.forEach(function(post) {
                        const postHtml = createPostHtml(post);
                        $('#event-post-grid').append(postHtml);
                    });
                    maxPages = response.max_pages;
                    initializeHoverEffects();
                    hideLoader();
                } else {
                    console.error('Invalid response format');
                    showError('Could not load gallery items');
                }
            },
            error: function(xhr, status, error) {
                console.error('Ajax error:', error);
                showError('Error loading gallery items');
            },
            complete: function() {
                isLoading = false;
            }
        });
    }

    function showLoader() {
        if($('.loading-spinner').length === 0) {
            $('#event-post-grid').after('<div class="loading-spinner"></div>');
        }
    }

    function hideLoader() {
        $('.loading-spinner').remove();
    }

    function showError(message) {
        hideLoader();
        const errorHtml = `<div class="event-post-error">${message}</div>`;
        $('#event-post-grid').after(errorHtml);
        setTimeout(function() {
            $('.event-post-error').fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }

    function createPostHtml(post) {
        const imageUrl = post.featured_image.thumb || post.featured_image.full || event_post_ajax.placeholder;
        const postUrl = post.permalink; // URL จาก PHP
        
        const dateParts = post.date.split('/');
        const buddhistYear = parseInt(dateParts[2]) + 543;
        const formattedDate = `${dateParts[0]}/${dateParts[1]}/${buddhistYear}`;
        
        let categoriesHtml = '';
        if(post.categories && post.categories.length) {
            post.categories.forEach(function(category) {
                categoriesHtml += `<span class="event-post-category">${category.name}</span>`;
            });
        }

        return `
            <div class="event-post-item">
                <a href="${postUrl}" class="event-post-item-link">
                    <div class="event-post-image-container">
                        <img src="${imageUrl}" class="event-post-image" alt="${post.title}" 
                             onerror="this.onerror=null; this.src='${event_post_ajax.placeholder}';">
                        <div class="event-post-slideshow"></div>
                    </div>
                    <div class="event-post-content">
                        <h3 class="event-post-title">${post.title}</h3>
                        <div class="event-post-meta">
                            <span class="event-post-date">${formattedDate}</span>
                            <span class="event-post-count" data-images='${JSON.stringify(post.gallery_images)}' 
                                  onclick="event.preventDefault(); event.stopPropagation();">
                                ${post.gallery_count} รูป
                            </span>
                        </div>
                        <div class="event-post-categories">
                            ${categoriesHtml}
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    function initializeHoverEffects() {
        $('.event-post-item').each(function() {
            const $item = $(this);
            const $slideshow = $item.find('.event-post-slideshow');
            const $count = $item.find('.event-post-count');
            const imagesData = $count.data('images');
            
            if(imagesData && imagesData.length > 0) {
                $item.hover(
                    function() {
                        let currentIndex = 0;
                        const firstImage = imagesData[0];
                        const firstImageUrl = firstImage.thumb || firstImage.full;
                        
                        if(firstImageUrl) {
                            $slideshow.html(`<img src="${firstImageUrl}" alt="${firstImage.alt || ''}">`);
                            
                            slideIntervals[$(this).data('id')] = setInterval(function() {
                                currentIndex = (currentIndex + 1) % imagesData.length;
                                const nextImage = imagesData[currentIndex];
                                const nextImageUrl = nextImage.thumb || nextImage.full;
                                
                                $slideshow.fadeOut(200, function() {
                                    $(this).html(`<img src="${nextImageUrl}" alt="${nextImage.alt || ''}">`).fadeIn(200);
                                });
                            }, 2000);
                        }
                    },
                    function() {
                        clearInterval(slideIntervals[$(this).data('id')]);
                        $slideshow.empty();
                    }
                );
            }
        });

        // Modal handling
        $('.event-post-count').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            const images = $(this).data('images');
            if(images && images.length) {
                const modal = $('#event-post-modal');
                const gridHtml = createModalGrid(images);
                modal.find('.modal-gallery-grid').html(gridHtml);
                modal.show();
            }
        });

        // ป้องกันการ Bubble ของ Event จาก Category Tags
        $('.event-post-category').click(function(e) {
            e.stopPropagation();
        });
    }

    function createModalGrid(images) {
        let html = '';
        if(images && images.length > 0) {
            images.forEach(function(image) {
                const imageUrl = image.thumb || image.full;
                const fullImageUrl = image.full || image.thumb;
                
                if(imageUrl && fullImageUrl) {
                    html += `
                        <div class="modal-gallery-item">
                            <img src="${imageUrl}" 
                                 alt="${image.alt || ''}" 
                                 class="modal-thumbnail"
                                 data-full="${fullImageUrl}"
                                 onerror="this.onerror=null; this.src='${event_post_ajax.placeholder}';">
                        </div>
                    `;
                }
            });
        }
        return html || '<div class="modal-empty">No images available</div>';
    }

    // Close modal with various triggers
    function closeModal() {
        $('.event-post-modal').hide();
    }

    $('.modal-close').click(closeModal);

    $(document).on('click', '.event-post-modal', function(e) {
        if($(e.target).hasClass('event-post-modal')) {
            closeModal();
        }
    });

    $(document).keyup(function(e) {
        if(e.key === "Escape") {
            closeModal();
        }
    });

    // Handle modal image click
    $(document).on('click', '.modal-thumbnail', function() {
        const fullImage = $(this).data('full');
        if(fullImage) {
            window.open(fullImage, '_blank');
        }
    });
});