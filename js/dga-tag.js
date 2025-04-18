/**
 * DGA Tag System
 * JavaScript สำหรับการจัดการแท็ก
 */
(function($) {
    'use strict';
    
    // Variables
    let tagData = [];
    let currentPostId = 0;
    
    // Initialize
    function init() {
        // Get the current post ID from the page
        currentPostId = getPostId();
        
        // Load all tags
        loadTags();
        
        // Setup event listeners
        setupEventListeners();
    }
    
    // Get the current post ID
    function getPostId() {
        // Try to get from body class
        let bodyClasses = document.body.className.split(' ');
        for (let i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].indexOf('postid-') === 0) {
                return parseInt(bodyClasses[i].replace('postid-', ''));
            }
        }
        return 0;
    }
    
    // Load all tags
    function loadTags() {
        $.ajax({
            url: dgaTagAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'dga_tag_get_tags',
                nonce: dgaTagAjax.nonce,
                post_id: currentPostId
            },
            success: function(response) {
                if (response.success) {
                    tagData = response.data;
                    renderTags();
                } else {
                    showMessage('Error loading tags: ' + response.data, 'error');
                }
            },
            error: function() {
                showMessage('เกิดข้อผิดพลาดขณะโหลดแท็ก', 'error');
            }
        });
    }
    
    // Render tags
    function renderTags() {
        const $tagCloud = $('#dga-tag-cloud');
        $tagCloud.empty();
        
        if (tagData.length === 0) {
            $tagCloud.html('<p>ไม่พบแท็ก</p>');
            return;
        }
        
        tagData.forEach(function(tag) {
            const tagClass = tag.has_tag ? 'dga-tag-item dga-tag-selected' : 'dga-tag-item';
            const $tagElement = $(`
                <div class="${tagClass}" role="listitem" data-tag-id="${tag.id}">
                    <span class="dga-tag-name">${tag.name}</span>
                    <span class="dga-tag-count" aria-label="ใช้ ${tag.count} ครั้ง">${tag.count}</span>
                    <a href="${tag.link}" class="dga-tag-link" aria-label="ดูทุกโพสต์ที่มีแท็ก ${tag.name}">
                        <svg aria-hidden="true" focusable="false" class="dga-tag-icon" viewBox="0 0 24 24">
                            <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z"></path>
                            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path>
                        </svg>
                    </a>
                </div>
            `);
            
            // If we're on a single post/page and user has edit permissions
            if (currentPostId > 0 && $('#dga-tag-admin').length) {
                const toggleButton = $(`
                    <button class="dga-tag-toggle" aria-label="${tag.has_tag ? 'ลบแท็ก' : 'เพิ่มแท็ก'} ${tag.name} สำหรับโพสต์นี้">
                        <svg aria-hidden="true" focusable="false" class="dga-tag-toggle-icon" viewBox="0 0 24 24">
                            <path d="${tag.has_tag ? 'M19 13H5v-2h14v2z' : 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'}"></path>
                        </svg>
                    </button>
                `);
                
                toggleButton.on('click', function(e) {
                    e.preventDefault();
                    togglePostTag(tag.id, tag.has_tag ? 'remove' : 'add');
                });
                
                $tagElement.append(toggleButton);
            }
            
            $tagCloud.append($tagElement);
        });
    }
    
    // Toggle a tag on a post
    function togglePostTag(tagId, actionType) {
        if (currentPostId <= 0) {
            showMessage('ไม่สามารถเพิ่มแท็ก: ไม่ได้กำลังดูโพสต์', 'error');
            return;
        }
        
        $.ajax({
            url: dgaTagAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'dga_tag_toggle_post_tag',
                nonce: dgaTagAjax.nonce,
                post_id: currentPostId,
                tag_id: tagId,
                action_type: actionType
            },
            success: function(response) {
                if (response.success) {
                    showMessage(response.data.message, 'success');
                    loadTags(); // Reload all tags to update counts and status
                } else {
                    showMessage('ข้อผิดพลาด: ' + response.data, 'error');
                }
            },
            error: function() {
                showMessage('เกิดข้อผิดพลาดขณะอัปเดตแท็ก', 'error');
            }
        });
    }
    
    // Add a new tag
    function addNewTag(tagName) {
        $.ajax({
            url: dgaTagAjax.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'dga_tag_add_tag',
                nonce: dgaTagAjax.nonce,
                tag_name: tagName
            },
            success: function(response) {
                if (response.success) {
                    showMessage('สร้างแท็กสำเร็จแล้ว', 'success');
                    $('#dga-tag-input').val(''); // Clear input
                    loadTags(); // Reload all tags
                } else {
                    showMessage('ข้อผิดพลาด: ' + response.data, 'error');
                }
            },
            error: function() {
                showMessage('เกิดข้อผิดพลาดขณะสร้างแท็ก', 'error');
            }
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Add tag button
        $('#dga-tag-add').on('click', function(e) {
            e.preventDefault();
            const tagName = $('#dga-tag-input').val().trim();
            if (tagName) {
                addNewTag(tagName);
            } else {
                showMessage('กรุณาใส่ชื่อแท็ก', 'error');
            }
        });
        
        // Add tag with Enter key
        $('#dga-tag-input').on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                const tagName = $(this).val().trim();
                if (tagName) {
                    addNewTag(tagName);
                } else {
                    showMessage('กรุณาใส่ชื่อแท็ก', 'error');
                }
            }
        });
    }
    
    // Show a message
    function showMessage(message, type) {
        const $messageElement = $('#dga-tag-message');
        $messageElement.text(message).attr('class', 'dga-tag-message dga-tag-message-' + type);
        
        // Clear message after 3 seconds
        setTimeout(function() {
            $messageElement.text('').attr('class', 'dga-tag-message');
        }, 3000);
    }
    
    // Initialize when document is ready
    $(document).ready(init);
    
})(jQuery);