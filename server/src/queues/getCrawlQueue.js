require('dotenv').config();
const Queue = require('bull');

// Detect Bull version to determine configuration
const bullVersion = require('bull/package.json').version;
const isBull4 = bullVersion.startsWith('4');
const isBull3 = bullVersion.startsWith('3');

console.log(`Bull version detected: ${bullVersion}, using ${isBull4 ? 'Bull 4.x' : 'Bull 3.x'} configuration`);

// Environment-aware Redis options
const getRedisOptions = () => {
  const baseOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  };

  if (isBull4) {
    // Bull 4.x configuration (local environment)
    return {
      ...baseOptions,
      enableAutoPipelining: false,  // RESP2 for Redis 7
      // maxRetriesPerRequest: null  // disables the retry limit
    };
  } else {
    // Bull 3.x configuration (production environment)
    return {
      ...baseOptions,
      // Bull 3.x compatible options
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 5,
      // Enable offline queue to handle connection issues
      enableOfflineQueue: true,
      // Connection timeout and retry settings
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Keep connection alive
      keepAlive: 30000,
      // Handle connection errors gracefully
      lazyConnect: false,
      // Enable auto-reconnection
      autoResubscribe: true,
      // Handle Redis 7.x compatibility
      family: 4
    };
  }
};

const redisOpts = getRedisOptions();

function getCrawlQueue(crawlId) {
  const queueOptions = {
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
      // Add job data validation
      jobId: undefined, // Let Bull generate IDs
    },
  };

  // Add version-specific settings
  if (isBull4) {
    // Bull 4.x settings
    queueOptions.settings = {
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 1,     // Mark job as failed after 1 stall
    };
  } else {
    // Bull 3.x settings
    queueOptions.settings = {
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 1,     // Mark job as failed after 1 stall
    };
  }

  return new Queue(`crawl:${crawlId}`, queueOptions);
}

module.exports = getCrawlQueue;
