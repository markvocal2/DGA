jQuery(document).ready(function($) {
    // Cache DOM elements
    var $menuToggle = $('.dga-mobile-menu-toggle'),
        $menuClose = $('.dga-mobile-menu-close'),
        $menuOverlay = $('.dga-mobile-menu-overlay'),
        $menuWrapper = $('.dga-mobile-menu-wrapper'),
        $menuContent = $('.dga-mobile-menu-content');
    
    // Load menu via AJAX when toggle is clicked for the first time
    var menuLoaded = false;
    
    function loadMenu() {
        if (!menuLoaded) {
            $menuContent.html('<div class="dga-loading"><div class="spinner"></div></div>');
            
            $.ajax({
                url: dga_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'dga_get_mobile_menu'
                },
                success: function(response) {
                    $menuContent.html(response);
                    menuLoaded = true;
                    initAccordionMenu();
                    console.log('Menu loaded successfully');
                },
                error: function(xhr, status, error) {
                    console.error('AJAX Error:', error);
                    $menuContent.html('<p>Error loading menu. Please try again.</p>');
                }
            });
        }
    }
    
    // Toggle menu visibility
    function openMenu() {
        loadMenu();
        $('body').addClass('dga-mobile-menu-active');
        $menuWrapper.addClass('active');
        $menuOverlay.addClass('active');
        $menuToggle.attr('aria-expanded', 'true');
    }
    
    function closeMenu() {
        $('body').removeClass('dga-mobile-menu-active');
        $menuWrapper.removeClass('active');
        $menuOverlay.removeClass('active');
        $menuToggle.attr('aria-expanded', 'false');
    }
    
    // Initialize accordion menu functionality
    function initAccordionMenu() {
        $('.dga-accordion-toggle').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $this = $(this);
            var $parent = $this.closest('li');
            var $submenu = $parent.children('ul.dga-submenu');
            
            // Toggle current submenu
            $parent.toggleClass('submenu-open');
            $this.attr('aria-expanded', $parent.hasClass('submenu-open'));
            
            // Toggle with slide animation
            $submenu.slideToggle(300);
            
            console.log('Accordion toggle clicked:', $parent.find('> div > a').text());
        });
        
        // Ensure submenus are initially hidden
        $('.dga-submenu').hide();
        
        // Add 'current-menu-item' class detection
        $('.dga-accordion-menu li').each(function() {
            var $this = $(this);
            if ($this.hasClass('current-menu-item') || $this.hasClass('current-menu-parent') || $this.hasClass('current-menu-ancestor')) {
                $this.addClass('current');
                $this.parents('li').addClass('current');
                
                // Open parent menus of active items
                $this.parents('li').addClass('submenu-open');
                $this.parents('li').children('ul.dga-submenu').show();
                $this.parents('li').children('.dga-menu-item-header').children('.dga-accordion-toggle').attr('aria-expanded', true);
            }
        });
    }
    
    // Event listeners
    $menuToggle.on('click', function() {
        if ($('body').hasClass('dga-mobile-menu-active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    $menuClose.on('click', closeMenu);
    $menuOverlay.on('click', closeMenu);
    
    // Close menu on ESC key
    $(document).on('keydown', function(e) {
        if (e.keyCode === 27 && $('body').hasClass('dga-mobile-menu-active')) {
            closeMenu();
        }
    });
    
    // Handle window resize
    $(window).on('resize', function() {
        if ($(window).width() > 991 && $('body').hasClass('dga-mobile-menu-active')) {
            closeMenu();
        }
    });
    
    // เพิ่ม debug info
    console.log('DGA Mobile Menu Accordion initialized');
});