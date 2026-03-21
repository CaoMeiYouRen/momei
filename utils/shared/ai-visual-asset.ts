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

export const AI_VISUAL_ASSET_USAGE_PRESETS: Record<AIVisualAssetUsage, AIVisualAssetPreset> = {
    'post-cover': {
        aspectRatio: '16:9',
        size: '2K',
        applyMode: 'manual-confirm',
        typeFallback: 'editorial cover composition with a single clear focal subject',
        paletteFallback: 'ink black, porcelain white, muted crimson accent',
        renderingFallback: 'premium digital editorial illustration with crisp depth and clean edges',
        textFallback: 'centered headline with generous safe margins for responsive cover cropping',
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

function resolveSummary(context: AIVisualPromptContext): string | null {
    const summary = normalizeText(context.summary, MAX_SUMMARY_LENGTH)
    if (summary) {
        return summary
    }

    return normalizeText(context.content, MAX_SUMMARY_LENGTH)
}

function resolveTextDimensionValue(
    assetUsage: AIVisualAssetUsage,
    title: string | null,
    language: string,
    fallback: string,
) {
    if (!title) {
        return {
            value: fallback,
            source: 'default' as const,
        }
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
    const title = normalizeText(context.title, 120)
    const summary = resolveSummary(context)
    const language = normalizeText(context.language, 16) || 'zh-CN'

    const textDimension = resolveTextDimensionValue(assetUsage, title, language, preset.textFallback)

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
        const overrideValue = normalizeText(overrides[key], 240)
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
    const title = normalizeText(context.title, 120) || 'N/A'
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
