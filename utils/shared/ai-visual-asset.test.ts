import { describe, expect, it } from 'vitest'
import {
    composeVisualPrompt,
    extractVisualPromptDimensions,
    getVisualAssetPreset,
    resolveVisualPromptDimensions,
} from './ai-visual-asset'

describe('ai-visual-asset helpers', () => {
    it('derives five-dimension prompt defaults from usage and content context', () => {
        const resolution = resolveVisualPromptDimensions('post-cover', {
            title: '跨语言内容工作流',
            summary: '讨论如何把多语言创作链路和视觉系统统一起来。',
            language: 'zh-CN',
        })

        expect(resolution.type.source).toBe('title')
        expect(resolution.text.source).toBe('summary')
        expect(resolution.mood.source).toBe('summary')
        expect(resolution.palette.source).toBe('scene')
        expect(resolution.type.fallback).toContain('editorial cover composition')
    })

    it('prioritizes a short summary sentence for post covers and keeps the type large', () => {
        const resolution = resolveVisualPromptDimensions('post-cover', {
            title: '一篇非常长的默认封面原始标题用于验证不会直接整段塞进封面里',
            summary: '多语言创作需要统一视觉节奏。',
            language: 'zh-CN',
        })

        expect(resolution.text.source).toBe('summary')
        expect(resolution.text.value).toContain('visible cover headline: "多语言创作需要统一视觉节奏"')
        expect(resolution.text.value).toContain('large display type')
        expect(resolution.text.value).toContain('max 2 lines')
    })

    it('compresses verbose summaries before falling back to the title', () => {
        const resolution = resolveVisualPromptDimensions('post-cover', {
            title: 'This is a very long article title about keeping consistent typography in generated editorial covers',
            summary: 'A practical guide to distributed caching, worker queues, retry boundaries, and failure recovery for multilingual publishing pipelines',
            language: 'en-US',
        })

        expect(resolution.text.source).toBe('summary')
        expect(resolution.text.value).toContain('visible cover headline: "practical guide distributed caching')
        expect(resolution.text.value).toContain('large display type')
        expect(resolution.text.value).not.toContain('This is a very long article title')
    })

    it('falls back to a truncated raw title when no summary is available', () => {
        const resolution = resolveVisualPromptDimensions('post-cover', {
            title: 'Building predictable default cover typography for extra long multilingual editorial titles without shrinking everything too much',
            language: 'en-US',
        })

        expect(resolution.text.source).toBe('title')
        expect(resolution.text.value).toContain('visible cover headline: "Building predictable default cover typography for extra…"')
        expect(resolution.text.value).toContain('medium-large display type')
        expect(resolution.text.value).toContain('max 2 lines')
    })

    it('prefers a short title segment before truncating the raw title', () => {
        const resolution = resolveVisualPromptDimensions('post-cover', {
            title: 'Nuxt 封面生成：大字号策略落地与默认排版收敛',
            language: 'zh-CN',
        })

        expect(resolution.text.source).toBe('title')
        expect(resolution.text.value).toContain('visible cover headline: "Nuxt 封面生成"')
        expect(resolution.text.value).not.toContain('大字号策略落地与默认排版收敛')
    })

    it('lets explicit overrides win over scene defaults', () => {
        const resolution = resolveVisualPromptDimensions('event-poster', {
            title: 'AI 创作沙龙',
            language: 'zh-CN',
        }, {
            palette: 'vermillion, warm beige, matte black',
            mood: 'festive and energetic',
        })

        expect(resolution.palette.value).toBe('vermillion, warm beige, matte black')
        expect(resolution.palette.source).toBe('manual')
        expect(resolution.mood.value).toBe('festive and energetic')
        expect(resolution.mood.source).toBe('manual')
    })

    it('composes a final prompt from the five-dimension model', () => {
        const preset = getVisualAssetPreset('post-illustration')
        const dimensions = extractVisualPromptDimensions(resolveVisualPromptDimensions('post-illustration', {
            title: 'Prompt 工程指南',
            summary: '解释如何让文章配图承担说明任务。',
            language: 'zh-CN',
        }))

        const prompt = composeVisualPrompt('post-illustration', {
            title: 'Prompt 工程指南',
            summary: '解释如何让文章配图承担说明任务。',
            language: 'zh-CN',
        }, dimensions)

        expect(prompt).toContain('Create a post-illustration visual asset')
        expect(prompt).toContain(dimensions.type)
        expect(prompt).toContain(dimensions.palette)
        expect(prompt).toContain(preset.promptHint)
    })
})
