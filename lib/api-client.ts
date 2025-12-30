// API client with exponential backoff for 429 responses
// Prevents rate limit errors by automatically retrying with increasing delays

interface FetchOptions extends RequestInit {
  skipRetry?: boolean;
}

interface RetryState {
  attempt: number;
  backoffMs: number;
}

const retryState = new Map<string, RetryState>();

/**
 * Fetch with automatic exponential backoff for 429 responses
 * 
 * @param url - API endpoint to call
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Response or throws error
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipRetry, ...fetchOptions } = options;
  const key = `${options.method || 'GET'}:${url}`;
  
  // Get or initialize retry state for this endpoint
  let state = retryState.get(key);
  if (!state) {
    state = { attempt: 0, backoffMs: 1000 };
    retryState.set(key, state);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // If 429 (Too Many Requests), apply exponential backoff
    if (response.status === 429 && !skipRetry) {
      state.attempt++;
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
      const delay = Math.min(state.backoffMs * Math.pow(2, state.attempt - 1), 16000);
      
      console.warn(`[API] 429 Too Many Requests for ${url}. Retrying in ${delay}ms (attempt ${state.attempt})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return fetchWithRetry(url, { ...options, skipRetry: false });
    }

    // Success - reset retry state
    if (response.ok) {
      state.attempt = 0;
      state.backoffMs = 1000;
    }

    return response;
  } catch (error) {
    // Network error - don't retry indefinitely
    if (state.attempt < 3) {
      state.attempt++;
      const delay = 2000;
      console.warn(`[API] Network error for ${url}. Retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, { ...options, skipRetry: false });
    }
    throw error;
  }
}

/**
 * Throttle function calls to prevent excessive API requests
 * 
 * @param fn - Function to throttle
 * @param delayMs - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delayMs) {
      // Enough time has passed, call immediately
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Too soon, schedule for later
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delayMs - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function calls to prevent rapid-fire requests
 * 
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}
