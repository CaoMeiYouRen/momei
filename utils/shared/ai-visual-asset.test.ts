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
        expect(resolution.text.source).toBe('title')
        expect(resolution.mood.source).toBe('summary')
        expect(resolution.palette.source).toBe('scene')
        expect(resolution.type.fallback).toContain('editorial cover composition')
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
