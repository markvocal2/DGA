(function($) {
    'use strict';
    
    $(document).ready(function() {
        // เริ่มต้นโหลดโพสต์สำหรับทุก container
        $('.dynamic-post-cards-container').each(function() {
            const container = $(this);
            initPostCards(container);
        });
        
        // ฟังก์ชันเริ่มต้นสำหรับแต่ละ container
        function initPostCards(container) {
            const contentContainer = container.find('.dynamic-post-cards-content');
            const loadingContainer = container.find('.dynamic-post-cards-loading');
            const loadMoreBtn = container.find('.load-more-btn');
            const noResultsMessage = container.find('.no-results-message');
            
            // ตัวแปรสำหรับเก็บข้อมูลสถานะ
            const state = {
                postType: container.data('post-type'),
                postsPerPage: container.data('posts-per-page'),
                category: container.data('category'),
                orderby: 'date',
                order: 'DESC',
                paged: 1,
                maxPages: 1,
                view: container.data('view'),
                isLoading: false,
                search: '',
                year: '',
                searchTimer: null,
                selectedPostId: null, // ใช้เก็บ ID ของโพสต์ที่เลือกจาก autocomplete
                filterField: '' // เพิ่มตัวแปรสำหรับเก็บสถานะการกรองตาม custom field
            };
            
            // ตั้งค่า Autocomplete
            setupAutocomplete();
            
            // เพิ่มปุ่มเฟืองสำหรับมือถือ
            setupMobileFilterToggle();
            
            // โหลดโพสต์ครั้งแรก
            loadPosts();
            
            // ตั้งค่า event listeners
            setupEventListeners();
            
            // ฟังก์ชันตั้งค่า Mobile Filter Toggle
            function setupMobileFilterToggle() {
                // เพิ่มปุ่มเฟืองสำหรับมือถือ
                const toggleButtonId = container.attr('id') + '-mobile-toggle';
                const toggleButton = $('<button id="' + toggleButtonId + '" class="mobile-filter-toggle"><span class="dashicons dashicons-admin-generic"></span></button>');
                
                // เพิ่มปุ่มเข้าไปด้านบนของ controls
                container.find('.dynamic-post-cards-controls').prepend(toggleButton);
                
                // จัดการการคลิกปุ่ม
                toggleButton.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    container.find('.filter-controls').toggleClass('active');
                });
                
                // ปิดเมนูเมื่อคลิกที่อื่น
                $(document).on('click', function(event) {
                    if (!$(event.target).closest('.filter-controls', container).length && 
                        !$(event.target).closest('.mobile-filter-toggle', container).length) {
                        container.find('.filter-controls').removeClass('active');
                    }
                });
            }
            
            // ฟังก์ชันตั้งค่า Autocomplete
            function setupAutocomplete() {
                const searchInput = container.find('.autocomplete-search');
                
                searchInput.autocomplete({
                    source: function(request, response) {
                        $.ajax({
                            url: dynamic_post_cards_params.ajax_url,
                            dataType: "json",
                            data: {
                                action: 'dynamic_post_cards_autocomplete',
                                nonce: dynamic_post_cards_params.nonce,
                                term: request.term,
                                post_type: state.postType // ส่ง post_type จาก state ไปด้วย
                            },
                            success: function(data) {
                                response(data);
                            }
                        });
                    },
                    minLength: 2,
                    select: function(event, ui) {
                        // เมื่อเลือกรายการจาก autocomplete
                        event.preventDefault();
                        
                        // ตั้งค่าค่าใน input
                        $(this).val(ui.item.value);
                        
                        // เก็บ ID ของโพสต์ที่เลือกเพื่อใช้ในการค้นหา
                        if (ui.item.type === 'custom_field') {
                            // ถ้าเลือกจาก custom field ใช้ ID ของโพสต์
                            state.selectedPostId = ui.item.id;
                            state.search = ui.item.id.toString();
                        } else {
                            // ถ้าเลือกจากชื่อเรื่อง ใช้ชื่อเรื่องในการค้นหา
                            state.selectedPostId = null;
                            state.search = ui.item.value;
                        }
                        
                        // ยกเลิกการกรองตาม custom field
                        state.filterField = '';
                        container.find('.filter-badge').removeClass('active');
                        
                        // รีเซ็ตหน้าแล้วโหลดข้อมูลใหม่
                        state.paged = 1;
                        loadPosts();
                        
                        return false;
                    },
                    // แก้ไขปัญหาการแสดงผล dropdown ด้วยการกำหนด position และ z-index
                    position: {
                        my: "left top+5",
                        at: "left bottom",
                        collision: "flip"
                    },
                    // จำกัดการแสดงผลให้อยู่ภายใน container ของเรา
                    appendTo: container
                }).autocomplete("instance")._renderItem = function(ul, item) {
                    // แสดงผล item ใน dropdown
                    let itemClass = "ui-menu-item-wrapper";
                    let itemContent = item.label;
                    
                    // เพิ่ม badge ถ้าเป็น custom field
                    if (item.type === 'custom_field') {
                        const badgeClass = item.meta_key === 'at_docnum_1' ? 'orange-badge-mini' : 'gold-badge-mini';
                        itemClass += " has-badge " + badgeClass;
                    }
                    
                    return $("<li>")
                        .append("<div class='" + itemClass + "'>" + itemContent + "</div>")
                        .appendTo(ul);
                };
                
                // เพิ่มคลาสให้กับ autocomplete dropdown
                $(document).on('autocompleteopen', function() {
                    $('.ui-autocomplete').addClass('dynamic-post-cards-autocomplete');
                });
            }
            
            function setupEventListeners() {
                // สลับมุมมองระหว่าง Card View และ List View
                container.find('.view-mode-btn').on('click', function() {
                    const viewMode = $(this).hasClass('card-view-btn') ? 'card' : 'list';
                    
                    // เปลี่ยนปุ่มที่ active
                    container.find('.view-mode-btn').removeClass('active');
                    $(this).addClass('active');
                    
                    // เปลี่ยน class ของ content container
                    contentContainer.removeClass('card-view list-view').addClass(viewMode + '-view');
                    
                    // อัปเดตสถานะ
                    state.view = viewMode;
                    
                    // อัปเดต layout
                    renderPosts(state.currentPosts || []);
                });
                
                // การเรียงลำดับ
                container.find('.sorting-select').on('change', function() {
                    const sortValue = $(this).val();
                    const [sortBy, sortOrder] = sortValue.split('-');
                    
                    // อัปเดตสถานะ
                    state.orderby = sortBy;
                    state.order = sortOrder.toUpperCase();
                    state.paged = 1;
                    
                    // โหลดโพสต์ใหม่
                    loadPosts();
                });
                
                // การคลิกที่ Badge กรอง
                container.find('.filter-badge').on('click', function() {
                    const field = $(this).data('field');
                    
                    // ถ้าคลิกที่ Badge ที่กำลังใช้อยู่ ให้ยกเลิกการกรอง
                    if (state.filterField === field) {
                        state.filterField = '';
                        $(this).removeClass('active');
                    } else {
                        state.filterField = field;
                        container.find('.filter-badge').removeClass('active');
                        $(this).addClass('active');
                    }
                    
                    // ล้างการค้นหา
                    if (state.search !== '') {
                        state.search = '';
                        container.find('.search-input').val('');
                    }
                    
                    // รีเซ็ตหน้าและค้นหาใหม่
                    state.paged = 1;
                    loadPosts();
                });
                
                // การค้นหา (กำหนด debounce เพื่อไม่ให้ส่ง request มากเกินไป)
                container.find('.search-input').on('input', function() {
                    // ล้างค่า selectedPostId เมื่อมีการพิมพ์ค้นหาใหม่
                    state.selectedPostId = null;
                    
                    const searchTerm = $(this).val().trim();
                    
                    // ล้างการกรอง Badge ถ้ามีการพิมพ์ค้นหา
                    if (searchTerm !== '' && state.filterField !== '') {
                        state.filterField = '';
                        container.find('.filter-badge').removeClass('active');
                    }
                    
                    // ยกเลิก timer เดิม
                    if (state.searchTimer) {
                        clearTimeout(state.searchTimer);
                    }
                    
                    // สร้าง timer ใหม่สำหรับ debounce (รอ 500ms)
                    state.searchTimer = setTimeout(function() {
                        if (state.search !== searchTerm) {
                            state.search = searchTerm;
                            state.paged = 1;
                            loadPosts();
                        }
                    }, 500);
                });
                
                // กรองตามปี
                container.find('.year-filter-select').on('change', function() {
                    const yearValue = $(this).val();
                    
                    // อัปเดตสถานะ
                    state.year = yearValue;
                    state.paged = 1;
                    
                    // โหลดโพสต์ใหม่
                    loadPosts();
                });
                
                // โหลดเพิ่มเติม
                loadMoreBtn.on('click', function() {
                    if (state.paged < state.maxPages && !state.isLoading) {
                        state.paged++;
                        loadPosts(true); // true = append mode
                    }
                });
            }
            
            // ฟังก์ชันโหลดโพสต์
            function loadPosts(append = false) {
                if (state.isLoading) return;
                
                state.isLoading = true;
                
                // ซ่อนข้อความไม่พบผลลัพธ์
                noResultsMessage.hide();
                
                // แสดง loading skeleton ถ้าไม่ใช่โหมด append
                if (!append) {
                    contentContainer.empty();
                    loadingContainer.show();
                } else {
                    loadMoreBtn.text('กำลังโหลด...').prop('disabled', true);
                }
                
                // ส่ง AJAX request
                $.ajax({
                    url: dynamic_post_cards_params.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'dynamic_post_cards_load_posts',
                        nonce: dynamic_post_cards_params.nonce,
                        post_type: state.postType,
                        posts_per_page: state.postsPerPage,
                        paged: state.paged,
                        category: state.category,
                        orderby: state.orderby,
                        order: state.order,
                        search: state.search,
                        year: state.year,
                        filter_field: state.filterField // ส่งค่า filter_field ไปด้วย
                    },
                    success: function(response) {
                        if (response.success) {
                            // ตรวจสอบให้แน่ใจว่ามีโพสต์กลับมา
                            if (response.posts && Array.isArray(response.posts)) {
                                // เก็บข้อมูลสำหรับการใช้งานต่อไป
                                state.currentPosts = append 
                                    ? (state.currentPosts || []).concat(response.posts) 
                                    : response.posts;
                                state.maxPages = response.max_pages;
                                
                                // แสดงโพสต์
                                renderPosts(response.posts, append);
                                
                                // จัดการแสดงข้อความไม่พบผลลัพธ์
                                if (response.posts.length === 0 && !append) {
                                    noResultsMessage.show();
                                } else {
                                    noResultsMessage.hide();
                                }
                                
                                // จัดการปุ่มโหลดเพิ่มเติม
                                if (state.paged < state.maxPages) {
                                    loadMoreBtn.text('โหลดเพิ่มเติม').show().prop('disabled', false);
                                } else {
                                    loadMoreBtn.hide();
                                }
                            } else {
                                console.error('Invalid posts data in response', response);
                                if (!append) {
                                    contentContainer.empty();
                                    noResultsMessage.show();
                                }
                            }
                        } else {
                            console.error('Error loading posts', response);
                            if (!append) {
                                contentContainer.empty();
                                noResultsMessage.show();
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('AJAX error:', error);
                        if (!append) {
                            contentContainer.empty();
                            noResultsMessage.show();
                        }
                    },
                    complete: function() {
                        state.isLoading = false;
                        loadingContainer.hide();
                    }
                });
            }
            
            // ฟังก์ชันแสดงโพสต์
            function renderPosts(posts, append = false) {
                if (!append) {
                    contentContainer.empty();
                }
                
                // ตรวจสอบว่า posts เป็น array และมีข้อมูล
                if (!Array.isArray(posts) || posts.length === 0) {
                    if (!append) {
                        noResultsMessage.show();
                    }
                    return;
                }
                
                // ซ่อนข้อความไม่พบผลลัพธ์ เพราะมีโพสต์แล้ว
                noResultsMessage.hide();
                
                // สร้าง HTML สำหรับแต่ละโพสต์
                posts.forEach(function(post) {
                    let postHtml = '';
                    let imgAttributes = `src="${post.featured_image}" alt="${post.title}" loading="lazy" decoding="async"`;
                    
                    // สร้าง HTML สำหรับ badge ตามเงื่อนไข
                    let badgeHtml = '';
                    if (post.at_docnum_2) {
                        badgeHtml = `<div class="doc-badge gold-badge">เลขที่ มรด. ${post.at_docnum_2}</div>`;
                    } else if (post.at_docnum_1) {
                        badgeHtml = `<div class="doc-badge orange-badge">เลขที่ มสพร. ${post.at_docnum_1}</div>`;
                    }
                    
                    if (state.view === 'card') {
                        postHtml = `
                            <div class="card-item">
                                <a href="${post.permalink}" class="card-image-link">
                                    <img ${imgAttributes} class="card-image">
                                    ${badgeHtml}
                                </a>
                                <!-- โค้ดที่เหลือเหมือนเดิม -->
                            </div>
                        `;
                    } else {
                        postHtml = `
                            <div class="list-item">
                                <a href="${post.permalink}" class="list-image-link">
                                    <img ${imgAttributes} class="list-image">
                                    ${badgeHtml}
                                </a>
                                <div class="list-content">
                                    <h3 class="list-title" title="${post.title}">
                                        <a href="${post.permalink}">${post.title}</a>
                                    </h3>
                                    <div class="list-meta">
                                        <span class="post-date">${post.date}</span>
                                        <span class="visitor-count">${post.visitor_count}</span>
                                    </div>
                                    <div class="list-excerpt">${post.excerpt}</div>
                                    <div class="list-footer">
                                        <a href="${post.permalink}" class="read-more-btn">อ่านต่อ</a>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                    contentContainer.append(postHtml);
                });
                
                // เลื่อนไปที่โพสต์ใหม่ที่โหลดมาถ้าเป็นโหมด append
                if (append && posts.length > 0) {
                    const firstNewPost = contentContainer.children().eq(contentContainer.children().length - posts.length);
                    $('html, body').animate({
                        scrollTop: firstNewPost.offset().top - 30
                    }, 500);
                }
            }
        }
    });
    
})(jQuery);