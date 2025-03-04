const Queue = require('bull')


// Create a queue for crawling tasks
const crawlQueue = new Queue('crawlQueue', {
    redis: {
        host: process.env.SOCKET_ORIGIN || '127.0.0.1', // Redis is running locally
        port: 6379          // Default Redis port
    }
})


// Clear the queue
// crawlQueue.empty().then(() => {
//     console.log('Queue cleared!')
// }).catch(err => {
//     console.error('Error clearing queue:', err)
// })

module.exports = crawlQueue