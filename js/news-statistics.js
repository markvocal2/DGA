/**
 * News Statistics Dashboard JavaScript
 * 
 * จัดการ AJAX requests และการแสดงผลกราฟสำหรับระบบรายงานสถิติโพส
 */

(function($) {
    'use strict';
    
    // Chart instances
    let postsChart = null;
    let activitiesChart = null;
    
    // Chart colors (blue and orange theme)
    const chartColors = {
        blue: 'rgba(0, 123, 255, 0.7)',
        lightBlue: 'rgba(0, 123, 255, 0.3)',
        orange: 'rgba(255, 123, 0, 0.7)',
        lightOrange: 'rgba(255, 123, 0, 0.3)',
        red: 'rgba(255, 59, 48, 0.7)',
        lightRed: 'rgba(255, 59, 48, 0.3)',
        green: 'rgba(40, 167, 69, 0.7)',
        lightGreen: 'rgba(40, 167, 69, 0.3)'
    };
    
    /**
     * Initialize the dashboard when the document is ready
     */
    $(document).ready(function() {
        // Initialize date range picker
        initDateRangePicker();
        
        // Setup event handlers
        setupEventHandlers();
        
        // Load initial data
        loadStatistics();
    });
    
    /**
     * Initialize the date range picker
     */
    function initDateRangePicker() {
        $('#date-range').daterangepicker({
            opens: 'left',
            startDate: moment().subtract(30, 'days'),
            endDate: moment(),
            ranges: {
                'วันนี้': [moment(), moment()],
                'เมื่อวาน': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                '7 วันที่ผ่านมา': [moment().subtract(6, 'days'), moment()],
                '30 วันที่ผ่านมา': [moment().subtract(29, 'days'), moment()],
                'เดือนนี้': [moment().startOf('month'), moment().endOf('month')],
                'เดือนที่แล้ว': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            locale: {
                format: 'DD/MM/YYYY',
                applyLabel: 'ตกลง',
                cancelLabel: 'ยกเลิก',
                fromLabel: 'จาก',
                toLabel: 'ถึง',
                customRangeLabel: 'กำหนดเอง',
                daysOfWeek: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
                monthNames: [
                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ],
                firstDay: 0
            }
        });
    }
    
    /**
     * Setup event handlers
     */
    function setupEventHandlers() {
        // Apply filters button click
        $('#apply-filters').on('click', function() {
            loadStatistics();
        });
    }
    
    /**
     * Load statistics via AJAX
     */
    function loadStatistics() {
        // Show loader
        $('.news-statistics-loader').show();
        $('.news-statistics-charts').hide();
        
        // Get filter values
        const dateRange = $('#date-range').val().split(' - ');
        const startDate = moment(dateRange[0], 'DD/MM/YYYY').format('YYYY-MM-DD');
        const endDate = moment(dateRange[1], 'DD/MM/YYYY').format('YYYY-MM-DD');
        const termId = $('#term-filter').val();
        
        // Make AJAX request
        $.ajax({
            url: news_statistics_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'get_news_statistics',
                nonce: news_statistics_vars.nonce,
                start_date: startDate,
                end_date: endDate,
                term_id: termId
            },
            success: function(response) {
                if (response.success) {
                    // Process and display the data
                    processStatisticsData(response.data);
                } else {
                    console.error('Error loading statistics:', response.data.message);
                    alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + response.data.message);
                }
                
                // Hide loader
                $('.news-statistics-loader').hide();
                $('.news-statistics-charts').show();
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error);
                
                // Hide loader
                $('.news-statistics-loader').hide();
            }
        });
    }
    
    /**
     * Process statistics data and update charts
     */
    function processStatisticsData(data) {
        // Update summary data
        $('#total-posts').text(data.summary.total_posts);
        $('#total-views').text(data.summary.total_views);
        $('#total-updates').text(data.summary.total_updates);
        $('#total-deleted').text(data.summary.total_deleted);
        
        // Update posts chart
        updatePostsChart(data.post_counts);
        
        // Update activities chart
        updateActivitiesChart(data.post_views, data.post_updates, data.deleted_posts);
    }
    
    /**
     * Update the posts chart
     */
    function updatePostsChart(postCounts) {
        const labels = Object.keys(postCounts);
        const data = Object.values(postCounts);
        
        // Destroy existing chart if it exists
        if (postsChart) {
            postsChart.destroy();
        }
        
        // Format date labels for better display
        const formattedLabels = labels.map(label => {
            const date = moment(label);
            return date.format('DD MMM');
        });
        
        // สร้าง wrapper ที่ควบคุมขนาดหากยังไม่มี
        if ($('#posts-chart').parent().hasClass('chart-container') && !$('#posts-chart').parent().find('.chart-wrapper').length) {
            $('#posts-chart').wrap('<div class="chart-wrapper"></div>');
        }
        
        // Create new chart
        const ctx = document.getElementById('posts-chart').getContext('2d');
        postsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels,
                datasets: [{
                    label: 'จำนวนโพส',
                    data: data,
                    backgroundColor: chartColors.lightBlue,
                    borderColor: chartColors.blue,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: chartColors.blue,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // ตั้งค่านี้เป็น false เพื่อให้ควบคุมขนาดได้อิสระ
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 14
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            family: 'Sarabun, sans-serif',
                            size: 14
                        },
                        bodyFont: {
                            family: 'Sarabun, sans-serif',
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return `จำนวน: ${context.raw} โพส`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 12
                            },
                            color: '#555',
                            maxRotation: 45, // หมุนป้ายชื่อเพื่อประหยัดพื้นที่
                            minRotation: 45  // หมุนป้ายชื่อเพื่อประหยัดพื้นที่
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 12
                            },
                            color: '#555',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                // จำกัดความสูงสูงสุด
                layout: {
                    padding: {
                        top: 5,
                        right: 10,
                        bottom: 5,
                        left: 10
                    }
                }
            }
        });
    }
    
    /**
     * Update the activities chart
     */
    function updateActivitiesChart(postViews, postUpdates, deletedPosts) {
        const labels = Object.keys(postViews);
        const viewsData = Object.values(postViews);
        const updatesData = Object.values(postUpdates);
        const deletedData = Object.values(deletedPosts);
        
        // Destroy existing chart if it exists
        if (activitiesChart) {
            activitiesChart.destroy();
        }
        
        // Format date labels for better display
        const formattedLabels = labels.map(label => {
            const date = moment(label);
            return date.format('DD MMM');
        });
        
        // สร้าง wrapper ที่ควบคุมขนาดหากยังไม่มี
        if ($('#activities-chart').parent().hasClass('chart-container') && !$('#activities-chart').parent().find('.chart-wrapper').length) {
            $('#activities-chart').wrap('<div class="chart-wrapper"></div>');
        }
        
        // Create new chart
        const ctx = document.getElementById('activities-chart').getContext('2d');
        activitiesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [
                    {
                        label: 'การเข้าชม',
                        data: viewsData,
                        backgroundColor: chartColors.blue,
                        borderColor: chartColors.blue,
                        borderWidth: 1
                    },
                    {
                        label: 'การอัพเดต',
                        data: updatesData,
                        backgroundColor: chartColors.orange,
                        borderColor: chartColors.orange,
                        borderWidth: 1
                    },
                    {
                        label: 'การลบ',
                        data: deletedData,
                        backgroundColor: chartColors.red,
                        borderColor: chartColors.red,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // ตั้งค่านี้เป็น false เพื่อให้ควบคุมขนาดได้อิสระ
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 14
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            family: 'Sarabun, sans-serif',
                            size: 14
                        },
                        bodyFont: {
                            family: 'Sarabun, sans-serif',
                            size: 13
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 12
                            },
                            color: '#555',
                            maxRotation: 45, // หมุนป้ายชื่อเพื่อประหยัดพื้นที่
                            minRotation: 45  // หมุนป้ายชื่อเพื่อประหยัดพื้นที่
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Sarabun, sans-serif',
                                size: 12
                            },
                            color: '#555',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                // จำกัดจำนวนแท่งที่แสดง
                barThickness: 'flex',
                maxBarThickness: 10, // ลดความหนาของแท่ง
                // จำกัดความสูงสูงสุด
                layout: {
                    padding: {
                        top: 5,
                        right: 10,
                        bottom: 5,
                        left: 10
                    }
                }
            }
        });
    }
    
})(jQuery);


