export const AI_PROMPTS = {
    SUGGEST_TITLES:
        'Based on the following content, suggest 5-10 catchy and SEO-friendly titles in {{language}}. Output as a JSON array of strings: \n\n{{content}}',
    SUGGEST_SLUG:
        'Based on the title and content below, suggest a concise, lowercase, URL-friendly slug (URL alias) using only letters, numbers, and hyphens. It should be based on core keywords and optimized for SEO. Output ONLY the slug text, no explanation or prefixes: \n\nTitle: {{title}}\n\nContent: {{content}}',
    SUMMARIZE:
        'Summarize the following content in {{language}} (max {{maxLength}} characters). IMPORTANT: Provide only the summary text itself. Do not include word counts, title prefixes, colons, or introductory phrases like "The summary is:". \n\n{{content}}',
    TRANSLATE:
        'Translate the following markdown content to {{to}}. Maintain all markdown formatting, links, and code blocks. IMPORTANT: Provide only the translated content itself: \n\n{{content}}',
    TRANSLATE_NAME:
        'Translate the following term from any language to {{to}}. Output ONLY the translated term, no explanation or punctuation: \n\n{{name}}',
    SUGGEST_SLUG_FROM_NAME:
        'Based on the name "{{name}}", create a concise, lowercase, URL-friendly slug. If it is already a slug, return it. Output ONLY the slug text: \n\n{{name}}',
    GENERATE_SCAFFOLD:
        'You are a professional writing assistant. Based on the following collection of snippets (ideas, notes, quotes), please organize them into a logical article outline (scaffold) in {{language}}. The outline should include a title and several chapters/sections. For each section, provide a brief description of what to cover. Output in standard Markdown format:\n\nSnippets:\n{{snippets}}',
    GENERATE_SCAFFOLD_V2:
        'Please generate a structured article outline in {{language}}.\n'
        + 'Target Audience: {{audience}}\n'
        + 'Writing Template: {{template}}\n'
        + 'Target Section Count: {{sectionCount}}\n'
        + 'Include Introduction/Conclusion: {{includeIntroConclusion}}\n'
        + '{{inputSource}}\n\n'
        + 'Requirement: Output the outline in standard Markdown format. Each section should have a title (H2) and 2-3 bullet points describing the intended content. Ensure logical flow and professional tone.',
    EXPAND_SECTION:
        'As a professional writing assistant, please expand the following section of an article outline.\n'
        + 'Current Article Topic: {{topic}}\n'
        + 'Current Section: {{sectionTitle}}\n'
        + 'Section Context: {{sectionContent}}\n'
        + 'Expansion Type: {{expandType}}\n'
        + 'Language: {{language}}\n\n'
        + 'Requirement: Provide 3-5 deep insights or suggestions specifically for this section based on the expansion type. Output as a bulleted list in Markdown.',
    REFINE_VOICE:
        'The following text is a rough transcript from a voice recording. Please polish it into a professional, coherent, and grammatically correct blog post snippet in {{language}}. Fix any misrecognitions, filter out filler words (umd, ah, etc.), and improve the flow while preserving the original meaning. Output ONLY the polished text, no explanations: \n\n{{content}}',
    MANUSCRIPT_OPTIMIZE:
        'You are a professional podcast script writer. Convert the following blog content into a natural, engaging broadcast manuscript in {{language}} suitable for text-to-speech. \n'
        + '- Remove markdown artifacts, bracketed links, and technical URLs.\n'
        + '- Use conversational language and spoken grammar.\n'
        + '- If the tone is too formal, make it more relatable.\n'
        + '- Keep the core message but optimize for listening experience.\n'
        + 'Output ONLY the polished broadcast script: \n\n{{content}}',
    MANUSCRIPT_OPTIMIZE_SINGLE:
        'You are a professional voice-over script writer. Convert the following blog content into a natural, coherent single-speaker narration in {{language}} suitable for text-to-speech. \n'
        + '- Remove markdown artifacts, bracketed links, and technical URLs.\n'
        + '- Keep one consistent narrator voice throughout the script.\n'
        + '- Use smooth spoken grammar and transitions.\n'
        + '- Keep the core message but optimize for listening experience.\n'
        + 'Output ONLY the polished narration script: \n\n{{content}}',
    MANUSCRIPT_OPTIMIZE_DUAL:
        'You are a professional podcast script writer. Convert the following blog content into a natural, engaging dual-speaker dialogue script in {{language}} suitable for podcast-style text-to-speech. \n'
        + '- Remove markdown artifacts, bracketed links, and technical URLs.\n'
        + '- Rewrite content as a clear two-person conversation with alternating lines.\n'
        + '- Keep speaking style natural and conversational, with concise turns and smooth transitions.\n'
        + '- Keep the core message but optimize for listening experience.\n'
        + 'Output ONLY the polished dual-speaker script: \n\n{{content}}',
    RECOMMEND_TAGS:
        'Help me recommend 5-10 tags for the following article in {{language}}. Choose tags that are relevant, SEO-friendly, and common in technical blogging. Output ONLY as a JSON array of strings: \n\n{{content}}',
}

export function formatPrompt(
    template: string,
    variables: Record<string, any>,
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(variables, key)
            ? String(variables[key])
            : match,
    )
}
