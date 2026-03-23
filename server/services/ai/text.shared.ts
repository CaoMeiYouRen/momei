import {
    composeVisualPrompt,
    extractVisualPromptDimensions,
    resolveVisualPromptDimensions,
    type AIVisualPromptContext,
} from '@/utils/shared/ai-visual-asset'
import type {
    AIVisualAssetApplyMode,
    AIVisualAssetUsage,
    AIVisualPromptDimensions,
    AIVisualPromptSuggestion,
} from '@/types/ai'

export interface ScaffoldOptions {
    topic?: string
    snippets?: string[]
    template?: 'blog' | 'tutorial' | 'note' | 'report'
    sectionCount?: number
    audience?: 'beginner' | 'intermediate' | 'advanced'
    includeIntroConclusion?: boolean
    language?: string
}

export interface ExpandSectionOptions {
    topic: string
    sectionTitle: string
    sectionContent: string
    expandType: 'argument' | 'case' | 'question' | 'reference' | 'data'
    language?: string
}

export interface SuggestImagePromptOptions {
    title?: string
    summary?: string
    content?: string
    language?: string
    assetUsage?: AIVisualAssetUsage
    applyMode?: AIVisualAssetApplyMode
}

export interface RecommendCategoriesOptions {
    title: string
    content: string
    categories: string[]
    language?: string
}

function extractJSONObject(content: string): Record<string, unknown> | null {
    const startIndex = content.indexOf('{')
    const endIndex = content.lastIndexOf('}')

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
        return null
    }

    try {
        return JSON.parse(content.slice(startIndex, endIndex + 1)) as Record<string, unknown>
    } catch {
        return null
    }
}

function sanitizePromptDimension(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value.replace(/\s+/g, ' ').trim()
    return normalized ? normalized.slice(0, 240) : undefined
}

export function parseVisualPromptSuggestion(
    content: string,
    assetUsage: AIVisualAssetUsage,
    applyMode: AIVisualAssetApplyMode,
    context: AIVisualPromptContext,
): AIVisualPromptSuggestion {
    const parsed = extractJSONObject(content)
    const overrides: Partial<AIVisualPromptDimensions> = {
        type: sanitizePromptDimension(parsed?.type),
        palette: sanitizePromptDimension(parsed?.palette),
        rendering: sanitizePromptDimension(parsed?.rendering),
        text: sanitizePromptDimension(parsed?.text),
        mood: sanitizePromptDimension(parsed?.mood),
    }

    const resolution = resolveVisualPromptDimensions(assetUsage, context, overrides, 'ai')
    const dimensions = extractVisualPromptDimensions(resolution)

    return {
        assetUsage,
        applyMode,
        dimensions,
        prompt: composeVisualPrompt(assetUsage, context, dimensions),
    }
}
