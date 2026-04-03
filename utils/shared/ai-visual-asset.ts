import type {
    AIVisualAssetApplyMode,
    AIVisualAssetUsage,
    AIVisualPromptDimensions,
} from '@/types/ai'

export type AIVisualPromptDimensionKey = keyof AIVisualPromptDimensions

export type AIVisualPromptValueSource = 'scene' | 'title' | 'summary' | 'default' | 'manual' | 'ai'

export interface AIVisualPromptContext {
    title?: string | null
    summary?: string | null
    content?: string | null
    language?: string | null
}

export interface AIVisualPromptDimensionResolution {
    value: string
    source: AIVisualPromptValueSource
    fallback: string
}

export type AIVisualPromptResolution = Record<AIVisualPromptDimensionKey, AIVisualPromptDimensionResolution>

interface AIVisualAssetPreset {
    aspectRatio: string
    size: string
    applyMode: AIVisualAssetApplyMode
    typeFallback: string
    paletteFallback: string
    renderingFallback: string
    textFallback: string
    moodFallback: string
    promptHint: string
}

const MAX_SUMMARY_LENGTH = 120
const MAX_TITLE_LENGTH = 120
const MAX_OVERRIDE_LENGTH = 240
const SHORT_CJK_SENTENCE_MIN = 6
const SHORT_CJK_SENTENCE_MAX = 20
const SHORT_LATIN_WORDS_MAX = 8
const SHORT_LATIN_CHARS_MAX = 60
const SHORT_CJK_TITLE_MAX = 18
const SHORT_LATIN_TITLE_WORDS_MAX = 6
const SHORT_LATIN_TITLE_CHARS_MAX = 48
const TRUNCATED_CJK_TITLE_MAX = 20
const TRUNCATED_LATIN_TITLE_WORDS_MAX = 8
const TRUNCATED_LATIN_TITLE_CHARS_MAX = 56

interface PostCoverTextPlan {
    text: string
    source: 'summary' | 'title'
    sizeLabel: string
    maxLines: 1 | 2
    wrapInstruction: string
}

export const AI_VISUAL_ASSET_USAGE_PRESETS: Record<AIVisualAssetUsage, AIVisualAssetPreset> = {
    'post-cover': {
        aspectRatio: '16:9',
        size: '2K',
        applyMode: 'manual-confirm',
        typeFallback: 'editorial cover composition with a single clear focal subject',
        paletteFallback: 'ink black, porcelain white, muted crimson accent',
        renderingFallback: 'premium digital editorial illustration with crisp depth and clean edges',
        textFallback: 'one short visible cover line in extra-large display type with balanced wrapping and generous safe margins',
        moodFallback: 'calm, thoughtful, modern, quietly confident',
        promptHint: 'Keep the composition readable after thumbnail cropping and preserve a safe area around the title.',
    },
    'post-illustration': {
        aspectRatio: '4:3',
        size: '2K',
        applyMode: 'manual-confirm',
        typeFallback: 'supporting in-article illustration that explains the main idea visually',
        paletteFallback: 'paper white, graphite gray, restrained accent color',
        renderingFallback: 'clean editorial illustration suitable for technical blogging',
        textFallback: 'avoid embedded text and let the imagery carry the explanation',
        moodFallback: 'clear, intelligent, focused, instructive',
        promptHint: 'Favor explanatory imagery and avoid heavy poster-style typography.',
    },
    'topic-hero': {
        aspectRatio: '16:9',
        size: '4K',
        applyMode: 'manual-confirm',
        typeFallback: 'wide thematic hero banner with layered depth and a strong opening statement',
        paletteFallback: 'deep charcoal, warm ivory, atmospheric accent light',
        renderingFallback: 'cinematic wide hero art with polished lighting and modern editorial finish',
        textFallback: 'short thematic title lockup with wide horizontal safe area',
        moodFallback: 'immersive, aspirational, refined, slightly poetic',
        promptHint: 'Prioritize wide composition and a strong first-glance hierarchy for landing pages.',
    },
    'event-poster': {
        aspectRatio: '3:4',
        size: '4K',
        applyMode: 'manual-confirm',
        typeFallback: 'event poster layout with a bold central motif and strong visual hierarchy',
        paletteFallback: 'high-contrast dark base with bright event accent colors',
        renderingFallback: 'graphic poster design mixing polished illustration and sharp typography cues',
        textFallback: 'poster title hierarchy with room for date, venue, and call-to-action details',
        moodFallback: 'energetic, welcoming, vivid, event-ready',
        promptHint: 'Reserve clear typography zones for event information and favor poster rhythm over article cover balance.',
    },
}

