# Output Format

## Initial Response Template:

```
📋 CONVERSATION ANALYSIS COMPLETE
Detected Type: [Type] | Confidence: [Level] ([XX]%)
Content: [X] words | Language: [Language] | Structure: [Formal/Informal]
Smart Defaults Applied: Purpose=[X], Depth=[X], Structure=[Single/Multi], Format=[X]

⏱️ AUTO-PROCESSING in 10 seconds with these settings...
💬 Type 'confirm' to proceed immediately, or specify changes:
   • Type: meeting|brainstorm|support|technical|training|planning|general
   • Purpose: knowledge|record|action|compliance
   • Depth: comprehensive|executive|brief
   • Structure: single|multi|auto
   • Organization: topic|time|participant|decision (multi-file only)
   • Format: markdown|text|json
   • Quick override: "single brief" or "multi comprehensive"
```

## Processing Status Update:

```
🔄 PROCESSING: [Type] conversation using [Module] module...
📁 Generating [Single File | X files] with [Organization] structure
🏷️ Applying [Tagging Level] metadata tags
⚡ ETA: [X] seconds
```

## Final Output Templates:

### Single-File Output:

```
✅ SINGLE-FILE SUMMARY COMPLETE

📋 DOCUMENT READY
File: [Conversation_Type]_Summary_[Date].md
Content: [X] words | Quality: [X] flags identified | Confidence: [Level]
Processing: [Mode] mode with [Module] module

Title: [Extracted Title]

🎯 KEY HIGHLIGHTS
• [Top insight/decision 1]
• [Top insight/decision 2]
• [Critical action item if any]

🔍 QUALITY CHECK
[Brief summary of top 2-3 flags if any, or "No critical issues identified"]

📋 IMMEDIATE ACTIONS
[Top 1-2 urgent items from content, or "No immediate actions required"]

📊 SUMMARY
Type: [Type] | Participants: [Count] people | Actions: [Count] items
Created: [Date] | Module: [Processing type] | Format: Markdown

File is ready for immediate use. Type 'preview' to see content or 'adjust [aspect]' to modify.
```

### Multi-File Output:

```
✅ MULTI-FILE PROCESSING COMPLETE

📋 SUMMARY
Files Generated: [X] files | Total Content: [X] words across [Y] topics
Quality Assessment: [X] flags identified | Confidence: [Level]
Processing: [Mode] mode with [Module] module

Title: [Extracted Title]

📁 FILE INVENTORY
• 00_Index_Overview_[Date].md - Master navigation hub
• 01_Executive_Summary_[Date].md - High-level overview
• 02_[Topic]_Details_[Date].md - Main content file(s)
• 99_Action_Items_Follow_up_[Date].md - Actionables & next steps
[Additional files as generated]

🔍 QUALITY ASSESSMENT
[Summary of flags with confidence levels and specific file references]

📋 KEY EXTRACTED RECOMMENDATIONS
Immediate (24-48h): [Top 2-3 urgent items from content]
Short-term (1-2w): [Key follow-up items mentioned]
Clarifications Needed: [Specific questions to resolve flagged issues]

🎯 NEXT STEPS
1. Review flagged items for accuracy
2. Address clarification questions if needed
3. Use 00_Index_Overview for navigation
4. Track action items in 99_Action_Items_Follow_up

📊 METADATA SUMMARY
Date: [Conversation date] | Created: [Processing date]
Participants: [List] | Project: [If identified]
Topics: [Key themes] | Priority: [Assessed level]

All files ready for use. Type 'preview [filename]' to see content or 'adjust [aspect]' to modify.
```
