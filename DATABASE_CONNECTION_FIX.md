# Database Connection Fix

## Problem

PostgreSQL connection errors: `Error { kind: Closed, cause: None }`

This typically happens with Neon databases when:
1. Database is paused (Neon free tier pauses after inactivity)
2. Connection pool is exhausted
3. Connection timeout occurs
4. Network issues

## Solutions Applied

### 1. Fixed `.env` File
- Removed extra quote character
- Added connection pool parameters:
  - `connection_limit=10` - Limits concurrent connections
  - `pool_timeout=20` - Connection timeout in seconds

### 2. Enhanced Prisma Client (`lib/prisma.ts`)
- Added graceful connection handling
- Added proper shutdown handlers
- Prevents multiple Prisma instances in development

### 3. Database Retry Helper (`lib/db-connection.ts`)
- Created `withDbRetry()` function for automatic retry on connection errors
- Created `checkDbConnection()` for health checks
- Handles connection errors gracefully

## How to Use

### For API Routes

Wrap database operations with retry logic:

```typescript
import { withDbRetry } from '@/lib/db-connection'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const leads = await withDbRetry(async () => {
      return await prisma.lead.findMany()
    })
    return NextResponse.json(leads)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
```

### For Background Jobs

Check connection before running:

```typescript
import { checkDbConnection } from '@/lib/db-connection'

async function runJob() {
  const isConnected = await checkDbConnection()
  if (!isConnected) {
    console.error('Database not connected, skipping job')
    return
  }
  // ... run job
}
```

## Neon-Specific Fixes

### If Database is Paused

1. **Wake up database**: Visit your Neon dashboard
2. **Use direct connection**: Replace `-pooler` with direct endpoint (if available)
3. **Add keep-alive**: Set up a cron job to ping database every 5 minutes

### Connection String Format

**Pooler (Recommended for serverless):**
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require&connection_limit=10&pool_timeout=20
```

**Direct (For long-running processes):**
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
```

## Testing Connection

### Check if database is accessible:

```bash
# Test connection
npx prisma db pull
```

### In code:

```typescript
import { checkDbConnection } from '@/lib/db-connection'

const isConnected = await checkDbConnection()
console.log('Database connected:', isConnected)
```

## Common Issues

### 1. "Connection Closed" Errors

**Cause**: Database paused or connection timeout
**Fix**: 
- Wake database in Neon dashboard
- Use retry logic
- Increase `pool_timeout`

### 2. Too Many Connections

**Cause**: Connection pool exhausted
**Fix**:
- Reduce `connection_limit`
- Ensure connections are properly closed
- Use connection pooling

### 3. Connection Timeout

**Cause**: Slow network or database overload
**Fix**:
- Increase `pool_timeout` in connection string
- Use retry logic
- Check network connectivity

## Best Practices

1. **Always use retry logic** for critical operations
2. **Check connection** before long-running jobs
3. **Close connections** properly in background jobs
4. **Monitor connection errors** in logs
5. **Use connection pooling** for serverless environments

## Next Steps

1. Restart your dev server: `pnpm dev`
2. Test database connection
3. Monitor for connection errors
4. If issues persist, check Neon dashboard for database status
