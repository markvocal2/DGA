/**
 * wp-user-manager.css
 * Stylesheet for WP User Manager with a modern blue-orange-black color scheme.
 * Refactored for clarity and maintainability.
 */

/* ==========================================================================
   CSS Variables (Color Palette, Sizing, Effects)
   ========================================================================== */
:root {
    /* Primary Color Scheme */
    --primary-blue: #2563eb;
    --primary-blue-dark: #1d4ed8;
    --primary-blue-light: #60a5fa;
    --primary-blue-lighter: #dbeafe;

    --accent-orange: #f97316;
    --accent-orange-dark: #ea580c;
    --accent-orange-light: #fdba74;
    --accent-orange-lighter: #ffedd5;

    /* Base Colors */
    --text-primary: #111827;     /* Dark Gray for main text */
    --text-secondary: #4b5563;   /* Medium Gray for secondary text */
    --text-muted: #9ca3af;       /* Light Gray for muted text */
    --text-white: #ffffff;

    --bg-white: #ffffff;
    --bg-light: #f9fafb;         /* Very Light Gray background */
    --bg-gray: #f3f4f6;          /* Light Gray background */

    --border-light: #e5e7eb;     /* Light border color */
    --border-medium: #d1d5db;    /* Medium border color */

    /* Effects */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

    /* Borders & Radius */
    --radius-sm: 0.25rem;
    --radius: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;

    /* Transitions */
    --transition: all 0.2s ease;
    --transition-slow: all 0.3s ease;
}

/* ==========================================================================
   Reset and Base Styles
   ========================================================================== */
.wp-user-manager-container *,
.wp-user-manager-container *::before,
.wp-user-manager-container *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.wp-user-manager-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: var(--text-primary);
    margin: 2rem auto; /* Center the container */
    padding: 0;
    line-height: 1.5;
    max-width: 1200px; /* Set a max-width for larger screens */
}

/* Prevent body scroll when modal is open */
body.modal-open {
    overflow: hidden;
}


/* ==========================================================================
   Header Section (Title, Search, Filters)
   ========================================================================== */
.user-table-header {
    display: flex;
    flex-wrap: wrap; /* Allow items to wrap on smaller screens */
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1.25rem; /* Spacing between elements */
    padding: 0 0.5rem; /* Add slight horizontal padding */
}

/* Header Title */
.user-table-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-blue);
    position: relative;
    padding-left: 1rem; /* Space for the accent line */
}

/* Accent line before the title */
.user-table-header h2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 1.25rem;
    width: 4px;
    background-color: var(--accent-orange);
    border-radius: var(--radius-sm);
}

/* Container for search and filter */
.table-actions {
    display: flex;
    flex-wrap: wrap; /* Allow actions to wrap */
    gap: 0.75rem;
    align-items: center;
}

/* Search Box Styling */
.search-box {
    position: relative; /* Needed for absolute positioning of the icon */
}

/* Search Icon */
.search-box::before {
    content: '';
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.6;
    pointer-events: none; /* Prevent icon from interfering with input */
}

#user-search-input {
    padding: 0.625rem 0.75rem 0.625rem 2.25rem; /* Left padding for icon */
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    font-size: 0.9rem;
    width: 250px; /* Default width */
    transition: var(--transition);
    background-color: var(--bg-white);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
}

#user-search-input:focus {
    outline: none;
    border-color: var(--primary-blue-light);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); /* Focus ring */
}

#user-search-input::placeholder {
    color: var(--text-muted);
}

/* Role Filter Dropdown */
#role-filter {
    padding: 0.625rem 2rem 0.625rem 0.75rem; /* Right padding for arrow */
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    font-size: 0.9rem;
    background-color: var(--bg-white);
    transition: var(--transition);
    color: var(--text-primary);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    appearance: none; /* Remove default system appearance */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); /* Custom dropdown arrow */
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1.25rem;
}

#role-filter:focus {
    outline: none;
    border-color: var(--primary-blue-light);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); /* Focus ring */
}

/* ==========================================================================
   User Table Styles
   ========================================================================== */
.user-table-wrapper {
    overflow: hidden; /* Ensures border-radius clips content */
    background-color: var(--bg-white);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    margin-bottom: 1.5rem;
    border: 1px solid var(--border-light);
    position: relative; /* For the top accent border */
}

/* Top accent border */
.user-table-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px; /* Thickness of the accent border */
    background: linear-gradient(90deg, var(--primary-blue) 0%, var(--accent-orange) 100%);
}

