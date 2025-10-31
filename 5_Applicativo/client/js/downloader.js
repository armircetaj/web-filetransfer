document.addEventListener('DOMContentLoaded', function() {
    initializeDownloader();
});

function initializeDownloader() {
    const decryptBtn = document.getElementById('decryptBtn');
    const downloadLink = document.getElementById('downloadLink');
    
    if (!decryptBtn || !downloadLink) return;
    decryptBtn.addEventListener('click', handleDecrypt);
    downloadLink.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDecrypt();
        }
    });
    downloadLink.focus();
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
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL');
        downloadLink.focus();
        return;
    }
    const token = extractTokenFromUrl(url);
    if (!token) {
        showError('Invalid download link format. Please check your link.');
        downloadLink.focus();
        return;
    }
    
    const hideLoading = showLoading(decryptBtn, 'Decrypting...');
    downloadAndDecryptFile(url, token)
        .then(() => {
            hideLoading();
            showPersistentDownloadSuccess('File downloaded and decrypted successfully!');
        })
        .catch((error) => {
            hideLoading();
            showError('Download failed: ' + error.message);
        });
}

async function downloadAndDecryptFile(url, token) {
    try {
        if (!window.cryptoClient.isInitialized) {
            await window.cryptoClient.initialize();
        }

        const statusResponse = await fetch(`/status/${token}`);
        if (!statusResponse.ok) {
            const errorData = await statusResponse.json();
            throw new Error(errorData.error || 'Failed to get file status');
        }

        const status = await statusResponse.json();
        if (status.downloads_remaining <= 0) {
            throw new Error('File download limit reached');
        }

        if (status.expires_at && new Date(status.expires_at) < new Date()) {
            throw new Error('File has expired');
        }

        const downloadResponse = await fetch(url);
        if (!downloadResponse.ok) {
            const errorData = await downloadResponse.json();
            throw new Error(errorData.error || 'Failed to download file');
        }

        const saltBase64 = downloadResponse.headers.get('X-File-Salt');
        if (!saltBase64) {
            throw new Error('Salt not found in response headers');
        }

        // Server sends standard Base64; decode with ORIGINAL variant
        const salt = window.cryptoClient.sodium.from_base64(
            saltBase64,
            window.cryptoClient.sodium.base64_variants.ORIGINAL
        );
        const encryptedFileData = await downloadResponse.arrayBuffer();
        const encryptedFileBytes = new Uint8Array(encryptedFileData);
        const decryptionKey = window.cryptoClient.deriveKey(token, salt);
        const decryptedFileData = window.cryptoClient.decryptFile(encryptedFileBytes, decryptionKey);
        const blob = new Blob([decryptedFileData]);
        const downloadUrl = URL.createObjectURL(blob);
        const filename = extractFilenameFromUrl(url) || 'downloaded_file';
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';    
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        console.log('Download completed for token:', token);
        
    } catch (error) {
        throw new Error('Download failed: ' + error.message);
    }
}

function showPersistentDownloadSuccess(message) {
    clearNotifications();
    const successDiv = document.createElement('div');
    successDiv.className = 'notification-box success persistent';
    successDiv.textContent = message;
    const container = findNotificationContainer();
    if (container) {
        container.appendChild(successDiv);
    }
}
function extractFilenameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        return filename && filename !== 'download' ? filename : null;
    } catch (error) {
        return null;
    }
}

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
    URL.revokeObjectURL(url);
}

function validateToken(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const tokenRegex = /^[a-zA-Z0-9_-]{20,}$/;
    return tokenRegex.test(token);
}

async function getFileStatus(token) {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            valid: true,
            downloads_remaining: 3,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            file_size: 1024 * 1024,
            filename: 'encrypted_file.bin'
        };
    } catch (error) {
        throw new Error('Failed to get file status: ' + error.message);
    }
}

function clearDownloadLink() {
    const downloadLink = document.getElementById('downloadLink');
    if (downloadLink) {
        downloadLink.value = '';
        downloadLink.focus();
    }
}
