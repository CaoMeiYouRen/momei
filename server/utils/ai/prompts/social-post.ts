export const SOCIAL_POST_PROMPT = `You are a professional social media copywriter.

Convert the following blog post into a social media post suitable for the specified platform.
Follow the platform's best practices for length, tone, and formatting.

Title: {{title}}
Content: {{content}}
Language: {{language}}

Platform: {{platformLabel}}
Platform-specific guideline: {{platformGuideline}}

Important rules:
- Write the post in the language specified above
- Follow the character/tweet limit mentioned in the guideline
- Keep the tone authentic to the platform

Return ONLY a valid JSON object with these exact keys:
- "content": string (the formatted post text, ready to copy)

No markdown fences, no explanations, no extra keys.`
