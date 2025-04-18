jQuery(document).ready(function($) {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1;

    // โหลดข้อมูลปฏิทินครั้งแรก
    loadCalendarData(currentYear, currentMonth);

    // ฟังก์ชันโหลดข้อมูลปฏิทิน
    function loadCalendarData(year, month) {
        $.ajax({
            url: thaiCalendarData.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_calendar_posts',
                nonce: thaiCalendarData.nonce,
                year: year,
                month: month
            },
            success: function(response) {
                if (response.success) {
                    renderCalendar(response.month_info, response.posts);
                }
            }
        });
    }

    // ฟังก์ชันแสดงปฏิทิน - ปรับปรุงใหม่
    function renderCalendar(monthInfo, postsData) {
        const daysGrid = $('.days-grid');
        daysGrid.empty();

        // ตั้งค่าชื่อเดือนและปี
        $('.current-month-year').text(thaiCalendarData.months[monthInfo.month - 1] + ' ' + monthInfo.buddhist_year);

        // สร้างช่องว่างสำหรับวันที่ยังไม่ถึงต้นเดือน
        for (let i = 0; i < monthInfo.first_day; i++) {
            daysGrid.append('<div class="day empty"><div class="day-content"></div></div>');
        }

        // วนลูปสร้างวันในเดือน
        for (let day = 1; day <= monthInfo.days_in_month; day++) {
            const currentDate = monthInfo.year + '-' + 
                              String(monthInfo.month).padStart(2, '0') + '-' + 
                              String(day).padStart(2, '0');
            
            const dayPosts = postsData[currentDate] || { preview: [], all: [] };
            const hasPostsClass = dayPosts.all.length > 0 ? 'has-posts' : '';
            
            // สร้าง HTML สำหรับวันที่
            let dayHtml = `
                <div class="day ${hasPostsClass}" data-date="${currentDate}">
                    <div class="day-content">
                        <span class="day-number">${day}</span>`;

            // เพิ่มจุดสีแสดงประเภทโพสต์
            if (dayPosts.all.length > 0) {
                // รวมประเภทโพสต์ทั้งหมด (ไม่ซ้ำกัน)
                const postTypes = [...new Set(dayPosts.all.map(post => post.type))];
                
                // เพิ่มจุดสีแสดงประเภทโพสต์
                dayHtml += '<div class="post-indicators">';
                postTypes.forEach(type => {
                    dayHtml += `<div class="post-indicator ${type}"></div>`;
                });
                dayHtml += '</div>';

                // เพิ่มส่วนแสดงโพสต์เมื่อ hover (ซ่อนไว้ก่อน)
                if (dayPosts.all.length > 0) {
                    dayHtml += '<div class="posts-preview">';
                    dayHtml += `<span class="day-number">${day}</span>`;
                    
                    // แสดงรายการโพสต์ทั้งหมด
                    dayPosts.all.forEach(post => {
                        dayHtml += `
                            <a href="${post.url}" class="post-preview-item ${post.type}" title="${post.title}">
                                <span class="preview-dot"></span>
                                <span class="preview-text">${post.title}</span>
                            </a>`;
                    });
                    
                    dayHtml += '</div>';
                }
            }

            dayHtml += `</div></div>`;
            daysGrid.append(dayHtml);
        }

        // Event handlers
        $('.day.has-posts').click(function() {
            const date = $(this).data('date');
            const posts = postsData[date].all;
            showPostsPopup(date, posts);
        });
    }

    // ฟังก์ชันแสดง Popup
    function showPostsPopup(date, posts) {
        const popup = $('.event-popup');
        const [year, month, day] = date.split('-');
        const thaiMonth = thaiCalendarData.months[parseInt(month) - 1];
        const buddhistYear = parseInt(year) + 543;
        
        // แสดงวันที่
        const formattedDate = `${day} ${thaiMonth} ${buddhistYear}`;
        popup.find('.popup-date-display').html(`<div class="date-display">${formattedDate}</div>`);
        
        // เตรียมเนื้อหา
        const postsList = popup.find('.posts-list');
        postsList.empty();
        
        // แสดงรายการโพสต์
        posts.forEach(post => {
            postsList.append(`
                <li class="post-item ${post.type}">
                    <span class="post-type-indicator"></span>
                    <div class="post-content">
                        <a href="${post.url}" class="post-link" target="_blank">${post.title}</a>
                        <div class="post-meta">${post.date} ${post.time}</div>
                    </div>
                </li>
            `);
        });
        
        popup.addClass('active');
    }

    // Event handlers สำหรับปุ่มต่างๆ
    $('.prev-month').click(function() {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
        loadCalendarData(currentYear, currentMonth);
    });

    $('.next-month').click(function() {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        loadCalendarData(currentYear, currentMonth);
    });

    $('.close-popup').click(function() {
        $('.event-popup').removeClass('active');
    });

    // ปิด Popup เมื่อคลิกพื้นหลัง
    $('.event-popup').click(function(e) {
        if ($(e.target).is('.event-popup')) {
            $(this).removeClass('active');
        }
    });

    // เพิ่ม key event สำหรับการกดปุ่ม ESC เพื่อปิด popup
    $(document).keydown(function(e) {
        if (e.key === "Escape" && $('.event-popup').hasClass('active')) {
            $('.event-popup').removeClass('active');
        }
    });
});