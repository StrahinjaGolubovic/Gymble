/**
 * Structured logging utility
 * Provides consistent error logging with context
 */

export function logError(context: string, error: any, metadata?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error?.message || String(error);
  const stack = error?.stack;
  
  console.error(`[${timestamp}] [${context}]`, errorMessage);
  
  if (metadata) {
    console.error('  Metadata:', JSON.stringify(metadata, null, 2));
  }
  
  if (stack) {
    console.error('  Stack:', stack);
  }
}

export function logWarning(context: string, message: string, metadata?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [${context}]`, message);
  
  if (metadata) {
    console.warn('  Metadata:', JSON.stringify(metadata, null, 2));
  }
}

export function logInfo(context: string, message: string, metadata?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}]`, message);
  
  if (metadata) {
    try {
      console.log('  Metadata:', JSON.stringify(metadata, null, 2));
    } catch {
      console.log('  Metadata: [Unable to stringify]');
    }
  }
}
