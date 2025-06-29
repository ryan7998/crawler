require('dotenv').config();
const Queue = require('bull');

// Shared Redis options (no forbidden flags here)
const redisOpts = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  enableAutoPipelining: false  // RESP2 for Redis 7
  // remove maxRetriesPerRequest here if Bull complains; use defaults
};

function getCrawlQueue(crawlId) {
  return new Queue(`crawl:${crawlId}`, {
    limiter: {
      max: 5,          // e.g. 5 jobs per duration
      duration: 3000,  // every 3 seconds
    },
    redis: redisOpts,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 1,  // Set to 1 since Seed class handles retries internally
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
}

module.exports = getCrawlQueue;
