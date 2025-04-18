// Fix Elementor Media Selector - Simple approach
(function($) {
    'use strict';
    
    $(window).on('elementor:init', function() {
        console.log('Elementor Media Fix: Script loaded');
        
        // ให้รอเวลาเพื่อให้ Elementor โหลดเสร็จ
        setTimeout(function() {
            fixElementorMediaUpload();
        }, 2000);
    });
    
    function fixElementorMediaUpload() {
        try {
            if (!window.elementor || !window.elementor.modules || !window.elementor.modules.controls) {
                return;
            }
            
            // สำรองฟังก์ชันเดิม
            const MediaControl = window.elementor.modules.controls.Media;
            const originalInitFrame = MediaControl.prototype.initFrame;
            
            // สร้างฟังก์ชันใหม่
            MediaControl.prototype.initFrame = function() {
                try {
                    // เช็คว่ามี frame แล้วหรือไม่
                    if (!this.frame) {
                        // สร้าง frame ใหม่
                        this.frame = wp.media({
                            states: [
                                new wp.media.controller.Library({
                                    title: 'Select Image',
                                    library: wp.media.query({ type: 'image' }),
                                    multiple: false
                                })
                            ]
                        });
                        
                        // เชื่อมต่อ event
                        const self = this;
                        this.frame.on('select', function() {
                            const selection = self.frame.state().get('selection');
                            if (selection && selection.first()) {
                                const attachment = selection.first().toJSON();
                                // กำหนดค่าให้กับ field
                                self.setValue({
                                    id: attachment.id,
                                    url: attachment.url
                                });
                                self.applySavedValue();
                            }
                        });
                    }
                    
                    return this.frame;
                } catch (error) {
                    console.error('Elementor Media Fix: Error in initFrame', error);
                    // ถ้ามีข้อผิดพลาดให้สร้าง frame ใหม่
                    this.frame = wp.media({
                        multiple: false,
                        library: { type: 'image' }
                    });
                    return this.frame;
                }
            };
            
            console.log('Elementor Media Fix: Successfully patched media selector');
        } catch (error) {
            console.error('Elementor Media Fix: Error applying fix', error);
        }
    }
})(jQuery);