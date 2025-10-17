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
function showError(message, element = null) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(220, 38, 38, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 5000);
}

// Utility function to show success messages
function showSuccess(message, element = null) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 5000);
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
