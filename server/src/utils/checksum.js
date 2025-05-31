const crypto = require('crypto');

/**
 * Generates a checksum for HTML content
 * @param {string} html - The HTML content to generate checksum for
 * @returns {string} - The generated checksum
 */
function generateHtmlChecksum(html) {
    // Remove whitespace and normalize the HTML to ensure consistent checksums
    const normalizedHtml = html
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/>\s+</g, '><')  // Remove spaces between tags
        .trim();
    
    // Generate SHA-256 hash of the normalized HTML
    return crypto
        .createHash('sha256')
        .update(normalizedHtml)
        .digest('hex');
}

module.exports = {
    generateHtmlChecksum
}; 