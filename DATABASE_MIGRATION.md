# Database Migration Guide

## 📊 **Migrating from Local MongoDB to Live Cluster**

This guide will help you export your local MongoDB database and import it to your live MongoDB Atlas cluster.

## 🚀 **Step-by-Step Process**

### 1. **Prepare Your Environment**

```bash
# Navigate to server directory
cd server

# Copy environment example
cp env.example .env

# Edit .env file with your actual values
nano .env
```

**Required Environment Variables:**

- `MONGO_URI` - Your local MongoDB connection string
- `LIVE_MONGO_URI` - Your live MongoDB Atlas connection string

### 2. **Export Local Database**

```bash
# Export all collections to JSON files
npm run export-db
```

This will create a `database-export` folder with:

- `crawls.json` - All crawl configurations
- `crawlData.json` - All crawled data
- `selectors.json` - All CSS selectors
- `export-summary.json` - Export metadata

### 3. **Verify Export**

Check the export summary:

```bash
cat database-export/export-summary.json
```

You should see:

```json
{
  "exportDate": "2024-01-01T12:00:00.000Z",
  "collections": {
    "crawls": 10,
    "crawlData": 150,
    "selectors": 25
  },
  "totalDocuments": 185
}
```

### 4. **Import to Live Cluster**

```bash
# Import all data to live MongoDB Atlas
npm run import-db
```

This will:

- Connect to your live MongoDB Atlas cluster
- Clear existing data (optional - can be modified)
- Import all exported data
- Show import summary

## 🔧 **Alternative Methods**

### Using MongoDB Tools (if available)

#### Export with mongodump:

```bash
# Export entire database
mongodump --uri="mongodb://127.0.0.1:27017/crawler_db" --out=./backup

# Import to live cluster
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/crawler_db" ./backup
```

#### Export specific collections:

```bash
# Export specific collections
mongoexport --uri="mongodb://127.0.0.1:27017/crawler_db" --collection=crawls --out=crawls.json
mongoexport --uri="mongodb://127.0.0.1:27017/crawler_db" --collection=crawldatas --out=crawlData.json
mongoexport --uri="mongodb://127.0.0.1:27017/crawler_db" --collection=selectors --out=selectors.json

# Import to live cluster
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/crawler_db" --collection=crawls --file=crawls.json
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/crawler_db" --collection=crawldatas --file=crawlData.json
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/crawler_db" --collection=selectors --file=selectors.json
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Connection Failed**

   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure network connectivity

2. **Authentication Failed**

   - Check username/password in connection string
   - Verify database user permissions
   - Use correct authentication method

3. **Import Errors**

   - Check for duplicate IDs
   - Verify data format compatibility
   - Review error logs for specific issues

4. **Large Dataset Issues**
   - Use batch processing for large datasets
   - Consider using mongodump/mongorestore
   - Monitor memory usage during import

### Verification Steps

After import, verify your data:

```bash
# Connect to live cluster and check collections
mongosh "mongodb+srv://username:password@cluster.mongodb.net/crawler_db"

# Check document counts
db.crawls.countDocuments()
db.crawldatas.countDocuments()
db.selectors.countDocuments()

# Check sample documents
db.crawls.findOne()
db.crawldatas.findOne()
db.selectors.findOne()
```

## 📋 **Pre-Migration Checklist**

- [ ] Backup your local database
- [ ] Set up MongoDB Atlas cluster
- [ ] Configure network access (IP whitelist)
- [ ] Create database user with proper permissions
- [ ] Test connection to live cluster
- [ ] Update environment variables
- [ ] Stop any running applications
- [ ] Export local data
- [ ] Verify export files
- [ ] Import to live cluster
- [ ] Verify imported data
- [ ] Update application configuration
- [ ] Test application with live data

## 🔄 **Post-Migration Steps**

1. **Update Application Configuration**

   - Change `MONGO_URI` to point to live cluster
   - Update any hardcoded localhost references
   - Test application connectivity

2. **Monitor Performance**

   - Check query performance
   - Monitor connection pool usage
   - Verify data integrity

3. **Backup Strategy**
   - Set up regular backups on Atlas
   - Configure backup retention policies
   - Test restore procedures

## 📞 **Support**

If you encounter issues:

1. Check MongoDB Atlas documentation
2. Review connection string format
3. Verify network and security settings
4. Check application logs for errors
5. Contact MongoDB Atlas support if needed