export function getVisualAssetPreset(assetUsage: AIVisualAssetUsage): AIVisualAssetPreset {
    return AI_VISUAL_ASSET_USAGE_PRESETS[assetUsage]
}

function normalizeText(value?: string | null, maxLength?: number): string | null {
    if (!value) {
        return null
    }

    const normalized = value.replace(/\s+/g, ' ').trim()
    if (!normalized) {
        return null
    }

    if (!maxLength || normalized.length <= maxLength) {
        return normalized
    }

    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function containsCjk(text: string): boolean {
    return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(text)
}

function countWords(text: string): number {
    const normalized = normalizeText(text)
    if (!normalized) {
        return 0
    }

    return normalized.split(/\s+/).filter(Boolean).length
}

function trimWithEllipsis(text: string, maxLength: number): string {
    const chars = Array.from(text)
    if (chars.length <= maxLength) {
        return text
    }

    return `${chars.slice(0, Math.max(0, maxLength - 1)).join('').trimEnd()}…`
}

function stripLeadFiller(text: string): string {
    return text
        .replace(/^(how to|guide to|guide for|introduction to|overview of|deep dive into)\s+/i, '')
        .replace(/^(a|an|the)\s+/i, '')
        .replace(/^(如何|关于|一文|本文|这篇文章|讨论|介绍|解析|分享|探索|记录|说明|聊聊|我们来)\s*/u, '')
        .trim()
}

function extractSentenceCandidates(value?: string | null): string[] {
    const normalized = normalizeText(value)
    if (!normalized) {
        return []
    }

    return normalized
        .split(/[。！？!?；;:\n]+/)
        .map((item) => normalizeText(item))
        .filter((item): item is string => Boolean(item))
}

function isShortCoverLine(text: string): boolean {
    if (containsCjk(text)) {
        const length = Array.from(text).length
        return length >= SHORT_CJK_SENTENCE_MIN && length <= SHORT_CJK_SENTENCE_MAX
    }

    const words = countWords(text)
    return words >= 2 && words <= SHORT_LATIN_WORDS_MAX && text.length <= SHORT_LATIN_CHARS_MAX
}

function resolveCoverSentence(context: AIVisualPromptContext): string | null {
    const candidates = [context.summary, context.content]

    for (const candidate of candidates) {
        const matched = extractSentenceCandidates(candidate).find(isShortCoverLine)
        if (matched) {
            return matched
        }
    }

    return null
}

function resolveKeywordSummaryCandidate(value?: string | null): string | null {
    const normalized = normalizeText(value)
    if (!normalized) {
        return null
    }

    const stripped = stripLeadFiller(normalized)
    if (!stripped) {
        return null
    }

    if (containsCjk(stripped)) {
        const compact = stripped.replace(/[^\p{L}\p{N}]+/gu, '')
        if (!compact) {
            return null
        }

        return trimWithEllipsis(compact, 14)
    }

    const tokens = stripped
        .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
        .split(/\s+/)
        .filter((token) => token && !/^(and|or|the|a|an|to|of|for|with|in|on|by|from|via|using)$/i.test(token))

    if (tokens.length === 0) {
        return null
    }

    return trimWithEllipsis(tokens.slice(0, 6).join(' '), 42)
}

function resolveShortTitleCandidate(title: string | null): string | null {
    if (!title) {
        return null
    }

    const segments = title
        .split(/[:：|｜]|\s[-—–/]\s/)
        .map((item) => normalizeText(item))
        .filter((item): item is string => Boolean(item))

    const candidates = segments.length > 0 ? segments : [title]

    return candidates.find((candidate) => {
        if (containsCjk(candidate)) {
            return Array.from(candidate).length <= SHORT_CJK_TITLE_MAX
        }

        return countWords(candidate) <= SHORT_LATIN_TITLE_WORDS_MAX && candidate.length <= SHORT_LATIN_TITLE_CHARS_MAX
    }) || null
}

function truncateRawTitle(title: string | null): string | null {
    if (!title) {
        return null
    }

    if (containsCjk(title)) {
        return trimWithEllipsis(title, TRUNCATED_CJK_TITLE_MAX)
    }

    const tokens = title.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) {
        return trimWithEllipsis(title, TRUNCATED_LATIN_TITLE_CHARS_MAX)
    }

    const collected: string[] = []
    for (const token of tokens) {
        const next = [...collected, token].join(' ')
        if (collected.length >= TRUNCATED_LATIN_TITLE_WORDS_MAX || next.length > TRUNCATED_LATIN_TITLE_CHARS_MAX) {
            break
        }
        collected.push(token)
    }

    const compact = collected.join(' ')
    if (!compact) {
        return trimWithEllipsis(title, TRUNCATED_LATIN_TITLE_CHARS_MAX)
    }

    return compact.length < title.length ? `${compact}…` : compact
}

