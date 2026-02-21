// Main runner script for sequential API calls
// Usage: node main.js --url=<youtube_url> --token=<token> --outDir=<output_dir>

// Load environment variables from .env file
require('dotenv').config();

const { getConfig } = require('./lib/config');
const { makeApiCall, constructPayload, outputResult } = require('./lib/utils');
const path = require('path');

/**
 * Helper to get argument value
 */
function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

/**
 * Parse format argument: json, md, or both
 * @returns {string|Array} Format(s) to output
 */
function getOutputFormat() {
  const formatArg = getArg('format') || process.env.OUTPUT_FORMAT || 'md';
  
  if (formatArg === 'both') {
    return ['json', 'md'];
  }
  
  return formatArg;
}

/**
 * Consolidated function to gather all data and handle errors
 */
async function gatherAllData(config, outDir) {
  const { baseUrl } = config;
  // Allow targetUrl and token override via arguments
  const targetUrl = getArg('url') || config.targetUrl;
  const token = getArg('token') || config.token;

  // Headers template
  const commonHeaders = {
    'accept': '*/*',
    'accept-language': 'en-GB,en;q=0.7',
    'content-type': 'application/json',
    'origin': baseUrl,
    'referer': `${baseUrl}/analyze?url=${encodeURIComponent(targetUrl)}`,
    'user-agent': 'Mozilla/5.0 (Linux; Intel Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'cookie': `tldw_guest_token=${token}`,
  };

  // Step 1: video-info & transcript in parallel
  let videoInfo, transcript;
  try {
    [videoInfo, transcript] = await Promise.all([
      makeApiCall({
        method: 'POST',
        url: `${baseUrl}/api/video-info`,
        headers: commonHeaders,
        data: { url: targetUrl },
      }),
      makeApiCall({
        method: 'POST',
        url: `${baseUrl}/api/transcript`,
        headers: commonHeaders,
        data: { url: targetUrl },
      })
    ]);
  } catch (err) {
    return {
      error: 'Failed to fetch video-info or transcript',
      details: err.message,
    };
  }

  // Step 2: video-analysis
  let videoAnalysis = null;
  let analysisPayload = constructPayload(videoInfo, transcript);
  try {
    videoAnalysis = await makeApiCall({
      method: 'POST',
      url: `${baseUrl}/api/video-analysis`,
      headers: commonHeaders,
      data: analysisPayload,
    });
  } catch (err) {
    // Handle 401 or other errors
    if (err.response && err.response.status === 401) {
      videoAnalysis = {
        error: 'Unauthorized',
        message: 'You have used your free preview. Create a free account for 3 videos/month or upgrade for more.',
        requiresAuth: true,
        redirectTo: '/?auth=signup',
        creditsMessage: 'This one is on us; no credits used.',
        noCreditsUsed: true,
      };
    } else {
      videoAnalysis = {
        error: 'video-analysis failed',
        details: err.message,
      };
    }
  }

  // Step 3: video-assembly (optional)
  let videoAssembly = null;
  try {
    videoAssembly = await makeApiCall({
      method: 'POST',
      url: `${baseUrl}/api/video-assembly`,
      headers: commonHeaders,
      data: analysisPayload,
    });
  } catch (err) {
    videoAssembly = {
      error: 'video-assembly failed',
      details: err.message,
    };
  }

  // Consolidated result
  const title = videoInfo.title || videoInfo.videoInfo?.title || 'output';
  const result = {
    videoInfo,
    transcript,
    videoAnalysis,
    videoAssembly,
    targetUrl,
    gatheredAt: new Date().toISOString(),
  };
  
  // Get output format from argument or default to markdown
  const format = getOutputFormat();
  outputResult(result, title, outDir, format);
  return result;
}

/**
 * Main runner - orchestrates API calls in sequence, handles config, outputs result
 */
async function main() {
  // Load config
  const config = getConfig(process.argv);
  const outDir = config.outputDir;

  try {
    const result = await gatherAllData(config, outDir);
    if (result.error) {
      console.error('Error:', result.error, result.details || '');
      process.exit(1);
    }
    console.log('✅ Data gathered and output written.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run the script
main();
