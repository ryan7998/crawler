require('dotenv').config()
const Queue = require('bull')

// Create a queue for crawling tasks
const crawlQueue = new Queue('crawl', {
    redis: {
        host: '127.0.0.1', // Redis is running locally
        port: 6379,         // Default Redis port
        // maxRetriesPerRequest: null  // disables the retry limit
    }
})


// Clear the queue
// crawlQueue.empty().then(() => {
//     console.log('Queue cleared!')
// }).catch(err => {
//     console.error('Error clearing queue:', err)
// })

module.exports = crawlQueue   