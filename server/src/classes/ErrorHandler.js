const cheerio = require('cheerio');

class ErrorHandler {
    constructor() {
        this.errorCategories = {
            NETWORK: 'network',
            HTTP: 'http',
            JAVASCRIPT: 'javascript',
            ANTI_BOT: 'anti_bot',
            CONTENT: 'content',
            TIMEOUT: 'timeout',
            UNKNOWN: 'unknown'
        };

        this.severityLevels = {
            CRITICAL: 'critical',    // Must stop crawl
            WARNING: 'warning',      // May affect crawl but continue
            INFO: 'info'             // Informational only
        };
    }

    // Main error analysis method
    analyzeError(err, context = {}) {
        const {
            responseStatus,
            responseHeaders,
            pageErrors = [],
            networkErrors = [],
            url,
            htmlContent,
            retryWithProxy,
            contentAnalysis
        } = context;

        const analysis = {
            originalError: err.message,
            category: this.errorCategories.UNKNOWN,
            severity: this.severityLevels.CRITICAL,
            message: err.message,
            details: {},
            isBlocking: true,
            recoverySuggestions: [],
            retryWithProxy: retryWithProxy || false,
        };

        // If we have contentAnalysis from analyzePageContent, use its retryWithProxy value
        if (contentAnalysis && contentAnalysis.retryWithProxy !== undefined) {
            analysis.retryWithProxy = contentAnalysis.retryWithProxy;
            analysis.category = contentAnalysis.category || this.errorCategories.CONTENT;
            analysis.severity = contentAnalysis.severity || this.severityLevels.CRITICAL;
        }

        // Categorize the error
        this.categorizeError(analysis, err, context);
        
        // Determine severity and blocking status
        this.assessSeverity(analysis, context);
        
        // Generate recovery suggestions
        this.generateRecoverySuggestions(analysis, context);

        return analysis;
    }

    // Categorize errors into different types
    categorizeError(analysis, err, context) {
        const { responseStatus, pageErrors, networkErrors } = context;

        // Network errors
        if (err.message.includes('net::') || err.message.includes('ERR_')) {
            analysis.category = this.errorCategories.NETWORK;
            analysis.message = 'Network connection error';
            // Network errors might be resolved with proxy
            analysis.retryWithProxy = true;
            return;
        }

        // Timeout errors
        if (err.message.includes('Timeout') || err.message.includes('timeout')) {
            analysis.category = this.errorCategories.TIMEOUT;
            analysis.message = 'Page load timeout';
            // Timeout errors might be resolved with proxy
            analysis.retryWithProxy = true;
            return;
        }

        // HTTP errors
        if (responseStatus && responseStatus >= 400) {
            analysis.category = this.errorCategories.HTTP;
            analysis.message = this.analyzeHttpError(responseStatus, context.responseHeaders);
            
            // Set retryWithProxy for specific HTTP errors that could be resolved with proxy
            if (responseStatus === 403 || responseStatus === 429 || responseStatus === 503) {
                analysis.retryWithProxy = true;
            }
            return;
        }

        // JavaScript errors
        if (pageErrors.length > 0) {
            analysis.category = this.errorCategories.JAVASCRIPT;
            analysis.message = 'JavaScript errors detected';
            return;
        }

        // Content errors
        if (err.message.includes('Page content error')) {
            analysis.category = this.errorCategories.CONTENT;
            analysis.message = err.message;
            return;
        }

        // Anti-bot errors
        if (this.detectAntiBotIndicators(err, context)) {
            analysis.category = this.errorCategories.ANTI_BOT;
            analysis.message = 'Anti-bot protection detected';
            // Anti-bot errors should definitely retry with proxy
            analysis.retryWithProxy = true;
            return;
        }
    }

