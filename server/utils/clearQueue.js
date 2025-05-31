// require('dotenv').config()
// const Queue = require('bull')
const crawlQueue = require('../src/queues/crawlQueue')

// Clear the queue
crawlQueue.empty().then(() => {
    console.log('Queue cleared!')
}).catch(err => {
    console.error('Error clearing queue:', err)
})
