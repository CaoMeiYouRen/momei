import { describe, expect, it } from 'vitest'
import { extractTagNames } from './utils'

describe('extractTagNames', () => {
    it('should extract string tags', () => {
        const result = extractTagNames({ tags: ['vue', 'typescript', 'nuxt'] })
        expect(result).toEqual(['vue', 'typescript', 'nuxt'])
    })

    it('should extract object tags with name property', () => {
        const result = extractTagNames({
            tags: [
                { name: 'vue' },
                { name: 'typescript' },
            ],
        })
        expect(result).toEqual(['vue', 'typescript'])
    })

    it('should handle mixed string and object tags', () => {
        const result = extractTagNames({
            tags: [
                'vue',
                { name: 'typescript' },
                null,
                { name: 'nuxt' },
            ],
        })
        expect(result).toEqual(['vue', 'typescript', 'nuxt'])
    })

    it('should return empty array for non-array tags', () => {
        expect(extractTagNames({})).toEqual([])
        expect(extractTagNames({ tags: 'string' })).toEqual([])
        expect(extractTagNames({ tags: null })).toEqual([])
    })

    it('should filter out nulls from object tags', () => {
        const result = extractTagNames({
            tags: [
                { name: 'vue' },
                { name: null },
                { noName: true },
            ],
        })
        expect(result).toEqual(['vue'])
    })
})
