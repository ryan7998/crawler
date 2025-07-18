require('dotenv').config()
const Redis = require('ioredis')
const getCrawlQueue = require('../src/queues/getCrawlQueue')

async function checkAllQueues() {
    const redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
    })

    try {
        console.log('=== Checking All Crawl Queues ===')
        
        // Get all queue keys that match the pattern 'bull:crawl:*'
        const keys = await redis.keys('bull:crawl:*')
        
        if (keys.length === 0) {
            console.log('No crawl queues found')
            return
        }

        let totalActive = 0
        let totalWaiting = 0
        let totalDelayed = 0
        let totalFailed = 0
        let totalCompleted = 0

        for (const key of keys) {
            // Extract crawlId from the key (format: 'bull:crawl:crawlId')
            const parts = key.split(':')
            const crawlId = parts[2]
            
            if (!crawlId) continue

            try {
                const queue = getCrawlQueue(crawlId)
                const waiting = await queue.getJobs(['waiting'])
                const active = await queue.getJobs(['active'])
                const delayed = await queue.getJobs(['delayed'])
                const failed = await queue.getJobs(['failed'])
                const completed = await queue.getJobs(['completed'])

                const total = waiting.length + active.length + delayed.length + failed.length + completed.length
                
                if (total > 0) {
                    console.log(`\n--- Crawl: ${crawlId} ---`)
                    console.log(`Total jobs: ${total}`)
                    console.log(`  Waiting: ${waiting.length}`)
                    console.log(`  Active: ${active.length}`)
                    console.log(`  Delayed: ${delayed.length}`)
                    console.log(`  Failed: ${failed.length}`)
                    console.log(`  Completed: ${completed.length}`)

                    if (active.length > 0) {
                        console.log('  Active jobs:')
                        active.forEach((job, index) => {
                            console.log(`    ${index + 1}. Job ID: ${job.id}, URL: ${job.data.url}`)
                        })
                    }

                    totalActive += active.length
                    totalWaiting += waiting.length
                    totalDelayed += delayed.length
                    totalFailed += failed.length
                    totalCompleted += completed.length
                }

                await queue.close()
            } catch (err) {
                console.log(`Error checking queue for crawl ${crawlId}:`, err.message)
            }
        }

        console.log('\n=== Summary ===')
        console.log(`Total Active Jobs: ${totalActive}`)
        console.log(`Total Waiting Jobs: ${totalWaiting}`)
        console.log(`Total Delayed Jobs: ${totalDelayed}`)
        console.log(`Total Failed Jobs: ${totalFailed}`)
        console.log(`Total Completed Jobs: ${totalCompleted}`)

    } catch (error) {
        console.error('Error checking queues:', error.message)
    } finally {
        await redis.disconnect()
        process.exit(0)
    }
}

checkAllQueues() 