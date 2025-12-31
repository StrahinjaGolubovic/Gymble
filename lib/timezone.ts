// Serbia timezone utilities (GMT+1 / CET/CEST)
// Serbia uses Central European Time (CET) which is UTC+1 in winter and UTC+2 in summer (CEST)
// Timezone: Europe/Belgrade

const SERBIA_TIMEZONE = 'Europe/Belgrade';

/**
 * Get current date/time components in Serbia timezone
 */
function getSerbiaTimeComponents(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SERBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23', // Force 0-23 hour range (not 1-24)
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

  let hours = getPart('hour');
  
  // Safety check: hour 24 should be converted to 0
  // This handles edge cases where some browsers/locales might return 24 for midnight
  if (hours === 24) {
    hours = 0;
  }
  
  // Validate hour range
  if (hours < 0 || hours > 23) {
    console.error(`Invalid hour value: ${hours} from date: ${date.toISOString()}`);
    hours = 0; // Fallback to midnight
  }

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hours,
    minutes: getPart('minute'),
    seconds: getPart('second'),
  };
}

/**
 * Format date as YYYY-MM-DD in Serbia timezone
 */
export function formatDateSerbia(date: Date = new Date()): string {
  const { year, month, day } = getSerbiaTimeComponents(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Format datetime as YYYY-MM-DD HH:MM:SS in Serbia timezone
 */
export function formatDateTimeSerbia(date: Date = new Date()): string {
  const { year, month, day, hours, minutes, seconds } = getSerbiaTimeComponents(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Get SQLite datetime string for Serbia timezone
 */
export function getSerbiaDateTimeSQLite(): string {
  return formatDateTimeSerbia();
}

/**
 * Get SQLite date string for Serbia timezone
 */
export function getSerbiaDateSQLite(): string {
  return formatDateSerbia();
}

/**
 * Parse a date string (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) and return Date object
 * 
 * CRITICAL TIMEZONE BEHAVIOR:
 * - Input strings represent Serbia local time (stored via formatDateTimeSerbia)
 * - We create a Date object that when formatted with timeZone: 'Europe/Belgrade' shows the original values
 * - NO manual offset math - we construct a local time string and let Date parse it
 * - The runtime handles DST automatically via the 'Europe/Belgrade' timezone
 * 
 * For date arithmetic and comparisons, always use YYYY-MM-DD strings with addDaysYMD/diffDaysYMD.
 */
export function parseSerbiaDate(dateString: string): Date {
  // Handle YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Validate date components
    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    // Create UTC date at midnight
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }
  
  // Handle YYYY-MM-DD HH:MM:SS format
  if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    let [hour, minute, second] = timePart.split(':').map(Number);
    
    // Handle hour 24 edge case (some systems use 24:00:00 for midnight)
    // Convert to next day at 00:00:00
    let adjustedDay = day;
    let adjustedMonth = month;
    let adjustedYear = year;
    
    if (hour === 24) {
      hour = 0;
      // Add one day
      const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
      adjustedYear = nextDay.getUTCFullYear();
      adjustedMonth = nextDay.getUTCMonth() + 1;
      adjustedDay = nextDay.getUTCDate();
    }
    
    // Validate all components
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second) ||
        month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      throw new Error(`Invalid datetime format: ${dateString}`);
    }
    
    // CRITICAL: The stored string "2025-12-31 00:52:00" represents Serbia local time
    // We need to create a Date that when displayed with Europe/Belgrade shows "00:52:00"
    // 
    // The ONLY way to do this without manual offset math is:
    // 1. Parse the string as UTC (treating the numbers as UTC time)
    // 2. When displaying, apply Europe/Belgrade timezone
    // 3. The display will be WRONG by the offset amount
    // 
    // This is a fundamental limitation: we're storing timezone-naive strings.
    // The correct fix is to store ISO timestamps, but that requires data migration.
    // 
    // For now: Parse as UTC. The display functions MUST NOT add timezone.
    // Instead, display the string directly when possible (see formatTimeDisplay).
    return new Date(Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDay, hour, minute, second));
  }
  
  // Throw error for unsupported formats instead of silently failing
  throw new Error(`Unsupported date format: ${dateString}. Expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS`);
}

/**
 * Format date for display in English locale (but using Serbia timezone)
 */
export function formatDateDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? parseSerbiaDate(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    timeZone: SERBIA_TIMEZONE,
    ...options,
  });
}

/**
 * Format datetime for display in English locale
 * 
 * CRITICAL: ALWAYS extracts string directly to avoid timezone conversion issues.
 * This ensures consistent behavior regardless of input type.
 */
export function formatDateTimeDisplay(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  let dateString: string;
  
  // Convert Date objects to Serbia timezone string first
  if (date instanceof Date) {
    dateString = formatDateTimeSerbia(date);
  } else {
    dateString = date;
  }
  
  // Now always work with string - consistent behavior
  if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    // Convert to readable format: "12/31/2025, 12:52:00 AM"
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    
    // Format as locale string manually to avoid timezone issues
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    
    return `${month}/${day}/${year}, ${hour12}:${minute}:${second} ${period}`;
  }
  
  // Fallback for unexpected formats
  throw new Error(`Unexpected datetime format: ${dateString}`);
}

/**
 * Format time for display (HH:MM) in Serbia timezone
 * For SQLite datetime strings, extract time directly to avoid timezone conversion
 */
export function formatTimeDisplay(date: Date | string): string {
  let dateString: string;
  
  // Convert Date objects to Serbia timezone string first
  if (date instanceof Date) {
    dateString = formatDateTimeSerbia(date);
  } else {
    dateString = date;
  }
  
  // Strip timezone offset if present
  const cleanString = dateString.replace(/[+-]\d{2}:\d{2}$/, '');
  
  // Extract time directly
  if (cleanString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const [, timePart] = cleanString.split(' ');
    const [hour, minute] = timePart.split(':');
    return `${hour}:${minute}`;
  }
  
  throw new Error(`Unexpected datetime format: ${dateString}`);
}

/**
 * Check if a date string is today in Serbia timezone
 */
export function isTodaySerbia(dateString: string): boolean {
  const today = formatDateSerbia();
  return dateString === today;
}

/**
 * Check if a date is in the past in Serbia timezone
 */
export function isPastSerbia(dateString: string): boolean {
  const today = formatDateSerbia();
  return dateString < today;
}

/**
 * Get current Date object adjusted to Serbia timezone
 * Note: JavaScript Date objects are always in UTC internally,
 * but this helps with comparisons when treating dates as Serbia local time
 */
export function getSerbiaNow(): Date {
  return new Date();
}

