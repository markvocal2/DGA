/**
 * CKAN Usage Report System JavaScript
 * Handles the interactive functionality for the usage report system
 */

jQuery(document).ready(function($) {
    // Charts configuration and global options
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#333333';

    // Store chart instances to update later
    let activityTrendChart = null;
    let actionTypesChart = null;
    let topUsersChart = null;

    // Current filter state
    const filters = {
        type: $('#ckan-report-type').val() || 'all',
        period: $('#ckan-report-period').val() || 'month',
        limit: parseInt(ckan_report.limit) || 10 // Get limit from localized script data
    };

    // ------------- Event Handlers -------------

    // Apply filters
    $('#ckan-apply-filters').on('click', handleApplyFilters);

    // Refresh report
    $('#ckan-refresh-report').on('click', handleRefreshReport);

    // Print report
    $('#ckan-print-report').on('click', handlePrintReport);

    // Export data
    $('#ckan-export-activities').on('click', handleExportData);

    // ------------- Handler Functions -------------

    /**
     * Handles the click event for applying filters.
     * Updates the global filters object and triggers a report update.
     */
    function handleApplyFilters() {
        filters.type = $('#ckan-report-type').val();
        filters.period = $('#ckan-report-period').val();

        // Update report with new filters
        updateReportData();
    }

    /**
     * Handles the click event for refreshing the report.
     * Triggers a report update, showing the main loader.
     */
    function handleRefreshReport() {
        // Refresh all data with current filters
        updateReportData(true); // Pass true to show the loader
    }

    /**
     * Handles the click event for printing the report.
     * Opens the browser's print dialog.
     */
    function handlePrintReport() {
        window.print();
    }

    /**
     * Handles the click event for exporting the recent activities table.
     * Calls the exportTableToCSV function.
     */
    function handleExportData() {
        exportTableToCSV('ckan-recent-activities', 'ckan_activity_report.csv');
    }

    // ------------- Main Functions -------------

    /**
     * Initializes the report by loading all data components.
     * Shows a loader during initialization.
     */
    function initializeReport() {
        // Show main loader
        $('.ckan-report-loader').show();

        // Set initial timestamp
         $('#ckan-report-timestamp').text(formatCurrentDateTime());

        // Load all components
        loadDashboardSummary();
        loadActivityTrendChart();
        loadActionTypesChart();
        loadTopUsersChart();
        loadRecentActivities();

        // Hide main loader after a short delay to ensure components render
        // Note: Ideally, hide loader based on completion callbacks/promises
        setTimeout(function() {
            $('.ckan-report-loader').fadeOut();
        }, 1500); // Adjust timing as needed
    }

    /**
     * Updates all report components based on current filters.
     * Optionally shows the main loader during the update.
     * @param {boolean} showLoader - Whether to show the main loader during the update.
     */
    function updateReportData(showLoader = false) {
        // Update timestamp
        $('#ckan-report-timestamp').text(formatCurrentDateTime());

        if (showLoader) {
            $('.ckan-report-loader').show();
        }

        // Reload all charts and data with current filters
        // Consider using Promises for better flow control if requests become complex
        loadActivityTrendChart();
        loadActionTypesChart();
        loadTopUsersChart();
        loadRecentActivities();
        // Note: Dashboard summary might not need frequent updates unless underlying data changes rapidly

        if (showLoader) {
            // Hide loader after a delay
            setTimeout(function() {
                $('.ckan-report-loader').fadeOut();
            }, 1000); // Adjust timing as needed
        }
    }

    // ------------- Data Loading Functions -------------

    /**
     * Loads the dashboard summary statistics via AJAX.
     */
    function loadDashboardSummary() {
        $.ajax({
            url: ckan_report.ajax_url, // Defined via wp_localize_script
            type: 'POST',
            data: {
                action: 'ckan_get_dashboard_summary', // WordPress AJAX action hook
                nonce: ckan_report.nonce         // Security nonce
            },
            success: handleDashboardSummarySuccess,
            error: handleDashboardSummaryError
        });
    }

    /**
     * Handles the successful response for the dashboard summary AJAX call.
     * Updates the summary card values with animation.
     * @param {object} response - The AJAX response object.
     */
    function handleDashboardSummarySuccess(response) {
        if (response.success && response.data) {
            const data = response.data;

            // Update dashboard card values with animation
            animateCounter('#total-terms-value', data.terms || 0);
            animateCounter('#total-users-value', data.users || 0);
            animateCounter('#total-datasets-value', data.datasets || 0);
            animateCounter('#total-actions-value', data.actions || 0);
        } else {
             // Handle case where response indicates failure or no data
             handleDashboardSummaryError(); // Reuse error handler for consistency
             console.error("Dashboard summary request failed or returned no data:", response);
        }
    }

    /**
     * Handles errors during the dashboard summary AJAX call.
     * Displays an error message in the summary cards.
     */
    function handleDashboardSummaryError(jqXHR, textStatus, errorThrown) {
        // Display error message
        const errorHtml = `<span class="ckan-data-error">${ckan_report.error_text || 'Error'}</span>`; // Use localized error text
        $('#total-terms-value, #total-users-value, #total-datasets-value, #total-actions-value')
            .html(errorHtml);
        console.error("AJAX Error loading dashboard summary:", textStatus, errorThrown);
    }

    /**
     * Loads the activity trend chart data via AJAX based on current filters.
     */
    function loadActivityTrendChart() {
        const chartContainer = $('#ckan-activity-trend').parent(); // Get the container div
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        chartContainer.find('.ckan-chart-error').hide(); // Hide previous errors

        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_activity_trend',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type
            },
            success: function(response) {
                handleActivityTrendChartSuccess(response, chartContainer);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                handleChartError(chartContainer, "Activity Trend", textStatus, errorThrown);
            }
        });
    }

    /**
     * Handles the successful response for the activity trend chart AJAX call.
     * Renders the chart or shows a "no data" message.
     * @param {object} response - The AJAX response object.
     * @param {jQuery} chartContainer - The jQuery object for the chart's container div.
     */
    function handleActivityTrendChartSuccess(response, chartContainer) {
         chartContainer.find('.ckan-chart-loader').hide(); // Hide loader regardless of success/data

        if (response.success && response.data) {
            const chartData = response.data;

            // Check if we have any meaningful data (at least one dataset with non-zero values)
            const hasData = chartData.datasets && chartData.datasets.some(dataset =>
                dataset.data && dataset.data.some(value => value > 0)
            );

            if (hasData) {
                renderActivityTrendChart(chartData);
                chartContainer.find('.ckan-chart-no-data').hide(); // Ensure 'no data' is hidden
            } else {
                // Show no data message
                chartContainer.find('.ckan-chart-no-data').show();
                // Destroy existing chart if any, to clear the canvas
                if (activityTrendChart) {
                    activityTrendChart.destroy();
                    activityTrendChart = null;
                }
            }
        } else {
            // Handle case where response indicates failure or structure issues
            handleChartError(chartContainer, "Activity Trend", "Invalid data received");
             console.error("Activity trend request failed or returned invalid data:", response);
        }
    }

    /**
     * Loads the action types chart data via AJAX based on current filters.
     */
    function loadActionTypesChart() {
        const chartContainer = $('#ckan-action-types').parent();
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        chartContainer.find('.ckan-chart-error').hide();

        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_action_types',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type
            },
            success: function(response) {
                handleActionTypesChartSuccess(response, chartContainer);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                handleChartError(chartContainer, "Action Types", textStatus, errorThrown);
            }
        });
    }

    /**
     * Handles the successful response for the action types chart AJAX call.
     * Renders the chart or shows a "no data" message.
     * @param {object} response - The AJAX response object.
     * @param {jQuery} chartContainer - The jQuery object for the chart's container div.
     */
    function handleActionTypesChartSuccess(response, chartContainer) {
         chartContainer.find('.ckan-chart-loader').hide();

        if (response.success && response.data) {
            const chartData = response.data;

            // Check if we have any meaningful data (at least one dataset with non-zero values)
             const hasData = chartData.datasets && chartData.datasets.length > 0 &&
                            chartData.datasets[0].data && chartData.datasets[0].data.some(value => value > 0);

            if (hasData) {
                renderActionTypesChart(chartData);
                 chartContainer.find('.ckan-chart-no-data').hide();
            } else {
                chartContainer.find('.ckan-chart-no-data').show();
                if (actionTypesChart) {
                    actionTypesChart.destroy();
                    actionTypesChart = null;
                }
            }
        } else {
            handleChartError(chartContainer, "Action Types", "Invalid data received");
            console.error("Action types request failed or returned invalid data:", response);
        }
    }

    /**
     * Loads the top users chart data via AJAX based on current filters.
     */
    function loadTopUsersChart() {
        const chartContainer = $('#ckan-top-users').parent();
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        chartContainer.find('.ckan-chart-error').hide();

        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_top_users',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type,
                limit: 5 // Fetch top 5 users
            },
            success: function(response) {
                handleTopUsersChartSuccess(response, chartContainer);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                handleChartError(chartContainer, "Top Users", textStatus, errorThrown);
            }
        });
    }

    /**
     * Handles the successful response for the top users chart AJAX call.
     * Renders the chart or shows a "no data" message.
     * @param {object} response - The AJAX response object.
     * @param {jQuery} chartContainer - The jQuery object for the chart's container div.
     */
    function handleTopUsersChartSuccess(response, chartContainer) {
         chartContainer.find('.ckan-chart-loader').hide();

        if (response.success && response.data) {
            const chartData = response.data;

            // Check if we have any meaningful data
            const hasData = chartData.labels && chartData.labels.length > 0 &&
                            chartData.datasets && chartData.datasets.length > 0 &&
                            chartData.datasets[0].data && chartData.datasets[0].data.length > 0;

            if (hasData) {
                renderTopUsersChart(chartData);
                 chartContainer.find('.ckan-chart-no-data').hide();
            } else {
                chartContainer.find('.ckan-chart-no-data').show();
                if (topUsersChart) {
                    topUsersChart.destroy();
                    topUsersChart = null;
                }
            }
        } else {
             handleChartError(chartContainer, "Top Users", "Invalid data received");
             console.error("Top users request failed or returned invalid data:", response);
        }
    }

    /**
     * Handles generic chart AJAX errors.
     * Hides the loader and displays an error message within the chart container.
     * @param {jQuery} chartContainer - The jQuery object for the chart's container div.
     * @param {string} chartName - Name of the chart for logging.
     * @param {string} textStatus - Status text from the AJAX error.
     * @param {string|object} errorThrown - Error object or string.
     */
    function handleChartError(chartContainer, chartName, textStatus, errorThrown) {
        chartContainer.find('.ckan-chart-loader').hide();
        const errorMsg = chartContainer.find('.ckan-chart-error'); // Use a dedicated error element
        if (errorMsg.length === 0) {
             // If no dedicated error element, fallback to 'no-data' element
             chartContainer.find('.ckan-chart-no-data')
                .show()
                .html(`<p class="ckan-data-error">${ckan_report.error_text || 'Error loading data.'}</p>`);
        } else {
             errorMsg.show().html(`<p>${ckan_report.error_text || 'Error loading data.'}</p>`);
        }
        // Also hide the 'no data' message if the error message is shown
        chartContainer.find('.ckan-chart-no-data').hide();

        console.error(`AJAX Error loading ${chartName} chart:`, textStatus, errorThrown);
    }

    // ------------- Chart Rendering Functions -------------

    /**
     * Renders or updates the activity trend line chart.
     * @param {object} chartData - The data object for the chart from the AJAX response.
     */
    function renderActivityTrendChart(chartData) {
        const ctx = document.getElementById('ckan-activity-trend');
        if (!ctx) return; // Exit if canvas element not found

        const config = {
            type: 'line',
            data: {
                labels: chartData.labels || [],
                datasets: (chartData.datasets || []).map(dataset => ({
                    label: dataset.label || 'Dataset',
                    data: dataset.data || [],
                    borderColor: dataset.borderColor || '#4a90e2', // Default color
                    backgroundColor: dataset.backgroundColor || 'rgba(74, 144, 226, 0.1)', // Default fill
                    tension: 0.3,        // Smoother lines
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true           // Fill area under the line
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to fill container height
                interaction: {
                    mode: 'index',      // Show tooltips for all datasets at that index
                    intersect: false,   // Tooltip triggers even if not directly hovering point
                },
                plugins: {
                    legend: {
                        // Use custom HTML legend instead of canvas legend if #activity-trend-legend exists
                        display: !document.getElementById('activity-trend-legend'), // Hide canvas legend if custom exists
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            // Optional: Customize tooltip title if needed
                            // title: function(context) {
                            //     return context[0].label;
                            // }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Ensure integer ticks on y-axis
                        }
                    },
                    x: {
                        // Optional: Add options for x-axis if needed (e.g., date formatting)
                    }
                }
            }
        };

        // If chart exists, update it; otherwise, create a new one
        if (activityTrendChart) {
            activityTrendChart.data = config.data;
            activityTrendChart.options = config.options; // Update options too if they might change
            activityTrendChart.update();
        } else {
            activityTrendChart = new Chart(ctx.getContext('2d'), config);
        }

        // Generate custom HTML legend if the element exists
        if (document.getElementById('activity-trend-legend')) {
             updateChartLegend('activity-trend-legend', config.data.datasets);
        }
    }

    /**
     * Renders or updates the action types doughnut chart.
     * @param {object} chartData - The data object for the chart from the AJAX response.
     */
    function renderActionTypesChart(chartData) {
         const ctx = document.getElementById('ckan-action-types');
         if (!ctx) return;

        const config = {
            type: 'doughnut',
            data: {
                 labels: chartData.labels || [],
                 datasets: chartData.datasets || [] // Expecting datasets structure from backend
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right', // Position legend to the side
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                // Calculate percentage
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${formatNumber(value)} (${percentage}%)`; // Format number in tooltip
                            }
                        }
                    }
                }
            }
        };

        if (actionTypesChart) {
            actionTypesChart.data = config.data;
            actionTypesChart.options = config.options;
            actionTypesChart.update();
        } else {
            actionTypesChart = new Chart(ctx.getContext('2d'), config);
        }
    }

    /**
     * Renders or updates the top users horizontal bar chart.
     * @param {object} chartData - The data object for the chart from the AJAX response.
     */
    function renderTopUsersChart(chartData) {
        const ctx = document.getElementById('ckan-top-users');
        if (!ctx) return;

        // Ensure data structure is as expected
        const labels = chartData.labels || [];
        const data = (chartData.datasets && chartData.datasets.length > 0) ? (chartData.datasets[0].data || []) : [];
        const backgroundColors = (chartData.datasets && chartData.datasets.length > 0) ? (chartData.datasets[0].backgroundColor || []) : [];

        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: ckan_report.actions_label || 'Actions', // Use localized label
                    data: data,
                    backgroundColor: backgroundColors, // Use colors from backend if provided
                    borderColor: 'rgba(255, 255, 255, 0.7)', // Optional border
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Make it a horizontal bar chart
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend for single dataset bar chart
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            // Title is usually the label on the y-axis (user name)
                            // title: function(context) {
                            //     return context[0].label;
                            // },
                            // Label shows the value on the x-axis (count)
                            label: function(context) {
                                const value = context.parsed.x || 0;
                                // Use localized text for "times" or similar unit
                                return `${context.dataset.label}: ${formatNumber(value)} ${ckan_report.times_label || 'times'}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { // Now the value axis
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Integer ticks
                        }
                    },
                    y: { // Now the category axis
                        // Optional: Add options if needed
                    }
                }
            }
        };

        if (topUsersChart) {
            topUsersChart.data = config.data;
             topUsersChart.options = config.options;
            topUsersChart.update();
        } else {
            topUsersChart = new Chart(ctx.getContext('2d'), config);
        }
    }


    // ------------- Table Functions -------------

    /**
     * Loads the recent activities table data via AJAX based on current filters.
     */
    function loadRecentActivities() {
        const tableBody = $('#ckan-recent-activities tbody');
        // Show loading state within the table body
        const loadingHtml = `<tr class="ckan-loading-row"><td colspan="4"><div class="ckan-loader-inline"></div><p>${ckan_report.loading_text || 'Loading data...'}</p></td></tr>`;
        tableBody.html(loadingHtml);

        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_recent_activities',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type,
                limit: filters.limit // Use limit from filters
            },
            success: handleActivitiesSuccess,
            error: handleActivitiesError
        });
    }

    /**
     * Handles the successful response for the recent activities AJAX call.
     * Populates the table body with activity data or a "no data" message.
     * @param {object} response - The AJAX response object.
     */
    function handleActivitiesSuccess(response) {
        const tableBody = $('#ckan-recent-activities tbody');

        if (response.success && response.data && response.data.activities) {
            const activities = response.data.activities;

            if (activities.length > 0) {
                let tableHtml = '';
                activities.forEach(function(activity) {
                    // Sanitize data before inserting into HTML (basic example)
                    // Consider a more robust sanitization library if needed
                    const time = escapeHtml(activity.time || '');
                    const action = escapeHtml(activity.action || '');
                    const actionClass = escapeHtml(activity.action_class || 'default');
                    const detail = escapeHtml(activity.detail || ''); // Assuming detail might contain user input/data
                    const user = escapeHtml(activity.user || '');

                    tableHtml += `
                        <tr>
                            <td>${time}</td>
                            <td><span class="ckan-badge ckan-badge-${actionClass}">${action}</span></td>
                            <td>${detail}</td>
                            <td>${user}</td>
                        </tr>
                    `;
                });
                tableBody.html(tableHtml);
            } else {
                // Show no data message
                tableBody.html(`<tr><td colspan="4" class="ckan-no-data">${ckan_report.no_activity_text || 'No activity found.'}</td></tr>`);
            }
        } else {
            // Handle error or invalid data structure
             tableBody.html(`<tr><td colspan="4" class="ckan-data-error">${ckan_report.error_loading_text || 'Error loading activity data.'}</td></tr>`);
             console.error("Recent activities request failed or returned invalid data:", response);
        }
    }

    /**
     * Handles errors during the recent activities AJAX call.
     * Displays an error message in the table body.
     */
    function handleActivitiesError(jqXHR, textStatus, errorThrown) {
        const tableBody = $('#ckan-recent-activities tbody');
        tableBody.html(`<tr><td colspan="4" class="ckan-data-error">${ckan_report.error_loading_text || 'Error loading activity data.'}</td></tr>`);
        console.error("AJAX Error loading recent activities:", textStatus, errorThrown);
    }

    // ------------- Helper Functions -------------

     /**
     * Basic HTML escaping function.
     * @param {string} unsafe - The string to escape.
     * @returns {string} The escaped string.
     */
     function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    /**
     * Animates a numerical counter from 0 to a target value.
     * @param {string} selector - The jQuery selector for the element displaying the number.
     * @param {number} targetValue - The final value to count up to.
     */
    function animateCounter(selector, targetValue) {
        const $element = $(selector);
        if (!$element.length) return; // Exit if element not found

        const startValue = 0;
        const duration = 1000; // Animation duration in milliseconds
        const stepDuration = 16; // Approx 60fps

        // Ensure targetValue is a number
        targetValue = Number(targetValue);
        if (isNaN(targetValue)) {
             $element.text('N/A'); // Or some other indicator of invalid data
             console.warn(`Invalid target value for animateCounter selector "${selector}":`, targetValue);
             return;
        }

        const increment = targetValue / (duration / stepDuration);
        let currentValue = startValue;

        // Clear any existing content and set initial value
        $element.text(formatNumber(startValue));

        const counterInterval = setInterval(function() {
            currentValue += increment;

            if (currentValue >= targetValue) {
                clearInterval(counterInterval);
                currentValue = targetValue; // Ensure it ends exactly on the target
            }

            // Update the element's text with the formatted number
            $element.text(formatNumber(Math.floor(currentValue)));
        }, stepDuration);
    }

    /**
     * Formats a number using locale-specific settings (e.g., adding commas).
     * Replaces the potentially vulnerable regex method.
     * @param {number} num - The number to format.
     * @returns {string} The formatted number string.
     */
    function formatNumber(num) {
        // Check if num is a valid number before formatting
        if (typeof num !== 'number' || isNaN(num)) {
            // Handle non-numeric or NaN input gracefully
            // Return '0', an empty string, or 'N/A' depending on desired behavior
            return '0';
        }
        try {
            // Use toLocaleString for robust, locale-aware formatting.
            // 'undefined' uses the browser's default locale.
            // Specify a locale like 'en-US' or 'th-TH' for consistency if needed.
            // maximumFractionDigits: 0 ensures no decimal places for counts.
            return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
        } catch (e) {
            // Fallback in case toLocaleString fails (very unlikely for numbers)
            console.error("toLocaleString formatting failed:", e);
            return num.toString(); // Return unformatted number as fallback
        }
    }


    /**
     * Formats the current date and time into a specific string format (DD/MM/YYYY HH:MM:SS).
     * Uses Thai Buddhist Era year.
     * @returns {string} The formatted date and time string.
     */
    function formatCurrentDateTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const thaiYear = now.getFullYear() + 543; // Convert CE to Thai Buddhist Era
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Example format: 21/04/2568 14:30:55
        return `${day}/${month}/${thaiYear} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Updates a custom HTML legend element for a chart.
     * @param {string} elementId - The ID of the container element for the legend.
     * @param {Array} datasets - The datasets array from the Chart.js config.
     */
    function updateChartLegend(elementId, datasets) {
        const legendContainer = document.getElementById(elementId);
        if (!legendContainer || !datasets) return; // Exit if container or datasets are missing

        let legendHtml = '<ul class="ckan-legend-list">';

        datasets.forEach(dataset => {
            // Use borderColor for line charts, first backgroundColor for others as fallback
            const color = dataset.borderColor || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || '#cccccc';
            const label = escapeHtml(dataset.label || ''); // Escape label text

            legendHtml += `
                <li class="ckan-legend-item">
                    <span class="ckan-legend-marker" style="background-color: ${color}"></span>
                    <span class="ckan-legend-label">${label}</span>
                </li>
            `;
        });

        legendHtml += '</ul>';
        legendContainer.innerHTML = legendHtml;
    }

    // ------------- Export Functions -------------

    /**
     * Exports the content of an HTML table to a CSV file.
     * @param {string} tableId - The ID of the HTML table element.
     * @param {string} filename - The desired name for the downloaded CSV file.
     */
    function exportTableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error("Export failed: Table element not found with ID:", tableId);
            alert("Error: Could not find table to export."); // User feedback
            return;
        }

        let csv = [];
        const rows = table.querySelectorAll('tr');

        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th'); // Include header (th) and data (td) cells

            for (let j = 0; j < cols.length; j++) {
                // Get text content, remove extra whitespace, handle potential commas/quotes
                let text = cols[j].textContent || ''; // Get text content
                text = text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
                // Escape double quotes by doubling them, and wrap the whole field in quotes
                text = '"' + text.replace(/"/g, '""') + '"';
                row.push(text);
            }

            csv.push(row.join(',')); // Join cells with commas
        }

        // Download the generated CSV string
        downloadCSV(csv.join('\n'), filename); // Join rows with newlines
    }

    /**
     * Triggers the download of a CSV string as a file.
     * Includes BOM for better UTF-8 compatibility in Excel.
     * @param {string} csv - The CSV content as a single string.
     * @param {string} filename - The desired filename for the download.
     */
    function downloadCSV(csv, filename) {
        let csvFile;
        let downloadLink;

        // BOM (Byte Order Mark) to ensure UTF-8 compatibility, especially for Excel
        const universalBOM = "\uFEFF";
        csvFile = new Blob([universalBOM + csv], {type: 'text/csv;charset=utf-8;'});

        // Create a temporary download link element
        downloadLink = document.createElement('a');

        // Set filename
        downloadLink.download = filename;

        // Create a URL for the Blob
        downloadLink.href = window.URL.createObjectURL(csvFile);

        // Hide the link
        downloadLink.style.display = 'none';

        // Append link to the DOM
        document.body.appendChild(downloadLink);

        // Trigger the download
        downloadLink.click();

        // Clean up: remove the link and revoke the Blob URL
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(downloadLink.href);
    }

    // ------------- Initialization -------------

    // Start the report initialization process when the DOM is ready
    initializeReport();

}); // End of jQuery(document).ready
