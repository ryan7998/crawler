(async () => {
     // load the ES module exactly once
const { default: pThrottle } = await import('p-throttle');
const express         = require('express');
const http            = require('http');
const mongoose        = require('mongoose');
const CrawlData       = require('./models/CrawlData');
const Crawl           = require('./models/Crawl');
const { extractHtml, determineCrawlStatus } = require('../utils/helperFunctions');
const getCrawlQueue   = require('./queues/getCrawlQueue');
const { initializeSocket, getSocket } = require('../utils/socket');
const Seed            = require('./classes/Seed');
const proxyUsageService = require('./services/proxyUsageService');
require('dotenv').config();

// —————————————— APP & SOCKET.IO SETUP ——————————————
const app    = express();
const server = http.createServer(app);
initializeSocket(server);

// —————————————— MONGODB SETUP ——————————————
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// —————————————— PER-CRAWL PROCESSORS ——————————————
const activeProcessors = new Set();
const activeJobs       = new Map();
const crawlThrottles   = new Map();

// Helper to get a p-Throttle for each crawl
function getThrottle(crawlId) {
  if (!crawlThrottles.has(crawlId)) {
    // 1 request per 2 s; you can tune these
    crawlThrottles.set(crawlId, pThrottle({ limit: 1, interval: 2000 }));
  }
  return crawlThrottles.get(crawlId);
}

// Cleanup function for completed crawls
function cleanupCrawl(crawlId) {
  activeJobs.delete(crawlId);
  crawlThrottles.delete(crawlId);
  activeProcessors.delete(crawlId);
  console.log(`🧹 Cleaned up crawl ${crawlId}`);
}

// Called once per crawlId to wire up its queue
async function ensureProcessor(crawlId) {
  if (activeProcessors.has(crawlId)) {
    console.log(`[${crawlId}] Processor already exists, skipping...`);
    return;
  }
  activeProcessors.add(crawlId);

  const q = getCrawlQueue(crawlId);
  const io = getSocket();
  const crawlIdStr = String(crawlId); // Ensure crawlId is a string for socket rooms

  console.log(`[${crawlId}] Setting up processor...`);

  // Track how many URLs this crawl has in total
  const crawl = await Crawl.findById(crawlId);
  if (!crawl) {
    console.error(`[${crawlId}] Crawl not found`);
    return;
  }
  activeJobs.set(crawlId, { total: crawl.urls.length, completed: 0 });
  console.log(`[${crawlId}] Tracking ${crawl.urls.length} URLs`);

  // Listen for completions & failures to update crawl status
  q.on('completed', async job => {
    const state = activeJobs.get(crawlId);
    if (!state) return;
    state.completed++;
    console.log(`[${crawlId}] Job ${job.id} completed. Progress: ${state.completed}/${state.total}`);
    
    if (state.completed === state.total) {
      const allData = await CrawlData.find({ crawlId });
      
      // Determine status based on latest attempts
      const statusInfo = determineCrawlStatus(allData);
      
      await Crawl.findByIdAndUpdate(crawlId, {
        status: statusInfo.status,
        endTime: new Date()
      });
      io.to(crawlIdStr).emit('crawlLog', {
        status: statusInfo.status,
        message: statusInfo.status === 'failed' ? 'Some URLs failed' : 'All URLs done'
      });
      cleanupCrawl(crawlId);
    }
  });

  // Listen for failed jobs
  q.on('failed', async (job, err) => {
    console.log(`[${crawlId}] Job ${job.id} failed with error:`, err.message);
    const state = activeJobs.get(crawlId);
    if (!state) return;
    state.completed++;
    console.log(`[${crawlId}] Job ${job.id} failed. Progress: ${state.completed}/${state.total}`);
    
    if (state.completed === state.total) {
      const allData = await CrawlData.find({ crawlId });
      
      // Determine status based on latest attempts
      const statusInfo = determineCrawlStatus(allData);
      
      await Crawl.findByIdAndUpdate(crawlId, {
        status: statusInfo.status,
        endTime: new Date()
      });
      io.to(crawlIdStr).emit('crawlLog', {
        status: statusInfo.status,
        message: statusInfo.status === 'failed' ? 'Some URLs failed' : 'All URLs done'
      });
      cleanupCrawl(crawlId);
    }
  });

  // Now process up to N jobs in parallel for this crawl
  const CONCURRENCY = parseInt(process.env.CRAWL_CONCURRENCY || '3', 10);
  q.process(CONCURRENCY, async (job) => {
    if (!job || !job.data || !job.data.url) {
      console.error(`[${crawlId}] Invalid job data:`, job);
      throw new Error('Invalid job data');
    }
    
    const { url, crawlId, runId } = job.data;
    console.log(`[${crawlId}] Processing job ${job.id} for URL: ${url}`);
    
    // Track proxy usage variables (declare outside try block to avoid undefined errors)
    const startTime = Date.now();
    let proxyUsed = false;
    let proxyId = null;
    let proxyLocation = null;
    let responseTime = 0;
    
    try {
      console.log(`[${crawlId}] Job ${job.id} started: ${url}`);
      io.to(crawlIdStr).emit('crawlLog', { jobId: job.id, url, status: 'started' });

      // random anti-detection delay
      await new Promise(r => setTimeout(r, 1000 + Math.random()*2000));

      // Playwright or axios fetch
      const seed = new Seed({ url, advancedSelectors: crawl.advancedSelectors });
      if (!seed.isValid()) throw new Error(`Invalid URL: ${url}`);

      const crawlThrottle = getThrottle(crawlId)
      const throttled = crawlThrottle(async () => {
        return await seed.loadHTMLContent();
      });
      
      const html = await throttled();
      responseTime = Date.now() - startTime;
      
      // Check proxy status AFTER the request is complete (proxy might have been enabled during retry)
      const proxyStatus = seed.getProxyStatus();
      if (proxyStatus.enabled) {
        proxyUsed = true;
        // Extract proxy ID from server configuration
        proxyId = proxyStatus.config.server || 'default';
        proxyLocation = proxyStatus.config.location || 'unknown';
        console.log(`[${crawlId}] Proxy was used for ${url}: ${proxyId}`);
      }
      
      console.log(`[${crawlId}] Loaded HTML content for ${url}, Extracting Data...`);
      const data = await extractHtml(html, (crawl.selectors));

      // Track proxy usage if proxy was used
      if (proxyUsed) {
        try {
          await proxyUsageService.trackProxyUsage(
            crawlId,
            url,
            proxyId,
            proxyLocation,
            true, // success
            responseTime,
            0.001 // cost per request (adjust as needed)
          );
          console.log(`[${crawlId}] Tracked successful proxy usage for ${url}`);
        } catch (proxyError) {
          console.error(`[${crawlId}] Error tracking proxy usage:`, proxyError.message);
        }
      }

      // Save to database (success)
      const newCrawlData = new CrawlData({ url, data, crawlId, runId, status: 'success' })
      await newCrawlData.save()

      io.to(crawlIdStr).emit('crawlLog', {
        jobId: job.id,
        url,
        status: 'success',
        result: data
      });
      console.log(`[${crawlId}] Job ${job.id} succeeded`);
      return data;

    } catch (err) {
      const msg = err.message || String(err);
      console.error(`[${crawlId}] Job ${job.id} failed:`, msg);
      
      // Track proxy usage for failed requests
      if (proxyUsed) {
        try {
          await proxyUsageService.trackProxyUsage(
            crawlId,
            url,
            proxyId,
            proxyLocation,
            false, // failure
            responseTime,
            0.001 // cost per request (adjust as needed)
          );
          console.log(`[${crawlId}] Tracked failed proxy usage for ${url}`);
        } catch (proxyError) {
          console.error(`[${crawlId}] Error tracking proxy usage:`, proxyError.message);
        }
      }
      
      io.to(crawlIdStr).emit('crawlLog', {
        jobId: job.id,
        url,
        status: 'failed',
        error: msg
      });
      // save failure
      await new CrawlData({ url, crawlId, runId, status: 'failed', error: msg }).save();
      console.log(`[${crawlId}] Job ${job.id} marked as failed and saved to database`);
      throw err;
    }
  });

  console.log(`📡 Processor started for crawl ${crawlId} (concurrency=${CONCURRENCY})`);
}

// —————————————— OPTIONAL: HTTP ENDPOINT TO START A PROCESSOR ——————————————
// If you'd like to trigger this from your controller via an HTTP call:
app.post('/processor/:crawlId', (req, res) => {
    const { crawlId } = req.params;
    try {
      ensureProcessor(crawlId);
      return res.json({ message: `Processor ensured for ${crawlId}` });
    } catch (err) {
      console.error('Error ensuring processor:', err);
      return res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to check queue status
app.get('/queue-status/:crawlId', async (req, res) => {
    const { crawlId } = req.params;
    try {
      const q = getCrawlQueue(crawlId);
      const waiting = await q.getJobs(['waiting']);
      const active = await q.getJobs(['active']);
      const completed = await q.getJobs(['completed']);
      const failed = await q.getJobs(['failed']);
      
      return res.json({
        crawlId,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
        activeJobs: activeProcessors.has(crawlId),
        jobDetails: {
          waiting: waiting.map(j => ({ id: j.id, url: j.data.url })),
          active: active.map(j => ({ id: j.id, url: j.data.url })),
          failed: failed.map(j => ({ id: j.id, url: j.data.url, error: j.failedReason }))
        }
      });
    } catch (err) {
      console.error('Error checking queue status:', err);
      return res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to clear all jobs for a crawl
app.delete('/queue-clear/:crawlId', async (req, res) => {
    const { crawlId } = req.params;
    try {
      const q = getCrawlQueue(crawlId);
      const waiting = await q.getJobs(['waiting', 'active', 'delayed', 'failed']);
      
      for (const job of waiting) {
        await job.remove();
      }
      
      cleanupCrawl(crawlId);
      
      return res.json({ 
        message: `Cleared ${waiting.length} jobs for crawl ${crawlId}`,
        clearedJobs: waiting.length
      });
    } catch (err) {
      console.error('Error clearing queue:', err);
      return res.status(500).json({ error: err.message });
    }
});

// —————————————— LAUNCH ——————————————
const PORT = parseInt(process.env.PORT || '3002', 10);
server.listen(PORT, () => {
  console.log(`Worker + Socket.IO listening on port ${PORT}`);
});

})()