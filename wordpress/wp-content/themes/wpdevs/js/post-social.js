(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Initialize all post social widgets
        $('.post-social-widget').each(function() {
            initPostSocialWidget($(this));
        });
        
        // Handle social share clicks
        $(document).on('click', '.share-line', handleLineShare);
        $(document).on('click', '.share-facebook', handleFacebookShare);
        $(document).on('click', '.share-twitter', handleTwitterShare);
    });
    
    function initPostSocialWidget($widget) {
        const postId = $widget.data('post-id');
        
        // Show loading
        $widget.find('.post-social-loading').attr('aria-hidden', 'false').show();
        $widget.find('.post-social-content').attr('aria-hidden', 'true').hide();
        
        // Fetch post data via AJAX
        $.ajax({
            url: post_social_data.ajax_url,
            type: 'POST',
            data: {
                action: 'post_social_get_data',
                post_id: postId,
                nonce: post_social_data.nonce
            },
            success: function(response) {
                if (response.success) {
                    updateWidgetContent($widget, response.data);
                } else {
                    handleAjaxError($widget, response.data.message);
                }
            },
            error: function(xhr, status, error) {
                handleAjaxError($widget, 'เกิดข้อผิดพลาด: ' + error);
            }
        });
    }
    
    function updateWidgetContent($widget, data) {
        // ตรวจสอบว่าควรแสดงแต่ละส่วนหรือไม่
        const showDate = $widget.data('show-date') !== 'off';
        const showCount = $widget.data('show-count') !== 'off';
        const showSocial = $widget.data('show-social') !== 'off';
        
        if (showDate) {
            // Update date
            $widget.find('.post-social-date').show();
            $widget.find('.date-text').text(data.date_text);
        } else {
            $widget.find('.post-social-date').hide();
        }
        
        if (showCount) {
            // Update views
            $widget.find('.post-social-views').show();
            $widget.find('.views-text').text(formatNumber(data.views));
        } else {
            $widget.find('.post-social-views').hide();
        }
        
        if (showSocial) {
            // Show share section
            $widget.find('.post-social-share').show();
            
            // Update share URLs
            const encodedUrl = encodeURIComponent(data.post_url);
            const encodedTitle = encodeURIComponent(data.post_title);
            
            $widget.find('.share-line').attr('data-url', data.post_url);
            $widget.find('.share-facebook').attr('data-url', data.post_url);
            $widget.find('.share-twitter').attr('data-url', data.post_url).attr('data-title', data.post_title);
        } else {
            $widget.find('.post-social-share').hide();
        }
        
        // Hide loading, show content
        $widget.find('.post-social-loading').attr('aria-hidden', 'true').hide();
        $widget.find('.post-social-content').attr('aria-hidden', 'false').show();
        
        // Force layout update to ensure proper inline display
        setTimeout(function() {
            $widget.css('display', 'flex');
        }, 50);
    }
    
    function handleAjaxError($widget, message) {
        console.error('Post Social Widget Error:', message);
        $widget.find('.post-social-loading').html('เกิดข้อผิดพลาด').addClass('error');
    }
    
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    function handleLineShare(e) {
        e.preventDefault();
        const url = $(this).attr('data-url');
        window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url), 'share-line', 'width=550,height=500');
    }
    
    function handleFacebookShare(e) {
        e.preventDefault();
        const url = $(this).attr('data-url');
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), 'share-facebook', 'width=550,height=500');
    }
    
    function handleTwitterShare(e) {
        e.preventDefault();
        const url = $(this).attr('data-url');
        const title = $(this).attr('data-title');
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), 'share-twitter', 'width=550,height=500');
    }
    
})(jQuery);