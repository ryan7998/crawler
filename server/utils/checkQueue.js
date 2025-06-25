require('dotenv').config()
const crawlQueue = require('../src/queues/crawlQueue')

async function checkQueueStatus() {
    try {
        // Get all jobs in different states
        const waitingJobs = await crawlQueue.getJobs(['waiting'])
        const activeJobs = await crawlQueue.getJobs(['active'])
        const delayedJobs = await crawlQueue.getJobs(['delayed'])
        const failedJobs = await crawlQueue.getJobs(['failed'])
        const completedJobs = await crawlQueue.getJobs(['completed'])

        console.log('=== Queue Status ===')
        console.log(`Waiting jobs: ${waitingJobs.length}`)
        console.log(`Active jobs: ${activeJobs.length}`)
        console.log(`Delayed jobs: ${delayedJobs.length}`)
        console.log(`Failed jobs: ${failedJobs.length}`)
        console.log(`Completed jobs: ${completedJobs.length}`)
        console.log(`Total jobs: ${waitingJobs.length + activeJobs.length + delayedJobs.length + failedJobs.length + completedJobs.length}`)

        // Show details of waiting jobs
        if (waitingJobs.length > 0) {
            console.log('\n=== Waiting Jobs ===')
            waitingJobs.forEach((job, index) => {
                console.log(`${index + 1}. Job ID: ${job.id}, Crawl ID: ${job.data.crawlId}, URL: ${job.data.url}`)
            })
        } else {
            console.log('\nNo pending jobs found for crawl queue')
        }

        // Show details of active jobs
        if (activeJobs.length > 0) {
            console.log('\n=== Active Jobs ===')
            activeJobs.forEach((job, index) => {
                console.log(`${index + 1}. Job ID: ${job.id}, Crawl ID: ${job.data.crawlId}, URL: ${job.data.url}`)
            })
        }

        // Show details of failed jobs
        if (failedJobs.length > 0) {
            console.log('\n=== Failed Jobs ===')
            failedJobs.forEach((job, index) => {
                console.log(`${index + 1}. Job ID: ${job.id}, Crawl ID: ${job.data.crawlId}, URL: ${job.data.url}`)
                if (job.failedReason) {
                    console.log(`   Error: ${job.failedReason}`)
                }
            })
        }

    } catch (error) {
        console.error('Error checking queue status:', error.message)
    } finally {
        // Close the queue connection
        await crawlQueue.close()
        process.exit(0)
    }
}

// Run the function
checkQueueStatus() 