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
            // Use .off().on() to prevent multiple bindings if init is called multiple times (though unlikely here)
            $(document).off('click.permissionIcon').on('click.permissionIcon', '.user-permission-icon', function(e) {
                controller.toggleSettingsPanel(e, this); // Pass event and element
            });
            $('body').off('click.permissionSave').on('click.permissionSave', '#user-permission-save', function() {
                controller.savePermissions(this); // Pass button element
            });
            $('body').off('click.permissionLoginBtn').on('click.permissionLoginBtn', '#user-permission-login-btn', $.proxy(controller.showLoginForm, controller));
            $('body').off('submit.permissionLogin').on('submit.permissionLogin', '#user-permission-login', function(e) {
                controller.handleLogin(e, this); // Pass event and form element
            });
            $('body').off('click.permissionClose').on('click.permissionClose', '.user-permission-close', $.proxy(controller.closePanel, controller));
            $('body').off('click.permissionCancelLogin').on('click.permissionCancelLogin', '.user-permission-login-form .cancel-btn', $.proxy(controller.cancelLogin, controller));
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

            // Store the page ID for later use (e.g., saving)
            controller.currentPageId = pageId;

            if ($panel.length === 0) {
                controller.createSettingsPanel();
            } else {
                controller.closePanel();
            }
        },

        /**
         * Closes the settings panel with a fade-out effect.
         */
        closePanel: function() {
            const controller = this;
            const $panel = $('#user-permission-panel');
            if ($panel.length) {
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
                <div id="user-permission-panel" class="user-permission-panel">
                    <button class="user-permission-close" title="ปิด">×</button>
                    <h3>ตั้งค่าการเข้าถึง</h3>
                    <div class="user-permission-roles">
                        <div class="role-list">
                            <h4>บทบาทที่อนุญาต:</h4>
                            <div id="role-checkboxes">
                                <div class="loading-spinner">กำลังโหลด...</div>
                            </div>
                        </div>
                    </div>
                    <button id="user-permission-save" class="user-permission-save">บันทึก</button>
                </div>
            `;

            const $panel = $(panelHtml).appendTo('body');

            // Use requestAnimationFrame to ensure the element is in the DOM
            // and the 'show' class is added in the next frame, triggering the transition.
            requestAnimationFrame(() => {
                $panel.addClass('show');
            });

            // Load roles and existing settings for the current page ID
            if (controller.currentPageId) {
                controller.loadAllRoles();
            } else {
                console.error("User Permission: Cannot load roles, currentPageId is not set.");
                $('#role-checkboxes').html('<div class="error-message">เกิดข้อผิดพลาด: ไม่พบ Page ID</div>');
                controller.showToast('เกิดข้อผิดพลาด: ไม่พบ Page ID', 'error');
            }
        },

        /**
         * Fetches all available user roles via AJAX.
         */
        loadAllRoles: function() {
            const controller = this;

            if (controller.isLoading) return; // Prevent concurrent requests
            controller.isLoading = true;
            // Show loading indicator in the panel
            $('#role-checkboxes').html('<div class="loading-spinner">กำลังโหลดบทบาท...</div>');

            $.ajax({
                url: userPermissionAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_all_roles',
                    nonce: userPermissionAjax.nonce // Ensure this variable is available globally
                },
                dataType: 'json', // Expect JSON response
                success: function(response) {
                    if (response.success && response.data && response.data.roles) {
                        controller.roles = response.data.roles;
                        controller.renderRoleCheckboxes();
                        // Now load the settings specific to this page
                        controller.loadExistingSettings();
                    } else {
                        const errorMsg = response.data?.message || 'ไม่สามารถโหลดข้อมูลบทบาทได้';
                        $('#role-checkboxes').html(`<div class="error-message">${errorMsg}</div>`);
                        controller.showToast(errorMsg, 'error');
                        console.error("User Permission: Failed to load roles.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $('#role-checkboxes').html('<div class="error-message">เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อโหลดบทบาท</div>');
                    controller.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลบทบาท', 'error');
                    console.error("User Permission: AJAX error loading roles.", textStatus, errorThrown);
                },
                complete: function() {
                    // Note: isLoading is set to false in loadExistingSettings' complete callback
                    // to ensure both requests finish before enabling the save button etc.
                    // If loadExistingSettings fails immediately, we might need to reset it here too.
                }
            });
        },

        /**
         * Renders the checkboxes for each role in the settings panel.
         */
        renderRoleCheckboxes: function() {
            const controller = this;
            const $checkboxContainer = $('#role-checkboxes');

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

            // Add checkboxes for registered user roles
            checkboxesHtml += Object.entries(controller.roles).map(([roleKey, roleData]) => `
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

            if (!controller.currentPageId) {
                console.error("User Permission: Cannot load settings, currentPageId is not set.");
                controller.showToast('เกิดข้อผิดพลาด: ไม่พบ Page ID สำหรับโหลดการตั้งค่า', 'error');
                controller.isLoading = false; // Reset loading state as this sequence failed
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
                            $(`#role-checkboxes input[name="roles[]"][value="${role}"]`).prop('checked', true);
                        });
                    } else if (!response.success) {
                        // Handle case where fetching settings fails but roles loaded
                        const errorMsg = response.data?.message || 'ไม่สามารถโหลดการตั้งค่าปัจจุบันได้';
                        controller.showToast(errorMsg, 'error');
                        console.error("User Permission: Failed to load existing settings.", response);
                    }
                    // If response.data is empty or roles is not an array, it means no roles are set, which is valid.
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    controller.showToast('เกิดข้อผิดพลาดในการโหลดการตั้งค่าที่มีอยู่', 'error');
                    console.error("User Permission: AJAX error loading existing settings.", textStatus, errorThrown);
                },
                complete: function() {
                    // Both role loading and settings loading are complete
                    controller.isLoading = false;
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

            if (controller.isLoading || !controller.currentPageId) {
                console.warn("User Permission: Save aborted. Busy or no page ID.", { isLoading: controller.isLoading, pageId: controller.currentPageId });
                return;
            }

            const originalText = $saveBtn.text();
            const selectedRoles = [];
            $('#role-checkboxes input[name="roles[]"]:checked').each(function() {
                selectedRoles.push($(this).val());
            });

            controller.isLoading = true;
            $saveBtn.prop('disabled', true).text('กำลังบันทึก...');

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
                        // Optionally, re-check permissions immediately if needed, though usually a page reload follows.
                        // controller.checkPagePermissions();
                    } else {
                        const errorMsg = response.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
                        controller.showToast(errorMsg, 'error');
                        console.error("User Permission: Failed to save permissions.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    controller.showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อบันทึก', 'error');
                    console.error("User Permission: AJAX error saving permissions.", textStatus, errorThrown);
                },
                complete: function() {
                    // Re-enable button and restore text regardless of success/error
                    $saveBtn.prop('disabled', false).text(originalText);
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

            if (!controller.currentPageId) {
                console.warn("User Permission: Cannot check permissions, no page ID set.");
                // Decide if an overlay should be shown by default if page ID is missing
                // controller.showBlurOverlay("ไม่สามารถตรวจสอบสิทธิ์ได้");
                return;
            }

            // Assume content is hidden initially or hide it now
            $('.protected-content').hide(); // Ensure it's hidden before check
            $('.user-permission-overlay').remove(); // Remove any existing overlay

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
                        // User has permission, show content
                        $('.protected-content').fadeIn();
                        $('.user-permission-overlay').remove(); // Ensure overlay is gone
                    } else {
                        // User does not have permission or error occurred
                        const message = response.data?.message || "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"; // Use message from server if available
                        controller.showBlurOverlay(message);
                        console.log("User Permission: Access denied.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Failed to check permissions, assume restricted
                    controller.showBlurOverlay("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
                    console.error("User Permission: AJAX error checking page permissions.", textStatus, errorThrown);
                }
                // No complete handler needed unless managing a loading state specific to this check
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
            $('body').append(overlayHtml);
            // Optionally fade in the overlay
            $('.user-permission-overlay').hide().fadeIn();
        },

        /**
         * Replaces the overlay message with a login form.
         */
        showLoginForm: function() {
            const controller = this;
            const $messageContainer = $('.user-permission-message');

            if (!$messageContainer.length) return; // Target container doesn't exist

            const loginFormHtml = `
                <div class="user-permission-login-form">
                    <h3>เข้าสู่ระบบ</h3>
                    <form id="user-permission-login" novalidate>
                        <div class="form-group">
                            <input type="text" name="username" placeholder="ชื่อผู้ใช้" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <input type="password" name="password" placeholder="รหัสผ่าน" required autocomplete="current-password">
                        </div>
                        <div class="button-group">
                            <button type="submit" class="login-btn">เข้าสู่ระบบ</button>
                            <button type="button" class="cancel-btn">ยกเลิก</button>
                        </div>
                        <div class="login-message" style="display: none; color: red; margin-top: 10px;"></div>
                    </form>
                </div>
            `;
            $messageContainer.html(loginFormHtml);
        },

        /**
         * Handles the login form submission via AJAX.
         * @param {Event} e - The submit event object.
         * @param {HTMLFormElement} formElement - The submitted form element.
         */
        handleLogin: function(e, formElement) {
            e.preventDefault(); // Prevent default form submission
            const controller = this;
            const $form = $(formElement);
            const $submitBtn = $form.find('button[type="submit"]');
            const $messageDiv = $form.find('.login-message');
            const username = $form.find('input[name="username"]').val();
            const password = $form.find('input[name="password"]').val();

            // Basic validation
            if (!username || !password) {
                $messageDiv.text('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน').show();
                return;
            }

            if (controller.isLoading) return; // Prevent concurrent requests

            const originalBtnText = $submitBtn.text();
            controller.isLoading = true;
            $submitBtn.prop('disabled', true).text('กำลังเข้าสู่ระบบ...');
            $messageDiv.hide(); // Hide previous messages

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
                        // Reload the page after a short delay to show the toast
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                        // No need to manually re-enable the button as the page reloads
                    } else {
                        const errorMsg = response.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                        $messageDiv.text(errorMsg).show(); // Show error in the form
                        controller.showToast(errorMsg, 'error'); // Also show as toast
                        $submitBtn.prop('disabled', false).text(originalBtnText); // Re-enable button
                        console.warn("User Permission: Login failed.", response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อเข้าสู่ระบบ';
                    $messageDiv.text(errorMsg).show();
                    controller.showToast(errorMsg, 'error');
                    $submitBtn.prop('disabled', false).text(originalBtnText); // Re-enable button
                    console.error("User Permission: AJAX error during login.", textStatus, errorThrown);
                },
                complete: function() {
                    // Only reset isLoading if the login didn't succeed (page isn't reloading)
                    if (!$submitBtn.prop('disabled')) {
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
            // Re-show the original overlay message. Fetch the original reason/prompt if stored,
            // otherwise use defaults. For simplicity, using defaults here.
            const $overlay = $('.user-permission-overlay');
            if ($overlay.length) {
                 // Re-create the initial message content
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

            // Force reflow before adding 'show' class to trigger transition
            // This line is an expression used for its side-effect (forcing reflow)
            // and might be flagged by some linters, but it's intentional.
            void $toast[0].offsetWidth; // Use void to indicate intentional non-assignment

            $toast.addClass('show');

            // Set timeout to remove the toast
            setTimeout(() => {
                $toast.removeClass('show');
                // Remove from DOM after fade out transition
                setTimeout(() => {
                    $toast.remove();
                }, 300); // Match CSS transition duration
            }, 3000); // Duration the toast is visible
        }
    };

    // Initialize the controller when the DOM is ready
    user_permission_controller.init();

});
