// API endpoint functions
// Purpose: High-level functions for each API endpoint

/**
 * Fetch video information
 * @param {ApiClient} client - API client instance
 * @param {string} targetUrl - YouTube URL
 * @returns {Promise<Object>} Video info
 */
async function fetchVideoInfo(client, targetUrl) {
  return await client.request('POST', '/api/video-info', { url: targetUrl });
}

/**
 * Fetch video transcript
 * @param {ApiClient} client - API client instance
 * @param {string} targetUrl - YouTube URL
 * @returns {Promise<Object>} Transcript data
 */
async function fetchTranscript(client, targetUrl) {
  return await client.request('POST', '/api/transcript', { url: targetUrl });
}

/**
 * Fetch video analysis
 * @param {ApiClient} client - API client instance
 * @param {Object} payload - Analysis payload
 * @returns {Promise<Object>} Analysis data
 */
async function fetchVideoAnalysis(client, payload) {
  return await client.request('POST', '/api/video-analysis', payload);
}

/**
 * Fetch video assembly
 * @param {ApiClient} client - API client instance
 * @param {Object} payload - Assembly payload
 * @returns {Promise<Object|null>} Assembly data or null on error
 */
async function fetchVideoAssembly(client, payload) {
  try {
    return await client.request('POST', '/api/video-assembly', payload);
  } catch (error) {
    console.warn('⚠️  Video assembly failed:', error.message);
    return {
      error: 'video-assembly failed',
      details: error.message,
    };
  }
}

/**
 * Construct payload for video-analysis or video-assembly
 * @param {Object} videoInfo - Video info response
 * @param {Object} transcript - Transcript response
 * @returns {Object} Payload object
 */
function constructPayload(videoInfo, transcript) {
  return {
    videoId: videoInfo.videoId || videoInfo.videoInfo?.videoId,
    videoInfo,
    transcript,
  };
}

module.exports = {
  fetchVideoInfo,
  fetchTranscript,
  fetchVideoAnalysis,
  fetchVideoAssembly,
  constructPayload,
};
