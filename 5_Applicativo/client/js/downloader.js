// Web File Transfer - Download Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeDownloader();
});

function initializeDownloader() {
    const decryptBtn = document.getElementById('decryptBtn');
    const downloadLink = document.getElementById('downloadLink');
    
    if (!decryptBtn || !downloadLink) return;
    
    // Handle decrypt button click
    decryptBtn.addEventListener('click', handleDecrypt);
    
    // Handle Enter key in input field
    downloadLink.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDecrypt();
        }
    });
    
    // Auto-focus the input field
    downloadLink.focus();
    
    // Check if there's a token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        downloadLink.value = `${window.location.origin}/download?token=${token}`;
    }
}

function handleDecrypt() {
    const downloadLink = document.getElementById('downloadLink');
    const decryptBtn = document.getElementById('decryptBtn');
    
    if (!downloadLink || !decryptBtn) return;
    
    const url = downloadLink.value.trim();
    
    if (!url) {
        showError('Please enter a download link');
        downloadLink.focus();
        return;
    }
    
    // Validate URL format
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL');
        downloadLink.focus();
        return;
    }
    
    // Extract token from URL
    const token = extractTokenFromUrl(url);
    if (!token) {
        showError('Invalid download link format. Please check your link.');
        downloadLink.focus();
        return;
    }
    
    // Show loading state
    const hideLoading = showLoading(decryptBtn, 'Decrypting...');
    
    // Start download process
    downloadAndDecryptFile(url, token)
        .then(() => {
            hideLoading();
            showSuccess('File downloaded successfully!');
        })
        .catch((error) => {
            hideLoading();
            showError('Download failed: ' + error.message);
        });
}

// Placeholder function for actual download and decrypt process
async function downloadAndDecryptFile(url, token) {
    // This is a placeholder for the actual download implementation
    // In the real implementation, this would:
    // 1. Validate the token with the server
    // 2. Download the encrypted file
    // 3. Derive decryption key using the token
    // 4. Decrypt the file using libsodium
    // 5. Trigger browser download with original filename
    
    try {
        // Simulate download delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Placeholder: Create a dummy file for demonstration
        const dummyContent = 'This is a placeholder file. In the real implementation, this would be the decrypted file content.';
        const dummyFilename = 'downloaded_file.txt';
        
        // Trigger download
        downloadBlob(dummyContent, dummyFilename, 'text/plain');
        
        console.log('Download completed for token:', token);
        
    } catch (error) {
        throw new Error('Download failed: ' + error.message);
    }
}

// Utility function to trigger file download
function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// Function to validate token format (basic validation)
function validateToken(token) {
    // Basic validation: token should be alphanumeric and reasonable length
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    // Check if token looks reasonable (alphanumeric, 20+ characters)
    const tokenRegex = /^[a-zA-Z0-9_-]{20,}$/;
    return tokenRegex.test(token);
}

// Function to get file status (placeholder)
async function getFileStatus(token) {
    // This would make an API call to check file status
    // For now, return a mock response
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            valid: true,
            downloads_remaining: 3,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            file_size: 1024 * 1024, // 1MB placeholder
            filename: 'encrypted_file.bin'
        };
    } catch (error) {
        throw new Error('Failed to get file status: ' + error.message);
    }
}

// Function to clear the download link input
function clearDownloadLink() {
    const downloadLink = document.getElementById('downloadLink');
    if (downloadLink) {
        downloadLink.value = '';
        downloadLink.focus();
    }
}
