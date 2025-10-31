document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        
        if (currentPage === 'index.html' && btn.textContent === 'Upload') {
            btn.classList.add('active');
        } else if (currentPage === 'download.html' && btn.textContent === 'Download') {
            btn.classList.add('active');
        }
    });
}

function showLoading(element, text = 'Processing...') {
    const originalText = element.textContent;
    element.textContent = text;
    element.disabled = true;
    element.style.opacity = '0.7';
    
    return function hideLoading() {
        element.textContent = originalText;
        element.disabled = false;
        element.style.opacity = '1';
    };
}

function showError(message, container = null) {
    clearNotifications(container);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification-box error';
    errorDiv.textContent = message;
    
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 7500);
    }
}

function showSuccess(message, container = null) {
    clearNotifications(container);
    const successDiv = document.createElement('div');
    successDiv.className = 'notification-box success';
    successDiv.textContent = message;
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 7500);
    }
}

function showInfo(message, container = null) {
    clearNotifications(container);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'notification-box info';
    infoDiv.textContent = message;
    
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(infoDiv);
        
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.remove();
            }
        }, 7500);
    }
}

function findNotificationContainer() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        return uploadArea.parentNode;
    }
    
    const downloadForm = document.querySelector('.download-form');
    if (downloadForm) {
        return downloadForm.parentNode;
    }
    
    return document.querySelector('.main-content');
}

function clearNotifications(container = null) {
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        const existingNotifications = targetContainer.querySelectorAll('.notification-box');
        existingNotifications.forEach(notification => notification.remove());
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Copied to clipboard!');
        return true;
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess('Copied to clipboard!');
            return true;
        } catch (err) {
            showError('Failed to copy to clipboard');
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function extractTokenFromUrl(url) {
    try {
        const urlObj = new URL(url);
        // Prefer query param first
        const qpToken = urlObj.searchParams.get('token');
        if (qpToken) return qpToken;
        // Fallback: last path segment if it looks like a token (e.g., /download/<token>)
        const segments = urlObj.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1] || '';
        const tokenRegex = /^[a-zA-Z0-9_-]{20,}$/;
        return tokenRegex.test(last) ? last : null;
    } catch (err) {
        return null;
    }
}
