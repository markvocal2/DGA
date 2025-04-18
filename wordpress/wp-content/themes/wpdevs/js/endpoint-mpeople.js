jQuery(document).ready(function($) {
    // Click handler for MPeople items
    $('.mpeople-item').on('click', function() {
        const postId = $(this).data('id');
        const $content = $(this).find('.mpeople-content');
        
        // Toggle content visibility
        if ($content.hasClass('loading')) {
            return;
        }
        
        if (!$content.hasClass('loaded')) {
            $content.addClass('loading');
            
            // Fetch data from API
            $.ajax({
                url: '/wp-json/mpeople/v1/posts/' + postId,
                type: 'GET',
                success: function(response) {
                    // Build content HTML
                    let html = `
                        <div class="mpeople-article">
                            <div class="mpeople-text">${response.at_content}</div>
                        </div>
                    `;

                    // Add files if available
                    if (response.at_file_standard && response.at_file_standard.length > 0) {
                        html += '<div class="mpeople-files"><h4>เอกสารมาตรฐาน:</h4><ul>';
                        response.at_file_standard.forEach(file => {
                            html += `
                                <li class="mpeople-file">
                                    <a href="${file.at_rp_file_link}" target="_blank" class="file-link">
                                        <span class="file-name">${file.at_rp_file_name}</span>
                                        <span class="file-date">วันที่นำเข้า: ${file.at_rp_file_create}</span>
                                    </a>
                                </li>
                            `;
                        });
                        html += '</ul></div>';
                    }

                    $content.html(html);
                    $content.addClass('loaded');
                },
                error: function() {
                    $content.html('<p class="error">ไม่สามารถโหลดข้อมูลได้</p>');
                },
                complete: function() {
                    $content.removeClass('loading');
                }
            });
        }
        
        $content.slideToggle();
    });
});