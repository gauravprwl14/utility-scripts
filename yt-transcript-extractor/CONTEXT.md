# context.md — yt-transcript-extractor

## What This Project Does

A Node.js CLI tool that extracts YouTube video transcripts, metadata, and AI-generated analysis via the Longcut.ai API. It produces organized output in Markdown and/or JSON format, with timestamped transcripts, video analysis, and an automatically maintained `index.md` file using Obsidian wiki-link syntax.

Additionally includes a Tampermonkey/Greasemonkey browser userscript that adds a "Copy" button to the Longcut.ai web interface for quick JSON export of transcript data to clipboard.

---

## Architecture & File Map

```
yt-transcript-extractor/
├── main.js                          # CLI entry point — orchestrates the pipeline
├── lib/
│   ├── config.js                    # Configuration loader (env > CLI args > constants)
│   ├── api/
│   │   ├── client.js                # HTTP client with auto token refresh
│   │   └── endpoints.js             # API endpoint functions (4 endpoints)
│   ├── formatters/
│   │   ├── markdown.js              # Markdown and transcript text generation
│   │   └── index.js                 # index.md management (append entries, dedup)
│   └── utils/
│       ├── string.js                # String utils (sanitize, formatTime, truncate, extractVideoId)
│       └── file.js                  # File I/O (write, read, append, ensureDir)
├── chrome-extension-transcript.js   # Tampermonkey userscript for Longcut.ai
├── output/                          # Default output directory
│   ├── index.md                     # Auto-generated video index (Obsidian wiki-links)
│   └── [video-title]/               # Per-video folders
│       └── notes.md                 # Video notes in Markdown
├── .env / .env.example              # Environment configuration
├── .gitignore
├── package.json                     # Depends on axios, dotenv
├── SETUP.md                         # Setup instructions
├── README.md
└── longCut.postman_collection.json  # Postman collection for API testing
```

---

## How Each File Works

### `main.js` — Entry Point (179 lines)

The main orchestrator. Flow:
1. Loads config (env vars + CLI args)
2. Creates `ApiClient` with token
3. Calls `gatherAllData()` — fetches all API data
4. Calls `outputResults()` — writes files in chosen format(s)

