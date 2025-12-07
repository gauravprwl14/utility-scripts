## Phase 4: Output Generation (Single-File vs Multi-File)

### Output Structure Decision Logic:

1. **Single File** (<500 words OR simple/focused discussions):

   - One comprehensive file with all essential elements
   - Streamlined structure for quick consumption
   - Minimal metadata and tagging for clarity

2. **Multi-File** (>1500 words OR complex topics with multiple themes):

   - Separate files for different topics/sections
   - Full cross-referencing and navigation
   - Comprehensive metadata for knowledge management

3. **Auto-Decide** (500-1500 words):

   - Assess complexity: Single theme → Single File
   - Multiple distinct topics → Multi-File
   - Mixed content → Default to Multi-File for flexibility

### Single-File Template Structure:

**Title Resolution Strategy:**

1.  Extract from meeting agenda, email subject, or explicit title mentions
2.  Use conversation type + main topic if clear (e.g., "Budget Planning Discussion")
3.  Default to "[Type] Summary" format
4.  Keep titles concise (5-8 words maximum)

**Example Title Extractions:**

- "Weekly team standup" → "Weekly Team Standup"
- "Customer support call about login issues" → "Login Issues Support Call"
- "Technical architecture review meeting" → "Architecture Review Meeting"
- No clear title found → "Project Planning Summary - 2024-08-24"

```markdown
---
title: "Conversation Title"
conversation_type: "[Type]"
date_created: "YYYY-MM-DD"
participants: ["Name1", "Name2"]
summary_type: "single_file"
confidence: "[high|medium|low]"
---

# [Extracted/Generated Title] Summary - [YYYY-MM-DD]

## Title: [Extracted/Generated Title]

## Overview

**Type**: [Meeting/Discussion/Support/etc.] | **Duration/Length**: [X minutes/words]  
**Participants**: [List] | **Purpose**: [Primary objective]  
**Context**: [Brief background and reason for conversation]

## Key Points

- **[Topic/Decision 1]**: [Clear, concise description]
- **[Topic/Decision 2]**: [Clear, concise description]
- **[Topic/Decision 3]**: [Clear, concise description]
- **[Additional points as needed]**

## Action Items

- **[Action Description]** - _Owner: [Name]_ - _Due: [Date/Timeframe]_
- **[Action Description]** - _Owner: [Name]_ - _Due: [Date/Timeframe]_
- **[Follow-up meeting/check-in]** - _Owner: [Name]_ - _Due: [Date]_

## Decisions Made

- **[Decision 1]**: [What was decided and rationale]
- **[Decision 2]**: [What was decided and rationale]

## Next Steps

- [Immediate priority 1]
- [Short-term follow-up 2]
- [Long-term consideration 3]

## Quality Flags

- 🔴 **[Critical Issue]**: [Brief description and impact]
- 🟡 **[Clarification Needed]**: [What needs clarification]
- _(Maximum 2-3 high-priority flags to avoid overwhelming)_

---

**Tags**: #summary #[conv-type] #[status] #[project] #action-required  
**Quick Links**: [Related documents or references if any]  
**Created**: [YYYY-MM-DD] | **Confidence**: [High/Medium/Low] | **Module**: [Processing type]
```

### Multi-File Structure (Existing):

**Consistent File Naming Convention**: **Format**: `[##]_[Descriptive_Title]_[YYYY-MM-DD].md`

**Standard File Structure**:

1. **`00_Index_Overview_[Date].md`** - Master navigation hub
2. **`01_Executive_Summary_[Date].md`** - High-level overview (if Comprehensive/Executive depth)
3. **`02-0X_[Content]_[Date].md`** - Topic/segment-specific files
4. **`99_Action_Items_Follow_up_[Date].md`** - Consolidated actionables and next steps

### Metadata Strategy by Format:

**Markdown Format:**

```yaml
---
Title: "Technical Architecture discussion"
conversation_type: "Technical Discussion"
date_created: "2024-08-24"
date_conversation: "2024-08-22"
participants: ["John Doe", "Jane Smith"]
topics: ["architecture", "microservices", "deployment"]
priority: "high"
status: "active"
project: "System Redesign"
confidence_level: "high"
processing_mode: "auto"
---
```

**Plain Text Format:**

```
[METADATA]
Type: Technical Discussion | Created: 2024-08-24 | Conversation: 2024-08-22
Participants: John Doe, Jane Smith | Project: System Redesign
Topics: architecture, microservices, deployment | Priority: high
[/METADATA]
```

**JSON Format:**

```json
{
  "metadata": {
    "conversation_type": "Technical Discussion",
    "date_created": "2024-08-24",
    "participants": ["John Doe", "Jane Smith"],
    "topics": ["architecture", "microservices", "deployment"]
  },
  "content": { ... }
}
```

### Cross-Referencing System:

- **Internal Links**: `[[File_Name|Display_Text]]` for Markdown, `See: File_Name` for Plain Text
- **Bidirectional**: Every content file links back to Index, forward to related files
- **Relationship Types**: Previous/Next in sequence, Related by topic, Parent/Child relationships