/**
 * กรองข้อมูลให้แสดงเฉพาะจุดที่สำคัญหรือลดจำนวนจุดลงเมื่อมีข้อมูลมากเกินไป
 * 
 * @param {Object} data ข้อมูลวันที่และค่าที่เกี่ยวข้อง
 * @param {number} maxPoints จำนวนจุดสูงสุดที่ต้องการแสดง
 * @return {Object} ข้อมูลที่ถูกกรองแล้ว
 */
function filterDataPoints(data, maxPoints = 15) {
    const keys = Object.keys(data);
    
    // ถ้ามีข้อมูลน้อยกว่าหรือเท่ากับจำนวนที่ต้องการ ไม่ต้องกรอง
    if (keys.length <= maxPoints) {
        return data;
    }
    
    // คำนวณช่วงการเลือกจุด
    const skipInterval = Math.ceil(keys.length / maxPoints);
    
    // กรองข้อมูล
    const filteredData = {};
    keys.forEach((key, index) => {
        // เลือกเฉพาะจุดที่ต้องการแสดง
        if (index % skipInterval === 0 || index === keys.length - 1) {
            filteredData[key] = data[key];
        }
    });
    
    return filteredData;
}

// แก้ไขฟังก์ชัน processStatisticsData() เพื่อใช้ filterDataPoints
function processStatisticsData(data) {
    // Update summary data
    $('#total-posts').text(data.summary.total_posts);
    $('#total-views').text(data.summary.total_views);
    $('#total-updates').text(data.summary.total_updates);
    $('#total-deleted').text(data.summary.total_deleted);
    
    // กรองข้อมูลถ้ามีมากเกินไป
    const filteredPostCounts = filterDataPoints(data.post_counts);
    const filteredPostViews = filterDataPoints(data.post_views);
    const filteredPostUpdates = filterDataPoints(data.post_updates);
    const filteredDeletedPosts = filterDataPoints(data.deleted_posts);
    
    // Update posts chart with filtered data
    updatePostsChart(filteredPostCounts);
    
    // Update activities chart with filtered data
    updateActivitiesChart(filteredPostViews, filteredPostUpdates, filteredDeletedPosts);
}


