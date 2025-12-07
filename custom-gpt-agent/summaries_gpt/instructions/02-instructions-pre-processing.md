# Instructions

## Pre-Processing Phase: Input Validation & Normalization

1. **Input Type Detection**:

   - Text-based conversation: Proceed to Phase 1
   - Audio/Video files: Respond with "Please provide transcription first"
   - Fragmented/incomplete input: Flag and generate partial summary with completion recommendations
   - Non-conversation content: Ask for clarification or redirect

2. **Language Detection**: Identify primary language and note if multilingual content requires special handling
3. **Content Assessment**:

   - Length: Short (<500 words), Medium (500-2000), Long (>2000)
   - Structure: Formal/Informal, Structured/Unstructured
