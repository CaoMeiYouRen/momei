import { describe, expect, it } from 'vitest'
import { createPostTagBinding, syncPostTagBindings } from './post-tag-bindings'

describe('post-tag-bindings', () => {
    it('应该基于源标签生成翻译绑定', () => {
        const binding = createPostTagBinding({
            name: 'Translated Tag',
            source: {
                id: 'source-tag-id',
                name: '源标签',
                slug: 'source-tag',
                translationId: 'shared-tag-cluster',
            },
        })

        expect(binding).toEqual({
            name: 'Translated Tag',
            translationId: 'shared-tag-cluster',
            sourceTagSlug: 'source-tag',
            sourceTagId: 'source-tag-id',
        })
    })

    it('应该在手动输入现有标签时补齐翻译簇信息', () => {
        const bindings = syncPostTagBindings(
            ['Existing Target', 'Manual Tag'],
            [],
            [{
                id: 'target-tag-id',
                name: 'Existing Target',
                slug: 'existing-target',
                translationId: 'existing-cluster',
            }],
        )

        expect(bindings).toEqual([
            {
                name: 'Existing Target',
                translationId: 'existing-cluster',
                sourceTagSlug: 'existing-target',
                sourceTagId: 'target-tag-id',
            },
            {
                name: 'Manual Tag',
            },
        ])
    })

    it('应该在名称未变化时保留既有翻译绑定', () => {
        const bindings = syncPostTagBindings(
            ['AI Generated Tag'],
            [{
                name: 'AI Generated Tag',
                translationId: 'source-cluster',
                sourceTagSlug: 'source-tag',
                sourceTagId: 'source-tag-id',
            }],
            [{
                id: 'different-target-id',
                name: 'AI Generated Tag',
                slug: 'different-target',
                translationId: 'different-cluster',
            }],
        )

        expect(bindings).toEqual([
            {
                name: 'AI Generated Tag',
                translationId: 'source-cluster',
                sourceTagSlug: 'source-tag',
                sourceTagId: 'source-tag-id',
            },
        ])
    })
})