function setupIntegrationWithPostsTable() {
    // เมื่อคลิกที่กราฟหรือแท่งในกราฟกิจกรรม ให้เปลี่ยนการกรองในตารางโพสต์
    if (postsChart) {
        postsChart.canvas.onclick = function(evt) {
            var points = postsChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                // ดึงข้อมูลวันที่จากจุดที่คลิก
                const index = points[0].index;
                const label = postsChart.data.labels[index];
                
                // แสดงปุ่มตัวกรองวันที่
                showDateFilterButton(label);
            }
        };
    }
    
    if (activitiesChart) {
        activitiesChart.canvas.onclick = function(evt) {
            var points = activitiesChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                // ดึงข้อมูลวันที่จากจุดที่คลิก
                const index = points[0].index;
                const label = activitiesChart.data.labels[index];
                
                // แสดงปุ่มตัวกรองวันที่
                showDateFilterButton(label);
            }
        };
    }
    
    // เมื่อเปลี่ยนตัวกรองหมวดหมู่ในแดชบอร์ดสถิติ ให้เปลี่ยนตัวกรองในตารางโพสต์ด้วย
    $('#term-filter').on('change', function() {
        const termId = $(this).val();
        updatePostsTableFilter(termId);
    });
}

// แสดงปุ่มตัวกรองตามวันที่
function showDateFilterButton(dateLabel) {
    // แปลงรูปแบบ DD MMM เป็นวันที่ที่ใช้งานได้
    const dateParts = dateLabel.split(' ');
    const day = parseInt(dateParts[0]);
    const monthText = dateParts[1];
    
    // แปลงเดือนเป็นตัวเลข
    const months = {
        'ม.ค.': 0, 'Jan': 0,
        'ก.พ.': 1, 'Feb': 1,
        'มี.ค.': 2, 'Mar': 2,
        'เม.ย.': 3, 'Apr': 3,
        'พ.ค.': 4, 'May': 4,
        'มิ.ย.': 5, 'Jun': 5,
        'ก.ค.': 6, 'Jul': 6,
        'ส.ค.': 7, 'Aug': 7,
        'ก.ย.': 8, 'Sep': 8,
        'ต.ค.': 9, 'Oct': 9,
        'พ.ย.': 10, 'Nov': 10,
        'ธ.ค.': 11, 'Dec': 11
    };
    
    if (!months.hasOwnProperty(monthText)) {
        console.error('Unknown month format:', monthText);
        return;
    }
    
    const month = months[monthText];
    const date = new Date();
    date.setMonth(month);
    date.setDate(day);
    
    // สร้างปุ่มตัวกรอง
    const filterBtn = $('<button>')
        .addClass('chart-date-filter-btn')
        .text('ดูโพสต์วันที่ ' + dateLabel)
        .attr('data-date', moment(date).format('YYYY-MM-DD'));
    
    // ลบปุ่มเก่าถ้ามี
    $('.chart-date-filter-btn').remove();
    
    // เพิ่มปุ่มใหม่
    $('.news-statistics-charts').after(filterBtn);
    
    // เพิ่ม event handler
    filterBtn.on('click', function() {
        const filterDate = $(this).data('date');
        window.location.href = '?date=' + filterDate;
    });
}

// อัพเดตตัวกรองในตารางโพสต์
function updatePostsTableFilter(termId) {
    const postsTableFilter = $('.news-posts-filters select#term-filter');
    if (postsTableFilter.length) {
        postsTableFilter.val(termId);
        // ถ้าฟอร์มมีคลาส auto-submit ให้ส่งฟอร์มอัตโนมัติ
        if (postsTableFilter.closest('form').hasClass('auto-submit')) {
            postsTableFilter.closest('form').submit();
        }
    }
}

// เรียกใช้ setupIntegrationWithPostsTable หลังจากโหลดข้อมูลและสร้างกราฟ
function processStatisticsData(data) {
    // (โค้ดเดิม)
    
    // เรียกฟังก์ชันเชื่อมโยง
    setupIntegrationWithPostsTable();
}