/**
 * Complaint Form Handler
 * Version: 1.1.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Helper Functions
    const getElement = id => document.getElementById(id);
    const getElements = selector => document.querySelectorAll(selector);
    const showElement = el => el && (el.style.display = 'block');
    const hideElement = el => el && (el.style.display = 'none');

    // Debug ข้อมูล AJAX
    if (window.complaintFormAjax) {
        console.log('AJAX configuration found');
    } else {
        console.error('AJAX configuration not found');
    }

    // Form Configuration
    const CONFIG = {
        MIN_DETAILS_LENGTH: 20,
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
        
        // Type Select Change
        if (typeSelect) {
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
        
        // Type Other Input
        if (typeOtherInput) {
            typeOtherInput.addEventListener('input', function() {
                formState.typeOther = this.value.trim();
                validateField('typeOther');
            });
        }
        
        // Anonymous Checkbox Change
        if (anonymousCheckbox) {
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
        
        // Details Character Count
        if (detailsTextarea && detailsCount) {
            detailsTextarea.addEventListener('input', function() {
                const count = this.value.length;
                detailsCount.textContent = count;
                formState.details = this.value;
                if (count > 2000) {
                    this.value = this.value.substring(0, 2000);
                    formState.details = this.value;
                }
                validateField('details');
            });
        } else if (detailsTextarea) {
            detailsTextarea.addEventListener('input', function() {
                formState.details = this.value;
                validateField('details');
            });
        }
        
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
        
        // Form Submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSubmit(e);
        });
        
        console.log('Event listeners set up successfully');
    }

    // Field Validation
    function validateField(fieldName) {
        const errors = {};
        
        switch(fieldName) {
            case 'type':
                if (!formState.type) {
                    errors.type = 'กรุณาเลือกประเภทเรื่องร้องเรียน';
                } else if (formState.type === 'other' && !formState.typeOther) {
                    errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
                }
                break;
                
            case 'typeOther':
                if (formState.type === 'other' && !formState.typeOther) {
                    errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
                }
                break;
                
            case 'department':
                if (!formState.department) {
                    errors.department = 'กรุณาเลือกหน่วยงานที่ถูกร้องเรียน';
                }
                break;
                
            case 'details':
                if (!formState.details) {
                    errors.details = 'กรุณาระบุรายละเอียด';
                } else if (formState.details.length < CONFIG.MIN_DETAILS_LENGTH) {
                    errors.details = `กรุณาระบุรายละเอียดอย่างน้อย ${CONFIG.MIN_DETAILS_LENGTH} ตัวอักษร`;
                }
                break;
                
            case 'name':
                if (!formState.isAnonymous && !formState.name) {
                    errors.name = 'กรุณาระบุชื่อ-นามสกุล';
                }
                break;
                
            case 'email':
                if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
                    errors.email = 'กรุณาระบุอีเมลให้ถูกต้อง';
                }
                break;
                
            case 'phone':
                if (formState.phone && !/^[0-9]{9,10}$/.test(formState.phone)) {
                    errors.phone = 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง';
                }
                break;
        }

        // ตรวจสอบว่าต้องระบุช่องทางติดต่ออย่างน้อย 1 ช่องทาง
        if (!formState.isAnonymous && fieldName === 'phone' || fieldName === 'email') {
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

        displayErrors(errors);
        return Object.keys(errors).length === 0;
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
        let errors = {};
        
        // ตรวจสอบฟิลด์ที่จำเป็น
        CONFIG.REQUIRED_FIELDS.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        // ตรวจสอบข้อมูลส่วนตัว (ถ้าไม่ใช่การร้องเรียนแบบไม่ระบุตัวตน)
        if (!formState.isAnonymous) {
            if (!formState.name) {
                errors.name = 'กรุณาระบุชื่อ-นามสกุล';
                isValid = false;
            }
            
            if (!formState.phone && !formState.email) {
                errors.contact = 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมล อย่างน้อย 1 ช่องทาง';
                isValid = false;
            }
        }
        
        // ตรวจสอบประเภทอื่นๆ
        if (formState.type === 'other' && !formState.typeOther) {
            errors.typeOther = 'กรุณาระบุประเภทเรื่องร้องเรียนอื่นๆ';
            isValid = false;
        }
        
        displayErrors(errors);

        if (!isValid) {
            // เลื่อนไปยังข้อผิดพลาดแรก
            const firstError = document.querySelector('.error-message:not(:empty)');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
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
            submitButton.disabled = true;
            if (loadingDiv) showElement(loadingDiv);
            showElement(messageDiv);
            messageDiv.className = 'message info';
            messageDiv.textContent = 'กำลังดำเนินการ...';

            console.log('Submitting complaint form...');

            // ตรวจสอบการตั้งค่า AJAX
            if (!window.complaintFormAjax?.ajaxurl || !window.complaintFormAjax?.nonce) {
                console.error('AJAX configuration missing:', window.complaintFormAjax);
                throw new Error('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บและลองใหม่อีกครั้ง');
            }
            
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
            
            if (result.success) {
                // แสดงข้อความเมื่อส่งสำเร็จ
                messageDiv.className = 'message success';
                messageDiv.innerHTML = `
                    <h3>ขอบคุณสำหรับการแจ้งเรื่องร้องเรียน</h3>
                    <p>${result.data?.message || 'เราได้รับเรื่องร้องเรียนของท่านเรียบร้อยแล้ว'}</p>
                    ${result.data?.ref_number ? `<p>เลขที่เรื่องร้องเรียนของท่าน: <strong>${result.data.ref_number}</strong></p>` : ''}
                `;
                // รีเซ็ตฟอร์ม
                resetForm();
                // เลื่อนไปยังข้อความแจ้งเตือน
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // แสดงข้อความเมื่อเกิดข้อผิดพลาด
                throw new Error(result.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            messageDiv.className = 'message error';
            messageDiv.textContent = error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง';
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } finally {
            // คืนสถานะ UI หลังจากส่งข้อมูล
            if (submitButton) submitButton.disabled = false;
            if (loadingDiv) hideElement(loadingDiv);
        }
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
        // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
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