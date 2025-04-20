jQuery(document).ready(($) => {
    // ============= Global Variables =============
    let currentPage = 1;
    let isLoading = false;
    let slideIntervals = {};
    let maxPages = 1;

    // ============= Initialize Application =============
    // Load initial posts
    loadPosts();
    
    // Setup scroll event for infinite scrolling
    setupInfiniteScroll();

    // Setup modal event handlers
    setupModalHandlers();

    // ============= Core Functions =============
    
    /**
     * ตั้งค่า infinite scroll
     */
    function setupInfiniteScroll() {
        $(window).scroll(() => {
            if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
                if(!isLoading && currentPage < maxPages) {
                    currentPage++;
                    loadPosts();
                }
            }
        });
    }
    
    /**
     * ตั้งค่า event handlers สำหรับ modal
     */
    function setupModalHandlers() {
        // Close modal with various triggers
        $('.modal-close').click(closeModal);
        
        $(document).on('click', '.event-post-modal', (e) => {
            if($(e.target).hasClass('event-post-modal')) {
                closeModal();
            }
        });
        
        $(document).keyup((e) => {
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
    }

    /**
     * โหลดโพสต์ผ่าน AJAX
     */
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
            success: handleAjaxSuccess,
            error: handleAjaxError,
            complete: () => {
                isLoading = false;
            }
        });
    }
    
    /**
     * จัดการผลลัพธ์ AJAX ที่สำเร็จ
     */
    function handleAjaxSuccess(response) {
        if(response.success && response.data) {
            $('.event-post-skeleton').remove();
            appendPostsToGrid(response.data);
            maxPages = response.max_pages;
            initializeHoverEffects();
            hideLoader();
        } else {
            console.error('Invalid response format');
            showError('Could not load gallery items');
        }
    }
    
    /**
     * จัดการข้อผิดพลาดจาก AJAX
     */
    function handleAjaxError(xhr, status, error) {
        console.error('Ajax error:', error);
        showError('Error loading gallery items');
    }
    
    /**
     * เพิ่มโพสต์ทั้งหมดไปยัง grid
     */
    function appendPostsToGrid(posts) {
        posts.forEach((post) => {
            const postHtml = createPostHtml(post);
            $('#event-post-grid').append(postHtml);
        });
    }

    // ============= UI Handlers =============
    
    /**
     * แสดง loading spinner
     */
    function showLoader() {
        if($('.loading-spinner').length === 0) {
            $('#event-post-grid').after('<div class="loading-spinner"></div>');
        }
    }

    /**
     * ซ่อน loading spinner
     */
    function hideLoader() {
        $('.loading-spinner').remove();
    }

    /**
     * แสดงข้อความผิดพลาด
     */
    function showError(message) {
        hideLoader();
        const errorHtml = `<div class="event-post-error">${message}</div>`;
        $('#event-post-grid').after(errorHtml);
        
        setTimeout(() => {
            $('.event-post-error').fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }

    /**
     * ปิด modal
     */
    function closeModal() {
        $('.event-post-modal').hide();
    }

    // ============= HTML Generation =============
    
    /**
     * สร้าง HTML สำหรับโพสต์
     */
    function createPostHtml(post) {
        const imageUrl = post.featured_image.thumb || post.featured_image.full || event_post_ajax.placeholder;
        const postUrl = post.permalink;
        
        const formattedDate = formatThaiDate(post.date);
        const categoriesHtml = createCategoriesHtml(post.categories);

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
    
    /**
     * แปลงรูปแบบวันที่เป็นไทย (พ.ศ.)
     */
    function formatThaiDate(dateStr) {
        const dateParts = dateStr.split('/');
        const buddhistYear = parseInt(dateParts[2]) + 543;
        return `${dateParts[0]}/${dateParts[1]}/${buddhistYear}`;
    }
    
    /**
     * สร้าง HTML สำหรับหมวดหมู่
     */
    function createCategoriesHtml(categories) {
        let html = '';
        if(categories && categories.length) {
            categories.forEach((category) => {
                html += `<span class="event-post-category">${category.name}</span>`;
            });
        }
        return html;
    }
    
    /**
     * สร้าง HTML สำหรับ modal gallery grid
     */
    function createModalGrid(images) {
        let html = '';
        if(images && images.length > 0) {
            images.forEach((image) => {
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

    // ============= Event Handlers =============
    
    /**
     * ตั้งค่า hover effects และ event handlers
     */
    function initializeHoverEffects() {
        setupItemHoverEffects();
        setupModalOpenHandlers();
        setupCategoryClickHandlers();
    }
    
    /**
     * ตั้งค่า hover effects สำหรับรายการแต่ละรายการ
     */
    function setupItemHoverEffects() {
        $('.event-post-item').each(function() {
            const $item = $(this);
            const $slideshow = $item.find('.event-post-slideshow');
            const $count = $item.find('.event-post-count');
            const imagesData = $count.data('images');
            
            if(imagesData && imagesData.length > 0) {
                $item.hover(
                    () => handleItemMouseEnter($item, $slideshow, imagesData),
                    () => handleItemMouseLeave($item)
                );
            }
        });
    }
    
    /**
     * จัดการเมื่อเมาส์เข้าไปในรายการ
     */
    function handleItemMouseEnter($item, $slideshow, imagesData) {
        let currentIndex = 0;
        const firstImage = imagesData[0];
        const firstImageUrl = firstImage.thumb || firstImage.full;
        
        if(firstImageUrl) {
            $slideshow.html(`<img src="${firstImageUrl}" alt="${firstImage.alt || ''}">`);
            
            slideIntervals[$item.data('id')] = setInterval(() => {
                currentIndex = (currentIndex + 1) % imagesData.length;
                const nextImage = imagesData[currentIndex];
                const nextImageUrl = nextImage.thumb || nextImage.full;
                
                $slideshow.fadeOut(200, function() {
                    $(this).html(`<img src="${nextImageUrl}" alt="${nextImage.alt || ''}">`).fadeIn(200);
                });
            }, 2000);
        }
    }
    
    /**
     * จัดการเมื่อเมาส์ออกจากรายการ
     */
    function handleItemMouseLeave($item) {
        clearInterval(slideIntervals[$item.data('id')]);
        $item.find('.event-post-slideshow').empty();
    }
    
    /**
     * ตั้งค่า handlers สำหรับการเปิด modal
     */
    function setupModalOpenHandlers() {
        $('.event-post-count').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const images = $(this).data('images');
            if(images && images.length) {
                openImageModal(images);
            }
        });
    }
    
    /**
     * เปิด modal แสดงรูปภาพ
     */
    function openImageModal(images) {
        const modal = $('#event-post-modal');
        const gridHtml = createModalGrid(images);
        modal.find('.modal-gallery-grid').html(gridHtml);
        modal.show();
    }
    
    /**
     * ตั้งค่า handlers สำหรับการคลิกหมวดหมู่
     */
    function setupCategoryClickHandlers() {
        $('.event-post-category').click((e) => {
            e.stopPropagation();
        });
    }
});