.wp-user-table {
    width: 100%;
    border-collapse: separate; /* Allows border-spacing */
    border-spacing: 0;
    /* overflow: hidden; /* Redundant due to wrapper */
}

/* Table Header Cells */
.wp-user-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-primary);
    background-color: var(--bg-light); /* Slightly different background for header */
    border-bottom: 1px solid var(--border-light);
    position: sticky; /* Make header sticky */
    top: 0; /* Stick to the top */
    z-index: 10; /* Ensure header is above table content */
}

.wp-user-table th:first-child {
    padding-left: 1.5rem; /* More padding for the first column */
}

.wp-user-table th:last-child {
    text-align: right;
    padding-right: 1.5rem; /* More padding for the last column (Actions) */
}

/* Table Body Cells */
.wp-user-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-light);
    color: var(--text-primary);
    vertical-align: middle; /* Align cell content vertically */
}

.wp-user-table td:first-child {
    padding-left: 1.5rem;
}

.wp-user-table td:last-child {
    text-align: right;
    padding-right: 1.5rem;
}

/* Remove bottom border from the last row */
.wp-user-table tr:last-child td {
    border-bottom: none;
}

/* Table Row Hover Effect */
.wp-user-table tr {
    transition: var(--transition);
}

.wp-user-table tbody tr:hover { /* Apply hover only to body rows */
    background-color: var(--primary-blue-lighter);
}

/* User Info Cell (Avatar + Name/Email) */
.user-info {
    display: flex;
    align-items: center;
    gap: 0.875rem; /* Space between avatar and text */
}

/* Avatar Styling */
.avatar {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0; /* Prevent avatar from shrinking */
    border-radius: 50%; /* Circular avatar */
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
    box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
    position: relative;
    overflow: hidden; /* Clip potential ::after element */
    color: var(--text-white); /* Text color for initial */
}

/* Subtle shine effect on avatar */
.avatar::after {
    content: '';
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
}

/* Initial Letter inside Avatar */
.initial {
    font-weight: 700;
    font-size: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Slight shadow for readability */
}

/* Container for Username and Email */
.user-details {
    display: flex;
    flex-direction: column;
}

.username {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.125rem; /* Small space between username and email */
}

.email {
    font-size: 0.8125rem; /* Smaller font size for email */
    color: var(--text-secondary);
}

/* Role Badge Styling */
.role-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    background-color: var(--primary-blue-lighter);
    color: var(--primary-blue-dark);
    border-radius: var(--radius-2xl); /* Pill shape */
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2); /* Subtle inner border */
    white-space: nowrap; /* Prevent badge text from wrapping */
}

/* Action Buttons Cell */
.actions-cell {
    white-space: nowrap; /* Prevent buttons from wrapping within the cell */
    display: flex;
    justify-content: flex-end; /* Align buttons to the right */
    gap: 0.5rem; /* Space between buttons */
}

/* Common styles for action buttons */
.edit-role-btn,
.delete-user-btn {
    padding: 0.5rem 0.875rem;
    border: none;
    border-radius: var(--radius-lg);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex; /* Align icon and text */
    align-items: center;
    gap: 0.375rem; /* Space between icon and text */
}

