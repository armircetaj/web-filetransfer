// Web File Transfer - Upload Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeUploader();
});

function initializeUploader() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to select file
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File selection handler
    fileInput.addEventListener('change', handleFileSelection);
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors on document
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

function handleFiles(files) {
    if (files.length === 0) return;
    
    // For now, just show a placeholder message
    // In the full implementation, this would handle encryption and upload
    const file = files[0];
    
    // Update upload area to show selected file
    updateUploadArea(file);
    
    // Show placeholder message (will be replaced with actual upload logic)
    showSuccess(`Selected: ${file.name} (${formatFileSize(file.size)})`);
    
    // TODO: Implement actual file encryption and upload
    console.log('File selected for upload:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    });
}

function updateUploadArea(file) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadText = uploadArea.querySelector('.upload-text');
    
    if (uploadText) {
        uploadText.textContent = `Selected: ${file.name}`;
    }
    
    // Add visual feedback
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

// Placeholder function for actual upload process
async function uploadFile(file, options = {}) {
    // This is a placeholder for the actual upload implementation
    // In the real implementation, this would:
    // 1. Generate a random token
    // 2. Derive encryption key using HKDF
    // 3. Encrypt the file using libsodium
    // 4. Upload encrypted data to server
    // 5. Return download URL and token
    
    try {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Placeholder response
        const mockResponse = {
            download_url: `https://example.com/download?token=mock_token_${Date.now()}`,
            token_display: 'mock_token_' + Date.now()
        };
        
        return mockResponse;
    } catch (error) {
        throw new Error('Upload failed: ' + error.message);
    }
}

// Function to reset upload area
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
