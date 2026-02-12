/**
 * Get current time in Philippine timezone (UTC+8)
 * Uses the Intl API for reliable timezone conversion.
 */
export function getPhilippineTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
}
