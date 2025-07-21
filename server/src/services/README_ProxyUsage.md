# Proxy Usage Tracking System

## Overview

The Proxy Usage Tracking System provides comprehensive monitoring and analytics for proxy usage across all crawls. It tracks proxy performance, costs, success rates, and provides detailed insights for optimization.

## Features

### 🔍 **Real-time Tracking**

- Track proxy usage for each request
- Monitor success/failure rates
- Measure response times
- Calculate costs per request

### 📊 **Analytics & Reporting**

- Per-crawl proxy statistics
- Global proxy usage overview
- Cost analysis and trends
- Performance metrics by proxy

### 💰 **Cost Management**

- Track costs per request
- Daily cost breakdowns
- Cost analysis by crawl
- Budget monitoring

### 🛠️ **Maintenance**

- Automatic cleanup of old records
- Data integrity checks
- Performance optimization

## Architecture

### Database Schema

#### ProxyUsage Model

```javascript
{
  crawlId: ObjectId,           // Reference to crawl
  url: String,                 // URL being crawled
  proxyId: String,             // Proxy identifier
  proxyLocation: String,       // Geographic location
  costPerRequest: Number,      // Cost per request in USD
  successCount: Number,        // Successful requests
  failureCount: Number,        // Failed requests
  averageResponseTime: Number, // Average response time
  totalCost: Number,           // Total cost for this proxy/URL
  lastUsed: Date              // Last usage timestamp
}
```

#### Crawl Model (Updated)

```javascript
{
  // ... existing fields
  proxyUsageStats: {
    totalProxyRequests: Number,
    uniqueProxiesUsed: Number,
    lastProxyUsed: Date,
    proxyCostEstimate: Number,
    averageProxySuccessRate: Number
  }
}
```

### Service Layer

#### ProxyUsageService

- **trackProxyUsage()** - Track individual proxy usage
- **getCrawlProxyStats()** - Get stats for specific crawl
- **getGlobalProxyStats()** - Get overall proxy statistics
- **getCostAnalysis()** - Analyze costs over time
- **cleanupOldRecords()** - Maintenance cleanup

## API Endpoints

### Crawl-specific Proxy Stats

```
GET /api/crawls/:id/proxy-stats
```

Returns detailed proxy usage statistics for a specific crawl.

**Response:**

```json
{
  "summary": {
    "totalProxyRequests": 150,
    "uniqueProxiesUsed": 5,
    "lastProxyUsed": "2024-01-15T10:30:00Z",
    "totalCost": 0.15,
    "averageSuccessRate": 95.2
  },
  "detailedUsage": [...],
  "proxyPerformance": [...]
}
```

### Global Proxy Stats

```
GET /api/proxy-stats/global
```

Returns overall proxy usage statistics across all crawls.

**Response:**

```json
{
  "summary": {
    "totalProxyRequests": 1250,
    "uniqueProxiesUsed": 12,
    "totalCost": 1.25,
    "averageSuccessRate": 92.8
  },
  "topProxies": [...],
  "recentUsage": [...]
}
```

### URL-specific Proxy Usage

```
GET /api/proxy-stats/url?url=https://example.com
```

Returns proxy usage history for a specific URL.

### Cost Analysis

```
GET /api/proxy-stats/cost-analysis?crawlId=123&startDate=2024-01-01&endDate=2024-01-31
```

Returns cost analysis with optional filters.

### Cleanup Old Records

```
DELETE /api/proxy-stats/cleanup?daysOld=90
```

Removes proxy usage records older than specified days.

## Integration Points

### Worker Integration

The worker automatically tracks proxy usage during crawl execution:

```javascript
// In worker.js job processing
const startTime = Date.now();
let proxyUsed = false;
let proxyId = null;
let proxyLocation = null;

// Check if proxy is enabled
const proxyStatus = seed.getProxyStatus();
if (proxyStatus.enabled) {
  proxyUsed = true;
  proxyId = proxyStatus.config.server || "default";
  proxyLocation = proxyStatus.config.location || "unknown";
}

// Execute crawl
const html = await seed.loadHTMLContent();
const responseTime = Date.now() - startTime;

// Track proxy usage
if (proxyUsed) {
  await proxyUsageService.trackProxyUsage(
    crawlId,
    url,
    proxyId,
    proxyLocation,
    success,
    responseTime,
    0.001 // cost per request
  );
}
```

