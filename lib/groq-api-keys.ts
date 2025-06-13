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
const FALLBACK_GROQ_API_KEYS = [
  process.env.GROQ_API_KEY || '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',
  
];

/**
 * Get all available API keys
 * @returns Array of all API keys
 */
export function getAllGroqApiKeys(): string[] {
  // First try to get keys from environment variables
  const envKeys = [];
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GROQ_API_KEY${i === 1 ? '' : i}`];
    if (key) envKeys.push(key);
  }

  // If we have keys from environment, use those
  if (envKeys.length > 0) {
    return envKeys.filter(key => key && key.trim() !== '' && key.startsWith('gsk_'));
  }

  // Otherwise use fallback keys
  return FALLBACK_GROQ_API_KEYS.filter(key => key && key.trim() !== '' && key.startsWith('gsk_'));
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
  const availableKeys = allKeys.filter(key => !rateLimitedKeys.has(key));
  
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
 */
export function markKeyAsRateLimited(key: string) {
  if (!key || key.trim() === '') return;
  
  rateLimitedKeys.add(key);
  // Set the reset time to 60 seconds from now
  const resetTime = Date.now() + DEFAULT_RESET_TIME_MS;
  rateLimitResetTimes.set(key, resetTime);
  console.log(`Marked key as rate limited: ${key.substring(0, 10)}... (will reset in 60s)`);
}