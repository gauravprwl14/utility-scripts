# YT Transcript Extractor

A Node.js script to sequentially execute Longcut.ai API calls for video analysis, transcription, and processing.

## Features

- ✅ **Parallel API Calls**: Fetches video-info and transcript simultaneously for improved performance
- ✅ **Robust Error Handling**: Handles 401 unauthorized and other API errors gracefully
- ✅ **Flexible Configuration**: Supports environment variables, command-line arguments, and constants
- ✅ **Consolidated Output**: Generates structured JSON output with all data
- ✅ **SOLID Principles**: Modular design with separated concerns
- ✅ **No Hardcoded Values**: All configuration is external and configurable

## Installation

```bash
cd scripts
npm install
```

## Configuration Priority

The script loads configuration values in the following order (higher priority first):

1. **Environment Variables**
   - `BASE_URL`
   - `TLDW_GUEST_TOKEN`
   - `TARGET_URL`
   - `OUTPUT_DIR`

2. **Command Line Arguments**
   - `--baseUrl=<url>`
   - `--token=<token>`
   - `--url=<youtube_url>`
   - `--outDir=<output_directory>`

3. **Constants** (fallback in lib/config.js)

## Usage

### Basic Usage

```bash
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=YOUR_TOKEN
```

### With Custom Format

```bash
# Markdown output (default)
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=YOUR_TOKEN --format=md

# JSON output
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=YOUR_TOKEN --format=json

# Both formats
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=YOUR_TOKEN --format=both
```

### With Environment Variables

```bash
export TLDW_GUEST_TOKEN=your_token_here
export TARGET_URL=https://www.youtube.com/watch?v=VIDEO_ID
export OUTPUT_FORMAT=md
node main.js
```

### Custom Output Directory

```bash
node main.js \
  --url=https://www.youtube.com/watch?v=VIDEO_ID \
  --token=YOUR_TOKEN \
  --outDir=/path/to/output
```

### Using .env File (recommended)

Create a `.env` file in the scripts directory:

```bash
BASE_URL=https://www.longcut.ai
TLDW_GUEST_TOKEN=your_token_here
TARGET_URL=https://www.youtube.com/watch?v=VIDEO_ID
OUTPUT_DIR=./output
OUTPUT_FORMAT=md
```

Then use a tool like `dotenv` to load it:

```bash
npm install dotenv
```

And add to the top of main.js:
```javascript
require('dotenv').config();
```

## API Endpoints Called

The script calls the following endpoints in sequence:

1. **video-info** (parallel with transcript)
   - `POST /api/video-info`
   - Payload: `{ url: <youtube_url> }`

2. **transcript** (parallel with video-info)
   - `POST /api/transcript`
   - Payload: `{ url: <youtube_url> }`

3. **video-analysis**
   - `POST /api/video-analysis`
   - Payload: Constructed from video-info and transcript responses
   - Handles 401 unauthorized errors gracefully

4. **video-assembly** (optional)
   - `POST /api/video-assembly`
   - Payload: Constructed from video-info and transcript responses
   - Errors are captured but don't stop execution

## Output Structure

The script generates output in Markdown format by default, with proper headings and structured content.

### Markdown Output (.md)

```markdown
# Video Title

## Metadata
- **Author**: Channel Name
- **Video ID**: VIDEO_ID
- **Duration**: MM:SS
- **URL**: [Watch on YouTube](https://youtube.com/...)
- **Gathered**: Date and time

## Description
Video description content...

## Full Transcript
Combined transcript text without timestamps...

## Transcript with Timestamps
**[00:00]** First segment text...
**[00:23]** Second segment text...
```

### JSON Output (.json)

```json
{
  "videoInfo": { ... },
  "transcript": { ... },
  "videoAnalysis": { ... },
  "videoAssembly": { ... },
  "targetUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "gatheredAt": "2026-02-21T12:34:56.789Z"
}
```

### Error Response Structure

When an API call fails, the error is captured in the output:

```json
{
  "videoAnalysis": {
    "error": "Unauthorized",
    "message": "You have used your free preview. Create a free account for 3 videos/month or upgrade for more.",
    "requiresAuth": true,
    "redirectTo": "/?auth=signup",
    "creditsMessage": "This one is on us; no credits used.",
    "noCreditsUsed": true
  }
}
```

## Output File Naming

Output files are named based on the video title:
- Format: `<video-title>.<format>`
- Spaces are replaced with dashes (`-`)
- Special characters are removed
- Title is truncated to 80 characters max
- Example: `I-Built-a-Reddit-Monitoring-Tool-Using-Claude-Code-Agent-Teams.md`
- Duplicate files will be skipped with a warning (no overwriting)

## Project Structure

```
scripts/
├── lib/
│   ├── config.js       # Configuration loader with priority handling
│   └── utils.js        # Utility functions for API calls and output
├── main.js             # Main orchestration script
├── package.json        # Dependencies
└── output/             # Default output directory (auto-created)
```

## Error Handling

### Configuration Errors
If required configuration is missing, the script will throw:
```
Error: Missing BASE_URL
Error: Missing TLDW_GUEST_TOKEN
Error: Missing TARGET_URL
```

### API Errors
API errors are handled gracefully and included in the output JSON:
- **401 Unauthorized**: Captured with auth requirement details
- **Network Errors**: Captured with error details
- **Other Errors**: Captured with error message

### File System Errors
- If output directory doesn't exist, it will be created automatically
- If output file already exists, an error will be thrown

## Development

### Module Descriptions

#### lib/config.js
- Loads configuration from environment, arguments, and constants
- Validates required values
- Throws descriptive errors for missing configuration

#### lib/utils.js
- `makeApiCall()`: Makes HTTP requests using axios
- `constructPayload()`: Builds payloads from previous responses
- `outputResult()`: Writes JSON output with duplicate checking

#### main.js
- `getArg()`: Extracts command-line argument values
- `gatherAllData()`: Orchestrates all API calls with error handling
- `main()`: Entry point with configuration loading

## Principles

This project follows:
- **SOLID Principles**: Single responsibility, separation of concerns
- **DRY Principle**: No code duplication
- **Configuration Management**: No hardcoded values
- **Error Handling**: Comprehensive error capture and reporting
- **Documentation**: Inline comments and JSDoc

## Troubleshooting

### "Missing TLDW_GUEST_TOKEN"
Ensure you've set the token via environment variable or command-line argument.

### "API call failed"
Check your network connection and ensure the base URL is correct.

### "Output file already exists"
The script won't overwrite existing files. Delete or rename the existing output file.

### 401 Unauthorized
Your free preview has been used. The error details will be in the output JSON.

## License

ISC
