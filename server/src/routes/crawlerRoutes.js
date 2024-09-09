const express = require('express')
const { crawlWebsite, createCrawler, getCrawler } = require('../controllers/crawlerController')

const router = express.Router()

//POST /api/crawl
router.post('/startcrawl', crawlWebsite)
router.post('/createcrawler', createCrawler)
router.get('/getcrawler/:id', getCrawler)

module.exports = router