    // Assess severity and determine if error is blocking
    assessSeverity(analysis, context) {
        const { responseStatus, pageErrors, networkErrors, htmlContent } = context;

        // If we have a successful HTTP response, be more lenient
        if (responseStatus && responseStatus >= 200 && responseStatus < 300) {
            analysis.severity = this.severityLevels.WARNING;
            analysis.isBlocking = false;

            // Check for specific non-blocking conditions
            if (this.hasOnlyNonBlockingErrors(pageErrors, networkErrors)) {
                analysis.severity = this.severityLevels.INFO;
                analysis.isBlocking = false;
            }
        }

        // Specific severity assessments by category
        switch (analysis.category) {
            case this.errorCategories.JAVASCRIPT:
                if (this.hasOnlyNonBlockingJsErrors(pageErrors)) {
                    analysis.severity = this.severityLevels.INFO;
                    analysis.isBlocking = false;
                }
                break;

            case this.errorCategories.NETWORK:
                if (this.hasOnlyAnalyticsFailures(networkErrors)) {
                    analysis.severity = this.severityLevels.INFO;
                    analysis.isBlocking = false;
                } else if (analysis.retryWithProxy) {
                    // Network errors that can be retried with proxy are less severe
                    analysis.severity = this.severityLevels.WARNING;
                    analysis.isBlocking = true; // Still blocking but retryable
                }
                break;

            case this.errorCategories.TIMEOUT:
                analysis.severity = this.severityLevels.CRITICAL;
                analysis.isBlocking = true;
                // Timeout errors might be resolved with proxy
                if (analysis.retryWithProxy) {
                    analysis.severity = this.severityLevels.WARNING;
                }
                break;

            case this.errorCategories.ANTI_BOT:
                analysis.severity = this.severityLevels.CRITICAL;
                analysis.isBlocking = true;
                // Anti-bot errors should definitely retry with proxy
                analysis.retryWithProxy = true;
                break;

            case this.errorCategories.HTTP:
                if (responseStatus >= 500) {
                    analysis.severity = this.severityLevels.CRITICAL;
                } else if (responseStatus >= 400) {
                    analysis.severity = this.severityLevels.WARNING;
                }
                analysis.isBlocking = true;
                
                // HTTP errors that can be retried with proxy are less severe
                if (analysis.retryWithProxy) {
                    analysis.severity = this.severityLevels.WARNING;
                }
                break;
        }
    }

    // Check if errors are only non-blocking JavaScript errors
    hasOnlyNonBlockingJsErrors(pageErrors) {
        if (pageErrors.length === 0) return false;

        const nonBlockingPatterns = [
            'outerHTML',
            'Cannot read properties',
            'undefined',
            'null',
            'TypeError',
            'ReferenceError'
        ];

        return pageErrors.every(error => 
            nonBlockingPatterns.some(pattern => error.includes(pattern))
        );
    }

    // Check if network errors are only analytics failures
    hasOnlyAnalyticsFailures(networkErrors) {
        if (networkErrors.length === 0) return false;

        const analyticsDomains = [
            'googletagmanager.com',
            'google-analytics.com',
            'analytics.sharplaunch.com',
            'matomo.js',
            'facebook.com',
            'twitter.com',
            'doubleclick.net',
            'pagead2.googlesyndication.com'
        ];

        return networkErrors.every(error => 
            analyticsDomains.some(domain => error.url.includes(domain))
        );
    }

    // Check if all errors are non-blocking
    hasOnlyNonBlockingErrors(pageErrors, networkErrors) {
        return this.hasOnlyNonBlockingJsErrors(pageErrors) && 
               this.hasOnlyAnalyticsFailures(networkErrors);
    }

    // Detect anti-bot indicators
    detectAntiBotIndicators(err, context) {
        const antiBotKeywords = ['captcha', 'blocked', 'forbidden', 'rate limit', 'suspicious'];
        const message = err.message.toLowerCase();
        
        return antiBotKeywords.some(keyword => message.includes(keyword));
    }

    // Analyze HTTP errors
    analyzeHttpError(status, headers) {
        const errorMessages = {
            400: 'Bad Request - The server cannot process the request',
            401: 'Unauthorized - Authentication required',
            403: 'Forbidden - Access denied (possible anti-bot protection)',
            404: 'Not Found - The requested page does not exist',
            429: 'Too Many Requests - Rate limiting (anti-bot protection)',
            500: 'Internal Server Error - Server encountered an error',
            502: 'Bad Gateway - Invalid response from upstream server',
            503: 'Service Unavailable - Server temporarily unavailable',
            504: 'Gateway Timeout - Upstream server timeout'
        };

        return errorMessages[status] || `HTTP ${status} Error`;
    }

