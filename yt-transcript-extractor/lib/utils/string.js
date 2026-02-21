// String utility functions
// Purpose: String manipulation and sanitization

/**
 * Sanitize title for filename: replace spaces with dashes, limit length
 * @param {string} title - Video title
 * @param {number} maxLength - Maximum length (default: 80)
 * @returns {string} Safe filename
 */
function sanitizeTitle(title, maxLength = 80) {
  let safe = title
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and dashes
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Trim dashes from start/end
  
  if (safe.length > maxLength) {
    safe = safe.substring(0, maxLength).replace(/-+$/, '');
  }
  
  return safe || 'output';
}

/**
 * Format timestamp from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 200)
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

module.exports = {
  sanitizeTitle,
  formatTime,
  truncateText,
  extractVideoId,
};
