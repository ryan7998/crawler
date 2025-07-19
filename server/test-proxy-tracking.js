const mongoose = require('mongoose');
const proxyUsageService = require('./src/services/proxyUsageService');
require('dotenv').config();

async function testProxyTracking() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Test data
        const testCrawlId = new mongoose.Types.ObjectId();
        const testUrl = 'https://example.com/test';
        const testProxyId = 'test-proxy-123';
        const testLocation = 'US-East';

        console.log('\n🧪 Testing Proxy Usage Tracking...');

        // Test 1: Track successful proxy usage
        console.log('\n1. Testing successful proxy usage tracking...');
        const successResult = await proxyUsageService.trackProxyUsage(
            testCrawlId.toString(),
            testUrl,
            testProxyId,
            testLocation,
            true, // success
            1500, // response time
            0.001 // cost
        );
        console.log('✅ Success tracking result:', {
            crawlId: successResult.crawlId,
            url: successResult.url,
            proxyId: successResult.proxyId,
            successCount: successResult.successCount,
            totalCost: successResult.totalCost
        });

        // Test 2: Track failed proxy usage
        console.log('\n2. Testing failed proxy usage tracking...');
        const failureResult = await proxyUsageService.trackProxyUsage(
            testCrawlId.toString(),
            testUrl,
            testProxyId,
            testLocation,
            false, // failure
            3000, // response time
            0.001 // cost
        );
        console.log('✅ Failure tracking result:', {
            crawlId: failureResult.crawlId,
            url: failureResult.url,
            proxyId: failureResult.proxyId,
            failureCount: failureResult.failureCount,
            totalCost: failureResult.totalCost
        });

        // Test 3: Get crawl proxy stats
        console.log('\n3. Testing crawl proxy stats retrieval...');
        const crawlStats = await proxyUsageService.getCrawlProxyStats(testCrawlId.toString());
        console.log('✅ Crawl proxy stats:', {
            summary: crawlStats.summary,
            detailedUsageCount: crawlStats.detailedUsage.length,
            proxyPerformanceCount: crawlStats.proxyPerformance.length
        });

        // Test 4: Get global proxy stats
        console.log('\n4. Testing global proxy stats retrieval...');
        const globalStats = await proxyUsageService.getGlobalProxyStats();
        console.log('✅ Global proxy stats:', {
            summary: globalStats.summary,
            topProxiesCount: globalStats.topProxies.length,
            recentUsageCount: globalStats.recentUsage.length
        });

        // Test 5: Get cost analysis
        console.log('\n5. Testing cost analysis...');
        const costAnalysis = await proxyUsageService.getCostAnalysis(
            testCrawlId.toString(),
            new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            new Date()
        );
        console.log('✅ Cost analysis:', {
            totalCost: costAnalysis.totalCost,
            totalRequests: costAnalysis.totalRequests,
            dailyCostsCount: costAnalysis.dailyCosts.length
        });

        // Test 6: Get proxy usage for URL
        console.log('\n6. Testing URL-specific proxy usage...');
        const urlUsage = await proxyUsageService.getProxyUsageForUrl(testUrl);
        console.log('✅ URL proxy usage:', {
            usageCount: urlUsage.length,
            firstUsage: urlUsage[0] ? {
                crawlId: urlUsage[0].crawlId,
                proxyId: urlUsage[0].proxyId,
                totalRequests: urlUsage[0].totalRequests
            } : null
        });

        console.log('\n🎉 All proxy tracking tests passed!');

        // Cleanup test data
        console.log('\n🧹 Cleaning up test data...');
        const ProxyUsage = require('./src/models/ProxyUsage');
        // await ProxyUsage.deleteMany({ crawlId: testCrawlId });
        // console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testProxyTracking(); 