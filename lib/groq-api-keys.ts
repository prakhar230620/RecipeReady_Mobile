/**
 * GROQ API Keys Rotation Manager
 * 
 * This module manages multiple GROQ API keys with automatic rotation when rate limits are hit.
 * It provides a mechanism to cycle through available keys and allows time for rate-limited keys to reset.
 */

// Array of GROQ API keys
const GROQ_API_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

// Default reset time in milliseconds (1.5 minutes = 90000 ms)
const DEFAULT_RESET_TIME_MS = 90000;

interface KeyStatus {
  key: string;
  isAvailable: boolean;
  lastUsed: number;
  resetTime: number;
}

// Initialize key status tracking
let keyStatusList: KeyStatus[] = GROQ_API_KEYS.map(key => ({
  key,
  isAvailable: true,
  lastUsed: 0,
  resetTime: DEFAULT_RESET_TIME_MS
}));

let currentKeyIndex = 0;

/**
 * Get the next available API key
 * @returns The next available API key
 */
export function getGroqApiKey(): string {
  const now = Date.now();
  
  // Check if the current key is available
  if (keyStatusList[currentKeyIndex].isAvailable) {
    const key = keyStatusList[currentKeyIndex].key;
    keyStatusList[currentKeyIndex].lastUsed = now;
    return key;
  }
  
  // Find the next available key
  for (let i = 0; i < keyStatusList.length; i++) {
    const index = (currentKeyIndex + i + 1) % keyStatusList.length;
    const keyStatus = keyStatusList[index];
    
    // If key is marked unavailable, check if it's reset time has passed
    if (!keyStatus.isAvailable) {
      if (now - keyStatus.lastUsed >= keyStatus.resetTime) {
        keyStatus.isAvailable = true;
      }
    }
    
    if (keyStatus.isAvailable) {
      currentKeyIndex = index;
      keyStatus.lastUsed = now;
      return keyStatus.key;
    }
  }
  
  // If all keys are unavailable, use the least recently used key
  const oldestKeyIndex = keyStatusList
    .map((status, index) => ({ index, lastUsed: status.lastUsed }))
    .sort((a, b) => a.lastUsed - b.lastUsed)[0].index;
  
  currentKeyIndex = oldestKeyIndex;
  keyStatusList[oldestKeyIndex].lastUsed = now;
  keyStatusList[oldestKeyIndex].isAvailable = true;
  
  return keyStatusList[oldestKeyIndex].key;
}

/**
 * Mark a key as rate limited
 * @param key The API key to mark as rate limited
 */
export function markKeyAsRateLimited(key: string): void {
  const keyIndex = keyStatusList.findIndex(status => status.key === key);
  if (keyIndex !== -1) {
    keyStatusList[keyIndex].isAvailable = false;
    keyStatusList[keyIndex].lastUsed = Date.now();
  }
}

/**
 * Add a new API key to the rotation
 * @param key The new API key to add
 */
export function addApiKey(key: string): void {
  // Check if key already exists
  if (!keyStatusList.some(status => status.key === key)) {
    keyStatusList.push({
      key,
      isAvailable: true,
      lastUsed: 0,
      resetTime: DEFAULT_RESET_TIME_MS
    });
  }
}

/**
 * Get all API keys and their status
 * @returns Array of key status objects
 */
export function getAllKeyStatus(): KeyStatus[] {
  return [...keyStatusList];
}

/**
 * Set a custom reset time for all keys
 * @param timeMs Reset time in milliseconds
 */
export function setResetTime(timeMs: number): void {
  if (timeMs > 0) {
    keyStatusList.forEach(status => {
      status.resetTime = timeMs;
    });
  }
}