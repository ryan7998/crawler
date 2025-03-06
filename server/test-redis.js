// test-redis.js
const redis = require('redis');

// Create a Redis client (the default is to connect to localhost:6379)
const client = redis.createClient();

client.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis.');

        // Write a test key
        await client.set('testKey', 'testValue');
        console.log('testKey set to testValue');

        // Read the test key
        const value = await client.get('testKey');
        console.log('Retrieved value for testKey:', value);

        // Quit the client
        await client.quit();
    } catch (err) {
        console.error('Error in Redis test:', err);
    }
})();
