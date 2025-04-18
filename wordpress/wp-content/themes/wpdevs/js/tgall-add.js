/**
 * Gallery Management System
 * File: tgall-add.js
 * Description: Handles all front-end functionality for the gallery management system
 */
jQuery(document).ready(function($) {
    'use strict';

    // Thai Datepicker Configuration
    $.datepicker.regional['th'] = {
        closeText: 'ปิด',
        prevText: 'ก่อนหน้า',
        nextText: 'ถัดไป',
        currentText: 'วันนี้',
        monthNames: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
        monthNamesShort: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
        dayNames: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
        dayNamesShort: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
        dayNamesMin: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
        weekHeader: 'สัปดาห์',
        dateFormat: 'dd/mm/yy',
        firstDay: 0,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
    };
    
    $.datepicker.setDefaults($.datepicker.regional['th']);

    // Modal Management
    const modal = {
        init() {
            this.modal = $('#tgall-modal');
            this.openBtn = $('.tgall-add-button');
            this.closeBtn = $('.tgall-close, .tgall-cancel');
            this.bindEvents();
            this.setupAccessibility();
        },
        
        bindEvents() {
            this.openBtn.on('click', () => this.open());
            this.closeBtn.on('click', () => this.close());
            $(document).on('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            });
            // Close when clicking outside modal
            this.modal.on('click', (e) => {
                if ($(e.target).is(this.modal)) this.close();
            });
        },
        
        setupAccessibility() {
            this.modal.attr({
                'role': 'dialog',
                'aria-hidden': 'true',
                'aria-labelledby': 'modal-title'
            });
        },
        
        open() {
            this.modal.attr('aria-hidden', 'false')
                     .fadeIn()
                     .find('#activity-name').focus();
            $('body').addClass('modal-open');
            this.trapFocus();
        },
        
        close() {
            this.modal.attr('aria-hidden', 'true').fadeOut();
            $('body').removeClass('modal-open');
            $('#tgall-form')[0].reset();
            galleryManager.clearPreview();
            this.openBtn.focus();
        },
        
        trapFocus() {
            const focusableElements = this.modal.find(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            this.modal.on('keydown', function(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                }
            });
        }
    };

    // Gallery Management
    const galleryManager = {
        init() {
            this.container = $('#gallery-preview');
            this.addButton = $('#add-images');
            this.images = [];
            this.bindEvents();
            this.initSortable();
        },
        
        bindEvents() {
            this.addButton.on('click', () => this.openMediaLibrary());
        },
        
        initSortable() {
            this.container.sortable({
                placeholder: 'gallery-placeholder',
                tolerance: 'pointer',
                handle: 'img',
                update: (e, ui) => {
                    this.updateImageOrder();
                    // เมื่อมีการเปลี่ยนแปลงลำดับ ให้อัพเดท featured image class
                    this.updateFeaturedImageIndicator();
                },
                start: (e, ui) => {
                    ui.placeholder.height(ui.item.height());
                }
            }).disableSelection();
        },
        
        openMediaLibrary() {
            if (this.frame) {
                this.frame.open();
                return;
            }
    
            this.frame = wp.media({
                title: 'เลือกรูปภาพสำหรับอัลบัม',
                multiple: true,
                library: { type: 'image' },
                button: { text: 'เพิ่มรูปภาพที่เลือก' }
            });
            
            this.frame.on('select', () => {
                const selection = this.frame.state().get('selection');
                this.addImages(selection);
            });
            
            this.frame.open();
        },
        
        addImages(selection) {
            selection.each((attachment) => {
                const image = attachment.toJSON();
                if (!this.images.includes(image.id)) {
                    this.images.push(image.id);
                    this.addPreviewImage(image);
                }
            });
            // อัพเดท featured image indicator หลังจากเพิ่มรูปภาพ
            this.updateFeaturedImageIndicator();
        },
        
        addPreviewImage(image) {
            const thumbnail = image.sizes.thumbnail || image.sizes.full;
            const isFeatured = this.images.length === 1; // รูปแรกจะเป็น featured
            
            const preview = $(`
                <div class="gallery-item ${isFeatured ? 'is-featured' : ''}" data-id="${image.id}">
                    <img src="${thumbnail.url}" 
                         alt="${image.alt || image.title}"
                         width="${thumbnail.width}"
                         height="${thumbnail.height}">
                    ${isFeatured ? '<span class="featured-badge" aria-label="ภาพปก">ภาพปก</span>' : ''}
                    <button type="button" class="remove-image" aria-label="ลบรูปภาพ ${image.title}">
                        <span class="dashicons dashicons-no"></span>
                    </button>
                </div>
            `);
            
            preview.find('.remove-image').on('click', (e) => {
                e.preventDefault();
                this.removeImage(image.id);
                preview.fadeOut(() => {
                    preview.remove();
                    this.updateFeaturedImageIndicator();
                });
            });
            
            this.container.append(preview);
        },
        
        removeImage(id) {
            this.images = this.images.filter(imageId => imageId !== id);
        },
        
        updateImageOrder() {
            this.images = this.container.find('.gallery-item').map(function() {
                return $(this).data('id');
            }).get();
        },
        
        updateFeaturedImageIndicator() {
            // ลบ featured badge ทั้งหมดก่อน
            this.container.find('.featured-badge').remove();
            this.container.find('.gallery-item').removeClass('is-featured');
            
            // เพิ่ม featured badge ให้กับรูปแรก
            if (this.images.length > 0) {
                const firstImage = this.container.find('.gallery-item').first();
                firstImage.addClass('is-featured');
                firstImage.append('<span class="featured-badge" aria-label="ภาพปก">ภาพปก</span>');
            }
        },
        
        clearPreview() {
            this.container.empty();
            this.images = [];
        }
    };

    // Category Management
    const categoryManager = {
        init() {
            this.select = $('#activity-category');
            this.addButton = $('#add-category');
            this.bindEvents();
        },
        
        bindEvents() {
            this.addButton.on('click', () => this.addNewCategory());
        },
        
        addNewCategory() {
            const categoryName = prompt('กรุณาระบุชื่อหมวดหมู่ใหม่:');
            if (!categoryName) return;

            $.ajax({
                url: tgall_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'tgall_add_category',
                    nonce: tgall_ajax.nonce,
                    name: categoryName
                },
                beforeSend: () => {
                    this.addButton.prop('disabled', true);
                },
                success: (response) => {
                    if (response.success) {
                        const newOption = new Option(response.data.name, response.data.term_id, true, true);
                        this.select.append(newOption).trigger('change');
                        this.showMessage('success', 'เพิ่มหมวดหมู่เรียบร้อยแล้ว');
                    } else {
                        this.showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
                    }
                },
                error: () => {
                    this.showMessage('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
                },
                complete: () => {
                    this.addButton.prop('disabled', false);
                }
            });
        },
        
        showMessage(type, message) {
            const alertClass = type === 'success' ? 'tgall-alert-success' : 'tgall-alert-error';
            const alert = $(`<div class="tgall-alert ${alertClass}" role="alert">${message}</div>`);
            
            $('.tgall-alerts').append(alert);
            setTimeout(() => alert.fadeOut(() => alert.remove()), 3000);
        }
    };

    // Form Management
    const formManager = {
        init() {
            this.form = $('#tgall-form');
            this.submitBtn = this.form.find('button[type="submit"]');
            this.bindEvents();
            this.initDatepicker();
        },

        bindEvents() {
            this.form.on('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });

            // Clear field errors on input
            this.form.find('input, select, textarea').on('input change', function() {
                formManager.clearFieldError($(this));
            });
        },

        initDatepicker() {
            $('.thai-datepicker').datepicker({
                yearOffset: 543,
                beforeShow: function(input, inst) {
                    $('#ui-datepicker-div').addClass('tgall-datepicker');
                },
                onSelect: function(dateText) {
                    const parts = dateText.split('/');
                    const thaiYear = parseInt(parts[2]);
                    $(this).val(`${parts[0]}/${parts[1]}/${thaiYear}`);
                    formManager.clearFieldError($(this));
                }
            });
        },

        validateForm() {
            const requiredFields = {
                'activity-name': 'กรุณาระบุชื่อกิจกรรม',
                'activity-date': 'กรุณาระบุวันที่จัดกิจกรรม',
                'activity-category': 'กรุณาเลือกประเภทกิจกรรม'
            };

            let isValid = true;
            
            Object.entries(requiredFields).forEach(([id, message]) => {
                const field = $(`#${id}`);
                if (field.length === 0) {
                    console.error(`Field with id '${id}' not found`);
                    return;
                }
                
                const value = field.val();
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    isValid = false;
                    this.showFieldError(field, message);
                } else {
                    this.clearFieldError(field);
                }
            });

            return isValid;
        },

        showFieldError(field, message) {
            const errorDiv = $(`<div class="field-error" role="alert">${message}</div>`);
            this.clearFieldError(field);
            field.addClass('has-error').after(errorDiv);
            field.attr('aria-invalid', 'true');
        },

        clearFieldError(field) {
            field.removeClass('has-error')
                 .next('.field-error')
                 .remove();
            field.removeAttr('aria-invalid');
        },

        submitForm() {
            if (!this.validateForm()) return;

            const formData = {
                action: 'tgall_add_post',
                nonce: tgall_ajax.nonce,
                title: $('#activity-name').val().trim(),
                date: $('#activity-date').val().trim(),
                description: $('#activity-description').val().trim(),
                gallery: galleryManager.images,
                category: $('#activity-category').val()
            };

            // Show loading overlay
            const loadingOverlay = $('.tgall-loading-overlay');
            loadingOverlay.attr('aria-hidden', 'false').addClass('active');

            $.ajax({
                url: tgall_ajax.ajax_url,
                type: 'POST',
                data: formData,
                beforeSend: () => {
                    this.submitBtn.prop('disabled', true);
                    loadingOverlay.find('.tgall-loading-text').text('กำลังบันทึกกิจกรรม...');
                },
                success: (response) => {
                    if (response.success) {
                        loadingOverlay.find('.tgall-loading-text').text('บันทึกกิจกรรมเรียบร้อยแล้ว');
                        setTimeout(() => {
                            loadingOverlay.attr('aria-hidden', 'true').removeClass('active');
                            modal.close();
                            location.reload();
                        }, 1500);
                    } else {
                        loadingOverlay.find('.tgall-loading-text')
                            .text(response.data.message || 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม');
                        setTimeout(() => {
                            loadingOverlay.attr('aria-hidden', 'true').removeClass('active');
                        }, 1500);
                    }
                },
                error: () => {
                    loadingOverlay.find('.tgall-loading-text')
                        .text('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                    setTimeout(() => {
                        loadingOverlay.attr('aria-hidden', 'true').removeClass('active');
                    }, 1500);
                },
                complete: () => {
                    this.submitBtn.prop('disabled', false);
                }
            });
        }
    };

    // Initialize all components
    modal.init();
    galleryManager.init();
    categoryManager.init();
    formManager.init();
});