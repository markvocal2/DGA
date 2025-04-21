/**
 * Complaint Form Handler
 * Version: 1.1.1 (Security fixes)
 */

document.addEventListener('DOMContentLoaded', function() {
    // Helper Functions
    const getElement = id => document.getElementById(id);
    const getElements = selector => document.querySelectorAll(selector);
    const showElement = el => el && (el.style.display = 'block');
    const hideElement = el => el && (el.style.display = 'none');
    
    // Escape HTML เพื่อป้องกัน XSS
    const escapeHTML = str => {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Debug ข้อมูล AJAX
    if (window.complaintFormAjax) {
        console.log('AJAX configuration found');
    } else {
        console.error('AJAX configuration not found');
    }

    // Form Configuration
    const CONFIG = {
        MIN_DETAILS_LENGTH: 20,
        MAX_DETAILS_LENGTH: 2000,
        MAX_EMAIL_LENGTH: 254, // ตามมาตรฐาน RFC 5321
        SUBMIT_ENDPOINT: window.complaintFormAjax?.ajaxurl || '/wp-admin/admin-ajax.php',
        REQUIRED_FIELDS: ['type', 'department', 'details'],
        PERSONAL_INFO_FIELDS: ['name', 'address', 'phone', 'email'],
        FORM_WRAPPER_ID: 'complaint-form-wrapper'
    };

    // Initial Data State
    let formState = {
        type: '',
        typeOther: '',
        department: '',
        details: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        isAnonymous: false,
    };

    // Initialize form elements and attach event listeners
    function initForm() {
        // หาฟอร์มที่มีอยู่แล้ว
        const form = document.querySelector('#complaint-form, form.complaint-form');
        
        if (!form) {
            console.error('Complaint form not found');
            return;
        }
        
        console.log('Initializing complaint form');
        
        // ค้นหา elements ภายในฟอร์ม
        const typeSelect = form.querySelector('#type');
        const typeOtherContainer = form.querySelector('.type-other-field');
        const typeOtherInput = form.querySelector('#typeOther');
        const personalInfoSection = form.querySelector('.personal-info');
        const anonymousCheckbox = form.querySelector('#isAnonymous');
        const detailsTextarea = form.querySelector('#details');
        const detailsCount = form.querySelector('#detailsCount');
        const submitButton = form.querySelector('button[type="submit"], .btn-submit');
        const loadingDiv = form.querySelector('.loading');
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        
        // สร้าง message div หากไม่มี
        if (!messageDiv) {
            const newMessageDiv = document.createElement('div');
            newMessageDiv.id = 'form-message';
            newMessageDiv.className = 'message';
            newMessageDiv.style.display = 'none';
            form.insertBefore(newMessageDiv, form.firstChild);
        }
        
        // ติดตั้ง event listeners
        setupTypeSelectListener(typeSelect, typeOtherContainer, typeOtherInput);
        setupTypeOtherListener(typeOtherInput);
        setupAnonymousCheckboxListener(anonymousCheckbox, personalInfoSection);
        setupDetailsTextareaListener(detailsTextarea, detailsCount);
        setupInputListeners(form);
        
        // Form Submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSubmit(e);
        });
        
        console.log('Event listeners set up successfully');
    }
    
    // Setup Type Select Listener
    function setupTypeSelectListener(typeSelect, typeOtherContainer, typeOtherInput) {
        if (!typeSelect) return;
        
        typeSelect.addEventListener('change', function() {
            formState.type = this.value;
            if (this.value === 'other') {
                showElement(typeOtherContainer);
                if (typeOtherInput) typeOtherInput.required = true;
            } else {
                hideElement(typeOtherContainer);
                if (typeOtherInput) {
                    typeOtherInput.required = false;
                    typeOtherInput.value = '';
                }
                formState.typeOther = '';
            }
            validateField('type');
        });
    }
    
    // Setup Type Other Listener
    function setupTypeOtherListener(typeOtherInput) {
        if (!typeOtherInput) return;
        
        typeOtherInput.addEventListener('input', function() {
            formState.typeOther = this.value.trim();
            validateField('typeOther');
        });
    }
    
    // Setup Anonymous Checkbox Listener
    function setupAnonymousCheckboxListener(anonymousCheckbox, personalInfoSection) {
        if (!anonymousCheckbox) return;
        
        anonymousCheckbox.addEventListener('change', function() {
            formState.isAnonymous = this.checked;
            if (this.checked) {
                hideElement(personalInfoSection);
                clearPersonalInfo();
            } else {
                showElement(personalInfoSection);
            }
            validateForm();
        });
    }
    
    // Setup Details Textarea Listener
    function setupDetailsTextareaListener(detailsTextarea, detailsCount) {
        if (!detailsTextarea) return;
        
        if (detailsCount) {
            detailsTextarea.addEventListener('input', function() {
                const count = this.value.length;
                detailsCount.textContent = count;
                formState.details = this.value;
                if (count > CONFIG.MAX_DETAILS_LENGTH) {
                    this.value = this.value.substring(0, CONFIG.MAX_DETAILS_LENGTH);
                    formState.details = this.value;
                }
                validateField('details');
            });
        } else {
            detailsTextarea.addEventListener('input', function() {
                formState.details = this.value;
                validateField('details');
            });
        }
    }
    
    // Setup Input Listeners
    function setupInputListeners(form) {
        // Department Input
        const departmentInput = form.querySelector('#department');
        if (departmentInput) {
            departmentInput.addEventListener('input', function() {
                formState.department = this.value.trim();
                validateField('department');
            });
        }
        
        // Name Input
        const nameInput = form.querySelector('#name');
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                formState.name = this.value.trim();
                validateField('name');
            });
        }
        
        // Address Textarea
        const addressTextarea = form.querySelector('#address');
        if (addressTextarea) {
            addressTextarea.addEventListener('input', function() {
                formState.address = this.value.trim();
            });
        }
        
        // Phone Input
        const phoneInput = form.querySelector('#phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                // อนุญาตเฉพาะตัวเลข
                this.value = this.value.replace(/[^0-9]/g, '');
                formState.phone = this.value;
                validateField('phone');
            });
        }
        
        // Email Input
        const emailInput = form.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                formState.email = this.value.trim();
                validateField('email');
            });
        }
    }

    // Field Validation - แยกการตรวจสอบเป็นฟังก์ชันย่อย
    function validateField(fieldName) {
        const errors = {};
        
        // ตรวจสอบฟิลด์ตามประเภท
        validateFieldByType(fieldName, errors);
        
        // ตรวจสอบข้อมูลติดต่อ
        validateContactField(fieldName, errors);

        displayErrors(errors);
        return Object.keys(errors).length === 0;
    }
    
    // Validate field by type
    function validateFieldByType(fieldName, errors) {
        switch(fieldName) {
            case 'type':
                validateTypeField(errors);
                break;
                
            case 'typeOther':
                validateTypeOtherField(errors);
                break;
                
            case 'department':
                validateDepartmentField(errors);
                break;
                
            case 'details':
                validateDetailsField(errors);
                break;
                
            case 'name':
                validateNameField(errors);
                break;
                
            case 'email':
                validateEmailField(errors);
                break;
                
            case 'phone':
                validatePhoneField(errors);
                break;
        }
    }
    
    // Validate type field
    function validateTypeField(errors) {
        if (!formState.type) {
            errors.type = 'กรุณาเลือกประเภทเรื่องร้องเรียน';
        } else if (formState.type === 'other' && !formState.typeOther) {
            errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
        }
    }
    
    // Validate typeOther field
    function validateTypeOtherField(errors) {
        if (formState.type === 'other' && !formState.typeOther) {
            errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
        }
    }
    
    // Validate department field
    function validateDepartmentField(errors) {
        if (!formState.department) {
            errors.department = 'กรุณาเลือกหน่วยงานที่ถูกร้องเรียน';
        }
    }
    
    // Validate details field
    function validateDetailsField(errors) {
        if (!formState.details) {
            errors.details = 'กรุณาระบุรายละเอียด';
        } else if (formState.details.length < CONFIG.MIN_DETAILS_LENGTH) {
            errors.details = `กรุณาระบุรายละเอียดอย่างน้อย ${CONFIG.MIN_DETAILS_LENGTH} ตัวอักษร`;
        }
    }
    
    // Validate name field
    function validateNameField(errors) {
        if (!formState.isAnonymous && !formState.name) {
            errors.name = 'กรุณาระบุชื่อ-นามสกุล';
        }
    }
    
    /**
     * ตรวจสอบความถูกต้องของอีเมลโดยไม่ใช้ regex ที่ซับซ้อน
     * เพื่อป้องกันปัญหา ReDoS (Regular Expression Denial of Service)
     * @param {Object} errors - อ็อบเจ็กต์เก็บข้อความแจ้งเตือน
     */
    function validateEmailField(errors) {
        const email = formState.email;
        
        // ถ้าไม่มีข้อมูลอีเมล ไม่ต้องตรวจสอบ
        if (!email) return;
        
        // ตรวจสอบความยาวอีเมล
        if (email.length > CONFIG.MAX_EMAIL_LENGTH) {
            errors.email = 'อีเมลยาวเกินไป';
            return;
        }
        
        // ตรวจสอบโครงสร้างพื้นฐานของอีเมล
        const atIndex = email.indexOf('@');
        if (atIndex <= 0 || atIndex === email.length - 1) {
            errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
            return;
        }
        
        // แยกส่วน local และ domain
        const localPart = email.substring(0, atIndex);
        const domainPart = email.substring(atIndex + 1);
        
        // ตรวจสอบว่ามีจุดในส่วน domain
        const dotIndex = domainPart.indexOf('.');
        if (dotIndex <= 0 || dotIndex === domainPart.length - 1) {
            errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
            return;
        }
        
        // ตรวจสอบความยาวส่วน local และ domain
        if (localPart.length > 64 || domainPart.length > 255) {
            errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
            return;
        }
        
        // ตรวจสอบการมีอยู่ของช่องว่าง
        if (email.includes(' ')) {
            errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
            return;
        }
    }
    
    // Validate phone field
    function validatePhoneField(errors) {
        if (formState.phone && !/^[0-9]{9,10}$/.test(formState.phone)) {
            errors.phone = 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง';
        }
    }
    
    // Validate contact field
    function validateContactField(fieldName, errors) {
        if (!formState.isAnonymous && (fieldName === 'phone' || fieldName === 'email')) {
            if (!formState.phone && !formState.email) {
                errors.contact = 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมล อย่างน้อย 1 ช่องทาง';
            } else {
                // ลบข้อความแจ้งเตือนเกี่ยวกับข้อมูลติดต่อหากมีการระบุ
                const contactError = getElement('contact-error');
                if (contactError) {
                    contactError.textContent = '';
                    contactError.setAttribute('aria-hidden', 'true');
                }
            }
        }
    }

    // Display form errors
    function displayErrors(errors) {
        // ล้างข้อความผิดพลาดเดิม
        getElements('.error-message').forEach(span => {
            span.textContent = '';
            span.setAttribute('aria-hidden', 'true');
        });

        // แสดงข้อความผิดพลาดที่พบ
        Object.entries(errors).forEach(([key, message]) => {
            const errorSpan = getElement(`${key}-error`);
            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.setAttribute('aria-hidden', 'false');
            }
        });
    }

    // Validate entire form
    function validateForm() {
        let isValid = true;
        const errors = {};
        
        // ตรวจสอบฟิลด์ที่จำเป็น
        CONFIG.REQUIRED_FIELDS.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        // ตรวจสอบข้อมูลส่วนตัว
        validatePersonalInfoFields(errors);
        
        // ตรวจสอบประเภทอื่นๆ
        if (formState.type === 'other' && !formState.typeOther) {
            errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
            isValid = false;
        }
        
        displayErrors(errors);

        if (!isValid) {
            scrollToFirstError();
        }

        return isValid;
    }
    
    // Validate personal info fields
    function validatePersonalInfoFields(errors) {
        if (!formState.isAnonymous) {
            if (!formState.name) {
                errors.name = 'กรุณาระบุชื่อ-นามสกุล';
                return false;
            }
            
            if (!formState.phone && !formState.email) {
                errors.contact = 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมล อย่างน้อย 1 ช่องทาง';
                return false;
            }
        }
        return true;
    }
    
    // Scroll to first error
    function scrollToFirstError() {
        const firstError = document.querySelector('.error-message:not(:empty)');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Clear personal information fields
    function clearPersonalInfo() {
        CONFIG.PERSONAL_INFO_FIELDS.forEach(field => {
            const element = getElement(field);
            if (element) {
                element.value = '';
                formState[field] = '';
            }
        });
        
        // ล้างข้อความผิดพลาดที่เกี่ยวข้อง
        clearPersonalInfoErrors();
    }
    
    // Clear personal info errors
    function clearPersonalInfoErrors() {
        const nameError = getElement('name-error');
        if (nameError) nameError.textContent = '';
        
        const phoneError = getElement('phone-error');
        if (phoneError) phoneError.textContent = '';
        
        const emailError = getElement('email-error');
        if (emailError) emailError.textContent = '';
        
        const contactError = getElement('contact-error');
        if (contactError) contactError.textContent = '';
    }

    // Reset form to initial state
    function resetForm() {
        const form = document.querySelector('#complaint-form, form.complaint-form');
        if (!form) return;

        // รีเซ็ตฟอร์มและข้อมูล
        form.reset();
        resetFormState();
        resetFormUI(form);
    }
    
    // Reset form state
    function resetFormState() {
        formState = {
            type: '',
            typeOther: '',
            department: '',
            details: '',
            name: '',
            address: '',
            phone: '',
            email: '',
            isAnonymous: false
        };
    }
    
    // Reset form UI
    function resetFormUI(form) {
        // คืนค่า UI กลับสู่สถานะเริ่มต้น
        const typeOtherContainer = form.querySelector('.type-other-field');
        if (typeOtherContainer) hideElement(typeOtherContainer);
        
        const personalInfoSection = form.querySelector('.personal-info');
        if (personalInfoSection) showElement(personalInfoSection);
        
        // ล้างข้อความผิดพลาด
        getElements('.error-message').forEach(span => {
            span.textContent = '';
            span.setAttribute('aria-hidden', 'true');
        });

        // รีเซ็ตตัวนับตัวอักษร
        const detailsCount = getElement('detailsCount');
        if (detailsCount) {
            detailsCount.textContent = '0';
        }

        // ล้างข้อความแจ้งเตือน
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        if (messageDiv) {
            hideElement(messageDiv);
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"], .btn-submit');
        const messageDiv = getElement('form-message') || form.querySelector('.message');
        const loadingDiv = form.querySelector('.loading');
        
        // ตรวจสอบว่ามี message div หรือไม่
        if (!messageDiv) {
            console.error('Message container not found');
            return;
        }
        
        // ตรวจสอบความถูกต้องของฟอร์ม
        if (!validateForm()) {
            console.error('Form validation failed');
            return;
        }

        try {
            // อัพเดต UI เพื่อแสดงสถานะกำลังส่งข้อมูล
            updateUIForSubmission(submitButton, loadingDiv, messageDiv);

            // ตรวจสอบการตั้งค่า AJAX
            validateAJAXConfig();
            
            // ส่งข้อมูลผ่าน AJAX
            const result = await submitComplaintData();
            
            // จัดการผลลัพธ์
            handleSubmissionResult(result, messageDiv);

        } catch (error) {
            handleSubmissionError(error, messageDiv);
        } finally {
            // คืนสถานะ UI หลังจากส่งข้อมูล
            resetUIAfterSubmission(submitButton, loadingDiv);
        }
    }
    
    // Update UI for submission
    function updateUIForSubmission(submitButton, loadingDiv, messageDiv) {
        submitButton.disabled = true;
        if (loadingDiv) showElement(loadingDiv);
        showElement(messageDiv);
        messageDiv.className = 'message info';
        messageDiv.textContent = 'กำลังดำเนินการ...';

        console.log('Submitting complaint form...');
    }
    
    // Validate AJAX config
    function validateAJAXConfig() {
        if (!window.complaintFormAjax?.ajaxurl || !window.complaintFormAjax?.nonce) {
            console.error('AJAX configuration missing:', window.complaintFormAjax);
            throw new Error('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บและลองใหม่อีกครั้ง');
        }
    }
    
    // Submit complaint data
    async function submitComplaintData() {
        // เตรียมข้อมูลสำหรับส่ง
        const submissionData = {
            ...formState,
            timestamp: new Date().toISOString()
        };

        console.log('Sending data:', { 
            action: 'submit_complaint',
            nonce: '***', // ไม่แสดง nonce ในบันทึก
            data: submissionData 
        });

        // ส่งข้อมูลผ่าน AJAX
        const response = await fetch(CONFIG.SUBMIT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'submit_complaint',
                nonce: window.complaintFormAjax.nonce,
                data: JSON.stringify(submissionData)
            })
        });

        // ตรวจสอบสถานะการตอบกลับ
        if (!response.ok) {
            throw new Error(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${response.status}`);
        }

        // แปลงข้อมูลการตอบกลับเป็น JSON
        const result = await response.json();
        console.log('Server response:', result);
        
        return result;
    }
    
    // Handle submission result
    function handleSubmissionResult(result, messageDiv) {
        if (result.success) {
            // แสดงข้อความเมื่อส่งสำเร็จ
            messageDiv.className = 'message success';
            
            // ป้องกัน XSS ใน HTML ที่ถูกแสดง
            const message = escapeHTML(result.data?.message || 'เราได้รับเรื่องร้องเรียนของท่านเรียบร้อยแล้ว');
            const refNumber = result.data?.ref_number ? escapeHTML(result.data.ref_number) : '';
            
            messageDiv.innerHTML = `
                <h3>ขอบคุณสำหรับการแจ้งเรื่องร้องเรียน</h3>
                <p>${message}</p>
                ${refNumber ? `<p>เลขที่เรื่องร้องเรียนของท่าน: <strong>${refNumber}</strong></p>` : ''}
            `;
            
            // รีเซ็ตฟอร์ม
            resetForm();
            // เลื่อนไปยังข้อความแจ้งเตือน
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // แสดงข้อความเมื่อเกิดข้อผิดพลาด
            throw new Error(result.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
        }
    }
    
    // Handle submission error
    function handleSubmissionError(error, messageDiv) {
        console.error('Form submission error:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง';
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Reset UI after submission
    function resetUIAfterSubmission(submitButton, loadingDiv) {
        if (submitButton) submitButton.disabled = false;
        if (loadingDiv) hideElement(loadingDiv);
    }

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            resetForm();
        }
    });

    // Initialize form
    try {
        console.log('Initializing complaint form system');
        initForm();
    } catch (error) {
        console.error('Form initialization error:', error);
        displayInitializationError();
    }
    
    // Display initialization error
    function displayInitializationError() {
        const container = document.querySelector('.complaint-form-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>เกิดข้อผิดพลาดในการโหลดแบบฟอร์ม กรุณารีเฟรชหน้าเว็บ</p>
                    <button onclick="location.reload()" class="retry-button">
                        ลองใหม่อีกครั้ง
                    </button>
                </div>
            `;
        }
    }
});
