/**
 * CKAN Data API JavaScript
 * สำหรับแสดง Endpoint API ในการเชื่อมต่อข้อมูล
 * และจัดการการทำงานของ API Modal
 */
jQuery(document).ready(function($) {
    // เก็บข้อมูลของไฟล์ปัจจุบัน
    let currentFileIndex = -1;
    let currentFileName = '';
    let currentFileUrl = '';
    let currentFileExt = '';
    
    // ตรวจสอบว่า modal มีอยู่แล้วหรือไม่
    const apiModalExists = $('#ckan-api-modal').length > 0;
    
    // เมื่อคลิกปุ่มดูตัวอย่าง เก็บ index ของไฟล์และข้อมูลอื่นๆ ไว้
    $(document).on('click', '.ckan-preview-btn', function() {
        currentFileIndex = $(this).data('index');
        const $assetItem = $(this).closest('.ckan-asset-item');
        currentFileName = $assetItem.find('.ckan-asset-name').text();
        currentFileUrl = atob($(this).data('url')); // Decode base64 URL
        currentFileExt = currentFileUrl.split('.').pop().toLowerCase();
    });
    
    // เพิ่มปุ่ม Data API ในส่วนหัวของ Modal Preview
    $(document).on('ckan_preview_loaded', function() {
        // ตรวจสอบว่ามีปุ่ม Data API อยู่แล้วหรือไม่
        if ($('.data-api-btn').length === 0) {
            $('.ckan-preview-modal-title').after('<button class="data-api-btn">DATA API</button>');
        }
    });
    
    // เมื่อคลิกปุ่ม Data API
    $(document).on('click', '.data-api-btn', function() {
        // เก็บค่า file index ปัจจุบัน
        $('#current-file-index').val(currentFileIndex);
        
        // แสดง Modal API
        $('#ckan-api-modal').addClass('show');
        
        // ดึงข้อมูล Post ID จาก container
        const postId = $('.ckan-assets-container').data('post-id');
        
        // สร้าง endpoint URLs
        const baseUrl = window.location.origin;
        const endpointGet = `${baseUrl}/wp-json/ckan/v1/data/${postId}`;
        const endpointSearch = `${baseUrl}/wp-json/ckan/v1/search?q=${postId}`;
        let endpointFile = '';
        
        // สร้าง resource_id สำหรับใช้ในตัวอย่าง API
        const resourceId = generateResourceId(postId);
        
        // ถ้ามี file index ให้สร้าง endpoint สำหรับไฟล์นั้น
        if (currentFileIndex >= 0) {
            endpointFile = `${baseUrl}/wp-json/ckan/v1/file/${postId}/${currentFileIndex}`;
            
            // อัพเดทชื่อไฟล์ในหน้า API
            $('.ckan-api-modal-title').text(`Data API: ${currentFileName}`);
        }
        
        // อัพเดทค่า URLs ใน Modal
        $('#ckan-api-get-endpoint').text(endpointGet);
        $('#ckan-api-search-endpoint').text(endpointSearch);
        $('#ckan-api-file-endpoint').text(endpointFile);
        $('#ckan-api-file-data-link').attr('href', endpointFile);
        
        // อัพเดท URL ของตัวอย่าง
        const limitExample = `${baseUrl}/wp-json/ckan/v1/search?limit=5&resource_id=${resourceId}`;
        const searchExample = `${baseUrl}/wp-json/ckan/v1/search?q=jones&resource_id=${resourceId}`;
        
        // อัพเดทลิงก์ตัวอย่าง
        $('.ckan-api-code a[href*="limit=5"]').attr('href', limitExample).text(limitExample);
        $('.ckan-api-code a[href*="q=jones"]').attr('href', searchExample).text(searchExample);
        
        // อัพเดทตัวอย่างโค้ดด้วย endpoint ปัจจุบัน
        updateCodeExamples(endpointFile, endpointGet);
        
        // ตรวจสอบประเภทไฟล์และแสดง/ซ่อนแท็บที่เกี่ยวข้อง
        updateFileDataTab(currentFileExt);
        
        // แสดงแท็บ "ข้อมูลทั่วไป" เป็นค่าเริ่มต้น
        $('.ckan-api-tab[data-tab="ckan-api-info"]').click();
    });
    
    // ปิด Modal API เมื่อคลิกปุ่มปิด
    $(document).on('click', '.ckan-api-modal-close', function() {
        $('#ckan-api-modal').removeClass('show');
    });
    
    // ปิด Modal API เมื่อคลิกนอกพื้นที่ Modal
    $(window).on('click', function(e) {
        if ($(e.target).is('#ckan-api-modal')) {
            $('#ckan-api-modal').removeClass('show');
        }
    });
    
    // เปลี่ยน Tab เมื่อคลิก
    $(document).on('click', '.ckan-api-tab', function() {
        const tabId = $(this).data('tab');
        
        // ซ่อนทุก Tab Content และแสดงเฉพาะ Tab ที่คลิก
        $('.ckan-api-tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
        
        // เปลี่ยน Class ของ Tab
        $('.ckan-api-tab').removeClass('active');
        $(this).addClass('active');
    });
    
    /**
     * อัพเดทการแสดงแท็บข้อมูลไฟล์ตามประเภทไฟล์
     * @param {string} fileExt - นามสกุลไฟล์
     */
    function updateFileDataTab(fileExt) {
        const $fileDataTab = $('.ckan-api-tab[data-tab="ckan-api-file-data"]');
        const $fileDataContent = $('#ckan-api-file-data');
        
        // ตรวจสอบประเภทไฟล์ที่รองรับ
        const supportedExtensions = ['csv', 'json', 'txt'];
        
        if (supportedExtensions.includes(fileExt)) {
            // แสดงแท็บ
            $fileDataTab.show();
            
            // อัพเดทเนื้อหาตามประเภทไฟล์
            let formatText = '';
            switch(fileExt) {
                case 'csv':
                    formatText = 'CSV จะถูกแปลงเป็น JSON โดยใช้แถวแรกเป็นชื่อ fields';
                    break;
                case 'json':
                    formatText = 'JSON จะถูกอ่านและส่งกลับตามโครงสร้างเดิม';
                    break;
                case 'txt':
                    formatText = 'TXT จะถูกแสดงเป็นข้อความธรรมดา';
                    break;
            }
            
            // อัพเดทคำอธิบาย
            $fileDataContent.find('p:first').html(`ข้อมูลจากไฟล์ <strong>${currentFileName}</strong> (${fileExt.toUpperCase()}): ${formatText}`);
            
            // อัพเดทตัวอย่างโครงสร้าง JSON
            const jsonExample = {
                success: true,
                result: {
                    resource_id: currentFileIndex,
                    file_name: currentFileName,
                    format: fileExt,
                    data: {}
                }
            };
            
            if (fileExt === 'csv') {
                jsonExample.result.data = {
                    title: currentFileName,
                    fields: [
                        {id: "field1", type: "text"},
                        {id: "field2", type: "text"}
                    ],
                    records: [
                        {field1: "value1", field2: "value2"},
                        {field1: "value3", field2: "value4"}
                    ]
                };
            } else if (fileExt === 'json') {
                jsonExample.result.data = {
                    "sample": "json_data",
                    "array": [1, 2, 3],
                    "nested": {
                        "key": "value"
                    }
                };
            } else {
                jsonExample.result.data = "Sample text content from file";
            }
            
            // แสดงตัวอย่าง JSON
            $('.ckan-api-json-example').text(JSON.stringify(jsonExample, null, 2));
            
        } else {
            // ซ่อนแท็บถ้าไม่รองรับประเภทไฟล์
            $fileDataTab.hide();
        }
    }
    
    /**
     * อัพเดทตัวอย่างโค้ดด้วย endpoint ปัจจุบัน
     * @param {string} fileEndpoint - URL endpoint สำหรับไฟล์
     * @param {string} dataEndpoint - URL endpoint สำหรับข้อมูล
     */
    function updateCodeExamples(fileEndpoint, dataEndpoint) {
        // สร้างตัวอย่างโค้ด JavaScript
        const jsExample = `// jQuery เริ่มต้น
$.ajax({
  url: '${dataEndpoint}',
  dataType: 'json',
  success: function(data) {
    alert('Total results: ' + data.result.total)
  }
});

// JavaScript (ES6) สำหรับข้อมูลไฟล์
fetch('${fileEndpoint}')
  .then(response => response.json())
  .then(data => {
    console.log('File data:', data.result.data)
    // การใช้งานข้อมูล
    if (data.result.data.records) {
      // สำหรับไฟล์ CSV
      const records = data.result.data.records;
      console.table(records);
    } else {
      // สำหรับไฟล์ JSON หรืออื่นๆ
      console.log(data.result.data);
    }
  });`;
        
        // สร้างตัวอย่างโค้ด Python
        const pythonExample = `import urllib.request
import json
import pprint

# ตัวอย่างการดึงข้อมูลไฟล์
url = '${fileEndpoint}'
fileobj = urllib.request.urlopen(url)
response_dict = json.loads(fileobj.read())

# เข้าถึงข้อมูลไฟล์
result = response_dict['result']
file_data = result['data']

# แสดงผลข้อมูล
print('File name:', result['file_name'])
if 'records' in file_data:
    # สำหรับไฟล์ CSV
    records = file_data['records']
    print('Total records:', len(records))
    pprint.pprint(records[0])  # แสดงข้อมูลแรก
else:
    # สำหรับไฟล์ JSON หรืออื่นๆ
    pprint.pprint(file_data)`;
        
        // อัพเดทตัวอย่างโค้ดใน DOM
        $('#ckan-api-examples .ckan-api-example:first-child pre').text(jsExample);
        $('#ckan-api-examples .ckan-api-example:last-child pre').text(pythonExample);
    }
    
    /**
     * สร้าง resource_id สำหรับใช้ในตัวอย่าง API
     * @param {string} postId - ID ของ post
     * @returns {string} resource ID
     */
    function generateResourceId(postId) {
        const hash = md5(postId);
        return `b8a8a6b5-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 24)}`;
    }
    
    /**
     * สร้าง MD5 hash
     * @param {string} string - ข้อความที่ต้องการทำ hash
     * @returns {string} - MD5 hash
     */
    function md5(string) {
        function RotateLeft(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }
        
        function AddUnsigned(lX, lY) {
            const lX8 = (lX & 0x80000000);
            const lY8 = (lY & 0x80000000);
            const lX4 = (lX & 0x40000000);
            const lY4 = (lY & 0x40000000);
            const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) {
                return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            }
            if (lX4 | lY4) {
                if (lResult & 0x40000000) {
                    return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                } else {
                    return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                }
            } else {
                return (lResult ^ lX8 ^ lY8);
            }
        }
        
        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }
        
        function FF(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
        
        function GG(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
        
        function HH(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
        
        function II(a, b, c, d, x, s, ac) {
            a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
            return AddUnsigned(RotateLeft(a, s), b);
        }
        
        function ConvertToWordArray(string) {
            let lWordCount;
            const lMessageLength = string.length;
            const lNumberOfWords_temp1 = lMessageLength + 8;
            const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
            const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
            const lWordArray = Array(lNumberOfWords - 1);
            let lBytePosition = 0;
            let lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        }
        
        function WordToHex(lValue) {
            let WordToHexValue = "";
            let WordToHexValue_temp = "";
            let lByte, lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
            }
            return WordToHexValue;
        }
        
        function Utf8Encode(string) {
            string = string.replace(/\r\n/g, "\n");
            let utftext = "";
            
            for (let n = 0; n < string.length; n++) {
                const c = string.charCodeAt(n);
                
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            
            return utftext;
        }
        
        const x = Array();
        let k, AA, BB, CC, DD, a, b, c, d;
        const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
        
        string = Utf8Encode(string);
        
        x = ConvertToWordArray(string);
        
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
        
        for (k = 0; k < x.length; k += 16) {
            AA = a; BB = b; CC = c; DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
            b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
            c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
            c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
            a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
            d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
            a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
            a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
            a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
            c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
            a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
            c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
            b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
            c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
            d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
            c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
            a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
            d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
            b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
            a = AddUnsigned(a, AA);
            b = AddUnsigned(b, BB);
            c = AddUnsigned(c, CC);
            d = AddUnsigned(d, DD);
        }
        
        const temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
        
        return temp.toLowerCase();
    }
});
