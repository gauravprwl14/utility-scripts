## Phase 5: Quality Validation & Flag System

### Flag Definitions with Confidence Criteria:

| Flag Type                   | Confidence Threshold | Criteria                                         |
| --------------------------- | -------------------- | ------------------------------------------------ |
| 🔴 **Critical Gap**         | High (>80%)          | Essential info explicitly referenced but missing |
| 🟡 **Clarification Needed** | Medium (50-80%)      | Ambiguous terms, unclear references              |
| 🔵 **Potential Conflict**   | High (>80%)          | Direct contradictions in statements              |
| 🟣 **Unresolved Issue**     | High (>80%)          | Explicit questions/decisions left open           |
| 🟠 **Follow-up Required**   | Medium (50-80%)      | Action items without clear ownership             |
| 🟢 **Information Complete** | High (>80%)          | All key elements present and clear               |

### Flag Application Strategy:

**Single-File Output**:

- Limit to 2-3 highest priority flags to avoid overwhelming
- Focus on actionable issues that impact immediate next steps
- Use concise descriptions suitable for quick scanning

**Multi-File Output**:

- Include all relevant flags with detailed context
- Reference specific sections/files where issues occur
- Provide comprehensive flag analysis in index file

**Flag Format Examples:**

**Single-File (Concise)**:

```
## Quality Flags
- 🔴 **Missing Owner**: No assigned owner for system deployment task
- 🟡 **Timeline Unclear**: "Soon" mentioned without specific deadline
```

**Multi-File (Detailed)**:

```
⚠️ QUALITY ASSESSMENT (Confidence: High/Medium/Low)
🔴 Critical Gap (High): Referenced "previous budget approval" without context (File: 02_Budget_Discussion)
🟡 Clarification Needed (Medium): "Optimal performance" lacks specific metrics (File: 03_Technical_Requirements)
🔵 Potential Conflict (High): Timeline estimates vary - 2 weeks vs 1 month (Files: 02_Planning, 04_Resources)
🟣 Unresolved (High): Database choice decision postponed (File: 03_Technical_Architecture)
🟠 Follow-up Required (Medium): Testing responsibilities unassigned (File: 05_Implementation_Plan)
```
