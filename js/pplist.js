jQuery(document).ready(function($) {
    const PPList = {
        page: 1,
        loading: false,
        container: $('.pplist-container'),
        itemsContainer: $('.pplist-items'),
        loadMoreBtn: $('.pplist-load-more'),
        skeleton: $('.pplist-skeleton'),
        searchInput: $('.pplist-search-input'),
        searchResults: $('.pplist-search-results'),
        groupSelect: $('#pplist-group'), // Updated selector
        dateFromInput: $('#pplist-date-from'),
        dateToInput: $('#pplist-date-to'),
        
        init: function() {
            this.bindEvents();
            this.initSearch();
            this.loadPosts();
        },
        
        bindEvents: function() {
            const self = this;
            
            // Load more button click
            this.loadMoreBtn.on('click', function() {
                self.loadPosts();
            });
            
            // Group filter change event
            this.groupSelect.on('change', function() {
                self.resetAndReload();
            });
            
            // Date filter change
            this.dateFromInput.on('change', function() {
                self.resetAndReload();
            });
            
            
            this.dateToInput.on('change', function() {
                self.resetAndReload();
            });
            
            // Track post views
            this.itemsContainer.on('click', '.pplist-title a', function(e) {
                const postId = $(this).closest('.pplist-item').data('post-id');
                self.incrementView(postId);
            });
            
            // Infinite scroll
            $(window).on('scroll', function() {
                if (self.isNearBottom() && !self.loading) {
                    self.loadPosts();
                }
            });
        },
        
        initSearch: function() {
            const self = this;
            
            // Realtime search with autocomplete
            this.searchInput.on('input', function() {
                const searchTerm = $(this).val();
                
                // Clear existing timeout
                clearTimeout(self.searchTimeout);
                
                // Set new timeout for both autocomplete and search
                self.searchTimeout = setTimeout(function() {
                    if (searchTerm.length >= 2) {
                        // Perform autocomplete
                        self.performAutocomplete(searchTerm);
                        // Perform realtime search
                        self.resetAndReload();
                    } else if (searchTerm.length === 0) {
                        // Clear results if search is empty
                        self.searchResults.empty().hide();
                        self.resetAndReload();
                    }
                }, 300);
            });
            
            // Handle autocomplete item click
            this.searchResults.on('click', '.pplist-suggestion-item', function(e) {
                e.preventDefault();
                const selectedText = $(this).text();
                self.searchInput.val(selectedText);
                self.searchResults.empty().hide();
                self.resetAndReload();
            });
            
            // Close autocomplete when clicking outside
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.pplist-search').length) {
                    self.searchResults.empty().hide();
                }
            });
        },
        
        performAutocomplete: function(term) {
            const self = this;
            
            $.ajax({
                url: pplist_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'pplist_autocomplete',
                    nonce: pplist_ajax.nonce,
                    term: term
                },
                success: function(response) {
                    if (response.success && response.data.length > 0) {
                        self.renderAutocomplete(response.data);
                    } else {
                        self.searchResults.empty().hide();
                    }
                }
            });
        },
        
        renderAutocomplete: function(results) {
            const self = this;
            const ul = $('<ul class="pplist-search-suggestions"></ul>');
            
            results.forEach(function(item) {
                const li = $(`
                    <li>
                        <a href="#" class="pplist-suggestion-item" data-id="${item.id}">
                            ${item.label}
                        </a>
                    </li>
                `);
                ul.append(li);
            });
            
            this.searchResults.html(ul).show();
        },
        
        loadPosts: function() {
            if (this.loading) return;
            
            const self = this;
            this.loading = true;
            this.skeleton.show();
            
            $.ajax({
                url: pplist_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'pplist_load_posts',
                    nonce: pplist_ajax.nonce,
                    page: this.page,
                    posts_per_page: 10,
                    search: this.searchInput.val(),
                    group: this.groupSelect.val(), // Updated from category to group
                    date_from: this.dateFromInput.val(),
                    date_to: this.dateToInput.val()
                },
                success: function(response) {
                    if (response.success) {
                        if (response.data.posts.length > 0) {
                            if (self.page === 1) {
                                self.itemsContainer.empty();
                            }
                            self.renderPosts(response.data.posts);
                            self.page++;
                            
                            if (self.page > response.data.max_pages) {
                                self.loadMoreBtn.hide();
                            } else {
                                self.loadMoreBtn.show();
                            }
                        } else if (self.page === 1) {
                            self.showEmptyMessage();
                            self.loadMoreBtn.hide();
                        }
                    }
                },
                complete: function() {
                    self.loading = false;
                    self.skeleton.hide();
                }
            });
        },
        
        renderPosts: function(posts) {
            const self = this;
            
            posts.forEach(function(post) {
                // สร้าง tooltip content สำหรับรายการไฟล์
                const filesTooltip = post.files.map(function(file) {
                    return `
                        <div class="pplist-tooltip-file">
                            <div class="pplist-tooltip-file-icon"></div>
                            <div class="pplist-tooltip-content">
                                <a href="${file.link}" target="_blank" rel="noopener noreferrer">
                                    ${file.name}
                                </a>
                                <span class="pplist-tooltip-date">${file.date}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                
                const postHtml = `
                    <article class="pplist-item" data-post-id="${post.id}">
                        <h2 class="pplist-title">
                            <a href="${post.link}">${post.title}</a>
                        </h2>
                        <div class="pplist-meta">
                            <span class="pplist-date">
                                <i class="pplist-icon-calendar"></i>
                                ${post.publish_date}
                            </span>
                            <span class="pplist-views">
                                <i class="pplist-icon-eye"></i>
                                <span class="pplist-views-count">${post.views}</span> ครั้ง
                            </span>
                            <span class="pplist-files-count" data-tooltip-content>
                                <i class="pplist-icon-file"></i>
                                <span>${post.files.length} รายการ</span>
                                <div class="pplist-files-tooltip">
                                    ${filesTooltip}
                                </div>
                            </span>
                        </div>
                    </article>
                `;
                
                self.itemsContainer.append(postHtml);
            });
        },
        
        incrementView: function(postId) {
            $.ajax({
                url: pplist_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'pplist_increment_view',
                    nonce: pplist_ajax.nonce,
                    post_id: postId
                },
                success: function(response) {
                    if (response.success) {
                        $(`.pplist-item[data-post-id="${postId}"] .pplist-views-count`)
                            .text(response.data.views);
                    }
                }
            });
        },
        
        resetAndReload: function() {
            this.page = 1;
            this.itemsContainer.empty();
            this.loadMoreBtn.show();
            this.loadPosts();
        },
        
        showEmptyMessage: function() {
            this.itemsContainer.html(`
                <div class="pplist-empty">
                    ไม่พบรายการที่ค้นหา
                </div>
            `);
        },
        
        isNearBottom: function() {
            return $(window).scrollTop() + $(window).height() > 
                   $(document).height() - 200;
        }
    };
    
    // Initialize the PPList object
    PPList.init();
});