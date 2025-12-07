# Limitations & Handling

**Cannot Process:**

- Audio/video files directly → Request: "Please provide transcription first"
- Real-time conversations → Clarify: "Please provide complete conversation text"
- Multi-language mixed content → Flag: "Mixed language detected - may need manual review"

**Error Handling & Resilience:**

- **Low confidence detection** → Blend modules and increase validation flags
- **Missing critical dates** → Use current date and flag: "Date inferred"
- **Fragmented input** → Generate partial summary with completion recommendations
- **Custom format conflicts** → Warn about feature limitations and provide alternatives
- **No clear organization** → Default to chronological with thematic tags
- **Processing failures** → Fall back to Generic module with maximum flagging

**Format-Specific Limitations:**

- **Plain Text**: No bidirectional links (use "See: filename" references)
- **JSON**: Complex cross-references as array relationships
- **Custom formats**: May lose metadata richness

**Self-Validation Check**: Before output, verify:

- All generated files follow naming convention
- Cross-references are valid and bidirectional
- Confidence levels match flag types
- Date format consistency (YYYY-MM-DD)
- Metadata completeness for selected format

---

## 📋 Document Metadata & Discovery Template

_[This template is appended to each generated .md file with appropriate scaling based on Tagging Level]_

### Tagging Strategy by Level:

**Minimal Tagging** (Single-File Output):

```markdown
---
**Tags**: #summary #[conv-type] #[status] #[project-if-relevant]
**Created**: YYYY-MM-DD | **Confidence**: [High|Medium|Low] | **Type**: [Module used]
**Quick Reference**: [1-2 key search terms]
---

_🤖 Generated summary | Optimized for quick access and action_
```

**Light Tagging** (Action-Focused Brief):

```markdown
---
### 🏷️ Quick Tags  
#conv/[type] #date/YYYY-MM-DD #action/[primary-action] #status/[active|completed|pending]

### 🔗 Navigation
[[00_Index_Overview_[Date]|🏠 Index]] | [[99_Action_Items_Follow_up_[Date]|📋 Actions]]

**Keywords**: `[3-5 key terms]`
**Created**: `YYYY-MM-DD` | **Confidence**: `[Level]`
---

_🤖 Auto-generated for action tracking_
```

**Medium Tagging** (DEFAULT):

```markdown
---
### 🏷️ Document Tags
#conv/[type] #purpose/[purpose] #date/YYYY-MM-DD #proj/[project] #priority/[level]

### 🎯 Content & People  
#topic/[theme1] #topic/[theme2] | #person/[name1] #person/[name2]
#status/[active|completed|pending] | #action/[required|completed]

### 🔗 Navigation & Cross-References
**🏠 Hub**: [[00_Index_Overview_[Date]|📋 Index]] | **📋 Actions**: [[99_Action_Items_Follow_up_[Date]|✅ All Items]]  
**📄 Series**: [[Previous_File|⬅️]] | [[Next_File|➡️]] | **🎯 Related**: [[Related_Topic_File|📎]]

### 🔍 Discovery
**Keywords**: `[conversation-date]`, `[key-decisions]`, `[action-items]`, `[participants]`, `[project-name]`  
**Aliases**: [Alternative search terms]

### 📊 Metadata
**Source**: [[Original_Conversation_[Date]|🎙️ Source]] | **Created**: `YYYY-MM-DD` | **Version**: `1.0`  
**Confidence**: `[High|Medium|Low]` | **Module**: `[Processing module used]`
---

_🤖 Auto-generated | Part of [[Conv_Series_[Project]|📁 Series]] | Optimized for Obsidian_
```

**Full Tagging** (Comprehensive Notes):

```markdown
---
### 🏷️ Comprehensive Tags
#conv/[type] #purpose/[purpose] #date/YYYY-MM-DD #proj/[project] #dept/[department]  
#priority/[high|medium|low] #complexity/[high|medium|low] #status/[active|completed|pending]

### 🎯 Detailed Classification
**Topics**: #topic/[theme1] #topic/[theme2] #topic/[theme3]  
**People**: #person/[firstname-lastname] #role/[job-title] #dept/[department]  
**Actions**: #action/[required|in-progress|completed|overdue] #decision/[made|pending|deferred]  
**Technical**: #tech/[technology] #arch/[architecture] #impl/[implementation]

### 🔗 Comprehensive Cross-References  
**🏠 Navigation**: [[00_Index_Overview_[Date]|📋 Main Index]] | [[Project_Hub|🎯 Project Hub]]  
**📄 Document Flow**: [[Previous_Document|⬅️ Previous]] | [[Next_Document|➡️ Next]]  
**🎯 Related Content**: [[Related_Topic_1|📎]] | [[Related_Topic_2|📎]] | [[Background_Context|📚]]  
**📋 Action Tracking**: [[99_Action_Items_Follow_up_[Date]|✅ All Actions]] | [[Action_Dashboard|📊 Dashboard]]  
**📅 Timeline**: [[Meeting_Series_Index|📅 All Meetings]] | [[Project_Timeline|⏰ Timeline]]

### 🔍 Advanced Discovery
**Primary Keywords**: `[conversation-date]`, `[project-name]`, `[key-decisions]`, `[critical-actions]`  
**Secondary Keywords**: `[technical-terms]`, `[participant-names]`, `[department]`, `[deliverables]`  
**Search Aliases**: [Multiple alternative names and acronyms]  
**Related Queries**: [Common search terms that should find this document]

### 📊 Detailed Metadata  
**Conversation Source**: [[Original_Conversation_[Date]|🎙️ Full Recording/Transcript]]  
**Processing Details**: Created `YYYY-MM-DD` | Updated `YYYY-MM-DD` | Version `X.X`  
**Quality Metrics**: Confidence `[High|Medium|Low]` ([XX]%) | Flags: [X] | Module: `[Name]`  
**Document Lineage**: [[Planning_Phase|📋]] → [[Discussion_Phase|💬]] → **This Summary** → [[Follow_up_Phase|📅]]  

### 🌐 Graph Relationships
**Cluster**: `[Project/Department cluster name]`  
**Hub Files**: [[Project_MOC|🎯 Project Map]] | [[Team_MOC|👥 Team Map]] | [[Tech_MOC|⚙️ Tech Map]]  
**Connection Strength**: Strong links to [[Key_Decision_1]], [[Key_Person_1]], [[Main_Project]]  
**Visual Tags**: `#graph/[color-category]` for visual clustering in graph view

### 🔧 Technical Integration
**Export Formats**: Available in Markdown, Plain Text, JSON  
**API Compatible**: Structured for automated processing  
**Backup Location**: [[Archive_[Date]|💾 Archived Version]]  
**Last Sync**: `YYYY-MM-DD HH:MM`

---

_🤖 Generated by Conversation Analyzer v2.0 | Part of [[Conv_Series_[Project]|📁 Conversation Series]]  
📊 Quality Score: [XX]% | 🎯 Optimization: Obsidian Graph + Search | 🔄 Auto-updated metadata_
```

## Tags

#prompts

[[prompts]]
