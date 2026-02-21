
# YT Transcript Extractor

Node.js automation tool to extract YouTube video transcripts, metadata, and analysis from Longcut.ai (yt-extractor). Generates Markdown, JSON, and plain text outputs, with robust error handling and organized output structure.

---

## Features

- 🚀 **Automated API Calls**: Sequentially calls Longcut.ai endpoints for video info, transcript, and analysis
- ⚡ **Parallel Fetching**: Fetches video-info and transcript in parallel for speed
- 🛡️ **Robust Error Handling**: Handles 401, network, and API errors gracefully
- 📝 **Flexible Output**: Generates Markdown, JSON, and timestamped transcript (.txt) files
- 📂 **Organized Output**: All outputs go to a dedicated output directory, with transcripts in a subfolder
- 🔄 **Token Refresh**: Automatically refreshes token if expired
- 🗂️ **index.md**: Maintains an index of all processed videos with summary/description
- 🔧 **Configurable**: Supports .env, environment variables, and CLI arguments
- 🧩 **Modular Codebase**: SOLID, DRY, and well-documented

---

## Installation

```bash
cd scripts/yt-transcript-extractor
npm install
```

---

## Configuration

You can configure the script using (in order of priority):

1. **Environment Variables**
   - `BASE_URL`, `TLDW_GUEST_TOKEN`, `TARGET_URL`, `OUTPUT_DIR`, `OUTPUT_FORMAT`
2. **Command Line Arguments**
   - `--baseUrl=`, `--token=`, `--url=`, `--outDir=`, `--format=`
3. **.env File** (recommended)
   - Place in the root of the script directory

Example `.env`:
```env
BASE_URL=https://www.longcut.ai
TLDW_GUEST_TOKEN=your_token_here
TARGET_URL=https://www.youtube.com/watch?v=VIDEO_ID
OUTPUT_DIR=./output
OUTPUT_FORMAT=md
```

---

## Usage

### Basic

```bash
node main.js --url=https://www.youtube.com/watch?v=VIDEO_ID --token=YOUR_TOKEN
```

### Custom Output Format

```bash
# Markdown (default)
node main.js --url=... --token=... --format=md
# JSON
node main.js --url=... --token=... --format=json
# Both
node main.js --url=... --token=... --format=both
```

### Custom Output Directory

```bash
node main.js --url=... --token=... --outDir=/path/to/output
```

### With .env

```bash
export TLDW_GUEST_TOKEN=your_token
export TARGET_URL=https://www.youtube.com/watch?v=VIDEO_ID
node main.js
```

---


## Output Structure

- Each video gets its own folder inside the output directory (default: `output/`), named after the sanitized video title
- Inside each folder:
   - `notes.md` (Markdown output)
   - `data.json` (JSON output, if selected)
- All transcript `.txt` files are placed in `output/transcripts/`
- `index.md` is updated with each run, listing all processed videos using Obsidian wiki links

### Example Structure

```
output/
├── index.md
├── Video-Title-1/
│   ├── notes.md
│   └── data.json
├── Video-Title-2/
│   └── notes.md
└── transcripts/
      ├── Video-Title-1.txt
      └── Video-Title-2.txt
```

### Markdown Example (notes.md)

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

## Video Analysis
Summary/analysis content...

## Full Transcript
Combined transcript text...

## Transcript with Timestamps
**[00:00]** First segment text...
**[00:23]** Second segment text...
```

### JSON Example (data.json)

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

### Transcript TXT Example (output/transcripts/Video-Title-1.txt)

```
[00:00] First segment text...
[00:23] Second segment text...
```

### index.md Example (Obsidian Wiki Links)

```
- [[Video-Title-1]] (2026-02-21) - Video summary... [YouTube](url)
- [[Video-Title-2]] (2026-02-21) - Another summary... [YouTube](url)
```

---

## Error Handling

- **Configuration Errors**: Missing required config throws descriptive errors
- **API Errors**: All API errors are captured in the output JSON/Markdown
- **File System**: Output directories are auto-created; duplicate files are skipped

---

## Project Structure

```
yt-transcript-extractor/
├── lib/
│   ├── utils/
│   │   ├── string.js
│   │   └── file.js
│   ├── api/
│   │   ├── client.js
│   │   └── endpoints.js
│   └── formatters/
│       ├── markdown.js
│       └── index.js
├── main.js
├── package.json
├── .env
└── output/
    ├── transcripts/
    ├── index.md
    └── ...
```

---

## Development & Extensibility

- Modular code: utils, api, formatters
- Add new output formats by extending `lib/formatters/`
- Update API logic in `lib/api/`
- All config logic in `lib/config.js`

---

## License

ISC

---

## Changelog

### 2026-02-21
- Major refactor: modular code, token refresh, index.md, transcript subfolder, robust error handling
- Output directory and subfolder auto-creation
- Markdown, JSON, and .txt transcript outputs

---

## Support

For issues or questions, open an issue or see the Troubleshooting section above.