function hasLongUnbrokenWord(text: string): boolean {
    return text
        .split(/\s+/)
        .some((token) => token.replace(/['’]/g, '').length >= 14)
}

function createPostCoverTextPlan(text: string, source: 'summary' | 'title'): PostCoverTextPlan {
    const cjk = containsCjk(text)
    const visualLength = Array.from(text).length
    const words = countWords(text)
    const longWord = hasLongUnbrokenWord(text)

    let sizeLabel = 'large'
    if ((cjk && visualLength <= 10) || (!cjk && words > 0 && words <= 4 && visualLength <= 32 && !longWord)) {
        sizeLabel = 'extra-large'
    } else if ((cjk && visualLength > 18) || (!cjk && (visualLength > 48 || longWord))) {
        sizeLabel = 'medium-large'
    }

    return {
        text,
        source,
        sizeLabel,
        maxLines: sizeLabel === 'extra-large' && !longWord ? 1 : 2,
        wrapInstruction: longWord
            ? 'allow gentle downscaling for long unbroken words and keep balanced wrapping'
            : 'keep balanced line breaks and preserve a strong headline hierarchy',
    }
}

function resolvePostCoverTextPlan(context: AIVisualPromptContext): PostCoverTextPlan | null {
    const shortSentence = resolveCoverSentence(context)
    if (shortSentence) {
        return createPostCoverTextPlan(shortSentence, 'summary')
    }

    const keywordSummary = resolveKeywordSummaryCandidate(context.summary) || resolveKeywordSummaryCandidate(context.content)
    if (keywordSummary) {
        return createPostCoverTextPlan(keywordSummary, 'summary')
    }

    const title = normalizeText(context.title, MAX_TITLE_LENGTH)
    const shortTitle = resolveShortTitleCandidate(title)
    if (shortTitle) {
        return createPostCoverTextPlan(shortTitle, 'title')
    }

    const truncatedTitle = truncateRawTitle(title)
    if (truncatedTitle) {
        return createPostCoverTextPlan(truncatedTitle, 'title')
    }

    return null
}

function resolveSummary(context: AIVisualPromptContext): string | null {
    const summary = normalizeText(context.summary, MAX_SUMMARY_LENGTH)
    if (summary) {
        return summary
    }

    return normalizeText(context.content, MAX_SUMMARY_LENGTH)
}

function resolvePostCoverTextDimensionValue(
    context: AIVisualPromptContext,
    fallback: string,
) {
    const plan = resolvePostCoverTextPlan(context)
    if (!plan) {
        return {
            value: fallback,
            source: 'default' as const,
        }
    }

    return {
        value: `visible cover headline: "${plan.text}"; typography: ${plan.sizeLabel} display type; max ${plan.maxLines} lines; ${plan.wrapInstruction}; keep generous safe margins and never shrink into paragraph-sized copy`,
        source: plan.source,
    }
}

function resolveTextDimensionValue(
    assetUsage: AIVisualAssetUsage,
    context: AIVisualPromptContext,
    language: string,
    fallback: string,
) {
    const title = normalizeText(context.title, MAX_TITLE_LENGTH)

    if (!title) {
        return {
            value: fallback,
            source: 'default' as const,
        }
    }

    if (assetUsage === 'post-cover') {
        return resolvePostCoverTextDimensionValue(context, fallback)
    }

    if (assetUsage === 'post-illustration') {
        return {
            value: `optional micro caption only if needed, otherwise keep typography out; language ${language}; visual topic: ${title}`,
            source: 'title' as const,
        }
    }

    return {
        value: `use "${title}" as the visible title text in ${language}; ${fallback}`,
        source: 'title' as const,
    }
}

export function resolveVisualPromptDimensions(
    assetUsage: AIVisualAssetUsage,
    context: AIVisualPromptContext,
    overrides: Partial<AIVisualPromptDimensions> = {},
    source: AIVisualPromptValueSource = 'manual',
): AIVisualPromptResolution {
    const preset = getVisualAssetPreset(assetUsage)
    const title = normalizeText(context.title, MAX_TITLE_LENGTH)
    const summary = resolveSummary(context)
    const language = normalizeText(context.language, 16) || 'zh-CN'

    const textDimension = resolveTextDimensionValue(assetUsage, context, language, preset.textFallback)

    const base: AIVisualPromptResolution = {
        type: {
            value: title ? `${preset.typeFallback}; narrative anchor: ${title}` : preset.typeFallback,
            source: title ? 'title' : 'default',
            fallback: preset.typeFallback,
        },
        palette: {
            value: preset.paletteFallback,
            source: 'scene',
            fallback: preset.paletteFallback,
        },
        rendering: {
            value: preset.renderingFallback,
            source: 'scene',
            fallback: preset.renderingFallback,
        },
        text: {
            value: textDimension.value,
            source: textDimension.source,
            fallback: preset.textFallback,
        },
        mood: {
            value: summary ? `${preset.moodFallback}; emotional cue: ${summary}` : preset.moodFallback,
            source: summary ? 'summary' : 'default',
            fallback: preset.moodFallback,
        },
    }

    const keys = Object.keys(base) as AIVisualPromptDimensionKey[]

    keys.forEach((key) => {
        const overrideValue = normalizeText(overrides[key], MAX_OVERRIDE_LENGTH)
        if (overrideValue) {
            base[key] = {
                value: overrideValue,
                source,
                fallback: base[key].fallback,
            }
        }
    })

    return base
}

export function extractVisualPromptDimensions(resolution: AIVisualPromptResolution): AIVisualPromptDimensions {
    return {
        type: resolution.type.value,
        palette: resolution.palette.value,
        rendering: resolution.rendering.value,
        text: resolution.text.value,
        mood: resolution.mood.value,
    }
}

export function composeVisualPrompt(
    assetUsage: AIVisualAssetUsage,
    context: AIVisualPromptContext,
    dimensions: AIVisualPromptDimensions,
): string {
    const preset = getVisualAssetPreset(assetUsage)
    const title = normalizeText(context.title, MAX_TITLE_LENGTH) || 'N/A'
    const summary = resolveSummary(context) || 'N/A'
    const language = normalizeText(context.language, 16) || 'zh-CN'

    return [
        `Create a ${assetUsage} visual asset for a multilingual developer blog.`,
        `Language: ${language}.`,
        `Primary composition: ${dimensions.type}.`,
        `Color palette: ${dimensions.palette}.`,
        `Rendering approach: ${dimensions.rendering}.`,
        `Text treatment: ${dimensions.text}.`,
        `Atmosphere: ${dimensions.mood}.`,
        `Article title: ${title}.`,
        `Content summary: ${summary}.`,
        preset.promptHint,
    ].join('\n')
}
