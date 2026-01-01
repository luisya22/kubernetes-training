/**
 * Utility for retrying operations with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: () => true // Retry all errors by default
};

/**
 * Retries an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxRetries || !opts.retryableErrors(lastError)) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Common retryable error patterns
 */
export const retryableErrors = {
  /**
   * Check if error is a network-related error (likely transient)
   */
  isNetworkError: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('econnrefused') ||
           message.includes('enotfound') ||
           message.includes('econnreset');
  },

  /**
   * Check if error is a temporary Kubernetes API error
   */
  isKubernetesAPIError: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('503') ||
           message.includes('502') ||
           message.includes('504') ||
           message.includes('service unavailable');
  },

  /**
   * Check if error is a transient Docker error
   */
  isDockerError: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('docker') &&
           (message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('temporary'));
  }
};