/* Edit Button Specific Styles */
.edit-role-btn {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
    color: var(--text-white);
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.edit-role-btn:hover {
    /* background-color: var(--primary-blue-dark); No need, gradient handles it */
    transform: translateY(-1px); /* Slight lift on hover */
    box-shadow: 0 3px 6px rgba(37, 99, 235, 0.3);
}

/* Delete Button Specific Styles */
.delete-user-btn {
    background-color: var(--bg-white); /* White background */
    border: 1px solid #fecaca; /* Light red border */
    color: #ef4444; /* Red text */
    box-shadow: 0 1px 2px rgba(239, 68, 68, 0.1);
}

.delete-user-btn:hover {
    background-color: #fee2e2; /* Lighter red background on hover */
    border-color: #fca5a5; /* Slightly darker red border on hover */
    transform: translateY(-1px); /* Slight lift */
}

/* Icon used within buttons */
.icon {
    width: 16px;
    height: 16px;
    fill: currentColor; /* Use the button's text color */
    flex-shrink: 0;
}

/* ==========================================================================
   Loading and Empty States
   ========================================================================== */

/* Row shown during loading */
.loading-row {
    height: 130px; /* Approximate height of a regular row */
    /* Styles applied to the <tr> element */
}

/* Cell containing the loader */
.loading-cell {
    text-align: center;
    color: var(--text-secondary);
    /* Styles applied to the <td> element */
    /* colspan should be set in HTML to span all columns */
}

/* Loader Animation */
.loader {
    width: 40px;
    height: 40px;
    border: 3px solid var(--primary-blue-lighter);
    border-radius: 50%;
    border-top-color: var(--primary-blue); /* Different color for spinning part */
    animation: spin 1s linear infinite;
    margin: 1rem auto 0.75rem; /* Center the loader */
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Message shown when table is empty */
.empty-message {
    text-align: center;
    padding: 2.5rem 0;
    color: var(--text-muted);
    font-size: 0.9375rem;
    /* Styles applied to the <td> element */
    /* colspan should be set in HTML to span all columns */
}

/* Icon for empty state */
.empty-message::before {
    content: '';
    display: block;
    width: 48px;
    height: 48px;
    margin: 0 auto 0.75rem; /* Center the icon */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'%3E%3C/path%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.5;
}

/* ==========================================================================
   Pagination Styles
   ========================================================================== */
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 1rem; /* Space between info and controls */
    padding: 0 0.5rem; /* Consistent horizontal padding */
}

/* Hide pagination if needed (e.g., only one page) */
.pagination-container.hidden {
    display: none;
}

/* Text showing current page info (e.g., "Showing 1-10 of 50") */
.pagination-info {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

/* Container for pagination buttons */
.pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.375rem; /* Space between buttons */
}

/* Previous/Next buttons */
.pagination-button {
    padding: 0.5rem 0.875rem;
    background-color: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex; /* Align icon/text */
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
}

.pagination-button:not(:disabled):hover {
    background-color: var(--bg-light);
    border-color: var(--border-medium);
    transform: translateY(-2px); /* Enhanced hover lift */
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.15);
}

.pagination-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none; /* Remove shadow when disabled */
}

/* Arrow character within prev/next buttons */
.arrow {
    font-size: 0.75rem; /* Can adjust if using icon fonts */
}

/* Container for page number buttons */
.page-numbers {
    display: flex;
    gap: 0.25rem; /* Small space between page numbers */
}

/* Individual page number button */
.page-number {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-light);
    background-color: var(--bg-white);
    border-radius: var(--radius);
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.875rem;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
}

.page-number:hover {
    background-color: var(--bg-light);
    transform: translateY(-2px); /* Enhanced hover lift */
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.15);
}

/* Active page number button */
.page-number.active {
    background-color: var(--primary-blue);
    color: var(--text-white);
    border-color: var(--primary-blue);
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    cursor: default; /* Not clickable */
    transform: none; /* No lift for active */
}

/* Ellipsis (...) for skipped page numbers */
.page-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--text-muted);
}

/* ==========================================================================
   Modal Styles (Edit Role / Delete Confirmation)
   ========================================================================== */
.modal {
    display: none; /* Hidden by default */
    position: fixed;
    inset: 0; /* Covers the entire viewport (top, right, bottom, left = 0) */
    background-color: rgba(17, 24, 39, 0.6); /* Dark semi-transparent overlay */
    z-index: 1000; /* High z-index to appear above everything */
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px); /* Frosted glass effect */
    /* Use JS to add a class (e.g., 'modal-active') to display: flex */
}

.modal.active { /* Add this class via JS to show the modal */
    display: flex;
}

/* Modal Content Box */
.modal-content {
    background-color: var(--bg-white);
    padding: 2rem;
    border-radius: var(--radius-xl);
    max-width: 500px; /* Max width of the modal */
    width: 90%; /* Responsive width */
    max-height: 90vh; /* Max height relative to viewport */
    overflow-y: auto; /* Add scrollbar if content exceeds max-height */
    box-shadow: var(--shadow-lg);
    position: relative; /* Changed from absolute for flex alignment */
    /* transform: translate(-50%, -50%); /* No longer needed with flex centering */
    animation: modal-appear 0.3s ease; /* Fade-in animation */
}

/* Modal fade-in animation */
@keyframes modal-appear {
    from {
        opacity: 0;
        transform: scale(0.95); /* Slight scale-up effect */
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Close Button (Top Right) */
.close-modal {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    width: 28px; /* Slightly larger hit area */
    height: 28px;
    cursor: pointer;
    color: var(--text-muted);
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--bg-light);
    border: none; /* Ensure it looks like a button */
    padding: 0; /* Reset padding */
}

.close-modal:hover {
    color: var(--text-primary);
    background-color: var(--bg-gray);
    transform: rotate(90deg); /* Add a subtle rotation on hover */
}

/* Close icon (using SVG for better scaling) */
.close-modal svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 2;
}


