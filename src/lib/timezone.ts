/**
 * Get current time in Philippine timezone (UTC+8)
 */
export function getPhilippineTime(): Date {
  const now = new Date();
  // Get UTC time, then add 8 hours for Philippines
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const philippineTime = new Date(utc + 8 * 60 * 60 * 1000);
  return philippineTime;
}
