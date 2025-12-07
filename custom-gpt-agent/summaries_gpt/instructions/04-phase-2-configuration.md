## Phase 2: Processing Configuration (Smart Defaults Applied)

**Configuration Questions** (Structured with auto-defaults):

| **A. Primary Purpose**      | Default Rule                                 |
| --------------------------- | -------------------------------------------- |
| 1. Knowledge Transfer       | DEFAULT for Technical/Training (>1000 words) |
| 2. Record Keeping           | DEFAULT for Formal Meetings with decisions   |
| 3. Follow-up Actions        | DEFAULT for Project Planning/Action-heavy    |
| 4. Compliance Documentation | DEFAULT when legal/audit terms detected      |
| 5. Custom Purpose           | User specified                               |

| **B. Summary Depth**              | Default Rule                                     |
| --------------------------------- | ------------------------------------------------ |
| 1. Comprehensive Notes            | DEFAULT for Technical/Long content (>1500 words) |
| 2. Executive Summary + Key Points | DEFAULT for Meetings (500-1500 words)            |
| 3. Action-Focused Brief           | DEFAULT for Short/Action-heavy (<500 words)      |
| 4. Custom Depth                   | User specified                                   |

| **C. Output Structure** | Default Rule                                               |
| ----------------------- | ---------------------------------------------------------- |
| 1. Single File          | DEFAULT for conversations <500 words OR simple discussions |
| 2. Multi-File           | DEFAULT for conversations >1500 words OR complex topics    |
| 3. Auto-Decide          | DEFAULT for 500-1500 words (based on complexity)           |
| 4. Custom Structure     | User specified                                             |

| **D. File Organization** (Multi-File Only) | Default Rule                     |
| ------------------------------------------ | -------------------------------- |
| 1. By Topic/Theme Segments                 | DEFAULT (most flexible)          |
| 2. By Time/Chronological                   | For Training/Process discussions |
| 3. By Participant Contributions            | For Collaborative brainstorming  |
| 4. By Decision Points & Actions            | For Meeting/Planning focused     |
| 5. Custom Organization                     | User specified                   |

| **E. File Format & Metadata**      | Default Rule                               |
| ---------------------------------- | ------------------------------------------ |
| 1. Markdown + YAML                 | DEFAULT (supports all features)            |
| 2. Markdown Only                   | If YAML not supported                      |
| 3. Plain Text + Structured Headers | For simple environments                    |
| 4. JSON Structured                 | For programmatic processing                |
| 5. Custom Format                   | User specified with compatibility warnings |

| **F. Tagging Level** | Default Rule                              |
| -------------------- | ----------------------------------------- |
| 1. Minimal           | For Single File output                    |
| 2. Light             | For Action-Focused Brief                  |
| 3. Medium            | DEFAULT for Multi-File                    |
| 4. Full              | For Comprehensive Notes + Complex content |

**Auto-Processing Fallback**: If no user response within timeout, proceed with detected defaults and note: "✅ Processing with smart defaults - customize anytime"
