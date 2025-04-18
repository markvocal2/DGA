/**
 * DGA Carousel Slide JavaScript
 * Version: 1.0.4
 */
(function($) {
    'use strict';
    
    // Initialize carousels when DOM is ready
    $(document).ready(function() {
        initDgaCarousels();
    });
    
    // Re-initialize on window resize with debounce
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            $('.dga-carousel-container').each(function() {
                const carousel = $(this).data('dgaCarousel');
                if (carousel) {
                    carousel.updateLayout();
                }
            });
        }, 250);
    });
    
    // Re-initialize on AJAX content load
    $(document).on('ajaxComplete', function() {
        initDgaCarousels();
    });
    
    // Initialize all carousel instances
    function initDgaCarousels() {
        $('.dga-carousel-container').each(function() {
            // Skip if already initialized
            if ($(this).data('dgaCarousel')) {
                return;
            }
            
            // Create new carousel instance
            const carousel = new DgaCarousel(this);
            
            // Store carousel instance in element data
            $(this).data('dgaCarousel', carousel);
            
            // Initialize carousel
            carousel.init();
        });
    }
    
    /**
     * DGA Carousel Constructor
     * @param {HTMLElement} element - The carousel container element
     */
    function DgaCarousel(element) {
        // DOM Elements
        this.container = $(element);
        this.track = this.container.find('.dga-carousel-track');
        this.slides = this.container.find('.dga-carousel-slide');
        this.dotsContainer = this.container.find('.dga-carousel-dots');
        this.prevButton = this.container.find('.dga-carousel-prev');
        this.nextButton = this.container.find('.dga-carousel-next');
        
        // Carousel Data
        this.currentIndex = 2; // Start at slide 2
        this.slideCount = this.slides.length;
        this.slideWidth = 0;
        this.containerWidth = 0;
        this.mainSlidePercent = 60;   // Main slide takes 60% of container width
        this.sideSlidePercent = 20;   // Side slides take 20% each
        this.slideGap = 30;           // Gap between slides in pixels
        
        // Additional Variables
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000; // 5 seconds
        
        // Touch and drag variables
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDragging = false;
        this.startDragX = 0;
        this.currentDragX = 0;
        this.currentLeft = 0;
    }
    
    /**
     * Initialize carousel functionality
     */
    DgaCarousel.prototype.init = function() {
        if (this.slideCount <= 0) {
            return; // No slides, nothing to do
        }
        
        // Generate dots for navigation
        this.generateDots();
        
        // Calculate layout
        this.updateLayout();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        // Start autoplay
        this.startAutoPlay();
        
        // Set initial slide (to slide 2 as requested)
        // Make sure the index is valid
        const initialIndex = Math.min(2, this.slideCount - 1);
        this.goToSlide(initialIndex, false);
    };
    
    /**
     * Generate dot navigation elements
     */
    DgaCarousel.prototype.generateDots = function() {
        this.dotsContainer.empty();
        
        // Only show dots if we have more than one slide
        if (this.slideCount <= 1) {
            return;
        }
        
        for (let i = 0; i < this.slideCount; i++) {
            const dot = $('<button class="dga-carousel-dot" aria-label="Go to slide ' + (i + 1) + '"></button>');
            
            // Set active class for initial dot (slide 2)
            if (i === this.currentIndex) {
                dot.addClass('active');
            }
            
            // Set data attribute for index reference
            dot.data('slideIndex', i);
            
            // Append to dots container
            this.dotsContainer.append(dot);
        }
    };
    
    /**
     * Update carousel layout based on container width
     */
    DgaCarousel.prototype.updateLayout = function() {
        this.containerWidth = this.container.width();
        
        // Calculate slide width based on percentages
        this.slideWidth = (this.containerWidth * this.mainSlidePercent) / 100;
        
        // Set the width for each slide, accounting for the gap
        this.slides.css({
            'width': this.slideWidth + 'px',
            'margin-right': this.slideGap + 'px' // Add gap between slides
        });
        
        // Set width of the track to accommodate all slides with gaps
        const trackWidth = (this.slideWidth + this.slideGap) * this.slideCount;
        this.track.css('width', trackWidth + 'px');
        
        // Update current slide position
        this.goToSlide(this.currentIndex, false);
    };
    
    /**
     * Set up event handlers
     */
    DgaCarousel.prototype.setupEventHandlers = function() {
        const self = this;
        
        // Previous button click
        this.prevButton.on('click', function(e) {
            e.preventDefault();
            self.prevSlide();
        });
        
        // Next button click
        this.nextButton.on('click', function(e) {
            e.preventDefault();
            self.nextSlide();
        });
        
        // Dot navigation click
        this.dotsContainer.on('click', '.dga-carousel-dot', function() {
            const index = $(this).data('slideIndex');
            self.goToSlide(index);
        });
        
        // Touch events for swipe on mobile
        this.track.on('touchstart', function(e) {
            self.touchStartX = e.originalEvent.touches[0].clientX;
            self.currentLeft = parseFloat(self.track.css('left')) || 0;
            self.stopAutoPlay();
            
            // Disable transition for direct dragging
            self.track.css('transition', 'none');
        });
        
        this.track.on('touchmove', function(e) {
            if (!self.touchStartX) return;
            
            const touchX = e.originalEvent.touches[0].clientX;
            const diff = touchX - self.touchStartX;
            
            // Move the carousel with finger
            self.track.css('left', (self.currentLeft + diff) + 'px');
            
            // Prevent page scrolling when swiping carousel
            e.preventDefault();
        });
        
        this.track.on('touchend', function(e) {
            self.touchEndX = e.originalEvent.changedTouches[0].clientX;
            const swipeDistance = self.touchEndX - self.touchStartX;
            
            // Re-enable transition
            self.track.css('transition', 'left 0.4s ease');
            
            if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance
                if (swipeDistance > 0) {
                    self.prevSlide();
                } else {
                    self.nextSlide();
                }
            } else {
                // If swipe was too small, return to current slide
                self.goToSlide(self.currentIndex);
            }
            
            self.touchStartX = 0;
            self.touchEndX = 0;
            self.startAutoPlay();
        });
        
        // Mouse events for drag on desktop
        this.track.on('mousedown', function(e) {
            if (e.which !== 1) return; // Only proceed with left mouse button
            
            self.isDragging = true;
            self.startDragX = e.clientX;
            self.currentLeft = parseFloat(self.track.css('left')) || 0;
            self.stopAutoPlay();
            
            // Disable transition for direct dragging
            self.track.css('transition', 'none');
            
            // Change cursor
            self.track.addClass('dga-dragging');
            
            // Prevent default to avoid text selection while dragging
            e.preventDefault();
        });
        
        $(document).on('mousemove', function(e) {
            if (!self.isDragging) return;
            
            self.currentDragX = e.clientX;
            const diff = self.currentDragX - self.startDragX;
            
            // Move the carousel with mouse
            self.track.css('left', (self.currentLeft + diff) + 'px');
            
            // Prevent text selection while dragging
            e.preventDefault();
        });
        
        $(document).on('mouseup mouseleave', function(e) {
            if (!self.isDragging) return;
            
            self.isDragging = false;
            
            // Re-enable transition
            self.track.css('transition', 'left 0.4s ease');
            
            // Remove dragging class
            self.track.removeClass('dga-dragging');
            
            // Calculate drag distance
            const dragDistance = self.currentDragX - self.startDragX;
            
            if (Math.abs(dragDistance) > 50) { // Minimum drag distance
                if (dragDistance > 0) {
                    self.prevSlide();
                } else {
                    self.nextSlide();
                }
            } else {
                // If drag was too small, return to current slide
                self.goToSlide(self.currentIndex);
            }
            
            self.startAutoPlay();
        });
        
        // Pause autoplay on hover
        this.container.hover(
            function() { self.stopAutoPlay(); },
            function() { self.startAutoPlay(); }
        );
        
        // Keyboard navigation
        $(document).on('keydown', function(e) {
            if (self.container.is(':visible')) {
                if (e.key === 'ArrowLeft') {
                    self.prevSlide();
                } else if (e.key === 'ArrowRight') {
                    self.nextSlide();
                }
            }
        });
    };
    
    /**
     * Go to a specific slide
     * @param {number} index - Slide index to go to
     * @param {boolean} animate - Whether to animate the transition
     */
    DgaCarousel.prototype.goToSlide = function(index, animate = true) {
        // Prevent going to same slide
        if (index === this.currentIndex && animate) {
            return;
        }
        
        // Ensure index is within bounds
        if (index < 0) {
            index = 0;
        } else if (index >= this.slideCount) {
            index = this.slideCount - 1;
        }
        
        // Calculate the side slide width based on container width
        const sideSlideWidth = (this.containerWidth * this.sideSlidePercent) / 100;
        
        // Calculate the offset to center the current slide
        // We need to account for the left side peek, so we offset by that amount
        const centeringOffset = sideSlideWidth + (this.slideGap / 2);
        
        // Calculate position for the track
        const position = -(index * (this.slideWidth + this.slideGap)) + centeringOffset;
        
        // Update current index
        this.currentIndex = index;
        
        // Re-enable transition if it was disabled
        if (animate) {
            this.track.css('transition', 'left 0.4s ease');
        } else {
            this.track.css('transition', 'none');
        }
        
        // Update track position with or without animation
        if (animate) {
            this.isAnimating = true;
            this.track.animate({
                left: position + 'px'
            }, 400, 'swing', () => {
                this.isAnimating = false;
            });
        } else {
            this.track.css('left', position + 'px');
        }
        
        // Update active dot
        this.dotsContainer.find('.dga-carousel-dot').removeClass('active');
        this.dotsContainer.find('.dga-carousel-dot').eq(index).addClass('active');
        
        // Update active slide class
        this.slides.removeClass('active prev next');
        this.slides.eq(index).addClass('active');
        
        // Add prev class to previous slide if it exists
        if (index > 0) {
            this.slides.eq(index - 1).addClass('prev');
        }
        
        // Add next class to next slide if it exists
        if (index < this.slideCount - 1) {
            this.slides.eq(index + 1).addClass('next');
        }
    };
    
    /**
     * Go to next slide
     */
    DgaCarousel.prototype.nextSlide = function() {
        if (this.isAnimating) {
            return;
        }
        
        let nextIndex;
        if (this.currentIndex >= this.slideCount - 1) {
            // If last slide, go to first slide
            nextIndex = 0;
        } else {
            nextIndex = this.currentIndex + 1;
        }
        
        this.goToSlide(nextIndex);
    };
    
    /**
     * Go to previous slide
     */
    DgaCarousel.prototype.prevSlide = function() {
        if (this.isAnimating) {
            return;
        }
        
        let prevIndex;
        if (this.currentIndex <= 0) {
            // If first slide, go to last slide
            prevIndex = this.slideCount - 1;
        } else {
            prevIndex = this.currentIndex - 1;
        }
        
        this.goToSlide(prevIndex);
    };
    
    /**
     * Start auto play functionality
     */
    DgaCarousel.prototype.startAutoPlay = function() {
        const self = this;
        this.stopAutoPlay(); // Clear any existing interval
        
        // Only start autoplay if we have more than one slide
        if (this.slideCount > 1) {
            this.autoPlayInterval = setInterval(function() {
                self.nextSlide();
            }, this.autoPlayDelay);
        }
    };
    
    /**
     * Stop auto play functionality
     */
    DgaCarousel.prototype.stopAutoPlay = function() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    };
    
})(jQuery);