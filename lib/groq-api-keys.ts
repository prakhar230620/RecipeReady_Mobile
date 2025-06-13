/**
 * GROQ API Keys Rotation Manager
 * 
 * This module manages multiple GROQ API keys with automatic rotation when rate limits are hit.
 * It provides a mechanism to cycle through available keys and allows time for rate-limited keys to reset.
 */

// Maps to track API key usage and rate limiting
const rateLimitedKeys = new Set<string>();
const rateLimitResetTimes = new Map<string, number>();
const keyUsageTimestamps = new Map<string, number>();

// Default reset time in milliseconds (60 seconds = 60000 ms)
const DEFAULT_RESET_TIME_MS = 60000;

// Fallback API keys in case environment variables are not set
// Add multiple fallback keys here to ensure the application works even if some keys are rate limited
// IMPORTANT: Hardcoding keys directly in the code is NOT recommended for production environments.
// For better security, use environment variables (e.g., in a .env file) and ensure .env is in .gitignore.
const FALLBACK_GROQ_API_KEYS = [
  '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', // Add more keys as needed
];

/**
 * Get all available API keys
 * @returns Array of all API keys
 */
export function getAllGroqApiKeys(): string {
  // First try to get keys from environment variables
  const envKeys = [];
  
  // Try to get the main GROQ_API_KEY
  const mainKey = process.env.GROQ_API_KEY;
  if (mainKey) envKeys.push(mainKey);
  
  // Try to get additional numbered keys
  for (let i = 2; i <= 20; i++) {
    const key = process.env[`GROQ_API_KEY${i}`];
    if (key) envKeys.push(key);
  }

  // If we have keys from environment, use those
  if (envKeys.length > 0) {
    const validEnvKeys = envKeys.filter(key => key && key.trim() !== '' && key.startsWith('gsk_'));
    if (validEnvKeys.length > 0) {
      console.log(`Using ${validEnvKeys.length} environment variable API keys`);
      return validEnvKeys[0] || '';
    }
  }

  // Otherwise use fallback keys
  console.log('Using fallback API keys');
  return FALLBACK_GROQ_API_KEYS.filter(key => key && key.trim() !== '' && key.startsWith('gsk_'))[0] || '';
}

// Check and reset any rate-limited keys that have passed their reset time
function checkAndResetRateLimitedKeys() {
  const now = Date.now();
  const keysToReset = [];

  for (const [key, resetTime] of rateLimitResetTimes.entries()) {
    if (now >= resetTime) {
      keysToReset.push(key);
    }
  }

  for (const key of keysToReset) {
    console.log(`Resetting previously rate-limited key: ${key.substring(0, 10)}...`);
    rateLimitedKeys.delete(key);
    rateLimitResetTimes.delete(key);
  }
}

/**
 * Get the next available API key
 * @returns The next available API key
 */
export function getGroqApiKey(): string {
  // First check if any rate-limited keys can be reset
  checkAndResetRateLimitedKeys();

  // Get all keys
  const allKeys = getAllGroqApiKeys();
  
  if (allKeys.length === 0) {
    console.error("No valid Groq API keys available");
    return "";
  }

  // Find the next available key
  const availableKeys = [allKeys].filter(key => !rateLimitedKeys.has(key));
  
  if (availableKeys.length > 0) {
    // Use the next available key
    const nextKey = availableKeys[0];
    keyUsageTimestamps.set(nextKey, Date.now());
    console.log(`Using Groq API key: ${nextKey.substring(0, 10)}...`);
    return nextKey;
  }

  // If all keys are rate limited, use the least recently used key
  const oldestKey = [...rateLimitedKeys].sort((a, b) => {
    return (rateLimitResetTimes.get(a) || 0) - (rateLimitResetTimes.get(b) || 0);
  })[0];

  if (oldestKey) {
    console.log(`All keys rate limited, using oldest key: ${oldestKey.substring(0, 10)}...`);
    keyUsageTimestamps.set(oldestKey, Date.now());
    return oldestKey;
  }

  console.error("No Groq API keys available");
  return "";
}

/**
 * Mark an API key as rate limited
 * @param key The API key to mark as rate limited
 * @param resetTimeMs Optional custom reset time in milliseconds
 */
export function markKeyAsRateLimited(key: string, resetTimeMs: number = DEFAULT_RESET_TIME_MS): void {
  if (!key || key.trim() === '') return;
  
  console.log(`Marking key as rate limited: ${key.substring(0, 10)}... for ${resetTimeMs}ms`);
  rateLimitedKeys.add(key);
  rateLimitResetTimes.set(key, Date.now() + resetTimeMs);
}