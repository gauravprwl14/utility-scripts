// Main runner script for sequential API calls
// Usage: node main.js --url=<youtube_url> --token=<token> --outDir=<output_dir>

// Load environment variables from .env file
require('dotenv').config();

const path = require('path');
const { getConfig } = require('./lib/config');
const { ApiClient } = require('./lib/api/client');
const { fetchVideoInfo, fetchTranscript, fetchVideoAnalysis, fetchVideoAssembly, constructPayload } = require('./lib/api/endpoints');
const { generateMarkdown, generateTimestampedTranscript, extractSummary } = require('./lib/formatters/markdown');
const { appendIndexEntry } = require('./lib/formatters/index');
const { sanitizeTitle } = require('./lib/utils/string');
const { ensureDirectoryExists, writeFile } = require('./lib/utils/file');

/**
 * Helper to get argument value
 */
function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return undefined;
  
  // Remove the --name= prefix, keeping everything after (handles URLs with = in them)
  const prefix = `--${name}=`;
  return arg.slice(prefix.length);
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
async function gatherAllData(client, targetUrl) {
  console.log('🚀 Starting data extraction...');

  // Step 1: Fetch video-info & transcript in parallel
  let videoInfo, transcript;
  try {
    console.log('📥 Fetching video info and transcript...');
    [videoInfo, transcript] = await Promise.all([
      fetchVideoInfo(client, targetUrl),
      fetchTranscript(client, targetUrl)
    ]);
    console.log('✅ Video info and transcript fetched');
  } catch (err) {
    return {
      error: 'Failed to fetch video-info or transcript',
      details: err.message,
    };
  }

  // Step 2: Construct payload and fetch video-analysis
  const payload = constructPayload(videoInfo, transcript);
  let videoAnalysis = null;
  
  try {
    console.log('🔍 Analyzing video...');
    videoAnalysis = await fetchVideoAnalysis(client, payload);
    console.log('✅ Video analysis completed');
  } catch (err) {
    console.warn('⚠️  Video analysis failed:', err.message);
    videoAnalysis = {
      error: 'video-analysis failed',
      details: err.message,
    };
  }

  // Step 3: Fetch video-assembly (optional)
  console.log('🔧 Assembling video data...');
  const videoAssembly = await fetchVideoAssembly(client, payload);

  // Return consolidated result
  return {
    videoInfo,
    transcript,
    videoAnalysis,
    videoAssembly,
    targetUrl,
    gatheredAt: new Date().toISOString(),
  };
}

/**
 * Output results in specified format(s)
 */
function outputResults(result, title, outDir, formats) {
  const safeTitle = sanitizeTitle(title);
  const videoFolder = path.join(outDir, safeTitle);
  ensureDirectoryExists(videoFolder);
  const formatsArray = Array.isArray(formats) ? formats : [formats];

  formatsArray.forEach(format => {
    let fileName, filePath;
    if (format === 'json') {
      fileName = 'data.json';
      filePath = path.join(videoFolder, fileName);
      const content = JSON.stringify(result, null, 2);
      const written = writeFile(filePath, content);
      if (written) {
        console.log(`✅ JSON output written: ${filePath}`);
      }
    } else if (format === 'md') {
      fileName = 'notes.md';
      filePath = path.join(videoFolder, fileName);
      const content = generateMarkdown(result);
      const written = writeFile(filePath, content);
      if (written) {
        console.log(`✅ Markdown output written: ${filePath}`);
      }

      // Create .txt file with timestamped transcript in 'transcripts' subfolder (no change)
      const transcriptsDir = path.join(outDir, 'transcripts');
      ensureDirectoryExists(transcriptsDir);

      const txtFileName = `${safeTitle}.txt`;
      const txtFilePath = path.join(transcriptsDir, txtFileName);
      const timestampedText = generateTimestampedTranscript(result.transcript);

      if (timestampedText) {
        const txtWritten = writeFile(txtFilePath, timestampedText);
        if (txtWritten) {
          console.log(`✅ Transcript written: ${txtFilePath}`);
        }
      }

      // Update index.md with Obsidian wiki link to folder
      const summary = extractSummary(result.videoAnalysis, result.videoAssembly);
      appendIndexEntry(outDir, result.videoInfo, safeTitle, summary, result.targetUrl);
    }
  });
}

/**
 * Main runner - orchestrates API calls, handles config, outputs result
 */
async function main() {
  try {
    // Load config
    const config = getConfig(process.argv);
    const outDir = config.outputDir;
    const targetUrl = getArg('url') || config.targetUrl;

    // Create API client with token refresh capability
    const client = new ApiClient(config);

    // Gather all data
    const result = await gatherAllData(client, targetUrl);
    
    if (result.error) {
      console.error('❌ Error:', result.error, result.details || '');
      process.exit(1);
    }

    // Output results
    const title = result.videoInfo.title || result.videoInfo.videoInfo?.title || 'output';
    const format = getOutputFormat();
    outputResults(result, title, outDir, format);
    
    console.log('✨ All done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run the script
main();
