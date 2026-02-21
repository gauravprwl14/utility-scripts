// Markdown generation utilities
// Purpose: Generate markdown and text output from API data

const { formatTime } = require('../utils/string');

/**
 * Combine transcript segments into full text
 * @param {Array} transcript - Transcript segments
 * @returns {string} Combined text
 */
function combineTranscript(transcript) {
  if (!transcript || !Array.isArray(transcript)) return '';
  return transcript.map(seg => seg.text).join(' ');
}

/**
 * Generate timestamped transcript text
 * @param {Object} transcript - Transcript object with transcript array
 * @returns {string} Timestamped transcript text
 */
function generateTimestampedTranscript(transcript) {
  if (!transcript || !transcript.transcript || !Array.isArray(transcript.transcript)) {
    return '';
  }
  
  let text = '';
  transcript.transcript.forEach((seg) => {
    const timestamp = formatTime(seg.start);
    text += `[${timestamp}] ${seg.text}\n\n`;
  });
  
  return text;
}

/**
 * Generate Markdown content from result
 * @param {Object} result - Data to format
 * @returns {string} Markdown formatted content
 */
function generateMarkdown(result) {
  const { videoInfo, transcript, videoAnalysis, videoAssembly, targetUrl, gatheredAt } = result;
  
  let md = '';
  
  // Title
  md += `# ${videoInfo.title || videoInfo.videoInfo?.title || 'Video Transcript'}\n\n`;
  
  // Metadata
  md += `## Metadata\n\n`;
  md += `- **Author**: ${videoInfo.author || videoInfo.videoInfo?.author || 'Unknown'}\n`;
  md += `- **Video ID**: ${videoInfo.videoId || videoInfo.videoInfo?.videoId || 'N/A'}\n`;
  md += `- **Duration**: ${formatTime(videoInfo.duration || videoInfo.videoInfo?.duration || 0)}\n`;
  md += `- **URL**: [Watch on YouTube](${targetUrl})\n`;
  md += `- **Thumbnail**: ![Thumbnail](${videoInfo.thumbnail || videoInfo.videoInfo?.thumbnail || ''})\n`;
  md += `- **Gathered**: ${new Date(gatheredAt).toLocaleString()}\n\n`;
  
  // Tags
  if (videoInfo.tags && videoInfo.tags.length > 0) {
    md += `**Tags**: ${videoInfo.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
  }
  
  // Description
  if (videoInfo.description) {
    md += `## Description\n\n${videoInfo.description}\n\n`;
  }
  
  // Analysis (if available)
  if (videoAnalysis && !videoAnalysis.error) {
    md += `## Video Analysis\n\n\`\`\`json\n${JSON.stringify(videoAnalysis, null, 2)}\n\`\`\`\n\n`;
  } else if (videoAnalysis && videoAnalysis.error) {
    md += `## Video Analysis\n\n*Analysis failed: ${videoAnalysis.details || videoAnalysis.message || 'Unknown error'}*\n\n`;
  }
  
  // Assembly (if available)
  if (videoAssembly && !videoAssembly.error) {
    md += `## Video Assembly\n\n\`\`\`json\n${JSON.stringify(videoAssembly, null, 2)}\n\`\`\`\n\n`;
  }
  
  // Full Transcript
  if (transcript && transcript.transcript) {
    const fullText = combineTranscript(transcript.transcript);
    md += `## Full Transcript\n\n${fullText}\n\n`;
  }
  
  // Transcript with Timestamps
  if (transcript && transcript.transcript && Array.isArray(transcript.transcript)) {
    md += `## Transcript with Timestamps\n\n`;
    transcript.transcript.forEach((seg, idx) => {
      const timestamp = formatTime(seg.start);
      md += `**[${timestamp}]** ${seg.text}\n\n`;
    });
  }
  
  return md;
}

/**
 * Extract summary from video analysis or assembly
 * @param {Object} videoAnalysis - Video analysis data
 * @param {Object} videoAssembly - Video assembly data
 * @returns {string|null} Summary text or null
 */
function extractSummary(videoAnalysis, videoAssembly) {
  // Try to find summary in various possible locations
  if (videoAnalysis && !videoAnalysis.error) {
    if (videoAnalysis.summary) return videoAnalysis.summary;
    if (videoAnalysis.keyTakeaways) return videoAnalysis.keyTakeaways;
  }
  
  if (videoAssembly && !videoAssembly.error) {
    if (videoAssembly.summary) return videoAssembly.summary;
    if (videoAssembly.keyPoints) return videoAssembly.keyPoints;
  }
  
  return null;
}

module.exports = {
  combineTranscript,
  generateTimestampedTranscript,
  generateMarkdown,
  extractSummary,
};
