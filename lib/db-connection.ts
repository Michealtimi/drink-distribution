import { prisma } from './prisma'

/**
 * Helper function to handle database operations with retry logic
 * Useful for handling connection errors with Neon and other serverless databases
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test connection first
      await prisma.$queryRaw`SELECT 1`
      // Execute the operation
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if it's a connection error
      const isConnectionError = 
        lastError.message.includes('Closed') ||
        lastError.message.includes('connection') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('timeout')

      if (isConnectionError && attempt < maxRetries) {
        console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        // Try to reconnect
        try {
          await prisma.$disconnect()
          await prisma.$connect()
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError)
        }
        continue
      }

      throw lastError
    }
  }

  throw lastError || new Error('Database operation failed after retries')
}

/**
 * Health check for database connection
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}
