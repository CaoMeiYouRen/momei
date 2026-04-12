import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('getRouterParam', vi.fn())

import { getRequiredRouterParam } from './router'

describe('getRequiredRouterParam', () => {
    it('returns existing route param', () => {
        vi.mocked(getRouterParam).mockReturnValue('post-1')

        expect(getRequiredRouterParam({} as never, 'id')).toBe('post-1')
    })

    it('throws 400 when route param is missing', () => {
        vi.mocked(getRouterParam).mockReturnValue('')

        expect(() => getRequiredRouterParam({} as never, 'slug')).toThrow(/SLUG is required/)
    })
})
