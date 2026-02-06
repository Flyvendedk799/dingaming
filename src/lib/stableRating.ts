/**
 * Generate a stable pseudo-random rating based on a product ID or name.
 * Returns a value between 4.5 and 5.0
 */
export function getStableRating(identifier: string): number {
  // Simple hash function to get a consistent number from a string
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Normalize to 0-1 range
  const normalized = Math.abs(hash) / 2147483647;
  
  // Return rating between 4.5 and 5.0
  return 4.5 + (normalized * 0.5);
}
