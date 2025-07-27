const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testProxyEndpoints() {
    console.log('🧪 Testing Proxy Usage Endpoints...\n');

    const endpoints = [
        {
            name: 'Global Proxy Stats',
            url: `${API_BASE_URL}/api/proxy-stats/global`,
            method: 'GET'
        },
        {
            name: 'Cost Analysis',
            url: `${API_BASE_URL}/api/proxy-stats/cost-analysis`,
            method: 'GET'
        },
        {
            name: 'URL Proxy Usage',
            url: `${API_BASE_URL}/api/proxy-stats/url?url=https://example.com`,
            method: 'GET'
        },
        {
            name: 'Cleanup Endpoint',
            url: `${API_BASE_URL}/api/proxy-stats/cleanup?daysOld=90`,
            method: 'DELETE'
        }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            console.log(`URL: ${endpoint.url}`);
            
            let response;
            if (endpoint.method === 'GET') {
                response = await axios.get(endpoint.url);
            } else if (endpoint.method === 'DELETE') {
                response = await axios.delete(endpoint.url);
            }
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`✅ Response type: ${typeof response.data}`);
            
            if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                console.log('❌ Response is HTML (likely 404 page)');
                console.log('Response preview:', response.data.substring(0, 200) + '...');
            } else {
                console.log('✅ Response is JSON');
                console.log('Response preview:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Response: ${error.response.data}`);
            }
        }
        
        console.log('---\n');
    }

    // Test with a specific crawl ID (you'll need to replace with a real crawl ID)
    console.log('Testing Crawl-specific Proxy Stats...');
    try {
        const crawlId = '507f1f77bcf86cd799439011'; // Example ObjectId
        const response = await axios.get(`${API_BASE_URL}/api/crawls/${crawlId}/proxy-stats`);
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Response type: ${typeof response.data}`);
        
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.log('❌ Response is HTML (likely 404 page)');
        } else {
            console.log('✅ Response is JSON');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
        }
    }
}

// Run the test
testProxyEndpoints().catch(console.error); 