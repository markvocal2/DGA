/**
 * JavaScript สำหรับการจัดการสิทธิ์ผู้ใช้ (User Permissions)
 * Version: 1.0.1 (Refactored - Removed void operator)
 */
jQuery(document).ready(function($) {

    /**
     * Controller object for managing user permissions UI and interactions.
     * Handles displaying settings panels, loading roles, saving permissions,
     * checking page access, and managing login for restricted content.
     */
    const user_permission_controller = {
        // Properties
        roles: {}, // Stores available user roles fetched from the server.
        isLoading: false, // Flag to prevent concurrent AJAX requests.
        currentPageId: null, // Stores the page ID for the currently open panel or checked page.

        /**
         * Initializes the controller by binding events and checking initial page permissions.
         */
        init: function() {
            // Store reference to 'this' (the controller object) for consistent access
            const controller = this;

            // Configuration Check
            if (typeof userPermissionAjax === 'undefined' || !userPermissionAjax.ajaxurl || !userPermissionAjax.nonce) {
                console.error('User Permission: userPermissionAjax object is missing or incomplete. Functionality may be limited.');
                // Optionally display a persistent error message on the page
                // $('body').prepend('<div class="error-message admin-notice">User Permission Error: Configuration missing.</div>');
                // return; // Stop initialization if config is critical
            }


            controller.bindEvents();
            // Check permissions for the current page on load if the icon exists
            const $permissionIcon = $('.user-permission-icon').first(); // Assume one icon or target the specific one needed
            if ($permissionIcon.length) {
                controller.currentPageId = $permissionIcon.data('page-id');
                if (controller.currentPageId) {
                    controller.checkPagePermissions();
                } else {
                    console.error("User Permission: Page ID not found on permission icon.");
                }
            }
        },

        /**
         * Binds all necessary DOM event listeners using delegation where appropriate.
         */
        bindEvents: function() {
            const controller = this;

            // Use event delegation for dynamically added elements
            // Use .off().on() to prevent multiple bindings if init is called multiple times
            $(document).off('click.permissionIcon').on('click.permissionIcon', '.user-permission-icon', function(e) {
                controller.toggleSettingsPanel(e, this); // Pass event and element
            });
            // Use delegation from body for elements potentially added later (panel, overlay)
            $('body').off('click.permissionSave').on('click.permissionSave', '#user-permission-save', function() {
                controller.savePermissions(this); // Pass button element
            });
            $('body').off('click.permissionLoginBtn').on('click.permissionLoginBtn', '#user-permission-login-btn', $.proxy(controller.showLoginForm, controller));
            $('body').off('submit.permissionLogin').on('submit.permissionLogin', '#user-permission-login', function(e) {
                controller.handleLogin(e, this); // Pass event and form element
            });
            $('body').off('click.permissionClose').on('click.permissionClose', '.user-permission-close', $.proxy(controller.closePanel, controller));
            $('body').off('click.permissionCancelLogin').on('click.permissionCancelLogin', '.user-permission-login-form .cancel-btn', $.proxy(controller.cancelLogin, controller));
             // Close panel on Escape key
            $(document).off('keydown.permissionPanel').on('keydown.permissionPanel', function(e) {
                if ((e.key === "Escape" || e.key === "Esc") && $('#user-permission-panel').hasClass('show')) {
                     controller.closePanel();
                }
            });
        },

        /**
         * Toggles the visibility of the permission settings panel.
         * Creates the panel if it doesn't exist, otherwise closes it.
         * @param {Event} e - The click event object.
         * @param {HTMLElement} element - The clicked icon element.
         */
        toggleSettingsPanel: function(e, element) {
            e.preventDefault();
            const controller = this;
            const pageId = $(element).data('page-id');
            const $panel = $('#user-permission-panel');

            if (!pageId) {
                console.error("User Permission: Page ID missing on clicked icon.");
                controller.showToast('เกิดข้อผิดพลาด: ไม่พบ Page ID', 'error');
                return;
            }

            // If the panel exists and is for the *same* pageId, close it.
            // If it exists for a *different* pageId, close it first, then proceed to open for the new ID.
            if ($panel.length) {
                 const existingPageId = $panel.data('page-id');
                 controller.closePanel(); // Close existing panel first
                 // If the click was on the icon for the *already open* panel, stop here (effectively toggling off)
                 if (existingPageId === pageId) {
                    return;
                 }
            }

             // Store the new page ID
            controller.currentPageId = pageId;
            // Proceed to create and open the panel for the new page ID
            controller.createSettingsPanel();
        },

        /**
         * Closes the settings panel with a fade-out effect.
         */
        closePanel: function() {
            const controller = this;
            const $panel = $('#user-permission-panel');
            if ($panel.length && $panel.hasClass('show')) { // Check if it's currently shown
                $panel.removeClass('show');
                // Remove the panel after the transition completes
                setTimeout(() => {
                    $panel.remove();
                    controller.currentPageId = null; // Clear stored page ID
                }, 300); // Match timeout with CSS transition duration
            }
        },

        /**
         * Creates and displays the HTML structure for the settings panel.
         */
        createSettingsPanel: function() {
            const controller = this;
            // Ensure any existing panel is removed instantly before creating a new one
            $('#user-permission-panel').remove();

            // Panel HTML structure (using template literal for readability)
            const panelHtml = `
                <div id="user-permission-panel" class="user-permission-panel" data-page-id="${controller.currentPageId || ''}">
                    <button class="user-permission-close" title="ปิด">×</button>
                    <h3>ตั้งค่าการเข้าถึง (ID: ${controller.currentPageId || 'N/A'})</h3>
                    <div class="user-permission-roles">
                        <div class="role-list">
                            <h4>บทบาทที่อนุญาต:</h4>
                            <div id="role-checkboxes">
                                <div class="loading-spinner">กำลังโหลด...</div>
                            </div>
                        </div>
                    </div>
                    <button id="user-permission-save" class="user-permission-save" disabled>บันทึก</button>
                    <div class="panel-status-message" style="display: none; margin-top: 10px;"></div>
                </div>
            `;

            const $panel = $(panelHtml).appendTo('body');

            // Use requestAnimationFrame for smoother transition initialization
            requestAnimationFrame(() => {
                $panel.addClass('show');
            });

            // Load roles and existing settings
            if (controller.currentPageId) {
                controller.loadAllRoles(); // This will chain to loadExistingSettings on success
            } else {
                console.error("User Permission: Cannot load roles, currentPageId is not set.");
                $('#role-checkboxes').html('<div class="error-message">เกิดข้อผิดพลาด: ไม่พบ Page ID</div>');
                // Show error in panel status instead of toast
                $panel.find('.panel-status-message').text('เกิดข้อผิดพลาด: ไม่พบ Page ID').addClass('error').show();
                // controller.showToast('เกิดข้อผิดพลาด: ไม่พบ Page ID', 'error');
            }
        },

        /**
         * Fetches all available user roles via AJAX.
         */
        loadAllRoles: function() {
            const controller = this;
            const $panel = $('#user-permission-panel'); // Get current panel context
            const $checkboxContainer = $panel.find('#role-checkboxes');
            const $saveBtn = $panel.find('#user-permission-save');
            const $statusMsg = $panel.find('.panel-status-message');

            if (controller.isLoading) return;
            controller.isLoading = true;
            $saveBtn.prop('disabled', true); // Disable save while loading
            $statusMsg.hide().removeClass('error success');
            $checkboxContainer.html('<div class="loading-spinner">กำลังโหลดบทบาท...</div>');

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_all_roles',
                    nonce: userPermissionAjax.nonce
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success && response.data && response.data.roles) {
                        controller.roles = response.data.roles;
                        controller.renderRoleCheckboxes(); // Render checkboxes first
                        controller.loadExistingSettings(); // Then load current settings (will re-enable save on complete)
                    } else {
                        const errorMsg = response.data?.message || 'ไม่สามารถโหลดข้อมูลบทบาทได้';
                        $checkboxContainer.html(`<div class="error-message">${errorMsg}</div>`);
                        $statusMsg.text(errorMsg).addClass('error').show();
                        console.error("User Permission: Failed to load roles.", response);
                        controller.isLoading = false; // Reset loading as the chain broke
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อโหลดบทบาท';
                    $checkboxContainer.html(`<div class="error-message">${errorMsg}</div>`);
                    $statusMsg.text(errorMsg).addClass('error').show();
                    console.error("User Permission: AJAX error loading roles.", textStatus, errorThrown);
                    controller.isLoading = false; // Reset loading on error
                }
                // No 'complete' here, handled in loadExistingSettings complete
            });
        },

        /**
         * Renders the checkboxes for each role in the settings panel.
         */
        renderRoleCheckboxes: function() {
            const controller = this;
            const $checkboxContainer = $('#role-checkboxes'); // Target container inside the panel

            if ($.isEmptyObject(controller.roles)) {
                $checkboxContainer.html('<div class="error-message">ไม่พบข้อมูลบทบาท</div>');
                return;
            }

            // Start with the guest user option
            let checkboxesHtml = `
                <label class="role-checkbox guest-role">
                    <input type="checkbox" name="roles[]" value="guest">
                    <span class="role-name">บุคคลทั่วไป (ไม่ต้องล็อกอิน)</span>
                </label>
                <div class="role-divider"></div>
            `;

            // Add checkboxes for registered user roles, sorted alphabetically by name
            checkboxesHtml += Object.entries(controller.roles)
                .sort(([, roleA], [, roleB]) => (roleA.name || '').localeCompare(roleB.name || '')) // Sort by name
                .map(([roleKey, roleData]) => `
                <label class="role-checkbox">
                    <input type="checkbox" name="roles[]" value="${roleKey}">
                    <span class="role-name">${roleData.name || roleKey}</span>
                </label>
            `).join('');

            $checkboxContainer.html(checkboxesHtml);
        },

        /**
         * Fetches the currently saved permissions for the page via AJAX.
         */
        loadExistingSettings: function() {
            const controller = this;
            const $panel = $('#user-permission-panel');
            const $saveBtn = $panel.find('#user-permission-save');
            const $statusMsg = $panel.find('.panel-status-message');


            if (!controller.currentPageId) {
                console.error("User Permission: Cannot load settings, currentPageId is not set.");
                $statusMsg.text('เกิดข้อผิดพลาด: ไม่พบ Page ID สำหรับโหลดการตั้งค่า').addClass('error').show();
                controller.isLoading = false; // Reset loading state
                return;
            }

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_page_permissions',
                    page_id: controller.currentPageId,
                    nonce: userPermissionAjax.nonce
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success && response.data && Array.isArray(response.data.roles)) {
                        // Check the boxes corresponding to the saved roles
                        response.data.roles.forEach(role => {
                            $panel.find(`#role-checkboxes input[name="roles[]"][value="${role}"]`).prop('checked', true);
                        });
                    } else if (!response.success) {
                        const errorMsg = response.data?.message || 'ไม่สามารถโหลดการตั้งค่าปัจจุบันได้';
                        $statusMsg.text(errorMsg).addClass('error').show();
                        console.error("User Permission: Failed to load existing settings.", response);
                    }
                    // If response.data is empty or roles is not an array, it means no roles are set, which is valid.
                },
                error: function(jqXHR, textStatus, errorThrown) {
                     const errorMsg = 'เกิดข้อผิดพลาดในการโหลดการตั้งค่าที่มีอยู่';
                     $statusMsg.text(errorMsg).addClass('error').show();
                    console.error("User Permission: AJAX error loading existing settings.", textStatus, errorThrown);
                },
                complete: function() {
                    // Both role loading and settings loading are complete (or failed)
                    controller.isLoading = false;
                    $saveBtn.prop('disabled', false); // Enable save button now
                }
            });
        },

        /**
         * Saves the selected permission settings for the page via AJAX.
         * @param {HTMLElement} buttonElement - The save button element.
         */
        savePermissions: function(buttonElement) {
            const controller = this;
            const $saveBtn = $(buttonElement);
            const $panel = $saveBtn.closest('#user-permission-panel');
            const $statusMsg = $panel.find('.panel-status-message');


            if (controller.isLoading || !controller.currentPageId) {
                console.warn("User Permission: Save aborted. Busy or no page ID.", { isLoading: controller.isLoading, pageId: controller.currentPageId });
                return;
            }

            const originalText = $saveBtn.text();
            const selectedRoles = [];
            $panel.find('#role-checkboxes input[name="roles[]"]:checked').each(function() {
                selectedRoles.push($(this).val());
            });

            controller.isLoading = true;
            $saveBtn.prop('disabled', true).text('กำลังบันทึก...');
            $statusMsg.hide().removeClass('error success'); // Clear previous status

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'update_page_permissions',
                    nonce: userPermissionAjax.nonce,
                    page_id: controller.currentPageId,
                    roles: selectedRoles // Send the array of selected role keys
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        controller.showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
                        controller.closePanel();
                        // Re-check permissions for the page to update content visibility immediately
                        controller.checkPagePermissions();
                    } else {
                        const errorMsg = response.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
                        $statusMsg.text(errorMsg).addClass('error').show(); // Show error in panel
                        controller.showToast(errorMsg, 'error'); // Also show toast
                        console.error("User Permission: Failed to save permissions.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                     const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึก';
                     $statusMsg.text(errorMsg).addClass('error').show(); // Show error in panel
                    controller.showToast(errorMsg, 'error');
                    console.error("User Permission: AJAX error saving permissions.", textStatus, errorThrown);
                },
                complete: function() {
                    // Re-enable button and restore text only if save failed (panel stays open)
                    if ($panel.is(':visible')) {
                         $saveBtn.prop('disabled', false).text(originalText);
                    }
                    controller.isLoading = false;
                }
            });
        },

        /**
         * Checks if the current user has permission to view the page content via AJAX.
         * Shows an overlay if access is denied.
         */
        checkPagePermissions: function() {
            const controller = this;
            const $protectedContent = $('.protected-content'); // Target the content area

            if (!controller.currentPageId) {
                console.warn("User Permission: Cannot check permissions, no page ID set.");
                // controller.showBlurOverlay("ไม่สามารถตรวจสอบสิทธิ์ได้"); // Avoid showing overlay if ID is missing
                return;
            }

            // Hide content initially and remove old overlay
            $protectedContent.hide();
            $('.user-permission-overlay').remove();

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'check_page_permissions',
                    page_id: controller.currentPageId,
                    nonce: userPermissionAjax.nonce
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success && response.data?.allowed) {
                        $protectedContent.fadeIn(); // Show content
                        $('.user-permission-overlay').remove(); // Ensure overlay is gone
                    } else {
                        const message = response.data?.message || "คุณไม่มีสิทธิ์เข้าถึงหน้านี้";
                        controller.showBlurOverlay(message); // Show restriction overlay
                        console.log("User Permission: Access denied.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Failed to check permissions, show overlay with error
                    controller.showBlurOverlay("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
                    console.error("User Permission: AJAX error checking page permissions.", textStatus, errorThrown);
                }
            });
        },

        /**
         * Displays a blur overlay with a message and login button for restricted content.
         * @param {string} [reason="หน้านี้ถูกจำกัดการเข้าถึง"] - The main reason text to display.
         * @param {string} [prompt="กรุณาลงชื่อเข้าใช้ด้วยบัญชีที่มีสิทธิ์"] - The prompt text.
         */
        showBlurOverlay: function(reason = "หน้านี้ถูกจำกัดการเข้าถึง", prompt = "กรุณาลงชื่อเข้าใช้ด้วยบัญชีที่มีสิทธิ์") {
            // Prevent multiple overlays
            if ($('.user-permission-overlay').length) return;

            const overlayHtml = `
                <div class="user-permission-overlay">
                    <div class="user-permission-message">
                        <h2>${reason}</h2>
                        <p>${prompt}</p>
                        <button id="user-permission-login-btn" class="user-permission-login-btn">ลงชื่อเข้าใช้</button>
                    </div>
                </div>
            `;
            // Prepend to body to ensure it's visually on top
            $('body').prepend(overlayHtml);
            $('.user-permission-overlay').hide().fadeIn(200); // Fade in effect
        },

        /**
         * Replaces the overlay message with a login form.
         */
        showLoginForm: function() {
            const controller = this;
            const $messageContainer = $('.user-permission-message');

            if (!$messageContainer.length) return;

            const loginFormHtml = `
                <div class="user-permission-login-form">
                    <h3>เข้าสู่ระบบ</h3>
                    <form id="user-permission-login" novalidate>
                        <div class="form-group">
                            <label for="perm-username" class="sr-only">ชื่อผู้ใช้</label>
                            <input id="perm-username" type="text" name="username" placeholder="ชื่อผู้ใช้" required autocomplete="username">
                        </div>
                        <div class="form-group">
                             <label for="perm-password" class="sr-only">รหัสผ่าน</label>
                            <input id="perm-password" type="password" name="password" placeholder="รหัสผ่าน" required autocomplete="current-password">
                        </div>
                        <div class="button-group">
                            <button type="submit" class="login-btn">เข้าสู่ระบบ</button>
                            <button type="button" class="cancel-btn">ยกเลิก</button>
                        </div>
                        <div class="login-message" style="display: none; color: red; margin-top: 10px;"></div>
                    </form>
                </div>
            `;
            // Replace content within the message container
            $messageContainer.html(loginFormHtml);
            $messageContainer.find('input[name="username"]').focus(); // Focus username field
        },

        /**
         * Handles the login form submission via AJAX.
         * @param {Event} e - The submit event object.
         * @param {HTMLFormElement} formElement - The submitted form element.
         */
        handleLogin: function(e, formElement) {
            e.preventDefault();
            const controller = this;
            const $form = $(formElement);
            const $submitBtn = $form.find('button[type="submit"]');
            const $messageDiv = $form.find('.login-message');
            const username = $form.find('input[name="username"]').val()?.trim(); // Optional chaining and trim
            const password = $form.find('input[name="password"]').val(); // Don't trim password

            if (!username || !password) {
                $messageDiv.text('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน').show();
                return;
            }
            if (controller.isLoading) return;

            const originalBtnText = $submitBtn.text();
            controller.isLoading = true;
            $submitBtn.prop('disabled', true).text('กำลังเข้าสู่ระบบ...');
            $messageDiv.hide();

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'user_permission_login',
                    username: username,
                    password: password,
                    nonce: userPermissionAjax.nonce
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        controller.showToast('เข้าสู่ระบบสำเร็จ กำลังโหลดหน้าใหม่...');
                        // Reload the page after a short delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                        // Button state handled by page reload
                    } else {
                        const errorMsg = response.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                        $messageDiv.text(errorMsg).show();
                        controller.showToast(errorMsg, 'error');
                        $submitBtn.prop('disabled', false).text(originalBtnText); // Re-enable button
                        console.warn("User Permission: Login failed.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อเข้าสู่ระบบ';
                    $messageDiv.text(errorMsg).show();
                    controller.showToast(errorMsg, 'error');
                    $submitBtn.prop('disabled', false).text(originalBtnText);
                    console.error("User Permission: AJAX error during login.", textStatus, errorThrown);
                },
                complete: function(jqXHR, textStatus) {
                    // Reset isLoading only if the login failed (page isn't reloading)
                    // Check based on button state or textStatus if needed
                    if (textStatus !== 'success' || (jqXHR.responseJSON && !jqXHR.responseJSON.success)) {
                         controller.isLoading = false;
                    }
                }
            });
        },

        /**
         * Handles the cancellation of the login form, reverting to the initial overlay message.
         */
        cancelLogin: function() {
            const controller = this;
            const $overlay = $('.user-permission-overlay');
            if ($overlay.length) {
                 // Re-create the initial message content
                 // Ideally, store the original reason/prompt when showing overlay,
                 // but using defaults for simplicity here.
                 const initialMessageHtml = `
                     <h2>หน้านี้ถูกจำกัดการเข้าถึง</h2>
                     <p>กรุณาลงชื่อเข้าใช้ด้วยบัญชีที่มีสิทธิ์</p>
                     <button id="user-permission-login-btn" class="user-permission-login-btn">ลงชื่อเข้าใช้</button>
                 `;
                 $overlay.find('.user-permission-message').html(initialMessageHtml);
            }
        },


        /**
         * Displays a short-lived notification message (toast).
         * @param {string} message - The message to display.
         * @param {string} [type='success'] - The type of toast ('success' or 'error').
         */
        showToast: function(message, type = 'success') {
            // Remove any existing toast immediately
            $('.user-permission-toast').remove();

            const $toast = $(`
                <div class="user-permission-toast ${type}">
                    ${message}
                </div>
            `).appendTo('body');

            // --- Reflow Trigger (Replaced void operator) ---
            // Accessing offsetWidth forces the browser to calculate layout, ensuring
            // the element is rendered in its initial state before the 'show' class is added.
            $toast[0].offsetWidth; // Force reflow

            // Add 'show' class to trigger the CSS transition
            $toast.addClass('show');

            // Set timeout to remove the toast
            const displayDuration = 3000; // ms
            const fadeDuration = 300;    // ms (should match CSS transition)

            setTimeout(() => {
                $toast.removeClass('show');
                // Remove from DOM after fade out transition
                setTimeout(() => {
                    $toast.remove();
                }, fadeDuration);
            }, displayDuration);
        }
    };

    // Initialize the controller when the DOM is ready
    user_permission_controller.init();

});