**`gatherAllData(client, targetUrl)`**:
- Step 1: Fetch `video-info` and `transcript` in parallel (`Promise.all`)
- Step 2: Construct payload from results, fetch `video-analysis`
- Step 3: Fetch `video-assembly` (optional, won't fail the pipeline)
- Returns consolidated result object with all data + timestamp

**`outputResults(result, title, outDir, formats)`**:
- Creates per-video folder: `<outDir>/<sanitized-title>/`
- For JSON format: writes `data.json` with full result
- For Markdown format: writes `notes.md`, creates `transcripts/<title>.txt` with timestamped transcript, updates `index.md` with Obsidian wiki-link entry

### `lib/config.js` — Configuration (58 lines)

Priority chain: ENV vars → CLI args (`--key=value`) → built-in constants.

Required config values (errors if missing):
- `BASE_URL` — Longcut API base (default: `https://www.longcut.ai`)
- `TLDW_GUEST_TOKEN` — authentication token (no default, must be provided)
- `TARGET_URL` — YouTube URL to process (no default)

Optional:
- `OUTPUT_DIR` — output directory (default: `./output`)
- `OUTPUT_FORMAT` — `json`, `md`, or `both` (default: `md`)

Supports tilde expansion (`~/path` → `/home/user/path`).

### `lib/api/client.js` — API Client (159 lines)

Axios-based HTTP client with automatic token refresh:
- Sends `tldw_guest_token` as a cookie header
- On 401/403 or auth-related error messages, calls `refreshToken()` then retries once
- `refreshToken()` hits `/api/check-limit` and extracts new token from `Set-Cookie` response header
- User-Agent mimics a real browser
- Won't throw on 4xx (only 5xx), handles auth errors in response body too

### `lib/api/endpoints.js` — API Endpoints (72 lines)

4 API endpoint wrappers:
- `fetchVideoInfo(client, targetUrl)` → `POST /api/video-info` — returns title, author, duration, tags, description
- `fetchTranscript(client, targetUrl)` → `POST /api/transcript` — returns timestamped transcript segments
- `fetchVideoAnalysis(client, payload)` → `POST /api/video-analysis` — returns AI analysis (summary, key takeaways)
- `fetchVideoAssembly(client, payload)` → `POST /api/video-assembly` — returns assembled video data (optional, gracefully fails)

`constructPayload(videoInfo, transcript)` — builds payload for analysis/assembly endpoints from video-info and transcript results.

### `lib/formatters/markdown.js` — Markdown Generator (123 lines)

Generates structured Markdown output:
- Title as H1
- Metadata section: author, video ID, duration, URL, thumbnail, tags, gathered timestamp
- Description section
- Video Analysis section (JSON code block or error message)
- Video Assembly section (JSON code block)
- Full Transcript (continuous text)
- Transcript with Timestamps (each segment with `[MM:SS]` prefix)

Also exports:
- `generateTimestampedTranscript()` — plain text with timestamps for `.txt` output
- `extractSummary()` — pulls summary from analysis or assembly data
- `combineTranscript()` — joins segment texts into continuous string

### `lib/formatters/index.js` — Index Manager (147 lines)

Maintains an `index.md` file in the output directory:
- Creates index with header if it doesn't exist
- Appends entries in format: `- [[FolderName]] (Date) - Summary [YouTube](url)`
- Deduplicates by video ID or filename
- Updates "Last updated" timestamp on each append
- Uses Obsidian wiki-link syntax (`[[...]]`) for folder links

### `lib/utils/string.js` — String Utilities (75 lines)

- `sanitizeTitle(title, maxLength=80)` — converts to filename-safe string (alphanumeric + dashes)
- `formatTime(seconds)` — converts seconds to `MM:SS` or `HH:MM:SS`
- `truncateText(text, maxLength=200)` — truncate with ellipsis
- `extractVideoId(url)` — regex extraction from YouTube URL patterns

### `lib/utils/file.js` — File Utilities (70 lines)

- `ensureDirectoryExists(dirPath)` — recursive mkdir
- `writeFile(filePath, content, skipIfExists=true)` — write with optional skip if exists
- `readFile(filePath)` — returns content or null
- `appendFile(filePath, content)` — append to file
- `fileExists(filePath)` — existence check

### `chrome-extension-transcript.js` — Browser Userscript (621 lines)

Tampermonkey/Greasemonkey userscript that runs on `longcut.ai/analyze/*`. It:
1. Waits for the page to load (retries up to 4 minutes)
2. Finds the "Export" button on the Longcut.ai page
3. Injects a "Copy" button next to it
4. On click, extracts from the page DOM:
   - YouTube URL (from query params)
   - Video title (from iframe, document title, headings, or YouTube oEmbed API fallback)
   - Duration, transcript segments, highlights/chapters, summary
5. Copies the collected JSON to clipboard
6. Clears all storage/cookies after initialization (privacy measure)

Uses MutationObserver to handle dynamic page content.

---

## Data Flow (End to End)

```
CLI: node main.js --url=https://youtube.com/watch?v=xyz --token=abc123

       │
       ▼  getConfig(argv)
       │
       ▼  new ApiClient({ baseUrl, token })
       │
       ▼  gatherAllData(client, targetUrl)
       │
       ├──▶ POST /api/video-info ──────┐
       │                               │  (parallel)
       ├──▶ POST /api/transcript ──────┤
       │                               ▼
       │                        constructPayload()
       │                               │
       ├──▶ POST /api/video-analysis ──┤  (sequential)
       │                               │
       └──▶ POST /api/video-assembly ──┘  (optional)
       │
       ▼  Consolidated result object
       │
       ▼  outputResults(result, title, outDir, format)
       │
       ├──▶ output/<video-title>/notes.md     (Markdown)
       ├──▶ output/<video-title>/data.json    (JSON, if format includes json)
       ├──▶ output/transcripts/<title>.txt    (timestamped transcript)
       └──▶ output/index.md                   (append wiki-link entry)
```

---

## Usage

```bash
# Using .env file
cp .env.example .env  # set TLDW_GUEST_TOKEN and TARGET_URL
node main.js

# Using CLI args
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=your_token

# Output both JSON and Markdown
node main.js --url=... --token=... --format=both

# Custom output directory
node main.js --url=... --token=... --outDir=~/notes/youtube
```

---

## Dependencies

- **Node.js** >= 14.0.0
- **axios** (^1.6.0) — HTTP client
- **dotenv** (^16.0.0) — environment variable loading

---

## Important Implementation Details

- The Longcut.ai API is a third-party service — the token (`TLDW_GUEST_TOKEN`) is a guest/session token, not an API key
- Token auto-refresh works by hitting `/api/check-limit` and extracting the new token from the `Set-Cookie` response header
- `video-analysis` and `video-assembly` are graceful — failures don't stop the pipeline, they're logged and included as error objects in the output
- Output files use a "skip if exists" pattern by default — re-running for the same video won't overwrite existing notes
- The index.md deduplicates entries by video ID or folder name
- The userscript (`chrome-extension-transcript.js`) is independent of the Node.js tool — it's a browser-side alternative that extracts data from the Longcut.ai web UI and copies it to clipboard
- Markdown output includes the raw analysis/assembly as JSON code blocks (the analysis format varies per video)
- Timestamps in transcript use `[MM:SS]` format (or `[HH:MM:SS]` for videos over 1 hour)
