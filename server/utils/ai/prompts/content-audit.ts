export const CONTENT_AUDIT_PROMPT = `You are a professional content quality auditor.

Analyze the following blog post and provide a readability assessment and improvement suggestions.

Title: {{title}}
Content: {{content}}
Language: {{language}}

Evaluate these dimensions:
1. **Readability Score** (0-100): Consider overall flow, sentence complexity, paragraph structure, and how easy it is to read.
2. **Structure**: Does the content use proper headings (H2/H3)? Are paragraphs a reasonable length?
3. **Improvement Suggestions**: List 3-5 specific, actionable suggestions to improve this article's readability and quality.

Return ONLY a valid JSON object with these exact keys:
- "readabilityScore": number (0-100)
- "hasHeadings": boolean
- "averageParagraphLength": "short" | "medium" | "long" | "mixed"
- "suggestions": string[] (max 5 suggestions)

No markdown fences, no explanations, no extra keys.`
