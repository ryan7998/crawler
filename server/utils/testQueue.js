require('dotenv').config()
const crawlQueue = require('../src/queues/crawlQueue')

async function testQueue() {
    try {
        console.log('Testing queue functionality...')
        
        // Add a test job
        const testJob = await crawlQueue.add({
            url: 'https://httpbin.org/get',
            crawlId: 'test-crawl-id'
        })
        
        console.log('Test job added:', testJob.id)
        
        // Wait a moment for the job to be processed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check job status
        const job = await crawlQueue.getJob(testJob.id)
        if (job) {
            console.log('Job status:', await job.getState())
            console.log('Job data:', job.data)
        } else {
            console.log('Job not found (may have been processed and removed)')
        }
        
        // Get queue stats
        const waiting = await crawlQueue.getWaiting()
        const active = await crawlQueue.getActive()
        const completed = await crawlQueue.getCompleted()
        const failed = await crawlQueue.getFailed()
        
        console.log('Queue stats:')
        console.log('- Waiting:', waiting.length)
        console.log('- Active:', active.length)
        console.log('- Completed:', completed.length)
        console.log('- Failed:', failed.length)
        
    } catch (error) {
        console.error('Error testing queue:', error)
    } finally {
        await crawlQueue.close()
        process.exit(0)
    }
}

testQueue() 