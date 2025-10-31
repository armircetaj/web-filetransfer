document.addEventListener('DOMContentLoaded', function() {
    initializeUploader();
});

function initializeUploader() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelection);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}
function handleDragOver(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.add('dragover');
}
function handleDragLeave(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.remove('dragover');
}
function handleDrop(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFileSelection(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

async function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    updateUploadArea(file);
    showMetadataForm(file);
}

function showMetadataForm(file) {
    const existingForm = document.querySelector('.metadata-form');
    if (existingForm) {
        existingForm.remove();
    }
    const formDiv = document.createElement('div');
    formDiv.className = 'metadata-form';
    formDiv.innerHTML = `
        <h3>Configure Upload Settings</h3>
        <div class="form-row">
            <div class="form-group">
                <label for="maxDownloads">Max Downloads</label>
                <select id="maxDownloads">
                    <option value="1">1 download</option>
                    <option value="3">3 downloads</option>
                    <option value="5">5 downloads</option>
                    <option value="10">10 downloads</option>
                    <option value="100">100 downloads</option>
                </select>
            </div>
            <div class="form-group">
                <label for="expiresAt">Expires In</label>
                <select id="expiresAt">
                    <option value="">Never</option>
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                </select>
            </div>
        </div>
        <div class="checkbox-group">
            <input type="checkbox" id="enableNotifications" onchange="toggleEmailField()">
            <label for="enableNotifications">Get notified when file is downloaded</label>
        </div>
        <div class="form-group" id="emailGroup" style="display: none;">
            <label for="senderEmail">Email Address</label>
            <input type="email" id="senderEmail" placeholder="your@email.com">
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="cancelUpload()">Cancel</button>
            <button class="btn btn-primary" onclick="confirmUpload()">Upload File</button>
        </div>
    `;
    const uploadArea = document.getElementById('uploadArea');
    const container = uploadArea.parentNode;
    container.insertBefore(formDiv, uploadArea.nextSibling);
    window.selectedFile = file;
}
function toggleEmailField() {
    const checkbox = document.getElementById('enableNotifications');
    const emailGroup = document.getElementById('emailGroup');
    const emailInput = document.getElementById('senderEmail');
    
    if (checkbox.checked) {
        emailGroup.style.display = 'block';
        emailInput.required = true;
    } else {
        emailGroup.style.display = 'none';
        emailInput.required = false;
        emailInput.value = '';
    }
}
function cancelUpload() {
    const form = document.querySelector('.metadata-form');
    if (form) {
        form.remove();
    }
    resetUploadArea();
    window.selectedFile = null;
}
async function confirmUpload() {
    if (!window.selectedFile) {
        showError('No file selected');
        return;
    }

    const maxDownloads = parseInt(document.getElementById('maxDownloads').value);
    const expiresAt = document.getElementById('expiresAt').value;
    const enableNotifications = document.getElementById('enableNotifications').checked;
    const senderEmail = document.getElementById('senderEmail').value;
    if (enableNotifications && !senderEmail) {
        showError('Please enter your email address for notifications');
        return;
    }
    
    if (enableNotifications && senderEmail && !isValidEmail(senderEmail)) {
        showError('Please enter a valid email address');
        return;
    }
    let expirationDate = null;
    if (expiresAt) {
        const now = new Date();
        switch (expiresAt) {
            case '1h':
                expirationDate = new Date(now.getTime() + 60 * 60 * 1000);
                break;
            case '24h':
                expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            case '7d':
                expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
        }
    }
    const options = {
        maxDownloads,
        expiresAt: expirationDate,
        senderEmail: enableNotifications ? senderEmail : null
    };
    try {
        const uploadBtn = document.querySelector('.btn-primary');
        if (uploadBtn) {
            const hideLoading = showLoading(uploadBtn, 'Encrypting & Uploading...');
            const result = await uploadFile(window.selectedFile, options);
            hideLoading();
            const form = document.querySelector('.metadata-form');
            if (form) {
                form.remove();
            }
            showUploadSuccess(result.download_url, result.token_display); 
        } else {
            const result = await uploadFile(window.selectedFile, options);
            showUploadSuccess(result.download_url, result.token_display);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError('Upload failed: ' + error.message);
        resetUploadArea();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function updateUploadArea(file) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadText = uploadArea.querySelector('.upload-text');
    
    if (uploadText) {
        uploadText.textContent = `Selected: ${file.name}`;
    }
    uploadArea.style.borderColor = 'rgba(34, 197, 94, 0.6)';
    uploadArea.style.background = 'rgba(34, 197, 94, 0.1)';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
async function uploadFile(file, options = {}) {
    try {
        if (!window.cryptoClient.isInitialized) {
            await window.cryptoClient.initialize();
        }
        const token = window.cryptoClient.generateToken();
        const salt = window.cryptoClient.generateSalt();
        const encryptionKey = window.cryptoClient.deriveKey(token, salt);
        const fileData = await file.arrayBuffer();
        const fileBytes = new Uint8Array(fileData);
        const encryptedData = window.cryptoClient.encryptFile(fileBytes, encryptionKey);
        const metadata = {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            lastModified: file.lastModified
        };
        const encryptedMetadata = window.cryptoClient.encryptMetadata(metadata, encryptionKey);
        const formData = new FormData();
        formData.append('encryptedData', window.cryptoClient.bytesToBase64(encryptedData));
        formData.append('encryptedMetadata', window.cryptoClient.bytesToBase64(encryptedMetadata));
        formData.append('salt', window.cryptoClient.bytesToBase64(salt));
        formData.append('token', token);
        formData.append('maxDownloads', options.maxDownloads || 1);
        if (options.expiresAt) {
            formData.append('expiresAt', options.expiresAt);
        }
        if (options.senderEmail) {
            formData.append('senderEmail', options.senderEmail);
        }
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        const result = await response.json();
        sessionStorage.setItem('lastUploadToken', token);
        
        return result;
        
    } catch (error) {
        throw new Error('Upload failed: ' + error.message);
    }
}
function showUploadSuccess(downloadUrl, tokenDisplay) {
    const form = document.querySelector('.metadata-form');
    if (form) {
        form.remove();
    }
    const successDiv = document.createElement('div');
    successDiv.className = 'notification-box success persistent';
    successDiv.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Upload Successful!</strong><br>
            Your file has been encrypted and uploaded securely.
        </div>
        <div style="background: rgba(34, 197, 94, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem; word-break: break-all; font-family: monospace; font-size: 0.9rem; border: 1px solid rgba(34, 197, 94, 0.3);">
            ${downloadUrl}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="copyToClipboard('${downloadUrl}')" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Copy Link</button>
            <button onclick="closeUploadSuccess()" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Close</button>
        </div>
    `;
    const uploadArea = document.getElementById('uploadArea');
    const container = uploadArea.parentNode;
    container.insertBefore(successDiv, uploadArea.nextSibling);
    window.currentUploadSuccess = successDiv;
}
function closeUploadSuccess() {
    if (window.currentUploadSuccess) {
        window.currentUploadSuccess.remove();
        window.currentUploadSuccess = null;
        resetUploadArea();
    }
}
function resetUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadText = uploadArea.querySelector('.upload-text');
    const fileInput = document.getElementById('fileInput');
    if (uploadText) {
        uploadText.textContent = 'Drag and drop your file here, or click to select';
    }
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
    if (fileInput) {
        fileInput.value = '';
    }
}
