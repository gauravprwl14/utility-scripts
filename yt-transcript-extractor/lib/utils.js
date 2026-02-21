// Utility functions for API calls, payload construction, and output handling
// Usage: makeApiCall, constructPayload, outputResult

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Makes an API call with given options
 * @param {Object} options - { method, url, headers, data, cookies }
 * @returns {Promise<Object>} response data
 */
async function makeApiCall(options) {
  try {
    const response = await axios({
      method: options.method,
      url: options.url,
      headers: options.headers,
      data: options.data,
      withCredentials: !!options.cookies,
    });
    return response.data;
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

/**
 * Constructs payload for video-analysis or video-assembly
 * @param {Object} videoInfo - Response from video-info
 * @param {Object} transcript - Response from transcript
 * @returns {Object} payload
 */
function constructPayload(videoInfo, transcript) {
  // Example: merge videoInfo and transcript
  return {
    videoId: videoInfo.videoId || videoInfo.videoInfo?.videoId,
    videoInfo,
    transcript,
  };
}

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
 * Combine transcript segments into full text
 * @param {Array} transcript - Transcript segments
 * @returns {string} Combined text
 */
function combineTranscript(transcript) {
  if (!transcript || !Array.isArray(transcript)) return '';
  return transcript.map(seg => seg.text).join(' ');
}

/**
 * Format timestamp from seconds
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time (HH:MM:SS or MM:SS)
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
 * Outputs result in specified format(s) in configurable directory
 * @param {Object} result - Data to write
 * @param {string} title - Video title for naming
 * @param {string} outDir - Output directory
 * @param {string|Array} formats - Format(s) to output: 'json', 'md', or ['json', 'md'] (default: 'md')
 */
function outputResult(result, title, outDir, formats = 'md') {
  const safeTitle = sanitizeTitle(title);
  const formatsArray = Array.isArray(formats) ? formats : [formats];
  
  fs.mkdirSync(outDir, { recursive: true });
  
  formatsArray.forEach(format => {
    const fileName = `${safeTitle}.${format}`;
    const filePath = path.join(outDir, fileName);
    
    if (fs.existsSync(filePath)) {
      console.warn(`Warning: Output file already exists, skipping: ${filePath}`);
      return;
    }
    
    let content;
    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
    } else if (format === 'md') {
      content = generateMarkdown(result);
      
      // Also create a .txt file with timestamped transcript
      const txtFileName = `${safeTitle}.txt`;
      const txtFilePath = path.join(outDir, txtFileName);
      
      if (!fs.existsSync(txtFilePath) && result.transcript) {
        const timestampedText = generateTimestampedTranscript(result.transcript);
        if (timestampedText) {
          fs.writeFileSync(txtFilePath, timestampedText, 'utf-8');
          console.log(`✅ Transcript written: ${txtFilePath}`);
        }
      }
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Output written: ${filePath}`);
  });
}

module.exports = { makeApiCall, constructPayload, outputResult, sanitizeTitle, combineTranscript, generateTimestampedTranscript };