# Environment-Aware Setup for Crawler

This setup allows the crawler to work in both local and production environments with different Redis/Bull versions.

## Package Versions

### Local Environment (Development)
- **Bull**: ^4.16.2
- **Redis**: ^4.7.0
- **Use Case**: Local development with Redis 6.x or 7.x

### Production Environment
- **Bull**: ^3.29.3
- **Redis**: ^3.1.2
- **Use Case**: Production servers with Redis 7.x (RESP3 compatibility)

## Automatic Detection

The code automatically detects which Bull version is installed and applies the appropriate configuration:

- **Bull 4.x**: Uses simplified Redis configuration with RESP2 compatibility
- **Bull 3.x**: Uses enhanced Redis configuration with connection retry logic

## Switching Between Environments

### Using the Switch Script

```bash
# Check current status
./switch-packages.sh status

# Switch to local environment (Bull 4.x, Redis 4.x)
./switch-packages.sh local

# Switch to production environment (Bull 3.x, Redis 3.x)
./switch-packages.sh production
```

### Manual Switching

1. **To Local Environment**:
   ```bash
   cp package.json.backup package.json
   npm install
   ```

2. **To Production Environment**:
   ```bash
   cp package.json.production package.json
   npm install
   ```

## Configuration Files

- `package.json.backup` - Original local packages (Bull 4.x, Redis 4.x)
- `package.json.production` - Production packages (Bull 3.x, Redis 3.x)
- `package.json` - Current active configuration

## Code Changes Made

### 1. Environment-Aware Queue Configuration (`getCrawlQueue.js`)
- Automatically detects Bull version
- Applies appropriate Redis configuration
- Handles both Bull 4.x and 3.x settings

### 2. Environment-Aware Worker (`worker.js`)
- Different connection logic for each Bull version
- Bull 4.x: Direct connection
- Bull 3.x: Connection retry mechanism with Redis ping

### 3. Environment-Aware Test Endpoints
- `/redis-test` - Tests Redis connection based on Bull version
- `/redis-health` - Health check with version-specific logic

## When to Use Each Environment

### Local Development
- Use `./switch-packages.sh local`
- Compatible with Redis 6.x and 7.x
- Simpler configuration
- Faster startup

### Production Deployment
- Use `./switch-packages.sh production`
- Optimized for Redis 7.x
- Enhanced error handling
- Connection retry logic
- Better stability in production

## Troubleshooting

### Redis Connection Issues
1. Check Redis server status: `redis-cli ping`
2. Verify environment variables: `REDIS_HOST`, `REDIS_PORT`
3. Test connection: `curl http://localhost:3002/redis-health`

### Package Version Conflicts
1. Check current status: `./switch-packages.sh status`
2. Switch to appropriate environment
3. Clear node_modules: `rm -rf node_modules && npm install`

### Bull Version Detection
- Check logs for "Bull version detected" message
- Verify package.json has correct versions
- Restart worker after package changes

## Migration Notes

When merging with your local branch:

1. **Keep the environment-aware logic** - it won't affect your local setup
2. **Use `./switch-packages.sh local`** to restore your original packages
3. **The code will automatically adapt** to your Bull/Redis versions
4. **No manual configuration changes needed** in your local environment

## Benefits

✅ **No breaking changes** to your local environment  
✅ **Automatic adaptation** to installed package versions  
✅ **Easy switching** between environments  
✅ **Production stability** with enhanced error handling  
✅ **Local development** remains unchanged  
✅ **Future-proof** for different Redis versions
