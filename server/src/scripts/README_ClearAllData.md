# Clear All Crawl Data Script

This script provides a comprehensive solution for clearing all crawl-related data from your system. It's designed to be safe, thorough, and configurable for different use cases.

## 🎯 **Purpose**

When you want to start fresh with global crawls, this script will:

- **Clear all CrawlData** documents (actual crawled data)
- **Clear all ProxyUsage** records (proxy tracking data)
- **Clear all Redis queue jobs** (pending/active crawl jobs)
- **Reset all Crawl documents** to a clean "pending" state
- **Preserve crawl configurations** (URLs, selectors, settings)

## 🛡️ **Safety Features**

### **1. Dry Run Mode**

Preview what would be deleted without actually deleting anything:

```bash
DRY_RUN=true npm run clear-all-data
```

### **2. Interactive Confirmation**

By default, the script asks for confirmation before deleting:

```
⚠️  WARNING: This will permanently delete ALL crawl data!

- 1,234 CrawlData documents
- 567 ProxyUsage documents
- All Redis queue jobs
- Reset all Crawl documents to pending state

Type 'YES' to confirm:
```

### **3. Skip Confirmation**

For automated scripts, skip the confirmation prompt:

```bash
CONFIRM_DELETION=true npm run clear-all-data
```

## 📋 **Usage**

### **Basic Usage**

```bash
# Interactive mode (recommended)
npm run clear-all-data

# Direct execution
node src/scripts/clearAllCrawlData.js
```

### **Dry Run (Preview)**

```bash
# See what would be deleted without actually deleting
DRY_RUN=true npm run clear-all-data
```

### **Automated Execution**

```bash
# Skip confirmation for automated scripts
CONFIRM_DELETION=true npm run clear-all-data
```

### **Custom Configuration**

```bash
# Custom database and Redis settings
MONGO_URI=mongodb://localhost:27017/my_db \
REDIS_HOST=localhost \
REDIS_PORT=6379 \
npm run clear-all-data
```

## ⚙️ **Configuration Options**

### **Environment Variables**

```bash
# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/crawler_db

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Safety Options
DRY_RUN=true                    # Preview mode (no actual deletion)
CONFIRM_DELETION=true           # Skip confirmation prompt

# Logging
LOG_LEVEL=info                  # debug, info, warn, error
```

## 🔄 **What Gets Cleared**

### **1. CrawlData Collection**

- All crawled data from previous runs
- URL-specific crawl results
- Error logs and status information
- Run IDs and timestamps

### **2. ProxyUsage Collection**

- All proxy usage tracking data
- Cost estimates and statistics
- Performance metrics
- Proxy success/failure rates

### **3. Redis Queues**

- All BullMQ queue jobs
- Pending, active, delayed, failed jobs
- Queue metadata and state

### **4. Crawl Documents (Reset)**

- `results` array (cleared)
- `status` (set to 'pending')
- `startTime` and `endTime` (cleared)
- `error` field (cleared)
- `logs` array (cleared)
- `proxyUsageStats` (reset to defaults)

## 📊 **What Gets Preserved**

### **Crawl Configuration**

- Crawl titles and descriptions
- URL lists
- Selector configurations
- Advanced selectors
- Comparison selectors
- User IDs
- Creation dates
- Disabled status

### **System Data**

- Selectors collection
- User accounts (if any)
- System settings
- Database indexes

## 📈 **Output Example**

```
[2024-01-15T10:00:00.000Z] [INFO] === Starting Complete Crawl Data Cleanup ===
[2024-01-15T10:00:00.100Z] [INFO] Connected to MongoDB
[2024-01-15T10:00:00.200Z] [INFO] Initial data statistics: { crawls: 5, crawlData: 1234, proxyUsage: 567 }
[2024-01-15T10:00:00.300Z] [INFO] 1. Clearing Redis queues...
[2024-01-15T10:00:00.400Z] [INFO] Cleared 45 jobs from queue for crawl 507f1f77bcf86cd799439011
[2024-01-15T10:00:00.500Z] [INFO] 2. Clearing CrawlData...
[2024-01-15T10:00:00.600Z] [INFO] Deleted 1234 CrawlData documents
[2024-01-15T10:00:00.700Z] [INFO] 3. Clearing ProxyUsage data...
[2024-01-15T10:00:00.800Z] [INFO] Deleted 567 ProxyUsage documents
[2024-01-15T10:00:00.900Z] [INFO] 4. Resetting Crawl documents...
[2024-01-15T10:00:01.000Z] [INFO] Reset 5 Crawl documents to clean state
[2024-01-15T10:00:01.100Z] [INFO] === Cleanup Operation Completed ===
[2024-01-15T10:00:01.200Z] [INFO] ✅ All crawl data has been successfully cleared
```

## 🚨 **Important Considerations**

### **Before Running**

1. **Backup your data** if you need to preserve any crawl results
2. **Stop all active crawls** to prevent data corruption
3. **Ensure no other processes** are accessing the database
4. **Verify your configuration** (database/Redis connections)

### **After Running**

1. **All crawls will be in 'pending' state**
2. **No historical data will remain**
3. **Proxy usage statistics will be reset**
4. **Queues will be empty**

## 🔧 **Troubleshooting**

### **Common Issues**

1. **MongoDB Connection Failed**

   ```bash
   # Check MongoDB is running
   mongod --version

   # Verify connection string
   echo $MONGO_URI
   ```

2. **Redis Connection Failed**

   ```bash
   # Check Redis is running
   redis-cli ping

   # Verify Redis configuration
   echo $REDIS_HOST:$REDIS_PORT
   ```

3. **Permission Denied**
   ```bash
   # Ensure you have write permissions
   ls -la /path/to/mongodb/data
   ```

### **Recovery Options**

If you accidentally cleared data and need to recover:

1. **Database Backup**: Restore from your latest backup
2. **MongoDB Oplog**: If enabled, you might be able to replay operations
3. **File System**: Check if you have any exported data files

## 🎯 **Use Cases**

### **1. Fresh Start**

```bash
# Clear everything and start over
npm run clear-all-data
npm run run-global-crawls
```

### **2. Testing Environment**

```bash
# Clear data before running tests
CONFIRM_DELETION=true npm run clear-all-data
```

### **3. Production Maintenance**

```bash
# Clear old data to free up space
DRY_RUN=true npm run clear-all-data  # First preview
npm run clear-all-data               # Then execute
```

### **4. Development Reset**

```bash
# Reset development environment
CONFIRM_DELETION=true npm run clear-all-data
```

## 📝 **Integration with Global Crawls**

This script is designed to work seamlessly with the global crawls script:

```bash
# Complete workflow
npm run clear-all-data      # Clear old data
npm run run-global-crawls   # Start fresh crawls
```

## 🔒 **Security Notes**

- **Environment variables** should be properly secured
- **Database credentials** should not be logged
- **Redis connections** should use authentication if available
- **Log files** should be protected from unauthorized access

## 📞 **Support**

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify your configuration** matches your environment
3. **Run in dry-run mode** first to preview changes
4. **Ensure all services** (MongoDB, Redis) are running