/* Modal Title */
.modal h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-primary);
    font-size: 1.375rem;
    font-weight: 700;
}

/* Modal Paragraph Text */
.modal p {
    margin-bottom: 1.5rem;
    color: var(--text-secondary);
    line-height: 1.5;
}

/* Info box for user being edited/deleted */
#edit-user-info,
#delete-user-info {
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    margin-bottom: 1.25rem;
    font-size: 0.9rem;
}

#edit-user-info {
    background-color: var(--bg-light);
    border-left: 3px solid var(--primary-blue);
    color: var(--text-secondary);
}

#delete-user-info {
    background-color: #fee2e2; /* Light red background */
    border-left: 3px solid #ef4444; /* Red border */
    color: #b91c1c; /* Darker red text */
}

/* Container for role selection options */
.role-options {
    display: grid; /* Use grid for potentially better alignment */
    gap: 0.625rem;
    margin-bottom: 1.5rem;
    max-height: 300px; /* Limit height and enable scroll */
    overflow-y: auto;
    /* Custom scrollbar styles */
    scrollbar-width: thin;
    scrollbar-color: var(--border-medium) transparent;
    padding-right: 5px; /* Space for scrollbar */
}

/* Custom scrollbar for Webkit browsers */
.role-options::-webkit-scrollbar {
    width: 6px;
}
.role-options::-webkit-scrollbar-track {
    background: transparent;
}
.role-options::-webkit-scrollbar-thumb {
    background-color: var(--border-medium);
    border-radius: 20px;
}

/* Individual Role Option */
.role-option {
    padding: 0.875rem 1rem;
    border: 2px solid var(--border-light);
    border-radius: var(--radius);
    cursor: pointer;
    transition: var(--transition);
    position: relative; /* For the checkmark */
    overflow: hidden; /* Ensure checkmark stays within bounds */
    display: flex; /* Align text nicely */
    align-items: center;
}

.role-option:hover {
    border-color: var(--primary-blue-light);
    background-color: var(--primary-blue-lighter);
}

/* Selected Role Option */
.role-option.selected {
    border-color: var(--accent-orange); /* Use accent color for selection */
    background-color: var(--accent-orange-lighter); /* Lighter accent background */
    font-weight: 500; /* Slightly bolder text */
}

/* Checkmark for selected role */
.role-option.selected::after {
    content: '';
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    /* SVG Checkmark using accent color */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23f97316'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M5 13l4 4L19 7'%3E%3C/path%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
}

/* Container for modal action buttons (Save, Cancel, Delete) */
.modal-actions {
    display: flex;
    justify-content: flex-end; /* Align buttons to the right */
    gap: 0.75rem;
    margin-top: 1rem; /* Space above buttons */
    padding-top: 1rem; /* Add padding if border needed */
    border-top: 1px solid var(--border-light); /* Separator line */
}

/* Common styles for modal buttons */
.cancel-button,
.save-button,
.delete-button { /* Note: .delete-button here is for the modal confirmation */
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-lg);
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.875rem;
    border: none; /* Reset border */
}

/* Cancel Button */
.cancel-button {
    background-color: var(--bg-light);
    border: 1px solid var(--border-light);
    color: var(--text-primary);
}

.cancel-button:hover {
    background-color: var(--bg-gray);
    border-color: var(--border-medium);
}

/* Save Button */
.save-button {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
    color: var(--text-white);
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.save-button:hover {
    /* background-color: var(--primary-blue-dark); No need, gradient handles it */
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(37, 99, 235, 0.3);
}

/* Delete Confirmation Button (in modal) */
.delete-button {
    background-color: #ef4444; /* Red background */
    color: var(--text-white);
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2);
}

.delete-button:hover {
    background-color: #dc2626; /* Darker red on hover */
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(239, 68, 68, 0.3);
}

/* ==========================================================================
   Notification System (Toast Messages)
   ========================================================================== */
.notification {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 1rem 1.25rem;
    border-radius: var(--radius-lg);
    background-color: var(--bg-white);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    transform: translateY(120%); /* Start off-screen */
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.3s ease; /* Smooth slide-in */
    z-index: 2000; /* Above modals */
    max-width: 400px;
    width: calc(100% - 3rem); /* Responsive width */
    border-left: 4px solid transparent; /* Placeholder for status color */
}

