const express = require('express')
const {
    crawlWebsite,
    createCrawler,
    updateCrawler,
    deleteCrawler,
    getCrawler,
    getAllCrawlers,
    checkDomainSelectors,
    getQueueStatus,
    deleteCrawlData,
    deleteCrawlDataForUrls,
    runAllCrawls,
    clearCrawlQueue,
    clearAllQueues,
    getAllQueuesStatus,
    // Proxy usage endpoints
    getCrawlProxyStats,
    getGlobalProxyStats,
    getProxyUsageForUrl,
    getProxyCostAnalysis,
    cleanupProxyUsage
} = require('../controllers/crawlerController')
const { crawlQueue } = require('../queues/crawlQueue')

const router = express.Router()

//POST /api/crawl
router.get('/getallcrawlers', getAllCrawlers)
router.get('/getcrawler/:id', getCrawler)
router.get('/selectors/:domain', checkDomainSelectors)
router.post('/startcrawl', crawlWebsite)
router.post('/runallcrawls', runAllCrawls)
router.post('/createcrawler', createCrawler)
router.put('/updatecrawl/:id', updateCrawler)
router.delete('/deletecrawl/:id', deleteCrawler)
router.delete('/deletecrawldata/:id', deleteCrawlData)
router.delete('/deletecrawldata/:id/urls', deleteCrawlDataForUrls)
router.get('/queuestatus/:crawlId', getQueueStatus)
router.delete('/clearqueue/:crawlId', clearCrawlQueue)
router.delete('/clearallqueues', clearAllQueues)
router.get('/allqueuesstatus', getAllQueuesStatus)

// —————————————— PROXY USAGE ROUTES ——————————————
router.get('/crawls/:id/proxy-stats', getCrawlProxyStats)
router.get('/proxy-stats/global', getGlobalProxyStats)
router.get('/proxy-stats/url', getProxyUsageForUrl)
router.get('/proxy-stats/cost-analysis', getProxyCostAnalysis)
router.delete('/proxy-stats/cleanup', cleanupProxyUsage)

module.exports = router