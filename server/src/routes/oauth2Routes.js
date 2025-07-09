const express = require('express');
const router = express.Router();
const GoogleSheetsOAuth2Service = require('../services/googleSheetsOAuth2Service');

/**
 * GET /api/oauth2/auth
 * Start OAuth2 authentication flow
 */
router.get('/auth', (req, res) => {
    try {
        const authUrl = GoogleSheetsOAuth2Service.getAuthUrl();
        res.json({ 
            authUrl,
            message: 'Please visit this URL to authenticate with Google'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to generate auth URL',
            message: error.message 
        });
    }
});

/**
 * GET /api/oauth2/callback
 * Handle OAuth2 callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ 
                error: 'Authorization code is required' 
            });
        }

        // Exchange code for tokens
        await GoogleSheetsOAuth2Service.getTokensFromCode(code);
        
        // Check if authentication was successful
        if (GoogleSheetsOAuth2Service.isAuthenticated()) {
            res.json({ 
                success: true,
                message: 'OAuth2 authentication successful! You can now use Google Sheets export functionality.'
            });
        } else {
            res.status(500).json({ 
                error: 'Authentication failed',
                message: 'Could not verify authentication status'
            });
        }
        
    } catch (error) {
        console.error('OAuth2 callback error:', error);
        res.status(500).json({ 
            error: 'Authentication failed',
            message: error.message 
        });
    }
});

/**
 * GET /api/oauth2/status
 * Check OAuth2 authentication status
 */
router.get('/status', (req, res) => {
    const isAuthenticated = GoogleSheetsOAuth2Service.isAuthenticated();
    res.json({ 
        authenticated: isAuthenticated,
        message: isAuthenticated ? 
            'OAuth2 authentication is active' : 
            'OAuth2 authentication required'
    });
});

module.exports = router; 