import { describe, expect, it } from 'vitest'
import { parseVisualPromptSuggestion } from './text.shared'
import { extractVisualPromptDimensions, resolveVisualPromptDimensions } from '@/utils/shared/ai-visual-asset'

describe('ai text shared helpers', () => {
    it('parses embedded json prompt suggestions and sanitizes overrides', () => {
        const suggestion = parseVisualPromptSuggestion(
            `analysis\n{"type":"  layered editorial collage  ","palette":" coral   and teal ","rendering":"${'x'.repeat(260)}","text":123,"mood":" calm   and precise "}\nsummary`,
            'post-cover',
            'manual-confirm',
            {
                title: 'Prompt 工程指南',
                summary: '解释如何让视觉系统在多语言场景里保持一致。',
                language: 'zh-CN',
            },
        )

        expect(suggestion.assetUsage).toBe('post-cover')
        expect(suggestion.applyMode).toBe('manual-confirm')
        expect(suggestion.dimensions.type).toBe('layered editorial collage')
        expect(suggestion.dimensions.palette).toBe('coral and teal')
        expect(suggestion.dimensions.mood).toBe('calm and precise')
        expect(suggestion.dimensions.rendering).toHaveLength(240)
        expect(suggestion.dimensions.text).toContain('visible cover headline')
        expect(suggestion.prompt).toContain('layered editorial collage')
        expect(suggestion.prompt).toContain('coral and teal')
    })

    it('falls back to resolved defaults when content does not contain valid json', () => {
        const context = {
            title: 'Prompt 工程指南',
            summary: '解释如何让文章配图承担说明任务。',
            language: 'zh-CN',
        }

        const suggestion = parseVisualPromptSuggestion(
            'there is no structured json payload here',
            'post-illustration',
            'manual-confirm',
            context,
        )

        expect(suggestion.dimensions).toEqual(extractVisualPromptDimensions(resolveVisualPromptDimensions(
            'post-illustration',
            context,
            {
                type: undefined,
                palette: undefined,
                rendering: undefined,
                text: undefined,
                mood: undefined,
            },
            'ai',
        )))
        expect(suggestion.prompt).toContain('Create a post-illustration visual asset')
    })
})
