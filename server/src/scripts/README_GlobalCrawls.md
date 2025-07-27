# Global Crawls Script

This script automates the process of running all enabled crawls and exporting the results to Google Sheets.

## Features

- **Automated Crawl Execution**: Runs all enabled crawls automatically
- **Concurrency Control**: Limits concurrent crawls to prevent overload
- **Progress Monitoring**: Tracks crawl progress and completion status
- **Google Sheets Export**: Automatically exports results to Google Sheets
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Error Handling**: Robust error handling and recovery
- **Configurable**: Environment-based configuration

## Usage

### Basic Usage

```bash
# Run from the server directory
npm run run-global-crawls

# Or run directly
node src/scripts/runGlobalCrawls.js
```

### Environment Variables

Configure the script behavior using environment variables:

```bash
# API Configuration
API_BASE_URL=http://localhost:3000          # Your API server URL
WORKER_URL=http://localhost:3002            # Your worker server URL

# Crawl Settings
MAX_WAIT_TIME=1800000                       # Max wait time in milliseconds (30 min default)
CHECK_INTERVAL=10000                        # Status check interval in milliseconds (10 sec default)
MAX_CONCURRENT_CRAWLS=5                     # Max concurrent crawls (5 default)

# Export Settings
EXPORT_TO_GOOGLE_SHEETS=true                # Enable/disable Google Sheets export
INCLUDE_UNCHANGED=false                     # Include unchanged data in export

# Logging
LOG_LEVEL=info                              # Log level: debug, info, warn, error
LOG_FILE=/path/to/logfile.log              # Optional log file path
```

## Deployment Scenarios

### Local Development

1. **Setup Environment**:

   ```bash
   # Create .env file with your configuration
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Run Manually**:

   ```bash
   npm run run-global-crawls
   ```

3. **Windows Task Scheduler** (for daily runs):
   ```powershell
   # Create a scheduled task
   schtasks /create /tn "GlobalCrawls" /tr "cd C:\path\to\crawler\server && npm run run-global-crawls" /sc daily /st 02:00
   ```

### VPS (Hostinger) Deployment

1. **Setup Environment**:

   ```bash
   # SSH into your VPS
   ssh user@your-vps.com

   # Navigate to project directory
   cd /path/to/crawler/server

   # Create .env file
   nano .env
   ```

2. **Linux Cron Job** (recommended for VPS):

   ```bash
   # Edit crontab
   crontab -e

   # Add daily execution at 2 AM
   0 2 * * * cd /path/to/crawler/server && npm run run-global-crawls >> /var/log/global-crawls.log 2>&1
   ```

3. **PM2 with Cron** (alternative):

   ```bash
   # Install PM2
   npm install -g pm2

   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'global-crawls',
       script: 'src/scripts/runGlobalCrawls.js',
       cron_restart: '0 2 * * *',
       autorestart: false,
       watch: false
     }]
   }
   EOF

   # Start with PM2
   pm2 start ecosystem.config.js
   ```

## Script Flow

1. **Database Connection**: Connects to MongoDB
2. **Fetch Enabled Crawls**: Gets all non-disabled crawls
3. **Start Crawls**: Initiates crawls with concurrency control
4. **Monitor Progress**: Checks crawl status until completion
5. **Export Results**: Exports to Google Sheets (if enabled)
6. **Generate Summary**: Provides execution summary

## Output

The script provides detailed output including:

- Crawl start results (started, failed, skipped)
- Progress monitoring
- Final status counts
- Google Sheets export results
- Execution time and summary

### Example Output

```
[2024-01-15T02:00:00.000Z] [INFO] === Starting Global Crawl Execution ===
[2024-01-15T02:00:00.100Z] [INFO] Connected to MongoDB
[2024-01-15T02:00:00.200Z] [INFO] Found 3 enabled crawls
[2024-01-15T02:00:00.300Z] [INFO] Starting crawl: Amazon Crawl (507f1f77bcf86cd799439011)
[2024-01-15T02:00:00.400Z] [INFO] Crawl started successfully: Amazon Crawl
[2024-01-15T02:00:00.500Z] [INFO] Waiting for 3 crawls to complete...
[2024-01-15T02:05:30.000Z] [INFO] All crawls completed successfully!
[2024-01-15T02:05:30.100Z] [INFO] Starting Google Sheets export...
[2024-01-15T02:05:35.000Z] [INFO] Google Sheets export completed successfully
[2024-01-15T02:05:35.100Z] [INFO] === Global Crawl Execution Completed ===
```

## Error Handling

The script handles various error scenarios:

- **Database connection failures**: Retries and logs errors
- **Crawl start failures**: Continues with other crawls
- **Timeout scenarios**: Logs warning and continues
- **Google Sheets export failures**: Logs error but doesn't fail the script

## Monitoring

### Log Files

For production deployments, consider redirecting output to log files:

```bash
# Add to cron job
npm run run-global-crawls >> /var/log/global-crawls.log 2>&1
```

### Health Checks

Monitor script execution:

```bash
# Check if script is running
ps aux | grep runGlobalCrawls

# Check recent logs
tail -f /var/log/global-crawls.log
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:

   - Check MongoDB is running
   - Verify connection string in .env

2. **API Connection Failed**:

   - Ensure API server is running
   - Check API_BASE_URL configuration

3. **Google Sheets Export Failed**:

   - Verify OAuth2 credentials
   - Check Google Sheets permissions

4. **Crawls Not Starting**:
   - Check worker server is running
   - Verify Redis connection
   - Check crawl configuration

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run run-global-crawls
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in .env files
2. **File Permissions**: Restrict access to log files
3. **Network Security**: Use HTTPS for API calls in production
4. **Credentials**: Secure Google OAuth2 credentials

## Performance Tuning

Adjust these settings based on your infrastructure:

- `MAX_CONCURRENT_CRAWLS`: Increase for more powerful servers
- `CHECK_INTERVAL`: Decrease for faster status updates
- `MAX_WAIT_TIME`: Increase for large crawl sets
