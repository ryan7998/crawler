const Queue = require('bull')

// Create a queue for crawling tasks
const crawlQueue = new Queue('crawlQueue', {
    redis: {
        host: '127.0.0.1', // Redis is running locally
        port: 6379          // Default Redis port
    }
})

module.exports = crawlQueue