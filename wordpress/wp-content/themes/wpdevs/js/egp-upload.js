jQuery(document).ready(function($) {
    console.log('EGP Upload initialized'); // Debug log
    
    // DOM Elements
    const dropZone = document.getElementById('egpDropZone');
    const fileInput = document.getElementById('egpFileInput');
    const fileList = document.getElementById('egpFileList');
    const uploadButton = document.getElementById('egpUploadSubmit');
    
    // State
    let files = [];
    
    if (!dropZone || !fileInput || !fileList || !uploadButton) {
        console.error('Required elements not found');
        return;
    }
    
    // Event Listeners
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);
    
    document.querySelector('.egp-upload-button').addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadButton.addEventListener('click', handleUpload);
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDragEnter(e) {
        preventDefaults(e);
        dropZone.classList.add('dragover');
    }
    
    function handleDragOver(e) {
        preventDefaults(e);
        dropZone.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        preventDefaults(e);
        dropZone.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        preventDefaults(e);
        dropZone.classList.remove('dragover');
        
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        
        handleFiles(droppedFiles);
    }
    
    function handleFileSelect(e) {
        const selectedFiles = e.target.files;
        handleFiles(selectedFiles);
    }
    
    function handleFiles(newFiles) {
        const fileArray = Array.from(newFiles);
        console.log('Files selected:', fileArray.length); // Debug log
        
        fileArray.forEach(file => {
            if (file.size > window.egpAjax.maxSize) {
                alert(window.egpAjax.messages.maxSize);
                return;
            }
            
            files.push(file);
            addFileToList(file, files.length - 1);
        });
        
        updateUploadButtonState();
    }
    
    function addFileToList(file, index) {
        const li = document.createElement('li');
        li.className = 'egp-file-item';
        li.dataset.index = index;
        
        li.innerHTML = `
            <span class="file-icon ${getFileIconClass(file.name)}"></span>
            <span class="file-name" title="${file.name}">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" data-index="${index}">×</button>
        `;
        
        li.querySelector('.remove-file').addEventListener('click', function() {
            removeFile(parseInt(this.dataset.index));
        });
        
        fileList.appendChild(li);
    }
    
    function removeFile(index) {
        files = files.filter((_, i) => i !== index);
        
        // Remove from UI
        const item = fileList.querySelector(`li[data-index="${index}"]`);
        if (item) {
            item.remove();
        }
        
        // Update remaining indexes
        Array.from(fileList.children).forEach((li, i) => {
            li.dataset.index = i;
            li.querySelector('.remove-file').dataset.index = i;
        });
        
        updateUploadButtonState();
    }
    
    function updateUploadButtonState() {
        uploadButton.disabled = files.length === 0;
    }
    
    function handleUpload() {
        if (files.length === 0) return;
        
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        
        formData.append('action', 'egp_upload_files');
        formData.append('nonce', window.egpAjax.nonce);
        formData.append('post_id', window.egpAjax.post_id);
        
        uploadButton.disabled = true;
        uploadButton.textContent = 'กำลังอัพโหลด...';
        
        fetch(window.egpAjax.ajaxurl, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                showMessage(response.data.message, 'success');
                files = [];
                fileList.innerHTML = '';
                updateUploadButtonState();
            } else {
                throw new Error(response.data.message);
            }
        })
        .catch(error => {
            showMessage(error.message || window.egpAjax.messages.uploadError, 'error');
        })
        .finally(() => {
            uploadButton.disabled = false;
            uploadButton.textContent = 'อัพโหลดไฟล์';
        });
    }
    
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `egp-message ${type}`;
        messageDiv.textContent = message;
        
        dropZone.parentNode.insertBefore(messageDiv, dropZone);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    function getFileIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'pdf-icon',
            'doc': 'doc-icon',
            'docx': 'doc-icon',
            'xls': 'excel-icon',
            'xlsx': 'excel-icon',
            'jpg': 'image-icon',
            'jpeg': 'image-icon',
            'png': 'image-icon'
        };
        return iconMap[ext] || 'file-icon';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});