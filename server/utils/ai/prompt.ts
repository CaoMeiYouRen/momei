export const AI_PROMPTS = {
    SUGGEST_TITLES: 'Based on the following content, suggest 5-10 catchy and SEO-friendly titles. Output as a JSON array of strings: \n\n{{content}}',
    SUMMARIZE: 'Summarize the following content in a concise way (max {{maxLength}} characters): \n\n{{content}}',
    TRANSLATE: 'Translate the following markdown content from {{from}} to {{to}}. Maintain all markdown formatting, links, and code blocks: \n\n{{content}}',
}

export function formatPrompt(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match)
}
