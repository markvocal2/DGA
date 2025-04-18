/**
 * OIT Assessment Form JavaScript
 */
(function($) {
    'use strict';
    
    // เริ่มต้นเมื่อโหลดเอกสารเสร็จ
    $(document).ready(function() {
        // เริ่มต้นฟังก์ชั่นต่างๆ
        initOITForm();
    });
    
    /**
     * เริ่มต้นการทำงานของฟอร์ม OIT
     */
    function initOITForm() {
        // ฟอร์มเพิ่มตัวชี้วัด
        $('#oitform-add-indicator').on('submit', function(e) {
            e.preventDefault();
            addIndicator($(this));
        });
        
        // ปุ่มแก้ไขตัวชี้วัด
        $(document).on('click', '.oitform-btn-edit', function() {
            const indicatorElement = $(this).closest('.oitform-indicator');
            const indicatorId = indicatorElement.data('id');
            const indicatorName = indicatorElement.find('h3').text().trim();
            const indicatorDescription = indicatorElement.find('.oitform-indicator-description').text().trim();
            
            showEditIndicatorModal(indicatorId, indicatorName, indicatorDescription);
        });
        
        // ปุ่มลบตัวชี้วัด
        $(document).on('click', '.oitform-btn-delete', function() {
            if(confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตัวชี้วัดนี้?')) {
                const indicatorElement = $(this).closest('.oitform-indicator');
                const indicatorId = indicatorElement.data('id');
                
                deleteIndicator(indicatorId);
            }
        });
        
        // ปุ่มเพิ่มเนื้อหา
        $(document).on('click', '.oitform-btn-add-content', function() {
            const indicatorId = $(this).data('indicator-id');
            showAddContentModal(indicatorId);
        });
        
        // ปุ่มแก้ไขเนื้อหา
        $(document).on('click', '.oitform-btn-edit-content', function() {
            const contentElement = $(this).closest('.oitform-content-item');
            const indicatorElement = $(this).closest('.oitform-indicator');
            const indicatorId = indicatorElement.data('id');
            const contentId = contentElement.data('id');
            
            const contentTitle = contentElement.find('.oitform-content-title').text().trim();
            const contentDescription = contentElement.find('.oitform-content-description').text().trim();
            const contentUrl = contentElement.find('.oitform-content-url a').attr('href') || '';
            
            showEditContentModal(indicatorId, contentId, contentTitle, contentDescription, contentUrl);
        });
        
        // ปุ่มลบเนื้อหา
        $(document).on('click', '.oitform-btn-delete-content', function() {
            if(confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเนื้อหานี้?')) {
                const contentElement = $(this).closest('.oitform-content-item');
                const indicatorElement = $(this).closest('.oitform-indicator');
                const indicatorId = indicatorElement.data('id');
                const contentId = contentElement.data('id');
                
                deleteContent(indicatorId, contentId);
            }
        });
        
        // ปุ่มปิด Modal
        $(document).on('click', '.oitform-modal-close, .oitform-modal-overlay', function() {
            closeModal();
        });
        
        // ปิด Modal ด้วยปุ่ม ESC
        $(document).on('keydown', function(e) {
            if(e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    /**
     * เพิ่มตัวชี้วัดใหม่
     */
    function addIndicator(form) {
        const formData = {
            action: 'oitform_add_indicator',
            security: oitform_params.security,
            name: form.find('#indicator-name').val(),
            description: form.find('#indicator-description').val()
        };
        
        // ปิดใช้งานฟอร์มระหว่างการส่งข้อมูล
        form.find('button').prop('disabled', true).text('กำลังบันทึก...');
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // รีเซ็ตฟอร์ม
                form[0].reset();
                
                // เพิ่มตัวชี้วัดใหม่ลงในรายการ
                const indicator = response.data.indicator;
                const indicatorHtml = `
                <div class="oitform-indicator" data-id="${response.data.index}">
                    <div class="oitform-indicator-header">
                        <h3>${indicator.name}</h3>
                        <div class="oitform-indicator-actions">
                            <button class="oitform-btn oitform-btn-edit" aria-label="แก้ไขตัวชี้วัด ${indicator.name}">
                                <span class="dashicons dashicons-edit"></span>
                            </button>
                            <button class="oitform-btn oitform-btn-delete" aria-label="ลบตัวชี้วัด ${indicator.name}">
                                <span class="dashicons dashicons-trash"></span>
                            </button>
                        </div>
                    </div>
                    <div class="oitform-indicator-description">
                        <p>${indicator.description}</p>
                    </div>
                    <div class="oitform-content-items">
                        <h4>เนื้อหา:</h4>
                        <p class="oitform-empty-message">ยังไม่มีเนื้อหา</p>
                        <div class="oitform-add-content">
                            <button class="oitform-btn oitform-btn-add-content" data-indicator-id="${response.data.index}">
                                เพิ่มเนื้อหา <span class="dashicons dashicons-plus"></span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
                
                // ลบข้อความ "ยังไม่มีตัวชี้วัด" ถ้ามี
                const indicatorsList = $('#oitform-indicators-list');
                if(indicatorsList.find('.oitform-empty-message').length) {
                    indicatorsList.empty();
                }
                
                // เพิ่มตัวชี้วัดใหม่
                indicatorsList.append(indicatorHtml);
                
                // แจ้งเตือนสำเร็จ
                alert('เพิ่มตัวชี้วัดสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถเพิ่มตัวชี้วัดได้'));
            }
            
            // เปิดใช้งานฟอร์มอีกครั้ง
            form.find('button').prop('disabled', false).text('เพิ่มตัวชี้วัด');
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            form.find('button').prop('disabled', false).text('เพิ่มตัวชี้วัด');
        });
    }
    
    /**
     * แก้ไขตัวชี้วัด
     */
    function editIndicator(index, name, description) {
        const formData = {
            action: 'oitform_edit_indicator',
            security: oitform_params.security,
            index: index,
            name: name,
            description: description
        };
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // อัปเดตตัวชี้วัดใน UI
                const indicatorElement = $(`.oitform-indicator[data-id="${index}"]`);
                indicatorElement.find('h3').text(name);
                indicatorElement.find('.oitform-indicator-description').html(`<p>${description}</p>`);
                
                // ปิด Modal
                closeModal();
                
                // แจ้งเตือนสำเร็จ
                alert('แก้ไขตัวชี้วัดสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถแก้ไขตัวชี้วัดได้'));
            }
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
    }
    
    /**
     * ลบตัวชี้วัด
     */
    function deleteIndicator(index) {
        const formData = {
            action: 'oitform_delete_indicator',
            security: oitform_params.security,
            index: index
        };
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // ลบตัวชี้วัดออกจาก UI
                $(`.oitform-indicator[data-id="${index}"]`).remove();
                
                // เพิ่มข้อความ "ยังไม่มีตัวชี้วัด" ถ้าไม่มีตัวชี้วัดเหลือ
                const indicatorsList = $('#oitform-indicators-list');
                if(indicatorsList.children().length === 0) {
                    indicatorsList.html('<p class="oitform-empty-message">ยังไม่มีตัวชี้วัดย่อย</p>');
                }
                
                // แจ้งเตือนสำเร็จ
                alert('ลบตัวชี้วัดสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถลบตัวชี้วัดได้'));
            }
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
    }
    
    /**
     * เพิ่มเนื้อหา
     */
    function addContent(indicatorIndex, title, description, url) {
        const formData = {
            action: 'oitform_add_content',
            security: oitform_params.security,
            indicator_index: indicatorIndex,
            title: title,
            description: description,
            url: url
        };
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // หาตัวชี้วัด
                const indicatorElement = $(`.oitform-indicator[data-id="${indicatorIndex}"]`);
                const contentItemsContainer = indicatorElement.find('.oitform-content-items');
                
                // ลบข้อความ "ยังไม่มีเนื้อหา"
                contentItemsContainer.find('.oitform-empty-message').remove();
                
                // สร้างรายการเนื้อหาถ้ายังไม่มี
                let contentList = contentItemsContainer.find('.oitform-content-list');
                if(contentList.length === 0) {
                    contentItemsContainer.prepend('<ul class="oitform-content-list"></ul>');
                    contentList = contentItemsContainer.find('.oitform-content-list');
                }
                
                // สร้าง HTML สำหรับเนื้อหาใหม่
                const content = response.data.content;
                const contentHtml = `
                <li class="oitform-content-item" data-id="${response.data.content_index}">
                    <div class="oitform-content-title">
                        ${content.title}
                    </div>
                    <div class="oitform-content-description">
                        <p>${content.description}</p>
                    </div>
                    ${content.url ? `
                    <div class="oitform-content-url">
                        <a href="${content.url}" target="_blank" rel="noopener">
                            ดูเนื้อหา <span class="dashicons dashicons-external"></span>
                        </a>
                    </div>
                    ` : ''}
                    <div class="oitform-content-actions">
                        <button class="oitform-btn oitform-btn-edit-content" aria-label="แก้ไขเนื้อหา ${content.title}">
                            <span class="dashicons dashicons-edit"></span>
                        </button>
                        <button class="oitform-btn oitform-btn-delete-content" aria-label="ลบเนื้อหา ${content.title}">
                            <span class="dashicons dashicons-trash"></span>
                        </button>
                    </div>
                </li>
                `;
                
                // เพิ่มเนื้อหาใหม่ลงในรายการ
                contentList.append(contentHtml);
                
                // ปิด Modal
                closeModal();
                
                // แจ้งเตือนสำเร็จ
                alert('เพิ่มเนื้อหาสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถเพิ่มเนื้อหาได้'));
            }
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
    }
    
    /**
     * แก้ไขเนื้อหา
     */
    function editContent(indicatorIndex, contentIndex, title, description, url) {
        const formData = {
            action: 'oitform_edit_content',
            security: oitform_params.security,
            indicator_index: indicatorIndex,
            content_index: contentIndex,
            title: title,
            description: description,
            url: url
        };
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // หาเนื้อหา
                const indicatorElement = $(`.oitform-indicator[data-id="${indicatorIndex}"]`);
                const contentElement = indicatorElement.find(`.oitform-content-item[data-id="${contentIndex}"]`);
                
                // อัปเดตเนื้อหาใน UI
                const content = response.data.content;
                contentElement.find('.oitform-content-title').text(content.title);
                contentElement.find('.oitform-content-description').html(`<p>${content.description}</p>`);
                
                if(content.url) {
                    if(contentElement.find('.oitform-content-url').length) {
                        contentElement.find('.oitform-content-url a').attr('href', content.url);
                    } else {
                        contentElement.append(`
                        <div class="oitform-content-url">
                            <a href="${content.url}" target="_blank" rel="noopener">
                                ดูเนื้อหา <span class="dashicons dashicons-external"></span>
                            </a>
                        </div>
                        `);
                    }
                } else {
                    contentElement.find('.oitform-content-url').remove();
                }
                
                // ปิด Modal
                closeModal();
                
                // แจ้งเตือนสำเร็จ
                alert('แก้ไขเนื้อหาสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถแก้ไขเนื้อหาได้'));
            }
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
    }
    
    /**
     * ลบเนื้อหา
     */
    function deleteContent(indicatorIndex, contentIndex) {
        const formData = {
            action: 'oitform_delete_content',
            security: oitform_params.security,
            indicator_index: indicatorIndex,
            content_index: contentIndex
        };
        
        $.post(oitform_params.ajax_url, formData, function(response) {
            if(response.success) {
                // หาตัวชี้วัด
                const indicatorElement = $(`.oitform-indicator[data-id="${indicatorIndex}"]`);
                const contentItemsContainer = indicatorElement.find('.oitform-content-items');
                const contentElement = contentItemsContainer.find(`.oitform-content-item[data-id="${contentIndex}"]`);
                
                // ลบเนื้อหาออกจาก UI
                contentElement.remove();
                
                // เพิ่มข้อความ "ยังไม่มีเนื้อหา" ถ้าไม่มีเนื้อหาเหลืออยู่
                const contentList = contentItemsContainer.find('.oitform-content-list');
                if(contentList.children().length === 0) {
                    contentList.remove();
                    contentItemsContainer.find('h4').after('<p class="oitform-empty-message">ยังไม่มีเนื้อหา</p>');
                }
                
                // แจ้งเตือนสำเร็จ
                alert('ลบเนื้อหาสำเร็จ');
            } else {
                alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถลบเนื้อหาได้'));
            }
        }).fail(function() {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
    }
    
    /**
     * แสดง Modal สำหรับแก้ไขตัวชี้วัด
     */
    function showEditIndicatorModal(indicatorId, name, description) {
        const modalTitle = 'แก้ไขตัวชี้วัด';
        const modalContent = `
        <form id="oitform-edit-indicator-form">
            <div class="form-group">
                <label for="edit-indicator-name">ชื่อตัวชี้วัดย่อย:</label>
                <input type="text" id="edit-indicator-name" name="indicator_name" value="${name}" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="edit-indicator-description">คำอธิบาย:</label>
                <textarea id="edit-indicator-description" name="indicator_description" rows="3" aria-required="true">${description}</textarea>
            </div>
            <input type="hidden" id="edit-indicator-id" value="${indicatorId}">
            <div class="oitform-modal-actions">
                <button type="submit" class="oitform-btn oitform-btn-primary">บันทึก</button>
                <button type="button" class="oitform-btn oitform-btn-cancel">ยกเลิก</button>
            </div>
        </form>
        `;
        
        showModal(modalTitle, modalContent);
        
        // เพิ่ม Event สำหรับฟอร์ม
        $('#oitform-edit-indicator-form').on('submit', function(e) {
            e.preventDefault();
            const id = $('#edit-indicator-id').val();
            const name = $('#edit-indicator-name').val();
            const description = $('#edit-indicator-description').val();
            
            editIndicator(id, name, description);
        });
        
        // ปุ่มยกเลิก
        $('.oitform-btn-cancel').on('click', function() {
            closeModal();
        });
    }
    
    /**
     * แสดง Modal สำหรับเพิ่มเนื้อหา
     */
    function showAddContentModal(indicatorId) {
        const modalTitle = 'เพิ่มเนื้อหา';
        const modalContent = `
        <form id="oitform-add-content-form">
            <div class="form-group">
                <label for="content-title">หัวข้อเนื้อหา:</label>
                <input type="text" id="content-title" name="content_title" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="content-description">รายละเอียด:</label>
                <textarea id="content-description" name="content_description" rows="3" aria-required="true"></textarea>
            </div>
            <div class="form-group">
                <label for="content-url">URL (ถ้ามี):</label>
                <input type="url" id="content-url" name="content_url" placeholder="https://">
            </div>
            <input type="hidden" id="content-indicator-id" value="${indicatorId}">
            <div class="oitform-modal-actions">
                <button type="submit" class="oitform-btn oitform-btn-primary">บันทึก</button>
                <button type="button" class="oitform-btn oitform-btn-cancel">ยกเลิก</button>
            </div>
        </form>
        `;
        
        showModal(modalTitle, modalContent);
        
        // เพิ่ม Event สำหรับฟอร์ม
        $('#oitform-add-content-form').on('submit', function(e) {
            e.preventDefault();
            const indicatorId = $('#content-indicator-id').val();
            const title = $('#content-title').val();
            const description = $('#content-description').val();
            const url = $('#content-url').val();
            
            addContent(indicatorId, title, description, url);
        });
        
        // ปุ่มยกเลิก
        $('.oitform-btn-cancel').on('click', function() {
            closeModal();
        });
    }
    
    /**
     * แสดง Modal สำหรับแก้ไขเนื้อหา
     */
    function showEditContentModal(indicatorId, contentId, title, description, url) {
        const modalTitle = 'แก้ไขเนื้อหา';
        const modalContent = `
        <form id="oitform-edit-content-form">
            <div class="form-group">
                <label for="edit-content-title">หัวข้อเนื้อหา:</label>
                <input type="text" id="edit-content-title" name="content_title" value="${title}" required aria-required="true">
            </div>
            <div class="form-group">
                <label for="edit-content-description">รายละเอียด:</label>
                <textarea id="edit-content-description" name="content_description" rows="3" aria-required="true">${description}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-content-url">URL (ถ้ามี):</label>
                <input type="url" id="edit-content-url" name="content_url" value="${url}" placeholder="https://">
            </div>
            <input type="hidden" id="edit-content-indicator-id" value="${indicatorId}">
            <input type="hidden" id="edit-content-id" value="${contentId}">
            <div class="oitform-modal-actions">
                <button type="submit" class="oitform-btn oitform-btn-primary">บันทึก</button>
                <button type="button" class="oitform-btn oitform-btn-cancel">ยกเลิก</button>
            </div>
        </form>
        `;
        
        showModal(modalTitle, modalContent);
        
        // เพิ่ม Event สำหรับฟอร์ม
        $('#oitform-edit-content-form').on('submit', function(e) {
            e.preventDefault();
            const indicatorId = $('#edit-content-indicator-id').val();
            const contentId = $('#edit-content-id').val();
            const title = $('#edit-content-title').val();
            const description = $('#edit-content-description').val();
            const url = $('#edit-content-url').val();
            
            editContent(indicatorId, contentId, title, description, url);
        });
        
        // ปุ่มยกเลิก
        $('.oitform-btn-cancel').on('click', function() {
            closeModal();
        });
    }
    
    /**
     * แสดง Modal
     */
    function showModal(title, content) {
        const modal = $('#oitform-modal');
        modal.find('#modal-title').text(title);
        modal.find('.oitform-modal-content').html(content);
        
        // แสดง Modal
        modal.attr('aria-hidden', 'false').addClass('oitform-modal-open');
        
        // โฟกัสที่อินพุตตัวแรก
        setTimeout(function() {
            modal.find('input:first').focus();
        }, 100);
    }
    
    /**
     * ปิด Modal
     */
    function closeModal() {
        const modal = $('#oitform-modal');
        modal.attr('aria-hidden', 'true').removeClass('oitform-modal-open');
        modal.find('.oitform-modal-content').empty();
    }
    
})(jQuery);