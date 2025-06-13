/**
 * Gemini API Keys Rotation Manager
 * 
 * This module manages multiple Gemini API keys with automatic rotation when rate limits are hit.
 * It provides a mechanism to cycle through available keys and allows time for rate-limited keys to reset.
 */

// Array of Gemini API keys
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY || 'AIzaSyAADeCP52o554AU2IrQFb9NeDruudFBYdM', // Default key
  // Add more Gemini API keys here if needed
].filter(key => key && key.trim() !== '');

// Default reset time in milliseconds (30 seconds = 30000 ms)
const DEFAULT_RESET_TIME_MS = 30000;

interface KeyStatus {
  key: string;
  isAvailable: boolean;
  lastUsed: number;
  resetTime: number;
}

// Initialize key status tracking
let keyStatusList: KeyStatus[] = GEMINI_API_KEYS.map(key => ({
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
export function getGeminiApiKey(): string {
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
export function markGeminiKeyAsRateLimited(key: string): void {
  const keyIndex = keyStatusList.findIndex(status => status.key === key);
  if (keyIndex !== -1) {
    keyStatusList[keyIndex].isAvailable = false;
    keyStatusList[keyIndex].lastUsed = Date.now();
    console.warn(`Gemini API key rate limited: ${key.substring(0, 10)}...`);
  }
}

/**
 * Add a new API key to the rotation
 * @param key The new API key to add
 */
export function addGeminiApiKey(key: string): void {
  // Check if the key already exists
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
 * Get the total number of API keys in the rotation
 * @returns The number of API keys
 */
export function getGeminiApiKeyCount(): number {
  return keyStatusList.length;
}

/**
 * Get the number of available API keys
 * @returns The number of available API keys
 */
export function getAvailableGeminiApiKeyCount(): number {
  return keyStatusList.filter(status => status.isAvailable).length;
}