    // Generate recovery suggestions
    generateRecoverySuggestions(analysis, context) {
        const suggestions = [];

        switch (analysis.category) {
            case this.errorCategories.TIMEOUT:
                suggestions.push('Increase timeout duration');
                suggestions.push('Check server response time');
                if (analysis.retryWithProxy) {
                    suggestions.push('Try using a residential proxy');
                    suggestions.push('Rotate proxy servers');
                } else {
                    suggestions.push('Consider using a proxy');
                }
                break;

            case this.errorCategories.NETWORK:
                suggestions.push('Check internet connection');
                suggestions.push('Verify URL accessibility');
                if (analysis.retryWithProxy) {
                    suggestions.push('Try using a different proxy server');
                    suggestions.push('Rotate proxy locations');
                } else {
                    suggestions.push('Try using a different network');
                }
                break;

            case this.errorCategories.ANTI_BOT:
                suggestions.push('Add delays between requests');
                suggestions.push('Rotate user agents');
                if (analysis.retryWithProxy) {
                    suggestions.push('Use residential proxies');
                    suggestions.push('Rotate proxy servers');
                    suggestions.push('Try different proxy locations');
                } else {
                    suggestions.push('Use residential proxies');
                }
                suggestions.push('Implement session management');
                break;

            case this.errorCategories.HTTP:
                if (context.responseStatus === 429) {
                    suggestions.push('Implement exponential backoff');
                    suggestions.push('Reduce request frequency');
                    suggestions.push('Use rate limiting');
                    if (analysis.retryWithProxy) {
                        suggestions.push('Rotate proxy servers to avoid rate limits');
                    }
                } else if (context.responseStatus === 403) {
                    suggestions.push('Check if IP is blocked');
                    suggestions.push('Update user agent');
                    suggestions.push('Add more realistic headers');
                    if (analysis.retryWithProxy) {
                        suggestions.push('Use a different proxy server');
                        suggestions.push('Try residential proxy');
                    }
                } else if (analysis.retryWithProxy) {
                    suggestions.push('Try using a different proxy server');
                    suggestions.push('Rotate proxy locations');
                }
                break;

            case this.errorCategories.JAVASCRIPT:
                if (!analysis.isBlocking) {
                    suggestions.push('JavaScript errors are non-blocking - continue crawl');
                } else {
                    suggestions.push('Wait for page to fully load');
                    suggestions.push('Check for JavaScript errors in console');
                }
                break;
        }

        // Add general proxy suggestions if retryWithProxy is true
        if (analysis.retryWithProxy) {
            suggestions.push('Retry with proxy enabled');
        }

        analysis.recoverySuggestions = suggestions;
    }

    // Log error with appropriate level
    logError(analysis, attempt = 1, maxAttempts = 3) {
        const prefix = `[Attempt ${attempt}/${maxAttempts}]`;
        
        switch (analysis.severity) {
            case this.severityLevels.CRITICAL:
                console.error(`${prefix} CRITICAL: ${analysis.message}`);
                console.error('Error details:', analysis.details);
                break;

            case this.severityLevels.WARNING:
                console.warn(`${prefix} WARNING: ${analysis.message}`);
                if (analysis.details.pageErrors?.length > 0) {
                    console.warn('Page errors:', analysis.details.pageErrors);
                }
                break;

            case this.severityLevels.INFO:
                console.log(`${prefix} INFO: ${analysis.message}`);
                if (analysis.details.nonBlockingErrors?.length > 0) {
                    console.log('Non-blocking errors detected, continuing...');
                }
                break;
        }

        if (analysis.recoverySuggestions.length > 0) {
            console.log('Recovery suggestions:', analysis.recoverySuggestions);
        }
    }

