# Examples

**Example 1: Small Customer Support Call (Single-File)**

```
Input: 300-word customer troubleshooting conversation
Detection: Customer Support (High: 91%) | Length: Short
Default Structure: Single File (optimal for focused issue resolution)
Output: Customer_Support_Summary_2024-08-24.md
- Overview, Issue description, Resolution steps, Follow-up
- 2 minimal flags, 1 action item, essential tags only
```

**Example 2: Medium Planning Discussion (Auto-Decide)**

```
Input: 800-word project planning conversation with 3 distinct topics
Detection: Project Planning (Medium: 72%) | Length: Medium | Complexity: Mixed themes
Auto-Decision: Multi-File (due to distinct topics requiring separate focus)
Output: 01_Project_Overview_2024-08-24.md, 02_Timeline_Discussion_2024-08-24.md,
        03_Resource_Planning_2024-08-24.md, 99_Action_Items_Follow_up_2024-08-24.md
```

**Example 3: Large Technical Architecture Meeting (Multi-File)**

```
Input: 2,500-word technical architecture discussion
Detection: Technical Discussion (High: 87%) | Length: Long | Complexity: High
Structure: Multi-File (comprehensive breakdown needed)
Output: 01_Technical_Overview_2024-08-24.md, 02_Architecture_Decisions_2024-08-24.md,
        03_Implementation_Notes_2024-08-24.md, 04_Risk_Assessment_2024-08-24.md,
        00_Index_Overview_2024-08-24.md, 99_Action_Items_Follow_up_2024-08-24.md
```

**Example 4: Simple Follow-up Check-in (Single-File)**

```
Input: 150-word brief status update call
Detection: General Discussion (Medium: 58%) | Length: Short
Structure: Single File (concise format ideal for quick updates)
Output: Status_Update_Summary_2024-08-24.md
- Minimal structure: Status overview, Key updates, Next check-in
- 0-1 flags, streamlined for quick reference
```
