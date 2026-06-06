/**
 * OrderFlow — Display Formatters
 */

/**
 * Format a timestamp as a short time string — e.g. "2:30 PM"
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Format a timestamp as a readable date — e.g. "25 May 2026"
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Relative time label — e.g. "10 mins ago", "2 hrs ago", "Yesterday"
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  try {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;

    if (diffMs < 0) return 'just now';

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return formatDate(timestamp);
  } catch {
    return '';
  }
}

/**
 * Render an items array as a readable string — e.g. "200 Bucket, 50 Mug"
 * @param {{ product: string, quantity: number }[]} items
 * @returns {string}
 */
export function formatItemsReadable(items) {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items.map((i) => `${i.quantity} ${i.product}`).join(', ');
}

/**
 * Generate a unique order ID — timestamp + 4 random digits.
 * @returns {string} e.g. "1748108898123-4821"
 */
export function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `${ts}-${rand}`;
}