    // Check if page content indicates an error
    analyzePageContent(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const title = $('title').text().toLowerCase();
        const bodyText = $('body').text().toLowerCase();

        // Check for actual error pages (not JavaScript errors)
        const errorIndicators = [
            'page not found',
            '404',
            'not found',
            'oops',
            'something went wrong',
            'maintenance',
            'under construction',
            'temporarily unavailable',
            'service unavailable',
            'server error',
            'internal server error',
            'bad gateway',
            'gateway timeout'
        ];

        // Proxy-resolvable error indicators
        const proxyResolvableIndicators = [
            'access denied',
            'blocked',
            'forbidden',
            'rate limit',
            'too many requests',
            'suspicious activity',
            'bot detected',
            'automated access',
            'please verify',
            'security check',
            'human verification',
            'challenge',
            'cloudflare',
            'captcha',
            'one moment, please...',
            'checking your browser',
            'ddos protection'
        ];

        // Only check title for error indicators
        for (const indicator of errorIndicators) {
            if (title.includes(indicator)) {
                const isProxyResolvable = proxyResolvableIndicators.some(proxyIndicator => 
                    title.includes(proxyIndicator) || bodyText.includes(proxyIndicator)
                );
                
                return { 
                    error: `Error page detected: "${indicator}"`,
                    category: this.errorCategories.CONTENT,
                    severity: this.severityLevels.CRITICAL,
                    retryWithProxy: isProxyResolvable
                };
            }
        }

        // Check for proxy-resolvable indicators in title and body text
        for (const indicator of proxyResolvableIndicators) {
            if (title.includes(indicator)) {
                return { 
                    error: `Anti-bot/proxy-resolvable content detected: "${indicator}"`,
                    category: this.errorCategories.ANTI_BOT,
                    severity: this.severityLevels.CRITICAL,
                    retryWithProxy: true
                };
            }
        }

        // Check for empty or minimal content
        const textLength = bodyText.trim().length;
        if (textLength < 50) {
            return { 
                error: `Page content too short (${textLength} characters)`,
                category: this.errorCategories.CONTENT,
                severity: this.severityLevels.WARNING,
                retryWithProxy: false
            };
        }

        // Check if page has meaningful content
        const meaningfulContent = bodyText.replace(/error|undefined|null|cannot read properties/gi, '').trim();
        if (meaningfulContent.length < 30) {
            return { 
                error: `Page lacks meaningful content`,
                category: this.errorCategories.CONTENT,
                severity: this.severityLevels.WARNING,
                retryWithProxy: false
            };
        }

        return { error: null };
    }

    // Get error statistics for reporting
    getErrorStats(errors) {
        const stats = {
            total: errors.length,
            byCategory: {},
            bySeverity: {},
            blocking: 0,
            nonBlocking: 0
        };

        errors.forEach(error => {
            // Count by category
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            
            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            // Count blocking vs non-blocking
            if (error.isBlocking) {
                stats.blocking++;
            } else {
                stats.nonBlocking++;
            }
        });

        return stats;
    }

    // Detect anti-bot mechanisms on a page
    async detectAntiBotMechanisms(page, advancedSelectors = []) {
        try {
            // Check for common captcha indicators
            const captchaSelectors = [
                'iframe[src*="captcha"]',
                'iframe[src*="recaptcha"]',
                'iframe[src*="hcaptcha"]',
                '.captcha',
                '.recaptcha',
                '.hcaptcha',
                '#captcha',
                '#recaptcha',
                '#hcaptcha',
                '[class*="captcha"]',
                '[id*="captcha"]'
            ];

            for (const selector of captchaSelectors) {
                const captchaElements = await page.$$(selector);
                for (const captchaElement of captchaElements) {
                    let isInsideAdvanced = false;
                    for (const advSelector of advancedSelectors) {
                        // Check if captchaElement is inside any advanced selector (return boolean directly)
                        const isDescendant = await captchaElement.evaluate((el, sel) => {
                            let node = el;
                            let debugPath = [];
                            while (node) {
                                if (node.matches && node.matches(sel)) {
                                    return true;
                                }
                                node = node.parentElement;
                            }
                            return false;
                        }, advSelector);
                        if (isDescendant) {
                            isInsideAdvanced = true;
                            break;
                        }
                    }
                    if (!isInsideAdvanced) {
                        return `Captcha detected (selector: ${selector})`;
                    }
                }
            }

            // Check for Cloudflare protection
            const cloudflareIndicators = [
                'iframe[src*="cloudflare"]',
                '.cf-browser-verification',
                '#cf-please-wait',
                '[class*="cf-"]'
            ];

            for (const selector of cloudflareIndicators) {
                const element = await page.$(selector);
                if (element) {
                    return 'Cloudflare protection detected';
                }
            }

            // Check for JavaScript challenges
            const jsChallenge = await page.evaluate(() => {
                return document.title.toLowerCase().includes('challenge') ||
                       document.title.toLowerCase().includes('verify') ||
                       document.title.toLowerCase().includes('security');
            });

            if (jsChallenge) {
                return 'JavaScript challenge detected';
            }

            return null;
        } catch (error) {
            console.log('Error detecting anti-bot mechanisms:', error.message);
            return null;
        }
    }
}

module.exports = ErrorHandler; 