// Web File Transfer - Main JavaScript
// Common functionality shared across pages

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page-specific functionality
    initializePage();
});

function initializePage() {
    // Set active navigation based on current page
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

// Utility function to show loading state
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

// Utility function to show error messages
function showError(message, container = null) {
    // Remove existing notifications
    clearNotifications(container);
    
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification-box error';
    errorDiv.textContent = message;
    
    // Insert after the specified container or find the appropriate container
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(errorDiv);
        
        // Auto remove after fade-out animation completes (7.5 seconds total)
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 7500);
    }
}

// Utility function to show success messages
function showSuccess(message, container = null) {
    // Remove existing notifications
    clearNotifications(container);
    
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'notification-box success';
    successDiv.textContent = message;
    
    // Insert after the specified container or find the appropriate container
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(successDiv);
        
        // Auto remove after fade-out animation completes (7.5 seconds total)
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 7500);
    }
}

// Utility function to show info messages
function showInfo(message, container = null) {
    // Remove existing notifications
    clearNotifications(container);
    
    // Create info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'notification-box info';
    infoDiv.textContent = message;
    
    // Insert after the specified container or find the appropriate container
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        targetContainer.appendChild(infoDiv);
        
        // Auto remove after fade-out animation completes (7.5 seconds total)
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.remove();
            }
        }, 7500);
    }
}

// Helper function to find the appropriate container for notifications
function findNotificationContainer() {
    // Try to find upload area first
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        return uploadArea.parentNode;
    }
    
    // Try to find download form
    const downloadForm = document.querySelector('.download-form');
    if (downloadForm) {
        return downloadForm.parentNode;
    }
    
    // Fallback to main content
    return document.querySelector('.main-content');
}

// Helper function to clear existing notifications
function clearNotifications(container = null) {
    const targetContainer = container || findNotificationContainer();
    if (targetContainer) {
        const existingNotifications = targetContainer.querySelectorAll('.notification-box');
        existingNotifications.forEach(notification => notification.remove());
    }
}

// Add CSS animations for notifications
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

// Copy to clipboard utility
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Copied to clipboard!');
        return true;
    } catch (err) {
        // Fallback for older browsers
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

// Validate URL format
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Extract token from download URL
function extractTokenFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        return token;
    } catch (err) {
        return null;
    }
}