/* State when notification is visible */
.notification.show {
    transform: translateY(0);
    opacity: 1;
    /* animation: pulse 0.3s ease-in-out forwards; /* Optional pulse effect */
}

/* Status indicator colors */
.notification.success { border-left-color: var(--accent-orange); } /* Using orange for success */
.notification.error   { border-left-color: #ef4444; } /* Red for error */
.notification.warning { border-left-color: #f59e0b; } /* Yellow/Amber for warning */

/* Notification message text */
.notification-message {
    flex: 1; /* Allow message to take available space */
    color: var(--text-primary);
    font-size: 0.9375rem;
}

/* Notification close button */
.notification-close {
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.2s ease, background-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: none;
    border: none;
    padding: 0;
    flex-shrink: 0; /* Prevent shrinking */
}

.notification-close:hover {
    color: var(--text-primary);
    background-color: var(--bg-gray);
}

/* Close icon (using simple '×') */
.notification-close::before {
    content: '×';
    font-size: 1.5rem; /* Adjust size as needed */
    line-height: 1;
}

/* Optional pulse animation for notification */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
}


/* ==========================================================================
   Responsive Styles
   ========================================================================== */

/* Medium screens (Tablets) */
@media (max-width: 768px) {
    .user-table-header {
        flex-direction: column; /* Stack header items vertically */
        align-items: flex-start; /* Align items to the left */
        gap: 1rem;
    }

    .table-actions {
        width: 100%; /* Make actions take full width */
        flex-direction: column; /* Stack search and filter */
        align-items: stretch; /* Make inputs full width */
        gap: 0.75rem;
    }

    #user-search-input,
    #role-filter {
        width: 100%; /* Full width inputs */
    }

    /* Stack action buttons vertically in table on small screens */
    .actions-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-end; /* Keep buttons aligned right */
        white-space: normal; /* Allow wrapping if needed */
    }

    .edit-role-btn,
    .delete-user-btn {
        width: auto; /* Allow buttons to size based on content */
        justify-content: flex-start; /* Align text/icon left */
        padding: 0.5rem 0.75rem; /* Adjust padding slightly */
    }

    .pagination-container {
        flex-direction: column; /* Stack pagination info and controls */
        align-items: center; /* Center items */
        gap: 1rem;
    }

    .pagination-info {
        text-align: center;
    }

    .pagination-controls {
        width: 100%;
        justify-content: center; /* Center pagination buttons */
    }

     /* Hide less important columns or reduce padding if needed */
    /* Example: Hiding email column (adjust based on needs) */
    /*
    .wp-user-table th:nth-child(3),
    .wp-user-table td:nth-child(3) {
        display: none;
    }
    */
}

/* Small screens (Mobiles) */
@media (max-width: 480px) {
    .wp-user-manager-container {
        margin: 1rem auto; /* Reduce margin on small screens */
    }

    /* Hide page numbers, keep prev/next */
    .page-numbers {
        display: none;
    }
    .page-ellipsis {
        display: none;
    }

    .pagination-controls {
        justify-content: space-between; /* Space out prev/next buttons */
        gap: 0.5rem; /* Ensure some gap */
    }
    .pagination-button {
        flex-grow: 1; /* Allow prev/next to grow */
        justify-content: center; /* Center text/icon */
    }


    /* Reduce padding in table cells */
    .wp-user-table th,
    .wp-user-table td {
        padding: 0.75rem 0.5rem;
        font-size: 0.875rem; /* Slightly smaller font */
    }

    .wp-user-table th:first-child,
    .wp-user-table td:first-child {
        padding-left: 0.75rem;
    }

    .wp-user-table th:last-child,
    .wp-user-table td:last-child {
        padding-right: 0.75rem;
    }

    /* Adjust user info layout */
    .user-info {
        gap: 0.5rem;
    }
    .avatar {
        width: 32px;
        height: 32px;
    }
    .initial {
        font-size: 0.875rem;
    }
    .username {
        font-size: 0.9rem;
    }
    .email {
        font-size: 0.75rem;
    }

    /* Adjust modal padding */
    .modal-content {
        padding: 1.5rem;
        width: calc(100% - 2rem); /* Ensure some margin */
    }
    .modal h2 {
        font-size: 1.25rem;
    }
    .modal-actions {
        flex-direction: column; /* Stack modal buttons */
        gap: 0.5rem;
    }
    .cancel-button,
    .save-button,
    .delete-button {
        width: 100%; /* Full width modal buttons */
    }

    /* Adjust notification position */
    .notification {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        width: auto; /* Let it span */
        max-width: none;
    }
}
