/**
 * Formats a number as Indian Rupees with proper number formatting
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted string with ₹ symbol and Indian number format
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  
  return formatted;
}

/**
 * Formats a number in Indian number system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted string with K, L, or Cr suffix
 */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    // Crores
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    // Lakhs
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    // Thousands
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

/**
 * Formats a date in dd-mmm-yyyy format (e.g., 15-Jan-2024)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Formats a date in Indian format (DD/MM/YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string
 * @deprecated Use formatDate for dd-mmm-yyyy format instead
 */
export function formatIndianDate(date: string | Date): string {
  return formatDate(date);
}

/**
 * Formats a date with time in Indian format (DD/MM/YYYY, HH:MM AM/PM)
 * @param date - Date string or Date object
 * @returns Formatted datetime string
 */
export function formatIndianDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatIndianDate(d);
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${dateStr}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a relative time in Indian context (e.g., "2 hours ago", "Yesterday")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatIndianDate(d);
}