### Seed Class Integration

The Seed class provides proxy status information:

```javascript
// Enable proxy
seed.enableProxy({
  server: process.env.OXYLAB_SERVER,
  username: process.env.OXYLAB_USERNAME,
  password: process.env.OXYLAB_PASSWORD,
  location: "US-East",
});

// Get proxy status
const status = seed.getProxyStatus();
// Returns: { enabled: true, config: {...} }
```

## Usage Examples

### Basic Proxy Tracking

```javascript
const proxyUsageService = require("./services/proxyUsageService");

// Track successful proxy usage
await proxyUsageService.trackProxyUsage(
  "crawl123",
  "https://example.com",
  "proxy-001",
  "US-East",
  true, // success
  1500, // response time (ms)
  0.001 // cost per request
);
```

### Get Crawl Statistics

```javascript
// Get detailed stats for a crawl
const stats = await proxyUsageService.getCrawlProxyStats("crawl123");
console.log("Total proxy requests:", stats.summary.totalProxyRequests);
console.log("Total cost:", stats.summary.totalCost);
```

### Cost Analysis

```javascript
// Get cost analysis for last 30 days
const analysis = await proxyUsageService.getCostAnalysis(
  null, // all crawls
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
);
console.log("Total cost:", analysis.totalCost);
```

## Configuration

### Environment Variables

```bash
# Proxy configuration
OXYLAB_SERVER=your-proxy-server
OXYLAB_USERNAME=your-username
OXYLAB_PASSWORD=your-password

# Cost configuration (optional)
PROXY_COST_PER_REQUEST=0.001
```

### Cost Configuration

You can customize the cost per request by modifying the worker.js file:

```javascript
// In worker.js
const COST_PER_REQUEST = process.env.PROXY_COST_PER_REQUEST || 0.001;

await proxyUsageService.trackProxyUsage(
  crawlId,
  url,
  proxyId,
  proxyLocation,
  success,
  responseTime,
  COST_PER_REQUEST
);
```

## Testing

### Run Proxy Tracking Tests

```bash
npm run test:proxy-tracking
```

This will test all proxy tracking functionality including:

- Success/failure tracking
- Statistics retrieval
- Cost analysis
- Data cleanup

### Manual Testing

You can test individual endpoints using curl:

```bash
# Get global proxy stats
curl http://localhost:3001/api/proxy-stats/global

# Get crawl-specific stats
curl http://localhost:3001/api/crawls/123/proxy-stats

# Get cost analysis
curl "http://localhost:3001/api/proxy-stats/cost-analysis?startDate=2024-01-01&endDate=2024-01-31"
```

## Maintenance

### Automatic Cleanup

The system includes automatic cleanup functionality:

```javascript
// Clean up records older than 90 days
await proxyUsageService.cleanupOldRecords(90);
```

### Manual Cleanup

You can trigger cleanup via API:

```bash
curl -X DELETE "http://localhost:3001/api/proxy-stats/cleanup?daysOld=90"
```

## Performance Considerations

### Database Indexes

The system uses efficient MongoDB indexes for optimal performance:

- Compound index on `(crawlId, url, proxyId)`
- Index on `lastUsed` for time-based queries
- Index on `proxyId` for proxy-specific queries

### Query Optimization

- Aggregation pipelines for complex statistics
- Pagination for large result sets
- Efficient date range queries

## Troubleshooting

### Common Issues

1. **Proxy tracking not working**

   - Check if proxy is enabled in Seed class
   - Verify proxy configuration
   - Check worker.js integration

2. **High memory usage**

   - Run cleanup to remove old records
   - Check for memory leaks in aggregation queries

3. **Slow queries**
   - Ensure proper indexes are created
   - Use pagination for large datasets
   - Optimize aggregation pipelines

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=proxy-usage node src/worker.js
```

## Future Enhancements

### Planned Features

- Real-time proxy performance alerts
- Advanced cost optimization algorithms
- Proxy rotation strategies
- Geographic performance analysis
- Integration with proxy provider APIs

### Customization Options

- Configurable cost models
- Custom proxy identification
- Flexible location tracking
- Advanced analytics dashboards

## Support

For issues or questions about the proxy usage tracking system:

1. Check the troubleshooting section
2. Review the test scripts
3. Examine the API documentation
4. Check the worker logs for errors

The system is designed to be robust and self-healing, with comprehensive error handling and logging throughout.
