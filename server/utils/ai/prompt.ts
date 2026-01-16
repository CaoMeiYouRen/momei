export const AI_PROMPTS = {
    SUGGEST_TITLES: 'Based on the following content, suggest 5-10 catchy and SEO-friendly titles in {{language}}. Output as a JSON array of strings: \n\n{{content}}',
    SUGGEST_SLUG: 'Based on the title and content below, suggest a concise, lowercase, URL-friendly slug (URL alias) using only letters, numbers, and hyphens. It should be based on core keywords and optimized for SEO. Output ONLY the slug text, no explanation or prefixes: \n\nTitle: {{title}}\n\nContent: {{content}}',
    SUMMARIZE: 'Summarize the following content in {{language}} (max {{maxLength}} characters). IMPORTANT: Provide only the summary text itself. Do not include word counts, title prefixes, colons, or introductory phrases like "The summary is:". \n\n{{content}}',
    TRANSLATE: 'Translate the following markdown content from {{from}} to {{to}}. Maintain all markdown formatting, links, and code blocks: \n\n{{content}}',
}

export function formatPrompt(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match)
}
