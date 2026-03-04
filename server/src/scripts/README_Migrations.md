# Database Migrations

This directory contains database migration scripts for the crawler application.

## Available Migrations

### 1. Proxy Usage Migration

**File**: `migrateProxyUsage.js`

**Purpose**: Adds proxy usage statistics to existing crawl documents.

**What it does**:

- Finds all crawl documents without `proxyUsageStats`
- Adds default proxy usage statistics to each document
- Verifies the migration was successful

**When to run**: After adding the proxy usage feature to track proxy usage statistics.

### 2. Created At Migration

**File**: `migrateCreatedAt.js`

**Purpose**: Adds `createdAt` field to existing crawl documents.

**What it does**:

- Finds all crawl documents without `createdAt` field
- Sets `createdAt` to the value of `startTime` (if available) or current date
- Verifies the migration was successful

**When to run**: After adding the `createdAt` field to the Crawl schema to ensure proper sorting and display of creation dates.

## Running Migrations

### From the server directory:

```bash
# Run proxy usage migration
npm run migrate:proxy-usage

# Run created at migration
npm run migrate:created-at
```

### Direct execution:

```bash
# Run migration directly
node src/scripts/migrateProxyUsage.js
node src/scripts/migrateCreatedAt.js
```

## Migration Safety

- **Idempotent**: Can be run multiple times safely
- **Non-destructive**: Only adds new fields, doesn't modify existing data
- **Verification**: Includes verification steps to confirm success
- **Logging**: Detailed console output for monitoring

## Before Running Migrations

1. **Backup your database** (recommended for production)
2. **Stop the application** to prevent data conflicts
3. **Run the migration**
4. **Verify the results**
5. **Restart the application**

## Migration Output Example

```
✅ Connected to MongoDB
📊 Found 15 crawl documents to update
✅ Successfully updated all crawl documents with proxy usage stats
✅ Verification: 15 documents now have proxyUsageStats

📋 Sample updated document:
{
  "totalProxyRequests": 0,
  "uniqueProxiesUsed": 0,
  "lastProxyUsed": null,
  "proxyCostEstimate": 0,
  "averageProxySuccessRate": 0
}
🎉 Migration completed successfully!
🔌 Disconnected from MongoDB
```

## Troubleshooting

### Common Issues:

1. **Connection failed**: Check your MongoDB connection string in `.env`
2. **Permission denied**: Ensure you have write access to the database
3. **No documents found**: This is normal if all documents already have the new fields

### Rollback:

If you need to rollback, you can manually remove the `proxyUsageStats` field from documents:

```javascript
// In MongoDB shell or Mongoose
db.crawls.updateMany({}, { $unset: { proxyUsageStats: 1 } });
```
