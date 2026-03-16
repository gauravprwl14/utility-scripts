# context.md — custom-gpt-agent

## What This Project Does

This is **not a code project** — it is a prompt engineering artifact. It contains the complete system instructions for an OpenAI Custom GPT called **"Conversation Analyzer & Multi-File Summarizer"**. The GPT takes any conversation (meeting transcript, support chat, brainstorm, etc.), auto-detects its type, and generates organized, multi-file summaries with cross-references, quality flags, and actionable follow-ups.

The project exists in two forms:
1. A single monolithic prompt file (the "V2" all-in-one document)
2. A modular breakdown of the same prompt split into numbered instruction files

---

## Architecture & File Map

```
custom-gpt-agent/
├── Conversation Analyzer & Multi-File Summarizer GPT V2.md   # Complete prompt (all-in-one, 685 lines)
└── summaries_gpt/
    └── instructions/                  # Modular breakdown of the same prompt
        ├── 01-role-and-objective.md       # GPT identity, operating modes
        ├── 02-instructions-pre-processing.md  # Input validation, language/length detection
        ├── 03-phase-1-detection.md        # Conversation type auto-detection with confidence scoring
        ├── 04-phase-2-configuration.md    # Smart defaults and user override options
        ├── 05-phase-3-modules.md          # 8 processing modules (meeting, brainstorm, support, etc.)
        ├── 06-phase-4-output-generation.md  # Single-file vs multi-file output templates
        ├── 07-phase-5-quality-flags.md    # Quality validation flag system (6 flag types)
        ├── 08-phase-6-follow-up.md        # Follow-up suggestions and recommendations
        ├── 09-reasoning-steps-workflow.md  # 10-step processing workflow
        ├── 10-output-format-initial-status-final.md  # Output format templates
        ├── 11-examples.md                 # 4 worked examples (small→large conversations)
        ├── 12-industry-standards-validation.md  # References: ISO 9001, IEEE, APQC, PMI
        └── 13-limitations-handling.md     # Error handling, format limitations, self-validation
```

---

## How the GPT System Works (Detailed)

### Phase 0: Pre-Processing (file 02)
- Validates input type (text only — rejects audio/video)
- Detects language
- Assesses content length: Short (<500 words), Medium (500-2000), Long (>2000)
- Assesses structure: Formal/Informal, Structured/Unstructured

### Phase 1: Type Detection (file 03)
Auto-detects conversation type by analyzing language patterns, participant roles, discussion flow. Assigns a confidence score:
- **High (>80%)** — use type-specific module fully
- **Medium (50-80%)** — blend primary module (70%) + Generic (30%)
- **Low (<50%)** — use Generic module + extra validation flags

**8 Supported Types**: Formal Meetings, Brainstorming Sessions, Customer Support, Technical Discussions, Training/Knowledge Transfer, Project Planning, General Discussion, Generic Fallback

### Phase 2: Configuration (file 04)
Applies smart defaults based on detection results across 6 dimensions:
- **A. Primary Purpose**: Knowledge Transfer / Record Keeping / Follow-up Actions / Compliance / Custom
- **B. Summary Depth**: Comprehensive Notes / Executive Summary / Action-Focused Brief / Custom
- **C. Output Structure**: Single File / Multi-File / Auto-Decide / Custom
- **D. File Organization**: By Topic / By Time / By Participant / By Decision / Custom
- **E. File Format**: Markdown+YAML / Markdown Only / Plain Text / JSON / Custom
- **F. Tagging Level**: Minimal / Light / Medium (default) / Full

Auto-proceeds with defaults after 10 seconds; user can override any dimension.

### Phase 3: Processing Modules (file 05)
Each conversation type has a dedicated module defining:
- What to extract (e.g., Formal Meetings: attendees, agenda, decisions, action items)
- How to structure output (e.g., Meeting Overview → Agenda Topics → Decisions → Action Items)
- File naming convention (e.g., `01_Meeting_Overview`, `02_Agenda_Topic_[Name]`)

Date resolution strategy: extract from content → fallback to current date → flag if ambiguous.

### Phase 4: Output Generation (file 06)
Two output modes with full templates:

**Single-File** (<500 words or simple): One markdown file with YAML frontmatter, overview, key points, action items, decisions, quality flags, tags.

**Multi-File** (>1500 words or complex): Numbered files following `[##]_[Descriptive_Title]_[YYYY-MM-DD].md` convention:
- `00_Index_Overview` — master navigation hub
- `01_Executive_Summary` — high-level overview
- `02-0X_[Content]` — topic-specific files
- `99_Action_Items_Follow_up` — consolidated actionables

Cross-referencing: bidirectional internal links (`[[File_Name|Display_Text]]`), relationship types (Previous/Next, Related, Parent/Child).

### Phase 5: Quality Flags (file 07)
6 flag types with confidence thresholds:
- Red: Critical Gap (>80%) — essential info missing
- Yellow: Clarification Needed (50-80%) — ambiguous terms
- Blue: Potential Conflict (>80%) — contradictions
- Purple: Unresolved Issue (>80%) — open questions
- Orange: Follow-up Required (50-80%) — unowned action items
- Green: Information Complete (>80%) — all clear

Single-file: limited to 2-3 highest priority flags. Multi-file: all flags with file references.

### Phase 6: Follow-up (file 08)
Generates recommendations in three timeframes:
- Immediate (24-48 hours): from explicit commitments
- Short-term (1-2 weeks): from discussion momentum
- Long-term (ongoing): from strategic discussions

### Tagging System (file 06, bottom)
4 levels of document metadata tagging, scaling from Minimal (3-4 tags) to Full (comprehensive graph-ready Obsidian metadata with clusters, hub files, connection strength, visual tags).

---

## The Two File Formats

### `Conversation Analyzer & Multi-File Summarizer GPT V2.md`
The complete, ready-to-paste prompt for OpenAI's Custom GPT builder. All 13 sections concatenated into one document. This is what you'd copy into the "Instructions" field of a Custom GPT.

### `summaries_gpt/instructions/*.md`
The same content split into logical sections for easier editing and version control. The numbered prefixes (01-13) define the ordering. This is the "source of truth" for iterating on the prompt.

---

## Key Design Decisions

- **Auto-processing with timeout**: The GPT proceeds with smart defaults after 10 seconds of no user response, making it usable in non-interactive contexts
- **Confidence-based blending**: Medium-confidence detections blend two modules (70/30) instead of committing to one
- **Obsidian-optimized**: Output uses `[[wiki-links]]`, YAML frontmatter, and graph-ready tags — designed for Obsidian knowledge bases
- **Industry standards referenced**: ISO 9001 (meetings), IEEE (technical docs), APQC (knowledge management), PMI (project management)

---

## How to Use

1. Create a Custom GPT in OpenAI's GPT builder
2. Paste the contents of `Conversation Analyzer & Multi-File Summarizer GPT V2.md` into the Instructions field
3. Send a conversation transcript to the GPT
4. It will auto-detect the type, show detection results, and generate organized summary files

---

## No Dependencies

This is pure markdown — no code, no packages, no runtime. The only "dependency" is OpenAI's Custom GPT platform.
