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

function isChineseLanguage(language: string | null | undefined): boolean {
    return /^zh(?:-|$)/i.test(language || '')
}

function hasCjk(text: string): boolean {
    return /[\u3400-\u9fff]/.test(text)
}

function isLikelyEnglishDimension(text: string): boolean {
    const letters = (text.match(/[A-Za-z]/g) || []).length
    return letters >= 8 && !hasCjk(text)
}

function localizeDimensionForChinese(
    key: keyof AIVisualPromptDimensions,
    value: string,
    context: AIVisualPromptContext,
): string {
    if (!isLikelyEnglishDimension(value)) {
        return value
    }

    if (key === 'type') {
        return `${value}; 以中文语境表达，主体明确，突出文章核心概念`
    }

    if (key === 'palette') {
        return `${value}; 颜色描述使用中文语义，保持对比清晰`
    }

    if (key === 'rendering') {
        return `${value}; 渲染风格用中文表达，强调层次与质感`
    }

    if (key === 'text') {
        const title = typeof context.title === 'string' ? context.title.trim() : ''
        if (title) {
            return `${value}; 文案使用中文标题「${title}」，控制在 2 行以内`
        }
        return `${value}; 文案使用中文短标题，控制在 2 行以内`
    }

    return `${value}; 氛围表达使用中文词汇，避免空泛形容`
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

    if (isChineseLanguage(context.language)) {
        dimensions.type = localizeDimensionForChinese('type', dimensions.type, context)
        dimensions.palette = localizeDimensionForChinese('palette', dimensions.palette, context)
        dimensions.rendering = localizeDimensionForChinese('rendering', dimensions.rendering, context)
        dimensions.text = localizeDimensionForChinese('text', dimensions.text, context)
        dimensions.mood = localizeDimensionForChinese('mood', dimensions.mood, context)
    }

    return {
        assetUsage,
        applyMode,
        dimensions,
        prompt: composeVisualPrompt(assetUsage, context, dimensions),
    }
}
