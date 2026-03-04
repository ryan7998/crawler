require('dotenv').config();
const Queue = require('bull');

// Shared Redis options
const redisOpts = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  enableAutoPipelining: false  // RESP2 for Redis 7
};

// Cache queue instances by crawlId so repeated calls share the same connection/listeners
const queueCache = new Map();

function getCrawlQueue(crawlId) {
  const key = String(crawlId);
  if (queueCache.has(key)) {
    return queueCache.get(key);
  }

  const queue = new Queue(`crawl:${key}`, {
    limiter: {
      max: 5,
      duration: 3000,
    },
    redis: redisOpts,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 1,  // Seed class handles retries internally
    },
  });

  queueCache.set(key, queue);
  return queue;
}

/**
 * Remove a queue from the cache (called on crawl cleanup)
 */
function evictCrawlQueue(crawlId) {
  queueCache.delete(String(crawlId));
}

module.exports = getCrawlQueue;
module.exports.evictCrawlQueue = evictCrawlQueue;
