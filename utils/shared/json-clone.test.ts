import { describe, expect, it } from 'vitest'
import { cloneJsonValue } from './json-clone'

describe('json-clone utils', () => {
    it('returns nullish values unchanged', () => {
        expect(cloneJsonValue(null)).toBeNull()
        expect(cloneJsonValue(undefined)).toBeUndefined()
    })

    it('clones nested JSON-compatible payloads', () => {
        const source = {
            profile: {
                name: 'momei',
                tags: ['governance'],
            },
        }

        const cloned = cloneJsonValue(source)
        expect(cloned).toEqual(source)
        expect(cloned).not.toBe(source)
        expect(cloned.profile).not.toBe(source.profile)
        expect(cloned.profile.tags).not.toBe(source.profile.tags)
    })
})
