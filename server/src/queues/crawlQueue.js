require('dotenv').config()
const Queue = require('bull')

// Create a queue for crawling tasks
const crawlQueue = new Queue('crawl', {
    limiter: {
        max: 5,        // no more than 5 jobs
        duration: 3000 // per 3 seconds
    },
    redis: {
        host: '127.0.0.1', // Redis is running locally
        port: 6379,         // Default Redis port
        maxRetriesPerRequest: null  // disables the retry limit
    },
    defaultJobOptions: {
        removeOnComplete: 100,  // Keep last 100 completed jobs
        removeOnFail: 50,       // Keep last 50 failed jobs
        attempts: 3,            // Retry failed jobs up to 3 times
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
})


// Clear the queue
// crawlQueue.empty().then(() => {
//     console.log('Queue cleared!')
// }).catch(err => {
//     console.error('Error clearing queue:', err)
// })

module.exports = crawlQueue   