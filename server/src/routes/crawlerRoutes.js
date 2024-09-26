const express = require('express')
const { crawlWebsite, createCrawler, updateCrawler, deleteCrawler, getCrawler } = require('../controllers/crawlerController')

const router = express.Router()

//POST /api/crawl
router.get('/getcrawler/:id', getCrawler)
router.post('/startcrawl', crawlWebsite)
router.post('/createcrawler', createCrawler)
router.put('/updatecrawl/:id', updateCrawler)
router.delete('/deletecrawl/:id', deleteCrawler)

module.exports = router